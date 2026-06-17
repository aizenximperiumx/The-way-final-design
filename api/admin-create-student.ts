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
      from: process.env.EMAIL_FROM || 'The Way <no-reply@info.theway.ge>',
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
  if (serviceKey.startsWith('sb_secret_')) {
    return 'SUPABASE_SERVICE_ROLE_KEY must be the JWT service_role key (starts with eyJ...). The sb_secret_* key cannot be used for Supabase Auth admin user creation.';
  }
  if (/^https?:\/\//i.test(serviceKey)) {
    return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It must be the Supabase service role key.';
  }
  if (/\s/.test(serviceKey)) {
    return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It contains whitespace/new lines. Paste the key as a single line.';
  }
  return '';
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

const getRoleFromProfiles = async (base: string, pgCandidates: Array<Record<string, string>>, userId: string) => {
  const r = await fetchPostgrest(pgCandidates, `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role&limit=1`, { method: 'GET' });
  const role =
    (r.ok && Array.isArray(r.json) && r.json[0] && typeof r.json[0] === 'object' && typeof r.json[0].role === 'string')
      ? String(r.json[0].role).trim().toLowerCase()
      : '';
  return role;
};

const ensureSingleProfileRow = async (
  base: string,
  pgCandidates: Array<Record<string, string>>,
  userId: string,
  patch: Record<string, unknown>,
) => {
  const read = await fetchPostgrest(pgCandidates, `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id&limit=1`, { method: 'GET' });
  if (read.ok && Array.isArray(read.json) && read.json.length > 0) {
    return fetchPostgrest(pgCandidates, `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    });
  }
  return fetchPostgrest(pgCandidates, `${base}/rest/v1/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ id: userId, ...patch }),
  });
};

