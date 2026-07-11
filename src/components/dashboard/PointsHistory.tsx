import React from 'react';
import { TrendingUp, TrendingDown, Wand2, Zap, Timer, Inbox } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import type { PointsEntry } from '../../lib/pipeline';
import { EmptyState } from './ui';

/**
 * Per-user points ledger — how every point was earned or lost (SLA outcomes,
 * CEO adjustments, activity). Used on the Profile page and in the CEO's
 * performance view.
 */

const kindMeta: Record<PointsEntry['kind'], { label: string; icon: React.ReactNode }> = {
  sla:        { label: 'Performance', icon: <Timer className="h-3.5 w-3.5" /> },
  adjustment: { label: 'CEO adjustment', icon: <Wand2 className="h-3.5 w-3.5" /> },
  activity:   { label: 'Activity', icon: <Zap className="h-3.5 w-3.5" /> },
};

export const PointsHistory: React.FC<{ userId: string; limit?: number }> = ({ userId, limit }) => {
  const ledger = useAppStore(s => s.pointsLedger);
  const mine = ledger
    .filter(e => e.userId === userId)
    .sort((a, b) => (b.at > a.at ? 1 : -1));
  const shown = limit ? mine.slice(0, limit) : mine;

  if (shown.length === 0) {
    return <EmptyState icon={Inbox} title="No points activity yet" hint="Points appear here as stages complete on time (or late), plus any CEO adjustments." />;
  }

  return (
    <ul className="divide-y divide-gray-50">
      {shown.map((e) => {
        const positive = e.delta > 0;
        const meta = kindMeta[e.kind] ?? kindMeta.activity;
        return (
          <li key={e.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
              {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{e.reason}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-400">
                {meta.icon} {meta.label}
                {e.byName ? ` · by ${e.byName}` : ''}
                {' · '}{new Date(e.at).toLocaleString()}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-black ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
              {positive ? `+${e.delta}` : e.delta}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export default PointsHistory;
