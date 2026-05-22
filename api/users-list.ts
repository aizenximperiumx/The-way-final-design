type ApiRequest = { method?: string; headers?: Record<string, string | string[] | undefined> };
type ApiResponse = { status: (code: number) => ApiResponse; json: (body: unknown) => void };

type ApiUser = {
  id: string;
  username: string;
  role: string;
  name: string;
  email: string;
  phone?: string;
  createdAt?: string;
  points?: number;
  staffUniversities?: string[];
  assignedUniversityId?: string;
  passportExpiry?: string;
  visaExpiry?: string;
  residenceExpiry?: string;
};

const getBearer = (req: ApiRequest) => {
  const raw = req.headers?.authorization || req.headers?.Authorization;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return '';
  const m = value.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? '';
};

const validateSupabaseEnv = (supabaseUrl?: string, serviceKey?: string) => {
  if (!supabaseUrl || !serviceKey) return 'Supabase is not configured';
  if (!/^https?:\/\//i.test(supabaseUrl)) return 'SUPABASE_URL is invalid';
  if (serviceKey.startsWith('sb_publishable_')) return 'SUPABASE_SERVICE_ROLE_KEY is wrong. Use the service role key.';
  if (/\s/.test(serviceKey)) return 'SUPABASE_SERVICE_ROLE_KEY is invalid. It contains whitespace/new lines.';
  return '';
};

const authAdminHeaders = (adminKey: string): Record<string, string> => {
  const key = adminKey.trim();
  return key ? { apikey: key, Authorization: `Bearer ${key}` } : {};
};

const postgrestHeaderCandidates = (adminKey: string) => {
  const key = adminKey.trim();
  if (!key) return [{}];
  const isJwtLike = key.startsWith('eyJ') && key.split('.').length === 3;
  const isSbSecret = key.startsWith('sb_secret_');
  if (isJwtLike) return [{ apikey: key, Authorization: `Bearer ${key}` }];
  if (isSbSecret) return [{ apikey: key }, { apikey: key, Authorization: `Bearer ${key}` }];
  return [{ apikey: key }];
};

const fetchJson = async (url: string, init: RequestInit) => {
  const resp = await fetch(url, init);
  const text = await resp.text();
  let json: unknown = null;
  if (text) {
    try { json = JSON.parse(text); } catch { json = null; }
  }
  return { ok: resp.ok, status: resp.status, text, json };
};

const fetchPostgrest = async (candidates: Array<Record<string, string>>, url: string, init: RequestInit) => {
  let last = await fetchJson(url, { ...init, headers: { ...(init.headers ?? {}), ...(candidates[0] ?? {}) } });
  for (let i = 1; i < candidates.length; i += 1) {
    if (last.ok) return last;
    if (last.status !== 401 && last.status !== 403) return last;
    last = await fetchJson(url, { ...init, headers: { ...(init.headers ?? {}), ...(candidates[i] ?? {}) } });
  }
  return last;
};

const safeString = (value: unknown) => (typeof value === 'string' ? value : '');

const normalizeUser = (row: unknown): ApiUser | null => {
  if (!row || typeof row !== 'object') return null;
  const obj = row as Record<string, unknown>;
  const id = safeString(obj.id);
  const username = safeString(obj.username);
  const role = safeString(obj.role) || 'student';
  const name = safeString(obj.name);
  const email = safeString(obj.email);
  if (!id || !username || !email) return null;
  return {
    id,
    username,
    role,
    name,
    email,
    phone: safeString(obj.phone) || undefined,
    createdAt: safeString(obj.createdAt) || undefined,
    points: typeof obj.points === 'number' ? obj.points : undefined,
    staffUniversities: Array.isArray(obj.staffUniversities) ? obj.staffUniversities.map(String) : undefined,
    assignedUniversityId: safeString(obj.assignedUniversityId) || undefined,
    passportExpiry: safeString(obj.passportExpiry) || undefined,
    visaExpiry: safeString(obj.visaExpiry) || undefined,
    residenceExpiry: safeString(obj.residenceExpiry) || undefined,
  };
};

const getCallerRole = async (base: string, pgCandidates: Array<Record<string, string>>, userId: string) => {
  const r = await fetchPostgrest(pgCandidates, `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role&limit=1`, {
    method: 'GET',
  });
  if (!r.ok || !Array.isArray(r.json) || r.json.length === 0) return '';
  const entry = r.json[0] as Record<string, unknown>;
  return safeString(entry.role).toLowerCase();
};

const isInternalRole = (role: string) => ['ceo', 'sales', 'ops', 'staff', 'agency_staff'].includes(role);

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

    const base = String(supabaseUrl).replace(/\/$/, '');
    const adminKey = String(serviceKey).trim();
    const pgCandidates = postgrestHeaderCandidates(adminKey);
    const authHeaders = authAdminHeaders(adminKey);

    const token = getBearer(req);
    if (!token) {
      res.status(401).json({ error: 'Missing token' });
      return;
    }

    const who = await fetchJson(`${base}/auth/v1/user`, {
      method: 'GET',
      headers: { ...authHeaders, Authorization: `Bearer ${token}` },
    });
    if (!who.ok || !who.json || typeof who.json !== 'object' || typeof (who.json as Record<string, unknown>).id !== 'string') {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const callerId = safeString((who.json as Record<string, unknown>).id);
    const appMeta = (who.json as Record<string, unknown>).app_metadata;
    const callerRole = typeof appMeta === 'object' && appMeta !== null && typeof (appMeta as Record<string, unknown>).role === 'string'
      ? safeString((appMeta as Record<string, unknown>).role).toLowerCase()
      : await getCallerRole(base, pgCandidates, callerId);

    if (!callerRole) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const profileFilter = isInternalRole(callerRole)
      ? ''
      : `?id=eq.${encodeURIComponent(callerId)}`;

    const profileUrl = `${base}/rest/v1/profiles${profileFilter ? profileFilter : '?select=id,username,role,name,email,phone,createdAt,points,staffUniversities,assignedUniversityId,passportExpiry,visaExpiry,residenceExpiry'}${profileFilter ? '&select=id,username,role,name,email,phone,createdAt,points,staffUniversities,assignedUniversityId,passportExpiry,visaExpiry,residenceExpiry' : ''}`;
    const response = await fetchPostgrest(pgCandidates, profileUrl, {
      method: 'GET',
    });

    if (!response.ok || !Array.isArray(response.json)) {
      res.status(500).json({ error: 'Failed to load users' });
      return;
    }

    const users = response.json.map((row) => normalizeUser(row)).filter(Boolean) as ApiUser[];
    res.status(200).json({ users });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
