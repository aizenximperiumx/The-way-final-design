import React, { useRef, useState } from 'react';
import {
  ShieldCheck, Sparkles, Plane, Route, ChevronRight, MapPin, CheckCircle2,
} from 'lucide-react';
import { tap } from '../lib/native';
import { TIERS } from '../lib/tiers';
import { GOLD, NAVY, dim, goldA } from './ui';

/**
 * The welcome a student gets the first time they sign in on a device.
 *
 * Separate from the landing onboarding, which is for someone who has not signed
 * in yet and knows nothing about us. This one is for a student who has just
 * been given an account: what their card is worth, what the tiers are, what
 * living in Georgia is like, what we actually do for them once they land, and
 * how their journey runs.
 *
 * The flag is per account rather than per device, so a student who signs in on
 * a second phone is welcomed there too, and a shared phone does not swallow the
 * welcome for whoever logs in next. It can be reopened from the profile, since
 * it is the clearest explanation of the card we have.
 */

const seenKey = (userId: string) => `tw_intro_${userId}`;
export const hasSeenIntro = (userId: string | undefined): boolean =>
  !userId || localStorage.getItem(seenKey(userId)) === '1';
export const markIntroSeen = (userId: string | undefined): void => {
  if (userId) localStorage.setItem(seenKey(userId), '1');
};

const Bullet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex items-start gap-2.5 text-[13.5px] leading-relaxed" style={{ color: dim(0.78) }}>
    <CheckCircle2 className="w-3.5 h-3.5 mt-[4px] shrink-0" style={{ color: GOLD }} /> {children}
  </li>
);

