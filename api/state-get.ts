type ApiRequest = { method?: string; headers?: Record<string, string | string[] | undefined> };
type ApiResponse = { status: (code: number) => ApiResponse; json: (body: unknown) => void };

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
  if (/^https?:\/\//i.test(serviceKey)) {
    return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It must be the secret/service role key, not a URL.';
  }
  return '';
};

const adminAuthHeaders = (adminKey: string) => {
  const isJwtLike = adminKey.startsWith('eyJ') && adminKey.split('.').length === 3;
  return isJwtLike ? { apikey: adminKey, Authorization: `Bearer ${adminKey}` } : { apikey: adminKey };
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

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const envErr = validateSupabaseEnv(supabaseUrl, serviceKey);
    if (envErr) {
      res.status(500).json({ error: envErr });
      return;
    }
    const base = (supabaseUrl as string).replace(/\/$/, '');
    const adminKey = serviceKey as string;
    const adminHeaders = adminAuthHeaders(adminKey);

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
    const profile = await fetchJson(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role`, {
      method: 'GET',
      headers: adminHeaders,
    });
    const role = Array.isArray(profile.json) && profile.json[0] && typeof profile.json[0].role === 'string'
      ? (profile.json[0].role as string)
      : '';

    const stateResp = await fetchJson(`${base}/rest/v1/app_state?org_id=eq.default&select=state&limit=1`, {
      method: 'GET',
      headers: adminHeaders,
    });
    const rawState = Array.isArray(stateResp.json) && stateResp.json[0] ? (stateResp.json[0].state as unknown) : {};
    const state = asState(rawState);

    if (isInternal(role)) {
      res.status(200).json({ ok: true, state });
      return;
    }

    if (role === 'student') {
      const apps = state.applications.filter((row) => getString(asRecord(row), 'studentId') === userId);
      const appIds = new Set(apps.map((a) => getString(asRecord(a), 'id')));
      const documents = state.documents.filter((row) => getString(asRecord(row), 'studentId') === userId);
      const notifications = state.notifications.filter((row) => getString(asRecord(row), 'userId') === userId);
      const appointments = state.appointments.filter((row) => getString(asRecord(row), 'userId') === userId);
      const chatMessages = state.chatMessages.filter((row) => {
        const m = asRecord(row);
        if (!m) return false;
        if (getString(m, 'fromUserId') === userId || getString(m, 'toUserId') === userId) return true;
        const appId = getString(m, 'applicationId');
        return appId === `complaint-${userId}`;
      });
      const chatThreadReadAt: Record<string, string> = {};
      Object.entries(state.chatThreadReadAt).forEach(([k, v]) => {
        if (k === `complaint-${userId}` || appIds.has(k)) chatThreadReadAt[k] = v;
      });
      res.status(200).json({ ok: true, state: { applications: apps, documents, notifications, appointments, chatMessages, chatThreadReadAt } });
      return;
    }

    if (role === 'agency') {
      const apps = state.applications.filter((row) => getString(asRecord(row), 'agencyId') === userId);
      const appIds = new Set(apps.map((a) => getString(asRecord(a), 'id')));
      const chatMessages = state.chatMessages.filter((row) => {
        const m = asRecord(row);
        if (!m) return false;
        if (getString(m, 'fromUserId') === userId || getString(m, 'toUserId') === userId) return true;
        const appId = getString(m, 'applicationId');
        return appIds.has(appId);
      });
      const chatThreadReadAt: Record<string, string> = {};
      Object.entries(state.chatThreadReadAt).forEach(([k, v]) => {
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
