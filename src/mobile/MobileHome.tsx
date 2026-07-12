import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, ArrowRight, Upload, GraduationCap, Sparkles, QrCode,
  MessageSquare, CalendarClock, ShieldAlert, PartyPopper, Star, MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useAppStore } from '../store/appStore';
import { getUniversityName } from '../lib/universities';
import { PIPELINE_STAGES } from '../lib/pipeline';
import { BENEFIT_CATEGORIES } from './benefits';
import { GOLD, NAVY, card, goldCard, dim, goldA, sectionLabel, daysUntil } from './ui';
import MobileLayout from './MobileLayout';

/**
 * Home — adapts to where the student is in their life with The Way:
 *  · Applicant: journey progress, what's needed next.
 *  · Arrived / case closed: Georgia life mode — member card, expiries, perks.
 */
const MobileHome: React.FC = () => {
  const { user } = useAuth();
  const { applications } = useApp();
  const { documentRequests } = useAppStore();
  const navigate = useNavigate();

  const myApp = applications.find(a => a.studentId === user?.id) ?? null;
  const myRequests = documentRequests.filter(r =>
    r.studentId === user?.id && r.target !== 'agency' && (r.status === 'pending' || r.status === 'rejected'));
  const uniName = getUniversityName(user?.assignedUniversityId || myApp?.university) || 'Not assigned yet';
  const firstName = user?.name?.split(' ')?.[0] ?? 'Student';

  const pipeline = myApp?.pipeline;
  const closed = pipeline?.status === 'closed';
  const arrived = Boolean(myApp?.arrived) || closed;
  const currentIdx = !pipeline ? 0
    : pipeline.current === 'done' ? PIPELINE_STAGES.length
    : PIPELINE_STAGES.findIndex(s => s.id === pipeline.current);
  const doneCount = !pipeline ? 0
    : closed ? PIPELINE_STAGES.length
    : PIPELINE_STAGES.filter((s, i) => Boolean(pipeline.stages[s.id]?.completedAt) || i < currentIdx).length;
  const pct = Math.round((doneCount / PIPELINE_STAGES.length) * 100);
  const currentStage = pipeline && pipeline.current !== 'done'
    ? PIPELINE_STAGES.find(s => s.id === pipeline.current) : null;

  const visaDays = daysUntil(user?.visaExpiry);
  const residencyDays = daysUntil(user?.residenceExpiry);
  const passportDays = daysUntil(user?.passportExpiry);
  const expiries = [
    { label: 'Visa', days: visaDays },
    { label: 'Residence permit', days: residencyDays },
    { label: 'Passport', days: passportDays },
  ].filter(e => e.days !== null) as { label: string; days: number }[];

  return (
    <MobileLayout>
      {/* Greeting */}
      <div className="flex items-center justify-between" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}>
        <div>
          <p className="text-[11px] tracking-[2px] uppercase font-semibold" style={{ color: GOLD }}>
            {arrived ? 'Welcome to Georgia' : 'Your journey to Georgia'}
          </p>
          <h1 className="v3-serif text-[28px] font-black" style={{ color: '#fff' }}>{firstName}</h1>
        </div>
        <button
          onClick={() => navigate('/app/profile')}
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black"
          style={{ background: goldA(0.15), color: GOLD }}
        >
          {firstName.charAt(0)}
        </button>
      </div>

      {arrived ? (
        <>
          {/* ── ARRIVED MODE ── */}
          <button onClick={() => navigate('/app/card')} className="mt-5 w-full text-left rounded-3xl p-6 relative overflow-hidden" style={goldCard}>
            <div className="absolute -right-6 -top-8 w-36 h-36 rounded-full" style={{ background: goldA(0.12), filter: 'blur(28px)' }} />
            <div className="flex items-center gap-2">
              <PartyPopper className="w-4 h-4" style={{ color: GOLD }} />
              <p style={sectionLabel}>The Way Member</p>
            </div>
            <p className="v3-serif text-[24px] font-black mt-2 leading-tight" style={{ color: '#fff' }}>
              Your member card is active
            </p>
            <p className="text-[13px] mt-1" style={{ color: dim(0.65) }}>
              Show your QR code for student discounts across Georgia.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-black uppercase tracking-wider" style={{ background: GOLD, color: NAVY }}>
              <QrCode className="w-4 h-4" /> Open my card
            </span>
          </button>

          {/* Expiry watch */}
          {expiries.length > 0 && (
            <>
              <p className="mt-6 mb-3" style={sectionLabel}>Documents watch</p>
              <div className="space-y-2.5">
                {expiries.map(e => {
                  const danger = e.days <= 30;
                  const warn = e.days <= 60;
                  return (
                    <div key={e.label} className="rounded-2xl p-4 flex items-center gap-3" style={{
                      ...card,
                      ...(warn ? { border: `1px solid ${danger ? 'rgba(255,99,99,0.4)' : goldA(0.35)}` } : {}),
                    }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: danger ? 'rgba(255,99,99,0.15)' : goldA(0.12) }}>
                        {warn ? <ShieldAlert className="w-5 h-5" style={{ color: danger ? '#FF7B7B' : GOLD }} /> : <CalendarClock className="w-5 h-5" style={{ color: dim(0.6) }} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-bold" style={{ color: '#fff' }}>{e.label}</p>
                        <p className="text-[12px]" style={{ color: danger ? '#FF9B9B' : dim(0.6) }}>
                          {e.days < 0 ? 'Expired — contact your advisor now' : `Expires in ${e.days} day${e.days === 1 ? '' : 's'}`}
                        </p>
                      </div>
                      {warn && (
                        <button onClick={() => navigate('/app/messages')} className="text-[11px] font-black uppercase tracking-wide px-3 py-2 rounded-full" style={{ background: goldA(0.15), color: GOLD }}>
                          Get help
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Rate us (if not rated yet) */}
          {myApp && closed && !myApp.rating && (
            <button onClick={() => navigate('/app/journey')} className="mt-4 w-full rounded-2xl p-4 flex items-center gap-3 text-left" style={card}>
              <Star className="w-5 h-5 shrink-0" style={{ color: GOLD }} />
              <span className="text-[14px] font-semibold flex-1" style={{ color: '#fff' }}>How was your experience? Leave a rating</span>
              <ArrowRight className="w-5 h-5" style={{ color: dim(0.5) }} />
            </button>
          )}

          {/* Perks preview */}
          <p className="mt-6 mb-3" style={sectionLabel}>Member perks</p>
          <div className="grid grid-cols-2 gap-2.5">
            {BENEFIT_CATEGORIES.slice(0, 4).map(c => (
              <button key={c.id} onClick={() => navigate('/app/card')} className="rounded-2xl p-4 text-left" style={card}>
                <c.icon className="w-5 h-5 mb-2" style={{ color: GOLD }} />
                <p className="text-[13px] font-bold leading-tight" style={{ color: '#fff' }}>{c.label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: dim(0.5) }}>{c.partners.length} partner{c.partners.length > 1 ? 's' : ''}</p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* ── APPLICANT MODE ── */}
          <div className="mt-5 rounded-3xl p-6" style={goldCard}>
            <div className="flex items-end justify-between">
              <div>
                <p style={sectionLabel}>Journey progress</p>
                <p className="v3-serif text-[44px] font-black leading-none mt-1" style={{ color: '#fff' }}>{pct}%</p>
              </div>
              <p className="text-[12px] font-semibold mb-1" style={{ color: dim(0.6) }}>{doneCount} / {PIPELINE_STAGES.length} stages</p>
            </div>
            <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: GOLD }} />
            </div>
            {currentStage ? (
              <p className="mt-3 text-[12px]" style={{ color: dim(0.6) }}>
                Now: <span className="font-bold" style={{ color: '#fff' }}>{currentStage.label}</span>
              </p>
            ) : (
              <p className="mt-3 text-[12px]" style={{ color: dim(0.6) }}>
                {myApp ? 'Your case opens as soon as your application is approved.' : 'Your application will appear here once created.'}
              </p>
            )}
          </div>

          {/* Next action */}
          {myRequests.length > 0 ? (
            <button onClick={() => navigate('/app/journey')} className="mt-4 w-full text-left rounded-2xl p-4 flex items-center gap-3" style={{ background: goldA(0.12), border: `1px solid ${goldA(0.3)}`, borderRadius: 20 }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: GOLD }}>
                <Upload className="w-5 h-5" style={{ color: NAVY }} />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold" style={{ color: '#fff' }}>{myRequests.length} document{myRequests.length > 1 ? 's' : ''} needed from you</p>
                <p className="text-[12px]" style={{ color: dim(0.6) }}>Tap to upload now</p>
              </div>
              <ArrowRight className="w-5 h-5" style={{ color: GOLD }} />
            </button>
          ) : (
            <div className="mt-4 rounded-2xl p-4 flex items-center gap-3" style={card}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(76,175,80,0.18)' }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: '#7BE08A' }} />
              </div>
              <div>
                <p className="text-[14px] font-bold" style={{ color: '#fff' }}>You're all caught up</p>
                <p className="text-[12px]" style={{ color: dim(0.6) }}>We'll notify you when anything is needed.</p>
              </div>
            </div>
          )}

          {/* University */}
          <div className="mt-4 rounded-2xl p-5" style={card}>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" style={{ color: GOLD }} />
              <p style={sectionLabel}>Your university</p>
            </div>
            <p className="v3-serif text-[18px] font-bold mt-2" style={{ color: '#fff' }}>{uniName}</p>
            {myApp?.program && <p className="text-[13px] mt-1" style={{ color: dim(0.6) }}>{myApp.program}</p>}
            <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: dim(0.45) }}>
              <MapPin className="w-3.5 h-3.5" style={{ color: goldA(0.7) }} /> Tbilisi, Georgia
            </p>
          </div>

          {/* Peek at the member life */}
          <button onClick={() => navigate('/app/card')} className="mt-4 w-full text-left rounded-2xl p-4 flex items-center gap-3" style={card}>
            <Sparkles className="w-5 h-5 shrink-0" style={{ color: GOLD }} />
            <div className="flex-1">
              <p className="text-[14px] font-bold" style={{ color: '#fff' }}>Member perks await you in Georgia</p>
              <p className="text-[12px]" style={{ color: dim(0.6) }}>Discounts at supermarkets, cafés, gyms & more</p>
            </div>
            <ArrowRight className="w-5 h-5" style={{ color: dim(0.5) }} />
          </button>
        </>
      )}

      {/* Advisor shortcut (both modes) */}
      <button onClick={() => navigate('/app/messages')} className="mt-4 mb-2 w-full rounded-2xl p-4 flex items-center gap-3" style={card}>
        <MessageSquare className="w-5 h-5" style={{ color: GOLD }} />
        <span className="text-[14px] font-semibold flex-1 text-left" style={{ color: '#fff' }}>Questions? Message your advisor</span>
        <ArrowRight className="w-5 h-5" style={{ color: dim(0.5) }} />
      </button>
    </MobileLayout>
  );
};

export default MobileHome;
