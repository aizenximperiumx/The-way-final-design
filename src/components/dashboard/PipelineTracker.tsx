import React, { useEffect, useState } from 'react';
import {
  CheckCircle2, Circle, Clock, Lock, ShieldCheck, XCircle,
  ChevronRight, AlertTriangle, KeyRound, Ban, Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore, STAGE_TO_DOC_TYPES, type Application } from '../../store/appStore';
import {
  PIPELINE_STAGES, getSlaWindow, slaDeadline, hoursBetween,
  type PipelineStageId,
} from '../../lib/pipeline';
import { DEFAULT_SLA_GROUPS, type UniversitySlaGroup } from '../../lib/universities';

/**
 * Case pipeline visual — the heart of every application view. Shows the six
 * document stages with live SLA timers, permission gates and (role-dependent)
 * action buttons. Used by Staff, Sales, Agency, CEO and (read-only) Student.
 */

const fmtRemaining = (hours: number): string => {
  const totalMinutes = Math.max(0, Math.round(Math.abs(hours) * 60));
  const d = Math.floor(totalMinutes / (24 * 60));
  const h = Math.floor((totalMinutes % (24 * 60)) / 60);
  const m = totalMinutes % 60;
  if (d >= 2) return `${d}d ${h}h`;
  if (totalMinutes >= 60) return `${d * 24 + h}h ${m}m`;
  return `${m}m`;
};

const useNow = (tickMs = 30_000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);
  return now;
};

const SlaChip: React.FC<{ startedAt: string; stage: PipelineStageId; slaGroup: UniversitySlaGroup }> = ({ startedAt, stage, slaGroup }) => {
  const now = useNow();
  const window_ = getSlaWindow(stage, slaGroup);
  if (!window_) return null;
  const nowIso = new Date(now).toISOString();
  const elapsed = hoursBetween(startedAt, nowIso);
  const deadline = slaDeadline(window_, startedAt).getTime();
  if (now > deadline) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-600">
        <AlertTriangle className="h-3 w-3" /> Overdue {fmtRemaining((now - deadline) / 3_600_000)} ({window_.latePoints} pts)
      </span>
    );
  }
  if (elapsed < window_.fullHours) {
    const left = window_.fullHours - elapsed;
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
        <Clock className="h-3 w-3" /> {fmtRemaining(left)} for +{window_.fullPoints}
      </span>
    );
  }
  const left = window_.halfHours - elapsed;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-600">
      <Clock className="h-3 w-3" /> {fmtRemaining(left)} for +{window_.halfPoints}
    </span>
  );
};

export const CaseStatusBadge: React.FC<{ application: Application }> = ({ application }) => {
  const p = application.pipeline;
  if (!p) return null;
  if (p.status === 'closed') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Closed</span>;
  }
  if (p.status === 'cancelled') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-600"><Ban className="h-3.5 w-3.5" /> Cancelled</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-blue-700"><Clock className="h-3.5 w-3.5" /> Processing</span>;
};

