import http from 'node:http';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection', reason);
});

process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err);
});

const getHealthBootstrapInfo = () => {
  const g = globalThis;
  const v = g.__ceoBootstrapLast;
  if (!v || typeof v !== 'object') return null;
  return v;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');
const apiBuildDir = path.join(__dirname, 'build', 'api');

const mimeByExt = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const readBody = (req) =>
  new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', () => resolve(Buffer.from('')));
  });

const toHeadersRecord = (headers) => {
  const out = {};
  for (const [k, v] of Object.entries(headers ?? {})) out[k] = v;
  return out;
};

const serveJson = (res, statusCode, body) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
};

const safeStringify = (value) => {
  const seen = new WeakSet();
  return JSON.stringify(value, (_k, v) => {
    if (typeof v === 'bigint') return v.toString();
    if (v && typeof v === 'object') {
      if (seen.has(v)) return '[Circular]';
      seen.add(v);
    }
    return v;
  });
};

const getDataDir = () => {
  const raw = process.env.DATA_DIR;
  const value = typeof raw === 'string' ? raw.trim() : '';
  return value || path.join(os.tmpdir(), 'theway');
};

const appendJsonLine = async (fileName, row) => {
  const dir = getDataDir();
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  const line = `${safeStringify(row)}\n`;
  await fs.appendFile(filePath, line, { encoding: 'utf8' });
};

const serveFile = async (res, filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const ct = mimeByExt[ext] ?? 'application/octet-stream';
  const data = await fs.readFile(filePath);
  res.statusCode = 200;
  res.setHeader('Content-Type', ct);
  res.end(data);
};

const fetchJson = async (url, init) => {
  try {
    const resp = await fetch(url, init);
    const text = await resp.text();
    let json = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }
    return { ok: resp.ok, status: resp.status, text, json };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, status: 0, text: message, json: null };
  }
};

const authAdminHeaders = (adminKey) => {
  const key = String(adminKey || '').trim();
  if (!key) return {};
  return { apikey: key, Authorization: `Bearer ${key}` };
};

const postgrestHeaderCandidates = (adminKey) => {
  const key = String(adminKey || '').trim();
  if (!key) return [{}];
  const isJwtLike = key.startsWith('eyJ') && key.split('.').length === 3;
  const isSbSecret = key.startsWith('sb_secret_');
  if (isJwtLike) return [{ apikey: key, Authorization: `Bearer ${key}` }];
  if (isSbSecret) return [{ apikey: key }, { apikey: key, Authorization: `Bearer ${key}` }];
  return [{ apikey: key }];
};

const validateSupabaseEnv = (supabaseUrl, serviceKey) => {
  const url = typeof supabaseUrl === 'string' ? supabaseUrl.trim() : '';
  const key = typeof serviceKey === 'string' ? serviceKey.trim() : '';
  if (!url || !key) return 'Supabase is not configured';
  if (!/^https?:\/\//i.test(url)) {
    return 'SUPABASE_URL is invalid. It must be the Supabase Project URL (https://xxxxx.supabase.co). You likely pasted a key by mistake.';
  }
  if (key.startsWith('sb_publishable_')) {
    return 'SUPABASE_SERVICE_ROLE_KEY is wrong. You pasted the publishable (public) key. It must be the secret key.';
  }
  if (/^https?:\/\//i.test(key)) {
    return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It must be the Supabase service role key.';
  }
  if (/\s/.test(key)) {
    return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It contains whitespace/new lines. Paste the key as a single line.';
  }
  return '';
};

const getBearer = (headers) => {
  const raw = headers?.authorization || headers?.Authorization;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return '';
  const m = String(value).match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? '';
};

const getAdminEnv = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  const err = validateSupabaseEnv(supabaseUrl, serviceKey);
  if (err) return { ok: false, error: err };
  const base = String(supabaseUrl || '').replace(/\/$/, '');
  const adminKey = String(serviceKey || '').trim();
  return { ok: true, base, adminKey, postgrestHeaderCandidates: postgrestHeaderCandidates(adminKey), authAdminHeaders: authAdminHeaders(adminKey) };
};

const getCallerId = async (base, adminKey, token) => {
  const who = await fetchJson(`${base}/auth/v1/user`, {
    method: 'GET',
    headers: { apikey: adminKey, Authorization: `Bearer ${token}` },
  });
  const id = (who.ok && who.json && typeof who.json === 'object' && typeof who.json.id === 'string') ? who.json.id : '';
  return { ok: Boolean(id), id };
};

