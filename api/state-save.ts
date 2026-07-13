import { sendPushToUsers, prunePushTokens, pushConfigured, type PushTokensMap } from './_push.js';

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
  chatEmailNotify: Record<string, unknown>;
  documentRequests: unknown[];
  leads: unknown[];
  futureLeads: unknown[];
  trashedApplications: unknown[];
  trashedUsers: unknown[];
  credentialRequests: unknown[];
  pointsLedger: unknown[];
  universityConfig: Record<string, unknown> | null;
  purgedApplicationIds: string[];
  unTrashedUserIds: string[];
  /** Server-owned (weekly digest marker) — carried through, never client-set. */
  digestMeta: Record<string, unknown> | null;
  /** CEO announcements shown in the student app. */
  announcements: unknown[];
  /** Device push tokens per user — server-owned, never returned to clients. */
  pushTokens: Record<string, unknown> | null;
};

const asStringArray = (v: unknown, cap: number): string[] =>
  Array.isArray(v) ? (v.filter(x => typeof x === 'string') as string[]).slice(0, cap) : [];

const asState = (value: unknown): AppState => {
  const v = (value && typeof value === 'object') ? (value as Record<string, unknown>) : {};
  return {
    applications: Array.isArray(v.applications) ? v.applications : [],
    documents: Array.isArray(v.documents) ? v.documents : [],
    notifications: Array.isArray(v.notifications) ? v.notifications : [],
    appointments: Array.isArray(v.appointments) ? v.appointments : [],
    chatMessages: Array.isArray(v.chatMessages) ? v.chatMessages : [],
    chatThreadReadAt: (v.chatThreadReadAt && typeof v.chatThreadReadAt === 'object') ? (v.chatThreadReadAt as Record<string, string>) : {},
    chatEmailNotify: (v.chatEmailNotify && typeof v.chatEmailNotify === 'object') ? (v.chatEmailNotify as Record<string, unknown>) : {},
    documentRequests: Array.isArray(v.documentRequests) ? v.documentRequests : [],
    leads: Array.isArray(v.leads) ? v.leads : [],
    futureLeads: Array.isArray(v.futureLeads) ? v.futureLeads : [],
    trashedApplications: Array.isArray(v.trashedApplications) ? v.trashedApplications : [],
    trashedUsers: Array.isArray(v.trashedUsers) ? v.trashedUsers : [],
    credentialRequests: Array.isArray(v.credentialRequests) ? v.credentialRequests : [],
    pointsLedger: Array.isArray(v.pointsLedger) ? v.pointsLedger : [],
    universityConfig: (v.universityConfig && typeof v.universityConfig === 'object') ? (v.universityConfig as Record<string, unknown>) : null,
    purgedApplicationIds: asStringArray(v.purgedApplicationIds, 50_000),
    unTrashedUserIds: asStringArray(v.unTrashedUserIds, 50_000),
    digestMeta: (v.digestMeta && typeof v.digestMeta === 'object') ? (v.digestMeta as Record<string, unknown>) : null,
    announcements: Array.isArray(v.announcements) ? v.announcements : [],
    pushTokens: (v.pushTokens && typeof v.pushTokens === 'object') ? (v.pushTokens as Record<string, unknown>) : null,
  };
};

const isInternal = (role: string) => ['ceo', 'sales', 'ops', 'staff', 'agency_staff', 'customer_support'].includes(role);

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

// ── Non-destructive merge helpers ────────────────────────────────────────────
// Internal users save the WHOLE shared state from their own (possibly stale)
// client. A naive full overwrite means whoever saves last wins and silently
// erases data another teammate just added — e.g. Sales uploads intake files,
// then an Admin with an older snapshot saves and the intake URLs vanish.
// These helpers merge additively so concurrent edits never clobber each other.

const isNonEmpty = (v: unknown): boolean => {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
};

const itemKey = (item: unknown, idx: number): string => {
  if (typeof item === 'string') return `s:${item}`;
  const r = asRecord(item);
  const id = r ? getString(r, 'id') : '';
  if (id) return `id:${id}`;
  try { return `j:${JSON.stringify(item)}`; } catch { return `n:${idx}`; }
};

