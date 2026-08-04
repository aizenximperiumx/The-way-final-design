import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, Users, MessageSquare, CircleUser, Bell, WifiOff, Loader2,
  ClipboardList, ChartColumn, Inbox,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../store/appStore';
import { tap } from '../../lib/native';
import { AppLockGate, isAppLockEnabled, isUnlockedThisSession } from '../AppLock';
import { GOLD, NAVY, dim, goldA } from '../ui';
import { deskOf } from './roles';

/**
 * The Way Team — companion-app shell (/app/desk, /app/queue, /app/alerts).
 * Same navy-and-gold identity as the student app; the tab bar changes with the
 * signed-in role and the elevated centre button is Alerts, since notifications
 * are what pull a team member into the app.
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

const LIST_ICON = { cases: ClipboardList, queue: ClipboardList, analytics: ChartColumn, leads: Inbox } as const;

const TeamLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const loadBackendState = useAppStore(s => s.loadBackendState);
  const notifications = useAppStore(s => s.notifications);

  const desk = deskOf(user?.role);
  const unread = notifications.filter(n => n.userId === user?.id && !n.read).length;

  const [locked, setLocked] = useState(() => Boolean(user && isAppLockEnabled(user.id) && !isUnlockedThisSession(user.id)));
  useEffect(() => {
    setLocked(Boolean(user && isAppLockEnabled(user.id) && !isUnlockedThisSession(user.id)));
  }, [user]);

  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Pull-to-refresh — same gesture as the student shell.
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
      void loadBackendState().catch(() => {}).finally(() => { setRefreshing(false); setPull(0); });
    } else {
      setPull(0);
    }
    touchStartY.current = null;
  };

  if (locked && user) {
    return <AppLockGate userId={user.id} userName={user.name} onUnlock={() => setLocked(false)} />;
  }

  const alertsActive = location.pathname.startsWith('/app/alerts');
  const ListIcon = LIST_ICON[desk.listKind];

  return (
    <div
      className="v3 min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #0A1628 0%, #0D1F3C 55%, #0A1628 100%)' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {offline && (
        <div
          className="sticky top-0 z-50 flex items-center justify-center gap-2 px-4 py-2"
          style={{ background: 'rgba(255,99,99,0.16)', borderBottom: '1px solid rgba(255,99,99,0.3)', paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}
        >
          <WifiOff className="w-3.5 h-3.5" style={{ color: '#FF9B9B' }} />
          <span className="text-[11px] font-bold" style={{ color: '#FF9B9B' }}>Offline — showing your saved data</span>
        </div>
      )}

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

      {/* Bottom tab bar — Alerts elevated in the centre */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: 'rgba(10,22,40,0.94)',
          backdropFilter: 'blur(18px)',
          borderTop: `1px solid ${goldA(0.12)}`,
        }}
      >
        <TabLink to="/app/desk" label={desk.homeLabel} icon={Home} active={location.pathname.startsWith('/app/desk')} />
        <TabLink to="/app/queue" label={desk.listLabel} icon={ListIcon} active={location.pathname.startsWith('/app/queue')} />

        <div className="flex-1 relative flex flex-col items-center">
          <Link
            to="/app/alerts"
            onClick={() => tap()}
            aria-label="Alerts"
            className="absolute -top-6 flex items-center justify-center rounded-full transition-transform active:scale-95"
            style={{
              width: 58,
              height: 58,
              background: alertsActive
                ? `linear-gradient(135deg, #FFD34D, ${GOLD})`
                : `linear-gradient(135deg, ${GOLD}, #D89400)`,
              boxShadow: `0 6px 22px ${goldA(0.45)}`,
              border: `3px solid ${NAVY}`,
            }}
          >
            <Bell className="w-6 h-6" style={{ color: NAVY }} />
            {unread > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-black"
                style={{ background: '#FF6B6B', color: '#fff', border: `2px solid ${NAVY}` }}
              >
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </Link>
          <span className="mt-[38px] pb-3 text-[9px] font-bold tracking-wide uppercase" style={{ color: alertsActive ? GOLD : dim(0.5) }}>
            Alerts
          </span>
        </div>

        <TabLink to="/app/messages" label="Messages" icon={MessageSquare} active={location.pathname.startsWith('/app/messages')} />
        <TabLink to="/app/profile" label="Account" icon={CircleUser} active={location.pathname.startsWith('/app/profile')} />
      </nav>
    </div>
  );
};

export default TeamLayout;
export { TabLink, Users };
