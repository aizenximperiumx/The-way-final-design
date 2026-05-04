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

const validateSupabaseEnv = (supabaseUrl?: string, serviceKey?: string) => {
  if (!supabaseUrl || !serviceKey) return 'Supabase is not configured';
  if (!/^https?:\/\//i.test(supabaseUrl)) {
    return 'SUPABASE_URL is invalid. It must be the Supabase Project URL (https://xxxxx.supabase.co). You likely pasted a key by mistake.';
  }
  if (serviceKey.startsWith('sb_publishable_')) {
    return 'SUPABASE_SERVICE_ROLE_KEY is wrong. You pasted the publishable (public) key. It must be the secret key that starts with sb_secret_.';
  }
  if (/^https?:\/\//i.test(serviceKey)) {
    return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It must be the secret/service role key, not a URL.';
  }
  if (/\s/.test(serviceKey)) {
    return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It contains whitespace/new lines. Paste the key as a single line.';
  }
  return '';
};

const adminHeaderCandidates = (adminKey: string) => {
  const key = adminKey.trim();
  const isJwtLike = key.startsWith('eyJ') && key.split('.').length === 3;
  const isSbSecret = key.startsWith('sb_secret_');
  const apiOnly: Record<string, string> = { apikey: key };
  const apiAndAuth: Record<string, string> = { apikey: key, Authorization: `Bearer ${key}` };
  if (isJwtLike) return [apiAndAuth];
  if (isSbSecret) return [apiOnly, apiAndAuth];
  return [apiOnly];
};

const fetchJsonWithAdminHeaders = async (url: string, init: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> }, adminKey: string) => {
  const candidates = adminHeaderCandidates(adminKey);
  let last = await fetchJson(url, { ...init, headers: { ...(init.headers ?? {}), ...candidates[0] } });
  for (let i = 1; i < candidates.length; i += 1) {
    if (last.ok) return last;
    if (last.status !== 401 && last.status !== 403) return last;
    last = await fetchJson(url, { ...init, headers: { ...(init.headers ?? {}), ...candidates[i] } });
  }
  return last;
};

type AppState = {
  applications: unknown[];
  documents: unknown[];
  notifications: unknown[];
  appointments: unknown[];
  chatMessages: unknown[];
  chatThreadReadAt: Record<string, string>;
};

const asRecord = (value: unknown) => (value && typeof value === 'object') ? (value as Record<string, unknown>) : null;
const getString = (r: Record<string, unknown> | null, key: string) => (r && typeof r[key] === 'string' ? (r[key] as string) : '');

const asState = (value: unknown): AppState => {
  const v = (value && typeof value === 'object') ? (value as Record<string, unknown>) : {};
  return {
    applications: Array.isArray(v.applications) ? v.applications : [],
    documents: Array.isArray(v.documents) ? v.documents : [],
    notifications: Array.isArray(v.notifications) ? v.notifications : [],
    appointments: Array.isArray(v.appointments) ? v.appointments : [],
    chatMessages: Array.isArray(v.chatMessages) ? v.chatMessages : [],
    chatThreadReadAt: (v.chatThreadReadAt && typeof v.chatThreadReadAt === 'object') ? (v.chatThreadReadAt as Record<string, string>) : {},
  };
};

const isInternal = (role: string) => ['ceo', 'sales', 'ops', 'staff', 'agency_staff'].includes(role);

const safeParseJson = (line: string) => {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
};

const getDataDir = () => {
  const raw = process.env.DATA_DIR;
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (value) return value;
  const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.RENDER_EXTERNAL_HOSTNAME);
  if (isRender) return '/var/data/theway';
  return path.join(os.tmpdir(), 'theway');
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

