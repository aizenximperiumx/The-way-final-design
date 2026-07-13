import React, { useMemo, useRef, useState } from 'react';
import { Plane, ChevronDown, CheckCircle2, Circle, CalendarDays, PartyPopper, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppStore, type Application } from '../store/appStore';
import { useI18n } from '../lib/i18n';
import { tap, thud } from '../lib/native';
import { GOLD, NAVY, goldCard, dim, goldA, sectionLabel, daysUntil } from './ui';

/**
 * Arrival countdown — the student sets their own flight date and the app
 * counts down with a pre-flight checklist. On the big day it flips into a
 * "Welcome to Georgia" celebration.
 */

const CHECKLIST: Array<{ id: string; en: string; ar: string }> = [
  { id: 'passport', en: 'Passport & visa in hand luggage', ar: 'جواز السفر والتأشيرة في حقيبة اليد' },
  { id: 'admission', en: 'University admission letter printed', ar: 'خطاب القبول الجامعي مطبوع' },
  { id: 'docs', en: 'Originals folder (certificates, translations)', ar: 'ملف الأصول (الشهادات والترجمات)' },
  { id: 'pickup', en: 'Airport pickup confirmed with The Way', ar: 'تأكيد الاستقبال من المطار مع The Way' },
  { id: 'stay', en: 'First nights of accommodation booked', ar: 'حجز الإقامة لأول ليالٍ' },
  { id: 'cash', en: 'Some cash (USD/EUR) for the first days', ar: 'مبلغ نقدي (دولار/يورو) للأيام الأولى' },
  { id: 'phone', en: 'Phone unlocked + charger adapters', ar: 'هاتف غير مقفل + محولات الشاحن' },
];

