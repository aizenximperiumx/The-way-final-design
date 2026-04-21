import http from 'node:http';
import { promises as fs } from 'node:fs';
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

const serveFile = async (res, filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const ct = mimeByExt[ext] ?? 'application/octet-stream';
  const data = await fs.readFile(filePath);
  res.statusCode = 200;
  res.setHeader('Content-Type', ct);
  res.end(data);
};

const exists = async (p) => {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
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
      serveJson(res, 200, { ok: true });
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
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${port}`);
});