export const PipelineTracker: React.FC<{
  application: Application;
  /** Compact horizontal strip (student dashboard hero). */
  compact?: boolean;
}> = ({ application, compact = false }) => {
  const { currentUser, universityConfig, documents, grantStagePermission, completePipelineStage, ceoCancelApplication } = useAppStore();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const p = application.pipeline;
  if (!p) return null;

  const role = currentUser?.role ?? '';
  const canComplete = ['staff', 'agency_staff', 'ceo'].includes(role);
  const canPermit = role === 'sales' || role === 'ceo' || (role === 'agency' && application.agencyId === currentUser?.id);
  const isCeo = role === 'ceo';
  const slaGroup: UniversitySlaGroup = (universityConfig?.slaGroups?.[application.university ?? ''] as UniversitySlaGroup)
    ?? DEFAULT_SLA_GROUPS[application.university ?? ''] ?? 'none';

  const currentIdx = p.current === 'done' ? PIPELINE_STAGES.length : PIPELINE_STAGES.findIndex(s => s.id === p.current);

  const doAction = (fn: () => void, ok: string) => {
    try { fn(); toast.success(ok); } catch (e) { toast.error(e instanceof Error ? e.message : 'Action failed'); }
  };

  const stageDocsPresent = (stage: PipelineStageId) =>
    STAGE_TO_DOC_TYPES[stage].every(t => documents.some(d => d.studentId === application.studentId && d.type === t));

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
        {PIPELINE_STAGES.map((s, i) => {
          const done = Boolean(p.stages[s.id]?.completedAt) || i < currentIdx || p.status === 'closed';
          const active = p.status === 'processing' && p.current === s.id;
          return (
            <React.Fragment key={s.id}>
              {i > 0 && <div className={`h-0.5 w-4 sm:w-6 shrink-0 rounded ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
              <div className="flex flex-col items-center gap-1 shrink-0" title={s.label}>
                <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-black
                  ${done ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                    : active ? 'border-amber-400 bg-amber-50 text-amber-600 animate-pulse'
                    : 'border-gray-200 bg-white text-gray-300'}`}>
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wide whitespace-nowrap ${active ? 'text-amber-600' : done ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {s.shortLabel}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gradient-to-r from-[#0A1628] to-[#12294a] px-4 sm:px-5 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Award className="h-4 w-4 text-amber-400 shrink-0" />
          <h4 className="text-sm font-bold text-white truncate">Case Pipeline</h4>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CaseStatusBadge application={application} />
          {isCeo && p.status === 'processing' && (
            <button
              onClick={() => setCancelOpen(v => !v)}
              className="inline-flex items-center gap-1 rounded-lg border border-red-300/40 bg-red-500/10 px-2 py-1 text-[11px] font-bold text-red-300 hover:bg-red-500/20 transition-colors"
            >
              <Ban className="h-3 w-3" /> Cancel case
            </button>
          )}
        </div>
      </div>

      {cancelOpen && (
        <div className="border-b border-red-100 bg-red-50/60 px-4 sm:px-5 py-3">
          <p className="mb-2 text-xs font-bold text-red-700">Cancel this case (CEO only) — the pipeline stops permanently.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason (optional)"
              className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300/40"
            />
            <button
              onClick={() => { doAction(() => ceoCancelApplication(application.id, cancelReason), 'Case cancelled'); setCancelOpen(false); }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors"
            >
              Confirm cancel
            </button>
          </div>
        </div>
      )}

      {p.status === 'cancelled' && (
        <div className="flex items-start gap-2 border-b border-red-100 bg-red-50/60 px-4 sm:px-5 py-3">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-700">
            <span className="font-bold">Cancelled by {p.cancelledByName ?? 'CEO'}</span>
            {p.cancelledAt ? ` on ${new Date(p.cancelledAt).toLocaleDateString()}` : ''}
            {p.cancelReason ? ` — ${p.cancelReason}` : ''}
          </p>
        </div>
      )}

      <ol className="divide-y divide-gray-50">
        {PIPELINE_STAGES.map((s, i) => {
          const track = p.stages[s.id] ?? {};
          const done = Boolean(track.completedAt);
          const active = p.status === 'processing' && p.current === s.id;
          const needsPermission = s.permissionGated && active && !track.permissionAt;
          const recognitionBlocked = s.id === 'recognition_letter' && !application.intakeHighSchoolCertificate;
          const window_ = getSlaWindow(s.id, slaGroup);

          return (
            <li key={s.id} className={`px-4 sm:px-5 py-3 ${active ? 'bg-amber-50/40' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2
                  ${done ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                    : active ? 'border-amber-400 bg-amber-50 text-amber-600'
                    : 'border-gray-200 bg-white text-gray-300'}`}>
                  {done ? <CheckCircle2 className="h-4 w-4" />
                    : needsPermission ? <Lock className="h-3.5 w-3.5" />
                    : active ? <Clock className="h-4 w-4" />
                    : <Circle className="h-3 w-3" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className={`text-sm font-bold ${done ? 'text-emerald-700' : active ? 'text-gray-900' : 'text-gray-400'}`}>
                      {i + 1}. {s.label}
                    </p>
                    {active && track.startedAt && !done && (
                      <SlaChip startedAt={track.startedAt} stage={s.id} slaGroup={slaGroup} />
                    )}
                    {s.id === 'visa_documents' && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">No points</span>
                    )}
                    {s.id === 'visa_residency' && !done && (
                      <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600">+2 · closes the case</span>
                    )}
                  </div>

                  <div className="mt-0.5 space-y-0.5">
                    {done && (
                      <p className="text-[11px] text-gray-400">
                        Completed {new Date(track.completedAt as string).toLocaleString()} {track.completedByName ? `· ${track.completedByName}` : ''}
                        {track.startedAt && window_ ? ` · took ${fmtRemaining(hoursBetween(track.startedAt, track.completedAt as string))}` : ''}
                      </p>
                    )}
                    {active && needsPermission && (
                      <p className="text-[11px] font-semibold text-amber-600">
                        Waiting for permission from Agency / Sales / CEO — the timer starts when granted.
                      </p>
                    )}
                    {active && s.id === 'recognition_letter' && recognitionBlocked && (
                      <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                        <AlertTriangle className="h-3 w-3" /> Blocked: high school certificate not uploaded yet.
                      </p>
                    )}
                    {track.permissionAt && (
                      <p className="text-[11px] text-gray-400">
                        Permission by {track.permissionByName ?? '—'} · {new Date(track.permissionAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {active && (canComplete || canPermit) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {needsPermission && canPermit && !recognitionBlocked && (
                        <button
                          onClick={() => doAction(() => grantStagePermission(application.id, s.id), `${s.label}: permission granted — timer started`)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A1628] px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-[#132c50] transition-colors"
                        >
                          <KeyRound className="h-3.5 w-3.5" /> Grant permission
                        </button>
                      )}
                      {canComplete && !needsPermission && !(s.id === 'recognition_letter' && recognitionBlocked) && (
                        <button
                          onClick={() => doAction(() => completePipelineStage(application.id, s.id), `${s.label} completed`)}
                          disabled={s.id === 'visa_residency' && !stageDocsPresent('visa_residency')}
                          title={s.id === 'visa_residency' && !stageDocsPresent('visa_residency') ? 'Upload both the visa and residency documents first' : undefined}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark completed
                        </button>
                      )}
                      {canComplete && upcomingHint(s.id) && (
                        <span className="inline-flex items-center gap-1 self-center text-[10px] text-gray-400">
                          <ChevronRight className="h-3 w-3" /> {upcomingHint(s.id)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

const upcomingHint = (stage: PipelineStageId): string => {
  switch (stage) {
    case 'translated_documents': return 'Uploading a "Translation" document completes this automatically';
    case 'university_approval': return 'Uploading the approval letter completes this automatically';
    case 'recognition_letter': return 'Uploading the recognition letter completes this automatically';
    case 'ministry_order': return 'Uploading the ministry order completes this automatically';
    case 'visa_documents': return 'Uploading the visa documents completes this automatically';
    case 'visa_residency': return 'Upload the visa + residency documents to close the case';
  }
};

export default PipelineTracker;
