type ApiRequest = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> };
type ApiResponse = { status: (code: number) => ApiResponse; json: (body: unknown) => void };

const clamp = (v: string, max: number) => (v.length > max ? v.slice(0, max) : v);
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

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
  if (!supabaseUrl || !serviceKey) return 'Supabase is not configured';
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
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
    const envError = validateSupabaseEnv(supabaseUrl, serviceKey);
    if (envError) {
      res.status(500).json({ error: envError });
      return;
    }
    const base = (supabaseUrl as string).replace(/\/$/, '');
    const adminKey = String(serviceKey || '').trim();
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
    const callerProfile = await fetchJson(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(callerId)}&select=role`, {
      method: 'GET',
      headers: adminHeaders,
    });
    const role = Array.isArray(callerProfile.json) && callerProfile.json[0] && typeof callerProfile.json[0].role === 'string'
      ? (callerProfile.json[0].role as string)
      : '';
    const allowed = new Set(['ceo', 'sales', 'ops', 'staff', 'agency_staff', 'agency']);
    if (!allowed.has(role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const body = (req.body && typeof req.body === 'object') ? (req.body as Record<string, unknown>) : {};
    const toRaw = typeof body.to === 'string' ? body.to : '';
    const subjectRaw = typeof body.subject === 'string' ? body.subject : '';
    const textRaw = typeof body.text === 'string' ? body.text : undefined;
    const htmlRaw = typeof body.html === 'string' ? body.html : undefined;

    const to = clamp(toRaw.trim(), 254);
    const subject = clamp(subjectRaw.trim(), 140);
    const text = textRaw ? clamp(textRaw, 30_000) : undefined;
    const html = htmlRaw ? clamp(htmlRaw, 80_000) : undefined;

    if (!to || !isEmail(to) || !subject || (!text && !html)) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Email is not configured' });
      return;
    }
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'The Way <no-reply@theway.ge>',
        to: [to],
        subject,
        html: html ?? `<pre>${text}</pre>`,
        text,
      }),
    });
    if (!resp.ok) {
      const msg = await resp.text();
      res.status(500).json({ error: 'Failed to send', details: msg });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
