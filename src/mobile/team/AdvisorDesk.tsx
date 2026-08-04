import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlarmClock, Clock, KeyRound, Sparkles, GraduationCap, Inbox, CheckCircle2, Sun,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../store/appStore';
import { getUniversityName } from '../../lib/universities';
import { GOLD, dim, goldA, goldCard } from '../ui';
import {
  DeskHeader, Stats, SectionLabel, Row, Square, Actions, Empty, initialsOf, RED, GREEN,
} from './parts';
import { useCases, fmtLeft, TOTAL_STAGES, type CaseRow } from './useCases';

/**
 * Advisor desk — the mobile face of the portal's Student Operations page.
 * Leads with the newest assignment, then "My Day" (cases by deadline urgency),
 * then documents waiting on this advisor's review.
 */

const StageBar: React.FC<{ stageNo: number; tone: string }> = ({ stageNo, tone }) => (
  <div className="flex gap-[3px] mt-3">
    {Array.from({ length: TOTAL_STAGES }, (_, i) => (
      <span
        key={i}
        className="flex-1 h-1 rounded-full"
        style={{ background: i < stageNo ? tone : 'rgba(255,255,255,0.09)' }}
      />
    ))}
  </div>
);

const CaseCard: React.FC<{ row: CaseRow; onOpen: () => void }> = ({ row, onOpen }) => {
  const tone = row.kind === 'overdue' ? RED : row.kind === 'due' ? GOLD : dim(0.55);
  const chipBg = row.kind === 'overdue'
    ? 'rgba(255,107,107,0.15)'
    : row.kind === 'due' ? goldA(0.15) : 'rgba(255,255,255,0.06)';
  const Icon = row.kind === 'overdue' ? AlarmClock : row.kind === 'permission' ? KeyRound : Clock;
  const time = row.kind === 'overdue' && row.msLeft !== null ? `${fmtLeft(row.msLeft)} over`
    : row.kind === 'due' && row.msLeft !== null ? fmtLeft(row.msLeft)
    : row.kind === 'permission' ? 'Awaiting'
    : 'No timer';

  return (
    <Row tone={row.kind === 'overdue' ? 'red' : 'plain'} onClick={onOpen}>
      <div className="flex items-center gap-3">
        <Square tone={row.kind === 'overdue' ? 'red' : row.kind === 'due' ? 'gold' : 'plain'}>
          {initialsOf(row.app.name)}
        </Square>
        <div className="flex-1 min-w-0">
          <p className="text-[14.5px] font-bold truncate" style={{ color: '#fff' }}>{row.app.name}</p>
          <p className="text-[12px] truncate mt-0.5" style={{ color: dim(0.55) }}>
            {getUniversityName(row.app.university) || 'University not set'}
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11.5px] font-black tabular-nums shrink-0"
          style={{ background: chipBg, color: tone }}
        >
          <Icon className="w-3.5 h-3.5" />{time}
        </span>
      </div>
      <StageBar stageNo={row.stageNo} tone={tone} />
      <p className="text-[11.5px] font-semibold mt-2.5" style={{ color: dim(0.5) }}>
        Stage {row.stageNo} of {TOTAL_STAGES} · {row.label}
        {row.kind === 'permission' && ' · permission needed'}
      </p>
    </Row>
  );
};

