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
const ensureSingleProfileRow = async (base, candidates, userId, patch) => {
    const read = await fetchPostgrest(candidates, `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id&limit=1`, { method: 'GET' });
    if (read.ok && Array.isArray(read.json) && read.json.length > 0) {
        return fetchPostgrest(candidates, `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
            body: JSON.stringify(patch),
        });
    }
    return fetchPostgrest(candidates, `${base}/rest/v1/profiles`, {
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
        const pgCandidates = postgrestHeaderCandidates(adminKey);
        const authHeaders = authAdminHeaders(adminKey);
        const body = (req.body && typeof req.body === 'object') ? req.body : {};
        const username = asString(body.username).trim();
        if (!username) {
            res.status(400).json({ error: 'Missing username' });
            return;
        }
        if (username.includes('@')) {
            res.status(200).json({ email: username });
            return;
        }
        const readProfileByUsername = async (operator) => {
            const q = `${base}/rest/v1/profiles?username=${operator}.${encodeURIComponent(username)}&select=id&limit=1`;
            const r = await fetchPostgrest(pgCandidates, q, { method: 'GET' });
            if (!r.ok || !Array.isArray(r.json) || !r.json[0] || typeof r.json[0] !== 'object')
                return null;
            const row = r.json[0];
            const id = typeof row.id === 'string' ? row.id : '';
            return { id };
        };
        const usernameLower = username.toLowerCase();
        const findAuthUserByUsername = async () => {
            const perPage = 200;
            for (let page = 1; page <= 10; page += 1) {
                const r = await fetchJson(`${base}/auth/v1/admin/users?page=${page}&per_page=${perPage}`, {
                    method: 'GET',
                    headers: authHeaders,
                });
                if (!r.ok)
                    return null;
                const users = Array.isArray(r.json)
                    ? r.json
                    : (r.json && typeof r.json === 'object' && Array.isArray(r.json.users) ? r.json.users : []);
                if (!Array.isArray(users) || users.length === 0)
                    return null;
                for (const u of users) {
                    const obj = (u && typeof u === 'object') ? u : null;
                    if (!obj)
                        continue;
                    const email = typeof obj.email === 'string' ? obj.email : '';
                    const id = typeof obj.id === 'string' ? obj.id : '';
                    const meta = (obj.user_metadata && typeof obj.user_metadata === 'object') ? obj.user_metadata : null;
                    const metaUsername = meta && typeof meta.username === 'string' ? meta.username : '';
                    if (metaUsername && metaUsername.toLowerCase() === usernameLower && email && id)
                        return { id, email, meta };
                    if (email && email.includes('@')) {
                        const local = email.split('@')[0].toLowerCase();
                        if (local === usernameLower && id)
                            return { id, email, meta };
                    }
                }
                if (users.length < perPage)
                    return null;
            }
            return null;
        };
        const profile = (await readProfileByUsername('eq')) ?? (await readProfileByUsername('ilike'));
        if (!profile || !profile.id) {
            const found = await findAuthUserByUsername();
            if (!found) {
                res.status(200).json({ email: '' });
                return;
            }
            const meta = found.meta && typeof found.meta === 'object' ? found.meta : null;
            const metaRole = meta && typeof meta.role === 'string' ? meta.role : '';
            const metaName = meta && typeof meta.name === 'string' ? meta.name : '';
            const allowedRoles = new Set(['ceo', 'sales', 'ops', 'staff', 'agency_staff', 'agency', 'student']);
            const role = (metaRole && allowedRoles.has(metaRole)) ? metaRole : 'student';
            const name = typeof metaName === 'string' ? metaName : '';
            await ensureSingleProfileRow(base, pgCandidates, found.id, { username, role, ...(name ? { name } : {}) });
            res.status(200).json({ email: found.email });
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
            const found = await findAuthUserByUsername();
            if (!found || !found.email) {
                res.status(500).json({
                    error: 'User exists but could not read email from Supabase Auth. Make sure SUPABASE_SERVICE_ROLE_KEY is correct.',
                });
                return;
            }
            res.status(200).json({ email: found.email });
            return;
        }
        res.status(200).json({ email: authEmail });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}
