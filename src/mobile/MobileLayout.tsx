import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Route, MessageSquare, CircleUser, QrCode, IdCard, WifiOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../store/appStore';
import { useI18n } from '../lib/i18n';
import { tap } from '../lib/native';
import { AppLockGate, isAppLockEnabled, isUnlockedThisSession } from './AppLock';
import { GOLD, NAVY, dim, goldA } from './ui';

/**
 * The Way Student — companion-app shell (/app/*).
 * Dark navy, gold accents, 5-tab bar with the Member Card (QR) elevated in
 * the center. Native feel: page transitions, pull-to-refresh, offline banner,
 * haptic taps and an optional PIN App Lock.
 */

const TabLink: React.FC<{ to: string; label: string; icon: typeof Home; active: boolean }> = ({ to, label, icon: Icon, active }) => (
  <Link
    to={to}
    onClick={() => tap()}
    className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
    style={{ color: active ? GOLD : dim(0.5) }}
  >
    <Icon className="w-5 h-5" />
    <span className="text-[9px] font-bold tracking-wide uppercase">{label}</span>
  </Link>
);

const MobileLayout: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => {
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const loadBackendState = useAppStore(s => s.loadBackendState);

  // ── App Lock ──
  const [locked, setLocked] = useState(() => Boolean(user && isAppLockEnabled(user.id) && !isUnlockedThisSession(user.id)));
  useEffect(() => {
    setLocked(Boolean(user && isAppLockEnabled(user.id) && !isUnlockedThisSession(user.id)));
  }, [user]);

  // ── Offline awareness (works on web + native) ──
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ── Pull-to-refresh ──
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const el = document.scrollingElement ?? document.documentElement;
    if (el.scrollTop <= 0 && !refreshing) touchStartY.current = e.touches[0].clientY;
    else touchStartY.current = null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    setPull(delta > 0 ? Math.min(delta * 0.45, 90) : 0);
  };
  const onTouchEnd = () => {
    if (pull > 60 && !refreshing) {
      setRefreshing(true);
      tap();
      void loadBackendState()
        .catch(() => {})
        .finally(() => { setRefreshing(false); setPull(0); });
    } else {
      setPull(0);
    }
    touchStartY.current = null;
  };

  const leftTabs = [
    { to: '/app/home', label: t('Home', 'الرئيسية'), icon: Home },
    { to: '/app/journey', label: t('Journey', 'رحلتي'), icon: Route },
  ];
  const rightTabs = [
    { to: '/app/messages', label: t('Advisor', 'مستشاري'), icon: MessageSquare },
    { to: '/app/profile', label: t('Profile', 'حسابي'), icon: CircleUser },
  ];

  // Guard: the app is for students only.
  if (user && user.role !== 'student') {
    return (
      <div className="v3 min-h-screen flex flex-col items-center justify-center px-8 text-center" style={{ background: NAVY }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: goldA(0.12) }}>
          <IdCard className="w-8 h-8" style={{ color: GOLD }} />
        </div>
        <h1 className="v3-serif text-2xl font-bold" style={{ color: '#fff' }}>This app is for students</h1>
        <p className="mt-2 text-sm" style={{ color: dim(0.6) }}>
          Your account is a {user.role} account. Please use the web portal at theway.ge to sign in.
        </p>
        <button onClick={() => navigate('/app')} className="v3-btn-fx mt-6 px-8 py-3 text-[11px] tracking-[2px] uppercase font-bold" style={{ background: GOLD, color: NAVY, borderRadius: 999 }}>
          Back
        </button>
      </div>
    );
  }

  if (locked && user) {
    return <AppLockGate userId={user.id} userName={user.name} onUnlock={() => setLocked(false)} />;
  }

  const cardActive = location.pathname.startsWith('/app/card');

  return (
    <div
      className="v3 min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #0A1628 0%, #0D1F3C 55%, #0A1628 100%)' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Offline banner */}
      {offline && (
        <div
          className="sticky top-0 z-50 flex items-center justify-center gap-2 px-4 py-2"
          style={{ background: 'rgba(255,99,99,0.16)', borderBottom: '1px solid rgba(255,99,99,0.3)', paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}
        >
          <WifiOff className="w-3.5 h-3.5" style={{ color: '#FF9B9B' }} />
          <span className="text-[11px] font-bold" style={{ color: '#FF9B9B' }}>
            {t('Offline — showing your saved data', 'غير متصل — تُعرض بياناتك المحفوظة')}
          </span>
        </div>
      )}

      {/* Pull-to-refresh indicator */}
      {(pull > 0 || refreshing) && (
        <div className="flex items-center justify-center" style={{ height: refreshing ? 44 : pull, transition: refreshing ? 'height .2s' : undefined }}>
          <Loader2
            className="w-5 h-5"
            style={{
              color: GOLD,
              animation: refreshing ? 'spin 1s linear infinite' : undefined,
              transform: refreshing ? undefined : `rotate(${pull * 3}deg)`,
              opacity: Math.min(1, pull / 55) || 1,
            }}
          />
        </div>
      )}

      {title && (
        <header
          className="sticky top-0 z-30 px-5 flex items-center"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top) + 14px)',
            paddingBottom: 14,
            background: 'rgba(10,22,40,0.85)',
            backdropFilter: 'blur(14px)',
            borderBottom: `1px solid ${goldA(0.10)}`,
          }}
        >
          <h1 className="v3-serif text-xl font-bold" style={{ color: '#fff' }}>{title}</h1>
        </header>
      )}

      {/* Content — enter-only transition per route (no exit = never blocks) */}
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="flex-1 px-5 pt-5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 108px)' }}
      >
        {children}
      </motion.main>

      {/* Bottom tab bar — Member Card elevated in the center */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: 'rgba(10,22,40,0.94)',
          backdropFilter: 'blur(18px)',
          borderTop: `1px solid ${goldA(0.12)}`,
        }}
      >
        {leftTabs.map(tb => (
          <TabLink key={tb.to} {...tb} active={location.pathname.startsWith(tb.to)} />
        ))}

        {/* Center: Member Card (QR) */}
        <div className="flex-1 relative flex flex-col items-center">
          <Link
            to="/app/card"
            onClick={() => tap()}
            aria-label="Member card"
            className="absolute -top-6 flex items-center justify-center rounded-full transition-transform active:scale-95"
            style={{
              width: 58,
              height: 58,
              background: cardActive
                ? `linear-gradient(135deg, #FFD34D, ${GOLD})`
                : `linear-gradient(135deg, ${GOLD}, #D89400)`,
              boxShadow: `0 6px 22px ${goldA(0.45)}`,
              border: '3px solid #0A1628',
            }}
          >
            <QrCode className="w-6 h-6" style={{ color: NAVY }} />
          </Link>
          <span className="mt-[38px] pb-3 text-[9px] font-bold tracking-wide uppercase" style={{ color: cardActive ? GOLD : dim(0.5) }}>
            {t('My Card', 'بطاقتي')}
          </span>
        </div>

        {rightTabs.map(tb => (
          <TabLink key={tb.to} {...tb} active={location.pathname.startsWith(tb.to)} />
        ))}
      </nav>
    </div>
  );
};

export default MobileLayout;