const findAuthUserByEmail = async (base: string, authHeaders: Record<string, string>, email: string) => {
  const perPage = 200;
  const target = email.toLowerCase();
  for (let page = 1; page <= 10; page += 1) {
    const r = await fetchJson(`${base}/auth/v1/admin/users?page=${page}&per_page=${perPage}`, {
      method: 'GET',
      headers: authHeaders,
    });
    if (!r.ok) return null;
    const users = Array.isArray(r.json)
      ? r.json
      : (r.json && typeof r.json === 'object' && Array.isArray((r.json as Record<string, unknown>).users) ? (r.json as { users: unknown[] }).users : []);
    if (!Array.isArray(users) || users.length === 0) return null;
    for (const u of users) {
      const obj = (u && typeof u === 'object') ? (u as Record<string, unknown>) : null;
      if (!obj) continue;
      const uEmail = typeof obj.email === 'string' ? obj.email : '';
      const id = typeof obj.id === 'string' ? obj.id : '';
      if (id && uEmail && uEmail.toLowerCase() === target) return { id, email: uEmail };
    }
    if (users.length < perPage) return null;
  }
  return null;
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
    const callerId = who.json.id as string;
    const callerRole = appMeta && typeof appMeta.role === 'string'
      ? String(appMeta.role).trim().toLowerCase()
      : await getRoleFromProfiles(base, pgCandidates, callerId);
    if (!['sales', 'ops', 'ceo'].includes(callerRole)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const body = (req.body && typeof req.body === 'object') ? (req.body as CreateStudentBody) : {};
    const email = asString(body.email).trim();
    const password = asString(body.password);
    const username = asString(body.username).trim();
    const name = asString(body.name).trim();
    void asString(body.phone).trim();

    if (!email || !password || !username || !name) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Invalid email' });
      return;
    }

    const created = await fetchJson(`${base}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, email_confirm: true, app_metadata: { role: 'student', username }, user_metadata: { username, name } }),
    });
    const createText = created.text || '';
    const createTextLower = createText.toLowerCase();
    const duplicate =
      createText.includes('users_email_partial_key') ||
      createText.includes('"code":"23505"') ||
      createTextLower.includes('duplicate') ||
      createTextLower.includes('email_exists') ||
      createTextLower.includes('already been registered') ||
      createTextLower.includes('already registered');

    const id = (created.ok && created.json && typeof created.json.id === 'string')
      ? (created.json.id as string)
      : '';

    if (!id) {
      if (duplicate) {
        const existing = await findAuthUserByEmail(base, authHeaders, email);
        if (!existing) {
          res.status(409).json({ error: 'Email already exists' });
          return;
        }
        const updatedAuth = await fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(existing.id)}`, {
          method: 'PUT',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password,
            app_metadata: { role: 'student', username },
            user_metadata: { username, name },
          }),
        });
        if (!updatedAuth.ok) {
          res.status(500).json({ error: 'Student account exists but failed to update credentials', details: updatedAuth.text });
          return;
        }
        const inserted = await ensureSingleProfileRow(base, pgCandidates, existing.id, { username, role: 'student', name });
        if (!inserted.ok) {
          res.status(500).json({ error: 'Student account exists but failed to create profile', details: inserted.text });
          return;
        }
        const dupHtml = `
      <div style="font-family:Arial,sans-serif">
        <h2 style="margin:0 0 12px">Welcome to The Way</h2>
        <p>Your student account has been created. Use these credentials:</p>
        <p><b>Username:</b> ${username}<br/><b>Password:</b> ${password}</p>
      </div>`;
        const dupText = `Username: ${username}\nPassword: ${password}`;
        let dupEmailSent = false;
        let dupEmailWarning = '';
        if (resendKey) {
          try {
            await sendResend(resendKey, email, 'Your The Way student account', dupHtml, dupText);
            dupEmailSent = true;
          } catch (e: unknown) {
            dupEmailWarning = e instanceof Error ? e.message : 'Failed to send email';
          }
        }
        res.status(200).json({
          id: existing.id,
          email,
          username,
          name,
          emailSent: dupEmailSent,
          warning: dupEmailSent ? 'Account already existed; password reset and emailed' : 'Account already existed; password reset',
          ...(dupEmailWarning ? { emailError: dupEmailWarning.slice(0, 300) } : {}),
          ...(!dupEmailSent ? { password } : {}),
        });
        return;
      }
      if ((created.status === 401 || created.status === 403) && adminKey.startsWith('sb_secret_')) {
        res.status(500).json({ error: 'Supabase Auth admin is not configured', details: 'SUPABASE_SERVICE_ROLE_KEY must be the JWT service_role key (starts with eyJ...).' });
        return;
      }
      res.status(500).json({ error: 'Failed to create auth user', details: createText });
      return;
    }
    const inserted = await ensureSingleProfileRow(base, pgCandidates, id, { username, role: 'student', name });
    if (!inserted.ok) {
      res.status(500).json({ error: 'Failed to create profile', details: inserted.text });
      return;
      return;
    }
    void fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_metadata: { role: 'student', username }, user_metadata: { username, name } }),
    });

    const html = `
      <div style="font-family:Arial,sans-serif">
        <h2 style="margin:0 0 12px">Welcome to The Way</h2>
        <p>Your student account has been created. Use these credentials:</p>
        <p><b>Username:</b> ${username}<br/><b>Password:</b> ${password}</p>
      </div>`;
    const text = `Username: ${username}\nPassword: ${password}`;
    let emailSent = false;
    let emailWarning = '';
    if (resendKey) {
      try {
        await sendResend(resendKey, email, 'Your The Way student account', html, text);
        emailSent = true;
      } catch (e: unknown) {
        emailWarning = e instanceof Error ? e.message : 'Failed to send email';
      }
    }

    res.status(200).json({
      id,
      email,
      username,
      name,
      emailSent,
      ...(emailWarning ? { warning: 'Email not sent', emailError: emailWarning.slice(0, 300) } : {}),
      ...(!emailSent ? { password } : {}),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
