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
    if (!supabaseUrl || !serviceKey) {
      res.status(500).json({ error: 'Supabase is not configured' });
      return;
    }
    const body = (req.body && typeof req.body === 'object') ? (req.body as Record<string, unknown>) : {};
    const username = asString(body.username).trim();
    if (!username) {
      res.status(400).json({ error: 'Missing username' });
      return;
    }
    const q = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=email`;
    const r = await fetchJson(q, { method: 'GET', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } });
    const email = (r.ok && Array.isArray(r.json) && r.json[0] && typeof r.json[0].email === 'string') ? (r.json[0].email as string) : '';
    res.status(200).json({ email });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
