// Registers a device push token for the signed-in user. Tokens live in
// app_state.pushTokens (server-owned — never sent back to clients) and are
// used by api/_push.ts to deliver FCM notifications.
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
export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
        const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();
        if (!supabaseUrl || !serviceKey) {
            res.status(500).json({ error: 'Not configured' });
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
        const userId = who.json.id;
        const body = (req.body && typeof req.body === 'object') ? req.body : {};
        const deviceToken = typeof body.token === 'string' ? body.token.trim().slice(0, 512) : '';
        const platform = typeof body.platform === 'string' ? body.platform.trim().slice(0, 20) : '';
        if (!deviceToken) {
            res.status(400).json({ error: 'Missing token' });
            return;
        }
        const stateResp = await fetchJsonWithAdminHeaders(`${base}/rest/v1/app_state?org_id=eq.default&select=state&limit=1`, { method: 'GET' }, serviceKey);
        const rawState = Array.isArray(stateResp.json) && stateResp.json[0] ? stateResp.json[0].state : null;
        if (!rawState || typeof rawState !== 'object') {
            res.status(500).json({ error: 'No shared state' });
            return;
        }
        const tokensMap = (rawState.pushTokens && typeof rawState.pushTokens === 'object')
            ? { ...rawState.pushTokens }
            : {};
        const mine = Array.isArray(tokensMap[userId]) ? tokensMap[userId].filter(e => e && typeof e.token === 'string') : [];
        const withoutThis = mine.filter(e => e.token !== deviceToken);
        // Newest first, max 5 devices per user.
        tokensMap[userId] = [{ token: deviceToken, platform, at: new Date().toISOString() }, ...withoutThis].slice(0, 5);
        const nextState = { ...rawState, pushTokens: tokensMap };
        const saved = await fetchJsonWithAdminHeaders(`${base}/rest/v1/app_state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
            body: JSON.stringify({ org_id: 'default', state: nextState, updated_at: new Date().toISOString(), updated_by: userId }),
        }, serviceKey);
        if (!saved.ok) {
            res.status(500).json({ error: 'Failed to save token' });
            return;
        }
        res.status(200).json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' });
    }
}
