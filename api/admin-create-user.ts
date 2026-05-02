type ApiRequest = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> };
type ApiResponse = { status: (code: number) => ApiResponse; json: (body: unknown) => void };

type CreateUserBody = {
  email?: unknown;
  password?: unknown;
  username?: unknown;
  role?: unknown;
  name?: unknown;
  phone?: unknown;
};

import { randomBytes } from 'crypto';

const asString = (v: unknown) => (typeof v === 'string' ? v : '');

const getHeader = (req: ApiRequest, name: string) => {
  const target = name.toLowerCase();
  const headers = req.headers || {};
  const foundKey = Object.keys(headers).find(k => k.toLowerCase() === target);
  const raw = foundKey ? headers[foundKey] : undefined;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' ? value : '';
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

const randomPassword = () => {
  const buf = randomBytes(16).toString('base64url');
  return `Tw-${buf}`;
};

const validateSupabaseEnv = (supabaseUrl?: string, serviceKey?: string) => {
  if (!supabaseUrl || !serviceKey) return 'Supabase admin is not configured';
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

const getForcedInternal2faCode = () => {
  const v = process.env.FORCE_INTERNAL_2FA_CODE;
  return typeof v === 'string' ? v.trim() : '';
};

const adminAuthHeaders = (adminKey: string) => {
  const key = adminKey.trim();
  const isJwtLike = key.startsWith('eyJ') && key.split('.').length === 3;
  const isSbSecret = key.startsWith('sb_secret_');
  return (isJwtLike || isSbSecret) ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    const envError = validateSupabaseEnv(supabaseUrl, serviceKey);
    if (envError) {
      res.status(500).json({ error: envError });
      return;
    }
    const base = (supabaseUrl as string).replace(/\/$/, '');
    const adminKey = String(serviceKey || '').trim();
    const adminHeaders = adminAuthHeaders(adminKey);
    const bootstrapSecret = process.env.BOOTSTRAP_SECRET || '';
    const bootstrapProvided = getHeader(req, 'x-bootstrap-secret').trim();
    const isBootstrap = Boolean(bootstrapSecret && bootstrapProvided && bootstrapProvided === bootstrapSecret);

    if (!isBootstrap) {
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
      const callerRole = Array.isArray(callerProfile.json) && callerProfile.json[0] && typeof callerProfile.json[0].role === 'string'
        ? (callerProfile.json[0].role as string)
        : '';
      if (callerRole !== 'ceo') {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
    } else {
      const existingCeo = await fetchJson(`${base}/rest/v1/profiles?role=eq.ceo&select=id&limit=1`, {
        method: 'GET',
        headers: adminHeaders,
      });
      if (existingCeo.ok && Array.isArray(existingCeo.json) && existingCeo.json.length > 0) {
        res.status(403).json({ error: 'Bootstrap is disabled after CEO exists' });
        return;
      }
    }

    const body = (req.body && typeof req.body === 'object') ? (req.body as CreateUserBody) : {};
    const email = asString(body.email).trim();
    const passwordIn = asString(body.password);
    const usernameIn = asString(body.username).trim();
    const role = asString(body.role).trim();
    const name = asString(body.name).trim();
    void asString(body.phone).trim();

    const allowedRoles = new Set(['ceo', 'sales', 'ops', 'staff', 'agency_staff', 'agency']);
    if (!email || !role || !name) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }
    if (!allowedRoles.has(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const password = passwordIn || randomPassword();

    const usernameBase = (usernameIn || role).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 10) || 'user';
    let username = usernameIn || `${usernameBase}${Math.floor(100 + Math.random() * 900)}`;
    for (let i = 0; i < 6; i++) {
      const check = await fetchJson(`${base}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=id&limit=1`, {
        method: 'GET',
        headers: adminHeaders,
      });
      if (check.ok && Array.isArray(check.json) && check.json.length === 0) break;
      username = `${usernameBase}${Math.floor(100 + Math.random() * 900)}${i}`;
    }

    void getForcedInternal2faCode();

    const created = await fetchJson(`${base}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { ...adminHeaders, 'Content-Type': 'application/json' },
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
        ...adminHeaders,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        id,
        username,
        role,
        name,
      }),
    });
    if (!inserted.ok) {
      res.status(500).json({ error: 'Failed to create profile', details: inserted.text });
      return;
    }

    if (resendKey) {
      const html = `
        <div style="font-family:Arial,sans-serif">
          <h2 style="margin:0 0 12px">Your account is ready</h2>
          <p><b>Username:</b> ${username}<br/><b>Password:</b> ${password}</p>
        </div>`;
      const text = `Username: ${username}\nPassword: ${password}`;
      await sendResend(resendKey, email, 'Your account credentials', html, text);
    }

    res.status(200).json({ id, email, username, role, name, emailSent: Boolean(resendKey) });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
