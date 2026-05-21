type ApiRequest = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> };
type ApiResponse = { status: (code: number) => ApiResponse; json: (body: unknown) => void };

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const asString = (v: unknown) => (typeof v === 'string' ? v : '');
const clamp = (v: string, max: number) => (v.length > max ? v.slice(0, max) : v);

const getBearer = (req: ApiRequest) => {
  const raw = req.headers?.authorization || req.headers?.Authorization;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return '';
  const m = value.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? '';
};

const validateSupabaseEnv = (supabaseUrl?: string, serviceKey?: string) => {
  if (!supabaseUrl || !serviceKey) return 'Supabase is not configured';
  if (!/^https?:\/\//i.test(supabaseUrl)) {
    return 'SUPABASE_URL is invalid.';
  }
  if (serviceKey.startsWith('sb_publishable_')) {
    return 'SUPABASE_SERVICE_ROLE_KEY is wrong (publishable key).';
  }
  if (/^https?:\/\//i.test(serviceKey)) {
    return 'SUPABASE_SERVICE_ROLE_KEY is invalid (it looks like a URL).';
  }
  if (/\s/.test(serviceKey)) {
    return 'SUPABASE_SERVICE_ROLE_KEY is invalid (contains whitespace).';
  }
  return '';
};

const fetchJson = async (url: string, init: RequestInit) => {
  const resp = await fetch(url, init);
  const text = await resp.text().catch(() => '');
  const json = text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;
  return { ok: resp.ok, status: resp.status, text, json };
};

