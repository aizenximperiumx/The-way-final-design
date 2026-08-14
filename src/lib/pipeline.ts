// ─────────────────────────────────────────────────────────────────────────────
// Case pipeline + staff-performance SLA engine (PRD sections 1–3).
//
// Every approved application moves through the document pipeline:
//   translated_documents → university_approval → recognition_letter
//   → ministry_order → visa_documents → visa_residency
// with case status processing → closed (auto after visa+residency) or
// cancelled (CEO only).
//
// Staff Performance Points are awarded/deducted automatically per stage:
//   Translated Documents          <36h +2 | 36–72h +1 | >72h −2
//   University Initial Approval   depends on the university's SLA group
//     fast (GAU, CIU, Aviation, ALTE, UG)   <36h +2 | 36–72h +1 | >72h −2
//     medium (TSMU, CU, GTU)                <72h +2 | 72–96h +1 | >96h −1
//     slow (SEU, IBSU, ISU, TSU)            <240h +2 | 240–280h +1 | >280h −2
//   Recognition Letter (timer starts at Agency/Sales/CEO permission)
//                                 <216h +2 | 216–240h +1 | >240h −2
//   Ministry Order (permission starts timer)
//                                 <432h +2 | 432–480h +1 | >480h −2
//   Visa Required Documents       no points
//   Visa + Residency uploaded     +2 and Processing → Closed
//
// Penalties apply AUTOMATICALLY the moment the deadline passes (owner
// decision, 2026-07-10) — evaluated lazily on the client and on a server
// interval. Ledger entry ids are deterministic (`sla-<appId>-<stage>`) so the
// same stage can never be scored twice, no matter how many clients evaluate.
//
// NOTE: api/_sla-rules.ts mirrors these rules for the server-side sweep.
// Keep both in sync when the rules change.
// ─────────────────────────────────────────────────────────────────────────────

import type { UniversitySlaGroup } from './universities';

export type CaseStatus = 'processing' | 'closed' | 'cancelled';

export type PipelineStageId =
  | 'payment_1'
  | 'translated_documents'
  | 'university_approval'
  | 'recognition_letter'
  | 'ministry_order'
  | 'payment_2'
  | 'visa_documents'
  | 'visa_residency';

export interface PipelineStageMeta {
  id: PipelineStageId;
  label: string;
  shortLabel: string;
  description: string;
  /** Timer starts only after Agency/Sales/CEO grants permission. */
  permissionGated: boolean;
  /**
   * The case is waiting on the student, not on us: a payment to arrive.
   *
   * These stages carry no SLA window and no points. Staff cannot be late for
   * something they are not doing, and the clock must not run while a student
   * decides. Recognition and Ministry Order used to be permission-gated for
   * exactly this reason - someone senior clicked to release them once money
   * had arrived - but nothing said so, so the student saw an unexplained
   * block and staff saw a step that would not move. The wait is now a stage
   * of its own, which is what it always was.
   */
  awaitsStudent: boolean;
  /** What the student gets for paying, shown on the payment step. */
  unlocks?: string[];
}

