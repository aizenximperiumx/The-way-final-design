import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, MessageSquare, IdCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Dark, premium, mobile-native shell for the student app (/app/*).
 * Its own design — reuses only the brand palette (navy + gold) via the `v3`
 * tokens, not the website layout.
 */
const tabs = [
  { to: '/app/home', label: 'Home', icon: Home },
  { to: '/app/documents', label: 'Docs', icon: FileText },
  { to: '/app/messages', label: 'Advisor', icon: MessageSquare },
  { to: '/app/profile', label: 'Profile', icon: IdCard },
];

const MobileLayout: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => {
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Guard: the app is for students only.
  if (user && user.role !== 'student') {
    return (
      <div className="v3 min-h-screen flex flex-col items-center justify-center px-8 text-center" style={{ background: 'var(--v3-navy)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(245,168,0,0.12)' }}>
          <IdCard className="w-8 h-8" style={{ color: 'var(--v3-yellow)' }} />
        </div>
        <h1 className="v3-serif text-2xl font-bold" style={{ color: 'var(--v3-white)' }}>This app is for students</h1>
        <p className="mt-2 text-sm" style={{ color: 'rgba(245,240,232,0.6)' }}>
          Your account is a {user.role} account. Please use the web portal at theway.ge to sign in.
        </p>
        <button onClick={() => navigate('/app')} className="v3-btn-fx mt-6 px-8 py-3 text-[11px] tracking-[2px] uppercase font-bold" style={{ background: 'var(--v3-yellow)', color: 'var(--v3-navy)', borderRadius: 999 }}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div
      className="v3 min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #0A1628 0%, #0D1F3C 55%, #0A1628 100%)' }}
    >
      {/* Top bar */}
      {title && (
        <header
          className="sticky top-0 z-30 px-5 flex items-center"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top) + 14px)',
            paddingBottom: 14,
            background: 'rgba(10,22,40,0.85)',
            backdropFilter: 'blur(14px)',
            borderBottom: '1px solid rgba(245,168,0,0.10)',
          }}
        >
          <h1 className="v3-serif text-xl font-bold" style={{ color: 'var(--v3-white)' }}>{title}</h1>
        </header>
      )}

      {/* Content */}
      <main className="flex-1 px-5 pt-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)' }}>
        {children}
      </main>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: 'rgba(10,22,40,0.92)',
          backdropFilter: 'blur(18px)',
          borderTop: '1px solid rgba(245,168,0,0.12)',
        }}
      >
        {tabs.map((t) => {
          const active = location.pathname === t.to || location.pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
              style={{ color: active ? 'var(--v3-yellow)' : 'rgba(245,240,232,0.5)' }}
            >
              <t.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-wide uppercase">{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileLayout;
