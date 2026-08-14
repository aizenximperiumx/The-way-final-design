import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Users as UsersIcon, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../store/appStore';
import { getUniversityName } from '../../lib/universities';
import { GOLD, dim, goldA, card } from '../ui';
import TeamLayout from './TeamLayout';
import { SectionLabel, Row, Square, Tag, Empty, initialsOf } from './parts';
import { deskOf } from './roles';
import { useCases, fmtLeft, TOTAL_STAGES } from './useCases';

/**
 * The second tab — the full list behind the desk. Advisors get every case they
 * hold, sales/ops the whole submitted pool, the CEO every processing case,
 * support the entire lead book. Searchable, since these lists get long.
 */

const TeamQueue: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const onlyOverdue = params.get('filter') === 'overdue';
  const desk = deskOf(user?.role);
  const applications = useAppStore(s => s.applications);
  const leads = useAppStore(s => s.leads);
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();

  const scoped = useMemo(() => {
    switch (desk.kind) {
      case 'advisor':
        return applications.filter(a => a.assignedStaffId === user?.id && (!desk.agencyMode || a.source === 'agency'));
      case 'sales':
        return applications.filter(a => a.status === 'submitted' && (desk.agencyMode ? a.source === 'agency' : a.source !== 'agency'));
      case 'ceo':
        return applications.filter(a => a.pipeline?.status === 'processing');
      default:
        return [];
    }
  }, [applications, desk, user?.id]);

  const rows = useCases(scoped);

  const caseList = useMemo(() => {
    const source = onlyOverdue ? rows.filter(r => r.kind === 'overdue').map(r => r.app) : null;
    const list = source ?? (desk.kind === 'sales' ? scoped : rows.map(r => r.app));
    if (!term) return list.slice(0, 60);
    return list.filter(a =>
      (a.name ?? '').toLowerCase().includes(term) ||
      getUniversityName(a.university).toLowerCase().includes(term) ||
      (a.studentEmail ?? '').toLowerCase().includes(term)
    ).slice(0, 60);
  }, [desk.kind, scoped, rows, term, onlyOverdue]);

  const leadList = useMemo(() => {
    const list = [...leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (!term) return list.slice(0, 60);
    return list.filter(l =>
      l.name.toLowerCase().includes(term) ||
      l.country.toLowerCase().includes(term) ||
      l.universityInterested.toLowerCase().includes(term)
    ).slice(0, 60);
  }, [leads, term]);

  const stageOf = (appId: string) => rows.find(r => r.app.id === appId);

  const title = desk.kind === 'advisor' ? 'My cases'
    : desk.kind === 'sales' ? (desk.agencyMode ? 'Agency pipeline' : 'Sales pipeline')
    : desk.kind === 'ceo' ? 'All active cases'
    : 'The lead book';

  return (
    <TeamLayout>
      <div style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}>
        <p className="text-[11px] tracking-[2px] uppercase font-semibold" style={{ color: GOLD }}>{desk.listLabel}</p>
        <h1 className="v3-serif text-[28px] font-black leading-tight" style={{ color: '#fff' }}>{title}</h1>
      </div>

      <div
        className="flex items-center gap-2.5 mt-4 px-4 rounded-2xl"
        style={{ ...card, height: 46 }}
      >
        <Search className="w-4 h-4 shrink-0" style={{ color: dim(0.45) }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or university"
          className="flex-1 bg-transparent outline-none text-[14px]"
          style={{ color: '#fff' }}
        />
      </div>

      {desk.kind === 'support' ? (
        <>
          <SectionLabel right={`${leadList.length}`}>Leads</SectionLabel>
          {leadList.length === 0 ? (
            <Empty icon={UsersIcon} title="No leads" sub="Nothing matches that search." />
          ) : leadList.map(l => (
            <Row key={l.id}>
              <div className="flex items-center gap-3">
                <Square>{initialsOf(l.name)}</Square>
                <div className="flex-1 min-w-0">
                  <p className="text-[14.5px] font-bold truncate" style={{ color: '#fff' }}>{l.name}</p>
                  <p className="text-[12px] truncate mt-0.5" style={{ color: dim(0.55) }}>
                    {[l.country, l.universityInterested].filter(Boolean).join(' · ') || 'No details'}
                  </p>
                </div>
                <Tag tone={l.status === 'new' ? 'gold' : l.status === 'lost' ? 'red' : 'plain'}>{l.status}</Tag>
              </div>
            </Row>
          ))}
        </>
      ) : (
        <>
          <SectionLabel right={`${caseList.length}`}>
            {onlyOverdue ? 'Past deadline' : desk.kind === 'sales' ? 'Applications' : 'Cases'}
          </SectionLabel>
          {caseList.length === 0 ? (
            <Empty icon={UsersIcon} title="Nothing here" sub="Nothing matches that search." />
          ) : caseList.map(a => {
            const row = stageOf(a.id);
            return (
              <Row key={a.id} tone={row?.kind === 'overdue' ? 'red' : 'plain'} onClick={() => navigate(`/app/case/${a.id}`)}>
                <div className="flex items-center gap-3">
                  <Square tone={row?.kind === 'overdue' ? 'red' : 'plain'}>{initialsOf(a.name)}</Square>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14.5px] font-bold truncate" style={{ color: '#fff' }}>{a.name}</p>
                    <p className="text-[12px] truncate mt-0.5" style={{ color: dim(0.55) }}>
                      {getUniversityName(a.university) || 'University not set'}
                    </p>
                  </div>
                  {row
                    ? <Tag tone={row.kind === 'overdue' ? 'red' : row.kind === 'due' ? 'gold' : 'plain'}>
                        {row.kind === 'overdue' && row.msLeft !== null ? `${fmtLeft(row.msLeft)} over`
                          : row.kind === 'due' && row.msLeft !== null ? fmtLeft(row.msLeft)
                          : row.kind === 'payment' ? 'On payment'
                          : row.kind === 'permission' ? 'Awaiting' : '—'}
                      </Tag>
                    : <Tag tone={a.hold ? 'red' : 'plain'}>{a.hold ? 'On hold' : a.stage ?? 'New'}</Tag>}
                </div>
                {row && (
                  <p className="text-[11.5px] font-semibold mt-2.5" style={{ color: dim(0.5) }}>
                    Stage {row.stageNo} of {TOTAL_STAGES} · {row.label}
                  </p>
                )}
              </Row>
            );
          })}
        </>
      )}

      <a
        href="https://theway.ge/login"
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 mt-4 py-3.5 rounded-2xl text-[12px] font-black uppercase tracking-wider"
        style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${goldA(0.14)}`, color: dim(0.6) }}
      >
        <ExternalLink className="w-4 h-4" /> Open the full portal
      </a>
    </TeamLayout>
  );
};

export default TeamQueue;