const fetchPostgrest = async (candidates, url, init) => {
  let last = await fetchJson(url, { ...init, headers: { ...(init.headers ?? {}), ...(candidates[0] ?? {}) } });
  for (let i = 1; i < candidates.length; i += 1) {
    if (last.ok) return last;
    if (last.status !== 401 && last.status !== 403) return last;
    last = await fetchJson(url, { ...init, headers: { ...(init.headers ?? {}), ...(candidates[i] ?? {}) } });
  }
  return last;
};

const getCallerRole = async (base, pgHeaderCandidates, userId) => {
  const r = await fetchPostgrest(pgHeaderCandidates, `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role&limit=1`, {
    method: 'GET',
  });
  const role =
    (r.ok && Array.isArray(r.json) && r.json[0] && typeof r.json[0] === 'object' && typeof r.json[0].role === 'string')
      ? r.json[0].role
      : '';
  return { ok: Boolean(role), role, details: r.ok ? null : (r.text?.slice(0, 250) ?? null) };
};

const ensureSingleProfileRow = async (base, pgHeaderCandidates, userId, patch) => {
  const read = await fetchPostgrest(pgHeaderCandidates, `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id&limit=1`, {
    method: 'GET',
  });
  if (read.ok && Array.isArray(read.json) && read.json.length > 0) {
    return fetchPostgrest(pgHeaderCandidates, `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    });
  }
  return fetchPostgrest(pgHeaderCandidates, `${base}/rest/v1/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ id: userId, ...patch }),
  });
};

const bootstrapDefaultCeo = async () => {
  try {
    const enabled = String(process.env.AUTO_BOOTSTRAP_CEO || '').toLowerCase() === 'true';
    if (!enabled) {
      globalThis.__ceoBootstrapLast = { at: new Date().toISOString(), enabled: false };
      return;
    }

    const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
    const adminKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    if (!supabaseUrl || !adminKey) {
      globalThis.__ceoBootstrapLast = { at: new Date().toISOString(), enabled: true, ok: false, step: 'env', error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' };
      return;
    }
    if (!/^https?:\/\//i.test(supabaseUrl)) {
      globalThis.__ceoBootstrapLast = { at: new Date().toISOString(), enabled: true, ok: false, step: 'env', error: 'SUPABASE_URL is invalid' };
      return;
    }

    const base = supabaseUrl.replace(/\/$/, '');
    const authHeaders = authAdminHeaders(adminKey);
    const pgHeaderCandidates = postgrestHeaderCandidates(adminKey);

    const existing = await fetchPostgrest(pgHeaderCandidates, `${base}/rest/v1/profiles?role=eq.ceo&select=id,username&limit=1`, { method: 'GET' });
    globalThis.__ceoBootstrapLast = { at: new Date().toISOString(), enabled: true, step: 'check', existingStatus: existing.status, existingOk: existing.ok };

    const email = String(process.env.AUTO_BOOTSTRAP_CEO_EMAIL || 'ceo@theway.ge').trim();
    const password = String(process.env.AUTO_BOOTSTRAP_CEO_PASSWORD || 'ceo123').trim();
    const username = String(process.env.AUTO_BOOTSTRAP_CEO_USERNAME || 'ceo').trim();
    const name = String(process.env.AUTO_BOOTSTRAP_CEO_NAME || 'CEO').trim();
    void String(process.env.AUTO_BOOTSTRAP_CEO_2FA_CODE || '').trim();

    const foundExisting = existing.ok && Array.isArray(existing.json) && existing.json.length > 0 && existing.json[0] && typeof existing.json[0].id === 'string';
    let id = foundExisting ? String(existing.json[0].id) : '';

    if (!id) {
      const created = await fetchJson(`${base}/auth/v1/admin/users`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { role: 'ceo', username, name } }),
      });
      if (!created.ok || !created.json || typeof created.json.id !== 'string') {
        const text = created.text || '';
        if (text.includes('users_email_partial_key') || text.includes('duplicate key value') || text.includes('"code":"23505"')) {
          globalThis.__ceoBootstrapLast = { at: new Date().toISOString(), enabled: true, ok: true, step: 'email_exists', note: 'Email already exists in Auth; role will be upgraded on login via AUTO_BOOTSTRAP_CEO_EMAIL/USERNAME' };
          return;
        }
        console.error('CEO bootstrap failed (create user)', created.status, created.text);
        globalThis.__ceoBootstrapLast = { at: new Date().toISOString(), enabled: true, ok: false, step: 'create_user', status: created.status, error: created.text?.slice(0, 300) };
        return;
      }
      id = created.json.id;
    } else {
      const authUser = await fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: authHeaders,
      });
      const existingEmail =
        (authUser.ok && authUser.json && typeof authUser.json === 'object' && typeof authUser.json.email === 'string')
          ? authUser.json.email
          : '';
      if (existingEmail && email && existingEmail.toLowerCase() !== email.toLowerCase()) {
        globalThis.__ceoBootstrapLast = {
          at: new Date().toISOString(),
          enabled: true,
          ok: true,
          step: 'skip_update_mismatch',
          note: 'Existing CEO profile belongs to a different Auth user; not changing that user. Use AUTO_BOOTSTRAP_CEO_EMAIL + login to promote your account.',
          existingEmail,
          desiredEmail: email,
        };
        return;
      }
      const updatedUser = await fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, email_confirm: true, user_metadata: { role: 'ceo', username, name } }),
      });
      if (!updatedUser.ok) {
        const text = updatedUser.text || '';
        if (text.includes('users_email_partial_key') || text.includes('duplicate key value') || text.includes('"code":"23505"')) {
          globalThis.__ceoBootstrapLast = { at: new Date().toISOString(), enabled: true, ok: true, step: 'update_user_skipped', note: 'Skipped changing email because it belongs to another Auth user' };
        } else {
          console.error('CEO bootstrap failed (update user)', updatedUser.status, updatedUser.text);
          globalThis.__ceoBootstrapLast = { at: new Date().toISOString(), enabled: true, ok: false, step: 'update_user', status: updatedUser.status, error: updatedUser.text?.slice(0, 300) };
        }
      }
    }

    const prof = await ensureSingleProfileRow(base, pgHeaderCandidates, id, { username, role: 'ceo', name });
    if (!prof.ok) {
      console.error('CEO bootstrap failed (profile)', prof.status, prof.text);
      globalThis.__ceoBootstrapLast = { at: new Date().toISOString(), enabled: true, ok: false, step: 'upsert_profile', status: prof.status, error: prof.text?.slice(0, 300) };
      return;
    }
    globalThis.__ceoBootstrapLast = { at: new Date().toISOString(), enabled: true, ok: true, step: 'done', id, username, email };
  } catch (e) {
    console.error('CEO bootstrap threw', e);
    const message = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    globalThis.__ceoBootstrapLast = { at: new Date().toISOString(), enabled: true, ok: false, step: 'exception', error: message.slice(0, 300) };
  }
};

