// Obfuscates build output in place. Run AFTER `npm run build`.
//
//   npm run build:secure
//
// Frontend (dist/assets/*.js) gets moderate settings — it runs in the
// visitor's browser, so heavy transforms cost real page speed.
// Backend (server.mjs, build/api/*.js) gets aggressive settings — it runs
// once on the server where startup cost does not matter.
//
// Obfuscation raises the effort required to read the code. It is not
// encryption: anyone determined enough can still recover the logic.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JavaScriptObfuscator from 'javascript-obfuscator';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Browser bundles. Control-flow flattening and dead-code injection are left
// off on purpose: on a 400 kB React chunk they multiply size and slow the app
// noticeably, and they are the transforms most likely to break it.
const FRONTEND = {
  compact: true,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  stringArrayWrappersCount: 2,
  stringArrayWrappersType: 'function',
  splitStrings: true,
  splitStringsChunkLength: 10,
  numbersToExpressions: true,
  simplify: true,
  transformObjectKeys: false,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  selfDefending: false,
  debugProtection: false,
  disableConsoleOutput: false,
  sourceMap: false,
};

// Server-side. Nothing here is downloaded by users, so the expensive
// transforms are worth it.
const BACKEND = {
  ...FRONTEND,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.2,
  stringArrayThreshold: 1,
  transformObjectKeys: true,
  selfDefending: true,
};

const walk = async (dir, out = []) => {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else if (e.name.endsWith('.js') || e.name.endsWith('.mjs')) out.push(full);
  }
  return out;
};

const run = async (files, options, label) => {
  let before = 0;
  let after = 0;
  for (const file of files) {
    const code = await fs.readFile(file, 'utf8');
    before += code.length;
    const result = JavaScriptObfuscator.obfuscate(code, options).getObfuscatedCode();
    await fs.writeFile(file, result, 'utf8');
    after += result.length;
  }
  const pct = before ? Math.round(((after - before) / before) * 100) : 0;
  const kb = (n) => `${Math.round(n / 1024)} kB`;
  console.log(`${label}: ${files.length} files, ${kb(before)} -> ${kb(after)} (${pct >= 0 ? '+' : ''}${pct}%)`);
};

const main = async () => {
  const frontend = await walk(path.join(root, 'dist', 'assets'));
  const backend = [
    ...(await walk(path.join(root, 'build', 'api'))),
    path.join(root, 'server.mjs'),
  ];

  if (frontend.length === 0 && backend.length === 1) {
    console.error('Nothing to obfuscate. Run `npm run build` first.');
    process.exit(1);
  }

  // server.mjs is obfuscated into dist-server/ rather than in place, so the
  // original stays readable for development. Upload the dist-server copy.
  const serverOut = path.join(root, 'dist-server');
  await fs.mkdir(serverOut, { recursive: true });
  const serverCode = await fs.readFile(path.join(root, 'server.mjs'), 'utf8');
  await fs.writeFile(
    path.join(serverOut, 'server.mjs'),
    JavaScriptObfuscator.obfuscate(serverCode, BACKEND).getObfuscatedCode(),
    'utf8',
  );

  await run(frontend, FRONTEND, 'frontend  ');
  await run(backend.filter((f) => !f.endsWith('server.mjs')), BACKEND, 'api routes');
  console.log('server.mjs -> dist-server/server.mjs');
  console.log('\nUpload dist/, build/api/, and dist-server/server.mjs (renamed to server.mjs).');
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
