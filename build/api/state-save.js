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
const asRecord = (value) => (value && typeof value === 'object') ? value : null;
const getString = (r, key) => (r && typeof r[key] === 'string' ? r[key] : '');
const uniqueBy = (items, keyFn) => {
    const seen = new Set();
    const out = [];
    for (const it of items) {
        const k = keyFn(it);
        if (!k || seen.has(k))
            continue;
        seen.add(k);
        out.push(it);
    }
    return out;
};
export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceKey) {
            res.status(500).json({ error: 'Supabase is not configured' });
            return;
        }
        const token = getBearer(req);
        if (!token) {
            res.status(401).json({ error: 'Missing token' });
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
        const userId = who.json.id;
        const profile = await fetchJson(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role`, {
            method: 'GET',
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        });
        const role = Array.isArray(profile.json) && profile.json[0] && typeof profile.json[0].role === 'string'
            ? profile.json[0].role
            : '';
        const body = (req.body && typeof req.body === 'object') ? req.body : {};
        const incoming = asState(body.state);
        const stateResp = await fetchJson(`${base}/rest/v1/app_state?org_id=eq.default&select=state&limit=1`, {
            method: 'GET',
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        });
        const currentRaw = Array.isArray(stateResp.json) && stateResp.json[0] ? stateResp.json[0].state : {};
        const current = asState(currentRaw);
        let next = current;
        const now = new Date().toISOString();
        if (isInternal(role)) {
            next = {
                applications: incoming.applications.slice(0, 50_000),
                documents: incoming.documents.slice(0, 50_000),
                notifications: incoming.notifications.slice(0, 100_000),
                appointments: incoming.appointments.slice(0, 50_000),
                chatMessages: incoming.chatMessages.slice(0, 200_000),
                chatThreadReadAt: incoming.chatThreadReadAt || {},
            };
        }
        else if (role === 'student') {
            const allowedThread = (key) => key === `complaint-${userId}` ||
                current.applications.some((a) => getString(asRecord(a), 'studentId') === userId && getString(asRecord(a), 'id') === key);
            const mergedReadAt = { ...current.chatThreadReadAt };
            Object.entries(incoming.chatThreadReadAt || {}).forEach(([k, v]) => {
                if (!allowedThread(k))
                    return;
                if (typeof v !== 'string')
                    return;
                mergedReadAt[k] = v;
            });
            const newMessages = incoming.chatMessages.flatMap((m) => {
                const r = asRecord(m);
                if (!r)
                    return [];
                if (getString(r, 'fromUserId') !== userId)
                    return [];
                const text = getString(r, 'text');
                if (!text || text.length > 5000)
                    return [];
                const appId = getString(r, 'applicationId');
                if (appId && !(allowedThread(appId) || appId === `complaint-${userId}`))
                    return [];
                return [{
                        id: `${userId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                        fromUserId: userId,
                        toUserId: getString(r, 'toUserId'),
                        text,
                        applicationId: appId || undefined,
                        time: now,
                    }];
            });
            next = {
                ...current,
                chatThreadReadAt: mergedReadAt,
                chatMessages: uniqueBy([...current.chatMessages, ...newMessages], (x) => getString(asRecord(x), 'id')),
            };
        }
        else if (role === 'agency') {
            const allowedApp = (id) => current.applications.some((a) => getString(asRecord(a), 'agencyId') === userId && getString(asRecord(a), 'id') === id);
            const newMessages = incoming.chatMessages.flatMap((m) => {
                const r = asRecord(m);
                if (!r)
                    return [];
                if (getString(r, 'fromUserId') !== userId)
                    return [];
                const text = getString(r, 'text');
                if (!text || text.length > 5000)
                    return [];
                const appId = getString(r, 'applicationId');
                if (appId && !allowedApp(appId))
                    return [];
                return [{
                        id: `${userId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                        fromUserId: userId,
                        toUserId: getString(r, 'toUserId'),
                        text,
                        applicationId: appId || undefined,
                        time: now,
                    }];
            });
            const byId = new Map();
            current.applications.forEach((a) => {
                const id = getString(asRecord(a), 'id');
                if (id)
                    byId.set(id, a);
            });
            const updatedApps = [];
            incoming.applications.forEach((a) => {
                const r = asRecord(a);
                if (!r)
                    return;
                const id = getString(r, 'id');
                if (!id || !allowedApp(id))
                    return;
                const baseApp = asRecord(byId.get(id));
                if (!baseApp)
                    return;
                const mergeArray = (oldVal, newVal) => {
                    const oldArr = Array.isArray(oldVal) ? oldVal.filter(x => typeof x === 'string') : [];
                    const newArr = Array.isArray(newVal) ? newVal.filter(x => typeof x === 'string') : [];
                    const merged = Array.from(new Set([...oldArr, ...newArr]));
                    return merged.slice(0, 200);
                };
                const nextApp = {
                    ...baseApp,
                    intakeExtraDocs: mergeArray(baseApp.intakeExtraDocs, r.intakeExtraDocs),
                    intakeAttachments: mergeArray(baseApp.intakeAttachments, r.intakeAttachments),
                    intakeVideoUrl: typeof r.intakeVideoUrl === 'string' ? r.intakeVideoUrl : baseApp.intakeVideoUrl,
                    intakePassportCopy: typeof r.intakePassportCopy === 'string' ? r.intakePassportCopy : baseApp.intakePassportCopy,
                    intakeHighSchoolCertificate: typeof r.intakeHighSchoolCertificate === 'string' ? r.intakeHighSchoolCertificate : baseApp.intakeHighSchoolCertificate,
                };
                updatedApps.push(nextApp);
            });
            const mergedApps = current.applications.map((a) => {
                const id = getString(asRecord(a), 'id');
                const repl = updatedApps.find((x) => getString(x, 'id') === id);
                return repl ?? a;
            });
            const mergedReadAt = { ...current.chatThreadReadAt };
            Object.entries(incoming.chatThreadReadAt || {}).forEach(([k, v]) => {
                if (!allowedApp(k))
                    return;
                if (typeof v !== 'string')
                    return;
                mergedReadAt[k] = v;
            });
            next = {
                ...current,
                applications: mergedApps,
                chatThreadReadAt: mergedReadAt,
                chatMessages: uniqueBy([...current.chatMessages, ...newMessages], (x) => getString(asRecord(x), 'id')),
            };
        }
        else {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const upserted = await fetchJson(`${base}/rest/v1/app_state`, {
            method: 'POST',
            headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates',
            },
            body: JSON.stringify({ org_id: 'default', state: next, updated_at: now, updated_by: userId }),
        });
        if (!upserted.ok) {
            res.status(500).json({ error: 'Failed to save state', details: upserted.text });
            return;
        }
        res.status(200).json({ ok: true });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}