const exists = async (p) => {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
};

const inlineApply = async (apiReq, apiRes) => {
  const now = new Date().toISOString();
  const appId = String(Date.now());
  const body = (apiReq.body && typeof apiReq.body === 'object') ? apiReq.body : {};
  const sourceRaw = typeof body.source === 'string' ? body.source.trim() : '';
  const source = (sourceRaw === 'agency' || sourceRaw === 'public') ? sourceRaw : 'public';

  const app = {
    id: appId,
    studentId: null,
    name: typeof body.name === 'string' ? body.name.slice(0, 120) : '',
    email: typeof body.email === 'string' ? body.email.slice(0, 254) : '',
    phone: typeof body.phone === 'string' ? body.phone.slice(0, 40) : '',
    country: typeof body.country === 'string' ? body.country.slice(0, 80) : '',
    program: typeof body.program === 'string' ? body.program.slice(0, 120) : '',
    university: typeof body.university === 'string' ? (body.university.slice(0, 80) || null) : null,
    status: 'submitted',
    stage: 'applied',
    createdAt: typeof body.createdAt === 'string' ? body.createdAt.slice(0, 40) : now,
    internalNotes: body.internalNotes ?? null,
    events: body.events ?? [{ id: `${appId}-submitted`, type: 'submitted', byId: null, byName: source === 'agency' ? 'Agency' : 'Website', time: now, details: source === 'agency' ? 'Agency submission' : 'Public submission' }],
    hold: null,
    approvedBy: null,
    approvedAt: null,
    ownerId: null,
    salesOwnerId: null,
    assignedStaffId: null,
    source,
    agencyId: null,
    contactEmail: typeof body.contactEmail === 'string' ? body.contactEmail.slice(0, 254) : null,
    studentEmail: typeof body.studentEmail === 'string' ? body.studentEmail.slice(0, 254) : null,
    intakeDetails: typeof body.intakeDetails === 'string' ? body.intakeDetails.slice(0, 20_000) : null,
    intakeAttachments: Array.isArray(body.intakeAttachments) ? body.intakeAttachments : null,
    intakeVideoUrl: typeof body.intakeVideoUrl === 'string' ? body.intakeVideoUrl.slice(0, 2000) : null,
    intakePassportCopy: typeof body.intakePassportCopy === 'string' ? body.intakePassportCopy.slice(0, 2000) : null,
    intakeHighSchoolCertificate: typeof body.intakeHighSchoolCertificate === 'string' ? body.intakeHighSchoolCertificate.slice(0, 2000) : null,
    intakeSLARewarded: Boolean(body.intakeSLARewarded),
    arrived: Boolean(body.arrived),
    intakeExtraDocs: Array.isArray(body.intakeExtraDocs) ? body.intakeExtraDocs : null,
  };

  try {
    await appendJsonLine('applications.jsonl', { ...app, receivedAt: now });
  } catch (e) {
    const g = globalThis;
    if (!g.__fallbackApps) g.__fallbackApps = [];
    g.__fallbackApps.push({ ...app, receivedAt: now, error: e instanceof Error ? e.message : String(e) });
  }

  apiRes.status(200).json({ id: appId });
};

