import React, { useRef, useState } from 'react';
import { Route, QrCode, MessageSquare, ArrowRight } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { tap } from '../lib/native';
import { GOLD, NAVY, dim, goldA } from './ui';

/**
 * First-launch onboarding — three swipeable slides introducing the app.
 * Shown once (tw_onboarded flag), then never again.
 */

export const hasOnboarded = () => localStorage.getItem('tw_onboarded') === '1';
export const markOnboarded = () => localStorage.setItem('tw_onboarded', '1');

const MobileOnboarding: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { t } = useI18n();
  const scroller = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const slides = [
    {
      icon: Route,
      title: t('Follow your journey', 'تابع رحلتك'),
      body: t(
        'Every step from your first document to your residency — live, in your pocket.',
        'كل خطوة من أول مستند حتى الإقامة — مباشرة، في جيبك.',
      ),
    },
    {
      icon: MessageSquare,
      title: t('Your advisor, one tap away', 'مستشارك على بُعد لمسة'),
      body: t(
        'Chat directly with your personal advisor and upload requested documents from your phone.',
        'تحدث مباشرة مع مستشارك الشخصي وارفع المستندات المطلوبة من هاتفك.',
      ),
    },
    {
      icon: QrCode,
      title: t('Your member card', 'بطاقة العضوية'),
      body: t(
        'When you arrive in Georgia, your personal QR unlocks student discounts across the city.',
        'عند وصولك إلى جورجيا، رمز QR الخاص بك يفتح خصومات الطلاب في كل المدينة.',
      ),
    },
  ];

  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  const next = () => {
    tap();
    if (page >= slides.length - 1) { markOnboarded(); onDone(); return; }
    goTo(page + 1);
  };

  const skip = () => { tap(); markOnboarded(); onDone(); };

  return (
    <div className="v3 min-h-screen flex flex-col" style={{ background: `linear-gradient(180deg, ${NAVY}, #0D1F3C)` }}>
      {/* Skip */}
      <div className="flex justify-end px-6" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
        <button onClick={skip} className="text-[12px] font-bold uppercase tracking-[2px] py-2" style={{ color: dim(0.5) }}>
          {t('Skip', 'تخطي')}
        </button>
      </div>

      {/* Slides */}
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          setPage(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {slides.map((s, i) => (
          <div key={i} className="min-w-full snap-center flex flex-col items-center justify-center px-10 text-center">
            <div
              className="w-28 h-28 rounded-[32px] flex items-center justify-center mb-9"
              style={{ background: goldA(0.12), border: `1px solid ${goldA(0.3)}`, boxShadow: `0 18px 50px ${goldA(0.15)}` }}
            >
              <s.icon className="w-12 h-12" style={{ color: GOLD }} />
            </div>
            <h2 className="v3-serif text-[28px] font-black leading-tight" style={{ color: '#fff' }}>{s.title}</h2>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: dim(0.6), maxWidth: 300 }}>{s.body}</p>
          </div>
        ))}
      </div>

      {/* Dots + CTA */}
      <div className="px-8" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)' }}>
        <div className="flex items-center justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <span key={i} className="rounded-full transition-all" style={{
              width: i === page ? 22 : 8, height: 8,
              background: i === page ? GOLD : 'rgba(255,255,255,0.18)',
            }} />
          ))}
        </div>
        <button
          onClick={next}
          className="w-full py-4 rounded-2xl text-[13px] font-black uppercase tracking-[2px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          style={{ background: GOLD, color: NAVY }}
        >
          {page >= slides.length - 1 ? t('Get started', 'ابدأ الآن') : t('Next', 'التالي')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default MobileOnboarding;
