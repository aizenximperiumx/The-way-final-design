import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, GraduationCap, ShieldCheck, FileCheck2, MessageCircle, Plane } from 'lucide-react';
import logoUrl from '../../1776590293988-019da507-f581-77e9-8281-8d60b280ccd6-removebg-preview.png';
import heroUrl from '../../IMG_2594-scaled-1.jpg';
import MobileOnboarding, { hasOnboarded } from './MobileOnboarding';

const stats = [
  { n: '5,000+', l: 'Students' },
  { n: '40+', l: 'Universities' },
  { n: '15+', l: 'Years' },
  { n: '98%', l: 'Success' },
];

const features = [
  { icon: GraduationCap, t: 'University Admission', d: 'We get you enrolled in your chosen program.' },
  { icon: FileCheck2, t: 'Documents Done For You', d: 'Translation, notarization, recognition — handled.' },
  { icon: Plane, t: 'Visa & Arrival', d: 'Full visa support, accommodation, airport pickup.' },
  { icon: ShieldCheck, t: 'Ongoing Care', d: 'Your advisor is with you through every step.' },
];

const MobileLanding: React.FC = () => {
  const navigate = useNavigate();
  // First launch: show the swipeable intro once, then always land here.
  const [showOnboarding, setShowOnboarding] = useState(() => !hasOnboarded());
  if (showOnboarding) {
    return <MobileOnboarding onDone={() => setShowOnboarding(false)} />;
  }
  return (
    <div className="v3 min-h-screen" style={{ background: 'var(--v3-navy)' }}>
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <img src={heroUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.28 }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,22,40,0.55), rgba(10,22,40,0.96))' }} />
        <div className="relative px-6 pt-8 pb-10">
          <img src={logoUrl} alt="The Way" className="h-12 w-auto object-contain" />
          <div className="mt-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-[2px]" style={{ background: 'var(--v3-yellow)' }} />
              <p className="text-[10px] tracking-[3px] uppercase font-semibold" style={{ color: 'var(--v3-yellow)' }}>Student Portal</p>
            </div>
            <h1 className="v3-serif mt-4 text-[40px] leading-[1.05] font-black" style={{ color: 'var(--v3-white)' }}>
              Study in<br /><em className="italic" style={{ color: 'var(--v3-yellow)' }}>Georgia</em>
            </h1>
            <p className="v3-body mt-4 text-[16px] leading-relaxed" style={{ color: 'rgba(245,240,232,0.7)', maxWidth: 320 }}>
              Welcome to your enrollment companion. Track your documents, university admission, and visa — all in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 border-y" style={{ borderColor: 'rgba(245,168,0,0.14)', background: 'rgba(13,31,60,0.5)' }}>
        {stats.map((s) => (
          <div key={s.l} className="py-4 text-center border-r last:border-r-0" style={{ borderColor: 'rgba(245,168,0,0.10)' }}>
            <div className="v3-serif text-[18px] font-bold" style={{ color: 'var(--v3-yellow)' }}>{s.n}</div>
            <div className="text-[9px] tracking-wide uppercase mt-0.5" style={{ color: 'rgba(245,240,232,0.62)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* About / features */}
      <div className="px-6 py-8">
        <p className="text-[10px] tracking-[3px] uppercase font-semibold" style={{ color: 'var(--v3-yellow)' }}>About The Way</p>
        <p className="v3-body mt-3 text-[15px] leading-[1.8]" style={{ color: 'rgba(245,240,232,0.62)' }}>
          The Way is a leading student recruitment and consultancy company helping international students gain admission to Georgia's top universities — simplifying every step of studying abroad.
        </p>
        <div className="mt-6 space-y-3">
          {features.map((f) => (
            <div key={f.t} className="flex items-start gap-3 p-4 rounded-2xl border" style={{ borderColor: 'rgba(245,168,0,0.14)', background: 'rgba(255,255,255,0.03)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,168,0,0.12)' }}>
                <f.icon className="w-5 h-5" style={{ color: 'var(--v3-yellow)' }} />
              </div>
              <div>
                <p className="text-[14px] font-bold" style={{ color: 'var(--v3-white)' }}>{f.t}</p>
                <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: 'rgba(245,240,232,0.62)' }}>{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        className="sticky bottom-0 px-6 pt-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)', background: 'linear-gradient(180deg, transparent, var(--v3-navy) 40%)' }}
      >
        <button
          onClick={() => navigate('/app/login')}
          className="v3-btn-fx w-full px-8 py-4 text-[12px] tracking-[2px] uppercase font-bold inline-flex items-center justify-center gap-2"
          style={{ background: 'var(--v3-yellow)', color: 'var(--v3-navy)', borderRadius: 14 }}
        >
          Log in to your portal <ArrowRight className="w-4 h-4" />
        </button>
        <a
          href="https://wa.me/995571009550"
          target="_blank"
          rel="noreferrer"
          className="mt-3 w-full px-8 py-3 inline-flex items-center justify-center gap-2 text-[12px] font-semibold rounded-[14px] border"
          style={{ borderColor: 'rgba(255,255,255,0.18)', color: 'rgba(245,240,232,0.8)' }}
        >
          <MessageCircle className="w-4 h-4" /> Don't have an account? Contact us
        </a>
      </div>
    </div>
  );
};

export default MobileLanding;
