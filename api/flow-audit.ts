type ApiRequest = { method?: string; headers?: Record<string, string | string[] | undefined> };
type ApiResponse = { status: (code: number) => ApiResponse; json: (body: unknown) => void };

import * as os from 'os';
import * as path from 'path';
import { promises as fs } from 'fs';

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

type Issue = { severity: 'high' | 'medium' | 'low'; code: string; message: string; context?: Record<string, unknown> };

const validateSupabaseEnv = (supabaseUrl?: string, serviceKey?: string) => {
  if (!supabaseUrl || !serviceKey) return 'Supabase is not configured';
  if (!/^https?:\/\//i.test(supabaseUrl)) {
    return 'SUPABASE_URL is invalid. It must be the Supabase Project URL (https://xxxxx.supabase.co). You likely pasted a key by mistake.';
  }
  if (serviceKey.startsWith('sb_publishable_')) {
    return 'SUPABASE_SERVICE_ROLE_KEY is wrong. You pasted the publishable (public) key. It must be the secret key.';
  }
  if (/^https?:\/\//i.test(serviceKey)) {
    return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It must be the Supabase service role key.';
  }
  if (/\s/.test(serviceKey)) {
    return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It contains whitespace/new lines. Paste the key as a single line.';
  }
  return '';
};

const postgrestHeaders = (adminKey: string): Record<string, string> => {
  const key = adminKey.trim();
  if (!key) return {};
  const isJwtLike = key.startsWith('eyJ') && key.split('.').length === 3;
  return isJwtLike ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
};

const getDataDir = () => {
  const raw = process.env.DATA_DIR;
  const value = typeof raw === 'string' ? raw.trim() : '';
  return value || path.join(os.tmpdir(), 'theway');
};

const safeParseJson = (line: string) => {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
};

const readJsonlApplications = async (maxLines: number) => {
  const filePath = path.join(getDataDir(), 'applications.jsonl');
  let content = '';
  try {
    content = await fs.readFile(filePath, { encoding: 'utf8' });
  } catch {
    return [];
  }
  const lines = content.split('\n').filter(Boolean);
  const slice = lines.length > maxLines ? lines.slice(lines.length - maxLines) : lines;
  const rows: Record<string, unknown>[] = [];
  for (const line of slice) {
    const obj = safeParseJson(line);
    if (!obj || typeof obj !== 'object') continue;
    rows.push(obj as Record<string, unknown>);
  }
  return rows;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
    const envError = validateSupabaseEnv(supabaseUrl, serviceKey);
    if (envError) {
      res.status(500).json({ error: envError });
      return;
    }
    const base = (supabaseUrl as string).replace(/\/$/, '');
    const adminKey = String(serviceKey || '').trim();
    const adminHeaders = postgrestHeaders(adminKey);

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

    const callerId = who.json.id as string;
    const appMeta = who.json.app_metadata && typeof who.json.app_metadata === 'object' ? (who.json.app_metadata as Record<string, unknown>) : null;
    let callerRole = (appMeta && typeof appMeta.role === 'string') ? String(appMeta.role).trim().toLowerCase() : '';
    if (!callerRole) {
      const callerProfile = await fetchJson(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(callerId)}&select=role`, {
        method: 'GET',
        headers: adminHeaders,
      });
      callerRole = Array.isArray(callerProfile.json) && callerProfile.json[0] && typeof callerProfile.json[0].role === 'string'
        ? String(callerProfile.json[0].role).trim().toLowerCase()
        : '';
    }
    if (callerRole !== 'ceo') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const stateResp = await fetchJson(`${base}/rest/v1/app_state?org_id=eq.default&select=state&limit=1`, {
      method: 'GET',
      headers: adminHeaders,
    });
    const state = Array.isArray(stateResp.json) && stateResp.json[0] && typeof stateResp.json[0].state === 'object'
      ? (stateResp.json[0].state as Record<string, unknown>)
      : {};

    const applications = Array.isArray(state.applications) ? (state.applications as Array<Record<string, unknown>>) : [];
    const fileApps = await readJsonlApplications(2000);
    const mergedApplications = (() => {
      if (!fileApps.length) return applications;
      const byId = new Map<string, Record<string, unknown>>();
      applications.forEach((a) => {
        const id = typeof a.id === 'string' ? a.id : '';
        if (id) byId.set(id, a);
      });
      fileApps.forEach((a) => {
        const id = typeof a.id === 'string' ? a.id : '';
        if (id && !byId.has(id)) byId.set(id, a);
      });
      return Array.from(byId.values());
    })();
    const chatMessages = Array.isArray(state.chatMessages) ? (state.chatMessages as Array<Record<string, unknown>>) : [];

    const appById = new Map<string, Record<string, unknown>>();
    mergedApplications.forEach((a) => {
      const id = typeof a.id === 'string' ? a.id : '';
      if (id) appById.set(id, a);
    });

    const issues: Issue[] = [];

    mergedApplications.forEach((a) => {
      const id = typeof a.id === 'string' ? a.id : '';
      const status = typeof a.status === 'string' ? a.status : '';
      const source = typeof a.source === 'string' ? a.source : 'public';
      const studentId = typeof a.studentId === 'string' ? a.studentId : '';
      const ownerId = typeof a.ownerId === 'string' ? a.ownerId : '';
      const agencyId = typeof a.agencyId === 'string' ? a.agencyId : '';
      const studentEmail = typeof a.studentEmail === 'string' ? a.studentEmail : '';
      const assignedStaffId = typeof a.assignedStaffId === 'string' ? a.assignedStaffId : '';

      if (status === 'approved' && !studentId) {
        issues.push({ severity: 'high', code: 'APP_APPROVED_NO_STUDENT', message: 'Approved application missing studentId', context: { id } });
      }
      if (status === 'approved' && !ownerId) {
        issues.push({ severity: 'medium', code: 'APP_APPROVED_NO_OWNER', message: 'Approved application missing ownerId (sales/ops)', context: { id } });
      }
      if (source === 'agency' && !agencyId) {
        issues.push({ severity: 'high', code: 'AGENCY_APP_NO_AGENCY', message: 'Agency application missing agencyId', context: { id } });
      }
      if (source === 'agency' && status === 'approved' && !studentEmail) {
        issues.push({ severity: 'high', code: 'AGENCY_APPROVED_NO_STUDENT_EMAIL', message: 'Agency approved but studentEmail missing', context: { id } });
      }
      if (assignedStaffId && source === 'public' && status === 'approved') {
        // ok
      }
    });

    chatMessages.forEach((m) => {
      const applicationId = typeof m.applicationId === 'string' ? m.applicationId : '';
      if (!applicationId) return;
      if (applicationId.startsWith('complaint-')) return;
      if (!appById.has(applicationId)) {
        issues.push({ severity: 'low', code: 'CHAT_ORPHAN_THREAD', message: 'Chat message references missing applicationId', context: { applicationId } });
      }
    });

    res.status(200).json({ ok: issues.length === 0, issueCount: issues.length, issues });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