const mergeApps = (primary: unknown[], secondary: Record<string, unknown>[]) => {
  const byId = new Map<string, unknown>();
  primary.forEach((a) => {
    const r = asRecord(a);
    const id = getString(r, 'id');
    if (id) byId.set(id, a);
  });
  secondary.forEach((a) => {
    const id = getString(a, 'id');
    if (id && !byId.has(id)) byId.set(id, a);
  });
  return Array.from(byId.values());
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
    const envErr = validateSupabaseEnv(supabaseUrl, serviceKey);
    if (envErr) {
      res.status(500).json({ error: envErr });
      return;
    }
    const base = (supabaseUrl as string).replace(/\/$/, '');
    const adminKey = serviceKey as string;

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

    const userId = who.json.id as string;
    const appMeta = who.json.app_metadata && typeof who.json.app_metadata === 'object' ? (who.json.app_metadata as Record<string, unknown>) : null;
    let role = appMeta && typeof appMeta.role === 'string' ? (appMeta.role as string) : '';
    if (!role) {
      const profile = await fetchJsonWithAdminHeaders(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role&limit=1`, {
        method: 'GET',
      }, adminKey);
      role = Array.isArray(profile.json) && profile.json[0] && typeof profile.json[0].role === 'string'
        ? (profile.json[0].role as string)
        : '';
    }

    const stateResp = await fetchJsonWithAdminHeaders(`${base}/rest/v1/app_state?org_id=eq.default&select=state&limit=1`, { method: 'GET' }, adminKey);
    const rawState = Array.isArray(stateResp.json) && stateResp.json[0] ? (stateResp.json[0].state as unknown) : {};
    const state = asState(rawState);
    const fileApps = await readJsonlApplications(2000);
    const mergedState: AppState = fileApps.length > 0 ? { ...state, applications: mergeApps(state.applications, fileApps) } : state;

    if (isInternal(role)) {
      res.status(200).json({ ok: true, state: mergedState });
      return;
    }

    if (role === 'student') {
      const apps = mergedState.applications.filter((row) => getString(asRecord(row), 'studentId') === userId);
      const appIds = new Set(apps.map((a) => getString(asRecord(a), 'id')));
      const documents = mergedState.documents.filter((row) => getString(asRecord(row), 'studentId') === userId);
      const notifications = mergedState.notifications.filter((row) => getString(asRecord(row), 'userId') === userId);
      const appointments = mergedState.appointments.filter((row) => getString(asRecord(row), 'userId') === userId);
      const chatMessages = mergedState.chatMessages.filter((row) => {
        const m = asRecord(row);
        if (!m) return false;
        if (getString(m, 'fromUserId') === userId || getString(m, 'toUserId') === userId) return true;
        const appId = getString(m, 'applicationId');
        return appId === `complaint-${userId}`;
      });
      const chatThreadReadAt: Record<string, string> = {};
      Object.entries(mergedState.chatThreadReadAt).forEach(([k, v]) => {
        if (k === `complaint-${userId}` || appIds.has(k)) chatThreadReadAt[k] = v;
      });
      res.status(200).json({ ok: true, state: { applications: apps, documents, notifications, appointments, chatMessages, chatThreadReadAt } });
      return;
    }

    if (role === 'agency') {
      const apps = mergedState.applications.filter((row) => getString(asRecord(row), 'agencyId') === userId);
      const appIds = new Set(apps.map((a) => getString(asRecord(a), 'id')));
      const chatMessages = mergedState.chatMessages.filter((row) => {
        const m = asRecord(row);
        if (!m) return false;
        if (getString(m, 'fromUserId') === userId || getString(m, 'toUserId') === userId) return true;
        const appId = getString(m, 'applicationId');
        return appIds.has(appId);
      });
      const chatThreadReadAt: Record<string, string> = {};
      Object.entries(mergedState.chatThreadReadAt).forEach(([k, v]) => {
        if (appIds.has(k)) chatThreadReadAt[k] = v;
      });
      res.status(200).json({ ok: true, state: { applications: apps, documents: [], notifications: [], appointments: [], chatMessages, chatThreadReadAt } });
      return;
    }

    res.status(403).json({ error: 'Forbidden' });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
