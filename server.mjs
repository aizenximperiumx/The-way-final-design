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

const adminAuthHeaders = (adminKey) => {
  const key = String(adminKey || '').trim();
  const isJwtLike = key.startsWith('eyJ') && key.split('.').length === 3;
  const isSbSecret = key.startsWith('sb_secret_');
  return (isJwtLike || isSbSecret) ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
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
    const adminHeaders = adminAuthHeaders(adminKey);

    const existing = await fetchJson(`${base}/rest/v1/profiles?role=eq.ceo&select=id,email,username&limit=1`, {
      method: 'GET',
      headers: adminHeaders,
    });
    globalThis.__ceoBootstrapLast = { at: new Date().toISOString(), enabled: true, step: 'check', existingStatus: existing.status, existingOk: existing.ok };

    const email = String(process.env.AUTO_BOOTSTRAP_CEO_EMAIL || 'ceo@theway.ge').trim();
    const password = String(process.env.AUTO_BOOTSTRAP_CEO_PASSWORD || 'ceo123').trim();
    const username = String(process.env.AUTO_BOOTSTRAP_CEO_USERNAME || 'ceo').trim();
    const name = String(process.env.AUTO_BOOTSTRAP_CEO_NAME || 'CEO').trim();
    const twoFactorCodeRaw = String(process.env.AUTO_BOOTSTRAP_CEO_2FA_CODE || '').trim();
    const twoFactorCode = twoFactorCodeRaw ? twoFactorCodeRaw : null;

    const foundExisting = existing.ok && Array.isArray(existing.json) && existing.json.length > 0 && existing.json[0] && typeof existing.json[0].id === 'string';
    let id = foundExisting ? String(existing.json[0].id) : '';

    if (!id) {
      const created = await fetchJson(`${base}/auth/v1/admin/users`, {
        method: 'POST',
        headers: { ...adminHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, email_confirm: true }),
      });
      if (!created.ok || !created.json || typeof created.json.id !== 'string') {
        console.error('CEO bootstrap failed (create user)', created.status, created.text);
        globalThis.__ceoBootstrapLast = { at: new Date().toISOString(), enabled: true, ok: false, step: 'create_user', status: created.status, error: created.text?.slice(0, 300) };
        return;
      }
      id = created.json.id;
    } else {
      const updatedUser = await fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { ...adminHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, email_confirm: true }),
      });
      if (!updatedUser.ok) {
        console.error('CEO bootstrap failed (update user)', updatedUser.status, updatedUser.text);
        globalThis.__ceoBootstrapLast = { at: new Date().toISOString(), enabled: true, ok: false, step: 'update_user', status: updatedUser.status, error: updatedUser.text?.slice(0, 300) };
      }
    }

    const prof = await fetchJson(`${base}/rest/v1/profiles`, {
      method: 'POST',
      headers: { ...adminHeaders, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({
        id,
        email,
        username,
        role: 'ceo',
        name,
        two_factor_code: twoFactorCode,
        points: 0,
      }),
    });
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

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  const envError = validateSupabaseEnv(supabaseUrl, serviceKey);
  if (envError) {
    apiRes.status(500).json({ error: envError });
    return;
  }

  const base = String(supabaseUrl || '').replace(/\/$/, '');
  const adminKey = String(serviceKey || '').trim();
  const adminHeaders = adminAuthHeaders(adminKey);

  const body = (apiReq.body && typeof apiReq.body === 'object') ? apiReq.body : {};
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  if (!username) {
    apiRes.status(400).json({ error: 'Missing username' });
    return;
  }

  const readProfileByUsername = async (operator) => {
    const q = `${base}/rest/v1/profiles?username=${operator}.${encodeURIComponent(username)}&select=id,email&limit=1`;
    const r = await fetchJson(q, { method: 'GET', headers: adminHeaders });
    if (!r.ok || !Array.isArray(r.json) || !r.json[0] || typeof r.json[0] !== 'object') return null;
    const row = r.json[0];
    const id = typeof row.id === 'string' ? row.id : '';
    const email = typeof row.email === 'string' ? row.email : '';
    return { id, email };
  };

  const profile = (await readProfileByUsername('eq')) ?? (await readProfileByUsername('ilike'));
  if (!profile || !profile.id) {
    apiRes.status(200).json({ email: '' });
    return;
  }
  if (profile.email) {
    apiRes.status(200).json({ email: profile.email });
    return;
  }

  const authUser = await fetchJson(`${base}/auth/v1/admin/users/${encodeURIComponent(profile.id)}`, {
    method: 'GET',
    headers: adminHeaders,
  });
  const authEmail =
    (authUser.ok && authUser.json && typeof authUser.json === 'object' && typeof authUser.json.email === 'string')
      ? String(authUser.json.email)
      : '';
  if (!authEmail) {
    apiRes.status(500).json({
      error: 'User exists but email is missing in profiles, and could not read email from Supabase Auth. Make sure SUPABASE_SERVICE_ROLE_KEY is correct, or set profiles.email for this user.',
    });
    return;
  }

  void fetchJson(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(profile.id)}`, {
    method: 'PATCH',
    headers: { ...adminHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ email: authEmail }),
  });

  apiRes.status(200).json({ email: authEmail });
};

const handleApi = async (req, res, route) => {
  const file = path.join(apiBuildDir, `${route}.js`);
  if (!(await exists(file))) {
    serveJson(res, 404, { error: 'Not found' });
    return;
  }

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
