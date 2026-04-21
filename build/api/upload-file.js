const asString = (v) => (typeof v === 'string' ? v : '');
const clamp = (v, max) => (v.length > max ? v.slice(0, max) : v);
const sanitizeFilename = (name) => {
    const trimmed = name.trim();
    const safe = trimmed.replace(/[^\w.\-()]/g, '_');
    return safe || 'file';
};
const decodeBase64 = (value) => {
    const idx = value.indexOf('base64,');
    const raw = idx >= 0 ? value.slice(idx + 'base64,'.length) : value;
    return Buffer.from(raw, 'base64');
};
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
export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const body = (req.body && typeof req.body === 'object') ? req.body : {};
        const filename = sanitizeFilename(asString(body.filename));
        const contentType = clamp(asString(body.contentType) || 'application/octet-stream', 100);
        const dataBase64 = asString(body.dataBase64);
        if (!dataBase64) {
            res.status(400).json({ error: 'Missing dataBase64' });
            return;
        }
        if (dataBase64.length > 10_000_000) {
            res.status(413).json({ error: 'File too large' });
            return;
        }
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const bucket = process.env.SUPABASE_STORAGE_BUCKET;
        if (!supabaseUrl || !supabaseServiceKey || !bucket) {
            res.status(500).json({ error: 'Upload storage is not configured' });
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
            headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${token}` },
        });
        if (!who.ok || !who.json || typeof who.json.id !== 'string') {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        const callerId = who.json.id;
        const callerProfile = await fetchJson(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(callerId)}&select=role`, {
            method: 'GET',
            headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` },
        });
        const role = Array.isArray(callerProfile.json) && callerProfile.json[0] && typeof callerProfile.json[0].role === 'string'
            ? callerProfile.json[0].role
            : '';
        const allowed = new Set(['ceo', 'sales', 'ops', 'staff', 'agency_staff', 'agency']);
        if (!allowed.has(role)) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const bytes = decodeBase64(dataBase64);
        if (!bytes.length) {
            res.status(400).json({ error: 'Empty file' });
            return;
        }
        const random = Math.random().toString(16).slice(2);
        const objectPath = `${Date.now()}-${random}-${filename}`;
        const putUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeURIComponent(objectPath)}`;
        const putResp = await fetch(putUrl, {
            method: 'POST',
            headers: {
                apikey: supabaseServiceKey,
                Authorization: `Bearer ${supabaseServiceKey}`,
                'Content-Type': contentType,
                'x-upsert': 'true',
            },
            body: bytes,
        });
        if (!putResp.ok) {
            const details = await putResp.text();
            res.status(500).json({ error: 'Failed to upload', details });
            return;
        }
        const publicUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeURIComponent(objectPath)}`;
        res.status(200).json({ url: publicUrl });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}
