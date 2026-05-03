const asString = (v) => (typeof v === 'string' ? v : '');
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
const validateSupabaseEnv = (supabaseUrl, serviceKey) => {
    if (!supabaseUrl || !serviceKey)
        return 'Supabase is not configured';
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
export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const ip = getIp(req);
        if (!allow(`lookup-email:${ip}`, 30, 60_000)) {
            res.status(429).json({ error: 'Too many requests' });
            return;
        }
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
        const envError = validateSupabaseEnv(supabaseUrl, serviceKey);
        if (envError) {
            res.status(500).json({ error: envError });
            return;
        }
        const base = supabaseUrl.replace(/\/$/, '');
        const adminKey = String(serviceKey || '').trim();
        const pgHeaders = postgrestHeaders(adminKey);
        const authHeaders = authAdminHeaders(adminKey);
        const body = (req.body && typeof req.body === 'object') ? req.body : {};
        const username = asString(body.username).trim();
        if (!username) {
            res.status(400).json({ error: 'Missing username' });
            return;
        }
        const readProfileByUsername = async (operator) => {
            const q = `${base}/rest/v1/profiles?username=${operator}.${encodeURIComponent(username)}&select=id&limit=1`;
            const r = await fetchJson(q, { method: 'GET', headers: pgHeaders });
            if (!r.ok || !Array.isArray(r.json) || !r.json[0] || typeof r.json[0] !== 'object')
                return null;
            const row = r.json[0];
            const id = typeof row.id === 'string' ? row.id : '';
            return { id };
        };
        const profile = (await readProfileByUsername('eq')) ?? (await readProfileByUsername('ilike'));
        if (!profile || !profile.id) {
            res.status(200).json({ email: '' });
            return;
        }
        const authUser = await fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(profile.id)}`, {
            method: 'GET',
            headers: authHeaders,
        });
        const authEmail = (authUser.ok && authUser.json && typeof authUser.json === 'object' && typeof authUser.json.email === 'string')
            ? String(authUser.json.email)
            : '';
        if (!authEmail) {
            res.status(500).json({
                error: 'User exists but could not read email from Supabase Auth. Make sure SUPABASE_SERVICE_ROLE_KEY is correct.',
            });
            return;
        }
        res.status(200).json({ email: authEmail });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}
