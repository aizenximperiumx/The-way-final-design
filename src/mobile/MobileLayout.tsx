import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Route, MessageSquare, CircleUser, QrCode, IdCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GOLD, NAVY, dim, goldA } from './ui';

/**
 * The Way Student — companion-app shell (/app/*).
 * Dark navy, gold accents, 5-tab bar with the Member Card (QR) elevated in
 * the center. Shares the brand palette with the website, nothing else.
 */
const leftTabs = [
  { to: '/app/home', label: 'Home', icon: Home },
  { to: '/app/journey', label: 'Journey', icon: Route },
];
const rightTabs = [
  { to: '/app/messages', label: 'Advisor', icon: MessageSquare },
  { to: '/app/profile', label: 'Profile', icon: CircleUser },
];

const TabLink: React.FC<{ to: string; label: string; icon: typeof Home; active: boolean }> = ({ to, label, icon: Icon, active }) => (
  <Link
    to={to}
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

  const cardActive = location.pathname.startsWith('/app/card');

  return (
    <div
      className="v3 min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #0A1628 0%, #0D1F3C 55%, #0A1628 100%)' }}
    >
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

      <main className="flex-1 px-5 pt-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 108px)' }}>
        {children}
      </main>

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
        {leftTabs.map(t => (
          <TabLink key={t.to} {...t} active={location.pathname.startsWith(t.to)} />
        ))}

        {/* Center: Member Card (QR) */}
        <div className="flex-1 relative flex flex-col items-center">
          <Link
            to="/app/card"
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
            My Card
          </span>
        </div>

        {rightTabs.map(t => (
          <TabLink key={t.to} {...t} active={location.pathname.startsWith(t.to)} />
        ))}
      </nav>
    </div>
  );
};

export default MobileLayout;
