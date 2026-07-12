// ─────────────────────────────────────────────────────────────────────────────
// Weekly CEO digest — a Monday-morning summary email of the whole operation:
// new applications, approvals, closed cases, overdue stages, staff points and
// student ratings from the last 7 days.
//
// server.mjs checks hourly and sends every Monday from 08:00 Tbilisi time
// (04:00 UTC); the HTTP handler lets the CEO trigger one manually.
// Last-sent marker lives in app_state.digestMeta (preserved by state-save).
// ─────────────────────────────────────────────────────────────────────────────
import { DEFAULT_SLA_GROUPS, STAGE_LABELS, getSlaWindow } from './sla-evaluate.js';
import { renderEmail } from './_email-template.js';
const getBearer = (req) => {
    const raw = req.headers?.authorization || req.headers?.Authorization;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value)
        return '';
    const m = value.match(/^Bearer\s+(.+)$/i);
    return m?.[1] ?? '';
};
const fetchJson = async (url, init) => {
    const resp = await fetch(url, init);
    const text = await resp.text();
    const json = text ? (() => { try {
        return JSON.parse(text);
    }
    catch {
        return null;
    } })() : null;
    return { ok: resp.ok, status: resp.status, text, json };
};
const adminHeaderCandidates = (adminKey) => {
    const key = adminKey.trim();
    const isJwtLike = key.startsWith('eyJ') && key.split('.').length === 3;
    const isSbSecret = key.startsWith('sb_secret_');
    const apiOnly = { apikey: key };
    const apiAndAuth = { apikey: key, Authorization: `Bearer ${key}` };
    if (isJwtLike)
        return [apiAndAuth];
    if (isSbSecret)
        return [apiOnly, apiAndAuth];
    return [apiOnly];
};
const fetchJsonWithAdminHeaders = async (url, init, adminKey) => {
    const candidates = adminHeaderCandidates(adminKey);
    let last = await fetchJson(url, { ...init, headers: { ...(init.headers ?? {}), ...candidates[0] } });
    for (let i = 1; i < candidates.length; i += 1) {
        if (last.ok)
            return last;
        if (last.status !== 401 && last.status !== 403)
            return last;
        last = await fetchJson(url, { ...init, headers: { ...(init.headers ?? {}), ...candidates[i] } });
    }
    return last;
};
const asRecord = (value) => (value && typeof value === 'object') ? value : null;
const getString = (r, key) => (r && typeof r[key] === 'string' ? r[key] : '');
export async function runWeeklyDigest(force = false) {
    const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
    const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();
    const resendKey = String(process.env.RESEND_API_KEY || '').trim();
    if (!supabaseUrl || !serviceKey)
        return { ok: false, sent: 0, error: 'Supabase is not configured' };
    if (!resendKey)
        return { ok: false, sent: 0, error: 'RESEND_API_KEY is not configured' };
    const base = supabaseUrl.replace(/\/$/, '');
    const stateResp = await fetchJsonWithAdminHeaders(`${base}/rest/v1/app_state?org_id=eq.default&select=state&limit=1`, { method: 'GET' }, serviceKey);
    const rawState = Array.isArray(stateResp.json) && stateResp.json[0] ? stateResp.json[0].state : null;
    const state = asRecord(rawState);
    if (!state)
        return { ok: false, sent: 0, error: 'No shared state found' };
    // Schedule guard (unless forced): Mondays from 04:00 UTC (08:00 Tbilisi),
    // at most once every 3 days.
    const digestMeta = asRecord(state.digestMeta) ?? {};
    const lastSentAt = getString(digestMeta, 'lastSentAt');
    const now = new Date();
    if (!force) {
        const isMonday = now.getUTCDay() === 1;
        const hourOk = now.getUTCHours() >= 4;
        const recentlySent = lastSentAt && (now.getTime() - new Date(lastSentAt).getTime()) < 3 * 24 * 3600_000;
        if (!isMonday || !hourOk || recentlySent)
            return { ok: true, sent: 0 };
    }
    const since = new Date(now.getTime() - 7 * 24 * 3600_000);
    const inWeek = (iso) => Boolean(iso) && new Date(iso).getTime() >= since.getTime();
    const applications = Array.isArray(state.applications) ? state.applications.map(asRecord).filter(Boolean) : [];
    const ledger = Array.isArray(state.pointsLedger) ? state.pointsLedger.map(asRecord).filter(Boolean) : [];
    const requests = Array.isArray(state.documentRequests) ? state.documentRequests.map(asRecord).filter(Boolean) : [];
    const config = asRecord(state.universityConfig);
    const configGroups = config ? asRecord(config.slaGroups) : null;
    const newApps = applications.filter(a => inWeek(getString(a, 'createdAt'))).length;
    const approved = applications.filter(a => inWeek(getString(a, 'approvedAt'))).length;
    const closed = applications.filter(a => {
        const p = asRecord(a.pipeline);
        return p && inWeek(getString(p, 'closedAt'));
    }).length;
    // Overdue stages right now.
    const overdue = [];
    for (const a of applications) {
        const p = asRecord(a.pipeline);
        if (!p || getString(p, 'status') !== 'processing')
            continue;
        const stage = getString(p, 'current');
        if (!stage || stage === 'done')
            continue;
        const stages = asRecord(p.stages);
        const track = stages ? asRecord(stages[stage]) : null;
        const startedAt = track ? getString(track, 'startedAt') : '';
        if (!startedAt || (track && getString(track, 'completedAt')))
            continue;
        const uni = getString(a, 'university');
        const groupRaw = (configGroups ? getString(configGroups, uni) : '') || DEFAULT_SLA_GROUPS[uni] || 'none';
        const window_ = getSlaWindow(stage, (['fast', 'medium', 'slow', 'none'].includes(groupRaw) ? groupRaw : 'none'));
        if (!window_)
            continue;
        const deadline = new Date(startedAt).getTime() + window_.halfHours * 3600_000;
        if (now.getTime() > deadline)
            overdue.push(`${getString(a, 'name')} — ${STAGE_LABELS[stage] ?? stage}`);
    }
    // Points this week per user.
    const weekLedger = ledger.filter(e => inWeek(getString(e, 'at')));
    const perUser = new Map();
    for (const e of weekLedger) {
        const uid = getString(e, 'userId');
        const delta = typeof e.delta === 'number' ? e.delta : 0;
        if (uid)
            perUser.set(uid, (perUser.get(uid) ?? 0) + delta);
    }
    // Resolve names for the leaderboard.
    const profilesResp = await fetchJsonWithAdminHeaders(`${base}/rest/v1/profiles?select=id,name,role&limit=5000`, { method: 'GET' }, serviceKey);
    const profiles = Array.isArray(profilesResp.json) ? profilesResp.json.map(asRecord).filter(Boolean) : [];
    const nameOf = (id) => getString(profiles.find(p => getString(p, 'id') === id) ?? null, 'name') || 'Unknown';
    const leaders = [...perUser.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, pts]) => `${nameOf(id)}: ${pts > 0 ? '+' : ''}${pts}`);
    const weekRatings = applications
        .map(a => ({ a, r: asRecord(a.rating) }))
        .filter(x => x.r && inWeek(getString(x.r, 'at')));
    const openRequests = requests.filter(r => ['pending', 'uploaded', 'fulfilled'].includes(getString(r, 'status'))).length;
    const introLines = [
        `New applications: ${newApps}`,
        `Approved: ${approved} · Cases closed: ${closed}`,
        `Overdue stages right now: ${overdue.length}`,
        `Open document requests: ${openRequests}`,
        `Ratings this week: ${weekRatings.length}${weekRatings.length ? ` (${weekRatings.map(x => `${getString(x.r, 'stars') || x.r.stars}` + '★').join(', ')})` : ''}`,
    ];
    const outroParts = [];
    if (leaders.length)
        outroParts.push(`Points this week — ${leaders.join(' · ')}.`);
    if (overdue.length)
        outroParts.push(`Overdue: ${overdue.slice(0, 6).join('; ')}${overdue.length > 6 ? ` and ${overdue.length - 6} more` : ''}.`);
    const { html, text } = renderEmail({
        eyebrow: 'Weekly operations digest',
        title: 'Your week at The Way',
        preheader: `${newApps} new applications · ${closed} closed cases · ${overdue.length} overdue`,
        intro: introLines.join(' — '),
        ctaLabel: 'Open the dashboard',
        ctaUrl: 'https://theway.ge/admin',
        ...(outroParts.length ? { outro: outroParts.join(' ') } : {}),
        note: 'This summary is sent automatically every Monday morning.',
    });
    // CEO recipients: profiles(role=ceo) + emails from the auth admin API.
    const ceoResp = await fetchJsonWithAdminHeaders(`${base}/rest/v1/profiles?role=eq.ceo&select=id`, { method: 'GET' }, serviceKey);
    const ceoIds = Array.isArray(ceoResp.json) ? ceoResp.json.map(r => getString(asRecord(r), 'id')).filter(Boolean) : [];
    let sent = 0;
    for (const id of ceoIds) {
        const u = await fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
            method: 'GET',
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        });
        const email = (u.ok && u.json && typeof u.json === 'object') ? getString(u.json, 'email') : '';
        if (!email)
            continue;
        const resp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
            body: JSON.stringify({
                from: process.env.EMAIL_FROM || 'The Way <no-reply@info.theway.ge>',
                to: [email],
                subject: `Weekly digest — ${newApps} new, ${closed} closed, ${overdue.length} overdue`,
                html,
                text,
            }),
        });
        if (resp.ok)
            sent += 1;
    }
    // Persist the last-sent marker (merged into state, other keys untouched).
    if (sent > 0 || !force) {
        const nextState = { ...state, digestMeta: { lastSentAt: now.toISOString() } };
        if (sent > 0) {
            await fetchJsonWithAdminHeaders(`${base}/rest/v1/app_state`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
                body: JSON.stringify({ org_id: 'default', state: nextState, updated_at: now.toISOString(), updated_by: null }),
            }, serviceKey);
        }
    }
    if (sent > 0)
        console.log(`Weekly digest sent to ${sent} CEO account(s)`);
    return { ok: true, sent };
}
// HTTP trigger — CEO only ("send me the digest now").
export default async function handler(req, res) {
    try {
        const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
        const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();
        if (!supabaseUrl || !serviceKey) {
            res.status(500).json({ error: 'Supabase is not configured' });
            return;
        }
        const base = supabaseUrl.replace(/\/$/, '');
        const token = getBearer(req);
        if (!token) {
            res.status(401).json({ error: 'Missing token' });
            return;
        }
        const who = await fetchJson(`${base}/auth/v1/user`, {
            method: 'GET',
            headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
        });
        if (!who.ok || !who.json || typeof who.json.id !== 'string') {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        const appMeta = asRecord(who.json.app_metadata);
        let role = appMeta ? getString(appMeta, 'role') : '';
        if (!role) {
            const profile = await fetchJsonWithAdminHeaders(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(String(who.json.id))}&select=role&limit=1`, { method: 'GET' }, serviceKey);
            role = Array.isArray(profile.json) && profile.json[0] ? getString(asRecord(profile.json[0]), 'role') : '';
        }
        if (role !== 'ceo') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const result = await runWeeklyDigest(true);
        res.status(result.ok ? 200 : 500).json(result);
    }
    catch (e) {
        res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' });
    }
}
