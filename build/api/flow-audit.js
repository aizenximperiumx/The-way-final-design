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
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const envError = validateSupabaseEnv(supabaseUrl, serviceKey);
        if (envError) {
            res.status(500).json({ error: envError });
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
        const callerId = who.json.id;
        const callerProfile = await fetchJson(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(callerId)}&select=role`, {
            method: 'GET',
            headers: { apikey: adminKey, Authorization: `Bearer ${adminKey}` },
        });
        const callerRole = Array.isArray(callerProfile.json) && callerProfile.json[0] && typeof callerProfile.json[0].role === 'string'
            ? callerProfile.json[0].role
            : '';
        if (callerRole !== 'ceo') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const stateResp = await fetchJson(`${base}/rest/v1/app_state?org_id=eq.default&select=state&limit=1`, {
            method: 'GET',
            headers: { apikey: adminKey, Authorization: `Bearer ${adminKey}` },
        });
        const state = Array.isArray(stateResp.json) && stateResp.json[0] && typeof stateResp.json[0].state === 'object'
            ? stateResp.json[0].state
            : {};
        const applications = Array.isArray(state.applications) ? state.applications : [];
        const chatMessages = Array.isArray(state.chatMessages) ? state.chatMessages : [];
        const appById = new Map();
        applications.forEach((a) => {
            const id = typeof a.id === 'string' ? a.id : '';
            if (id)
                appById.set(id, a);
        });
        const issues = [];
        applications.forEach((a) => {
            const id = typeof a.id === 'string' ? a.id : '';
            const status = typeof a.status === 'string' ? a.status : '';
            const source = typeof a.source === 'string' ? a.source : 'public';
            const studentId = typeof a.studentId === 'string' ? a.studentId : '';
            const ownerId = typeof a.ownerId === 'string' ? a.ownerId : '';
            const agencyId = typeof a.agencyId === 'string' ? a.agencyId : '';
            const studentEmail = typeof a.studentEmail === 'string' ? a.studentEmail : '';
            const assignedStaffId = typeof a.assignedStaffId === 'string' ? a.assignedStaffId : '';
            if (status === 'approved' && !studentId) {
                issues.push({ severity: 'high', code: 'APP_APPROVED_NO_STUDENT', message: 'Approved application missing studentId', context: { id } });
            }
            if (status === 'approved' && !ownerId) {
                issues.push({ severity: 'medium', code: 'APP_APPROVED_NO_OWNER', message: 'Approved application missing ownerId (sales/ops)', context: { id } });
            }
            if (source === 'agency' && !agencyId) {
                issues.push({ severity: 'high', code: 'AGENCY_APP_NO_AGENCY', message: 'Agency application missing agencyId', context: { id } });
            }
            if (source === 'agency' && status === 'approved' && !studentEmail) {
                issues.push({ severity: 'high', code: 'AGENCY_APPROVED_NO_STUDENT_EMAIL', message: 'Agency approved but studentEmail missing', context: { id } });
            }
            if (assignedStaffId && source === 'public' && status === 'approved') {
                // ok
            }
        });
        chatMessages.forEach((m) => {
            const applicationId = typeof m.applicationId === 'string' ? m.applicationId : '';
            if (!applicationId)
                return;
            if (applicationId.startsWith('complaint-'))
                return;
            if (!appById.has(applicationId)) {
                issues.push({ severity: 'low', code: 'CHAT_ORPHAN_THREAD', message: 'Chat message references missing applicationId', context: { applicationId } });
            }
        });
        res.status(200).json({ ok: issues.length === 0, issueCount: issues.length, issues });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}
