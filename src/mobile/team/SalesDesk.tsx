import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, Hand, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useAppStore, type Application } from '../../store/appStore';
import { getUniversityName } from '../../lib/universities';
import { dim } from '../ui';
import {
  DeskHeader, Stats, SectionLabel, Chips, Row, Square, Tag, Actions, Empty, initialsOf,
} from './parts';

/**
 * Sales desk — the mobile face of the portal's lead pipeline. Ops gets the
 * same desk in agency mode: identical queues, agency-sourced applications.
 * The portal's quick filters become chips, and claiming is a single tap.
 */

const calcAge = (dob?: string): number | null => {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
};

/** Same completeness test the portal uses for the "missing docs" queue. */
const missingDocs = (a: Application): boolean => {
  const age = calcAge(a.dob);
  const underage = age != null && age < 18;
  const hsOk = Boolean(a.intakeHighSchoolCertificate || a.intakeHighSchoolMissingNote);
  return (
    !a.studentEmail ||
    (!a.university && !a.intakeDetails?.includes('Aviation')) ||
    !a.dob ||
    !a.intakeVideoUrl ||
    !a.intakePassportCopy ||
    !hsOk ||
    (underage && (!a.intakeBirthCertificate || !a.intakeMotherPassport || !a.intakeFatherPassport)) ||
    !((a.intakeAttachments?.length ?? 0) > 0)
  );
};

const ownerOf = (a: Application) => ((a.ownerId ?? a.salesOwnerId) ?? '').trim();

const SalesDesk: React.FC<{ agencyMode: boolean }> = ({ agencyMode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const applications = useAppStore(s => s.applications);
  const salesClaimLead = useAppStore(s => s.salesClaimLead);
  const [filter, setFilter] = useState('unclaimed');

  const pool = useMemo(() => applications.filter(a =>
    a.status === 'submitted' && (agencyMode ? a.source === 'agency' : a.source !== 'agency')
  ), [applications, agencyMode]);

  const startOfToday = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }, []);

  const counts = useMemo(() => ({
    unclaimed: pool.filter(a => !ownerOf(a)).length,
    today: pool.filter(a => new Date(a.createdAt).getTime() >= startOfToday).length,
    needs_info: pool.filter(a => Boolean(a.hold)).length,
    missing_docs: pool.filter(missingDocs).length,
    missing_email: pool.filter(a => !a.studentEmail).length,
    missing_intake: pool.filter(a => !a.intakeDetails).length,
    mine: pool.filter(a => ownerOf(a) === user?.id).length,
    all: pool.length,
  }), [pool, startOfToday, user?.id]);

  const shown = useMemo(() => pool.filter(a => {
    switch (filter) {
      case 'unclaimed': return !ownerOf(a);
      case 'today': return new Date(a.createdAt).getTime() >= startOfToday;
      case 'needs_info': return Boolean(a.hold);
      case 'missing_docs': return missingDocs(a);
      case 'missing_email': return !a.studentEmail;
      case 'missing_intake': return !a.intakeDetails;
      case 'mine': return ownerOf(a) === user?.id;
      default: return true;
    }
  }).slice(0, 12), [pool, filter, startOfToday, user?.id]);

  const claim = (a: Application) => {
    try {
      salesClaimLead(a.id);
      toast.success(`Claimed ${a.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not claim');
    }
  };

  const flagOf = (a: Application) => {
    if (a.hold) return { label: 'On hold', tone: 'red' as const };
    if (!a.studentEmail) return { label: 'No email', tone: 'red' as const };
    if (!a.intakeDetails) return { label: 'No intake', tone: 'red' as const };
    if (missingDocs(a)) return { label: 'Docs', tone: 'red' as const };
    return { label: 'Ready', tone: 'green' as const };
  };

  return (
    <>
      <DeskHeader
        eyebrow={`${agencyMode ? 'Operations · agency' : 'Sales · public'} leads`}
        sub={`${counts.unclaimed} unclaimed · ${counts.mine} yours`}
      />

      <Stats items={[
        { n: counts.unclaimed, k: 'Unclaimed' },
        { n: counts.mine, k: 'Mine' },
        { n: counts.needs_info, k: 'On hold' },
      ]} />

      <Chips
        value={filter}
        onChange={setFilter}
        items={[
          { id: 'unclaimed', label: 'Unclaimed', count: counts.unclaimed },
          { id: 'mine', label: 'Mine', count: counts.mine },
          { id: 'today', label: 'Today', count: counts.today },
          { id: 'needs_info', label: 'Needs info', count: counts.needs_info },
          { id: 'missing_docs', label: 'Missing docs', count: counts.missing_docs },
          { id: 'missing_email', label: 'No email', count: counts.missing_email },
          { id: 'missing_intake', label: 'No intake', count: counts.missing_intake },
          { id: 'all', label: 'All', count: counts.all },
        ]}
      />

      <SectionLabel right={shown.length ? `${shown.length}` : undefined}>
        {filter === 'unclaimed' ? 'First to claim' : filter === 'mine' ? 'My leads' : 'Results'}
      </SectionLabel>

      {shown.length === 0 ? (
        <Empty icon={Inbox} title="Nothing here" sub="No applications match this filter right now." />
      ) : (
        shown.map(a => {
          const unclaimed = !ownerOf(a);
          const flag = flagOf(a);
          return (
            <Row key={a.id} tone={unclaimed ? 'gold' : flag.tone === 'red' ? 'red' : 'plain'}>
              <div className="flex items-center gap-3">
                <Square tone={unclaimed ? 'gold' : flag.tone === 'red' ? 'red' : 'plain'}>
                  {initialsOf(a.name)}
                </Square>
                <div className="flex-1 min-w-0">
                  <p className="text-[14.5px] font-bold truncate" style={{ color: '#fff' }}>{a.name}</p>
                  <p className="text-[12px] truncate mt-0.5" style={{ color: dim(0.55) }}>
                    {getUniversityName(a.university) || a.intakeDetails?.slice(0, 40) || 'No university yet'}
                  </p>
                </div>
                <Tag tone={flag.tone}>{flag.label}</Tag>
              </div>
              <Actions items={unclaimed
                ? [
                    { label: <><Hand className="w-3.5 h-3.5" /> Claim</>, onClick: () => claim(a) },
                    { label: 'View', ghost: true, onClick: () => navigate(`/app/case/${a.id}`) },
                  ]
                : [
                    { label: <><FileText className="w-3.5 h-3.5" /> Open</>, onClick: () => navigate(`/app/case/${a.id}`) },
                  ]}
              />
            </Row>
          );
        })
      )}
    </>
  );
};

export default SalesDesk;