// Union two arrays, de-duplicating by id (objects) or value (strings).
// `current` first preserves original order; only truly new items are appended.
// FIRST-WINS for identical keys — used for the points ledger so an outcome
// recorded once (award or penalty) can never be replaced.
const unionArray = (currentVal: unknown, incomingVal: unknown, cap = 1000): unknown[] => {
  const cur = Array.isArray(currentVal) ? currentVal : [];
  const inc = Array.isArray(incomingVal) ? incomingVal : [];
  const seen = new Set<string>();
  const out: unknown[] = [];
  let i = 0;
  for (const item of [...cur, ...inc]) {
    const k = itemKey(item, i++);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out.slice(0, cap);
};

// Overlay a collection by id: keep every current item, let incoming items with
// the same id win (legitimate edits like document verification or "mark read"),
// and never drop an item the saving client simply hadn't loaded yet.
const mergeCollection = (currentVal: unknown[], incomingVal: unknown[], cap: number): unknown[] => {
  const byKey = new Map<string, unknown>();
  const order: string[] = [];
  let i = 0;
  const put = (arr: unknown[]) => {
    for (const item of arr) {
      const k = itemKey(item, i++);
      if (!byKey.has(k)) order.push(k);
      byKey.set(k, item); // incoming applied last => wins for same key
    }
  };
  put(Array.isArray(currentVal) ? currentVal : []);
  put(Array.isArray(incomingVal) ? incomingVal : []);
  return order.map((k) => byKey.get(k)).slice(0, cap);
};

// Per-key latest-wins for chat read receipts.
const mergeReadAt = (currentVal: Record<string, string>, incomingVal: Record<string, string>) => {
  const out: Record<string, string> = { ...(currentVal || {}) };
  Object.entries(incomingVal || {}).forEach(([k, v]) => {
    if (typeof v !== 'string') return;
    if (!out[k] || v > out[k]) out[k] = v;
  });
  return out;
};

// chatEmailNotify: earliest firstAt wins, reminded flags accumulate, and keys
// whose thread was read after firstAt are dropped (the reminder is obsolete).
const mergeEmailNotify = (
  currentVal: Record<string, unknown>,
  incomingVal: Record<string, unknown>,
  readAt: Record<string, string>,
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(currentVal || {}), ...Object.keys(incomingVal || {})]);
  for (const key of keys) {
    const cur = asRecord((currentVal || {})[key]);
    const inc = asRecord((incomingVal || {})[key]);
    const firstAtCur = cur ? getString(cur, 'firstAt') : '';
    const firstAtInc = inc ? getString(inc, 'firstAt') : '';
    const firstAt = [firstAtCur, firstAtInc].filter(Boolean).sort()[0] ?? '';
    if (!firstAt) continue;
    const reminded = Boolean(cur?.reminded) || Boolean(inc?.reminded);
    // key = `${threadKey}|${recipientId}` → read key = `${recipientId}|${threadKey}`
    const sep = key.lastIndexOf('|');
    if (sep > 0) {
      const recipientId = key.slice(sep + 1);
      const threadKey = key.slice(0, sep);
      const read = readAt[`${recipientId}|${threadKey}`];
      if (read && read >= firstAt) continue;
    }
    out[key] = { firstAt, reminded };
  }
  return out;
};

// Application fields that must never be downgraded from a real value back to
// empty by a stale snapshot. Re-uploads (a new non-empty URL) still win.
const PROTECTED_STR_FIELDS = [
  'intakeDetails', 'intakeVideoUrl', 'intakePassportCopy', 'intakeHighSchoolCertificate',
  'intakeHighSchoolMissingNote', 'intakeBirthCertificate', 'intakeMotherPassport',
  'intakeFatherPassport', 'dob',
  // Identity/assignment of an approved case must survive stale snapshots too.
  'studentId', 'assignedStaffId', 'university', 'program', 'studentEmail',
  'approvedBy', 'approvedAt',
];
// Application list fields that accumulate (attachments, audit trail, notes).
const PROTECTED_ARR_FIELDS = ['intakeAttachments', 'intakeExtraDocs', 'events', 'internalNotes'];

const PIPELINE_STAGE_IDS = [
  'translated_documents', 'university_approval', 'recognition_letter',
  'ministry_order', 'visa_documents', 'visa_residency',
] as const;

