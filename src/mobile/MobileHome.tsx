import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle2, ShieldCheck, Building2, MapPin, ArrowRight, Clock, Upload, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useAppStore } from '../store/appStore';
import { getUniversityName } from '../lib/universities';
import MobileLayout from './MobileLayout';

const steps = [
  { id: 'translation', label: 'Documents', icon: FileText },
  { id: 'university-approval', label: 'University Approval', icon: CheckCircle2 },
  { id: 'recognition-letter', label: 'Recognition', icon: ShieldCheck },
  { id: 'ministry-order', label: 'Ministry Order', icon: Building2 },
  { id: 'visa-documents', label: 'Visa', icon: MapPin },
] as const;

const MobileHome: React.FC = () => {
  const { user } = useAuth();
  const { applications, documents } = useApp();
  const { documentRequests } = useAppStore();
  const navigate = useNavigate();

  const myApp = applications.find(a => a.studentId === user?.id) ?? null;
  const myDocs = documents.filter(d => d.studentId === user?.id);
  const myRequests = documentRequests.filter(r => r.studentId === user?.id && r.status === 'pending');
  const uniName = getUniversityName(user?.assignedUniversityId || myApp?.university) || 'Not assigned yet';
  const firstName = user?.name?.split(' ')?.[0] ?? 'Student';

  const stepStatus = (id: string): 'verified' | 'pending' | 'missing' => {
    const ds = myDocs.filter(d => d.type === id);
    if (ds.some(d => d.status === 'verified')) return 'verified';
    if (ds.some(d => d.status === 'pending')) return 'pending';
    return 'missing';
  };
  const done = steps.filter(s => stepStatus(s.id) === 'verified').length;
  const pct = Math.round((done / steps.length) * 100);

  const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,168,0,0.14)' };

  return (
    <MobileLayout>
      {/* Greeting */}
      <div className="flex items-center justify-between" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}>
        <div>
          <p className="text-[11px] tracking-[2px] uppercase font-semibold" style={{ color: 'var(--v3-yellow)' }}>Welcome back</p>
          <h1 className="v3-serif text-[28px] font-black" style={{ color: 'var(--v3-white)' }}>{firstName}</h1>
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black" style={{ background: 'rgba(245,168,0,0.15)', color: 'var(--v3-yellow)' }}>
          {firstName.charAt(0)}
        </div>
      </div>

      {/* Progress card */}
      <div className="mt-5 rounded-3xl p-6" style={{ background: 'linear-gradient(135deg, rgba(245,168,0,0.16), rgba(245,168,0,0.04))', border: '1px solid rgba(245,168,0,0.2)' }}>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] tracking-[2px] uppercase font-semibold" style={{ color: 'rgba(245,240,232,0.6)' }}>Enrollment progress</p>
            <p className="v3-serif text-[44px] font-black leading-none mt-1" style={{ color: 'var(--v3-white)' }}>{pct}%</p>
          </div>
          <p className="text-[12px] font-semibold mb-1" style={{ color: 'rgba(245,240,232,0.6)' }}>{done} / {steps.length} steps</p>
        </div>
        <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--v3-yellow)' }} />
        </div>
        <p className="mt-3 text-[12px]" style={{ color: 'rgba(245,240,232,0.6)' }}>
          Stage: <span className="font-bold capitalize" style={{ color: 'var(--v3-white)' }}>{myApp?.stage ?? 'Applied'}</span>
        </p>
      </div>

      {/* Next action */}
      {myRequests.length > 0 ? (
        <button onClick={() => navigate('/app/documents')} className="mt-4 w-full text-left rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(245,168,0,0.12)', border: '1px solid rgba(245,168,0,0.3)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--v3-yellow)' }}>
            <Upload className="w-5 h-5" style={{ color: 'var(--v3-navy)' }} />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold" style={{ color: 'var(--v3-white)' }}>{myRequests.length} document{myRequests.length > 1 ? 's' : ''} requested</p>
            <p className="text-[12px]" style={{ color: 'rgba(245,240,232,0.6)' }}>Tap to upload now</p>
          </div>
          <ArrowRight className="w-5 h-5" style={{ color: 'var(--v3-yellow)' }} />
        </button>
      ) : (
        <div className="mt-4 rounded-2xl p-4 flex items-center gap-3" style={card}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(76,175,80,0.18)' }}>
            <CheckCircle2 className="w-5 h-5" style={{ color: '#7BE08A' }} />
          </div>
          <div>
            <p className="text-[14px] font-bold" style={{ color: 'var(--v3-white)' }}>You're all caught up</p>
            <p className="text-[12px]" style={{ color: 'rgba(245,240,232,0.6)' }}>No documents requested right now.</p>
          </div>
        </div>
      )}

      {/* University */}
      <div className="mt-4 rounded-2xl p-5" style={card}>
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4" style={{ color: 'var(--v3-yellow)' }} />
          <p className="text-[10px] tracking-[2px] uppercase font-bold" style={{ color: 'rgba(245,240,232,0.5)' }}>Your University</p>
        </div>
        <p className="v3-serif text-[18px] font-bold mt-2" style={{ color: 'var(--v3-white)' }}>{uniName}</p>
        {myApp?.program && <p className="text-[13px] mt-1" style={{ color: 'rgba(245,240,232,0.6)' }}>{myApp.program}</p>}
      </div>

      {/* Journey timeline */}
      <p className="mt-6 mb-3 text-[11px] tracking-[2px] uppercase font-bold" style={{ color: 'rgba(245,240,232,0.5)' }}>Your journey</p>
      <div className="space-y-0">
        {steps.map((s, i) => {
          const st = stepStatus(s.id);
          const isLast = i === steps.length - 1;
          return (
            <div key={s.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{
                  background: st === 'verified' ? 'var(--v3-yellow)' : 'rgba(255,255,255,0.06)',
                  border: st === 'verified' ? 'none' : '1px solid rgba(245,168,0,0.2)',
                }}>
                  <s.icon className="w-4 h-4" style={{ color: st === 'verified' ? 'var(--v3-navy)' : 'rgba(245,240,232,0.6)' }} />
                </div>
                {!isLast && <div className="w-px flex-1 min-h-[26px] my-1" style={{ background: 'rgba(245,168,0,0.18)' }} />}
              </div>
              <div className="pb-5 pt-2">
                <p className="text-[14px] font-bold" style={{ color: 'var(--v3-white)' }}>{s.label}</p>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{
                  background: st === 'verified' ? 'rgba(76,175,80,0.15)' : st === 'pending' ? 'rgba(245,168,0,0.15)' : 'rgba(255,255,255,0.06)',
                  color: st === 'verified' ? '#7BE08A' : st === 'pending' ? 'var(--v3-yellow)' : 'rgba(245,240,232,0.5)',
                }}>
                  {st === 'verified' ? 'Done' : st === 'pending' ? 'In review' : 'Awaiting'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Message advisor */}
      <button onClick={() => navigate('/app/messages')} className="mt-2 mb-2 w-full rounded-2xl p-4 flex items-center gap-3" style={card}>
        <Clock className="w-5 h-5" style={{ color: 'var(--v3-yellow)' }} />
        <span className="text-[14px] font-semibold flex-1 text-left" style={{ color: 'var(--v3-white)' }}>Questions? Message your advisor</span>
        <ArrowRight className="w-5 h-5" style={{ color: 'rgba(245,240,232,0.5)' }} />
      </button>
    </MobileLayout>
  );
};

export default MobileHome;
