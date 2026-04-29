const asString = (v) => (typeof v === 'string' ? v : '');
const clamp = (v, max) => (v.length > max ? v.slice(0, max) : v);
const getIp = (req) => {
    const raw = req.headers?.['x-forwarded-for'];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value)
        return 'unknown';
    return value.split(',')[0]?.trim() || 'unknown';
};
const allow = (key, limit, windowMs) => {
    const now = Date.now();
    const g = globalThis;
    if (!g.__rl)
        g.__rl = new Map();
    const entry = g.__rl.get(key);
    if (!entry || now > entry.resetAt) {
        g.__rl.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }
    if (entry.count >= limit)
        return false;
    entry.count += 1;
    return true;
};
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
const validateSupabaseEnv = (supabaseUrl, serviceKey) => {
    if (!supabaseUrl || !serviceKey)
        return 'Supabase is not configured';
    if (!/^https?:\/\//i.test(supabaseUrl)) {
        return 'SUPABASE_URL is invalid. It must be the Supabase Project URL (https://xxxxx.supabase.co). You likely pasted a key by mistake.';
    }
    if (serviceKey.startsWith('sb_publishable_')) {
        return 'SUPABASE_SERVICE_ROLE_KEY is wrong. You pasted the publishable (public) key. It must be the secret key that starts with sb_secret_.';
    }
    if (/^https?:\/\//i.test(serviceKey)) {
        return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It must be the secret/service role key, not a URL.';
    }
    if (/\s/.test(serviceKey)) {
        return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It contains whitespace/new lines. Paste the key as a single line.';
    }
    return '';
};
const adminAuthHeaders = (adminKey) => {
    const key = adminKey.trim();
    const isJwtLike = key.startsWith('eyJ') && key.split('.').length === 3;
    const isSbSecret = key.startsWith('sb_secret_');
    return (isJwtLike || isSbSecret)
        ? { apikey: key, Authorization: `Bearer ${key}` }
        : { apikey: key };
};
export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const ip = getIp(req);
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const envErr = validateSupabaseEnv(supabaseUrl, serviceKey);
        if (envErr) {
            res.status(500).json({ error: envErr });
            return;
        }
        const base = supabaseUrl.replace(/\/$/, '');
        const adminKey = serviceKey;
        const adminHeaders = adminAuthHeaders(adminKey);
        const body = (req.body && typeof req.body === 'object') ? req.body : {};
        const sourceRaw = asString(body.source).trim() || 'public';
        const source = (sourceRaw === 'agency' || sourceRaw === 'public') ? sourceRaw : 'public';
        if (!allow(`apply:${source}:${ip}`, source === 'public' ? 10 : 30, 60_000)) {
            res.status(429).json({ error: 'Too many requests' });
            return;
        }
        let agencyId = asString(body.agencyId).trim() || undefined;
        if (source === 'agency') {
            const token = getBearer(req);
            if (!token) {
                res.status(401).json({ error: 'Missing token' });
                return;
            }
            const who = await fetchJson(`${base}/auth/v1/user`, {
                method: 'GET',
                headers: { apikey: adminKey, Authorization: `Bearer ${token}` },
            });
            if (!who.ok || !who.json || typeof who.json.id !== 'string') {
                res.status(401).json({ error: 'Invalid token' });
                return;
            }
            const callerId = who.json.id;
            const callerProfile = await fetchJson(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(callerId)}&select=role&limit=1`, {
                method: 'GET',
                headers: adminHeaders,
            });
            const callerRole = Array.isArray(callerProfile.json) && callerProfile.json[0] && typeof callerProfile.json[0].role === 'string'
                ? callerProfile.json[0].role
                : '';
            if (callerRole !== 'agency') {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            agencyId = callerId;
        }
        const appId = String(Date.now());
        const now = new Date().toISOString();
        const app = {
            id: appId,
            studentId: null,
            name: clamp(asString(body.name), 120),
            email: clamp(asString(body.email), 254),
            phone: clamp(asString(body.phone), 40),
            country: clamp(asString(body.country), 80),
            program: clamp(asString(body.program), 120),
            university: clamp(asString(body.university), 80) || null,
            status: 'submitted',
            stage: 'applied',
            createdAt: clamp(asString(body.createdAt), 40) || now,
            internalNotes: body.internalNotes ?? null,
            events: body.events ?? [{ id: `${appId}-submitted`, type: 'submitted', byId: agencyId ?? null, byName: source === 'agency' ? 'Agency' : 'Website', time: now, details: source === 'agency' ? 'Agency submission' : 'Public submission' }],
            hold: null,
            approvedBy: null,
            approvedAt: null,
            ownerId: null,
            salesOwnerId: null,
            assignedStaffId: null,
            source,
            agencyId: agencyId ?? null,
            contactEmail: clamp(asString(body.contactEmail), 254) || null,
            studentEmail: clamp(asString(body.studentEmail), 254) || null,
            intakeDetails: clamp(asString(body.intakeDetails), 20_000) || null,
            intakeAttachments: Array.isArray(body.intakeAttachments) ? body.intakeAttachments : null,
            intakeVideoUrl: clamp(asString(body.intakeVideoUrl), 2000) || null,
            intakePassportCopy: clamp(asString(body.intakePassportCopy), 2000) || null,
            intakeHighSchoolCertificate: clamp(asString(body.intakeHighSchoolCertificate), 2000) || null,
            intakeSLARewarded: Boolean(body.intakeSLARewarded),
            arrived: Boolean(body.arrived),
            intakeExtraDocs: Array.isArray(body.intakeExtraDocs) ? body.intakeExtraDocs : null,
        };
        const stateResp = await fetchJson(`${base}/rest/v1/app_state?org_id=eq.default&select=state&limit=1`, {
            method: 'GET',
            headers: adminHeaders,
        });
        if (!stateResp.ok) {
            const details = (stateResp.text || '').trim();
            res.status(500).json({
                error: details ? `Failed to load state (${stateResp.status}): ${details}` : `Failed to load state (${stateResp.status})`,
                details: details || undefined,
            });
            return;
        }
        const currentState = Array.isArray(stateResp.json) && stateResp.json[0] && typeof stateResp.json[0].state === 'object'
            ? stateResp.json[0].state
            : {};
        const existingApps = Array.isArray(currentState.applications) ? currentState.applications : [];
        const emailKey = source === 'agency'
            ? (typeof app.studentEmail === 'string' && app.studentEmail ? app.studentEmail : app.email)
            : app.email;
        if (emailKey) {
            const dup = existingApps.some((row) => {
                if (!row || typeof row !== 'object')
                    return false;
                const r = row;
                const status = typeof r.status === 'string' ? r.status : '';
                if (status === 'rejected')
                    return false;
                const aEmail = typeof r.email === 'string' ? r.email : '';
                const aStudentEmail = typeof r.studentEmail === 'string' ? r.studentEmail : '';
                return (aStudentEmail || aEmail) === emailKey;
            });
            if (dup) {
                res.status(409).json({ error: 'Duplicate application detected for this email' });
                return;
            }
        }
        const applications = Array.isArray(currentState.applications) ? [...currentState.applications, app] : [app];
        const notifications = Array.isArray(currentState.notifications) ? currentState.notifications : [];
        const nextState = { ...currentState, applications, notifications };
        const upserted = await fetchJson(`${base}/rest/v1/app_state`, {
            method: 'POST',
            headers: { ...adminHeaders, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
            body: JSON.stringify({ org_id: 'default', state: nextState, updated_at: now, updated_by: agencyId ?? null }),
        });
        if (!upserted.ok) {
            const details = (upserted.text || '').trim();
            res.status(500).json({
                error: details ? `Failed to save application (${upserted.status}): ${details}` : `Failed to save application (${upserted.status})`,
                details: details || undefined,
            });
            return;
        }
        res.status(200).json({ id: appId });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}
