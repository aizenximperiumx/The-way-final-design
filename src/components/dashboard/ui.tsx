import React from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Shared dashboard UI kit — one consistent visual language across every role's
 * dashboard (Sales, Ops, Staff, Support, Admin, Agencies). Brand: navy #0A1628
 * + gold/amber accents, white rounded-2xl cards, soft borders.
 */

/* ── Page header: title, subtitle, role pill, optional right-side actions ── */
export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  pill?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}> = ({ title, subtitle, pill, icon: Icon, actions }) => (
  <section className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-r from-white via-white to-amber-50/50 shadow-sm">
    <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-amber-100/40 blur-3xl" />
    <div className="relative flex flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0A1628] text-amber-400 shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 truncate">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[13px] sm:text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        {pill && (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 md:self-auto">
            {pill}
          </span>
        )}
      </div>
    </div>
  </section>
);

/* ── Stat card ── */
export type StatTone = 'amber' | 'green' | 'blue' | 'purple' | 'red' | 'navy' | 'gray';
const toneMap: Record<StatTone, { bg: string; text: string }> = {
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-600'  },
  green:  { bg: 'bg-green-50',  text: 'text-green-600'  },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600'   },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  red:    { bg: 'bg-red-50',    text: 'text-red-600'    },
  navy:   { bg: 'bg-[#0A1628]/5', text: 'text-[#0A1628]' },
  gray:   { bg: 'bg-gray-100',  text: 'text-gray-600'   },
};

export const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: StatTone;
  hint?: string;
}> = ({ label, value, icon: Icon, tone = 'amber', hint }) => {
  const t = toneMap[tone];
  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className={`mb-2.5 sm:mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${t.bg} ${t.text}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mb-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
};

export const StatGrid: React.FC<{ children: React.ReactNode; cols?: 2 | 3 | 4 }> = ({ children, cols = 4 }) => (
  <section className={`grid grid-cols-2 gap-4 ${cols === 3 ? 'lg:grid-cols-3' : cols === 2 ? 'sm:grid-cols-2' : 'lg:grid-cols-4'}`}>
    {children}
  </section>
);

/* ── Titled section card ── */
export const DashboardSection: React.FC<{
  title: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  count?: number | string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon: Icon, action, count, children, className = '' }) => (
  <div className={`rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`}>
    <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
      {Icon && <Icon className="h-4 w-4 text-amber-500" />}
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      {count !== undefined && <span className="ml-auto text-xs font-semibold text-gray-400">{count}</span>}
      {action && <div className={count !== undefined ? '' : 'ml-auto'}>{action}</div>}
    </div>
    {children}
  </div>
);

/* ── Empty state ── */
export const EmptyState: React.FC<{ icon: LucideIcon; title: string; hint?: string }> = ({ icon: Icon, title, hint }) => (
  <div className="py-12 text-center">
    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50">
      <Icon className="h-7 w-7 text-gray-300" />
    </div>
    <p className="text-sm font-bold text-gray-900">{title}</p>
    {hint && <p className="mx-auto mt-1 max-w-xs text-sm text-gray-400">{hint}</p>}
  </div>
);
