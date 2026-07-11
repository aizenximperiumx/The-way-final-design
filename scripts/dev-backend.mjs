// ─────────────────────────────────────────────────────────────────────────────
// LOCAL DEV/TEST BACKEND — a tiny in-memory mock of the Supabase endpoints the
// app uses (GoTrue auth, PostgREST profiles/app_state, admin users, storage).
// Lets you run and test the ENTIRE platform locally with seeded accounts,
// without touching the production Supabase project.
//
//   node scripts/dev-backend.mjs           (port 9999)
//
// Then run the app server against it:
//   SUPABASE_URL=http://localhost:9999
//   SUPABASE_SERVICE_ROLE_KEY=eyJdev.mock.key
//   SUPABASE_STORAGE_BUCKET=dev-bucket
//   node server.mjs
//
// And build the frontend with .env.local:
//   VITE_SUPABASE_URL=http://localhost:9999
//   VITE_SUPABASE_ANON_KEY=devanonkey
//
// Seeded accounts (password for all: dev12345):
//   ceo@dev.local (ceo) · sales@dev.local (sales) · ops@dev.local (ops)
//   khatia@dev.local (staff, username khatia) · mariami@dev.local (staff, username mariami)
//   agency@dev.local (agency) · support@dev.local (customer_support)
// NEVER deploy this file's URLs anywhere — dist/ and *.local are gitignored.
// ─────────────────────────────────────────────────────────────────────────────

import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.DEV_BACKEND_PORT ?? 9999);

// ── In-memory state ──────────────────────────────────────────────────────────
const users = new Map();     // id -> { id, email, password, app_metadata, user_metadata, created_at, banned }
const profiles = new Map();  // id -> { id, username, role, name, email }
const tokens = new Map();    // access_token -> userId
const appState = { org_id: 'default', state: {}, updated_at: null, updated_by: null };
const storage = new Map();   // path -> { bytes, contentType }

const uuid = () => crypto.randomUUID();

const seed = (email, password, role, username, name) => {
  const id = uuid();
  users.set(id, {
    id, email, password,
    app_metadata: { role, username, provider: 'email', providers: ['email'] },
    user_metadata: { username, name },
    created_at: new Date().toISOString(),
    aud: 'authenticated',
  });
  profiles.set(id, { id, username, role, name, email });
  return id;
};

seed('ceo@dev.local', 'dev12345', 'ceo', 'ceo', 'Ziad (CEO)');
seed('sales@dev.local', 'dev12345', 'sales', 'sales1', 'Sara Sales');
seed('ops@dev.local', 'dev12345', 'ops', 'ops1', 'Omar Ops');
seed('khatia@dev.local', 'dev12345', 'staff', 'khatia', 'Khatia');
seed('mariami@dev.local', 'dev12345', 'staff', 'mariami', 'Mariam');
seed('agency@dev.local', 'dev12345', 'agency', 'agency1', 'Global Study Agency');
seed('support@dev.local', 'dev12345', 'customer_support', 'support1', 'Selim Support');

// ── Helpers ──────────────────────────────────────────────────────────────────
const readBody = (req) => new Promise((resolve) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', () => resolve(Buffer.from('')));
});

const json = (res, code, body) => {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(body));
};

const getBearer = (req) => {
  const raw = req.headers.authorization || '';
  const m = String(raw).match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? '';
};

const publicUser = (u) => ({
  id: u.id,
  aud: 'authenticated',
  role: 'authenticated',
  email: u.email,
  email_confirmed_at: u.created_at,
  app_metadata: u.app_metadata,
  user_metadata: u.user_metadata,
  created_at: u.created_at,
  updated_at: u.created_at,
});

const makeSession = (u) => {
  const access_token = `devtok_${u.id}_${crypto.randomBytes(8).toString('hex')}`;
  const refresh_token = `devref_${crypto.randomBytes(8).toString('hex')}`;
  tokens.set(access_token, u.id);
  tokens.set(`refresh:${refresh_token}`, u.id);
  return {
    access_token,
    token_type: 'bearer',
    expires_in: 60 * 60 * 24 * 30,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    refresh_token,
    user: publicUser(u),
  };
};

const userFromToken = (token) => {
  const id = tokens.get(token);
  return id ? users.get(id) : null;
};

// Parse PostgREST-style filters: col=eq.value / col=ilike.value
const parseFilters = (searchParams) => {
  const filters = [];
  for (const [key, value] of searchParams.entries()) {
    if (['select', 'limit', 'offset', 'order'].includes(key)) continue;
    const m = value.match(/^(eq|ilike)\.(.*)$/s);
    if (m) filters.push({ col: key, op: m[1], val: m[2] });
  }
  return filters;
};

