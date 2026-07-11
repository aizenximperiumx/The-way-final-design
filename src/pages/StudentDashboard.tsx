import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';
import { getUniversity, getUniversityName } from '../lib/universities';
import { PIPELINE_STAGES } from '../lib/pipeline';
import { openStorageUrl } from '../lib/storage';
import {
  CheckCircle2, FileText, Building2, ArrowRight, ShieldCheck, Download,
  Clock, AlertCircle, Info, ClipboardList, MessageSquare, Calendar,
  GraduationCap, Circle, Sparkles, Landmark, Ban,
} from 'lucide-react';
import { RequestedDocsUploader } from '../components/dashboard/RequestedDocuments';
import { RatingPrompt } from '../components/dashboard/RatingPrompt';
import { DashboardSection, EmptyState } from '../components/dashboard/ui';

/**
 * Student portal home — the student's window into their whole journey.
 * Mobile-first: most students live on their phones (PRD §6).
 */

const badgeClass = (status: string) => {
  if (status === 'verified') return 'bg-emerald-100 text-emerald-700';
  if (status === 'pending') return 'bg-amber-100 text-amber-700';
  if (status === 'rejected') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-500';
};

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { applications, documents, users } = useApp();
  const { documentRequests } = useAppStore();
  const navigate = useNavigate();

  const myApplication = applications.find(app => app.studentId === user?.id) ?? null;
  const universityId = user?.assignedUniversityId || myApplication?.university;
  const university = getUniversity(universityId);
  const uniName = getUniversityName(universityId) || 'Not assigned yet';
  const firstName = user?.name?.split(' ')?.[0] ?? 'Student';
  const myDocs = documents.filter(d => d.studentId === user?.id);
  const myRequests = documentRequests
    .filter(r => r.studentId === user?.id && r.target !== 'agency')
    .sort((a, b) => (a.status === 'pending' || a.status === 'rejected' ? -1 : 1) - (b.status === 'pending' || b.status === 'rejected' ? -1 : 1));
  const openRequests = myRequests.filter(r => r.status === 'pending' || r.status === 'rejected').length;
  const advisor = users.find(u => u.id === myApplication?.assignedStaffId);

  // Journey progress — pipeline first, legacy document steps as fallback.
  const pipeline = myApplication?.pipeline;
  const currentIdx = !pipeline ? 0
    : pipeline.current === 'done' ? PIPELINE_STAGES.length
    : PIPELINE_STAGES.findIndex(s => s.id === pipeline.current);
  const stageDone = (idx: number) => {
    if (!pipeline) return false;
    if (pipeline.status === 'closed') return true;
    const track = pipeline.stages[PIPELINE_STAGES[idx].id];
    return Boolean(track?.completedAt) || idx < currentIdx;
  };
  const completedCount = PIPELINE_STAGES.filter((_, i) => stageDone(i)).length;
  const progressPercent = pipeline
    ? Math.round((completedCount / PIPELINE_STAGES.length) * 100)
    : 0;

  const uploadedByName = (id?: string) => users.find(x => x.id === id)?.name ?? '';

  const caseBadge = !pipeline ? null
    : pipeline.status === 'closed'
      ? { text: 'Completed', cls: 'bg-emerald-400/20 text-emerald-300 border-emerald-300/30', icon: <ShieldCheck className="h-3.5 w-3.5" /> }
      : pipeline.status === 'cancelled'
        ? { text: 'Cancelled', cls: 'bg-red-400/20 text-red-300 border-red-300/30', icon: <Ban className="h-3.5 w-3.5" /> }
        : { text: 'In progress', cls: 'bg-amber-400/20 text-amber-300 border-amber-300/30', icon: <Clock className="h-3.5 w-3.5" /> };

  return (
    <div className="space-y-6 pb-24 md:pb-12">

      {/* ── Hero — landing-page navy + gold ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A1628] via-[#0D1F3C] to-[#0A1628] p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-amber-400/5 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[3px] text-amber-400">
              Your journey to Georgia
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-black text-white">
              Welcome, {firstName}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {universityId && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-gray-200">
                  <GraduationCap className="h-3.5 w-3.5 text-amber-400" /> {uniName}
                </span>
              )}
              {caseBadge && (
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${caseBadge.cls}`}>
                  {caseBadge.icon} {caseBadge.text}
                </span>
              )}
              {openRequests > 0 && (
                <button
                  onClick={() => document.getElementById('requested-docs')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 hover:bg-amber-400/30 transition-colors"
                >
                  <ClipboardList className="h-3.5 w-3.5" /> {openRequests} document{openRequests > 1 ? 's' : ''} needed
                </button>
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => navigate('/messages')}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-black uppercase tracking-wider text-[#0A1628] hover:bg-amber-300 transition-colors"
              >
                <MessageSquare className="h-4 w-4" /> Message advisor
              </button>
              <button
                onClick={() => navigate('/appointments')}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-400/60 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-amber-400 hover:bg-amber-400/10 transition-colors"
              >
                <Calendar className="h-4 w-4" /> Book a call
              </button>
            </div>
          </div>

          {/* Progress dial */}
          <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-sm sm:min-w-[150px]">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[2px] text-gray-400">Progress</p>
            <div className="text-5xl font-black text-amber-400">{progressPercent}<span className="text-2xl">%</span></div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-700" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="mt-2 text-[10px] font-bold text-gray-400">{completedCount} / {PIPELINE_STAGES.length} stages</p>
          </div>
        </div>
      </div>

      {/* ── Rating prompt (after residency) ── */}
      {myApplication && <RatingPrompt application={myApplication} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">

          {/* ── Journey timeline ── */}
          <DashboardSection title="Your Admission Journey" icon={Sparkles}>
            <div className="px-4 sm:px-6 py-5">
              {!pipeline ? (
                <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                  <p className="text-xs font-semibold leading-relaxed text-blue-700">
                    {myApplication
                      ? 'Your case opens as soon as your application is approved — the full journey appears here.'
                      : 'Your account is ready. Your application journey will appear here once it is approved.'}
                  </p>
                </div>
              ) : (
                <ol className="space-y-0">
                  {PIPELINE_STAGES.map((s, idx) => {
                    const done = stageDone(idx);
                    const active = pipeline.status === 'processing' && pipeline.current === s.id;
                    const isLast = idx === PIPELINE_STAGES.length - 1;
                    return (
                      <li key={s.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all
                            ${done ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                              : active ? 'border-amber-400 bg-amber-50 text-amber-600 shadow-lg shadow-amber-100'
                              : 'border-gray-200 bg-white text-gray-300'}`}>
                            {done ? <CheckCircle2 className="h-4.5 w-4.5" /> : active ? <Clock className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                          </div>
                          {!isLast && <div className={`my-1 w-0.5 flex-1 min-h-[20px] rounded ${done ? 'bg-emerald-300' : 'bg-gray-100'}`} />}
                        </div>
                        <div className={`pb-6 pt-1 ${isLast ? 'pb-1' : ''}`}>
                          <p className={`text-sm font-black leading-none ${done ? 'text-emerald-700' : active ? 'text-gray-900' : 'text-gray-400'}`}>
                            {s.label}
                          </p>
                          <p className="mt-1.5 text-xs text-gray-400">{s.description.replace(' Timer starts when Agency/Sales/CEO grants permission.', '').replace(' Timer starts when permission is granted.', '').replace(' No performance points.', '').replace(' Completing this closes the case (+2 points).', '')}</p>
                          <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                            done ? 'bg-emerald-100 text-emerald-700' : active ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {done ? '✓ Done' : active ? 'In progress' : 'Upcoming'}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </DashboardSection>

          {/* ── Requested documents ── */}
          <div id="requested-docs">
            <DashboardSection title="Documents Requested From You" icon={ClipboardList} count={openRequests > 0 ? `${openRequests} to upload` : undefined}>
              <RequestedDocsUploader requests={myRequests} mode="student" />
            </DashboardSection>
          </div>

          {/* ── My documents ── */}
          <DashboardSection title="Your Documents" icon={FileText} count={myDocs.length || undefined}>
            {myDocs.length === 0 ? (
              <EmptyState icon={FileText} title="No documents yet" hint="Documents prepared by your advisor appear here." />
            ) : (
              <>
                {/* Mobile: cards */}
                <ul className="divide-y divide-gray-50 sm:hidden">
                  {myDocs.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                        <FileText className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-900">{doc.title}</p>
                        <p className="text-[11px] text-gray-400">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${badgeClass(doc.status)}`}>{doc.status}</span>
                      {doc.file && (
                        <button onClick={() => void openStorageUrl(doc.file!)} className="shrink-0 rounded-lg border border-amber-100 bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 transition-colors">
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {/* Desktop: table */}
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <th className="px-5 py-3 text-left">Document</th>
                        <th className="px-5 py-3 text-left">Uploaded by</th>
                        <th className="px-5 py-3 text-left">Status</th>
                        <th className="px-5 py-3 text-left">Date</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {myDocs.map((doc) => (
                        <tr key={doc.id} className="transition-colors hover:bg-gray-50/70">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                                <FileText className="h-4 w-4 text-amber-500" />
                              </div>
                              <p className="text-sm font-semibold text-gray-900">{doc.title}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-500">{uploadedByName(doc.uploadedBy) || '—'}</td>
                          <td className="px-5 py-3.5">
                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${badgeClass(doc.status)}`}>{doc.status}</span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-400">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                          <td className="px-5 py-3.5 text-right">
                            {doc.file ? (
                              <button
                                type="button"
                                onClick={() => void openStorageUrl(doc.file!)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-600 transition-colors hover:bg-amber-100"
                              >
                                <Download className="h-3.5 w-3.5" /> Download
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Preparing</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </DashboardSection>
        </div>

        {/* ── Right rail ── */}
        <div className="space-y-6">

          {/* University card */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="bg-gradient-to-br from-[#0A1628] to-[#12294a] p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15">
                <Building2 className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-black leading-tight text-white">{uniName}</h3>
              {myApplication?.program && <p className="mt-1 text-sm font-semibold text-gray-400">{myApplication.program}</p>}
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-gray-400">
                <Landmark className="h-3.5 w-3.5 text-amber-400/70" /> Tbilisi, Georgia
              </p>
            </div>
            {university && university.registrationTimeline.length > 0 && (
              <div className="p-5">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Registration timeline</p>
                <ol className="space-y-2.5">
                  {university.registrationTimeline.map((step, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-50 text-[10px] font-black text-amber-600">{i + 1}</span>
                      <div>
                        <p className="text-xs font-bold leading-tight text-gray-800">{step.step}</p>
                        <p className="text-[11px] text-gray-400">{step.duration}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Advisor card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Your advisor</p>
            {advisor ? (
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-lg font-black text-amber-700">
                  {advisor.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-gray-900">{advisor.name}</p>
                  <p className="text-xs text-gray-400">Personal admission advisor</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">An advisor will be assigned to you shortly.</p>
            )}
            <button
              onClick={() => navigate('/messages')}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A1628] px-5 py-3 text-sm font-black text-amber-400 transition-colors hover:bg-[#132c50]"
            >
              <MessageSquare className="h-4 w-4" /> Send a message <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Status card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Current stage</p>
            <p className="text-xl font-black text-gray-900">
              {pipeline
                ? pipeline.status === 'closed' ? 'Complete 🎉'
                  : pipeline.status === 'cancelled' ? 'Cancelled'
                  : PIPELINE_STAGES.find(s => s.id === pipeline.current)?.label ?? '—'
                : (myApplication?.stage ?? 'Getting started')}
            </p>
            <div className="mt-4 border-t border-gray-50 pt-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Application status</p>
              <div className="flex items-center gap-2">
                {myApplication?.status === 'approved' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                  myApplication?.status === 'rejected' ? <AlertCircle className="h-4 w-4 text-red-500" /> :
                  <Clock className="h-4 w-4 text-amber-500" />}
                <p className="text-lg font-black capitalize text-gray-900">{myApplication?.status ?? 'Pending'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
