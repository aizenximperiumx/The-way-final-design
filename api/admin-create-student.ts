type ApiRequest = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> };
type ApiResponse = { status: (code: number) => ApiResponse; json: (body: unknown) => void };

type CreateStudentBody = {
  email?: unknown;
  password?: unknown;
  username?: unknown;
  name?: unknown;
  phone?: unknown;
};

const asString = (v: unknown) => (typeof v === 'string' ? v : '');

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

const sendResend = async (apiKey: string, to: string, subject: string, html: string, text: string) => {
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
      html,
      text,
    }),
  });
  if (!resp.ok) {
    const details = await resp.text();
    throw new Error(details || 'Failed to send email');
  }
};

const validateSupabaseEnv = (supabaseUrl?: string, serviceKey?: string) => {
  if (!supabaseUrl || !serviceKey) return 'Supabase admin is not configured';
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

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    const envError = validateSupabaseEnv(supabaseUrl, serviceKey);
    if (envError) {
      res.status(500).json({ error: envError });
      return;
    }
    const base = (supabaseUrl as string).replace(/\/$/, '');
    const adminKey = serviceKey as string;

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
      headers: { apikey: adminKey, Authorization: `Bearer ${adminKey}` },
    });
    const callerRole = Array.isArray(callerProfile.json) && callerProfile.json[0] && typeof callerProfile.json[0].role === 'string'
      ? (callerProfile.json[0].role as string)
      : '';
    if (!['sales', 'ops', 'ceo'].includes(callerRole)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const body = (req.body && typeof req.body === 'object') ? (req.body as CreateStudentBody) : {};
    const email = asString(body.email).trim();
    const password = asString(body.password);
    const username = asString(body.username).trim();
    const name = asString(body.name).trim();
    const phone = asString(body.phone).trim() || undefined;

    if (!email || !password || !username || !name) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }

    const created = await fetchJson(`${base}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { apikey: adminKey, Authorization: `Bearer ${adminKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    if (!created.ok || !created.json || typeof created.json.id !== 'string') {
      res.status(500).json({ error: 'Failed to create auth user', details: created.text });
      return;
    }

    const id = created.json.id as string;
    const inserted = await fetchJson(`${base}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        apikey: adminKey,
        Authorization: `Bearer ${adminKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        id,
        email,
        username,
        role: 'student',
        name,
        phone,
        points: 0,
      }),
    });
    if (!inserted.ok) {
      res.status(500).json({ error: 'Failed to create profile', details: inserted.text });
      return;
    }

    const html = `
      <div style="font-family:Arial,sans-serif">
        <h2 style="margin:0 0 12px">Welcome to The Way</h2>
        <p>Your student account has been created. Use these credentials:</p>
        <p><b>Username:</b> ${username}<br/><b>Password:</b> ${password}</p>
      </div>`;
    const text = `Username: ${username}\nPassword: ${password}`;
    if (resendKey) {
      await sendResend(resendKey, email, 'Your The Way student account', html, text);
    }

    res.status(200).json({ id, email, username, name, emailSent: Boolean(resendKey) });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