const inlineLookupEmail = async (apiReq, apiRes) => {
  if (apiReq.method !== 'POST') {
    apiRes.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const env = getAdminEnv();
  if (!env.ok) {
    apiRes.status(500).json({ error: env.error });
    return;
  }

  const { base, adminKey, postgrestHeaderCandidates: pgHeaderCandidates, authAdminHeaders: authHeaders } = env;
  const body = (apiReq.body && typeof apiReq.body === 'object') ? apiReq.body : {};
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  if (!username) {
    apiRes.status(400).json({ error: 'Missing username' });
    return;
  }

  if (username.includes('@')) {
    apiRes.status(200).json({ email: username });
    return;
  }

  const autoCeoEmail = String(process.env.AUTO_BOOTSTRAP_CEO_EMAIL || '').trim();
  const autoCeoUsername = String(process.env.AUTO_BOOTSTRAP_CEO_USERNAME || '').trim();
  if (autoCeoEmail && autoCeoUsername && autoCeoUsername.toLowerCase() === username.toLowerCase()) {
    apiRes.status(200).json({ email: autoCeoEmail });
    return;
  }

  const readProfileByUsername = async (operator) => {
    const q = `${base}/rest/v1/profiles?username=${operator}.${encodeURIComponent(username)}&select=id&limit=1`;
    const r = await fetchPostgrest(pgHeaderCandidates, q, { method: 'GET' });
    if (!r.ok || !Array.isArray(r.json) || !r.json[0] || typeof r.json[0] !== 'object') return null;
    const row = r.json[0];
    const id = typeof row.id === 'string' ? row.id : '';
    return { id };
  };

  const profile = (await readProfileByUsername('eq')) ?? (await readProfileByUsername('ilike'));
  const usernameLower = username.toLowerCase();

  const readAuthUserById = async (userId) => {
    const authUser = await fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: authHeaders,
    });
    const authEmail =
      (authUser.ok && authUser.json && typeof authUser.json === 'object' && typeof authUser.json.email === 'string')
        ? String(authUser.json.email)
        : '';
    const meta = (authUser.ok && authUser.json && typeof authUser.json === 'object' && authUser.json.user_metadata && typeof authUser.json.user_metadata === 'object')
      ? authUser.json.user_metadata
      : null;
    const metaRole = (meta && typeof meta.role === 'string') ? meta.role : '';
    const metaUsername = (meta && typeof meta.username === 'string') ? meta.username : '';
    const metaName = (meta && typeof meta.name === 'string') ? meta.name : '';
    return { ok: authUser.ok, email: authEmail, role: metaRole, username: metaUsername, name: metaName, rawText: authUser.text };
  };

  const findAuthUserByUsername = async () => {
    const perPage = 200;
    for (let page = 1; page <= 10; page += 1) {
      const r = await fetchJson(`${base}/auth/v1/admin/users?page=${page}&per_page=${perPage}`, {
        method: 'GET',
        headers: authHeaders,
      });
      if (!r.ok) return null;
      const users = Array.isArray(r.json)
        ? r.json
        : (r.json && typeof r.json === 'object' && Array.isArray(r.json.users) ? r.json.users : []);
      if (!Array.isArray(users) || users.length === 0) return null;
      for (const u of users) {
        const obj = (u && typeof u === 'object') ? u : null;
        if (!obj) continue;
        const email = typeof obj.email === 'string' ? obj.email : '';
        const id = typeof obj.id === 'string' ? obj.id : '';
        const meta = (obj.user_metadata && typeof obj.user_metadata === 'object') ? obj.user_metadata : null;
        const metaUsername = meta && typeof meta.username === 'string' ? meta.username : '';
        if (metaUsername && metaUsername.toLowerCase() === usernameLower && email && id) return { id, email, meta };
        if (email && email.includes('@')) {
          const local = email.split('@')[0].toLowerCase();
          if (local === usernameLower && id) return { id, email, meta };
        }
      }
      if (users.length < perPage) return null;
    }
    return null;
  };

  if (!profile || !profile.id) {
    const found = await findAuthUserByUsername();
    if (!found) {
      apiRes.status(200).json({ email: '' });
      return;
    }
    const meta = (found.meta && typeof found.meta === 'object') ? found.meta : null;
    const metaRole = meta && typeof meta.role === 'string' ? meta.role : '';
    const metaName = meta && typeof meta.name === 'string' ? meta.name : '';
    const allowedRoles = new Set(['ceo', 'sales', 'ops', 'staff', 'agency_staff', 'agency', 'student']);
    const role = (metaRole && allowedRoles.has(metaRole)) ? metaRole : 'student';
    const name = typeof metaName === 'string' ? metaName : '';
    await ensureSingleProfileRow(base, pgHeaderCandidates, found.id, { username, role, ...(name ? { name } : {}) });
    apiRes.status(200).json({ email: found.email });
    return;
  }

  const auth = await readAuthUserById(profile.id);
  const authEmail = auth.email;
  if (!authEmail) {
    const found = await findAuthUserByUsername();
    if (!found || !found.email) {
      apiRes.status(500).json({
        error: 'User exists but could not read email from Supabase Auth. Make sure SUPABASE_SERVICE_ROLE_KEY is correct.',
      });
      return;
    }
    apiRes.status(200).json({ email: found.email });
    return;
  }

  apiRes.status(200).json({ email: authEmail });
};