const AdvisorDesk: React.FC<{ agencyMode: boolean }> = ({ agencyMode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const applications = useAppStore(s => s.applications);
  const documentRequests = useAppStore(s => s.documentRequests);
  const notifications = useAppStore(s => s.notifications);

  // Only this advisor's approved cases (agency desks see agency-sourced work).
  const mine = useMemo(() => applications.filter(a => {
    if (a.assignedStaffId !== user?.id) return false;
    const isAgency = a.source === 'agency';
    return agencyMode ? isAgency : true;
  }), [applications, user?.id, agencyMode]);

  const rows = useCases(mine);

  const enrolled = mine.filter(a => a.pipeline?.current === 'done' || a.pipeline?.status === 'closed').length;
  const closed = mine.filter(a => a.stage === 'enrolled' && a.arrived).length;
  const processing = rows.length;
  const overdue = rows.filter(r => r.kind === 'overdue').length;

  // Documents a student or agent uploaded that this advisor still has to check.
  const myStudentIds = new Set(mine.map(a => a.studentId).filter(Boolean));
  const reviewQueue = useMemo(() => documentRequests
    .filter(r => (r.status === 'uploaded' || r.status === 'fulfilled') && myStudentIds.has(r.studentId))
    .sort((a, b) => (b.fulfilledAt ?? '').localeCompare(a.fulfilledAt ?? ''))
    .slice(0, 4), [documentRequests, mine]);

  // Newest unread "assigned to you" notification drives the hero card.
  const latestAssign = useMemo(() => notifications
    .filter(n => n.userId === user?.id && !n.read && /assigned/i.test(n.title))
    .sort((a, b) => b.time.localeCompare(a.time))[0], [notifications, user?.id]);
  const assignedApp = latestAssign
    ? mine.find(a => a.name === latestAssign.message) ?? mine.find(a => latestAssign.message?.includes(a.name ?? ''))
    : undefined;

  const nameOf = (studentId: string) =>
    mine.find(a => a.studentId === studentId)?.name ?? 'Student';

  return (
    <>
      <DeskHeader
        eyebrow={`${agencyMode ? 'Agency advisor' : 'Advisor'} · ${mine.length} case${mine.length === 1 ? '' : 's'}`}
        sub={overdue > 0 ? `${overdue} past deadline` : 'Nothing overdue'}
      />

      {latestAssign && (
        <button
          onClick={() => navigate('/app/queue')}
          className="mt-5 w-full text-left rounded-3xl p-5 relative overflow-hidden"
          style={goldCard}
        >
          <div className="absolute -right-6 -top-8 w-36 h-36 rounded-full" style={{ background: goldA(0.12), filter: 'blur(28px)' }} />
          <div className="flex items-center gap-2 relative">
            <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
            <p className="text-[11px] tracking-[2px] uppercase font-bold" style={{ color: dim(0.5) }}>
              {latestAssign.title}
            </p>
          </div>
          <p className="v3-serif text-[23px] font-black mt-2 leading-tight relative" style={{ color: '#fff' }}>
            {assignedApp?.name ?? latestAssign.message}
          </p>
          {assignedApp?.university && (
            <p className="text-[13px] mt-1.5 relative" style={{ color: dim(0.62) }}>
              {getUniversityName(assignedApp.university)}
            </p>
          )}
          <span
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-black uppercase tracking-wider relative"
            style={{ background: GOLD, color: '#0A1628' }}
          >
            <GraduationCap className="w-4 h-4" /> Open case
          </span>
        </button>
      )}

      <Stats items={[
        { n: processing, k: 'Processing' },
        { n: enrolled, k: 'Enrolled' },
        { n: closed, k: 'Closed' },
      ]} />

      <SectionLabel right={rows.length ? 'By deadline' : undefined}>My day</SectionLabel>
      {rows.length === 0 ? (
        <Empty icon={Sun} title="Nothing waiting" sub="Every active case is inside its deadline." />
      ) : (
        rows.slice(0, 6).map(r => (
          <CaseCard key={r.app.id} row={r} onOpen={() => navigate('/app/queue')} />
        ))
      )}

      {reviewQueue.length > 0 && (
        <>
          <SectionLabel right={String(reviewQueue.length)}>Waiting on my review</SectionLabel>
          {reviewQueue.map(r => (
            <Row key={r.id}>
              <div className="flex items-center gap-3">
                <Square tone="green"><Inbox className="w-5 h-5" /></Square>
                <div className="flex-1 min-w-0">
                  <p className="text-[14.5px] font-bold truncate" style={{ color: '#fff' }}>
                    {r.title} · {nameOf(r.studentId)}
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: dim(0.55) }}>Uploaded, needs checking</p>
                </div>
                <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: GREEN }} />
              </div>
              <Actions items={[{ label: 'Open in portal', onClick: () => navigate('/app/queue') }]} />
            </Row>
          ))}
        </>
      )}
    </>
  );
};

export default AdvisorDesk;
