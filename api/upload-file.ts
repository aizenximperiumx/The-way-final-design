type ApiRequest = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> };
type ApiResponse = { status: (code: number) => ApiResponse; json: (body: unknown) => void };

type UploadBody = {
  filename?: unknown;
  contentType?: unknown;
  dataBase64?: unknown;
};

const asString = (v: unknown) => (typeof v === 'string' ? v : '');
const clamp = (v: string, max: number) => (v.length > max ? v.slice(0, max) : v);

const sanitizeFilename = (name: string) => {
  const trimmed = name.trim();
  const safe = trimmed.replace(/[^\w.\-()]/g, '_');
  return safe || 'file';
};

const decodeBase64 = (value: string) => {
  const idx = value.indexOf('base64,');
  const raw = idx >= 0 ? value.slice(idx + 'base64,'.length) : value;
  return Buffer.from(raw, 'base64');
};

const getBearer = (req: ApiRequest) => {
  const raw = req.headers?.authorization || req.headers?.Authorization;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return '';
  const m = value.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? '';
};

const fetchJson = async (url: string, init: RequestInit) => {
  const resp = await fetch(url, init);
  const text = await resp.text();
  const json = text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;
  return { ok: resp.ok, status: resp.status, text, json };
};

const validateSupabaseEnv = (supabaseUrl?: string, serviceKey?: string) => {
  if (!supabaseUrl || !serviceKey) return 'Upload storage is not configured';
  if (!/^https?:\/\//i.test(supabaseUrl)) {
    return 'SUPABASE_URL is invalid. It must be the Supabase Project URL (https://xxxxx.supabase.co). You likely pasted a key by mistake.';
  }
  if (serviceKey.startsWith('sb_publishable_')) {
    return 'SUPABASE_SERVICE_ROLE_KEY is wrong. You pasted the publishable (public) key. It must be the secret key.';
  }
  if (serviceKey.startsWith('sb_secret_')) {
    return 'SUPABASE_SERVICE_ROLE_KEY must be the JWT service_role key (starts with eyJ...). The sb_secret_* key cannot be used to upload to Supabase Storage via this server endpoint.';
  }
  if (/^https?:\/\//i.test(serviceKey)) {
    return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It must be the Supabase service role key.';
  }
  if (/\s/.test(serviceKey)) {
    return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It contains whitespace/new lines. Paste the key as a single line.';
  }
  return '';
};

const postgrestHeaders = (adminKey: string): Record<string, string> => {
  const key = adminKey.trim();
  if (!key) return {};
  const isJwtLike = key.startsWith('eyJ') && key.split('.').length === 3;
  return isJwtLike ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const body = (req.body && typeof req.body === 'object') ? (req.body as UploadBody) : {};
    const filename = sanitizeFilename(asString(body.filename));
    const contentType = clamp(asString(body.contentType) || 'application/octet-stream', 100);
    const dataBase64 = asString(body.dataBase64);

    if (!dataBase64) {
      res.status(400).json({ error: 'Missing dataBase64' });
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET;

    const envError = validateSupabaseEnv(supabaseUrl, supabaseServiceKey);
    if (envError) {
      res.status(500).json({ error: envError });
      return;
    }
    if (!bucket) {
      res.status(500).json({ error: 'Upload storage is not configured' });
      return;
    }
    const base = (supabaseUrl as string).replace(/\/$/, '');
    const adminKey = String(supabaseServiceKey || '').trim();
    const adminHeaders = postgrestHeaders(adminKey);

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
    const callerId = who.json.id as string;
    const appMeta = who.json.app_metadata && typeof who.json.app_metadata === 'object' ? (who.json.app_metadata as Record<string, unknown>) : null;
    let role = appMeta && typeof appMeta.role === 'string' ? String(appMeta.role).trim().toLowerCase() : '';
    if (!role) {
      const callerProfile = await fetchJson(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(callerId)}&select=role`, {
        method: 'GET',
        headers: adminHeaders,
      });
      role = Array.isArray(callerProfile.json) && callerProfile.json[0] && typeof callerProfile.json[0].role === 'string'
        ? String(callerProfile.json[0].role).trim().toLowerCase()
        : '';
    }
    const allowed = new Set(['ceo', 'sales', 'ops', 'staff', 'agency_staff', 'agency']);
    if (!allowed.has(role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const bytes = decodeBase64(dataBase64);
    const maxBytes = 15 * 1024 * 1024;
    if (bytes.length > maxBytes) {
      res.status(413).json({ error: 'File too large', details: `Max ${maxBytes} bytes. Received ${bytes.length} bytes.` });
      return;
    }
    if (!bytes.length) {
      res.status(400).json({ error: 'Empty file' });
      return;
    }

    const random = Math.random().toString(16).slice(2);
    const objectPath = `${callerId}/${Date.now()}-${random}-${filename}`;
    const putUrl = `${base}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath}`;

    const putResp = await fetch(putUrl, {
      method: 'POST',
      headers: {
        ...adminHeaders,
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

    const publicUrl = `${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${objectPath}`;
    res.status(200).json({ url: publicUrl });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