const inlineMeProfile = async (apiReq, apiRes) => {
  if (apiReq.method !== 'GET') {
    apiRes.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const token = getBearer(apiReq.headers);
  if (!token) {
    apiRes.status(401).json({ error: 'Missing token' });
    return;
  }
  const env = getAdminEnv();
  if (!env.ok) {
    apiRes.status(500).json({ error: env.error });
    return;
  }
  const { base, adminKey, postgrestHeaderCandidates: pgHeaderCandidates, authAdminHeaders: authHeaders } = env;
  const caller = await getCallerId(base, adminKey, token);
  if (!caller.ok) {
    apiRes.status(401).json({ error: 'Invalid token' });
    return;
  }
  const authUser = await fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(caller.id)}`, {
    method: 'GET',
    headers: authHeaders,
  });
  const email = (authUser.ok && authUser.json && typeof authUser.json === 'object' && typeof authUser.json.email === 'string') ? authUser.json.email : '';
  const meta = (authUser.ok && authUser.json && typeof authUser.json === 'object' && authUser.json.user_metadata && typeof authUser.json.user_metadata === 'object')
    ? authUser.json.user_metadata
    : null;
  const metaRole = (meta && typeof meta.role === 'string') ? meta.role : '';
  const metaUsername = (meta && typeof meta.username === 'string') ? meta.username : '';
  const metaName = (meta && typeof meta.name === 'string') ? meta.name : '';
  const allowedRoles = new Set(['ceo', 'sales', 'ops', 'staff', 'agency_staff', 'agency', 'student']);
  const autoCeoEmail = String(process.env.AUTO_BOOTSTRAP_CEO_EMAIL || '').trim().toLowerCase();
  const autoCeoUsername = String(process.env.AUTO_BOOTSTRAP_CEO_USERNAME || '').trim().toLowerCase();
  const isAutoCeo =
    Boolean(email && autoCeoEmail && email.toLowerCase() === autoCeoEmail) ||
    Boolean(metaUsername && autoCeoUsername && metaUsername.toLowerCase() === autoCeoUsername);
  const roleGuess = (allowedRoles.has(metaRole) && metaRole) ? metaRole : (isAutoCeo ? 'ceo' : 'student');
  const usernameGuess = metaUsername || ((email && email.includes('@')) ? email.split('@')[0].slice(0, 20) : `u${caller.id.slice(0, 8)}`);
  const nameGuess = metaName || (isAutoCeo ? 'CEO' : '');

  let p = await fetchPostgrest(pgHeaderCandidates, `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(caller.id)}&select=id,username,role,name&limit=1`, { method: 'GET' });
  if (!p.ok && (p.status === 401 || p.status === 403)) {
    apiRes.status(500).json({ error: 'Failed to read profiles (admin key not accepted)', details: p.text?.slice(0, 250) });
    return;
  }

  const rowExisting = (p.ok && Array.isArray(p.json) && p.json[0] && typeof p.json[0] === 'object') ? p.json[0] : null;
  const existingRole = rowExisting && typeof rowExisting.role === 'string' ? rowExisting.role : '';
  const existingUsername = rowExisting && typeof rowExisting.username === 'string' ? rowExisting.username : '';
  const existingName = rowExisting && typeof rowExisting.name === 'string' ? rowExisting.name : '';

  const shouldUpgradeRole =
    Boolean(roleGuess) &&
    Boolean(existingRole) &&
    existingRole !== roleGuess &&
    (existingRole === 'student' || existingRole === '');
  const shouldFillMissing = !existingUsername || !existingRole;

  if (!rowExisting || shouldUpgradeRole || shouldFillMissing) {
    const upserted = await ensureSingleProfileRow(base, pgHeaderCandidates, caller.id, {
      username: existingUsername || usernameGuess,
      role: (shouldUpgradeRole || !existingRole) ? roleGuess : existingRole,
      name: existingName || nameGuess,
    });
    if (!upserted.ok) {
      apiRes.status(500).json({ error: 'Failed to create profile', details: upserted.text?.slice(0, 250) });
      return;
    }
    void fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(caller.id)}`, {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_metadata: { role: roleGuess, username: existingUsername || usernameGuess, name: existingName || nameGuess } }),
    });
    p = await fetchPostgrest(pgHeaderCandidates, `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(caller.id)}&select=id,username,role,name&limit=1`, { method: 'GET' });
  }

  if (!p.ok || !Array.isArray(p.json) || !p.json[0] || typeof p.json[0] !== 'object') {
    apiRes.status(404).json({ error: 'Profile not found', details: p.text?.slice(0, 250) });
    return;
  }
  const row = p.json[0];
  apiRes.status(200).json({
    user: {
      id: typeof row.id === 'string' ? row.id : String(row.id ?? ''),
      username: typeof row.username === 'string' ? row.username : '',
      role: typeof row.role === 'string' ? row.role : '',
      name: typeof row.name === 'string' ? row.name : '',
    },
  });
};

