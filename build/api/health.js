const fetchText = async (url, init) => {
    const resp = await fetch(url, init);
    const text = await resp.text();
    return { ok: resp.ok, status: resp.status, text };
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
const getBearer = (req) => {
    const raw = req.headers?.authorization || req.headers?.Authorization;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value)
        return '';
    const m = value.match(/^Bearer\s+(.+)$/i);
    return m?.[1] ?? '';
};
const validateSupabaseEnv = (supabaseUrl, serviceKey) => {
    if (!supabaseUrl || !serviceKey)
        return 'Supabase is not configured';
    if (!/^https?:\/\//i.test(supabaseUrl)) {
        return 'SUPABASE_URL is invalid. It must be the Supabase Project URL (https://xxxxx.supabase.co). You likely pasted a key by mistake.';
    }
    if (/^https?:\/\//i.test(serviceKey)) {
        return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It must be the Supabase service role key.';
    }
    return '';
};
export default async function handler(req, res) {
    try {
        if (req.method !== 'GET') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const supabaseUrl = process.env.SUPABASE_URL || '';
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        const bucket = process.env.SUPABASE_STORAGE_BUCKET || '';
        const resend = process.env.RESEND_API_KEY || '';
        const token = getBearer(req);
        if (!token) {
            res.status(401).json({ error: 'Missing token' });
            return;
        }
        const envError = validateSupabaseEnv(supabaseUrl, serviceKey);
        if (envError) {
            const checks = [];
            checks.push({ name: 'SUPABASE_URL', ok: /^https?:\/\//i.test(supabaseUrl) });
            checks.push({ name: 'SUPABASE_SERVICE_ROLE_KEY', ok: Boolean(serviceKey) && !/^https?:\/\//i.test(serviceKey) });
            checks.push({ name: 'SUPABASE_STORAGE_BUCKET', ok: Boolean(bucket) });
            checks.push({ name: 'RESEND_API_KEY', ok: Boolean(resend) });
            res.status(500).json({ ok: false, error: envError, checks });
            return;
        }
        const base = supabaseUrl.replace(/\/$/, '');
        const who = await fetchJson(`${base}/auth/v1/user`, {
            method: 'GET',
            headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
        });
        if (!who.ok || !who.json || typeof who.json.id !== 'string') {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        const callerId = who.json.id;
        const callerProfile = await fetchJson(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(callerId)}&select=role`, {
            method: 'GET',
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        });
        const callerRole = Array.isArray(callerProfile.json) && callerProfile.json[0] && typeof callerProfile.json[0].role === 'string'
            ? callerProfile.json[0].role
            : '';
        if (callerRole !== 'ceo') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const checks = [];
        checks.push({ name: 'SUPABASE_URL', ok: Boolean(supabaseUrl) });
        checks.push({ name: 'SUPABASE_SERVICE_ROLE_KEY', ok: Boolean(serviceKey) });
        checks.push({ name: 'SUPABASE_STORAGE_BUCKET', ok: Boolean(bucket) });
        checks.push({ name: 'RESEND_API_KEY', ok: Boolean(resend) });
        if (supabaseUrl && serviceKey) {
            const pingProfiles = await fetchText(`${base}/rest/v1/profiles?select=id&limit=1`, {
                method: 'GET',
                headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
            });
            checks.push({ name: 'DB:profiles', ok: pingProfiles.ok, details: pingProfiles.ok ? undefined : pingProfiles.text.slice(0, 200) });
            const pingState = await fetchText(`${base}/rest/v1/app_state?select=org_id&org_id=eq.default&limit=1`, {
                method: 'GET',
                headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
            });
            checks.push({ name: 'DB:app_state', ok: pingState.ok, details: pingState.ok ? undefined : pingState.text.slice(0, 200) });
            if (bucket) {
                const pingStorage = await fetchText(`${base}/storage/v1/bucket/${encodeURIComponent(bucket)}`, {
                    method: 'GET',
                    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
                });
                checks.push({ name: 'Storage:bucket', ok: pingStorage.ok, details: pingStorage.ok ? undefined : pingStorage.text.slice(0, 200) });
            }
        }
        const ok = checks.every(c => c.ok);
        res.status(ok ? 200 : 500).json({ ok, checks });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ ok: false, error: message });
    }
}
