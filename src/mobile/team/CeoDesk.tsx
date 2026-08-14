import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, TrendingUp, Building2, Users, Wallet, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../../store/appStore';
import { getTier } from '../../lib/tiers';
import { getUniversityName } from '../../lib/universities';
import { GOLD, dim, goldA, card } from '../ui';
import { DeskHeader, Stats, SectionLabel, Row, Square, Tag, Actions, Empty } from './parts';
import { useCases } from './useCases';

/**
 * CEO desk — the whole company at a glance. Anything breaching an SLA is
 * raised before the figures, then the public/agency intake split and the
 * points standing that drives the portal's leaderboard.
 */

const Half: React.FC<{ n: React.ReactNode; k: string; icon: React.ElementType }> = ({ n, k, icon: Icon }) => (
  <div className="flex-1 rounded-2xl p-3.5" style={card}>
    <Icon className="w-4 h-4 mb-2" style={{ color: GOLD }} />
    <p className="v3-serif text-[20px] font-black tabular-nums" style={{ color: '#fff' }}>{n}</p>
    <p className="text-[9.5px] tracking-[1.2px] uppercase font-bold mt-1" style={{ color: dim(0.45) }}>{k}</p>
  </div>
);

const CeoDesk: React.FC = () => {
  const navigate = useNavigate();
  const applications = useAppStore(s => s.applications);
  const users = useAppStore(s => s.users);
  const tierRequests = useAppStore(s => s.tierRequests);
  const decideTierRequest = useAppStore(s => s.decideTierRequest);

  // Every processing case in the company, so breaches surface wherever they are.
  const active = useMemo(() => applications.filter(a => a.pipeline?.status === 'processing'), [applications]);
  const rows = useCases(active);
  const breaches = rows.filter(r => r.kind === 'overdue');

  const students = users.filter(u => u.role === 'student').length;
  const enrolled = applications.filter(a => a.stage === 'enrolled').length;
  const publicLeads = applications.filter(a => a.source !== 'agency').length;
  const agencyLeads = applications.filter(a => a.source === 'agency').length;

  // Points standing — the portal awards points through the SLA ledger.
  const standing = useMemo(() => users
    .filter(u => ['staff', 'sales', 'ops', 'agency', 'customer_support', 'agency_staff'].includes(u.role))
    .map(u => ({ id: u.id, name: u.name, role: u.role, points: u.points ?? 0 }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5), [users]);

  const roleLabel: Record<string, string> = {
    staff: 'Advisor', agency_staff: 'Agency advisor', sales: 'Sales',
    ops: 'Operations', agency: 'Agency', customer_support: 'Support',
  };

  const advisorsAffected = new Set(breaches.map(b => b.app.assignedStaffId).filter(Boolean)).size;

  // The two things only the CEO can clear.
  const onPayments = rows.filter(r => r.kind === 'payment');
  const openTierRequests = tierRequests.filter(r => r.status === 'requested');

  const decide = (id: string, approve: boolean) => {
    try {
      decideTierRequest(id, approve);
      toast.success(approve ? 'Card upgraded' : 'Request declined');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update the request');
    }
  };

  return (
    <>
      <DeskHeader eyebrow="Direction" sub={`${active.length} cases in progress`} />

      <Stats items={[
        { n: students.toLocaleString(), k: 'Students' },
        { n: active.length, k: 'Processing' },
        { n: breaches.length, k: 'Breaches' },
      ]} />

      {/* Everything waiting on this one person, in one pass.
          Payments are CEO-only, so a case held on money stops entirely until
          it is cleared here; leaving them to be found case by case would make
          the whole pipeline wait on someone opening the right screen. */}
      {(onPayments.length > 0 || openTierRequests.length > 0) && (
        <>
          <SectionLabel right="Only you">Waiting on you</SectionLabel>

          {onPayments.map(r => (
            <Row key={r.app.id} tone="gold" onClick={() => navigate(`/app/case/${r.app.id}`)}>
              <div className="flex items-center gap-3">
                <Square tone="gold"><Wallet className="w-5 h-5" /></Square>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-bold truncate" style={{ color: '#fff' }}>{r.app.name}</p>
                  <p className="text-[12px] mt-0.5 truncate" style={{ color: dim(0.55) }}>
                    {r.label} · {getUniversityName(r.app.university) || 'University not set'}
                  </p>
                </div>
                <Tag tone="gold">Confirm</Tag>
              </div>
            </Row>
          ))}

          {openTierRequests.map(req => (
            <div key={req.id} className="rounded-[18px] p-3.5 mb-2" style={card}>
              <div className="flex items-center gap-3">
                <Square tone="gold"><Sparkles className="w-5 h-5" /></Square>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-black truncate" style={{ color: '#fff' }}>{req.studentName}</p>
                  <p className="text-[11.5px]" style={{ color: dim(0.55) }}>
                    Wants {getTier(req.toTier).label} · {getTier(req.toTier).discountPct}% off
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => decide(req.id, true)}
                  className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider"
                  style={{ background: GOLD, color: '#0A1628' }}
                >
                  Paid — activate
                </button>
                <button
                  onClick={() => decide(req.id, false)}
                  className="px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider"
                  style={{ background: 'rgba(255,255,255,0.06)', color: dim(0.6), border: `1px solid ${goldA(0.18)}` }}
                >
                  Not yet
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {breaches.length > 0 ? (
        <>
          <SectionLabel right="Act now">Service level</SectionLabel>
          <Row tone="red">
            <div className="flex items-center gap-3">
              <Square tone="red"><ShieldAlert className="w-5 h-5" /></Square>
              <div className="flex-1 min-w-0">
                <p className="text-[14.5px] font-bold" style={{ color: '#fff' }}>
                  {breaches.length} case{breaches.length === 1 ? '' : 's'} past deadline
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: dim(0.55) }}>
                  Automatic penalty applied
                  {advisorsAffected > 0 && ` · ${advisorsAffected} advisor${advisorsAffected === 1 ? '' : 's'} affected`}
                </p>
              </div>
            </div>
            <Actions items={[{ label: 'Review breaches', onClick: () => navigate('/app/queue?filter=overdue') }]} />
          </Row>
        </>
      ) : (
        <>
          <SectionLabel>Service level</SectionLabel>
          <Empty icon={TrendingUp} title="No breaches" sub="Every active case is inside its deadline." />
        </>
      )}

      <SectionLabel>Intake split</SectionLabel>
      <div className="flex gap-2.5">
        <Half n={publicLeads.toLocaleString()} k="Public leads" icon={Users} />
        <Half n={agencyLeads.toLocaleString()} k="Agency leads" icon={Building2} />
        <Half n={enrolled.toLocaleString()} k="Enrolled" icon={TrendingUp} />
      </div>

      <SectionLabel right="Points">Standing</SectionLabel>
      {standing.length === 0 ? (
        <Empty icon={Users} title="No team yet" sub="Points appear as cases complete." />
      ) : (
        <div className="rounded-[20px] p-4" style={card}>
          {standing.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center gap-3 py-3"
              style={{ borderBottom: i === standing.length - 1 ? 'none' : `1px solid ${goldA(0.1)}` }}
            >
              <span
                className="w-7 h-7 rounded-[9px] flex items-center justify-center v3-serif text-[13.5px] font-black shrink-0"
                style={i === 0
                  ? { background: goldA(0.18), color: GOLD }
                  : { background: 'rgba(255,255,255,0.06)', color: dim(0.6) }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[14.5px] font-bold truncate" style={{ color: '#fff' }}>{s.name}</p>
                <p className="text-[12px] mt-0.5" style={{ color: dim(0.5) }}>{roleLabel[s.role] ?? s.role}</p>
              </div>
              <Tag tone={i === 0 ? 'green' : 'plain'}>{s.points}</Tag>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default CeoDesk;
