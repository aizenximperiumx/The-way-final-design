import React, { useMemo, useState } from 'react';
import { Sparkles, Check, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../../store/appStore';
import { TIERS, getTier, type CardTier } from '../../lib/tiers';
import { DashboardSection, EmptyState } from './ui';

/**
 * Card tiers, for the CEO.
 *
 * Two jobs in one place: decide the requests students have sent from the app,
 * and set a tier directly for an upgrade agreed in person, which is how most of
 * them will happen. No money moves here and no card number is ever asked for -
 * the CEO confirms payment they arranged themselves, and the tier follows.
 *
 * Self-contained on purpose: the admin dashboard is one very long file of
 * coupled tabs, and adding this inside it would have meant editing around
 * eight other features to reach the right spot.
 */

const TierPill: React.FC<{ tier: CardTier }> = ({ tier }) => {
  const t = getTier(tier);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black"
      style={{ background: `linear-gradient(100deg, ${t.face.from}, ${t.face.to})`, color: t.face.ink }}
    >
      {t.label} · {t.discountPct}%
    </span>
  );
};

export const CardTiers: React.FC = () => {
  const { users, tierRequests, cardTiers, decideTierRequest, setStudentTier, currentUser } = useAppStore();
  const [query, setQuery] = useState('');

  const isCeo = currentUser?.role === 'ceo';
  const open = tierRequests.filter(r => r.status === 'requested');

  const students = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter(u => u.role === 'student')
      .filter(u => !q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q))
      .slice(0, 40);
  }, [users, query]);

  const act = (fn: () => void, ok: string) => {
    try { fn(); toast.success(ok); } catch (e) { toast.error(e instanceof Error ? e.message : 'Action failed'); }
  };

  if (!isCeo) {
    return (
      <DashboardSection title="Card Tiers" icon={Sparkles}>
        <EmptyState icon={Sparkles} title="CEO only" hint="Card tiers are set by the CEO." />
      </DashboardSection>
    );
  }

  return (
    <>
      <DashboardSection
        title="Card Upgrade Requests"
        icon={Sparkles}
        count={open.length ? `${open.length} waiting` : undefined}
      >
        {open.length === 0 ? (
          <EmptyState icon={Sparkles} title="Nothing waiting" hint="Requests students send from the app appear here." />
        ) : (
          <ul className="divide-y divide-gray-50">
            {open.map(req => (
              <li key={req.id} className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900">{req.studentName}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-400">
                    {getTier(req.fromTier).label} → <TierPill tier={req.toTier} />
                    <span className="ml-1">· asked {new Date(req.requestedAt).toLocaleDateString()}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => act(() => decideTierRequest(req.id, true), `${req.studentName} is now on ${getTier(req.toTier).label}`)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                  >
                    <Check className="h-3.5 w-3.5" /> Paid — activate
                  </button>
                  <button
                    onClick={() => act(() => decideTierRequest(req.id, false), 'Request declined')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:bg-gray-50"
                  >
                    <X className="h-3.5 w-3.5" /> Not yet
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>

      <DashboardSection title="Set a Card Tier" icon={Sparkles}>
        <div className="border-b border-gray-100 px-4 sm:px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Find a student by name, username or email"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-400"
            />
          </div>
          <p className="mt-2 text-[11px] text-gray-400">
            For an upgrade agreed in person. The student is told straight away, and any request
            they had open is closed by this.
          </p>
        </div>

        {students.length === 0 ? (
          <EmptyState icon={Search} title="No students found" hint="Try a different name." />
        ) : (
          <ul className="divide-y divide-gray-50">
            {students.map(u => {
              const held = cardTiers[u.id]?.tier ?? 'basic';
              return (
                <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{u.name}</p>
                    <p className="truncate text-[11px] text-gray-400">@{u.username}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {TIERS.map(t => (
                      <button
                        key={t.id}
                        disabled={t.id === held}
                        onClick={() => act(() => setStudentTier(u.id, t.id), `${u.name} is now on ${t.label}`)}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                          t.id === held
                            ? 'cursor-default bg-gray-900 text-white'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                        title={t.id === held ? `Currently on ${t.label}` : `Move to ${t.label} (${t.discountPct}% off)`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DashboardSection>
    </>
  );
};

export default CardTiers;