const inlineUsersList = async (apiReq, apiRes) => {
  if (apiReq.method !== 'GET') {
    apiRes.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const token = getBearer(apiReq.headers);
  if (!token) {
    apiRes.status(401).json({ error: 'Missing token' });
    return;
  }
  const env = getAdminEnv();
  if (!env.ok) {
    apiRes.status(500).json({ error: env.error });
    return;
  }
  const { base, adminKey, postgrestHeaderCandidates: pgHeaderCandidates } = env;
  const caller = await getCallerId(base, adminKey, token);
  if (!caller.ok) {
    apiRes.status(401).json({ error: 'Invalid token' });
    return;
  }
  const roleResp = await getCallerRole(base, pgHeaderCandidates, caller.id);
  const isInternal = ['ceo', 'sales', 'ops', 'staff', 'agency_staff'].includes(roleResp.role);
  if (!isInternal) {
    apiRes.status(403).json({ error: 'Forbidden' });
    return;
  }
  const r = await fetchPostgrest(pgHeaderCandidates, `${base}/rest/v1/profiles?select=id,username,role,name&limit=5000`, { method: 'GET' });
  if (!r.ok || !Array.isArray(r.json)) {
    apiRes.status(500).json({ error: 'Failed to load users', details: r.text?.slice(0, 300) });
    return;
  }
  const users = r.json
    .filter((x) => x && typeof x === 'object')
    .map((row) => ({
      id: typeof row.id === 'string' ? row.id : String(row.id ?? ''),
      username: typeof row.username === 'string' ? row.username : '',
      role: typeof row.role === 'string' ? row.role : '',
      name: typeof row.name === 'string' ? row.name : '',
    }));
  apiRes.status(200).json({ users });
};

const inlineAdminUpdateProfile = async (apiReq, apiRes) => {
  if (apiReq.method !== 'POST') {
    apiRes.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const token = getBearer(apiReq.headers);
  if (!token) {
    apiRes.status(401).json({ error: 'Missing token' });
    return;
  }
  const env = getAdminEnv();
  if (!env.ok) {
    apiRes.status(500).json({ error: env.error });
    return;
  }
  const { base, adminKey, postgrestHeaderCandidates: pgHeaderCandidates, authAdminHeaders: authHeaders } = env;
  const caller = await getCallerId(base, adminKey, token);
  if (!caller.ok) {
    apiRes.status(401).json({ error: 'Invalid token' });
    return;
  }
  const roleResp = await getCallerRole(base, pgHeaderCandidates, caller.id);
  if (roleResp.role !== 'ceo') {
    apiRes.status(403).json({ error: 'Forbidden' });
    return;
  }
  const body = (apiReq.body && typeof apiReq.body === 'object') ? apiReq.body : {};
  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const role = typeof body.role === 'string' ? body.role.trim() : '';
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  if (!userId) {
    apiRes.status(400).json({ error: 'Missing userId' });
    return;
  }
  const patch = {};
  if (name) patch.name = name;
  if (username) patch.username = username;
  if (role) patch.role = role;
  if (Object.keys(patch).length === 0) {
    apiRes.status(400).json({ error: 'No updates' });
    return;
  }
  const updated = await fetchPostgrest(pgHeaderCandidates, `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(patch),
  });
  if (!updated.ok) {
    apiRes.status(500).json({ error: 'Failed to update profile', details: updated.text?.slice(0, 300) });
    return;
  }
  void fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_metadata: { username: username || undefined, role: role || undefined, name: name || undefined } }),
  });
  apiRes.status(200).json({ ok: true });
};

const inlineBootstrapUpsertProfile = async (apiReq, apiRes) => {
  if (apiReq.method !== 'POST') {
    apiRes.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const bootstrapSecret = String(process.env.BOOTSTRAP_SECRET || '').trim();
  const provided = String(apiReq.headers?.['x-bootstrap-secret'] || '').trim();
  if (!bootstrapSecret || !provided || provided !== bootstrapSecret) {
    apiRes.status(403).json({ error: 'Forbidden' });
    return;
  }
  const env = getAdminEnv();
  if (!env.ok) {
    apiRes.status(500).json({ error: env.error });
    return;
  }
  const { base, postgrestHeaderCandidates: pgHeaderCandidates, authAdminHeaders: authHeaders } = env;
  const body = (apiReq.body && typeof apiReq.body === 'object') ? apiReq.body : {};
  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  const role = typeof body.role === 'string' ? body.role.trim() : '';
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!userId || !role || !username) {
    apiRes.status(400).json({ error: 'Missing fields' });
    return;
  }
  const allowed = new Set(['ceo', 'sales', 'ops', 'staff', 'agency_staff', 'agency', 'student']);
  if (!allowed.has(role)) {
    apiRes.status(400).json({ error: 'Invalid role' });
    return;
  }
  const prof = await ensureSingleProfileRow(base, pgHeaderCandidates, userId, { role, username, ...(name ? { name } : {}) });
  if (!prof.ok) {
    apiRes.status(500).json({ error: 'Failed to upsert profile', details: prof.text?.slice(0, 300) });
    return;
  }
  const meta = await fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_metadata: { role, username, name } }),
  });
  if (!meta.ok) {
    apiRes.status(200).json({ ok: true, warning: 'Profile updated but failed to update auth metadata', details: meta.text?.slice(0, 300) });
    return;
  }
  apiRes.status(200).json({ ok: true });
};

const inlineBootstrapFixAuth = async (apiReq, apiRes) => {
  if (apiReq.method !== 'POST') {
    apiRes.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const bootstrapSecret = String(process.env.BOOTSTRAP_SECRET || '').trim();
  const provided = String(apiReq.headers?.['x-bootstrap-secret'] || '').trim();
  if (!bootstrapSecret || !provided || provided !== bootstrapSecret) {
    apiRes.status(403).json({ error: 'Forbidden' });
    return;
  }
  const env = getAdminEnv();
  if (!env.ok) {
    apiRes.status(500).json({ error: env.error });
    return;
  }
  const { base, authAdminHeaders: authHeaders, postgrestHeaderCandidates: pgHeaderCandidates } = env;
  const body = (apiReq.body && typeof apiReq.body === 'object') ? apiReq.body : {};
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password.trim() : '';
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const role = typeof body.role === 'string' ? body.role.trim() : 'ceo';
  if (!email || !password || !username) {
    apiRes.status(400).json({ error: 'Missing fields (email, password, username are required)' });
    return;
  }
  const allowed = new Set(['ceo', 'sales', 'ops', 'staff', 'agency_staff', 'agency', 'student']);
  if (!allowed.has(role)) {
    apiRes.status(400).json({ error: 'Invalid role' });
    return;
  }

  const findAuthUserByEmail = async () => {
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
        : (r.json && typeof r.json === 'object' && Array.isArray(r.json.users) ? r.json.users : []);
      if (!Array.isArray(users) || users.length === 0) return null;
      for (const u of users) {
        const obj = (u && typeof u === 'object') ? u : null;
        if (!obj) continue;
        const uEmail = typeof obj.email === 'string' ? obj.email : '';
        const id = typeof obj.id === 'string' ? obj.id : '';
        if (id && uEmail && uEmail.toLowerCase() === target) return { id, email: uEmail };
      }
      if (users.length < perPage) return null;
    }
    return null;
  };

  const authUser = await findAuthUserByEmail();
  if (!authUser) {
    apiRes.status(404).json({ error: 'Auth user not found for this email' });
    return;
  }

  const updated = await fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(authUser.id)}`, {
    method: 'PUT',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, email_confirm: true, user_metadata: { role, username, ...(name ? { name } : {}) } }),
  });
  if (!updated.ok) {
    apiRes.status(500).json({ error: 'Failed to update auth user', details: updated.text?.slice(0, 300) });
    return;
  }

  const prof = await ensureSingleProfileRow(base, pgHeaderCandidates, authUser.id, { role, username, ...(name ? { name } : {}) });
  if (!prof.ok) {
    apiRes.status(500).json({ error: 'Failed to upsert profile', details: prof.text?.slice(0, 300) });
    return;
  }

  apiRes.status(200).json({ ok: true, userId: authUser.id, email: authUser.email, role, username });
};

