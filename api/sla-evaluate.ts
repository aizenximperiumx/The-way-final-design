// ─────────────────────────────────────────────────────────────────────────────
// Server-side SLA deadline sweep.
//
// Applies the automatic minus-points the moment a stage deadline passes
// (PRD §1 + owner decision 2026-07-10), even when no internal user is logged
// in. server.mjs runs runSlaSweep() on an interval; the HTTP handler lets an
// internal user trigger it manually (used by the CEO dashboard).
//
// The SLA rules here MIRROR src/lib/pipeline.ts — keep both in sync.
// Deterministic ledger ids (`sla-<appId>-<stage>`) make the sweep idempotent:
// a stage that was already scored (award or penalty) is never touched again.
// ─────────────────────────────────────────────────────────────────────────────

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

const asRecord = (value: unknown) => (value && typeof value === 'object') ? (value as Record<string, unknown>) : null;
const getString = (r: Record<string, unknown> | null, key: string) => (r && typeof r[key] === 'string' ? (r[key] as string) : '');

// ── SLA rules (mirror of src/lib/pipeline.ts) ────────────────────────────────

type SlaGroup = 'fast' | 'medium' | 'slow' | 'none';
type SlaWindow = { fullHours: number; halfHours: number; fullPoints: number; halfPoints: number; latePoints: number };

const DEFAULT_SLA_GROUPS: Record<string, SlaGroup> = {
  'georgian-american-university': 'fast',
  'caucasus-international-university': 'fast',
  'georgian-aviation-university': 'fast',
  'alte-university': 'fast',
  'university-of-georgia': 'fast',
  'tbilisi-state-medical-university': 'medium',
  'caucasus-university': 'medium',
  'georgian-technical-university': 'medium',
  'georgian-national-university-seu': 'slow',
  'international-black-sea-university': 'slow',
  'ilia-state-university': 'slow',
  'tbilisi-state-university': 'slow',
  'new-vision-university': 'none',
};

const APPROVAL_WINDOWS: Record<Exclude<SlaGroup, 'none'>, SlaWindow> = {
  fast: { fullHours: 36, halfHours: 72, fullPoints: 2, halfPoints: 1, latePoints: -2 },
  medium: { fullHours: 72, halfHours: 96, fullPoints: 2, halfPoints: 1, latePoints: -1 },
  slow: { fullHours: 240, halfHours: 280, fullPoints: 2, halfPoints: 1, latePoints: -2 },
};

const STAGE_LABELS: Record<string, string> = {
  translated_documents: 'Translated Documents',
  university_approval: 'University Initial Approval',
  recognition_letter: 'Recognition Letter',
  ministry_order: 'Ministry Order',
  visa_documents: 'Visa Required Documents',
  visa_residency: 'Visa & Residency',
};

const getSlaWindow = (stage: string, group: SlaGroup): SlaWindow | null => {
  switch (stage) {
    case 'translated_documents':
      return { fullHours: 36, halfHours: 72, fullPoints: 2, halfPoints: 1, latePoints: -2 };
    case 'university_approval':
      return group === 'none' ? null : APPROVAL_WINDOWS[group];
    case 'recognition_letter':
      return { fullHours: 216, halfHours: 240, fullPoints: 2, halfPoints: 1, latePoints: -2 };
    case 'ministry_order':
      return { fullHours: 432, halfHours: 480, fullPoints: 2, halfPoints: 1, latePoints: -2 };
    default:
      return null;
  }
};

// ── The sweep ────────────────────────────────────────────────────────────────

export type SweepResult = { ok: boolean; checked: number; penalized: number; error?: string };