export const PIPELINE_STAGES: PipelineStageMeta[] = [
  {
    id: 'payment_1',
    label: 'First Payment',
    shortLabel: 'Payment 1',
    description: 'The first instalment. No work begins until this is confirmed received.',
    permissionGated: false,
    awaitsStudent: true,
    unlocks: [
      'Document translation and notarisation',
      'Your university application and acceptance letter',
      'Recognition letter and ministry order',
      'A dedicated advisor for your whole application',
    ],
  },
  {
    id: 'translated_documents',
    label: 'Translated Documents',
    shortLabel: 'Translation',
    description: 'Translate and notarize the student documents.',
    permissionGated: false,
    awaitsStudent: false,
  },
  {
    id: 'university_approval',
    label: 'University Initial Approval',
    shortLabel: 'Uni Approval',
    description: 'Obtain the initial approval / acceptance letter from the university.',
    permissionGated: false,
    awaitsStudent: false,
  },
  {
    id: 'recognition_letter',
    label: 'Recognition Letter',
    shortLabel: 'Recognition',
    description: 'Obtain the recognition letter from the ministry.',
    permissionGated: false,
    awaitsStudent: false,
  },
  {
    id: 'ministry_order',
    label: 'Ministry Order',
    shortLabel: 'Ministry',
    description: 'Obtain the ministry order. The student may stop here if they paid only the first instalment.',
    permissionGated: false,
    awaitsStudent: false,
  },
  {
    id: 'payment_2',
    label: 'Second Payment',
    shortLabel: 'Payment 2',
    description: 'Optional. Continues the case through visa and arrival, or the case closes here.',
    permissionGated: false,
    awaitsStudent: true,
    unlocks: [
      'Your visa documents, prepared and checked',
      'Visa and residency permit',
      'Airport pickup when you land in Georgia',
      'Help settling in: housing, bank account, SIM card',
      'Ongoing support for as long as you study',
    ],
  },
  {
    id: 'visa_documents',
    label: 'Visa Required Documents',
    shortLabel: 'Visa Docs',
    description: 'Collect and prepare all documents required for the visa. No performance points.',
    permissionGated: false,
    awaitsStudent: false,
  },
  {
    id: 'visa_residency',
    label: 'Visa & Residency',
    shortLabel: 'Visa+Residency',
    description: 'Upload the visa and residency. Completing this closes the case (+2 points).',
    permissionGated: false,
    awaitsStudent: false,
  },
];

/**
 * The last stage a student who paid only the first instalment reaches.
 *
 * Completing it with no second payment closes the case as partial: the work
 * they paid for is finished. The account keeps its basic card, and the CEO can
 * resume the case if they later decide to continue.
 */
export const PARTIAL_CLOSE_AFTER: PipelineStageId = 'ministry_order';

/** Stages that wait on the student rather than on us. */
export const isAwaitingStudent = (id: PipelineStageId): boolean =>
  getStageMeta(id).awaitsStudent;

export const PIPELINE_ORDER: PipelineStageId[] = PIPELINE_STAGES.map(s => s.id);

export const getStageMeta = (id: PipelineStageId): PipelineStageMeta =>
  PIPELINE_STAGES.find(s => s.id === id) ?? PIPELINE_STAGES[0];

export const nextStageOf = (id: PipelineStageId): PipelineStageId | null => {
  const i = PIPELINE_ORDER.indexOf(id);
  return i >= 0 && i < PIPELINE_ORDER.length - 1 ? PIPELINE_ORDER[i + 1] : null;
};

export interface StageTrack {
  /** When the SLA timer started (stage entry, or permission for gated stages). */
  startedAt?: string;
  completedAt?: string;
  completedById?: string;
  completedByName?: string;
  permissionAt?: string;
  permissionById?: string;
  permissionByName?: string;
}

export interface ApplicationPipeline {
  status: CaseStatus;
  /** Current stage; 'done' once the case is closed. */
  current: PipelineStageId | 'done';
  stages: Partial<Record<PipelineStageId, StageTrack>>;
  closedAt?: string;
  /**
   * Closed at Ministry Order because only the first instalment was paid.
   *
   * Deliberately a flag on a normally closed case rather than a fourth case
   * status: everything that already asks whether a case is closed stays
   * correct, because it is closed. This only adds that it can be continued.
   */
  partial?: boolean;
  /** Set when the CEO reopens a partially closed case at the second payment. */
  resumedAt?: string;
  resumedById?: string;
  resumedByName?: string;
  cancelledAt?: string;
  cancelledById?: string;
  cancelledByName?: string;
  cancelReason?: string;
}

// ── SLA windows ───────────────────────────────────────────────────────────────

export interface SlaWindow {
  /** Hours for the full (+2) award. */
  fullHours: number;
  /** Hours for the half (+1) award. */
  halfHours: number;
  fullPoints: number;
  halfPoints: number;
  /** Points applied when the halfHours deadline passes (negative). */
  latePoints: number;
}

const APPROVAL_WINDOWS: Record<Exclude<UniversitySlaGroup, 'none'>, SlaWindow> = {
  fast: { fullHours: 36, halfHours: 72, fullPoints: 2, halfPoints: 1, latePoints: -2 },
  medium: { fullHours: 72, halfHours: 96, fullPoints: 2, halfPoints: 1, latePoints: -1 },
  slow: { fullHours: 240, halfHours: 280, fullPoints: 2, halfPoints: 1, latePoints: -2 },
};