// Merge two pipeline objects without ever regressing progress: earliest
// timestamps win per stage (a stamp only appears once), status can only move
// forward (processing → closed/cancelled), `current` takes the furthest stage.
const mergePipeline = (curVal: unknown, incVal: unknown): unknown => {
  const cur = asRecord(curVal);
  const inc = asRecord(incVal);
  if (!cur) return inc ?? undefined;
  if (!inc) return cur;
  const curStages = asRecord(cur.stages) ?? {};
  const incStages = asRecord(inc.stages) ?? {};
  const stages: Record<string, unknown> = {};
  for (const sid of PIPELINE_STAGE_IDS) {
    const c = asRecord(curStages[sid]);
    const i = asRecord(incStages[sid]);
    if (!c && !i) continue;
    const pick = (field: string) => {
      const cv = c ? getString(c, field) : '';
      const iv = i ? getString(i, field) : '';
      // earliest non-empty timestamp wins (a stage event only happens once)
      if (cv && iv) return cv <= iv ? cv : iv;
      return cv || iv;
    };
    const pickBy = (tsField: string, whoField: string) => {
      const cv = c ? getString(c, tsField) : '';
      const iv = i ? getString(i, tsField) : '';
      const src = (cv && (!iv || cv <= iv)) ? c : i;
      return src ? getString(src, whoField) : '';
    };
    const track: Record<string, unknown> = {};
    for (const [ts, by, byName] of [
      ['startedAt', '', ''],
      ['completedAt', 'completedById', 'completedByName'],
      ['permissionAt', 'permissionById', 'permissionByName'],
    ] as const) {
      const v = pick(ts);
      if (v) track[ts] = v;
      if (by) { const b = pickBy(ts, by); if (b) track[by] = b; }
      if (byName) { const b = pickBy(ts, byName); if (b) track[byName] = b; }
    }
    if (Object.keys(track).length) stages[sid] = track;
  }
  const statusRank: Record<string, number> = { processing: 0, closed: 1, cancelled: 1 };
  const curStatus = getString(cur, 'status') || 'processing';
  const incStatus = getString(inc, 'status') || 'processing';
  const status = (statusRank[incStatus] ?? 0) >= (statusRank[curStatus] ?? 0) ? incStatus : curStatus;
  const stageRank = (s: string) => s === 'done' ? PIPELINE_STAGE_IDS.length : Math.max(0, PIPELINE_STAGE_IDS.indexOf(s as typeof PIPELINE_STAGE_IDS[number]));
  const curCurrent = getString(cur, 'current') || 'translated_documents';
  const incCurrent = getString(inc, 'current') || 'translated_documents';
  const current = stageRank(incCurrent) >= stageRank(curCurrent) ? incCurrent : curCurrent;
  const scalar = (field: string) => getString(cur, field) || getString(inc, field)
    ? ((getString(inc, field) || getString(cur, field)))
    : undefined;
  const out: Record<string, unknown> = { status, current, stages };
  for (const f of ['closedAt', 'cancelledAt', 'cancelledById', 'cancelledByName', 'cancelReason']) {
    const v = scalar(f);
    if (v) out[f] = v;
  }
  return out;
};

const mergeApplication = (cur: Record<string, unknown>, inc: Record<string, unknown>): Record<string, unknown> => {
  const merged: Record<string, unknown> = { ...cur, ...inc }; // last-write-wins baseline
  for (const f of PROTECTED_STR_FIELDS) {
    if (!isNonEmpty(inc[f]) && isNonEmpty(cur[f])) merged[f] = cur[f];
  }
  for (const f of PROTECTED_ARR_FIELDS) {
    merged[f] = unionArray(cur[f], inc[f], f === 'internalNotes' || f === 'events' ? 2000 : 400);
  }
  if (cur.intakeSLARewarded === true) merged.intakeSLARewarded = true; // never un-reward
  // A student rating, once given, never disappears or changes.
  if (cur.rating && typeof cur.rating === 'object') merged.rating = cur.rating;
  // Student credentials survive snapshots that never loaded them.
  if (cur.studentCredentials && typeof cur.studentCredentials === 'object' && !(inc.studentCredentials && typeof inc.studentCredentials === 'object')) {
    merged.studentCredentials = cur.studentCredentials;
  }
  // Status can never regress to 'submitted' once the application was processed.
  const curStatus = getString(cur, 'status');
  const incStatus = getString(inc, 'status');
  if ((curStatus === 'approved' || curStatus === 'rejected') && incStatus === 'submitted') {
    merged.status = curStatus;
  }
  const pipeline = mergePipeline(cur.pipeline, inc.pipeline);
  if (pipeline) merged.pipeline = pipeline;
  return merged;
};

