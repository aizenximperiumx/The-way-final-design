const asString = (v) => (typeof v === 'string' ? v : '');
const asNumber = (v, fallback) => {
    if (typeof v === 'number')
        return v;
    const parsed = Number(v);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
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
        return 'Supabase admin is not configured';
    if (!/^https?:\/\//i.test(supabaseUrl)) {
        return 'SUPABASE_URL is invalid. It must be the Supabase Project URL (https://xxxxx.supabase.co). You likely pasted a key by mistake.';
    }
    if (serviceKey.startsWith('sb_publishable_')) {
        return 'SUPABASE_SERVICE_ROLE_KEY is wrong. You pasted the publishable (public) key. It must be the secret key.';
    }
    if (serviceKey.startsWith('sb_secret_')) {
        return 'SUPABASE_SERVICE_ROLE_KEY must be the JWT service_role key (starts with eyJ...). The sb_secret_* key cannot be used for this endpoint.';
    }
    if (/^https?:\/\//i.test(serviceKey)) {
        return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It must be the Supabase service role key.';
    }
    if (/\s/.test(serviceKey)) {
        return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It contains whitespace/new lines. Paste the key as a single line.';
    }
    return '';
};
const postgrestHeaders = (adminKey) => {
    const key = adminKey.trim();
    if (!key)
        return {};
    return { apikey: key, Authorization: `Bearer ${key}` };
};
export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const body = (req.body && typeof req.body === 'object') ? req.body : {};
        const fileUrl = asString(body.fileUrl).trim();
        const expiresIn = asNumber(body.expiresIn, 3600);
        if (!fileUrl) {
            res.status(400).json({ error: 'Missing fileUrl' });
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
        const adminHeaders = postgrestHeaders(adminKey);
        let bucket = '';
        let objectPath = '';
        try {
            const parsed = new URL(fileUrl);
            const baseHost = new URL(base).host;
            if (parsed.host !== baseHost) {
                res.status(400).json({ error: 'File URL does not appear to belong to configured Supabase storage' });
                return;
            }
            const segments = parsed.pathname.split('/').filter(Boolean);
            const publicIndex = segments.indexOf('public');
            if (segments[0] !== 'storage' || segments[1] !== 'v1' || segments[2] !== 'object' || publicIndex === -1 || publicIndex + 2 >= segments.length) {
                res.status(400).json({ error: 'Unable to parse Supabase storage file URL' });
                return;
            }
            bucket = segments[publicIndex + 1];
            objectPath = segments.slice(publicIndex + 2).join('/');
        }
        catch {
            res.status(400).json({ error: 'Unable to parse fileUrl' });
            return;
        }
        const signUrl = `${base}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${objectPath}`;
        const signed = await fetchJson(signUrl, {
            method: 'POST',
            headers: { ...adminHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ expiresIn }),
        });
        if (!signed.ok || !signed.json || typeof signed.json.signedURL !== 'string') {
            const details = signed.text || 'Failed to sign file URL';
            res.status(500).json({ error: 'Failed to sign file URL', details });
            return;
        }
        // Supabase returns a relative path — make it absolute
        const rawSigned = signed.json.signedURL;
        const fullSignedUrl = rawSigned.startsWith('http')
            ? rawSigned
            : `${base}/storage/v1${rawSigned}`;
        res.status(200).json({ signedUrl: fullSignedUrl });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}
