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
const asState = (value) => {
    const v = (value && typeof value === 'object') ? value : {};
    return {
        applications: Array.isArray(v.applications) ? v.applications : [],
        documents: Array.isArray(v.documents) ? v.documents : [],
        notifications: Array.isArray(v.notifications) ? v.notifications : [],
        appointments: Array.isArray(v.appointments) ? v.appointments : [],
        chatMessages: Array.isArray(v.chatMessages) ? v.chatMessages : [],
        chatThreadReadAt: (v.chatThreadReadAt && typeof v.chatThreadReadAt === 'object') ? v.chatThreadReadAt : {},
        documentRequests: Array.isArray(v.documentRequests) ? v.documentRequests : [],
        leads: Array.isArray(v.leads) ? v.leads : [],
    };
};
const isInternal = (role) => ['ceo', 'sales', 'ops', 'staff', 'agency_staff', 'customer_support'].includes(role);
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
// ── Non-destructive merge helpers ────────────────────────────────────────────
// Internal users save the WHOLE shared state from their own (possibly stale)
// client. A naive full overwrite means whoever saves last wins and silently
// erases data another teammate just added — e.g. Sales uploads intake files,
// then an Admin with an older snapshot saves and the intake URLs vanish.
// These helpers merge additively so concurrent edits never clobber each other.
const isNonEmpty = (v) => {
    if (v === null || v === undefined)
        return false;
    if (typeof v === 'string')
        return v.trim().length > 0;
    if (Array.isArray(v))
        return v.length > 0;
    return true;
};
const itemKey = (item, idx) => {
    if (typeof item === 'string')
        return `s:${item}`;
    const r = asRecord(item);
    const id = r ? getString(r, 'id') : '';
    if (id)
        return `id:${id}`;
    try {
        return `j:${JSON.stringify(item)}`;
    }
    catch {
        return `n:${idx}`;
    }
};
// Union two arrays, de-duplicating by id (objects) or value (strings).
// `current` first preserves original order; only truly new items are appended.
const unionArray = (currentVal, incomingVal, cap = 1000) => {
    const cur = Array.isArray(currentVal) ? currentVal : [];
    const inc = Array.isArray(incomingVal) ? incomingVal : [];
    const seen = new Set();
    const out = [];
    let i = 0;
    for (const item of [...cur, ...inc]) {
        const k = itemKey(item, i++);
        if (seen.has(k))
            continue;
        seen.add(k);
        out.push(item);
    }
    return out.slice(0, cap);
};
// Overlay a collection by id: keep every current item, let incoming items with
// the same id win (legitimate edits like document verification or "mark read"),
// and never drop an item the saving client simply hadn't loaded yet.
const mergeCollection = (currentVal, incomingVal, cap) => {
    const byKey = new Map();
    const order = [];
    let i = 0;
    const put = (arr) => {
        for (const item of arr) {
            const k = itemKey(item, i++);
            if (!byKey.has(k))
                order.push(k);
            byKey.set(k, item); // incoming applied last => wins for same key
        }
    };
    put(Array.isArray(currentVal) ? currentVal : []);
    put(Array.isArray(incomingVal) ? incomingVal : []);
    return order.map((k) => byKey.get(k)).slice(0, cap);
};
// Per-key latest-wins for chat read receipts.
const mergeReadAt = (currentVal, incomingVal) => {
    const out = { ...(currentVal || {}) };
    Object.entries(incomingVal || {}).forEach(([k, v]) => {
        if (typeof v !== 'string')
            return;
        if (!out[k] || v > out[k])
            out[k] = v;
    });
    return out;
};
// Application fields that must never be downgraded from a real value back to
// empty by a stale snapshot. Re-uploads (a new non-empty URL) still win.
const PROTECTED_STR_FIELDS = [
    'intakeDetails', 'intakeVideoUrl', 'intakePassportCopy', 'intakeHighSchoolCertificate',
    'intakeHighSchoolMissingNote', 'intakeBirthCertificate', 'intakeMotherPassport',
    'intakeFatherPassport', 'dob',
];
// Application list fields that accumulate (attachments, audit trail, notes).
const PROTECTED_ARR_FIELDS = ['intakeAttachments', 'intakeExtraDocs', 'events', 'internalNotes'];
const mergeApplication = (cur, inc) => {
    const merged = { ...cur, ...inc }; // last-write-wins baseline
    for (const f of PROTECTED_STR_FIELDS) {
        if (!isNonEmpty(inc[f]) && isNonEmpty(cur[f]))
            merged[f] = cur[f];
    }
    for (const f of PROTECTED_ARR_FIELDS) {
        merged[f] = unionArray(cur[f], inc[f], f === 'internalNotes' || f === 'events' ? 2000 : 400);
    }
    if (cur.intakeSLARewarded === true)
        merged.intakeSLARewarded = true; // never un-reward
    return merged;
};
const mergeApplications = (currentApps, incomingApps) => {
    const curById = new Map();
    (Array.isArray(currentApps) ? currentApps : []).forEach((a) => {
        const id = getString(asRecord(a), 'id');
        if (id)
            curById.set(id, a);
    });
    const seen = new Set();
    const out = [];
    (Array.isArray(incomingApps) ? incomingApps : []).forEach((a) => {
        const r = asRecord(a);
        const id = r ? getString(r, 'id') : '';
        if (!id) {
            out.push(a);
            return;
        }
        seen.add(id);
        const cur = asRecord(curById.get(id));
        out.push(cur && r ? mergeApplication(cur, r) : a);
    });
    // keep applications the saving client never loaded (created by teammates)
    curById.forEach((a, id) => { if (!seen.has(id))
        out.push(a); });
    return out;
};
export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
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
        if (!role) {
            const bootstrapEmail = (process.env.AUTO_BOOTSTRAP_CEO_EMAIL || '').toLowerCase().trim();
            const authEmail = typeof who.json.email === 'string'
                ? String(who.json.email).toLowerCase().trim() : '';
            if (bootstrapEmail && authEmail && bootstrapEmail === authEmail)
                role = 'ceo';
        }
        const body = (req.body && typeof req.body === 'object') ? req.body : {};
        const incoming = asState(body.state);
        const stateResp = await fetchJsonWithAdminHeaders(`${base}/rest/v1/app_state?org_id=eq.default&select=state&limit=1`, { method: 'GET' }, adminKey);
        const currentRaw = Array.isArray(stateResp.json) && stateResp.json[0] ? stateResp.json[0].state : {};
        const current = asState(currentRaw);
        let next = current;
        const now = new Date().toISOString();
        if (isInternal(role)) {
            // Additive merge (see helpers above) instead of full overwrite, so a
            // teammate's freshly-uploaded intake / documents / notes are never wiped
            // by another internal user saving an older snapshot.
            next = {
                applications: mergeApplications(current.applications, incoming.applications).slice(0, 50_000),
                documents: mergeCollection(current.documents, incoming.documents, 50_000),
                notifications: mergeCollection(current.notifications, incoming.notifications, 100_000),
                appointments: mergeCollection(current.appointments, incoming.appointments, 50_000),
                chatMessages: mergeCollection(current.chatMessages, incoming.chatMessages, 200_000),
                chatThreadReadAt: mergeReadAt(current.chatThreadReadAt, incoming.chatThreadReadAt),
                documentRequests: mergeCollection(current.documentRequests, incoming.documentRequests, 50_000),
                leads: mergeCollection(current.leads, incoming.leads, 50_000),
            };
        }
        else if (role === 'student') {
            const allowedThread = (key) => key.startsWith(`${userId}|`) ||
                key === `complaint-${userId}` ||
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
                const sender = getString(r, 'fromUserId') || getString(r, 'userId');
                if (sender !== userId)
                    return [];
                const text = getString(r, 'text');
                if (!text || text.length > 5000)
                    return [];
                const appId = getString(r, 'applicationId');
                if (appId && !(allowedThread(appId) || appId === `complaint-${userId}`))
                    return [];
                return [{
                        id: `${userId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                        userId,
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
                const sender = getString(r, 'fromUserId') || getString(r, 'userId');
                if (sender !== userId)
                    return [];
                const text = getString(r, 'text');
                if (!text || text.length > 5000)
                    return [];
                const appId = getString(r, 'applicationId');
                if (appId && !allowedApp(appId))
                    return [];
                return [{
                        id: `${userId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                        userId,
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
                if (!k.startsWith(`${userId}|`) && !allowedApp(k))
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
        const upserted = await fetchJsonWithAdminHeaders(`${base}/rest/v1/app_state`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates',
            },
            body: JSON.stringify({ org_id: 'default', state: next, updated_at: now, updated_by: userId }),
        }, adminKey);
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
