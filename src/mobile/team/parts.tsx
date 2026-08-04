import React from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleUser } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GOLD, dim, goldA, card, sectionLabel } from '../ui';

/** Shared building blocks for the team desks — same visual language as /app/*. */

export const RED = '#FF6B6B';
export const GREEN = '#5FCF9D';

export const initialsOf = (name?: string) =>
  (name ?? '?').trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('') || '?';

/** Screen header: gold eyebrow, serif name, avatar that opens the account tab. */
export const DeskHeader: React.FC<{ eyebrow: string; sub?: string }> = ({ eyebrow, sub }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')?.[0] ?? 'There';
  return (
    <div className="flex items-start justify-between" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}>
      <div>
        <p className="text-[11px] tracking-[2px] uppercase font-semibold" style={{ color: GOLD }}>{eyebrow}</p>
        <h1 className="v3-serif text-[28px] font-black leading-tight" style={{ color: '#fff' }}>{firstName}</h1>
        {sub && <p className="text-[12.5px] mt-1" style={{ color: dim(0.5) }}>{sub}</p>}
      </div>
      <button
        onClick={() => navigate('/app/profile')}
        aria-label="Account"
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: goldA(0.15), color: GOLD }}
      >
        {user?.name ? <span className="text-lg font-black">{initialsOf(user.name)}</span> : <CircleUser className="w-6 h-6" />}
      </button>
    </div>
  );
};

/** Three-up figure strip. */
export const Stats: React.FC<{ items: { n: React.ReactNode; k: string }[] }> = ({ items }) => (
  <div className="flex gap-2.5 mt-5">
    {items.map(s => (
      <div key={s.k} className="flex-1 rounded-[20px] px-3 py-3.5 text-center" style={card}>
        <p className="v3-serif text-[25px] font-black leading-none tabular-nums" style={{ color: '#fff' }}>{s.n}</p>
        <p className="text-[9.5px] tracking-[1.2px] uppercase font-bold mt-2" style={{ color: dim(0.45) }}>{s.k}</p>
      </div>
    ))}
  </div>
);

export const SectionLabel: React.FC<{ children: React.ReactNode; right?: React.ReactNode }> = ({ children, right }) => (
  <div className="flex items-center justify-between mt-6 mb-3">
    <p style={sectionLabel}>{children}</p>
    {right && <span className="text-[10px] font-bold tracking-[1px] uppercase" style={{ color: GOLD }}>{right}</span>}
  </div>
);

/** Horizontally scrolling filter chips. */
export const Chips: React.FC<{
  items: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
}> = ({ items, value, onChange }) => (
  <div className="flex gap-2 overflow-x-auto mt-4 pb-1" style={{ scrollbarWidth: 'none' }}>
    {items.map(c => {
      const on = c.id === value;
      return (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className="shrink-0 px-3.5 py-2 rounded-full text-[11px] font-black tracking-wide transition-colors"
          style={on
            ? { background: GOLD, color: '#0A1628' }
            : { background: 'rgba(255,255,255,0.05)', border: `1px solid ${goldA(0.14)}`, color: dim(0.6) }}
        >
          {c.label}
          {c.count !== undefined && <span className="ml-1.5 opacity-70">{c.count}</span>}
        </button>
      );
    })}
  </div>
);

export const Tag: React.FC<{ children: React.ReactNode; tone?: 'gold' | 'red' | 'green' | 'plain' }> = ({ children, tone = 'plain' }) => {
  const map = {
    gold: { background: goldA(0.15), color: GOLD },
    red: { background: 'rgba(255,107,107,0.15)', color: RED },
    green: { background: 'rgba(95,207,157,0.14)', color: GREEN },
    plain: { background: 'rgba(255,255,255,0.07)', color: dim(0.7) },
  } as const;
  return (
    <span className="text-[10px] font-black tracking-[0.8px] uppercase px-2.5 py-1.5 rounded-full shrink-0 whitespace-nowrap" style={map[tone]}>
      {children}
    </span>
  );
};

/** Small square avatar used on every list row. */
export const Square: React.FC<{ children: React.ReactNode; tone?: 'gold' | 'red' | 'green' | 'plain' }> = ({ children, tone = 'plain' }) => {
  const map = {
    gold: { background: goldA(0.15), color: GOLD },
    red: { background: 'rgba(255,107,107,0.15)', color: RED },
    green: { background: 'rgba(95,207,157,0.14)', color: GREEN },
    plain: { background: 'rgba(255,255,255,0.06)', color: dim(0.75) },
  } as const;
  return (
    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-[14.5px] font-black shrink-0" style={map[tone]}>
      {children}
    </div>
  );
};

export const Row: React.FC<{ children: React.ReactNode; tone?: 'gold' | 'red' | 'plain'; onClick?: () => void; style?: CSSProperties }> = ({ children, tone = 'plain', onClick, style }) => {
  const border = tone === 'red' ? 'rgba(255,99,99,0.4)' : tone === 'gold' ? goldA(0.4) : goldA(0.14);
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className={`rounded-[20px] p-4 mb-2.5 ${onClick ? 'active:scale-[0.995] transition-transform' : ''}`}
      style={{ ...card, border: `1px solid ${border}`, ...style }}
    >
      {children}
    </div>
  );
};

/** Inline action buttons inside a row. */
export const Actions: React.FC<{ items: { label: React.ReactNode; onClick?: () => void; ghost?: boolean; disabled?: boolean }[] }> = ({ items }) => (
  <div className="flex gap-2 mt-3">
    {items.map((a, i) => (
      <button
        key={i}
        onClick={(e) => { e.stopPropagation(); a.onClick?.(); }}
        disabled={a.disabled}
        className="flex-1 py-2.5 rounded-xl text-[11px] font-black tracking-[0.8px] uppercase flex items-center justify-center gap-1.5 disabled:opacity-40"
        style={a.ghost
          ? { background: 'rgba(255,255,255,0.05)', color: dim(0.6), border: `1px solid ${goldA(0.12)}` }
          : { background: goldA(0.14), color: GOLD, border: `1px solid ${goldA(0.22)}` }}
      >
        {a.label}
      </button>
    ))}
  </div>
);

export const Empty: React.FC<{ icon: React.ElementType; title: string; sub?: string }> = ({ icon: Icon, title, sub }) => (
  <div className="rounded-[20px] p-8 text-center" style={card}>
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: goldA(0.12) }}>
      <Icon className="w-6 h-6" style={{ color: GOLD }} />
    </div>
    <p className="text-[15px] font-bold" style={{ color: '#fff' }}>{title}</p>
    {sub && <p className="text-[12.5px] mt-1.5" style={{ color: dim(0.5) }}>{sub}</p>}
  </div>
);
