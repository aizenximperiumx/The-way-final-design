type ApiRequest = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> };
type ApiResponse = { status: (code: number) => ApiResponse; json: (body: unknown) => void };

const asString = (v: unknown) => (typeof v === 'string' ? v : '');

const fetchJson = async (url: string, init: RequestInit) => {
  const resp = await fetch(url, init);
  const text = await resp.text();
  const json = text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;
  return { ok: resp.ok, status: resp.status, text, json };
};

const getIp = (req: ApiRequest) => {
  const raw = req.headers?.['x-forwarded-for'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return 'unknown';
  return value.split(',')[0]?.trim() || 'unknown';
};

const allow = (key: string, limit: number, windowMs: number) => {
  const now = Date.now();
  const g = globalThis as unknown as { __rl?: Map<string, { count: number; resetAt: number }> };
  if (!g.__rl) g.__rl = new Map();
  const entry = g.__rl.get(key);
  if (!entry || now > entry.resetAt) {
    g.__rl.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
};

const validateSupabaseEnv = (supabaseUrl?: string, serviceKey?: string) => {
  if (!supabaseUrl || !serviceKey) return 'Supabase is not configured';
  if (!/^https?:\/\//i.test(supabaseUrl)) {
    return 'SUPABASE_URL is invalid. It must be the Supabase Project URL (https://xxxxx.supabase.co). You likely pasted a key by mistake.';
  }
  if (/^https?:\/\//i.test(serviceKey)) {
    return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It must be the Supabase service role key.';
  }
  return '';
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
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
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const envError = validateSupabaseEnv(supabaseUrl, serviceKey);
    if (envError) {
      res.status(500).json({ error: envError });
      return;
    }
    const base = (supabaseUrl as string).replace(/\/$/, '');
    const adminKey = serviceKey as string;
    const body = (req.body && typeof req.body === 'object') ? (req.body as Record<string, unknown>) : {};
    const username = asString(body.username).trim();
    if (!username) {
      res.status(400).json({ error: 'Missing username' });
      return;
    }
    const q = `${base}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=email`;
    const r = await fetchJson(q, { method: 'GET', headers: { apikey: adminKey, Authorization: `Bearer ${adminKey}` } });
    const email = (r.ok && Array.isArray(r.json) && r.json[0] && typeof r.json[0].email === 'string') ? (r.json[0].email as string) : '';
    res.status(200).json({ email });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
