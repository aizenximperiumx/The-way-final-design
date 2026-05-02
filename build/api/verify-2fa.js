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
const getForcedInternal2faCode = () => {
    const v = process.env.FORCE_INTERNAL_2FA_CODE;
    return typeof v === 'string' ? v.trim() : '';
};
const adminAuthHeaders = (adminKey) => {
    const key = adminKey.trim();
    const isJwtLike = key.startsWith('eyJ') && key.split('.').length === 3;
    const isSbSecret = key.startsWith('sb_secret_');
    return (isJwtLike || isSbSecret) ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
};
export default async function handler(req, res) {
    try {
        res.status(410).json({ error: '2FA is disabled' });
        return;
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
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
        const adminHeaders = adminAuthHeaders(adminKey);
        const ip = getIp(req);
        if (!allow(`verify2fa:${ip}`, 20, 60_000)) {
            res.status(429).json({ error: 'Too many attempts' });
            return;
        }
        const token = getBearer(req);
        if (!token) {
            res.status(401).json({ error: 'Missing token' });
            return;
        }
        const body = (req.body && typeof req.body === 'object') ? req.body : {};
        const code = asString(body.code).trim();
        if (!code || code.length < 4 || code.length > 12) {
            res.status(400).json({ error: 'Invalid code' });
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
        const userId = who.json.id;
        const profile = await fetchJson(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=two_factor_code,role`, {
            method: 'GET',
            headers: adminHeaders,
        });
        const row = Array.isArray(profile.json) ? profile.json[0] : null;
        const stored = row && typeof row.two_factor_code === 'string' ? row.two_factor_code : '';
        const role = row && typeof row.role === 'string' ? row.role : '';
        if (role === 'student') {
            res.status(400).json({ error: 'Students do not require 2FA' });
            return;
        }
        const forced = getForcedInternal2faCode();
        const expected = forced && role ? forced : stored;
        if (!expected || code !== expected) {
            res.status(401).json({ ok: false });
            return;
        }
        res.status(200).json({ ok: true });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}
