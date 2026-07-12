import React, { useEffect, useState } from 'react';
import { AlarmClock, AlertTriangle, ChevronRight, KeyRound, Sun } from 'lucide-react';
import type { Application } from '../../store/appStore';
import { useAppStore } from '../../store/appStore';
import { getSlaWindow, slaDeadline, getStageMeta, type PipelineStageId } from '../../lib/pipeline';
import { DEFAULT_SLA_GROUPS, type UniversitySlaGroup } from '../../lib/universities';
import { DashboardSection, EmptyState } from './ui';

/**
 * "My Day" — the staff member's priority queue: every active case ordered by
 * how close its current stage is to the penalty deadline. Overdue first,
 * then most-urgent, then stages waiting on permission.
 */

const fmtLeft = (ms: number): string => {
  const totalMinutes = Math.max(0, Math.round(Math.abs(ms) / 60000));
  const d = Math.floor(totalMinutes / (24 * 60));
  const h = Math.floor((totalMinutes % (24 * 60)) / 60);
  const m = totalMinutes % 60;
  if (d >= 2) return `${d}d ${h}h`;
  if (totalMinutes >= 60) return `${d * 24 + h}h ${m}m`;
  return `${m}m`;
};

type Row = {
  app: Application;
  stage: PipelineStageId;
  label: string;
  kind: 'overdue' | 'due' | 'permission' | 'notimer';
  /** ms until the penalty deadline (negative = overdue). */
  msLeft: number | null;
};

export const MyDay: React.FC<{
  applications: Application[];
  onSelect: (applicationId: string) => void;
}> = ({ applications, onSelect }) => {
  const universityConfig = useAppStore(s => s.universityConfig);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const rows: Row[] = [];
  for (const app of applications) {
    const p = app.pipeline;
    if (!p || p.status !== 'processing' || p.current === 'done') continue;
    const stage = p.current as PipelineStageId;
    const meta = getStageMeta(stage);
    const track = p.stages[stage] ?? {};
    const group: UniversitySlaGroup =
      (universityConfig?.slaGroups?.[app.university ?? ''] as UniversitySlaGroup)
      ?? DEFAULT_SLA_GROUPS[app.university ?? ''] ?? 'none';
    const window_ = getSlaWindow(stage, group);

    if (meta.permissionGated && !track.permissionAt) {
      rows.push({ app, stage, label: meta.label, kind: 'permission', msLeft: null });
      continue;
    }
    if (!window_ || !track.startedAt) {
      rows.push({ app, stage, label: meta.label, kind: 'notimer', msLeft: null });
      continue;
    }
    const msLeft = slaDeadline(window_, track.startedAt).getTime() - now;
    rows.push({ app, stage, label: meta.label, kind: msLeft < 0 ? 'overdue' : 'due', msLeft });
  }

  const order = { overdue: 0, due: 1, permission: 2, notimer: 3 } as const;
  rows.sort((a, b) => order[a.kind] - order[b.kind] || (a.msLeft ?? Infinity) - (b.msLeft ?? Infinity));

  return (
    <DashboardSection title="My Day" icon={Sun} count={rows.length ? `${rows.length} active case${rows.length > 1 ? 's' : ''}` : undefined}>
      {rows.length === 0 ? (
        <EmptyState icon={Sun} title="Nothing urgent today" hint="Active cases appear here ordered by deadline." />
      ) : (
        <ul className="divide-y divide-gray-50">
          {rows.map((r) => {
            const urgent = r.kind === 'due' && (r.msLeft ?? 0) < 24 * 3600_000;
            return (
              <li key={r.app.id}>
                <button
                  onClick={() => onSelect(r.app.id)}
                  className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 text-left transition-colors hover:bg-gray-50/70"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    r.kind === 'overdue' ? 'bg-red-50 text-red-500'
                      : urgent ? 'bg-amber-50 text-amber-600'
                      : r.kind === 'permission' ? 'bg-blue-50 text-blue-500'
                      : 'bg-gray-50 text-gray-400'
                  }`}>
                    {r.kind === 'overdue' ? <AlertTriangle className="h-4 w-4" />
                      : r.kind === 'permission' ? <KeyRound className="h-4 w-4" />
                      : <AlarmClock className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{r.app.name}</p>
                    <p className="text-[11px] text-gray-400">{r.label}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                    r.kind === 'overdue' ? 'bg-red-50 text-red-600'
                      : urgent ? 'bg-amber-50 text-amber-700'
                      : r.kind === 'due' ? 'bg-emerald-50 text-emerald-600'
                      : r.kind === 'permission' ? 'bg-blue-50 text-blue-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {r.kind === 'overdue' ? `Overdue ${fmtLeft(r.msLeft ?? 0)}`
                      : r.kind === 'due' ? `${fmtLeft(r.msLeft ?? 0)} left`
                      : r.kind === 'permission' ? 'Awaiting permission'
                      : 'No timer'}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardSection>
  );
};

export default MyDay;
