type ApiRequest = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> };
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
  documentRequests: unknown[];
};

const asState = (value: unknown): AppState => {
  const v = (value && typeof value === 'object') ? (value as Record<string, unknown>) : {};
  return {
    applications: Array.isArray(v.applications) ? v.applications : [],
    documents: Array.isArray(v.documents) ? v.documents : [],
    notifications: Array.isArray(v.notifications) ? v.notifications : [],
    appointments: Array.isArray(v.appointments) ? v.appointments : [],
    chatMessages: Array.isArray(v.chatMessages) ? v.chatMessages : [],
    chatThreadReadAt: (v.chatThreadReadAt && typeof v.chatThreadReadAt === 'object') ? (v.chatThreadReadAt as Record<string, string>) : {},
    documentRequests: Array.isArray(v.documentRequests) ? v.documentRequests : [],
  };
};

const isInternal = (role: string) => ['ceo', 'sales', 'ops', 'staff', 'agency_staff'].includes(role);

const asRecord = (value: unknown) => (value && typeof value === 'object') ? (value as Record<string, unknown>) : null;
const getString = (r: Record<string, unknown> | null, key: string) => (r && typeof r[key] === 'string' ? (r[key] as string) : '');

const uniqueBy = <T>(items: T[], keyFn: (t: T) => string) => {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const k = keyFn(it);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method !== 'POST') {
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
    if (!role) {
      const bootstrapEmail = (process.env.AUTO_BOOTSTRAP_CEO_EMAIL || '').toLowerCase().trim();
      const authEmail = typeof (who.json as Record<string, unknown>).email === 'string'
        ? String((who.json as Record<string, unknown>).email).toLowerCase().trim() : '';
      if (bootstrapEmail && authEmail && bootstrapEmail === authEmail) role = 'ceo';
    }

    const body = (req.body && typeof req.body === 'object') ? (req.body as Record<string, unknown>) : {};
    const incoming = asState(body.state);

    const stateResp = await fetchJsonWithAdminHeaders(`${base}/rest/v1/app_state?org_id=eq.default&select=state&limit=1`, { method: 'GET' }, adminKey);
    const currentRaw = Array.isArray(stateResp.json) && stateResp.json[0] ? (stateResp.json[0].state as unknown) : {};
    const current = asState(currentRaw);

    let next = current;
    const now = new Date().toISOString();

    if (isInternal(role)) {
      next = {
        applications: incoming.applications.slice(0, 50_000),
        documents: incoming.documents.slice(0, 50_000),
        notifications: incoming.notifications.slice(0, 100_000),
        appointments: incoming.appointments.slice(0, 50_000),
        chatMessages: incoming.chatMessages.slice(0, 200_000),
        chatThreadReadAt: incoming.chatThreadReadAt || {},
        documentRequests: incoming.documentRequests.slice(0, 50_000),
      };
    } else if (role === 'student') {
      const allowedThread = (key: string) =>
        key.startsWith(`${userId}|`) ||
        key === `complaint-${userId}` ||
        current.applications.some((a) => getString(asRecord(a), 'studentId') === userId && getString(asRecord(a), 'id') === key);
      const mergedReadAt: Record<string, string> = { ...current.chatThreadReadAt };
      Object.entries(incoming.chatThreadReadAt || {}).forEach(([k, v]) => {
        if (!allowedThread(k)) return;
        if (typeof v !== 'string') return;
        mergedReadAt[k] = v;
      });
      const newMessages = incoming.chatMessages.flatMap((m) => {
        const r = asRecord(m);
        if (!r) return [];
        const sender = getString(r, 'fromUserId') || getString(r, 'userId');
        if (sender !== userId) return [];
        const text = getString(r, 'text');
        if (!text || text.length > 5000) return [];
        const appId = getString(r, 'applicationId');
        if (appId && !(allowedThread(appId) || appId === `complaint-${userId}`)) return [];
        return [{
          id: `${userId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          userId,
          toUserId: getString(r, 'toUserId'),
          text,
          applicationId: appId || undefined,
          time: now,
        }];
      });
      next = {
        ...current,
        chatThreadReadAt: mergedReadAt,
        chatMessages: uniqueBy([...current.chatMessages, ...newMessages], (x) => getString(asRecord(x), 'id')),
      };
    } else if (role === 'agency') {
      const allowedApp = (id: string) =>
        current.applications.some((a) => getString(asRecord(a), 'agencyId') === userId && getString(asRecord(a), 'id') === id);
      const newMessages = incoming.chatMessages.flatMap((m) => {
        const r = asRecord(m);
        if (!r) return [];
        const sender = getString(r, 'fromUserId') || getString(r, 'userId');
        if (sender !== userId) return [];
        const text = getString(r, 'text');
        if (!text || text.length > 5000) return [];
        const appId = getString(r, 'applicationId');
        if (appId && !allowedApp(appId)) return [];
        return [{
          id: `${userId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          userId,
          toUserId: getString(r, 'toUserId'),
          text,
          applicationId: appId || undefined,
          time: now,
        }];
      });

      const byId = new Map<string, unknown>();
      current.applications.forEach((a) => {
        const id = getString(asRecord(a), 'id');
        if (id) byId.set(id, a);
      });
      const updatedApps: Record<string, unknown>[] = [];
      incoming.applications.forEach((a) => {
        const r = asRecord(a);
        if (!r) return;
        const id = getString(r, 'id');
        if (!id || !allowedApp(id)) return;
        const baseApp = asRecord(byId.get(id));
        if (!baseApp) return;
        const mergeArray = (oldVal: unknown, newVal: unknown) => {
          const oldArr = Array.isArray(oldVal) ? oldVal.filter(x => typeof x === 'string') as string[] : [];
          const newArr = Array.isArray(newVal) ? newVal.filter(x => typeof x === 'string') as string[] : [];
          const merged = Array.from(new Set([...oldArr, ...newArr]));
          return merged.slice(0, 200);
        };
        const nextApp = {
          ...baseApp,
          intakeExtraDocs: mergeArray(baseApp.intakeExtraDocs, r.intakeExtraDocs),
          intakeAttachments: mergeArray(baseApp.intakeAttachments, r.intakeAttachments),
          intakeVideoUrl: typeof r.intakeVideoUrl === 'string' ? r.intakeVideoUrl : baseApp.intakeVideoUrl,
          intakePassportCopy: typeof r.intakePassportCopy === 'string' ? r.intakePassportCopy : baseApp.intakePassportCopy,
          intakeHighSchoolCertificate: typeof r.intakeHighSchoolCertificate === 'string' ? r.intakeHighSchoolCertificate : baseApp.intakeHighSchoolCertificate,
        } satisfies Record<string, unknown>;
        updatedApps.push(nextApp);
      });
      const mergedApps = current.applications.map((a) => {
        const id = getString(asRecord(a), 'id');
        const repl = updatedApps.find((x) => getString(x, 'id') === id);
        return repl ?? a;
      });

      const mergedReadAt: Record<string, string> = { ...current.chatThreadReadAt };
      Object.entries(incoming.chatThreadReadAt || {}).forEach(([k, v]) => {
        if (!k.startsWith(`${userId}|`) && !allowedApp(k)) return;
        if (typeof v !== 'string') return;
        mergedReadAt[k] = v;
      });

      next = {
        ...current,
        applications: mergedApps,
        chatThreadReadAt: mergedReadAt,
        chatMessages: uniqueBy([...current.chatMessages, ...newMessages], (x) => getString(asRecord(x), 'id')),
      };
    } else {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const upserted = await fetchJsonWithAdminHeaders(`${base}/rest/v1/app_state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ org_id: 'default', state: next, updated_at: now, updated_by: userId }),
    }, adminKey);
    if (!upserted.ok) {
      res.status(500).json({ error: 'Failed to save state', details: upserted.text });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
