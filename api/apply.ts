type ApiRequest = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> };
type ApiResponse = { status: (code: number) => ApiResponse; json: (body: unknown) => void };

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const asString = (v: unknown) => (typeof v === 'string' ? v : '');
const clamp = (v: string, max: number) => (v.length > max ? v.slice(0, max) : v);

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
  const line = `${JSON.stringify(row)}\n`;
  await fs.appendFile(filePath, line, { encoding: 'utf8' });
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
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

    const appId = String(Date.now());
    const now = new Date().toISOString();
    const app = {
      id: appId,
      studentId: null,
      name: clamp(asString(body.name), 120),
      email: clamp(asString(body.email), 254),
      phone: clamp(asString(body.phone), 40),
      country: clamp(asString(body.country), 80),
      program: clamp(asString(body.program), 120),
      university: clamp(asString(body.university), 80) || null,
      status: 'submitted',
      stage: 'applied',
      createdAt: clamp(asString(body.createdAt), 40) || now,
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
      contactEmail: clamp(asString(body.contactEmail), 254) || null,
      studentEmail: clamp(asString(body.studentEmail), 254) || null,
      intakeDetails: clamp(asString(body.intakeDetails), 20_000) || null,
      intakeAttachments: Array.isArray(body.intakeAttachments) ? body.intakeAttachments : null,
      intakeVideoUrl: clamp(asString(body.intakeVideoUrl), 2000) || null,
      intakePassportCopy: clamp(asString(body.intakePassportCopy), 2000) || null,
      intakeHighSchoolCertificate: clamp(asString(body.intakeHighSchoolCertificate), 2000) || null,
      intakeSLARewarded: Boolean(body.intakeSLARewarded),
      arrived: Boolean(body.arrived),
      intakeExtraDocs: Array.isArray(body.intakeExtraDocs) ? body.intakeExtraDocs : null,
    };

    await appendJsonLine('applications.jsonl', { ...app, receivedAt: now });

    res.status(200).json({ id: appId });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
