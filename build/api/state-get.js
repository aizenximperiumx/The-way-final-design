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
const asRecord = (value) => (value && typeof value === 'object') ? value : null;
const getString = (r, key) => (r && typeof r[key] === 'string' ? r[key] : '');
const asState = (value) => {
    const v = (value && typeof value === 'object') ? value : {};
    return {
        applications: Array.isArray(v.applications) ? v.applications : [],
        documents: Array.isArray(v.documents) ? v.documents : [],
        notifications: Array.isArray(v.notifications) ? v.notifications : [],
        appointments: Array.isArray(v.appointments) ? v.appointments : [],
        chatMessages: Array.isArray(v.chatMessages) ? v.chatMessages : [],
        chatThreadReadAt: (v.chatThreadReadAt && typeof v.chatThreadReadAt === 'object') ? v.chatThreadReadAt : {},
    };
};
const isInternal = (role) => ['ceo', 'sales', 'ops', 'staff', 'agency_staff'].includes(role);
export default async function handler(req, res) {
    try {
        if (req.method !== 'GET') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
        const envErr = validateSupabaseEnv(supabaseUrl, serviceKey);
        if (envErr) {
            res.status(500).json({ error: envErr });
            return;
        }
        const base = supabaseUrl.replace(/\/$/, '');
        const adminKey = serviceKey;
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
        const userId = who.json.id;
        const appMeta = who.json.app_metadata && typeof who.json.app_metadata === 'object' ? who.json.app_metadata : null;
        let role = appMeta && typeof appMeta.role === 'string' ? appMeta.role : '';
        if (!role) {
            const profile = await fetchJsonWithAdminHeaders(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role&limit=1`, {
                method: 'GET',
            }, adminKey);
            role = Array.isArray(profile.json) && profile.json[0] && typeof profile.json[0].role === 'string'
                ? profile.json[0].role
                : '';
        }
        const stateResp = await fetchJsonWithAdminHeaders(`${base}/rest/v1/app_state?org_id=eq.default&select=state&limit=1`, { method: 'GET' }, adminKey);
        const rawState = Array.isArray(stateResp.json) && stateResp.json[0] ? stateResp.json[0].state : {};
        const state = asState(rawState);
        if (isInternal(role)) {
            res.status(200).json({ ok: true, state });
            return;
        }
        if (role === 'student') {
            const apps = state.applications.filter((row) => getString(asRecord(row), 'studentId') === userId);
            const appIds = new Set(apps.map((a) => getString(asRecord(a), 'id')));
            const documents = state.documents.filter((row) => getString(asRecord(row), 'studentId') === userId);
            const notifications = state.notifications.filter((row) => getString(asRecord(row), 'userId') === userId);
            const appointments = state.appointments.filter((row) => getString(asRecord(row), 'userId') === userId);
            const chatMessages = state.chatMessages.filter((row) => {
                const m = asRecord(row);
                if (!m)
                    return false;
                if (getString(m, 'fromUserId') === userId || getString(m, 'toUserId') === userId)
                    return true;
                const appId = getString(m, 'applicationId');
                return appId === `complaint-${userId}`;
            });
            const chatThreadReadAt = {};
            Object.entries(state.chatThreadReadAt).forEach(([k, v]) => {
                if (k === `complaint-${userId}` || appIds.has(k))
                    chatThreadReadAt[k] = v;
            });
            res.status(200).json({ ok: true, state: { applications: apps, documents, notifications, appointments, chatMessages, chatThreadReadAt } });
            return;
        }
        if (role === 'agency') {
            const apps = state.applications.filter((row) => getString(asRecord(row), 'agencyId') === userId);
            const appIds = new Set(apps.map((a) => getString(asRecord(a), 'id')));
            const chatMessages = state.chatMessages.filter((row) => {
                const m = asRecord(row);
                if (!m)
                    return false;
                if (getString(m, 'fromUserId') === userId || getString(m, 'toUserId') === userId)
                    return true;
                const appId = getString(m, 'applicationId');
                return appIds.has(appId);
            });
            const chatThreadReadAt = {};
            Object.entries(state.chatThreadReadAt).forEach(([k, v]) => {
                if (appIds.has(k))
                    chatThreadReadAt[k] = v;
            });
            res.status(200).json({ ok: true, state: { applications: apps, documents: [], notifications: [], appointments: [], chatMessages, chatThreadReadAt } });
            return;
        }
        res.status(403).json({ error: 'Forbidden' });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}
