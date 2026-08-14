import { useEffect, useMemo, useState } from 'react';
import { useAppStore, type Application } from '../../store/appStore';
import {
  getSlaWindow, slaDeadline, getStageMeta, PIPELINE_ORDER, type PipelineStageId,
} from '../../lib/pipeline';
import { DEFAULT_SLA_GROUPS, type UniversitySlaGroup } from '../../lib/universities';

/**
 * The advisor's priority queue, mirroring the portal's "My Day": every active
 * case ordered by how close its current stage is to the penalty deadline.
 * Overdue first, then most urgent, then stages still waiting on permission.
 */

export type CaseKind = 'overdue' | 'due' | 'payment' | 'permission' | 'notimer';

export interface CaseRow {
  app: Application;
  stage: PipelineStageId;
  label: string;
  kind: CaseKind;
  /** ms until the penalty deadline; negative once overdue. */
  msLeft: number | null;
  /** 1-based position of the current stage; compare against TOTAL_STAGES. */
  stageNo: number;
}

/** "2d 4h" · "5h 20m" · "45m" — same shape the portal uses. */
export const fmtLeft = (ms: number): string => {
  const totalMinutes = Math.max(0, Math.round(Math.abs(ms) / 60000));
  const d = Math.floor(totalMinutes / (24 * 60));
  const h = Math.floor((totalMinutes % (24 * 60)) / 60);
  const m = totalMinutes % 60;
  if (d >= 2) return `${d}d ${h}h`;
  if (totalMinutes >= 60) return `${d * 24 + h}h ${m}m`;
  return `${m}m`;
};

// Payments rank above permission and idle stages: a case held on money is the
// one thing that stops all work, and only the CEO can clear it.
const ORDER: Record<CaseKind, number> = { overdue: 0, due: 1, payment: 2, permission: 3, notimer: 4 };

export const useCases = (applications: Application[]): CaseRow[] => {
  const universityConfig = useAppStore(s => s.universityConfig);
  const [now, setNow] = useState(() => Date.now());

  // Countdowns stay live without re-rendering more than once a minute.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(() => {
    const rows: CaseRow[] = [];
    for (const app of applications) {
      const p = app.pipeline;
      if (!p || p.status !== 'processing' || p.current === 'done') continue;
      const stage = p.current as PipelineStageId;
      const meta = getStageMeta(stage);
      const track = p.stages[stage] ?? {};
      const stageNo = Math.max(1, getStageIndex(stage) + 1);
      const group: UniversitySlaGroup =
        (universityConfig?.slaGroups?.[app.university ?? ''] as UniversitySlaGroup)
        ?? DEFAULT_SLA_GROUPS[app.university ?? ''] ?? 'none';
      const window_ = getSlaWindow(stage, group);

      // Waiting on the student's money, not on us. Its own kind so the CEO can
      // see every case held up on a payment in one place, and so it never
      // appears in a staff queue as though someone were sitting on it.
      if (meta.awaitsStudent) {
        rows.push({ app, stage, label: meta.label, kind: 'payment', msLeft: null, stageNo });
        continue;
      }
      if (meta.permissionGated && !track.permissionAt) {
        rows.push({ app, stage, label: meta.label, kind: 'permission', msLeft: null, stageNo });
        continue;
      }
      if (!window_ || !track.startedAt) {
        rows.push({ app, stage, label: meta.label, kind: 'notimer', msLeft: null, stageNo });
        continue;
      }
      const msLeft = slaDeadline(window_, track.startedAt).getTime() - now;
      rows.push({ app, stage, label: meta.label, kind: msLeft < 0 ? 'overdue' : 'due', msLeft, stageNo });
    }
    rows.sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || (a.msLeft ?? Infinity) - (b.msLeft ?? Infinity));
    return rows;
  }, [applications, universityConfig, now]);
};

/**
 * Taken from the pipeline itself rather than copied.
 *
 * This was a local list "so the hook does not depend on PIPELINE_ORDER's export
 * shape", and it silently fell out of date the moment the two payment stages
 * were added: every case waiting on a payment reported itself as stage 1 of 6.
 * One list, so it cannot happen again.
 */
export const TOTAL_STAGES = PIPELINE_ORDER.length;
export const getStageIndex = (id: PipelineStageId): number => PIPELINE_ORDER.indexOf(id);
