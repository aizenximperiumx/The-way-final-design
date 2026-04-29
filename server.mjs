import http from 'node:http';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
};

const adminAuthHeaders = (adminKey) => {
  const key = String(adminKey || '').trim();
  const isJwtLike = key.startsWith('eyJ') && key.split('.').length === 3;
  const isSbSecret = key.startsWith('sb_secret_');
  return (isJwtLike || isSbSecret) ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
};

const bootstrapDefaultCeo = async () => {
  const enabled = String(process.env.AUTO_BOOTSTRAP_CEO || '').toLowerCase() === 'true';
  if (!enabled) return;

  const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
  const adminKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!supabaseUrl || !adminKey) return;
  if (!/^https?:\/\//i.test(supabaseUrl)) return;

  const base = supabaseUrl.replace(/\/$/, '');
  const adminHeaders = adminAuthHeaders(adminKey);

  const existing = await fetchJson(`${base}/rest/v1/profiles?role=eq.ceo&select=id&limit=1`, {
    method: 'GET',
    headers: adminHeaders,
  });
  if (existing.ok && Array.isArray(existing.json) && existing.json.length > 0) return;

  const email = String(process.env.AUTO_BOOTSTRAP_CEO_EMAIL || 'ceo@theway.ge').trim();
  const password = String(process.env.AUTO_BOOTSTRAP_CEO_PASSWORD || 'ceo123').trim();
  const username = String(process.env.AUTO_BOOTSTRAP_CEO_USERNAME || 'ceo').trim();
  const name = String(process.env.AUTO_BOOTSTRAP_CEO_NAME || 'CEO').trim();

  const created = await fetchJson(`${base}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { ...adminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!created.ok || !created.json || typeof created.json.id !== 'string') {
    return;
  }

  const id = created.json.id;
  await fetchJson(`${base}/rest/v1/profiles`, {
    method: 'POST',
    headers: { ...adminHeaders, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      id,
      email,
      username,
      role: 'ceo',
      name,
      two_factor_code: null,
      points: 0,
    }),
  });
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
