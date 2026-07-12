import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Lock, BadgeCheck, ChevronDown, Sparkles, ScanLine, Percent } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { BENEFIT_CATEGORIES } from './benefits';
import { GOLD, NAVY, card, dim, goldA, sectionLabel } from './ui';
import MobileLayout from './MobileLayout';

/**
 * The Way Member Card — every student's personal QR identity.
 * Unlocks when their case is closed (visa + residency done) or they are
 * marked as arrived in Georgia. Partners scan the QR to verify membership
 * (opens /api/verify-member) and apply the discount.
 */
const MobileCard: React.FC = () => {
  const { user } = useAuth();
  const { applications } = useApp();
  const [openCat, setOpenCat] = useState<string | null>(BENEFIT_CATEGORIES[0]?.id ?? null);

  const myApp = applications.find(a => a.studentId === user?.id) ?? null;
  const unlocked = Boolean(myApp?.arrived) || myApp?.pipeline?.status === 'closed';
  const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();
  const verifyUrl = `${window.location.origin}/api/verify-member?sid=${encodeURIComponent(user?.id ?? '')}`;

  return (
    <MobileLayout title="Member Card">
      {/* ── The card ── */}
      <div
        className="relative overflow-hidden rounded-3xl p-6"
        style={{
          background: unlocked
            ? `linear-gradient(135deg, #16305a 0%, ${NAVY} 55%, #101f3a 100%)`
            : 'rgba(255,255,255,0.03)',
          border: `1px solid ${unlocked ? goldA(0.45) : 'rgba(255,255,255,0.08)'}`,
          boxShadow: unlocked ? `0 18px 44px rgba(0,0,0,0.45), 0 0 0 1px ${goldA(0.1)}` : 'none',
        }}
      >
        {/* Gold sheen */}
        <div className="absolute -right-10 -top-14 w-48 h-48 rounded-full pointer-events-none" style={{ background: goldA(unlocked ? 0.14 : 0.05), filter: 'blur(30px)' }} />

        <div className="flex items-start justify-between relative">
          <div>
            <p className="text-[10px] tracking-[3px] uppercase font-bold" style={{ color: GOLD }}>The Way · Georgia</p>
            <p className="v3-serif text-[22px] font-black mt-1 leading-tight" style={{ color: '#fff' }}>{user?.name ?? 'Student'}</p>
            <p className="text-[11px] mt-0.5 font-semibold" style={{ color: dim(0.55) }}>
              Member since {memberSince} · @{user?.username}
            </p>
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
          <div className="rounded-2xl p-4 relative" style={{ background: '#fff' }}>
            <QRCodeSVG value={verifyUrl} size={172} level="M" fgColor={NAVY} bgColor="#ffffff" />
            {!unlocked && (
              <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center" style={{ background: 'rgba(10,22,40,0.88)', backdropFilter: 'blur(6px)' }}>
                <Lock className="w-7 h-7 mb-2" style={{ color: GOLD }} />
                <p className="text-[12px] font-bold text-center px-4" style={{ color: '#fff' }}>Unlocks when you arrive in Georgia</p>
              </div>
            )}
          </div>
          <p className="mt-3 text-[11px] text-center" style={{ color: dim(0.5) }}>
            {unlocked
              ? 'Show this code at any partner — they scan it to verify you.'
              : 'Finish your journey and this becomes your discount card.'}
          </p>
        </div>
      </div>

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
                    <div key={p.name} className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
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
