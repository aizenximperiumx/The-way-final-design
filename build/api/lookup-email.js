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
const adminAuthHeaders = (adminKey) => {
    const key = adminKey.trim();
    const isJwtLike = key.startsWith('eyJ') && key.split('.').length === 3;
    const isSbSecret = key.startsWith('sb_secret_');
    return (isJwtLike || isSbSecret) ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
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
        const adminHeaders = adminAuthHeaders(adminKey);
        const body = (req.body && typeof req.body === 'object') ? req.body : {};
        const username = asString(body.username).trim();
        if (!username) {
            res.status(400).json({ error: 'Missing username' });
            return;
        }
        const readProfileByUsername = async (operator) => {
            const q = `${base}/rest/v1/profiles?username=${operator}.${encodeURIComponent(username)}&select=id,email&limit=1`;
            const r = await fetchJson(q, { method: 'GET', headers: adminHeaders });
            if (!r.ok || !Array.isArray(r.json) || !r.json[0] || typeof r.json[0] !== 'object')
                return null;
            const row = r.json[0];
            const id = typeof row.id === 'string' ? row.id : '';
            const email = typeof row.email === 'string' ? row.email : '';
            return { id, email };
        };
        const profile = (await readProfileByUsername('eq')) ?? (await readProfileByUsername('ilike'));
        if (!profile || !profile.id) {
            res.status(200).json({ email: '' });
            return;
        }
        if (profile.email) {
            res.status(200).json({ email: profile.email });
            return;
        }
        const authUser = await fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(profile.id)}`, {
            method: 'GET',
            headers: adminHeaders,
        });
        const authEmail = (authUser.ok && authUser.json && typeof authUser.json === 'object' && typeof authUser.json.email === 'string')
            ? String(authUser.json.email)
            : '';
        if (!authEmail) {
            res.status(500).json({
                error: 'User exists but email is missing in profiles, and could not read email from Supabase Auth. Make sure SUPABASE_SERVICE_ROLE_KEY is correct, or set profiles.email for this user.',
            });
            return;
        }
        void fetchJson(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(profile.id)}`, {
            method: 'PATCH',
            headers: { ...adminHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
            body: JSON.stringify({ email: authEmail }),
        });
        res.status(200).json({ email: authEmail });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}