const handleApi = async (req, res, route) => {
  const file = path.join(apiBuildDir, `${route}.js`);

  const rawBody = await readBody(req);
  const contentType = String(req.headers['content-type'] ?? '');
  let body = undefined;
  if (rawBody.length > 0) {
    if (contentType.includes('application/json')) {
      try {
        body = JSON.parse(rawBody.toString('utf-8'));
      } catch {
        body = undefined;
      }
    } else {
      body = rawBody;
    }
  }

  const apiReq = {
    method: req.method,
    headers: {
      ...toHeadersRecord(req.headers),
      'x-forwarded-for': req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? 'unknown',
    },
    body,
  };

  let statusCode = 200;
  const apiRes = {
    status: (code) => {
      statusCode = code;
      return apiRes;
    },
    json: (payload) => {
      serveJson(res, statusCode, payload);
    },
  };

  try {
    if (route === 'apply') {
      await inlineApply(apiReq, apiRes);
      return;
    }
    if (route === 'lookup-email') {
      await inlineLookupEmail(apiReq, apiRes);
      return;
    }
    if (route === 'me-profile') {
      await inlineMeProfile(apiReq, apiRes);
      return;
    }
    if (route === 'users-list') {
      await inlineUsersList(apiReq, apiRes);
      return;
    }
    if (route === 'admin-update-profile') {
      await inlineAdminUpdateProfile(apiReq, apiRes);
      return;
    }
    if (route === 'bootstrap-upsert-profile') {
      await inlineBootstrapUpsertProfile(apiReq, apiRes);
      return;
    }
    if (route === 'bootstrap-fix-auth') {
      await inlineBootstrapFixAuth(apiReq, apiRes);
      return;
    }
    if (!(await exists(file))) {
      serveJson(res, 404, { error: 'Not found' });
      return;
    }
    const mod = await import(pathToFileURL(file).href);
    const handler = mod.default;
    if (typeof handler !== 'function') {
      serveJson(res, 500, { error: 'Handler not found' });
      return;
    }
    await handler(apiReq, apiRes);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    serveJson(res, 500, { error: message });
  }
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname === '/api' || pathname.startsWith('/api/')) {
      const route = pathname.replace(/^\/api\/?/, '').trim();
      await handleApi(req, res, route || 'index');
      return;
    }

    if (pathname === '/healthz') {
      serveJson(res, 200, {
        ok: true,
        inlineApply: true,
        dataDir: getDataDir(),
        gitCommit: process.env.RENDER_GIT_COMMIT ?? process.env.GIT_COMMIT ?? null,
        node: process.version,
        ceoBootstrap: getHealthBootstrapInfo(),
      });
      return;
    }

    const safePath = pathname.replace(/^\//, '');
    const candidate = path.join(distDir, safePath);
    if (safePath && (await exists(candidate)) && !(await fs.stat(candidate)).isDirectory()) {
      await serveFile(res, candidate);
      return;
    }

    const indexFile = path.join(distDir, 'index.html');
    if (await exists(indexFile)) {
      await serveFile(res, indexFile);
      return;
    }

    serveJson(res, 500, { error: 'dist/ not found. Run: npm run build' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    serveJson(res, 500, { error: message });
  }
});

const port = Number(process.env.PORT ?? 4173);
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  void bootstrapDefaultCeo();
});
