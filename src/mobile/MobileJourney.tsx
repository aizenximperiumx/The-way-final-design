import React, { useRef, useState } from 'react';
import {
  CheckCircle2, Circle, Clock, Download, FileText, Loader2, Star, Upload, Inbox, ScanLine, Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useAppStore, type DocumentRequest } from '../store/appStore';
import { buildJourney } from '../lib/journey';
import { uploadFileToStorage } from '../lib/upload';
import { openStorageUrl } from '../lib/storage';
import { GOLD, NAVY, card, goldCard, dim, goldA, sectionLabel } from './ui';
import MobileLayout from './MobileLayout';
import DocScanner from './DocScanner';

/** Journey — the full case: stages, uploads we need from you, your documents. */
const MobileJourney: React.FC = () => {
  const { user } = useAuth();
  const { applications, documents } = useApp();
  const { documentRequests, studentFulfillRequest, studentRateService } = useAppStore();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [scanFor, setScanFor] = useState<DocumentRequest | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const myApp = applications.find(a => a.studentId === user?.id) ?? null;
  const myDocs = documents.filter(d => d.studentId === user?.id);
  const myRequests = documentRequests
    .filter(r => r.studentId === user?.id && r.target !== 'agency')
    .sort((a, b) => (a.status === 'pending' || a.status === 'rejected' ? -1 : 1) - (b.status === 'pending' || b.status === 'rejected' ? -1 : 1));

  const pipeline = myApp?.pipeline;
  // Rating only for a fully finished journey: a case that stopped at the
  // ministry order is not over, so asking how it went would be wrong.
  const journey = buildJourney(pipeline);
  const closed = journey.finished;

  const handleFile = async (req: DocumentRequest, file?: File) => {
    if (!file) return;
    setUploadingId(req.id);
    try {
      const url = await uploadFileToStorage(file);
      studentFulfillRequest(req.id, url);
      toast.success('Uploaded — your advisor will review it');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  const submitRating = () => {
    if (!myApp) return;
    if (stars < 1) { toast.error('Pick a star rating first'); return; }
    try {
      studentRateService(myApp.id, stars, comment);
      toast.success('Thank you for your feedback!');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save rating');
    }
  };

  const reqBadge = (status: string) => {
    if (status === 'approved') return { text: 'Approved', bg: 'rgba(76,175,80,0.15)', color: '#7BE08A' };
    if (status === 'uploaded' || status === 'fulfilled') return { text: 'In review', bg: goldA(0.15), color: GOLD };
    if (status === 'rejected') return { text: 'Re-upload needed', bg: 'rgba(255,99,99,0.15)', color: '#FF9B9B' };
    return { text: 'Needed', bg: goldA(0.15), color: GOLD };
  };

  return (
    <MobileLayout title="My Journey">
      {/* ── Rating (after completion) ── */}
      {myApp && closed && !myApp.rating && (
        <div className="rounded-3xl p-5 mb-5 text-center" style={goldCard}>
          <p className="v3-serif text-[20px] font-black" style={{ color: '#fff' }}>Your journey is complete 🎉</p>
          <p className="text-[12px] mt-1" style={{ color: dim(0.65) }}>How was your experience with The Way?</p>
          <div className="mt-3 flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} onClick={() => setStars(i)} className="p-1 active:scale-125 transition-transform" aria-label={`${i} stars`}>
                <Star className="w-8 h-8" style={{ color: i <= stars ? GOLD : dim(0.25), fill: i <= stars ? GOLD : 'none' }} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={2}
            placeholder="Tell us about it (optional)"
            className="mt-3 w-full rounded-xl px-4 py-3 text-[13px] outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
          />
          <button onClick={submitRating} className="mt-3 px-8 py-3 rounded-full text-[12px] font-black uppercase tracking-wider" style={{ background: GOLD, color: NAVY }}>
            Submit rating
          </button>
        </div>
      )}
      {myApp?.rating && (
        <div className="rounded-2xl p-4 mb-5 flex items-center gap-3" style={card}>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className="w-4 h-4" style={{ color: i <= (myApp.rating?.stars ?? 0) ? GOLD : dim(0.2), fill: i <= (myApp.rating?.stars ?? 0) ? GOLD : 'none' }} />
            ))}
          </div>
          <p className="text-[13px] font-semibold" style={{ color: dim(0.7) }}>Thanks for your feedback!</p>
        </div>
      )}

      {/* ── Where you are ──
          The first thing on the screen answers the only questions a student
          actually has: what is happening, and is anyone waiting on me. The
          list of steps comes after that, as reference. */}
      <div className="rounded-3xl p-5 mb-4 relative overflow-hidden" style={goldCard}>
        <div className="absolute -right-10 -top-12 w-44 h-44 rounded-full"
          style={{ background: goldA(0.16), filter: 'blur(38px)' }} />
        <div className="relative">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[9.5px] tracking-[2.4px] uppercase font-black" style={{ color: GOLD }}>
              {journey.current ? `Step ${journey.current.number} of ${journey.total}` : 'Your journey'}
            </p>
            {journey.waitingOn !== 'nobody' && (
              <span className="px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase tracking-wider"
                style={journey.waitingOn === 'you'
                  ? { background: GOLD, color: NAVY }
                  : { background: 'rgba(255,255,255,0.1)', color: dim(0.7) }}>
                {journey.waitingOn === 'you' ? 'Over to you' : 'We are on it'}
              </span>
            )}
          </div>

          <p className="v3-serif text-[23px] font-black mt-2 leading-tight" style={{ color: '#fff' }}>
            {journey.headline}
          </p>
          <p className="text-[13px] mt-2 leading-relaxed" style={{ color: dim(0.72) }}>
            {journey.detail}
          </p>
          {journey.current?.typical && (
            <p className="text-[11.5px] mt-1.5" style={{ color: dim(0.5) }}>
              This step {journey.current.typical}.
            </p>
          )}

          {/* Progress, as a bar of the real steps rather than a number. */}
          <div className="flex gap-[3px] mt-4">
            {journey.steps.map(s => (
              <span key={s.stage} className="flex-1 h-1.5 rounded-full" style={{
                background: s.state === 'done' ? GOLD
                  : s.state === 'current' ? goldA(0.55)
                  : 'rgba(255,255,255,0.12)',
              }} />
            ))}
          </div>
          <p className="text-[11px] mt-2" style={{ color: dim(0.5) }}>
            {journey.doneCount} of {journey.total} steps complete
          </p>
        </div>
      </div>

      {/* ── The decision, when there is one ──
          A payment is a choice, not a wall. It says what it buys, and at the
          stop point it says plainly that stopping is allowed. */}
      {journey.current?.isPayment && journey.current.unlocks && (
        <div className="rounded-3xl p-5 mb-4" style={card}>
          <p className="text-[9.5px] tracking-[2.4px] uppercase font-black" style={{ color: GOLD }}>
            What this covers
          </p>
          <ul className="mt-3 space-y-2">
            {journey.current.unlocks.map(u => (
              <li key={u} className="flex items-start gap-2.5 text-[13px]" style={{ color: dim(0.78) }}>
                <CheckCircle2 className="w-3.5 h-3.5 mt-[3px] shrink-0" style={{ color: GOLD }} /> {u}
              </li>
            ))}
          </ul>
          <p className="text-[12px] mt-4 leading-relaxed" style={{ color: dim(0.55) }}>
            Your advisor will arrange this with you. Nothing is paid through the app.
          </p>
        </div>
      )}

      {/* Partially closed: the door is open, and it says so. */}
      {journey.partial && (
        <div className="rounded-3xl p-5 mb-4" style={{ background: goldA(0.1), border: `1px solid ${goldA(0.24)}` }}>
          <p className="v3-serif text-[17px] font-black" style={{ color: '#fff' }}>Want to carry on?</p>
          <p className="text-[12.5px] mt-1.5 leading-relaxed" style={{ color: dim(0.72) }}>
            The second payment takes you through your visa, your residency, and someone meeting you
            at the airport. Talk to your advisor whenever you are ready.
          </p>
        </div>
      )}

      {/* ── Every step ── */}
      <p className="mb-3" style={sectionLabel}>Every step</p>
      {!pipeline ? (
        <div className="rounded-2xl p-5" style={card}>
          <p className="text-[13px]" style={{ color: dim(0.65) }}>
            Your case opens as soon as your application is approved — the full journey will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl p-5" style={card}>
          {journey.steps.map((s, i) => {
            const done = s.state === 'done';
            const active = s.state === 'current';
            const isLast = i === journey.steps.length - 1;
            return (
              <div key={s.stage} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{
                    background: done ? GOLD : active ? goldA(0.18) : 'rgba(255,255,255,0.06)',
                    border: done ? 'none' : `1px solid ${active ? goldA(0.5) : 'rgba(255,255,255,0.1)'}`,
                  }}>
                    {done ? <CheckCircle2 className="w-4 h-4" style={{ color: NAVY }} />
                      : s.isPayment ? <Wallet className="w-4 h-4" style={{ color: active ? GOLD : dim(0.4) }} />
                      : active ? <Clock className="w-4 h-4" style={{ color: GOLD }} />
                      : <Circle className="w-3 h-3" style={{ color: dim(0.4) }} />}
                  </div>
                  {!isLast && <div className="w-px flex-1 min-h-[22px] my-1" style={{ background: done ? goldA(0.5) : 'rgba(255,255,255,0.08)' }} />}
                </div>
                <div className={isLast ? 'pt-1.5' : 'pb-5 pt-1.5'}>
                  <p className="text-[14px] font-bold" style={{ color: done || active ? '#fff' : dim(0.5) }}>{s.title}</p>
                  {/* The explanation only where it is useful: on the step being
                      worked on, and on the one where a student may stop. */}
                  {(active || (s.isStopPoint && !done)) && (
                    <p className="text-[12px] mt-1 leading-relaxed" style={{ color: dim(0.6) }}>{s.blurb}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{
                      background: done ? 'rgba(76,175,80,0.15)' : active ? goldA(0.15) : 'rgba(255,255,255,0.05)',
                      color: done ? '#7BE08A' : active ? GOLD : dim(0.45),
                    }}>
                      {done ? 'Done' : active ? (s.isPayment ? 'Over to you' : 'In progress') : 'Upcoming'}
                    </span>
                    {s.isStopPoint && !done && (
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.06)', color: dim(0.5) }}>
                        You may stop here
                      </span>
                    )}
                    {done && s.completedAt && (
                      <span className="text-[10.5px]" style={{ color: dim(0.4) }}>
                        {new Date(s.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Requested uploads ── */}
      <p className="mt-6 mb-3" style={sectionLabel}>Needed from you</p>
      {myRequests.length === 0 ? (
        <div className="rounded-2xl p-5 flex items-center gap-3" style={card}>
          <Inbox className="w-5 h-5" style={{ color: dim(0.4) }} />
          <p className="text-[13px]" style={{ color: dim(0.6) }}>Nothing right now — we'll notify you.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {myRequests.map(req => {
            const b = reqBadge(req.status);
            const canUpload = req.status === 'pending' || req.status === 'rejected';
            return (
              <div key={req.id} className="rounded-2xl p-4" style={card}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14px] font-bold flex-1" style={{ color: '#fff' }}>{req.title}</p>
                  <span className="text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-full" style={{ background: b.bg, color: b.color }}>{b.text}</span>
                </div>
                {req.description && <p className="text-[12px] mt-1" style={{ color: dim(0.55) }}>{req.description}</p>}
                {req.reviewNote && canUpload && (
                  <p className="text-[12px] mt-1 font-semibold" style={{ color: '#FF9B9B' }}>Advisor: {req.reviewNote}</p>
                )}
                {canUpload && (
                  <>
                    <input
                      ref={el => { fileRefs.current[req.id] = el; }}
                      type="file"
                      className="hidden"
                      onChange={e => { void handleFile(req, e.target.files?.[0]); e.target.value = ''; }}
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setScanFor(req)}
                        disabled={uploadingId === req.id}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-black uppercase tracking-wider"
                        style={{ background: GOLD, color: NAVY, opacity: uploadingId === req.id ? 0.6 : 1 }}
                      >
                        {uploadingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                        {req.status === 'rejected' ? 'Re-scan' : 'Scan'}
                      </button>
                      <button
                        onClick={() => fileRefs.current[req.id]?.click()}
                        disabled={uploadingId === req.id}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-black uppercase tracking-wider"
                        style={{ background: goldA(0.14), color: GOLD, border: `1px solid ${goldA(0.35)}`, opacity: uploadingId === req.id ? 0.6 : 1 }}
                      >
                        <Upload className="w-4 h-4" /> File
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── My documents ── */}
      <p className="mt-6 mb-3" style={sectionLabel}>My documents</p>
      {myDocs.length === 0 ? (
        <div className="rounded-2xl p-5 flex items-center gap-3 mb-2" style={card}>
          <FileText className="w-5 h-5" style={{ color: dim(0.4) }} />
          <p className="text-[13px]" style={{ color: dim(0.6) }}>Documents prepared by your advisor appear here.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-2">
          {myDocs.map(doc => (
            <div key={doc.id} className="rounded-2xl p-4 flex items-center gap-3" style={card}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: goldA(0.12) }}>
                <FileText className="w-5 h-5" style={{ color: GOLD }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold truncate" style={{ color: '#fff' }}>{doc.title}</p>
                <p className="text-[11px]" style={{ color: dim(0.5) }}>{new Date(doc.uploadedAt).toLocaleDateString()}</p>
              </div>
              {doc.file && (
                <button onClick={() => void openStorageUrl(doc.file!)} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <Download className="w-4 h-4" style={{ color: GOLD }} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Document scanner (camera + frame overlay + scan look) */}
      {scanFor && (
        <DocScanner
          title={scanFor.title}
          onCapture={file => { const req = scanFor; setScanFor(null); void handleFile(req, file); }}
          onFallback={() => { const req = scanFor; setScanFor(null); fileRefs.current[req.id]?.click(); }}
          onClose={() => setScanFor(null)}
        />
      )}
    </MobileLayout>
  );
};

export default MobileJourney;
