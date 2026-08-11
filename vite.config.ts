import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

type ApiReq = { method?: string; headers?: Record<string, string | string[] | undefined>; body?: unknown };
type ApiRes = { status: (code: number) => ApiRes; json: (payload: unknown) => void };
type ApiHandler = (req: ApiReq, res: ApiRes) => unknown | Promise<unknown>;

function vercelApiPlugin(): Plugin {
  return {
    name: 'vercel-api-dev-middleware',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        try {
          const rawUrl = req.url || '/';
          const pathname = rawUrl.split('?')[0] || '/';
          const route = pathname.replace(/^\/+/, '').split('/')[0] || '';
          if (!route) return next();
          const filePath = path.resolve(projectRoot, 'api', `${route}.ts`);
          if (!fs.existsSync(filePath)) return next();

          const contentType = String(req.headers['content-type'] || '');
          const chunks: Buffer[] = [];
          await new Promise<void>((resolve) => {
            req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
            req.on('end', () => resolve());
          });
          const bodyText = Buffer.concat(chunks).toString('utf8');
          let body: unknown = undefined;
          if (bodyText) {
            if (contentType.includes('application/json')) {
              try {
                body = JSON.parse(bodyText);
              } catch {
                body = undefined;
              }
            } else {
              body = bodyText;
            }
          }

          const mod = await import(pathToFileURL(filePath).href);
          const handler = (mod && typeof mod.default === 'function') ? (mod.default as ApiHandler) : null;
          if (!handler) return next();

          const apiReq: ApiReq = { method: req.method, headers: req.headers as Record<string, string | string[] | undefined>, body };
          const apiRes: ApiRes = {
            status(code: number) {
              res.statusCode = code;
              return apiRes;
            },
            json(payload: unknown) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify(payload));
            },
          };

          await handler(apiReq, apiRes);
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Unknown error';
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}

/**
 * The commit this bundle was built from, stamped into error messages.
 *
 * An installed app gives no sign of which build it is, and a phone reporting
 * a fault that was already fixed is indistinguishable from one that was not.
 * A round trip was already spent on that. Falls back to the build time when
 * git is unavailable, as it is on a clean CI checkout without history.
 */
function buildId(): string {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: projectRoot })
      .toString().trim();
  } catch {
    return new Date().toISOString().slice(0, 16).replace('T', ' ');
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);
  return {
    plugins: [react(), tailwindcss(), vercelApiPlugin()],
    define: {
      __BUILD_ID__: JSON.stringify(buildId()),
    },
  };
})
