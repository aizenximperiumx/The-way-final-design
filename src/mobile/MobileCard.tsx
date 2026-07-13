import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Lock, BadgeCheck, ChevronDown, Sparkles, ScanLine, Percent, Maximize2, ImageDown, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { tryGetSupabase } from '../lib/supabase';
import { tap, thud } from '../lib/native';
import { useI18n } from '../lib/i18n';
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
  const { t } = useI18n();
  const [openCat, setOpenCat] = useState<string | null>(BENEFIT_CATEGORIES[0]?.id ?? null);
  const [presenting, setPresenting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [walletUrl, setWalletUrl] = useState<string | null>(null);
  const qrBoxRef = useRef<HTMLButtonElement>(null);

  const myApp = applications.find(a => a.studentId === user?.id) ?? null;
  const unlocked = Boolean(myApp?.arrived) || myApp?.pipeline?.status === 'closed';
  const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();
  const verifyUrl = `${window.location.origin}/api/verify-member?sid=${encodeURIComponent(user?.id ?? '')}`;

  // Google Wallet "save" link — appears only once the server is configured
  // with the Wallet issuer keys (see MOBILE.md); silent otherwise.
  useEffect(() => {
    if (!unlocked || !user) return;
    let cancelled = false;
    void (async () => {
      try {
        const supabase = tryGetSupabase();
        const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : undefined;
        if (!token) return;
        const resp = await fetch('/api/wallet-pass', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: user.name, username: user.username }),
        });
        const json = await resp.json().catch(() => null) as { configured?: boolean; saveUrl?: string } | null;
        if (!cancelled && resp.ok && json?.configured && json.saveUrl) setWalletUrl(json.saveUrl);
      } catch { /* wallet not available — button stays hidden */ }
    })();
    return () => { cancelled = true; };
  }, [unlocked, user]);

  /** Renders the member card as an image and shares/downloads it. */
  const saveCardImage = async () => {
    if (!user || saving) return;
    tap();
    setSaving(true);
    try {
      const svg = qrBoxRef.current?.querySelector('svg');
      if (!svg) throw new Error('QR not ready');
      const svgUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
      const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('QR render failed'));
        img.src = svgUrl;
      });

      const W = 1000, H = 1450;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');

      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#16305A'); bg.addColorStop(0.55, NAVY); bg.addColorStop(1, '#101F3A');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(245,168,0,0.5)';
      ctx.lineWidth = 3;
      ctx.strokeRect(24, 24, W - 48, H - 48);

      ctx.textAlign = 'center';
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
      ctx.fillText('T H E   W A Y   ·   G E O R G I A', W / 2, 120);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 74px Georgia, serif';
      ctx.fillText(user.name, W / 2, 220);
      ctx.fillStyle = 'rgba(245,240,232,0.6)';
      ctx.font = '32px "Segoe UI", Arial, sans-serif';
      ctx.fillText(`Member since ${memberSince} · @${user.username}`, W / 2, 275);

      const qrBox = 620;
      const qrX = (W - qrBox) / 2, qrY = 340;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      // Rounded white plate behind the QR.
      const r = 36;
      ctx.moveTo(qrX + r, qrY);
      ctx.arcTo(qrX + qrBox, qrY, qrX + qrBox, qrY + qrBox, r);
      ctx.arcTo(qrX + qrBox, qrY + qrBox, qrX, qrY + qrBox, r);
      ctx.arcTo(qrX, qrY + qrBox, qrX, qrY, r);
      ctx.arcTo(qrX, qrY, qrX + qrBox, qrY, r);
      ctx.fill();
      ctx.drawImage(qrImg, qrX + 40, qrY + 40, qrBox - 80, qrBox - 80);
      URL.revokeObjectURL(svgUrl);

      ctx.fillStyle = 'rgba(245,240,232,0.75)';
      ctx.font = '30px "Segoe UI", Arial, sans-serif';
      ctx.fillText('Show this code at any partner store', W / 2, qrY + qrBox + 90);
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 34px "Segoe UI", Arial, sans-serif';
      ctx.fillText('theway.ge', W / 2, H - 90);

      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('Could not render card');
      const file = new File([blob], 'theway-member-card.png', { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      // Share sheet on phones (saves to gallery/WhatsApp); plain download on desktop.
      const onPhone = /android|iphone|ipad/i.test(navigator.userAgent);
      if (onPhone && nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: 'The Way member card' }).catch(() => {});
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'theway-member-card.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }
      thud();
      toast.success(t('Card saved — keep it in your gallery', 'تم حفظ البطاقة في معرض الصور'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save card');
    } finally {
      setSaving(false);
    }
  };

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
          <button
            ref={qrBoxRef}
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

        {/* Card actions */}
        {unlocked && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2 relative">
              <button onClick={() => { tap(); setPresenting(true); }} className="flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider" style={{ background: GOLD, color: NAVY }}>
                <Maximize2 className="w-4 h-4" /> {t('Show at store', 'اعرضها بالمتجر')}
              </button>
              <button onClick={() => void saveCardImage()} disabled={saving} className="flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider" style={{ background: goldA(0.14), color: GOLD, border: `1px solid ${goldA(0.35)}`, opacity: saving ? 0.6 : 1 }}>
                <ImageDown className="w-4 h-4" /> {t('Save to phone', 'حفظ في الهاتف')}
              </button>
            </div>
            {walletUrl && (
              <button
                onClick={() => { tap(); window.open(walletUrl, '_blank', 'noopener'); }}
                className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-bold relative"
                style={{ background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                <Wallet className="w-4 h-4" /> Add to Google Wallet
              </button>
            )}
          </>
        )}
      </div>

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