const MobileIntro: React.FC<{ userId?: string; name?: string; onDone: () => void }> = ({ userId, name, onDone }) => {
  const scroller = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const first = (name ?? '').trim().split(/\s+/)[0];

  const slides: { eyebrow: string; title: string; icon: React.ElementType; body: React.ReactNode }[] = [
    {
      eyebrow: 'Welcome',
      title: first ? `Welcome, ${first}` : 'Welcome to The Way',
      icon: ShieldCheck,
      body: (
        <>
          <p className="text-[14px] leading-relaxed" style={{ color: dim(0.78) }}>
            We have been placing international students in Georgian universities for over fifteen years.
            Everything about your application lives in this app — every document, every step, and the
            person handling it.
          </p>
          <ul className="mt-4 space-y-2">
            <Bullet>Your own advisor, not a call centre</Bullet>
            <Bullet>Every step visible, so you always know where you stand</Bullet>
            <Bullet>Nothing is paid through this app — your advisor arranges it with you</Bullet>
          </ul>
        </>
      ),
    },
    {
      eyebrow: 'Your card',
      title: 'A card that pays you back',
      icon: Sparkles,
      body: (
        <>
          <p className="text-[14px] leading-relaxed" style={{ color: dim(0.78) }}>
            Every student gets a member card. Show it at our partner shops, restaurants, clinics and
            gyms across Georgia and they take money off, every time.
          </p>
          <div className="mt-4 space-y-2">
            {TIERS.map(t => (
              <div key={t.id} className="rounded-2xl px-4 py-3 flex items-center justify-between"
                style={{ background: `linear-gradient(100deg, ${t.face.from}, ${t.face.to})` }}>
                <div>
                  <p className="text-[13px] font-black" style={{ color: t.face.ink }}>{t.label}</p>
                  <p className="text-[10.5px] font-semibold" style={{ color: t.face.ink, opacity: 0.75 }}>
                    {t.included ? 'Included with your fee' : t.tagline}
                  </p>
                </div>
                <p className="text-[20px] font-black leading-none" style={{ color: t.face.ink }}>{t.discountPct}%</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px]" style={{ color: dim(0.5) }}>
            Your card unlocks when you arrive. It is only ever shown from inside this app.
          </p>
        </>
      ),
    },
    {
      eyebrow: 'Georgia',
      title: 'Where you are going',
      icon: MapPin,
      body: (
        <>
          <p className="text-[14px] leading-relaxed" style={{ color: dim(0.78) }}>
            Georgia sits between Europe and Asia, on the Black Sea. Tbilisi is the capital: old town,
            mountains an hour away, and one of the lowest costs of living in Europe.
          </p>
          <ul className="mt-4 space-y-2">
            <Bullet>Degrees taught in English, recognised internationally</Bullet>
            <Bullet>Rent, food and transport a fraction of Western Europe</Bullet>
            <Bullet>Safe, warm to strangers, and used to international students</Bullet>
            <Bullet>Four real seasons, and the Caucasus mountains on your doorstep</Bullet>
          </ul>
        </>
      ),
    },
    {
      eyebrow: 'When you land',
      title: 'You will not arrive alone',
      icon: Plane,
      body: (
        <>
          <p className="text-[14px] leading-relaxed" style={{ color: dim(0.78) }}>
            Landing in a new country is the part people worry about. It is the part we handle most.
          </p>
          <ul className="mt-4 space-y-2">
            <Bullet>Someone meets you at the airport and takes you to your accommodation</Bullet>
            <Bullet>Help finding somewhere to live, before you arrive</Bullet>
            <Bullet>Bank account, SIM card and registration sorted with you, not left to you</Bullet>
            <Bullet>Your advisor stays with you for as long as you are studying</Bullet>
          </ul>
        </>
      ),
    },
    {
      eyebrow: 'Your journey',
      title: 'Eight steps, and you see all of them',
      icon: Route,
      body: (
        <>
          <p className="text-[14px] leading-relaxed" style={{ color: dim(0.78) }}>
            Your journey runs in eight steps, from your first payment to your residency permit. The app
            shows which one you are on, what is happening, and whether anything is waiting on you.
          </p>
          <ul className="mt-4 space-y-2">
            <Bullet>Two payments, not one: the first starts your application</Bullet>
            <Bullet>You can stop after your ministry order if you want to</Bullet>
            <Bullet>The second payment covers your visa, residency and arrival</Bullet>
            <Bullet>Continuing later picks up exactly where you stopped</Bullet>
          </ul>
        </>
      ),
    },
  ];

  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  const finish = () => { markIntroSeen(userId); onDone(); };
  const next = () => {
    tap();
    if (page >= slides.length - 1) { finish(); return; }
    goTo(page + 1);
  };
  const skip = () => { tap(); finish(); };

  const last = page >= slides.length - 1;

  return (
    <div className="fixed inset-0 z-[250] flex flex-col" style={{ background: NAVY }}>
      <div className="flex items-center justify-between px-5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}>
        <p className="text-[10px] tracking-[3px] uppercase font-black" style={{ color: GOLD }}>
          The Way · Georgia
        </p>
        <button onClick={skip} className="text-[12px] font-bold" style={{ color: dim(0.5) }}>
          Skip
        </button>
      </div>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          setPage(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {slides.map((s, i) => (
          <div key={i} className="w-full shrink-0 snap-center overflow-y-auto px-6 pt-6 pb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: goldA(0.14), border: `1px solid ${goldA(0.28)}` }}>
              <s.icon className="w-6 h-6" style={{ color: GOLD }} />
            </div>
            <p className="text-[9.5px] tracking-[2.4px] uppercase font-black" style={{ color: GOLD }}>{s.eyebrow}</p>
            <h2 className="v3-serif text-[27px] font-black mt-1.5 leading-tight" style={{ color: '#fff' }}>
              {s.title}
            </h2>
            <div className="mt-3.5">{s.body}</div>
          </div>
        ))}
      </div>

      <div className="px-6 pb-8 pt-3">
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {slides.map((_, i) => (
            <span key={i} className="h-1.5 rounded-full transition-all" style={{
              width: i === page ? 22 : 6,
              background: i === page ? GOLD : 'rgba(255,255,255,0.18)',
            }} />
          ))}
        </div>
        <button
          onClick={next}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-[12px] font-black uppercase tracking-wider"
          style={{ background: GOLD, color: NAVY }}
        >
          {last ? 'Start' : 'Next'} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default MobileIntro;
