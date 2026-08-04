import React, { useMemo, useState } from 'react';
import { Phone, Mail, Inbox } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore, type Lead, type LeadStatus } from '../../store/appStore';
import { dim } from '../ui';
import {
  DeskHeader, Stats, SectionLabel, Chips, Row, Square, Tag, Actions, Empty, initialsOf,
} from './parts';

/**
 * Support desk — the lead book. Mine and the team's, filtered by status, with
 * the two actions that matter on a phone: call, and move the lead forward.
 */

const STATUS_TONE: Record<LeadStatus, 'gold' | 'green' | 'plain' | 'red'> = {
  new: 'gold',
  contacted: 'plain',
  qualified: 'green',
  won: 'green',
  lost: 'red',
};

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'New', contacted: 'Contacted', qualified: 'Qualified', won: 'Won', lost: 'Lost',
};

const NEXT: Partial<Record<LeadStatus, LeadStatus>> = {
  new: 'contacted',
  contacted: 'qualified',
  qualified: 'won',
};

const SupportDesk: React.FC = () => {
  const { user } = useAuth();
  const leads = useAppStore(s => s.leads);
  const updateLead = useAppStore(s => s.updateLead);
  const [filter, setFilter] = useState('mine');

  const mine = useMemo(() => leads.filter(l => l.ownerId === user?.id), [leads, user?.id]);

  const counts = useMemo(() => ({
    mine: mine.length,
    team: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
  }), [leads, mine]);

  const shown = useMemo(() => {
    const base = filter === 'mine' ? mine : leads;
    const byStatus = ['new', 'contacted', 'qualified'].includes(filter)
      ? leads.filter(l => l.status === filter)
      : base;
    return [...byStatus].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 15);
  }, [leads, mine, filter]);

  const advance = (l: Lead) => {
    const next = NEXT[l.status];
    if (next) updateLead(l.id, { status: next });
  };

  return (
    <>
      <DeskHeader eyebrow="Customer support" sub={`${counts.mine} yours · ${counts.team} in the team`} />

      <Stats items={[
        { n: counts.mine, k: 'My leads' },
        { n: counts.team, k: 'Team' },
        { n: counts.qualified, k: 'Qualified' },
      ]} />

      <Chips
        value={filter}
        onChange={setFilter}
        items={[
          { id: 'mine', label: 'Mine', count: counts.mine },
          { id: 'team', label: 'Team', count: counts.team },
          { id: 'new', label: 'New', count: counts.new },
          { id: 'contacted', label: 'Contacted', count: counts.contacted },
          { id: 'qualified', label: 'Qualified', count: counts.qualified },
        ]}
      />

      <SectionLabel right={shown.length ? 'Newest first' : undefined}>
        {filter === 'mine' ? 'My leads' : filter === 'team' ? 'Team leads' : STATUS_LABEL[filter as LeadStatus]}
      </SectionLabel>

      {shown.length === 0 ? (
        <Empty icon={Inbox} title="No leads here" sub="New enquiries appear as they come in." />
      ) : (
        shown.map(l => {
          const tone = STATUS_TONE[l.status];
          const next = NEXT[l.status];
          return (
            <Row key={l.id} tone={tone === 'gold' ? 'gold' : tone === 'red' ? 'red' : 'plain'}>
              <div className="flex items-center gap-3">
                <Square tone={tone}>{initialsOf(l.name)}</Square>
                <div className="flex-1 min-w-0">
                  <p className="text-[14.5px] font-bold truncate" style={{ color: '#fff' }}>{l.name}</p>
                  <p className="text-[12px] truncate mt-0.5" style={{ color: dim(0.55) }}>
                    {[l.country, l.universityInterested].filter(Boolean).join(' · ') || 'No details yet'}
                  </p>
                </div>
                <Tag tone={tone}>{STATUS_LABEL[l.status]}</Tag>
              </div>
              <Actions items={[
                ...(l.phone ? [{
                  label: <><Phone className="w-3.5 h-3.5" /> Call</>,
                  onClick: () => { window.location.href = `tel:${l.phone}`; },
                }] : []),
                ...(l.email ? [{
                  label: <><Mail className="w-3.5 h-3.5" /> Email</>,
                  ghost: true,
                  onClick: () => { window.location.href = `mailto:${l.email}`; },
                }] : []),
                ...(next ? [{
                  label: `Mark ${STATUS_LABEL[next].toLowerCase()}`,
                  ghost: Boolean(l.phone),
                  onClick: () => advance(l),
                }] : []),
              ]} />
            </Row>
          );
        })
      )}
    </>
  );
};

export default SupportDesk;
