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
    if (!/^https?:\/\//i.test(supabaseUrl))
        return 'SUPABASE_URL is invalid';
    if (serviceKey.startsWith('sb_publishable_'))
        return 'SUPABASE_SERVICE_ROLE_KEY is wrong — use the JWT service role key';
    if (/^https?:\/\//i.test(serviceKey))
        return 'SUPABASE_SERVICE_ROLE_KEY is invalid';
    if (/\s/.test(serviceKey))
        return 'SUPABASE_SERVICE_ROLE_KEY contains whitespace';
    return '';
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
const safeString = (v) => (typeof v === 'string' ? v : '');
export default async function handler(req, res) {
    try {
        if (req.method !== 'GET') {
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
        const base = String(supabaseUrl).replace(/\/$/, '');
        const adminKey = String(serviceKey).trim();
        const pgCandidates = postgrestHeaderCandidates(adminKey);
        const token = getBearer(req);
        if (!token) {
            res.status(401).json({ error: 'Missing token' });
            return;
        }
        // Verify the session token and get the auth user
        const who = await fetchJson(`${base}/auth/v1/user`, {
            method: 'GET',
            headers: { apikey: adminKey, Authorization: `Bearer ${token}` },
        });
        if (!who.ok || !who.json || typeof who.json.id !== 'string') {
            res.status(401).json({ error: 'Invalid or expired session token' });
            return;
        }
        const authUser = who.json;
        const userId = safeString(authUser.id);
        const email = safeString(authUser.email);
        // Read profile row from database
        const profileResp = await fetchPostgrest(pgCandidates, `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,username,role,name,email,phone,createdAt,points,staffUniversities,assignedUniversityId,passportExpiry,visaExpiry,residenceExpiry&limit=1`, { method: 'GET' });
        if (!profileResp.ok || !Array.isArray(profileResp.json) || profileResp.json.length === 0) {
            // Profile row missing — try to infer role from app_metadata and create on the fly
            const appMeta = authUser.app_metadata && typeof authUser.app_metadata === 'object'
                ? authUser.app_metadata
                : null;
            const metaRole = appMeta && typeof appMeta.role === 'string' ? safeString(appMeta.role) : 'student';
            const metaUsername = appMeta && typeof appMeta.username === 'string' ? safeString(appMeta.username) : '';
            const userMeta = authUser.user_metadata && typeof authUser.user_metadata === 'object'
                ? authUser.user_metadata
                : null;
            const metaName = (appMeta && typeof appMeta.name === 'string' ? safeString(appMeta.name) : '')
                || (userMeta && typeof userMeta.name === 'string' ? safeString(userMeta.name) : '');
            res.status(200).json({
                user: { id: userId, username: metaUsername, role: metaRole, name: metaName, email },
            });
            return;
        }
        const row = profileResp.json[0];
        res.status(200).json({
            user: {
                id: userId,
                username: safeString(row.username),
                role: safeString(row.role) || 'student',
                name: safeString(row.name),
                email: safeString(row.email) || email,
                phone: safeString(row.phone) || undefined,
                createdAt: safeString(row.createdAt) || undefined,
                points: typeof row.points === 'number' ? row.points : 0,
                staffUniversities: Array.isArray(row.staffUniversities) ? row.staffUniversities.map(String) : undefined,
                assignedUniversityId: safeString(row.assignedUniversityId) || undefined,
                passportExpiry: safeString(row.passportExpiry) || undefined,
                visaExpiry: safeString(row.visaExpiry) || undefined,
                residenceExpiry: safeString(row.residenceExpiry) || undefined,
            },
        });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}