// ── Application placement (active / future lead / trash / purged) ───────────
// One application id lives in exactly ONE bucket. The saving client's
// placement wins for ids it knows about; ids it never loaded stay where they
// are. Purged ids (tombstones) are dropped everywhere, forever.

type Placed = { row: Record<string, unknown>; bucket: 'active' | 'future' | 'trash' };

const placeApplications = (current: AppState, incoming: AppState, purged: Set<string>) => {
  const curPlace = new Map<string, Placed>();
  const incPlace = new Map<string, Placed>();
  const collect = (map: Map<string, Placed>, arr: unknown[], bucket: Placed['bucket']) => {
    for (const a of arr) {
      const r = asRecord(a);
      const id = r ? getString(r, 'id') : '';
      if (!r || !id) continue;
      if (!map.has(id)) map.set(id, { row: r, bucket });
    }
  };
  collect(curPlace, current.applications, 'active');
  collect(curPlace, current.futureLeads, 'future');
  collect(curPlace, current.trashedApplications, 'trash');
  collect(incPlace, incoming.applications, 'active');
  collect(incPlace, incoming.futureLeads, 'future');
  collect(incPlace, incoming.trashedApplications, 'trash');

  const out = { active: [] as unknown[], future: [] as unknown[], trash: [] as unknown[] };
  const push = (bucket: Placed['bucket'], row: unknown) => {
    if (bucket === 'active') out.active.push(row);
    else if (bucket === 'future') out.future.push(row);
    else out.trash.push(row);
  };

  // Incoming order first (client's view), then anything it never loaded.
  const seen = new Set<string>();
  for (const [id, inc] of incPlace) {
    if (purged.has(id)) continue;
    seen.add(id);
    const cur = curPlace.get(id);
    const row = cur ? mergeApplication(cur.row, inc.row) : inc.row;
    push(inc.bucket, row);
  }
  for (const [id, cur] of curPlace) {
    if (seen.has(id) || purged.has(id)) continue;
    push(cur.bucket, cur.row);
  }
  // Rows without ids (shouldn't happen) — keep incoming active ones as-is.
  for (const a of incoming.applications) {
    const r = asRecord(a);
    if (!r || getString(r, 'id')) continue;
    out.active.push(a);
  }
  return out;
};

// universityConfig: whole-object latest-wins by updatedAt.
const mergeUniversityConfig = (
  cur: Record<string, unknown> | null,
  inc: Record<string, unknown> | null,
): Record<string, unknown> | null => {
  if (!cur) return inc;
  if (!inc) return cur;
  const curAt = getString(cur, 'updatedAt');
  const incAt = getString(inc, 'updatedAt');
  return incAt >= curAt ? inc : cur;
};