const matches = (row, filters) => filters.every(({ col, op, val }) => {
  const cell = row[col];
  if (op === 'eq') return String(cell ?? '') === val;
  if (op === 'ilike') return String(cell ?? '').toLowerCase() === val.toLowerCase().replace(/%/g, '');
  return false;
});

// ── Server ───────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const path = decodeURIComponent(url.pathname);
  const method = req.method ?? 'GET';

  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.end();
    return;
  }

  const rawBody = await readBody(req);
  let body = {};
  try { body = rawBody.length ? JSON.parse(rawBody.toString('utf8')) : {}; } catch { body = rawBody; }

  // Request log (helps debug sync races during testing).
  if (path === '/rest/v1/app_state' && (method === 'POST' || method === 'PATCH')) {
    const row = Array.isArray(body) ? body[0] : body;
    const apps = row?.state?.applications ?? [];
    const summary = apps.map((a) => `${a?.id}:${a?.status}${a?.pipeline ? ':' + a.pipeline.current : ''}`).join(',');
    console.log(`[${new Date().toISOString()}] ${method} app_state ← apps=[${summary}] ledger=${(row?.state?.pointsLedger ?? []).length} by=${row?.updated_by ?? '?'}`);
  } else {
    console.log(`[${new Date().toISOString()}] ${method} ${path}`);
  }

  try {
    // ── GoTrue: password sign-in / refresh ──
    if (path === '/auth/v1/token' && method === 'POST') {
      const grant = url.searchParams.get('grant_type');
      if (grant === 'password') {
        const email = String(body.email ?? '').toLowerCase();
        const password = String(body.password ?? '');
        const u = [...users.values()].find(x => x.email.toLowerCase() === email);
        if (!u || u.password !== password) {
          json(res, 400, { error: 'invalid_grant', error_description: 'Invalid login credentials', msg: 'Invalid login credentials' });
          return;
        }
        json(res, 200, makeSession(u));
        return;
      }
      if (grant === 'refresh_token') {
        const id = tokens.get(`refresh:${String(body.refresh_token ?? '')}`);
        const u = id ? users.get(id) : null;
        if (!u) { json(res, 400, { error: 'invalid_grant' }); return; }
        json(res, 200, makeSession(u));
        return;
      }
      json(res, 400, { error: 'unsupported_grant_type' });
      return;
    }

    // ── GoTrue: current user (verify token) ──
    if (path === '/auth/v1/user' && method === 'GET') {
      const u = userFromToken(getBearer(req));
      if (!u) { json(res, 401, { message: 'invalid token' }); return; }
      json(res, 200, publicUser(u));
      return;
    }

    // ── GoTrue: update own user (password change) ──
    if (path === '/auth/v1/user' && method === 'PUT') {
      const u = userFromToken(getBearer(req));
      if (!u) { json(res, 401, { message: 'invalid token' }); return; }
      if (typeof body.password === 'string' && body.password) u.password = body.password;
      json(res, 200, publicUser(u));
      return;
    }

    if (path === '/auth/v1/logout' && method === 'POST') {
      tokens.delete(getBearer(req));
      res.statusCode = 204;
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end();
      return;
    }

    // ── GoTrue admin: users collection ──
    if (path === '/auth/v1/admin/users' && method === 'GET') {
      const list = [...users.values()].map(publicUser);
      json(res, 200, { users: list, aud: 'authenticated' });
      return;
    }
    if (path === '/auth/v1/admin/users' && method === 'POST') {
      const email = String(body.email ?? '').toLowerCase();
      if ([...users.values()].some(x => x.email.toLowerCase() === email)) {
        json(res, 422, { code: '23505', msg: 'duplicate key value violates unique constraint "users_email_partial_key"' });
        return;
      }
      const id = uuid();
      const u = {
        id, email,
        password: String(body.password ?? 'changeme'),
        app_metadata: { provider: 'email', providers: ['email'], ...(body.app_metadata ?? {}) },
        user_metadata: { ...(body.user_metadata ?? {}) },
        created_at: new Date().toISOString(),
        aud: 'authenticated',
      };
      users.set(id, u);
      json(res, 200, publicUser(u));
      return;
    }
    const adminUserMatch = path.match(/^\/auth\/v1\/admin\/users\/([^/]+)$/);
    if (adminUserMatch) {
      const u = users.get(adminUserMatch[1]);
      if (!u) { json(res, 404, { msg: 'User not found' }); return; }
      if (method === 'GET') { json(res, 200, publicUser(u)); return; }
      if (method === 'PUT') {
        if (typeof body.password === 'string' && body.password) u.password = body.password;
        if (body.app_metadata && typeof body.app_metadata === 'object') u.app_metadata = { ...u.app_metadata, ...body.app_metadata };
        if (body.user_metadata && typeof body.user_metadata === 'object') u.user_metadata = { ...u.user_metadata, ...body.user_metadata };
        if (typeof body.email === 'string' && body.email) u.email = body.email;
        if (typeof body.ban_duration === 'string') u.banned = body.ban_duration !== 'none';
        json(res, 200, publicUser(u));
        return;
      }
      if (method === 'DELETE') { users.delete(u.id); profiles.delete(u.id); json(res, 200, {}); return; }
    }

    // ── PostgREST: profiles ──
    if (path === '/rest/v1/profiles') {
      if (method === 'GET') {
        const filters = parseFilters(url.searchParams);
        const limit = Number(url.searchParams.get('limit') ?? 10000);
        const rows = [...profiles.values()].filter(r => matches(r, filters)).slice(0, limit);
        json(res, 200, rows);
        return;
      }
      if (method === 'POST') {
        const rows = Array.isArray(body) ? body : [body];
        const out = [];
        for (const row of rows) {
          const id = String(row.id ?? uuid());
          const existing = profiles.get(id) ?? {};
          const next = { ...existing, ...row, id };
          profiles.set(id, next);
          out.push(next);
        }
        json(res, 201, out);
        return;
      }
      if (method === 'PATCH') {
        const filters = parseFilters(url.searchParams);
        const updated = [];
        for (const [id, row] of profiles) {
          if (!matches(row, filters)) continue;
          const next = { ...row, ...body, id };
          profiles.set(id, next);
          updated.push(next);
        }
        json(res, 200, updated);
        return;
      }
    }

    // ── PostgREST: app_state ──
    if (path === '/rest/v1/app_state') {
      if (method === 'GET') {
        json(res, 200, [{ org_id: appState.org_id, state: appState.state, updated_at: appState.updated_at }]);
        return;
      }
      if (method === 'POST' || method === 'PATCH') {
        const row = Array.isArray(body) ? body[0] : body;
        if (row && typeof row === 'object' && row.state && typeof row.state === 'object') {
          appState.state = row.state;
          appState.updated_at = row.updated_at ?? new Date().toISOString();
          appState.updated_by = row.updated_by ?? null;
        }
        json(res, 201, [{ org_id: 'default' }]);
        return;
      }
    }

    // ── Storage ──
    const storagePut = path.match(/^\/storage\/v1\/object\/([^/]+)\/(.+)$/);
    if (storagePut && (method === 'POST' || method === 'PUT') && !path.includes('/object/public/')) {
      const objectPath = `${storagePut[1]}/${storagePut[2]}`;
      storage.set(objectPath, {
        bytes: Buffer.isBuffer(body) ? body : rawBody,
        contentType: req.headers['content-type'] ?? 'application/octet-stream',
      });
      json(res, 200, { Key: objectPath });
      return;
    }
    const storageGet = path.match(/^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (storageGet && method === 'GET') {
      const objectPath = `${storageGet[1]}/${storageGet[2]}`;
      const obj = storage.get(objectPath);
      if (!obj) { json(res, 404, { error: 'Not found' }); return; }
      res.statusCode = 200;
      res.setHeader('Content-Type', obj.contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(obj.bytes);
      return;
    }
    // Signed URL creation → just return the public path (dev).
    const storageSign = path.match(/^\/storage\/v1\/object\/sign\/([^/]+)\/(.+)$/);
    if (storageSign && method === 'POST') {
      json(res, 200, { signedURL: `/object/public/${storageSign[1]}/${storageSign[2]}` });
      return;
    }

    json(res, 404, { error: `dev-backend: no route for ${method} ${path}` });
  } catch (e) {
    json(res, 500, { error: e instanceof Error ? e.message : String(e) });
  }
});

server.listen(PORT, () => {
  console.log(`Dev mock backend on http://localhost:${PORT}`);
  console.log('Accounts (password dev12345): ceo@dev.local sales@dev.local ops@dev.local khatia@dev.local mariami@dev.local agency@dev.local support@dev.local');
});
