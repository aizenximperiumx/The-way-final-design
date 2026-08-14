import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, AlarmClock, Clock, KeyRound, Camera, FileText, CheckCircle2,
  X, MessageSquarePlus, Loader2, Mail, Phone, CircleCheck, FileQuestion, Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useAppStore, missingStageDocs, docTypeLabel } from '../../store/appStore';
import { getUniversityName } from '../../lib/universities';
import { getStageMeta } from '../../lib/pipeline';
import { buildJourney } from '../../lib/journey';
import { GOLD, NAVY, dim, goldA, card, goldCard } from '../ui';
import TeamLayout from './TeamLayout';
import { SectionLabel, Row, Square, Tag, Actions, Empty, initialsOf, RED } from './parts';
import { useCases, fmtLeft, TOTAL_STAGES } from './useCases';
import { deskOf } from './roles';
import UploadSheet from './UploadSheet';
import ApproveSheet from './ApproveSheet';

/**
 * One student, everything about them. This is where the desks point: stage
 * progress and the running clock, the documents on file, what is waiting on
 * review, and the actions the signed-in role is allowed to take.
 */

const CaseDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const desk = deskOf(user?.role);

  const applications = useAppStore(s => s.applications);
  const documents = useAppStore(s => s.documents);
  const documentRequests = useAppStore(s => s.documentRequests);
  const staffVerifyDocument = useAppStore(s => s.staffVerifyDocument);
  const reviewDocumentRequest = useAppStore(s => s.reviewDocumentRequest);
  const staffAddInternalNote = useAppStore(s => s.staffAddInternalNote);
  const completePipelineStage = useAppStore(s => s.completePipelineStage);
  const grantStagePermission = useAppStore(s => s.grantStagePermission);
  const confirmStagePayment = useAppStore(s => s.confirmStagePayment);
  const staffRequestDocument = useAppStore(s => s.staffRequestDocument);

  const [uploading, setUploading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [askTitle, setAskTitle] = useState('');
  const [askTarget, setAskTarget] = useState<'student' | 'agency'>('student');

  const app = useMemo(() => applications.find(a => a.id === id), [applications, id]);
  const rows = useCases(app ? [app] : []);
  const row = rows[0];

  if (!app) {
    return (
      <TeamLayout>
        <div style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}>
          <Empty icon={FileText} title="Case not found" sub="It may have been moved or closed." />
        </div>
      </TeamLayout>
    );
  }

  const docs = documents.filter(d => d.studentId === app.studentId);
  const pending = documentRequests.filter(r =>
    r.studentId === app.studentId && (r.status === 'uploaded' || r.status === 'fulfilled'));
  const outstanding = documentRequests.filter(r =>
    r.studentId === app.studentId && r.status === 'pending');

  const tone = row?.kind === 'overdue' ? RED : row?.kind === 'due' ? GOLD : dim(0.55);
  const TimeIcon = row?.kind === 'overdue' ? AlarmClock : row?.kind === 'payment' ? Wallet : row?.kind === 'permission' ? KeyRound : Clock;
  const timeText = row?.kind === 'overdue' && row.msLeft !== null ? `${fmtLeft(row.msLeft)} over`
    : row?.kind === 'due' && row.msLeft !== null ? `${fmtLeft(row.msLeft)} left`
    : row?.kind === 'payment' ? 'Awaiting payment'
    : row?.kind === 'permission' ? 'Awaiting permission'
    : row ? 'No timer' : 'Not in progress';

  const saveNote = () => {
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      staffAddInternalNote(app.id, note.trim());
      toast.success('Note added');
      setNote('');
      setNoteOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add the note');
    } finally {
      setSavingNote(false);
    }
  };

  const verify = (docId: string, name: string) => {
    try {
      staffVerifyDocument(docId);
      toast.success(`${name} verified`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not verify');
    }
  };

  const review = (reqId: string, decision: 'approved' | 'reupload', title: string) => {
    try {
      reviewDocumentRequest(reqId, decision);
      toast.success(decision === 'approved' ? `${title} accepted` : `${title} sent back`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save');
    }
  };

  const completeStage = () => {
    if (!row) return;
    try {
      completePipelineStage(app.id, row.stage);
      toast.success(`${row.label} completed`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not complete the stage');
    }
  };

  const confirmPayment = () => {
    if (!row) return;
    try {
      confirmStagePayment(app.id, row.stage);
      toast.success(`${row.label} confirmed — the case has moved on`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not confirm the payment');
    }
  };

  const grantPermission = () => {
    if (!row) return;
    try {
      grantStagePermission(app.id, row.stage);
      toast.success('Permission recorded — the clock starts now');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not record permission');
    }
  };

  const requestDoc = () => {
    if (!askTitle.trim() || !app.studentId) return;
    try {
      staffRequestDocument(app.studentId, app.id, askTitle.trim(), undefined, askTarget);
      toast.success(`Requested from the ${askTarget}`);
      setAskTitle('');
      setAskOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send the request');
    }
  };

  const isAdvisor = desk.kind === 'advisor' || desk.kind === 'ceo';
  const isCeo = desk.kind === 'ceo';
  // Asked of the same helper the store guards with, so the button cannot offer
  // something the store will then refuse.
  const missingDocs = row ? missingStageDocs(documents, app, row.stage) : [];
  // The same journey the student sees, so the two can never disagree.
  const journey = buildJourney(app.pipeline);
  const isSales = desk.kind === 'sales' || desk.kind === 'ceo';
  const isAgencySourced = app.source === 'agency';

  return (
    <TeamLayout>
      <div style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4px)' }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider mb-3"
          style={{ color: dim(0.55) }}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-3.5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-[18px] font-black shrink-0"
            style={{ background: goldA(0.15), color: GOLD }}
          >
            {initialsOf(app.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="v3-serif text-[24px] font-black leading-tight" style={{ color: '#fff' }}>{app.name}</h1>
            <p className="text-[12.5px] mt-1 truncate" style={{ color: dim(0.55) }}>
              {getUniversityName(app.university) || 'University not set'}
            </p>
          </div>
        </div>

        {(app.studentEmail || app.phone) && (
          <div className="flex gap-2 mt-3.5">
            {app.studentEmail && (
              <a
                href={`mailto:${app.studentEmail}`}
                className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-wider"
                style={{ background: 'rgba(255,255,255,0.05)', color: dim(0.65), border: `1px solid ${goldA(0.12)}` }}
              >
                <Mail className="w-3.5 h-3.5" /> Email
              </a>
            )}
            {app.phone && (
              <a
                href={`tel:${app.phone}`}
                className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-wider"
                style={{ background: 'rgba(255,255,255,0.05)', color: dim(0.65), border: `1px solid ${goldA(0.12)}` }}
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </a>
            )}
          </div>
        )}
      </div>

      {/* Stage and clock */}
      {row ? (
        <div className="rounded-3xl p-5 mt-5 relative overflow-hidden" style={goldCard}>
          <div className="absolute -right-6 -top-8 w-36 h-36 rounded-full" style={{ background: goldA(0.12), filter: 'blur(28px)' }} />
          <div className="flex items-center justify-between relative">
            <p className="text-[11px] tracking-[2px] uppercase font-bold" style={{ color: dim(0.55) }}>
              Stage {row.stageNo} of {TOTAL_STAGES}
            </p>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-black tabular-nums"
              style={{ background: row.kind === 'overdue' ? 'rgba(255,107,107,0.18)' : goldA(0.18), color: tone }}
            >
              <TimeIcon className="w-3.5 h-3.5" />{timeText}
            </span>
          </div>
          <p className="v3-serif text-[22px] font-black mt-2 leading-tight relative" style={{ color: '#fff' }}>
            {row.label}
          </p>
          <div className="flex gap-[3px] mt-4 relative">
            {Array.from({ length: TOTAL_STAGES }, (_, i) => (
              <span key={i} className="flex-1 h-1.5 rounded-full"
                style={{ background: i < row.stageNo ? GOLD : 'rgba(255,255,255,0.12)' }} />
            ))}
          </div>

          {/* Held on money. Only the CEO can release it, and being able to do
              that from a phone is the point of this app - otherwise every case
              in the company waits for someone to reach a desk. */}
          {row.kind === 'payment' ? (
            <div className="mt-4 rounded-2xl p-3.5 relative" style={{ background: goldA(0.1), border: `1px solid ${goldA(0.22)}` }}>
              {getStageMeta(row.stage).unlocks?.length ? (
                <>
                  <p className="text-[9.5px] font-black uppercase tracking-wider" style={{ color: GOLD }}>This payment covers</p>
                  <ul className="mt-1.5 space-y-1">
                    {getStageMeta(row.stage).unlocks!.map(u => (
                      <li key={u} className="flex items-start gap-1.5 text-[12px]" style={{ color: dim(0.75) }}>
                        <CircleCheck className="w-3 h-3 mt-[3px] shrink-0" style={{ color: GOLD }} /> {u}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              {isCeo ? (
                <button
                  onClick={confirmPayment}
                  className="w-full mt-3 py-3 rounded-2xl flex items-center justify-center gap-2 text-[11.5px] font-black uppercase tracking-wider"
                  style={{ background: GOLD, color: NAVY }}
                >
                  <Wallet className="w-4 h-4" /> Confirm payment received
                </button>
              ) : (
                <p className="mt-2.5 text-[11.5px] font-bold" style={{ color: GOLD }}>
                  Waiting on the student. The CEO confirms the payment.
                </p>
              )}
            </div>
          ) : isAdvisor && (
            row.kind === 'permission' ? (
              <button
                onClick={grantPermission}
                className="w-full mt-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-[11.5px] font-black uppercase tracking-wider relative"
                style={{ background: GOLD, color: NAVY }}
              >
                <KeyRound className="w-4 h-4" /> Record permission
              </button>
            ) : (
              // Closed until the document exists. It used to be pressable with
              // nothing attached, and pressable again and again, which let a
              // stage be marked done for a student whose document was never
              // taken. Add the photo and the button opens by itself.
              missingDocs.length > 0 ? (
                <div className="mt-4">
                  <button
                    onClick={() => setUploading(true)}
                    className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-[11.5px] font-black uppercase tracking-wider"
                    style={{ background: goldA(0.14), color: GOLD, border: `1px solid ${goldA(0.22)}` }}
                  >
                    <Camera className="w-4 h-4" /> Add the {missingDocs.map(docTypeLabel).join(' and ')}
                  </button>
                  <p className="mt-2 text-[11px] text-center" style={{ color: dim(0.5) }}>
                    This stage completes once the document is on file.
                  </p>
                </div>
              ) : (
                <button
                  onClick={completeStage}
                  className="w-full mt-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-[11.5px] font-black uppercase tracking-wider relative"
                  style={{ background: GOLD, color: NAVY }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {row.stageNo === TOTAL_STAGES ? 'Complete — finish admission' : 'Complete this stage'}
                </button>
              )
            )
          )}
        </div>
      ) : (
        <div className="rounded-[20px] p-4 mt-5" style={card}>
          <p className="text-[13.5px]" style={{ color: dim(0.6) }}>
            {app.status === 'submitted' ? 'Awaiting approval — not yet in the pipeline.' : 'This case is not currently processing.'}
          </p>
        </div>
      )}

      {/* ── The whole journey ──
          Built from the same model the student's own screen uses, so a member
          of staff on the phone sees exactly what the student sees, with the
          staff name for each stage alongside. Sales, support and the CEO can
          open any case and answer "where are we" without asking the advisor. */}
      {journey.steps.length > 0 && (
        <>
          <SectionLabel right={`${journey.doneCount}/${journey.total}`}>Journey</SectionLabel>
          <div className="rounded-[20px] p-4" style={card}>
            {journey.steps.map((s, i) => {
              const isLast = i === journey.steps.length - 1;
              return (
                <div key={s.stage} className="flex gap-3.5">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{
                      background: s.state === 'done' ? GOLD : s.state === 'current' ? goldA(0.18) : 'rgba(255,255,255,0.06)',
                      border: s.state === 'done' ? 'none' : `1px solid ${s.state === 'current' ? goldA(0.5) : 'rgba(255,255,255,0.1)'}`,
                    }}>
                      {s.state === 'done'
                        ? <CircleCheck className="w-3.5 h-3.5" style={{ color: NAVY }} />
                        : s.isPayment
                          ? <Wallet className="w-3.5 h-3.5" style={{ color: s.state === 'current' ? GOLD : dim(0.35) }} />
                          : <span className="text-[10px] font-black" style={{ color: s.state === 'current' ? GOLD : dim(0.35) }}>{s.number}</span>}
                    </div>
                    {!isLast && <div className="w-px flex-1 min-h-[16px] my-1"
                      style={{ background: s.state === 'done' ? goldA(0.45) : 'rgba(255,255,255,0.08)' }} />}
                  </div>
                  <div className={isLast ? 'pt-1 pb-0.5' : 'pb-3.5 pt-1'}>
                    <p className="text-[13px] font-bold" style={{ color: s.state === 'upcoming' ? dim(0.45) : '#fff' }}>
                      {s.staffLabel}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: dim(0.45) }}>
                      {s.state === 'done'
                        ? `Done${s.completedAt ? ` · ${new Date(s.completedAt).toLocaleDateString()}` : ''}`
                        : s.state === 'current'
                          ? (s.isPayment ? 'Waiting on the student' : 'In progress')
                          : s.isStopPoint ? 'The student may stop here' : 'Upcoming'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Role actions */}
      {isAdvisor && app.studentId && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setUploading(true)}
            className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-[11.5px] font-black uppercase tracking-wider"
            style={{ background: goldA(0.14), color: GOLD, border: `1px solid ${goldA(0.22)}` }}
          >
            <Camera className="w-4 h-4" /> Add document
          </button>
          <button
            onClick={() => { setNoteOpen(v => !v); setAskOpen(false); }}
            className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-[11.5px] font-black uppercase tracking-wider"
            style={{ background: 'rgba(255,255,255,0.05)', color: dim(0.65), border: `1px solid ${goldA(0.12)}` }}
          >
            <MessageSquarePlus className="w-4 h-4" /> Note
          </button>
        </div>
      )}

      {isAdvisor && app.studentId && (
        <button
          onClick={() => { setAskOpen(v => !v); setNoteOpen(false); }}
          className="w-full mt-2 py-3 rounded-2xl flex items-center justify-center gap-2 text-[11.5px] font-black uppercase tracking-wider"
          style={{ background: 'rgba(255,255,255,0.05)', color: dim(0.65), border: `1px solid ${goldA(0.12)}` }}
        >
          <FileQuestion className="w-4 h-4" /> Ask for a document
        </button>
      )}

      {askOpen && (
        <div className="mt-3 rounded-[20px] p-4" style={card}>
          <input
            value={askTitle}
            onChange={(e) => setAskTitle(e.target.value)}
            placeholder="What do you need? e.g. Ministry order"
            className="w-full bg-transparent outline-none text-[14px]"
            style={{ color: '#fff' }}
          />
          {isAgencySourced && (
            <div className="flex gap-2 mt-3">
              {(['student', 'agency'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setAskTarget(t)}
                  className="flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider"
                  style={askTarget === t
                    ? { background: GOLD, color: NAVY }
                    : { background: 'rgba(255,255,255,0.05)', color: dim(0.6), border: `1px solid ${goldA(0.12)}` }}
                >
                  Ask the {t}
                </button>
              ))}
            </div>
          )}
          <Actions items={[
            { label: 'Send request', onClick: requestDoc, disabled: !askTitle.trim() },
            { label: 'Cancel', ghost: true, onClick: () => { setAskTitle(''); setAskOpen(false); } },
          ]} />
        </div>
      )}

      {isSales && app.status === 'submitted' && (
        <button
          onClick={() => setApproving(true)}
          className="w-full mt-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[12px] font-black uppercase tracking-[1.5px]"
          style={{ background: GOLD, color: NAVY }}
        >
          <CircleCheck className="w-4 h-4" /> Review and approve
        </button>
      )}

      {noteOpen && (
        <div className="mt-3 rounded-[20px] p-4" style={card}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Internal note — students never see this"
            className="w-full bg-transparent outline-none text-[14px] resize-none"
            style={{ color: '#fff' }}
          />
          <Actions items={[
            { label: savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save note', onClick: saveNote, disabled: !note.trim() || savingNote },
            { label: 'Cancel', ghost: true, onClick: () => { setNote(''); setNoteOpen(false); } },
          ]} />
        </div>
      )}

      {/* Waiting on review */}
      {pending.length > 0 && (
        <>
          <SectionLabel right={String(pending.length)}>Waiting on review</SectionLabel>
          {pending.map(r => (
            <Row key={r.id} tone="gold">
              <div className="flex items-center gap-3">
                <Square tone="gold"><FileText className="w-5 h-5" /></Square>
                <div className="flex-1 min-w-0">
                  <p className="text-[14.5px] font-bold truncate" style={{ color: '#fff' }}>{r.title}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: dim(0.55) }}>
                    {r.uploadedByName ? `Uploaded by ${r.uploadedByName}` : 'Uploaded'}
                  </p>
                </div>
              </div>
              {r.fulfilledFile && (
                <a
                  href={r.fulfilledFile}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-center mt-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider"
                  style={{ background: 'rgba(255,255,255,0.05)', color: dim(0.6), border: `1px solid ${goldA(0.12)}` }}
                >
                  Open file
                </a>
              )}
              {isAdvisor && (
                <Actions items={[
                  { label: <><CheckCircle2 className="w-3.5 h-3.5" /> Accept</>, onClick: () => review(r.id, 'approved', r.title) },
                  { label: <><X className="w-3.5 h-3.5" /> Send back</>, ghost: true, onClick: () => review(r.id, 'reupload', r.title) },
                ]} />
              )}
            </Row>
          ))}
        </>
      )}

      {outstanding.length > 0 && (
        <>
          <SectionLabel right={String(outstanding.length)}>Requested, not yet uploaded</SectionLabel>
          {outstanding.map(r => (
            <Row key={r.id}>
              <div className="flex items-center gap-3">
                <Square><Clock className="w-5 h-5" /></Square>
                <div className="flex-1 min-w-0">
                  <p className="text-[14.5px] font-bold truncate" style={{ color: '#fff' }}>{r.title}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: dim(0.55) }}>
                    Requested by {r.requestedByName}
                  </p>
                </div>
                <Tag>Waiting</Tag>
              </div>
            </Row>
          ))}
        </>
      )}

      {/* Documents on file */}
      <SectionLabel right={docs.length ? String(docs.length) : undefined}>Documents on file</SectionLabel>
      {docs.length === 0 ? (
        <Empty icon={FileText} title="Nothing yet" sub="Documents you add appear here." />
      ) : (
        docs.map(d => {
          const verified = d.status === 'verified';
          return (
            <Row key={d.id}>
              <div className="flex items-center gap-3">
                <Square tone={verified ? 'green' : 'plain'}>
                  <FileText className="w-5 h-5" />
                </Square>
                <div className="flex-1 min-w-0">
                  <p className="text-[14.5px] font-bold truncate" style={{ color: '#fff' }}>{d.title}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: dim(0.55) }}>
                    {new Date(d.uploadedAt).toLocaleDateString()}
                    {d.uploadedBy ? ` · ${d.uploadedBy}` : ''}
                  </p>
                </div>
                <Tag tone={verified ? 'green' : 'plain'}>{verified ? 'Verified' : d.status}</Tag>
              </div>
              {(d.file || (isAdvisor && !verified)) && (
                <Actions items={[
                  ...(d.file ? [{ label: 'Open', ghost: true, onClick: () => window.open(d.file, '_blank') }] : []),
                  ...(isAdvisor && !verified ? [{ label: <><CheckCircle2 className="w-3.5 h-3.5" /> Verify</>, onClick: () => verify(d.id, d.title) }] : []),
                ]} />
              )}
            </Row>
          );
        })
      )}

      {uploading && <UploadSheet app={app} onClose={() => setUploading(false)} />}
      {approving && <ApproveSheet app={app} onClose={() => setApproving(false)} />}
    </TeamLayout>
  );
};

export default CaseDetail;
