import React, { useMemo, useState } from 'react';
import { X, CircleCheck, CircleAlert, Loader2, Building2, Search, MessageSquareWarning } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore, type Application } from '../../store/appStore';
import { UNIVERSITIES, getUniversityName } from '../../lib/universities';
import { GOLD, NAVY, dim, goldA, card } from '../ui';
import { RED, GREEN } from './parts';

/**
 * Approve an application from the phone.
 *
 * There is no advisor picker on purpose: each university has a responsible
 * advisor, so choosing the university IS the assignment. Approving hands the
 * student to whoever owns that university, and emails their credentials.
 */

const calcAge = (dob?: string): number | null => {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
};

const ApproveSheet: React.FC<{ app: Application; onClose: () => void }> = ({ app, onClose }) => {
  const setApplicationUniversity = useAppStore(s => s.setApplicationUniversity);
  const salesApproveApplication = useAppStore(s => s.salesApproveApplication);
  const requestMoreInfo = useAppStore(s => s.requestMoreInfo);

  const [picking, setPicking] = useState(false);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [ask, setAsk] = useState('');

  const isAviation = ((app.program ?? '').toLowerCase().includes('aviation')) || Boolean(app.aviationDegree);
  const age = calcAge(app.dob);
  const underage = age != null && age < 18;
  const isAgency = app.source === 'agency';

  // Exactly the conditions salesApproveApplication enforces, shown up front so
  // nobody taps Approve only to be told what is missing.
  const checks = useMemo(() => [
    { ok: isAgency ? Boolean(app.studentEmail) : Boolean(app.intakeDetails), label: isAgency ? 'Student email' : 'Intake form filled' },
    { ok: isAviation || Boolean(app.university), label: 'University selected' },
    { ok: Boolean(app.dob), label: 'Date of birth' },
    ...(underage ? [
      { ok: Boolean(app.intakeBirthCertificate), label: 'Birth certificate (under 18)' },
      { ok: Boolean(app.intakeMotherPassport), label: "Mother's passport (under 18)" },
      { ok: Boolean(app.intakeFatherPassport), label: "Father's passport (under 18)" },
    ] : []),
  ], [app, isAgency, isAviation, underage]);

  const ready = checks.every(c => c.ok);

  const unis = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = UNIVERSITIES.filter(u => !t || u.name.toLowerCase().includes(t));
    return list.slice(0, 40);
  }, [q]);

  const approve = async () => {
    setBusy(true);
    try {
      const res = await salesApproveApplication(app.id);
      toast.success(
        res.emailSent === false
          ? `Approved — email not sent, share: ${res.username} / ${res.password}`
          : `Approved. Credentials emailed to ${app.name}.`,
        { duration: res.emailSent === false ? 12000 : 5000 },
      );
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not approve');
    } finally {
      setBusy(false);
    }
  };

  const sendAsk = () => {
    if (!ask.trim()) return;
    try {
      requestMoreInfo(app.id, ask.trim());
      toast.success('Put on hold and the applicant was told what is needed');
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(4,10,20,0.72)' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-[28px] p-5 max-h-[88vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg,#0D1F3C,#0A1628)',
          borderTop: `1px solid ${goldA(0.2)}`,
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] tracking-[2px] uppercase font-bold" style={{ color: GOLD }}>
              {picking ? 'Choose the university' : 'Approve application'}
            </p>
            <p className="v3-serif text-[21px] font-black mt-1" style={{ color: '#fff' }}>{app.name}</p>
          </div>
          <button onClick={picking ? () => setPicking(false) : onClose} aria-label="Close"
            className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <X className="w-4 h-4" style={{ color: dim(0.7) }} />
          </button>
        </div>

        {picking ? (
          <>
            <div className="flex items-center gap-2.5 mt-4 px-4 rounded-2xl" style={{ ...card, height: 46 }}>
              <Search className="w-4 h-4 shrink-0" style={{ color: dim(0.45) }} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search universities"
                className="flex-1 bg-transparent outline-none text-[14px]"
                style={{ color: '#fff' }}
              />
            </div>
            <div className="mt-3">
              {unis.map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    try {
                      setApplicationUniversity(app.id, u.id);
                      toast.success(`University set — the advisor for ${u.name} takes this case on approval`);
                      setPicking(false);
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Could not set');
                    }
                  }}
                  className="w-full text-left px-4 py-3.5 rounded-2xl mb-2 flex items-center gap-3"
                  style={{ ...card, border: `1px solid ${app.university === u.id ? goldA(0.4) : goldA(0.12)}` }}
                >
                  <Building2 className="w-4 h-4 shrink-0" style={{ color: app.university === u.id ? GOLD : dim(0.45) }} />
                  <span className="text-[14px] font-semibold" style={{ color: '#fff' }}>{u.name}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-[11px] tracking-[2px] uppercase font-bold mt-5 mb-3" style={{ color: dim(0.5) }}>
              Before approving
            </p>
            {checks.map(c => (
              <div key={c.label} className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-2" style={card}>
                {c.ok
                  ? <CircleCheck className="w-4 h-4 shrink-0" style={{ color: GREEN }} />
                  : <CircleAlert className="w-4 h-4 shrink-0" style={{ color: RED }} />}
                <span className="flex-1 text-[13.5px] font-semibold" style={{ color: c.ok ? '#fff' : dim(0.75) }}>
                  {c.label}
                </span>
                {!c.ok && c.label === 'University selected' && (
                  <button onClick={() => setPicking(true)} className="text-[11px] font-black uppercase tracking-wider" style={{ color: GOLD }}>
                    Set
                  </button>
                )}
              </div>
            ))}

            <div className="rounded-2xl px-4 py-3.5 mt-3" style={{ background: goldA(0.1), border: `1px solid ${goldA(0.2)}` }}>
              <p className="text-[12.5px] leading-snug" style={{ color: dim(0.75) }}>
                {app.university
                  ? <>On approval this student goes automatically to the advisor responsible for <b style={{ color: '#fff' }}>{getUniversityName(app.university)}</b>, and their credentials are emailed.</>
                  : <>Choose a university first — it decides which advisor receives the student.</>}
              </p>
            </div>

            {askOpen ? (
              <div className="mt-4 rounded-2xl p-4" style={card}>
                <textarea
                  value={ask}
                  onChange={(e) => setAsk(e.target.value)}
                  rows={3}
                  placeholder="What do you need from the applicant?"
                  className="w-full bg-transparent outline-none text-[14px] resize-none"
                  style={{ color: '#fff' }}
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={sendAsk} disabled={!ask.trim()}
                    className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider disabled:opacity-40"
                    style={{ background: goldA(0.14), color: GOLD, border: `1px solid ${goldA(0.22)}` }}>
                    Send and hold
                  </button>
                  <button onClick={() => setAskOpen(false)}
                    className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider"
                    style={{ background: 'rgba(255,255,255,0.05)', color: dim(0.6) }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAskOpen(true)}
                className="w-full mt-3 py-3 rounded-2xl flex items-center justify-center gap-2 text-[11.5px] font-black uppercase tracking-wider"
                style={{ background: 'rgba(255,255,255,0.05)', color: dim(0.6), border: `1px solid ${goldA(0.12)}` }}
              >
                <MessageSquareWarning className="w-4 h-4" /> Ask for more information
              </button>
            )}

            <button
              onClick={approve}
              disabled={!ready || busy}
              className="w-full mt-3 py-4 rounded-2xl text-[12px] font-black uppercase tracking-[1.5px] flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: GOLD, color: NAVY }}
            >
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Approving</> : <><CircleCheck className="w-4 h-4" /> Approve and send credentials</>}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ApproveSheet;
