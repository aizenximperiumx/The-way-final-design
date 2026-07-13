import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, BadgeCheck, GraduationCap, CalendarClock, ShieldAlert,
  QrCode, MessageSquare, KeyRound, ChevronRight, Loader2,
  Lock, Languages, Compass, Fingerprint,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useAppStore } from '../store/appStore';
import { getUniversityName } from '../lib/universities';
import { useI18n } from '../lib/i18n';
import { tap, thud, biometricAvailable } from '../lib/native';
import { PinPad, isAppLockEnabled, setAppLockPin, clearAppLock, verifyAppLockPin, isBioUnlockEnabled, setBioUnlockEnabled } from './AppLock';
import { GOLD, NAVY, card, dim, goldA, sectionLabel, daysUntil } from './ui';
import MobileLayout from './MobileLayout';

/** Profile — who you are with The Way, your key dates, your account. */
const MobileProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const { applications } = useApp();
  const { changePassword } = useAppStore();
  const navigate = useNavigate();
  const { lang, toggle, t } = useI18n();
  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [saving, setSaving] = useState(false);
  // App Lock setup flow
  const [lockOpen, setLockOpen] = useState(false);
  const [lockEnabled, setLockEnabled] = useState(() => isAppLockEnabled(user?.id));
  const [lockStep, setLockStep] = useState<'set' | 'confirm' | 'disable'>('set');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  // Biometric unlock (only offered when the native plugin reports a sensor)
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioOn, setBioOn] = useState(() => isBioUnlockEnabled(user?.id));
  useEffect(() => { void biometricAvailable().then(setBioAvailable); }, []);

  if (!user) return null;
  const myApp = applications.find(a => a.studentId === user.id) ?? null;
  const uniName = getUniversityName(user.assignedUniversityId || myApp?.university);
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : '—';
  const active = Boolean(myApp?.arrived) || myApp?.pipeline?.status === 'closed';

  const dates = [
    { label: 'Passport', value: user.passportExpiry, days: daysUntil(user.passportExpiry) },
    { label: 'Visa', value: user.visaExpiry, days: daysUntil(user.visaExpiry) },
    { label: 'Residence permit', value: user.residenceExpiry, days: daysUntil(user.residenceExpiry) },
  ];

  const savePw = async () => {
    if (newPw.length < 8) { toast.error('At least 8 characters'); return; }
    setSaving(true);
    try { await changePassword(newPw); toast.success('Password updated'); setNewPw(''); setPwOpen(false); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update'); }
    finally { setSaving(false); }
  };

  // ── App Lock setup / disable ──
  const openLock = () => {
    tap();
    setPin1(''); setPin2('');
    setLockStep(isAppLockEnabled(user?.id) ? 'disable' : 'set');
    setLockOpen(v => !v);
  };
  const onLockDigit = (d: string) => {
    if (!user) return;
    if (lockStep === 'confirm') {
      const next = (pin2 + d).slice(0, 4);
      setPin2(next);
      if (next.length === 4) {
        if (next === pin1) {
          void setAppLockPin(user.id, next).then(() => {
            thud();
            setLockEnabled(true);
            setLockOpen(false);
            toast.success(t('App Lock is on', 'تم تفعيل قفل التطبيق'));
          });
        } else {
          toast.error(t("PINs don't match — try again", 'الرمزان غير متطابقين — حاول مجدداً'));
          setPin1(''); setPin2(''); setLockStep('set');
        }
      }
      return;
    }
    const next = (pin1 + d).slice(0, 4);
    setPin1(next);
    if (next.length !== 4) return;
    if (lockStep === 'set') {
      setLockStep('confirm');
    } else {
      // disable: verify the current PIN first
      void verifyAppLockPin(user.id, next).then(ok => {
        if (ok) {
          clearAppLock(user.id);
          setLockEnabled(false);
          setLockOpen(false);
          toast.success(t('App Lock is off', 'تم إيقاف قفل التطبيق'));
        } else {
          toast.error(t('Wrong PIN', 'رمز خاطئ'));
          setPin1('');
        }
      });
    }
  };
  const onLockBackspace = () => {
    if (lockStep === 'confirm') setPin2(p => p.slice(0, -1));
    else setPin1(p => p.slice(0, -1));
  };

  const doLogout = () => { void logout(); navigate('/app'); };

  return (
    <MobileLayout title="Profile">
      {/* Identity */}
      <div className="rounded-3xl p-6 flex items-center gap-4" style={{ background: `linear-gradient(135deg, ${goldA(0.14)}, ${goldA(0.03)})`, border: `1px solid ${goldA(0.22)}`, borderRadius: 24 }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0" style={{ background: GOLD, color: NAVY }}>
          {user.name?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="v3-serif text-[20px] font-black leading-tight" style={{ color: '#fff' }}>{user.name}</p>
          <p className="text-[12px] mt-0.5" style={{ color: dim(0.55) }}>@{user.username} · since {memberSince}</p>
          <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide" style={{
            background: active ? 'rgba(76,175,80,0.16)' : goldA(0.14),
            color: active ? '#7BE08A' : GOLD,
          }}>
            <BadgeCheck className="w-3 h-3" /> {active ? 'Active member' : 'Future student'}
          </span>
        </div>
      </div>

      {/* University */}
      {uniName && (
        <div className="mt-4 rounded-2xl p-4 flex items-center gap-3" style={card}>
          <GraduationCap className="w-5 h-5 shrink-0" style={{ color: GOLD }} />
          <div className="min-w-0">
            <p style={sectionLabel}>University</p>
            <p className="text-[14px] font-bold truncate" style={{ color: '#fff' }}>{uniName}</p>
            {myApp?.program && <p className="text-[12px]" style={{ color: dim(0.55) }}>{myApp.program}</p>}
          </div>
        </div>
      )}

      {/* Key dates */}
      <p className="mt-6 mb-3" style={sectionLabel}>My key dates</p>
      <div className="space-y-2.5">
        {dates.map(d => {
          const danger = d.days !== null && d.days <= 30;
          const warn = d.days !== null && d.days <= 60;
          return (
            <div key={d.label} className="rounded-2xl p-4 flex items-center gap-3" style={{
              ...card,
              ...(warn ? { border: `1px solid ${danger ? 'rgba(255,99,99,0.4)' : goldA(0.35)}` } : {}),
            }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: danger ? 'rgba(255,99,99,0.15)' : goldA(0.1) }}>
                {warn ? <ShieldAlert className="w-5 h-5" style={{ color: danger ? '#FF7B7B' : GOLD }} /> : <CalendarClock className="w-5 h-5" style={{ color: dim(0.55) }} />}
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold" style={{ color: '#fff' }}>{d.label}</p>
                <p className="text-[12px]" style={{ color: danger ? '#FF9B9B' : dim(0.55) }}>
                  {d.value
                    ? d.days !== null && d.days < 0
                      ? `Expired ${d.value} — contact your advisor`
                      : `${d.value} · ${d.days} day${d.days === 1 ? '' : 's'} left`
                    : 'Not on file yet — your advisor adds this'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick links */}
      <p className="mt-6 mb-3" style={sectionLabel}>Quick links</p>
      <div className="space-y-2">
        {[
          { icon: QrCode, label: t('My member card & benefits', 'بطاقة العضوية والمزايا'), action: () => navigate('/app/card') },
          { icon: Compass, label: t('Life in Georgia guide', 'دليل الحياة في جورجيا'), action: () => navigate('/app/georgia') },
          { icon: MessageSquare, label: t('Message my advisor', 'مراسلة مستشاري'), action: () => navigate('/app/messages') },
        ].map(l => (
          <button key={l.label} onClick={l.action} className="w-full rounded-2xl p-4 flex items-center gap-3 text-left" style={card}>
            <l.icon className="w-5 h-5 shrink-0" style={{ color: GOLD }} />
            <span className="text-[14px] font-semibold flex-1" style={{ color: '#fff' }}>{l.label}</span>
            <ChevronRight className="w-4 h-4" style={{ color: dim(0.4) }} />
          </button>
        ))}

        {/* Language */}
        <button onClick={() => { tap(); toggle(); }} className="w-full rounded-2xl p-4 flex items-center gap-3 text-left" style={card}>
          <Languages className="w-5 h-5 shrink-0" style={{ color: GOLD }} />
          <span className="text-[14px] font-semibold flex-1" style={{ color: '#fff' }}>{t('Language', 'اللغة')}</span>
          <span className="text-[12px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: goldA(0.15), color: GOLD }}>
            {lang === 'ar' ? 'العربية' : 'English'}
          </span>
        </button>

        {/* App Lock */}
        <div className="rounded-2xl overflow-hidden" style={card}>
          <button onClick={openLock} className="w-full p-4 flex items-center gap-3 text-left">
            <Lock className="w-5 h-5 shrink-0" style={{ color: GOLD }} />
            <span className="text-[14px] font-semibold flex-1" style={{ color: '#fff' }}>{t('App Lock (PIN)', 'قفل التطبيق (رمز)')}</span>
            <span className="text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-full" style={{
              background: lockEnabled ? 'rgba(76,175,80,0.16)' : 'rgba(255,255,255,0.06)',
              color: lockEnabled ? '#7BE08A' : dim(0.5),
            }}>
              {lockEnabled ? t('On', 'مفعل') : t('Off', 'متوقف')}
            </span>
          </button>
          {lockOpen && (
            <div className="px-4 pb-5 text-center">
              <p className="text-[13px] font-semibold" style={{ color: dim(0.7) }}>
                {lockStep === 'set' ? t('Choose a 4-digit PIN', 'اختر رمزاً من 4 أرقام')
                  : lockStep === 'confirm' ? t('Enter the PIN again', 'أدخل الرمز مرة أخرى')
                  : t('Enter your current PIN to turn off', 'أدخل رمزك الحالي للإيقاف')}
              </p>
              <PinPad
                value={lockStep === 'confirm' ? pin2 : pin1}
                onDigit={onLockDigit}
                onBackspace={onLockBackspace}
              />
            </div>
          )}
          {/* Fingerprint / Face unlock — only on devices with the biometric plugin */}
          {lockEnabled && bioAvailable && user && (
            <button
              onClick={() => {
                tap();
                const next = !bioOn;
                setBioUnlockEnabled(user.id, next);
                setBioOn(next);
                toast.success(next ? t('Biometric unlock is on', 'تم تفعيل البصمة') : t('Biometric unlock is off', 'تم إيقاف البصمة'));
              }}
              className="w-full p-4 flex items-center gap-3 text-left"
              style={{ borderTop: `1px solid ${goldA(0.12)}` }}
            >
              <Fingerprint className="w-5 h-5 shrink-0" style={{ color: GOLD }} />
              <span className="text-[14px] font-semibold flex-1" style={{ color: '#fff' }}>{t('Fingerprint / Face unlock', 'فتح بالبصمة / الوجه')}</span>
              <span className="text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-full" style={{
                background: bioOn ? 'rgba(76,175,80,0.16)' : 'rgba(255,255,255,0.06)',
                color: bioOn ? '#7BE08A' : dim(0.5),
              }}>
                {bioOn ? t('On', 'مفعل') : t('Off', 'متوقف')}
              </span>
            </button>
          )}
        </div>

        {/* Change password */}
        <div className="rounded-2xl overflow-hidden" style={card}>
          <button onClick={() => setPwOpen(v => !v)} className="w-full p-4 flex items-center gap-3 text-left">
            <KeyRound className="w-5 h-5 shrink-0" style={{ color: GOLD }} />
            <span className="text-[14px] font-semibold flex-1" style={{ color: '#fff' }}>Change password</span>
            <ChevronRight className="w-4 h-4 transition-transform" style={{ color: dim(0.4), transform: pwOpen ? 'rotate(90deg)' : 'none' }} />
          </button>
          {pwOpen && (
            <div className="px-4 pb-4 space-y-2">
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="New password (min 8 characters)"
                className="w-full rounded-xl px-4 py-3 text-[13px] outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              />
              <button onClick={() => void savePw()} disabled={saving} className="w-full py-3 rounded-xl text-[12px] font-black uppercase tracking-wider flex items-center justify-center gap-2" style={{ background: GOLD, color: NAVY, opacity: saving ? 0.6 : 1 }}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save password
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={doLogout}
        className="mt-4 mb-2 w-full rounded-2xl p-4 flex items-center justify-center gap-2 text-[13px] font-black uppercase tracking-wider"
        style={{ background: 'rgba(255,99,99,0.1)', border: '1px solid rgba(255,99,99,0.25)', color: '#FF9B9B', borderRadius: 20 }}
      >
        <LogOut className="w-4 h-4" /> Log out
      </button>
    </MobileLayout>
  );
};

export default MobileProfile;
