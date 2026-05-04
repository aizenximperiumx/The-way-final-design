import { randomBytes } from 'crypto';
const asString = (v) => (typeof v === 'string' ? v : '');
const getHeader = (req, name) => {
    const target = name.toLowerCase();
    const headers = req.headers || {};
    const foundKey = Object.keys(headers).find(k => k.toLowerCase() === target);
    const raw = foundKey ? headers[foundKey] : undefined;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return typeof value === 'string' ? value : '';
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
const sendResend = async (apiKey, to, subject, html, text) => {
    const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            from: 'The Way <no-reply@theway.ge>',
            to: [to],
            subject,
            html,
            text,
        }),
    });
    if (!resp.ok) {
        const details = await resp.text();
        throw new Error(details || 'Failed to send email');
    }
};
const randomPassword = () => {
    const buf = randomBytes(16).toString('base64url');
    return `Tw-${buf}`;
};
const validateSupabaseEnv = (supabaseUrl, serviceKey) => {
    if (!supabaseUrl || !serviceKey)
        return 'Supabase admin is not configured';
    if (!/^https?:\/\//i.test(supabaseUrl)) {
        return 'SUPABASE_URL is invalid. It must be the Supabase Project URL (https://xxxxx.supabase.co). You likely pasted a key by mistake.';
    }
    if (serviceKey.startsWith('sb_publishable_')) {
        return 'SUPABASE_SERVICE_ROLE_KEY is wrong. You pasted the publishable (public) key. It must be the secret key.';
    }
    if (/^https?:\/\//i.test(serviceKey)) {
        return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It must be the Supabase service role key.';
    }
    if (/\s/.test(serviceKey)) {
        return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It contains whitespace/new lines. Paste the key as a single line.';
    }
    return '';
};
const getForcedInternal2faCode = () => {
    const v = process.env.FORCE_INTERNAL_2FA_CODE;
    return typeof v === 'string' ? v.trim() : '';
};
const authAdminHeaders = (adminKey) => {
    const key = adminKey.trim();
    if (!key)
        return {};
    return { apikey: key, Authorization: `Bearer ${key}` };
};
const postgrestHeaderCandidates = (adminKey) => {
    const key = adminKey.trim();
    if (!key)
        return [{}];
    const isJwtLike = key.startsWith('eyJ') && key.split('.').length === 3;
    const isSbSecret = key.startsWith('sb_secret_');
    if (isJwtLike)
        return [{ apikey: key, Authorization: `Bearer ${key}` }];
    if (isSbSecret)
        return [{ apikey: key }, { apikey: key, Authorization: `Bearer ${key}` }];
    return [{ apikey: key }];
};
const fetchPostgrest = async (candidates, url, init) => {
    let last = await fetchJson(url, { ...init, headers: { ...(init.headers ?? {}), ...(candidates[0] ?? {}) } });
    for (let i = 1; i < candidates.length; i += 1) {
        if (last.ok)
            return last;
        if (last.status !== 401 && last.status !== 403)
            return last;
        last = await fetchJson(url, { ...init, headers: { ...(init.headers ?? {}), ...(candidates[i] ?? {}) } });
    }
    return last;
};
const getRoleFromProfiles = async (base, pgCandidates, userId) => {
    const r = await fetchPostgrest(pgCandidates, `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role&limit=1`, { method: 'GET' });
    const role = (r.ok && Array.isArray(r.json) && r.json[0] && typeof r.json[0] === 'object' && typeof r.json[0].role === 'string')
        ? String(r.json[0].role).trim().toLowerCase()
        : '';
    return role;
};
const ensureSingleProfileRow = async (base, pgCandidates, userId, patch) => {
    const read = await fetchPostgrest(pgCandidates, `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id&limit=1`, { method: 'GET' });
    if (read.ok && Array.isArray(read.json) && read.json.length > 0) {
        return fetchPostgrest(pgCandidates, `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
            body: JSON.stringify(patch),
        });
    }
    return fetchPostgrest(pgCandidates, `${base}/rest/v1/profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ id: userId, ...patch }),
    });
};
export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
        const resendKey = process.env.RESEND_API_KEY;
        const envError = validateSupabaseEnv(supabaseUrl, serviceKey);
        if (envError) {
            res.status(500).json({ error: envError });
            return;
        }
        const base = supabaseUrl.replace(/\/$/, '');
        const adminKey = String(serviceKey || '').trim();
        const pgCandidates = postgrestHeaderCandidates(adminKey);
        const authHeaders = authAdminHeaders(adminKey);
        const bootstrapSecret = process.env.BOOTSTRAP_SECRET || '';
        const bootstrapProvided = getHeader(req, 'x-bootstrap-secret').trim();
        const isBootstrap = Boolean(bootstrapSecret && bootstrapProvided && bootstrapProvided === bootstrapSecret);
        if (!isBootstrap) {
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
            const appMeta = who.json.app_metadata && typeof who.json.app_metadata === 'object' ? who.json.app_metadata : null;
            const callerId = who.json.id;
            const callerRole = appMeta && typeof appMeta.role === 'string'
                ? String(appMeta.role).trim().toLowerCase()
                : await getRoleFromProfiles(base, pgCandidates, callerId);
            if (callerRole !== 'ceo') {
                res.status(403).json({ error: 'Forbidden. Your account is not provisioned as CEO. Log out/in after provisioning, or run bootstrap-fix-auth for your email.' });
                return;
            }
        }
        else {
            const existingCeo = await fetchPostgrest(pgCandidates, `${base}/rest/v1/profiles?role=eq.ceo&select=id&limit=1`, { method: 'GET' });
            if (existingCeo.ok && Array.isArray(existingCeo.json) && existingCeo.json.length > 0) {
                res.status(403).json({ error: 'Bootstrap is disabled after CEO exists' });
                return;
            }
        }
        const body = (req.body && typeof req.body === 'object') ? req.body : {};
        const email = asString(body.email).trim();
        const passwordIn = asString(body.password);
        const usernameIn = asString(body.username).trim();
        const role = asString(body.role).trim();
        const name = asString(body.name).trim();
        void asString(body.phone).trim();
        const allowedRoles = new Set(['ceo', 'sales', 'ops', 'staff', 'agency_staff', 'agency']);
        if (!email || !role || !name) {
            res.status(400).json({ error: 'Missing fields' });
            return;
        }
        if (!allowedRoles.has(role)) {
            res.status(400).json({ error: 'Invalid role' });
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            res.status(400).json({ error: 'Invalid email' });
            return;
        }
        const password = passwordIn || randomPassword();
        const usernameBase = (usernameIn || role).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 10) || 'user';
        let username = usernameIn || `${usernameBase}${Math.floor(100 + Math.random() * 900)}`;
        for (let i = 0; i < 6; i++) {
            const check = await fetchPostgrest(pgCandidates, `${base}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=id&limit=1`, { method: 'GET' });
            if (check.ok && Array.isArray(check.json) && check.json.length === 0)
                break;
            username = `${usernameBase}${Math.floor(100 + Math.random() * 900)}${i}`;
        }
        void getForcedInternal2faCode();
        const created = await fetchJson(`${base}/auth/v1/admin/users`, {
            method: 'POST',
            headers: { ...authHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, email_confirm: true, app_metadata: { role, username }, user_metadata: { username, name } }),
        });
        if (!created.ok || !created.json || typeof created.json.id !== 'string') {
            const t = created.text || '';
            if (t.includes('users_email_partial_key') || t.includes('"code":"23505"') || t.toLowerCase().includes('duplicate')) {
                res.status(409).json({ error: 'Email already exists' });
                return;
            }
            res.status(500).json({ error: 'Failed to create auth user', details: t });
            return;
        }
        const id = created.json.id;
        const inserted = await ensureSingleProfileRow(base, pgCandidates, id, { username, role, name });
        if (!inserted.ok) {
            res.status(500).json({ error: 'Failed to create profile', details: inserted.text });
            return;
        }
        void fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { ...authHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ app_metadata: { role, username }, user_metadata: { username, name } }),
        });
        let emailSent = false;
        let emailWarning = '';
        if (resendKey) {
            const html = `
        <div style="font-family:Arial,sans-serif">
          <h2 style="margin:0 0 12px">Your account is ready</h2>
          <p><b>Username:</b> ${username}<br/><b>Password:</b> ${password}</p>
        </div>`;
            const text = `Username: ${username}\nPassword: ${password}`;
            try {
                await sendResend(resendKey, email, 'Your account credentials', html, text);
                emailSent = true;
            }
            catch (e) {
                emailWarning = e instanceof Error ? e.message : 'Failed to send email';
            }
        }
        res.status(200).json({
            id,
            email,
            username,
            role,
            name,
            emailSent,
            ...(emailWarning ? { warning: 'Email not sent', emailError: emailWarning.slice(0, 300) } : {}),
            ...(!emailSent ? { password } : {}),
        });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}
