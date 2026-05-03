type ApiRequest = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> };
type ApiResponse = { status: (code: number) => ApiResponse; json: (body: unknown) => void };

type ResetBody = {
  userId?: unknown;
  username?: unknown;
  password?: unknown;
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

const authAdminHeaders = (adminKey: string): Record<string, string> => {
  const key = adminKey.trim();
  if (!key) return {};
  return { apikey: key, Authorization: `Bearer ${key}` };
};

const postgrestHeaderCandidates = (adminKey: string): Array<Record<string, string>> => {
  const key = adminKey.trim();
  if (!key) return [{}];
  const isJwtLike = key.startsWith('eyJ') && key.split('.').length === 3;
  const isSbSecret = key.startsWith('sb_secret_');
  if (isJwtLike) return [{ apikey: key, Authorization: `Bearer ${key}` }];
  if (isSbSecret) return [{ apikey: key }, { apikey: key, Authorization: `Bearer ${key}` }];
  return [{ apikey: key }];
};

const fetchPostgrest = async (candidates: Array<Record<string, string>>, url: string, init: RequestInit) => {
  let last = await fetchJson(url, { ...init, headers: { ...(init.headers ?? {}), ...(candidates[0] ?? {}) } });
  for (let i = 1; i < candidates.length; i += 1) {
    if (last.ok) return last;
    if (last.status !== 401 && last.status !== 403) return last;
    last = await fetchJson(url, { ...init, headers: { ...(init.headers ?? {}), ...(candidates[i] ?? {}) } });
  }
  return last;
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
    const pgCandidates = postgrestHeaderCandidates(adminKey);
    const authHeaders = authAdminHeaders(adminKey);

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

    const appMeta = who.json.app_metadata && typeof who.json.app_metadata === 'object' ? (who.json.app_metadata as Record<string, unknown>) : null;
    const callerRole = appMeta && typeof appMeta.role === 'string' ? appMeta.role : '';
    if (callerRole !== 'ceo') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const body = (req.body && typeof req.body === 'object') ? (req.body as ResetBody) : {};
    const userId = asString(body.userId).trim();
    const username = asString(body.username).trim() || undefined;
    const password = asString(body.password) || undefined;
    void getForcedInternal2faCode();

    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }

    if (password) {
      const updated = await fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!updated.ok) {
        res.status(500).json({ error: 'Failed to update password', details: updated.text });
        return;
      }
    }

    if (username) {
      const updatedProfile = await fetchPostgrest(pgCandidates, `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ username }),
      });
      if (!updatedProfile.ok) {
        res.status(500).json({ error: 'Failed to update profile', details: updatedProfile.text });
        return;
      }
      void fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_metadata: { username }, user_metadata: { username } }),
      });
    }

    const authUser = await fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: authHeaders,
    });
    const email = (authUser.ok && authUser.json && typeof authUser.json === 'object' && typeof authUser.json.email === 'string') ? String(authUser.json.email) : '';
    const userMeta = (authUser.ok && authUser.json && typeof authUser.json === 'object' && authUser.json.user_metadata && typeof authUser.json.user_metadata === 'object')
      ? (authUser.json.user_metadata as Record<string, unknown>)
      : null;
    const finalUsername = username ?? (userMeta && typeof userMeta.username === 'string' ? userMeta.username : '');

    const profile = await fetchPostgrest(pgCandidates, `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=username,role,name&limit=1`, { method: 'GET' });
    const row = Array.isArray(profile.json) ? profile.json[0] : null;
    const name = row && typeof row.name === 'string' ? (row.name as string) : '';
    const role = row && typeof row.role === 'string' ? (row.role as string) : '';

    let emailSent = false;
    let emailWarning = '';
    if (email && resendKey) {
      const subject = role === 'student' ? 'Your student account credentials updated' : 'Your account credentials updated';
      const html = `
        <div style="font-family:Arial,sans-serif">
          <h2 style="margin:0 0 12px">Credentials updated</h2>
          <p><b>Name:</b> ${name}</p>
          <p><b>Username:</b> ${finalUsername}${password ? `<br/><b>Password:</b> ${password}` : ''}</p>
        </div>`;
      const text = `Name: ${name}\nUsername: ${finalUsername}${password ? `\nPassword: ${password}` : ''}`;
      try {
        await sendResend(resendKey, email, subject, html, text);
        emailSent = true;
      } catch (e: unknown) {
        emailWarning = e instanceof Error ? e.message : 'Failed to send email';
      }
    }

    res.status(200).json({
      ok: true,
      emailSent,
      ...(emailWarning ? { warning: 'Email not sent', emailError: emailWarning.slice(0, 300) } : {}),
      ...(password && !emailSent ? { password } : {}),
      ...(finalUsername ? { username: finalUsername } : {}),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