const getRoleFromAuth = async (base: string, adminKey: string, token: string, userId: string) => {
  const who = await fetchJson(`${base}/auth/v1/user`, {
    method: 'GET',
    headers: { apikey: adminKey, Authorization: `Bearer ${token}` },
  });
  const whoJson = who.json && typeof who.json === 'object' ? who.json as Record<string, unknown> : null;
  const appMeta = whoJson && whoJson.app_metadata && typeof whoJson.app_metadata === 'object'
    ? whoJson.app_metadata as Record<string, unknown>
    : null;
  const metaRole = appMeta && typeof appMeta.role === 'string' ? appMeta.role : '';
  if (metaRole) return metaRole;
  const profile = await fetchJson(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role&limit=1`, {
    method: 'GET',
    headers: { apikey: adminKey, Authorization: `Bearer ${adminKey}` },
  });
  const role = Array.isArray(profile.json) && profile.json[0] && typeof profile.json[0].role === 'string' ? profile.json[0].role : '';
  return role;
};

const getIp = (req: ApiRequest) => {
  const raw = req.headers?.['x-forwarded-for'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return 'unknown';
  return value.split(',')[0]?.trim() || 'unknown';
};

const allow = (key: string, limit: number, windowMs: number) => {
  const now = Date.now();
  const g = globalThis as unknown as { __rl?: Map<string, { count: number; resetAt: number }> };
  if (!g.__rl) g.__rl = new Map();
  const entry = g.__rl.get(key);
  if (!entry || now > entry.resetAt) {
    g.__rl.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
};

const getDataDir = () => {
  const raw = process.env.DATA_DIR;
  const value = typeof raw === 'string' ? raw.trim() : '';
  return value || path.join(os.tmpdir(), 'theway');
};

const appendJsonLine = async (fileName: string, row: unknown) => {
  const dir = getDataDir();
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  const line = `${safeStringify(row)}\n`;
  await fs.appendFile(filePath, line, { encoding: 'utf8' });
};

const safeStringify = (value: unknown) => {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_k, v) => {
    if (typeof v === 'bigint') return v.toString();
    if (v && typeof v === 'object') {
      if (seen.has(v as object)) return '[Circular]';
      seen.add(v as object);
    }
    return v;
  });
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const appId = String(Date.now());
  const now = new Date().toISOString();
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    const ip = getIp(req);

    const body = (req.body && typeof req.body === 'object') ? (req.body as Record<string, unknown>) : {};
    const sourceRaw = asString(body.source).trim() || 'public';
    const source = (sourceRaw === 'agency' || sourceRaw === 'public') ? sourceRaw : 'public';
    if (!allow(`apply:${source}:${ip}`, source === 'public' ? 10 : 30, 60_000)) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    let agencyId: string | null = null;
    if (source === 'agency') {
      const supabaseUrl = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
      const envErr = validateSupabaseEnv(supabaseUrl, serviceKey);
      if (envErr) {
        res.status(500).json({ error: envErr });
        return;
      }
      const token = getBearer(req);
      if (!token) {
        res.status(401).json({ error: 'Missing token' });
        return;
      }
      const base = (supabaseUrl as string).replace(/\/$/, '');
      const adminKey = serviceKey as string;
      const who = await fetchJson(`${base}/auth/v1/user`, {
        method: 'GET',
        headers: { apikey: adminKey, Authorization: `Bearer ${token}` },
      });
      const whoJson2 = who.json && typeof who.json === 'object' ? who.json as Record<string, unknown> : null;
      if (!who.ok || !whoJson2 || typeof whoJson2.id !== 'string') {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
      const userId = whoJson2.id as string;
      const role = await getRoleFromAuth(base, adminKey, token, userId);
      if (role !== 'agency' && role !== 'ceo') {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      agencyId = userId;
    }

    const app = {
      id: appId,
      studentId: null,
      name: clamp(asString(body.name), 120),
      email: clamp(asString(body.email), 254),
      phone: clamp(asString(body.phone), 40),
      country: clamp(asString(body.country), 80),
      dob: clamp(asString(body.dob), 40) || null,
      program: clamp(asString(body.program), 120),
      aviationDegree: clamp(asString(body.aviationDegree), 120),
      studyLevel: clamp(asString(body.studyLevel), 80),
      university: clamp(asString(body.university), 80) || null,
      status: 'submitted',
      stage: 'applied',
      createdAt: clamp(asString(body.createdAt), 40) || now,
      internalNotes: null,
      events: [{ id: `${appId}-submitted`, type: 'submitted', byId: agencyId, byName: source === 'agency' ? 'Agency' : 'Website', time: now, details: source === 'agency' ? 'Agency submission' : 'Public submission' }],
      hold: null,
      approvedBy: null,
      approvedAt: null,
      ownerId: null,
      salesOwnerId: null,
      assignedStaffId: null,
      source,
      agencyId,
      contactEmail: clamp(asString(body.contactEmail), 254) || null,
      studentEmail: clamp(asString(body.studentEmail), 254) || null,
      intakeDetails: clamp(asString(body.intakeDetails), 20_000) || null,
      intakeAttachments: Array.isArray(body.intakeAttachments) ? body.intakeAttachments : null,
      intakeVideoUrl: clamp(asString(body.intakeVideoUrl), 2000) || null,
      intakePassportCopy: clamp(asString(body.intakePassportCopy), 2000) || null,
      intakeHighSchoolCertificate: clamp(asString(body.intakeHighSchoolCertificate), 2000) || null,
      intakeHighSchoolMissingNote: clamp(asString(body.intakeHighSchoolMissingNote), 2000) || null,
      intakeBirthCertificate: clamp(asString(body.intakeBirthCertificate), 2000) || null,
      intakeMotherPassport: clamp(asString(body.intakeMotherPassport), 2000) || null,
      intakeFatherPassport: clamp(asString(body.intakeFatherPassport), 2000) || null,
      intakeSLARewarded: Boolean(body.intakeSLARewarded),
      arrived: Boolean(body.arrived),
      intakeExtraDocs: Array.isArray(body.intakeExtraDocs) ? body.intakeExtraDocs : null,
    };

    try {
      await appendJsonLine('applications.jsonl', { ...app, receivedAt: now });
    } catch {
      const g = globalThis as unknown as { __fallbackApps?: unknown[] };
      if (!g.__fallbackApps) g.__fallbackApps = [];
      g.__fallbackApps.push({ ...app, receivedAt: now });
    }

    res.status(200).json({ id: appId });
  } catch (e: unknown) {
    const message = e instanceof Error ? `${e.name}: ${e.message}` : 'Unknown error';
    console.error('apply failed (non-fatal)', e);
    const g = globalThis as unknown as { __fallbackApps?: unknown[] };
    if (!g.__fallbackApps) g.__fallbackApps = [];
    g.__fallbackApps.push({ id: appId, receivedAt: now, error: message });
    res.status(200).json({ id: appId, warning: message });
  }
}
