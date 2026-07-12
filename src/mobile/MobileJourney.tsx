import React, { useRef, useState } from 'react';
import {
  CheckCircle2, Circle, Clock, Download, FileText, Loader2, Star, Upload, Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useAppStore, type DocumentRequest } from '../store/appStore';
import { PIPELINE_STAGES } from '../lib/pipeline';
import { uploadFileToStorage } from '../lib/upload';
import { openStorageUrl } from '../lib/storage';
import { GOLD, NAVY, card, goldCard, dim, goldA, sectionLabel } from './ui';
import MobileLayout from './MobileLayout';

/** Journey — the full case: stages, uploads we need from you, your documents. */
const MobileJourney: React.FC = () => {
  const { user } = useAuth();
  const { applications, documents } = useApp();
  const { documentRequests, studentFulfillRequest, studentRateService } = useAppStore();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const myApp = applications.find(a => a.studentId === user?.id) ?? null;
  const myDocs = documents.filter(d => d.studentId === user?.id);
  const myRequests = documentRequests
    .filter(r => r.studentId === user?.id && r.target !== 'agency')
    .sort((a, b) => (a.status === 'pending' || a.status === 'rejected' ? -1 : 1) - (b.status === 'pending' || b.status === 'rejected' ? -1 : 1));

  const pipeline = myApp?.pipeline;
  const closed = pipeline?.status === 'closed';
  const currentIdx = !pipeline ? 0
    : pipeline.current === 'done' ? PIPELINE_STAGES.length
    : PIPELINE_STAGES.findIndex(s => s.id === pipeline.current);

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

      {/* ── Stages ── */}
      <p className="mb-3" style={sectionLabel}>Your stages</p>
      {!pipeline ? (
        <div className="rounded-2xl p-5" style={card}>
          <p className="text-[13px]" style={{ color: dim(0.65) }}>
            Your case opens as soon as your application is approved — the full journey will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl p-5" style={card}>
          {PIPELINE_STAGES.map((s, i) => {
            const done = closed || Boolean(pipeline.stages[s.id]?.completedAt) || i < currentIdx;
            const active = !closed && pipeline.status === 'processing' && pipeline.current === s.id;
            const isLast = i === PIPELINE_STAGES.length - 1;
            return (
              <div key={s.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{
                    background: done ? GOLD : active ? goldA(0.18) : 'rgba(255,255,255,0.06)',
                    border: done ? 'none' : `1px solid ${active ? goldA(0.5) : 'rgba(255,255,255,0.1)'}`,
                  }}>
                    {done ? <CheckCircle2 className="w-4 h-4" style={{ color: NAVY }} />
                      : active ? <Clock className="w-4 h-4" style={{ color: GOLD }} />
                      : <Circle className="w-3 h-3" style={{ color: dim(0.4) }} />}
                  </div>
                  {!isLast && <div className="w-px flex-1 min-h-[22px] my-1" style={{ background: done ? goldA(0.5) : 'rgba(255,255,255,0.08)' }} />}
                </div>
                <div className={isLast ? 'pt-1.5' : 'pb-5 pt-1.5'}>
                  <p className="text-[14px] font-bold" style={{ color: done || active ? '#fff' : dim(0.5) }}>{s.label}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{
                    background: done ? 'rgba(76,175,80,0.15)' : active ? goldA(0.15) : 'rgba(255,255,255,0.05)',
                    color: done ? '#7BE08A' : active ? GOLD : dim(0.45),
                  }}>
                    {done ? 'Done' : active ? 'In progress' : 'Upcoming'}
                  </span>
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
                    <button
                      onClick={() => fileRefs.current[req.id]?.click()}
                      disabled={uploadingId === req.id}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-black uppercase tracking-wider"
                      style={{ background: GOLD, color: NAVY, opacity: uploadingId === req.id ? 0.6 : 1 }}
                    >
                      {uploadingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {req.status === 'rejected' ? 'Re-upload' : 'Upload now'}
                    </button>
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
    </MobileLayout>
  );
};

export default MobileJourney;
