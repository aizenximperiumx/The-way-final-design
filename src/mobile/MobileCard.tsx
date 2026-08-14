import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Lock, BadgeCheck, ChevronDown, Sparkles, ScanLine, Percent, Maximize2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useAppStore } from '../store/appStore';
import { getTier, upgradesFrom, type CardTier } from '../lib/tiers';
import { tap } from '../lib/native';
import { useI18n } from '../lib/i18n';
import { BENEFIT_CATEGORIES } from './benefits';
import { GOLD, NAVY, card, dim, goldA, sectionLabel } from './ui';
import MobileLayout from './MobileLayout';
import HoloCard from './HoloCard';

/**
 * The Way Member Card — every student's personal QR identity.
 * Unlocks when their case is closed (visa + residency done) or they are
 * marked as arrived in Georgia. Partners scan the QR to verify membership
 * (opens /api/verify-member) and apply the discount.
 */
const MobileCard: React.FC = () => {
  const { user } = useAuth();
  const { applications } = useApp();
  const { t } = useI18n();
  const [openCat, setOpenCat] = useState<string | null>(BENEFIT_CATEGORIES[0]?.id ?? null);
  const [presenting, setPresenting] = useState(false);

  const cardTiers = useAppStore(s => s.cardTiers);
  const tierRequests = useAppStore(s => s.tierRequests);
  const requestTierUpgrade = useAppStore(s => s.requestTierUpgrade);

  const myApp = applications.find(a => a.studentId === user?.id) ?? null;
  const unlocked = Boolean(myApp?.arrived) || myApp?.pipeline?.status === 'closed';
  const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();
  const verifyUrl = `${window.location.origin}/api/verify-member?sid=${encodeURIComponent(user?.id ?? '')}`;

  // From the shared map, not the user record: a profile refresh rebuilds users
  // from a fixed set of columns and would drop it.
  const tier = getTier(cardTiers[user?.id ?? '']?.tier);
  const available = upgradesFrom(tier.id);
  const pending = tierRequests.find(r => r.studentId === user?.id && r.status === 'requested');

  const askForUpgrade = (to: CardTier) => {
    tap();
    try {
      requestTierUpgrade(to);
      toast.success(`Asked for the ${getTier(to).label} card — we will be in touch`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send the request');
    }
  };

  return (
    <MobileLayout title="Member Card">
      {/* ── The card ──
          A real object: it turns toward you, the foil travels, and the
          highlight tracks the tilt. Sized to its content so the QR stays
          large enough to scan. */}
      <HoloCard aspect={null} radius={24} inactive={!unlocked}>
        <div className="relative p-6">

        <div className="flex items-start justify-between relative">
          <div>
            <p className="text-[10px] tracking-[3px] uppercase font-bold" style={{ color: GOLD }}>The Way · Georgia</p>
            <p className="v3-serif text-[22px] font-black mt-1 leading-tight" style={{ color: '#fff' }}>{user?.name ?? 'Student'}</p>
            <p className="text-[11px] mt-0.5 font-semibold" style={{ color: dim(0.55) }}>
              Member since {memberSince} · @{user?.username}
            </p>
            {/* The tier and what it is worth, on the face of the card, because
                that number is the whole reason to carry it. */}
            <div className="mt-2.5 inline-flex items-center gap-2 rounded-full pl-1 pr-2.5 py-1"
              style={{ background: `linear-gradient(100deg, ${tier.face.from}, ${tier.face.to})`, boxShadow: `0 2px 14px ${tier.face.glow}` }}>
              <span className="rounded-full px-2 py-0.5 text-[9.5px] font-black uppercase tracking-widest"
                style={{ background: 'rgba(255,255,255,0.22)', color: tier.face.ink }}>
                {tier.label}
              </span>
              <span className="text-[11.5px] font-black" style={{ color: tier.face.ink }}>
                {tier.discountPct}% off
              </span>
            </div>
          </div>
          {unlocked ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide shrink-0" style={{ background: 'rgba(76,175,80,0.16)', color: '#7BE08A', border: '1px solid rgba(76,175,80,0.3)' }}>
              <BadgeCheck className="w-3 h-3" /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide shrink-0" style={{ background: 'rgba(255,255,255,0.06)', color: dim(0.5) }}>
              <Lock className="w-3 h-3" /> Locked
            </span>
          )}
        </div>

        {/* QR */}
        <div className="mt-6 flex flex-col items-center">
          <button
            onClick={() => { if (unlocked) { tap(); setPresenting(true); } }}
            className="rounded-2xl p-4 relative"
            style={{ background: '#fff', cursor: unlocked ? 'pointer' : 'default' }}
            aria-label={unlocked ? 'Show card fullscreen' : 'Card locked'}
          >
            <QRCodeSVG value={verifyUrl} size={172} level="M" fgColor={NAVY} bgColor="#ffffff" />
            {!unlocked && (
              <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center" style={{ background: 'rgba(10,22,40,0.88)', backdropFilter: 'blur(6px)' }}>
                <Lock className="w-7 h-7 mb-2" style={{ color: GOLD }} />
                <p className="text-[12px] font-bold text-center px-4" style={{ color: '#fff' }}>Unlocks when you arrive in Georgia</p>
              </div>
            )}
          </button>
          <p className="mt-3 text-[11px] text-center" style={{ color: dim(0.5) }}>
            {unlocked
              ? 'Show this code at any partner — they scan it to verify you.'
              : 'Finish your journey and this becomes your discount card.'}
          </p>
        </div>

        {/* Card actions — the code is only ever shown from inside the app, so
            there is deliberately no way to save or export it. */}
        {unlocked && (
          <button
            onClick={() => { tap(); setPresenting(true); }}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-wider relative"
            style={{ background: GOLD, color: NAVY }}
          >
            <Maximize2 className="w-4 h-4" /> {t('Show at store', 'اعرضها بالمتجر')}
          </button>
        )}
        </div>
      </HoloCard>

      {/* Fullscreen present mode — white and bright for the scanner */}
      {presenting && (
        <button
          onClick={() => { tap(); setPresenting(false); }}
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center px-8"
          style={{ background: '#fff' }}
          aria-label="Close fullscreen card"
        >
          <p className="text-[11px] tracking-[3px] uppercase font-black" style={{ color: '#B8860B' }}>The Way · Georgia</p>
          <p className="v3-serif text-[26px] font-black mt-1 mb-6" style={{ color: NAVY }}>{user?.name}</p>
          <QRCodeSVG value={verifyUrl} size={Math.min(300, window.innerWidth - 96)} level="M" fgColor={NAVY} bgColor="#ffffff" />
          <p className="mt-6 text-[13px] font-semibold" style={{ color: '#5B6B84' }}>
            {t('Let the partner scan this code', 'دع الشريك يمسح هذا الرمز')}
          </p>
          <p className="mt-1 text-[11px]" style={{ color: '#9AA6B8' }}>{t('Tap anywhere to close', 'اضغط في أي مكان للإغلاق')}</p>
        </button>
      )}

      {/* ── Moving up a tier ──
          The app never takes the money. It records that the student wants the
          upgrade; the CEO confirms once payment is arranged. That keeps card
          numbers out of the app entirely, which is the only safe place for
          them to be. */}
      {pending ? (
        <div className="mt-6 rounded-2xl p-4" style={{ background: goldA(0.09), border: `1px solid ${goldA(0.22)}` }}>
          <p className="text-[12.5px] font-black" style={{ color: GOLD }}>
            {getTier(pending.toTier).label} card requested
          </p>
          <p className="mt-1 text-[12px]" style={{ color: dim(0.7) }}>
            We have your request from {new Date(pending.requestedAt).toLocaleDateString()}. Someone will
            contact you to arrange it, and your card changes the moment it is confirmed.
          </p>
        </div>
      ) : available.length > 0 ? (
        <>
          <p className="mt-6 mb-3" style={sectionLabel}>Get more off</p>
          <div className="space-y-3">
            {available.map(up => (
              <div key={up.id} className="rounded-2xl overflow-hidden" style={card}>
                <div className="px-4 py-3 flex items-center justify-between"
                  style={{ background: `linear-gradient(100deg, ${up.face.from}, ${up.face.to})` }}>
                  <div>
                    <p className="text-[13.5px] font-black" style={{ color: up.face.ink }}>{up.label}</p>
                    <p className="text-[11px] font-semibold" style={{ color: up.face.ink, opacity: 0.75 }}>{up.tagline}</p>
                  </div>
                  <p className="text-[22px] font-black leading-none" style={{ color: up.face.ink }}>{up.discountPct}%</p>
                </div>
                <div className="p-4">
                  <ul className="space-y-1.5">
                    {up.perks.map(p => (
                      <li key={p} className="flex items-start gap-2 text-[12.5px]" style={{ color: dim(0.75) }}>
                        <Percent className="w-3 h-3 mt-[3px] shrink-0" style={{ color: GOLD }} /> {p}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => askForUpgrade(up.id)}
                    className="mt-3.5 w-full py-3 rounded-xl text-[11px] font-black uppercase tracking-wider"
                    style={{ background: GOLD, color: NAVY }}
                  >
                    Ask about {up.label}
                  </button>
                  <p className="mt-2 text-[10.5px] text-center" style={{ color: dim(0.45) }}>
                    No payment here — we contact you to arrange it.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-2xl p-4" style={{ background: goldA(0.09), border: `1px solid ${goldA(0.22)}` }}>
          <p className="text-[12.5px] font-black" style={{ color: GOLD }}>You are on {tier.label}</p>
          <p className="mt-1 text-[12px]" style={{ color: dim(0.7) }}>
            {tier.discountPct}% off at every partner — the most we give.
          </p>
        </div>
      )}

      {/* ── How it works ── */}
      <p className="mt-6 mb-3" style={sectionLabel}>How it works</p>
      <div className="rounded-2xl p-4 space-y-3" style={card}>
        {[
          { icon: BadgeCheck, text: 'Arrive in Georgia — your card activates automatically.' },
          { icon: ScanLine, text: 'Show your QR code at any partner store.' },
          { icon: Percent, text: 'They scan, verify you are a The Way student, and apply your discount.' },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: goldA(0.12) }}>
              <s.icon className="w-4 h-4" style={{ color: GOLD }} />
            </div>
            <p className="text-[13px]" style={{ color: dim(0.75) }}>{s.text}</p>
          </div>
        ))}
      </div>

      {/* ── Partner catalog ── */}
      <p className="mt-6 mb-3" style={sectionLabel}>Partner benefits</p>
      <div className="space-y-2.5 mb-2">
        {BENEFIT_CATEGORIES.map(cat => {
          const open = openCat === cat.id;
          return (
            <div key={cat.id} className="rounded-2xl overflow-hidden" style={card}>
              <button onClick={() => setOpenCat(open ? null : cat.id)} className="w-full flex items-center gap-3 p-4 text-left">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: goldA(0.12) }}>
                  <cat.icon className="w-5 h-5" style={{ color: GOLD }} />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold" style={{ color: '#fff' }}>{cat.label}</p>
                  <p className="text-[11px]" style={{ color: dim(0.5) }}>{cat.partners.length} partner{cat.partners.length > 1 ? 's' : ''}</p>
                </div>
                <ChevronDown className="w-4 h-4 transition-transform" style={{ color: dim(0.5), transform: open ? 'rotate(180deg)' : 'none' }} />
              </button>
              {open && (
                <div className="px-4 pb-4 space-y-2">
                  {cat.partners.map(p => (
                    <div key={p.name} className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div className="flex-1">
                        <p className="text-[13px] font-bold" style={{ color: p.comingSoon ? dim(0.55) : '#fff' }}>{p.name}</p>
                        <p className="text-[11px]" style={{ color: dim(0.5) }}>{p.deal}</p>
                      </div>
                      {p.comingSoon && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full shrink-0" style={{ background: goldA(0.12), color: GOLD }}>
                          Soon
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mb-2 rounded-2xl p-4 flex items-center gap-3" style={{ background: goldA(0.08), border: `1px dashed ${goldA(0.3)}`, borderRadius: 20 }}>
        <Sparkles className="w-5 h-5 shrink-0" style={{ color: GOLD }} />
        <p className="text-[12px]" style={{ color: dim(0.7) }}>
          New partners are added regularly — deals marked <span className="font-bold" style={{ color: GOLD }}>Soon</span> are being signed now.
        </p>
      </div>
    </MobileLayout>
  );
};

export default MobileCard;