export async function runSlaSweep(): Promise<SweepResult> {
  const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();
  if (!supabaseUrl || !serviceKey || !/^https?:\/\//i.test(supabaseUrl)) {
    return { ok: false, checked: 0, penalized: 0, error: 'Supabase is not configured' };
  }
  const base = supabaseUrl.replace(/\/$/, '');

  const stateResp = await fetchJsonWithAdminHeaders(`${base}/rest/v1/app_state?org_id=eq.default&select=state&limit=1`, { method: 'GET' }, serviceKey);
  const rawState = Array.isArray(stateResp.json) && stateResp.json[0] ? (stateResp.json[0].state as unknown) : null;
  const state = asRecord(rawState);
  if (!state) return { ok: false, checked: 0, penalized: 0, error: 'No shared state found' };

  const applications = Array.isArray(state.applications) ? state.applications : [];
  const ledger = Array.isArray(state.pointsLedger) ? state.pointsLedger : [];
  const notifications = Array.isArray(state.notifications) ? state.notifications : [];
  const config = asRecord(state.universityConfig);
  const configGroups = config ? asRecord(config.slaGroups) : null;

  const existingIds = new Set(ledger.map((e) => getString(asRecord(e), 'id')).filter(Boolean));
  const existingNotifIds = new Set(notifications.map((n) => getString(asRecord(n), 'id')).filter(Boolean));
  const now = new Date();
  const nowIso = now.toISOString();

  const newEntries: Record<string, unknown>[] = [];
  const newNotifs: Record<string, unknown>[] = [];
  let checked = 0;

  for (const a0 of applications) {
    const app = asRecord(a0);
    if (!app) continue;
    const pipeline = asRecord(app.pipeline);
    if (!pipeline || getString(pipeline, 'status') !== 'processing') continue;
    const stage = getString(pipeline, 'current');
    if (!stage || stage === 'done') continue;
    const stages = asRecord(pipeline.stages);
    const track = stages ? asRecord(stages[stage]) : null;
    const startedAt = track ? getString(track, 'startedAt') : '';
    if (!startedAt || (track && getString(track, 'completedAt'))) continue;
    const staffId = getString(app, 'assignedStaffId');
    if (!staffId) continue;
    checked += 1;

    const universityId = getString(app, 'university');
    const groupRaw = (configGroups ? getString(configGroups, universityId) : '') || DEFAULT_SLA_GROUPS[universityId] || 'none';
    const group = (['fast', 'medium', 'slow', 'none'].includes(groupRaw) ? groupRaw : 'none') as SlaGroup;
    const window = getSlaWindow(stage, group);
    if (!window) continue;

    const deadline = new Date(startedAt).getTime() + window.halfHours * 60 * 60 * 1000;
    if (now.getTime() <= deadline) continue;

    const appId = getString(app, 'id');
    const ledgerId = `sla-${appId}-${stage}`;
    if (existingIds.has(ledgerId)) continue;

    const label = STAGE_LABELS[stage] ?? stage;
    const appName = getString(app, 'name');
    newEntries.push({
      id: ledgerId,
      userId: staffId,
      delta: window.latePoints,
      reason: `${label} deadline passed — ${appName}`,
      kind: 'sla',
      at: nowIso,
      applicationId: appId,
      applicationName: appName,
      stage,
    });
    existingIds.add(ledgerId);
    const staffNotifId = `sla-late-${appId}-${stage}-staff`;
    if (!existingNotifIds.has(staffNotifId)) {
      newNotifs.push({
        id: staffNotifId,
        userId: staffId,
        title: `${window.latePoints} points — deadline passed`,
        message: `${label} for ${appName} is overdue.`,
        type: 'alert',
        time: nowIso,
        read: false,
      });
    }
  }

  if (!newEntries.length) return { ok: true, checked, penalized: 0 };

  const nextState = {
    ...state,
    pointsLedger: [...ledger, ...newEntries],
    notifications: [...notifications, ...newNotifs],
  };
  const upserted = await fetchJsonWithAdminHeaders(`${base}/rest/v1/app_state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ org_id: 'default', state: nextState, updated_at: nowIso, updated_by: null }),
  }, serviceKey);
  if (!upserted.ok) return { ok: false, checked, penalized: 0, error: `Failed to save: ${upserted.text?.slice(0, 200)}` };
  console.log(`SLA sweep: ${newEntries.length} penalt${newEntries.length === 1 ? 'y' : 'ies'} applied (${checked} active stages checked)`);
  return { ok: true, checked, penalized: newEntries.length };
}

// HTTP trigger — internal users only.
export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
    const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();
    if (!supabaseUrl || !serviceKey) {
      res.status(500).json({ error: 'Supabase is not configured' });
      return;
    }
    const base = supabaseUrl.replace(/\/$/, '');
    const token = getBearer(req);
    if (!token) {
      res.status(401).json({ error: 'Missing token' });
      return;
    }
    const who = await fetchJson(`${base}/auth/v1/user`, {
      method: 'GET',
      headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
    });
    if (!who.ok || !who.json || typeof who.json.id !== 'string') {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    const appMeta = asRecord((who.json as Record<string, unknown>).app_metadata);
    let role = appMeta ? getString(appMeta, 'role') : '';
    if (!role) {
      const profile = await fetchJsonWithAdminHeaders(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(String(who.json.id))}&select=role&limit=1`, { method: 'GET' }, serviceKey);
      role = Array.isArray(profile.json) && profile.json[0] ? getString(asRecord(profile.json[0]), 'role') : '';
    }
    if (!['ceo', 'sales', 'ops', 'staff', 'agency_staff', 'customer_support'].includes(role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const result = await runSlaSweep();
    res.status(result.ok ? 200 : 500).json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