/**
 * Returns the SLA window for a stage (null → the stage carries no timed points).
 * `slaGroup` only matters for university_approval.
 */
export function getSlaWindow(stage: PipelineStageId, slaGroup: UniversitySlaGroup): SlaWindow | null {
  switch (stage) {
    // Waiting on the student's money. No window, so no deadline and no
    // penalty: a case parked here must never cost an advisor points.
    case 'payment_1':
    case 'payment_2':
      return null;
    case 'translated_documents':
      return { fullHours: 36, halfHours: 72, fullPoints: 2, halfPoints: 1, latePoints: -2 };
    case 'university_approval':
      return slaGroup === 'none' ? null : APPROVAL_WINDOWS[slaGroup];
    case 'recognition_letter':
      return { fullHours: 216, halfHours: 240, fullPoints: 2, halfPoints: 1, latePoints: -2 };
    case 'ministry_order':
      return { fullHours: 432, halfHours: 480, fullPoints: 2, halfPoints: 1, latePoints: -2 };
    case 'visa_documents':
      return null; // explicitly no points
    case 'visa_residency':
      return null; // fixed +2 on completion, no timer
  }
}

/** Fixed award for completing visa+residency (closes the case). */
export const VISA_RESIDENCY_POINTS = 2;

export const hoursBetween = (fromIso: string, toIso: string): number => {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return (to - from) / (1000 * 60 * 60);
};

/**
 * Points earned for completing a stage, given its window and timer start.
 * Late completion earns the (negative) late points — but the automatic
 * deadline sweep normally records the penalty first, and the deterministic
 * ledger id prevents double scoring either way.
 */
export function slaPointsForCompletion(window: SlaWindow, startedAt: string, completedAt: string): number {
  const h = hoursBetween(startedAt, completedAt);
  if (h < window.fullHours) return window.fullPoints;
  if (h <= window.halfHours) return window.halfPoints;
  return window.latePoints;
}

/** The moment the stage becomes "late" (penalty applies automatically). */
export function slaDeadline(window: SlaWindow, startedAt: string): Date {
  return new Date(new Date(startedAt).getTime() + window.halfHours * 60 * 60 * 1000);
}

/** Deterministic ledger id — one SLA outcome per application+stage, forever. */
export const slaLedgerId = (applicationId: string, stage: PipelineStageId) => `sla-${applicationId}-${stage}`;

// ── Points ledger ─────────────────────────────────────────────────────────────

export type PointsEntryKind = 'sla' | 'adjustment' | 'activity';

export interface PointsEntry {
  id: string;
  userId: string;
  delta: number;
  reason: string;
  kind: PointsEntryKind;
  at: string;
  applicationId?: string;
  applicationName?: string;
  stage?: PipelineStageId;
  byId?: string;
  byName?: string;
}

/** Total points per user from the ledger. */
export function ledgerTotals(ledger: PointsEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const e of ledger) {
    if (!e || typeof e.userId !== 'string' || typeof e.delta !== 'number') continue;
    totals.set(e.userId, (totals.get(e.userId) ?? 0) + e.delta);
  }
  return totals;
}

// ── Shared university runtime config (CEO-editable, lives in app_state) ─────

export interface UniversityConfig {
  /** universityId → staff username ('' / missing = unassigned). */
  assignments: Record<string, string>;
  /** universityId → SLA group override. */
  slaGroups: Record<string, UniversitySlaGroup>;
  updatedAt: string;
  updatedByName?: string;
}

// ── Legacy stage migration ────────────────────────────────────────────────────

/** Maps the pre-2026 stage model onto the new pipeline (best-effort). */
export function legacyStageToPipeline(stage: string, nowIso: string): ApplicationPipeline {
  const start = (current: PipelineStageId): ApplicationPipeline => ({
    status: 'processing',
    current,
    stages: { [current]: { startedAt: nowIso } },
  });
  switch (stage) {
    case 'applied':
    case 'contacted':
    case 'accepted':
      return start('translated_documents');
    case 'documents':
      return start('university_approval');
    case 'visa':
      return start('visa_documents');
    case 'enrolled':
      return {
        status: 'closed',
        current: 'done',
        stages: {},
        closedAt: nowIso,
      };
    default:
      return start('translated_documents');
  }
}
