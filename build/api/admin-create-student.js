const asString = (v) => (typeof v === 'string' ? v : '');
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
const authAdminHeaders = (adminKey) => {
    const key = adminKey.trim();
    if (!key)
        return {};
    return { apikey: key, Authorization: `Bearer ${key}` };
};
const postgrestHeaders = (adminKey) => {
    const key = adminKey.trim();
    if (!key)
        return {};
    const isJwtLike = key.startsWith('eyJ') && key.split('.').length === 3;
    return isJwtLike ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
};
const ensureSingleProfileRow = async (base, pgHeaders, userId, patch) => {
    const read = await fetchJson(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id&limit=1`, {
        method: 'GET',
        headers: pgHeaders,
    });
    if (read.ok && Array.isArray(read.json) && read.json.length > 0) {
        return fetchJson(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
            method: 'PATCH',
            headers: { ...pgHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
            body: JSON.stringify(patch),
        });
    }
    return fetchJson(`${base}/rest/v1/profiles`, {
        method: 'POST',
        headers: { ...pgHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
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
        const pgHeaders = postgrestHeaders(adminKey);
        const authHeaders = authAdminHeaders(adminKey);
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
        const callerAuth = await fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(callerId)}`, {
            method: 'GET',
            headers: authHeaders,
        });
        const callerMeta = (callerAuth.ok && callerAuth.json && typeof callerAuth.json === 'object' && callerAuth.json.user_metadata && typeof callerAuth.json.user_metadata === 'object')
            ? callerAuth.json.user_metadata
            : null;
        const callerRole = callerMeta && typeof callerMeta.role === 'string' ? callerMeta.role : '';
        if (!['sales', 'ops', 'ceo'].includes(callerRole)) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const body = (req.body && typeof req.body === 'object') ? req.body : {};
        const email = asString(body.email).trim();
        const password = asString(body.password);
        const username = asString(body.username).trim();
        const name = asString(body.name).trim();
        void asString(body.phone).trim();
        if (!email || !password || !username || !name) {
            res.status(400).json({ error: 'Missing fields' });
            return;
        }
        const created = await fetchJson(`${base}/auth/v1/admin/users`, {
            method: 'POST',
            headers: { ...authHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { role: 'student', username, name } }),
        });
        if (!created.ok || !created.json || typeof created.json.id !== 'string') {
            res.status(500).json({ error: 'Failed to create auth user', details: created.text });
            return;
        }
        const id = created.json.id;
        const inserted = await ensureSingleProfileRow(base, pgHeaders, id, { username, role: 'student', name });
        if (!inserted.ok) {
            res.status(500).json({ error: 'Failed to create profile', details: inserted.text });
            return;
        }
        void fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { ...authHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_metadata: { role: 'student', username, name } }),
        });
        const html = `
      <div style="font-family:Arial,sans-serif">
        <h2 style="margin:0 0 12px">Welcome to The Way</h2>
        <p>Your student account has been created. Use these credentials:</p>
        <p><b>Username:</b> ${username}<br/><b>Password:</b> ${password}</p>
      </div>`;
        const text = `Username: ${username}\nPassword: ${password}`;
        if (resendKey) {
            await sendResend(resendKey, email, 'Your The Way student account', html, text);
        }
        res.status(200).json({ id, email, username, name, emailSent: Boolean(resendKey) });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}