// trashedUsers: union minus explicitly restored/purged users.
const mergeTrashedUsers = (cur: unknown[], inc: unknown[], unTrashed: Set<string>): unknown[] =>
  mergeCollection(cur, inc, 10_000).filter((u) => {
    const id = getString(asRecord(u), 'id');
    return !id || !unTrashed.has(id);
  });

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
      // Additive merge (see helpers above) instead of full overwrite, so a
      // teammate's freshly-saved data is never wiped by another internal user
      // saving an older snapshot.
      const purged = new Set([...current.purgedApplicationIds, ...incoming.purgedApplicationIds]);
      const unTrashed = new Set([...current.unTrashedUserIds, ...incoming.unTrashedUserIds]);
      const placed = placeApplications(current, incoming, purged);
      next = {
        applications: placed.active.slice(0, 50_000),
        futureLeads: placed.future.slice(0, 50_000),
        trashedApplications: placed.trash.slice(0, 50_000),
        documents: mergeCollection(current.documents, incoming.documents, 50_000),
        notifications: mergeCollection(current.notifications, incoming.notifications, 100_000),
        appointments: mergeCollection(current.appointments, incoming.appointments, 50_000),
        chatMessages: mergeCollection(current.chatMessages, incoming.chatMessages, 200_000),
        chatThreadReadAt: mergeReadAt(current.chatThreadReadAt, incoming.chatThreadReadAt),
        chatEmailNotify: mergeEmailNotify(current.chatEmailNotify, incoming.chatEmailNotify, mergeReadAt(current.chatThreadReadAt, incoming.chatThreadReadAt)),
        documentRequests: mergeCollection(current.documentRequests, incoming.documentRequests, 50_000),
        leads: mergeCollection(current.leads, incoming.leads, 50_000),
        trashedUsers: mergeTrashedUsers(current.trashedUsers, incoming.trashedUsers, unTrashed),
        credentialRequests: mergeCollection(current.credentialRequests, incoming.credentialRequests, 50_000),
        // FIRST-WINS union: a recorded SLA outcome can never be replaced.
        pointsLedger: unionArray(current.pointsLedger, incoming.pointsLedger, 200_000),
        universityConfig: mergeUniversityConfig(current.universityConfig, incoming.universityConfig),
        purgedApplicationIds: Array.from(purged).slice(0, 50_000),
        unTrashedUserIds: Array.from(unTrashed).slice(0, 50_000),
        digestMeta: current.digestMeta, // server-owned
        announcements: mergeCollection(current.announcements, incoming.announcements, 1000),
        pushTokens: current.pushTokens, // server-owned (written by /api/register-push)
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
      // Keep the client's message id when it isn't stored yet — regenerating
      // ids made every save/load cycle re-append the same messages (visible
      // as duplicated bubbles in the chat).
      const knownMessageIds = new Set(current.chatMessages.map((m) => getString(asRecord(m), 'id')).filter(Boolean));
      const newMessages = incoming.chatMessages.flatMap((m) => {
        const r = asRecord(m);
        if (!r) return [];
        const sender = getString(r, 'fromUserId') || getString(r, 'userId');
        if (sender !== userId) return [];
        const incomingId = getString(r, 'id');
        if (incomingId && knownMessageIds.has(incomingId)) return []; // already persisted
        const text = getString(r, 'text');
        if (!text || text.length > 5000) return [];
        const appId = getString(r, 'applicationId');
        if (appId && !(allowedThread(appId) || appId === `complaint-${userId}`)) return [];
        return [{
          id: incomingId || `${userId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          userId,
          toUserId: getString(r, 'toUserId'),
          text,
          applicationId: appId || undefined,
          time: now,
        }];
      });

      // Students may fulfil their own document requests: pending/rejected →
      // uploaded, with a file. Nothing else on the request is writable.
      const incReqById = new Map<string, Record<string, unknown>>();
      incoming.documentRequests.forEach((r0) => {
        const r = asRecord(r0);
        const id = r ? getString(r, 'id') : '';
        if (r && id) incReqById.set(id, r);
      });
      const mergedRequests = current.documentRequests.map((r0) => {
        const r = asRecord(r0);
        if (!r) return r0;
        if (getString(r, 'studentId') !== userId) return r0;
        if (getString(r, 'target') === 'agency') return r0;
        const inc = incReqById.get(getString(r, 'id'));
        if (!inc) return r0;
        const curStatus = getString(r, 'status');
        const incStatus = getString(inc, 'status');
        const file = getString(inc, 'fulfilledFile');
        const canUpload = curStatus === 'pending' || curStatus === 'rejected';
        if (canUpload && (incStatus === 'uploaded' || incStatus === 'fulfilled') && file) {
          return {
            ...r,
            status: 'uploaded',
            fulfilledFile: file.slice(0, 2000),
            fulfilledAt: now,
            uploadedByName: getString(inc, 'uploadedByName').slice(0, 120) || undefined,
          };
        }
        return r0;
      });

      // Students may add a one-time 1–5★ service rating to their own
      // application after residency (validated against the CURRENT state).
      const incAppById = new Map<string, Record<string, unknown>>();
      incoming.applications.forEach((a0) => {
        const a = asRecord(a0);
        const id = a ? getString(a, 'id') : '';
        if (a && id) incAppById.set(id, a);
      });
      const acceptedRatings: Array<{ appId: string; name: string; stars: number; comment?: string }> = [];
      const mergedApps = current.applications.map((a0) => {
        const a = asRecord(a0);
        if (!a) return a0;
        if (getString(a, 'studentId') !== userId) return a0;
        if (a.rating && typeof a.rating === 'object') return a0; // already rated
        const inc = incAppById.get(getString(a, 'id'));
        const rating = inc ? asRecord(inc.rating) : null;
        if (!rating || typeof rating.stars !== 'number') return a0;
        const stars = Math.round(rating.stars);
        if (stars < 1 || stars > 5) return a0;
        const pipeline = asRecord(a.pipeline);
        const stages = pipeline ? asRecord(pipeline.stages) : null;
        const visaRes = stages ? asRecord(stages.visa_residency) : null;
        const residencyDone = (pipeline && getString(pipeline, 'status') === 'closed') || Boolean(visaRes && getString(visaRes, 'completedAt'));
        if (!residencyDone) return a0;
        const comment = typeof rating.comment === 'string' ? rating.comment.slice(0, 2000) : undefined;
        acceptedRatings.push({ appId: getString(a, 'id'), name: getString(a, 'name'), stars, comment });
        return { ...a, rating: { stars, ...(comment ? { comment } : {}), at: now } };
      });

      // Clients can't be trusted to notify the CEO about their own rating —
      // the server generates those notifications when a rating is accepted.
      let ratingNotifications: unknown[] = [];
      if (acceptedRatings.length) {
        const ceoResp = await fetchJsonWithAdminHeaders(`${base}/rest/v1/profiles?role=eq.ceo&select=id`, { method: 'GET' }, adminKey);
        const ceoIds = Array.isArray(ceoResp.json)
          ? ceoResp.json.map((r: unknown) => getString(asRecord(r), 'id')).filter(Boolean)
          : [];
        ratingNotifications = acceptedRatings.flatMap(r => ceoIds.map((cid: string) => ({
          id: `${r.appId}-rating-${cid}`,
          userId: cid,
          title: `New ${r.stars}-star rating`,
          message: `${r.name} rated the service ${r.stars}/5${r.comment ? ` — "${r.comment.slice(0, 120)}"` : ''}`,
          type: 'success',
          time: now,
          read: false,
          link: '/admin?tab=performance',
        })));
      }

      next = {
        ...current,
        applications: mergedApps,
        chatThreadReadAt: mergedReadAt,
        chatMessages: uniqueBy([...current.chatMessages, ...newMessages], (x) => getString(asRecord(x), 'id')),
        documentRequests: mergedRequests,
        notifications: ratingNotifications.length
          ? mergeCollection(current.notifications, ratingNotifications, 100_000)
          : current.notifications,
      };
    } else if (role === 'agency') {
      const allowedApp = (id: string) =>
        current.applications.some((a) => getString(asRecord(a), 'agencyId') === userId && getString(asRecord(a), 'id') === id);
      // Same duplication guard as the student branch: never regenerate ids
      // for messages that are already stored.
      const knownMessageIds = new Set(current.chatMessages.map((m) => getString(asRecord(m), 'id')).filter(Boolean));
      const newMessages = incoming.chatMessages.flatMap((m) => {
        const r = asRecord(m);
        if (!r) return [];
        const sender = getString(r, 'fromUserId') || getString(r, 'userId');
        if (sender !== userId) return [];
        const incomingId = getString(r, 'id');
        if (incomingId && knownMessageIds.has(incomingId)) return []; // already persisted
        const text = getString(r, 'text');
        if (!text || text.length > 5000) return [];
        const appId = getString(r, 'applicationId');
        if (appId && !allowedApp(appId)) return [];
        return [{
          id: incomingId || `${userId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
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
        // Agencies (agents) may grant permission for gated pipeline stages —
        // that's the only pipeline write they are allowed.
        const mergeAgencyPipeline = (curP: unknown, incP: unknown): unknown => {
          const cur = asRecord(curP);
          const inc = asRecord(incP);
          if (!cur || !inc) return curP;
          const curStages = asRecord(cur.stages) ?? {};
          const incStages = asRecord(inc.stages) ?? {};
          const gated = ['recognition_letter', 'ministry_order'];
          let changed = false;
          const nextStages: Record<string, unknown> = { ...curStages };
          for (const sid of gated) {
            if (getString(cur, 'current') !== sid) continue; // only the current stage
            const c = asRecord(curStages[sid]);
            const i = asRecord(incStages[sid]);
            if (!i) continue;
            if (c && getString(c, 'permissionAt')) continue; // already granted
            const permissionAt = getString(i, 'permissionAt');
            if (!permissionAt) continue;
            changed = true;
            nextStages[sid] = {
              ...(c ?? {}),
              permissionAt: now,
              permissionById: userId,
              permissionByName: getString(i, 'permissionByName').slice(0, 120) || undefined,
              startedAt: getString(c ?? null, 'startedAt') || now,
            };
          }
          return changed ? { ...cur, stages: nextStages } : curP;
        };
        const nextApp = {
          ...baseApp,
          intakeExtraDocs: mergeArray(baseApp.intakeExtraDocs, r.intakeExtraDocs),
          intakeAttachments: mergeArray(baseApp.intakeAttachments, r.intakeAttachments),
          intakeVideoUrl: typeof r.intakeVideoUrl === 'string' ? r.intakeVideoUrl : baseApp.intakeVideoUrl,
          intakePassportCopy: typeof r.intakePassportCopy === 'string' ? r.intakePassportCopy : baseApp.intakePassportCopy,
          intakeHighSchoolCertificate: typeof r.intakeHighSchoolCertificate === 'string' ? r.intakeHighSchoolCertificate : baseApp.intakeHighSchoolCertificate,
          pipeline: mergeAgencyPipeline(baseApp.pipeline, r.pipeline),
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

      // Agencies may fulfil document requests addressed to them:
      // pending/rejected → uploaded, with a file.
      const incReqById = new Map<string, Record<string, unknown>>();
      incoming.documentRequests.forEach((r0) => {
        const r = asRecord(r0);
        const id = r ? getString(r, 'id') : '';
        if (r && id) incReqById.set(id, r);
      });
      const mergedRequests = current.documentRequests.map((r0) => {
        const r = asRecord(r0);
        if (!r) return r0;
        if (getString(r, 'target') !== 'agency' || getString(r, 'agencyId') !== userId) return r0;
        const inc = incReqById.get(getString(r, 'id'));
        if (!inc) return r0;
        const curStatus = getString(r, 'status');
        const incStatus = getString(inc, 'status');
        const file = getString(inc, 'fulfilledFile');
        const canUpload = curStatus === 'pending' || curStatus === 'rejected';
        if (canUpload && (incStatus === 'uploaded' || incStatus === 'fulfilled') && file) {
          return {
            ...r,
            status: 'uploaded',
            fulfilledFile: file.slice(0, 2000),
            fulfilledAt: now,
            uploadedByName: getString(inc, 'uploadedByName').slice(0, 120) || undefined,
          };
        }
        return r0;
      });

      next = {
        ...current,
        applications: mergedApps,
        chatThreadReadAt: mergedReadAt,
        chatMessages: uniqueBy([...current.chatMessages, ...newMessages], (x) => getString(asRecord(x), 'id')),
        documentRequests: mergedRequests,
      };
    } else {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // ── Push notifications ────────────────────────────────────────────────
    // Any NEW notification produced by this save whose recipient has the app
    // installed (a registered device token) is delivered as a phone push.
    // Best-effort: failures never block the save; dead tokens are pruned.
    if (pushConfigured() && next.pushTokens) {
      try {
        const beforeIds = new Set(current.notifications.map((n) => getString(asRecord(n), 'id')).filter(Boolean));
        const tokensMap = next.pushTokens as PushTokensMap;
        const fresh = next.notifications
          .map(asRecord)
          .filter((n): n is Record<string, unknown> => Boolean(n))
          .filter((n) => !beforeIds.has(getString(n, 'id')))
          .filter((n) => Array.isArray(tokensMap[getString(n, 'userId')]) && tokensMap[getString(n, 'userId')].length > 0)
          .slice(0, 10);
        let allDead: string[] = [];
        for (const n of fresh) {
          const result = await sendPushToUsers(tokensMap, [getString(n, 'userId')], {
            title: getString(n, 'title') || 'The Way',
            body: getString(n, 'message'),
            link: getString(n, 'link') || undefined,
          });
          allDead = allDead.concat(result.deadTokens);
        }
        if (allDead.length) next.pushTokens = prunePushTokens(tokensMap, allDead);
      } catch { /* push is best-effort */ }
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