const ArrivalCard: React.FC<{ app: Application }> = ({ app }) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const studentSetArrivalPlan = useAppStore(s => s.studentSetArrivalPlan);
  const [open, setOpen] = useState(false);
  const dateRef = useRef<HTMLInputElement>(null);

  const days = daysUntil(app.arrivalDate);
  const checked = useMemo(() => new Set(app.arrivalChecklist ?? []), [app.arrivalChecklist]);
  const doneCount = CHECKLIST.filter(c => checked.has(c.id)).length;

  const pickDate = () => {
    tap();
    const el = dateRef.current;
    if (!el) return;
    if ('showPicker' in el && typeof (el as HTMLInputElement & { showPicker?: () => void }).showPicker === 'function') {
      try { (el as HTMLInputElement & { showPicker: () => void }).showPicker(); return; } catch { /* fall back */ }
    }
    el.click();
  };

  const onDate = (value: string) => {
    if (!value) return;
    try {
      studentSetArrivalPlan({ arrivalDate: value });
      thud();
      toast.success(t('Flight date saved ✈️', 'تم حفظ موعد الرحلة ✈️'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save');
    }
  };

  const toggle = (id: string) => {
    tap();
    const next = new Set(checked);
    if (next.has(id)) next.delete(id); else next.add(id);
    try { studentSetArrivalPlan({ checklist: [...next] }); } catch { /* no application yet */ }
  };

  const hiddenInput = (
    <input
      ref={dateRef}
      type="date"
      className="sr-only"
      min={new Date().toISOString().slice(0, 10)}
      value={app.arrivalDate ?? ''}
      onChange={e => onDate(e.target.value)}
      aria-label="Flight date"
    />
  );

  // ── No date yet: invite to set one ──
  if (!app.arrivalDate || days === null) {
    return (
      <button onClick={pickDate} className="mt-4 w-full text-left rounded-2xl p-4 flex items-center gap-3" style={{ background: goldA(0.08), border: `1px dashed ${goldA(0.35)}`, borderRadius: 20 }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: goldA(0.15) }}>
          <Plane className="w-5 h-5" style={{ color: GOLD }} />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-bold" style={{ color: '#fff' }}>{t('Booked your flight?', 'حجزت رحلتك؟')}</p>
          <p className="text-[12px]" style={{ color: dim(0.6) }}>{t('Set the date — we’ll count down together', 'حدد التاريخ — سنبدأ العد التنازلي معاً')}</p>
        </div>
        <CalendarDays className="w-5 h-5" style={{ color: GOLD }} />
        {hiddenInput}
      </button>
    );
  }

  // ── Arrival day (or past): celebrate ──
  if (days <= 0) {
    return (
      <div className="mt-4 rounded-3xl p-6 text-center relative overflow-hidden" style={goldCard}>
        <div className="absolute -left-8 -top-10 w-40 h-40 rounded-full" style={{ background: goldA(0.14), filter: 'blur(30px)' }} />
        <PartyPopper className="w-8 h-8 mx-auto" style={{ color: GOLD }} />
        <p className="v3-serif text-[24px] font-black mt-2 leading-tight" style={{ color: '#fff' }}>
          {t('Welcome to Georgia! 🇬🇪', 'أهلاً بك في جورجيا! 🇬🇪')}
        </p>
        <p className="text-[13px] mt-1" style={{ color: dim(0.65) }}>
          {t('You made it. Your advisor is one tap away if you need anything.', 'وصلت! مستشارك على بُعد ضغطة إذا احتجت أي شيء.')}
        </p>
        <button onClick={() => { tap(); navigate('/app/messages'); }} className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-full text-[12px] font-black uppercase tracking-wider" style={{ background: GOLD, color: NAVY }}>
          <MessageSquare className="w-4 h-4" /> {t('Message my advisor', 'راسل مستشاري')}
        </button>
      </div>
    );
  }

  // ── Counting down ──
  return (
    <div className="mt-4 rounded-3xl overflow-hidden" style={goldCard}>
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: GOLD }}>
            <Plane className="w-5 h-5" style={{ color: NAVY }} />
          </div>
          <div className="flex-1">
            <p style={sectionLabel}>{t('Georgia countdown', 'العد التنازلي لجورجيا')}</p>
            <p className="v3-serif text-[26px] font-black leading-tight" style={{ color: '#fff' }}>
              {days} {t(days === 1 ? 'day to go' : 'days to go', days === 1 ? 'يوم متبقٍ' : 'يوماً متبقياً')}
            </p>
          </div>
          <button onClick={pickDate} className="text-[11px] font-bold px-3 py-1.5 rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.08)', color: dim(0.7) }}>
            {new Date(app.arrivalDate).toLocaleDateString()}
          </button>
        </div>

        {/* Checklist header */}
        <button onClick={() => { tap(); setOpen(o => !o); }} className="mt-4 w-full flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(doneCount / CHECKLIST.length) * 100}%`, background: GOLD }} />
          </div>
          <span className="text-[11px] font-bold shrink-0" style={{ color: dim(0.6) }}>
            {doneCount}/{CHECKLIST.length} {t('ready', 'جاهز')}
          </span>
          <ChevronDown className="w-4 h-4 transition-transform shrink-0" style={{ color: GOLD, transform: open ? 'rotate(180deg)' : 'none' }} />
        </button>
      </div>

      {open && (
        <div className="px-5 pb-5 space-y-1.5">
          {CHECKLIST.map(item => {
            const done = checked.has(item.id);
            return (
              <button key={item.id} onClick={() => toggle(item.id)} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left" style={{ background: done ? 'rgba(76,175,80,0.10)' : 'rgba(255,255,255,0.04)' }}>
                {done
                  ? <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#7BE08A' }} />
                  : <Circle className="w-5 h-5 shrink-0" style={{ color: dim(0.3) }} />}
                <span className="text-[13px] font-semibold" style={{ color: done ? dim(0.55) : '#fff', textDecoration: done ? 'line-through' : 'none' }}>
                  {t(item.en, item.ar)}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {hiddenInput}
    </div>
  );
};

export default ArrivalCard;
export { CHECKLIST as ARRIVAL_CHECKLIST };
