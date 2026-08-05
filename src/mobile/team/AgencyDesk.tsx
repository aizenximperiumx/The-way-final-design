import React, { useMemo } from 'react';
import { ExternalLink, Upload, Inbox } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../store/appStore';
import { getUniversityName } from '../../lib/universities';
import { GOLD, NAVY, dim, goldA, goldCard } from '../ui';
import { DeskHeader, Stats, SectionLabel, Row, Square, Tag, Empty, initialsOf } from './parts';

/**
 * Agency desk.
 *
 * Submitting a student means filling an intake form and attaching passports,
 * certificates and video — work that belongs on a real keyboard. So the phone
 * shows an agency where their students stand and what is being asked of them,
 * and sends them to the portal for anything that involves uploading.
 */
const AgencyDesk: React.FC = () => {
  const { user } = useAuth();
  const applications = useAppStore(s => s.applications);
  const documentRequests = useAppStore(s => s.documentRequests);

  const mine = useMemo(
    () => applications.filter(a => a.agencyId === user?.id),
    [applications, user?.id],
  );

  const approved = mine.filter(a => a.status === 'approved').length;
  const pending = mine.filter(a => a.status === 'submitted').length;
  const enrolled = mine.filter(a => a.stage === 'enrolled').length;

  // Anything an advisor has asked this agency for and not yet received.
  const asked = useMemo(() => documentRequests.filter(r =>
    r.target === 'agency' && r.agencyId === user?.id && r.status === 'pending'
  ), [documentRequests, user?.id]);

  const nameOf = (studentId: string) =>
    mine.find(a => a.studentId === studentId)?.name ?? 'Student';

  return (
    <>
      <DeskHeader
        eyebrow={`Agency · ${mine.length} student${mine.length === 1 ? '' : 's'}`}
        sub={asked.length > 0 ? `${asked.length} document${asked.length === 1 ? '' : 's'} requested` : 'Nothing outstanding'}
      />

      <Stats items={[
        { n: pending, k: 'Pending' },
        { n: approved, k: 'Approved' },
        { n: enrolled, k: 'Enrolled' },
      ]} />

      {asked.length > 0 && (
        <>
          <SectionLabel right={String(asked.length)}>Requested from you</SectionLabel>
          {asked.slice(0, 6).map(r => (
            <Row key={r.id} tone="gold">
              <div className="flex items-center gap-3">
                <Square tone="gold"><Upload className="w-5 h-5" /></Square>
                <div className="flex-1 min-w-0">
                  <p className="text-[14.5px] font-bold truncate" style={{ color: '#fff' }}>{r.title}</p>
                  <p className="text-[12px] mt-0.5 truncate" style={{ color: dim(0.55) }}>
                    {nameOf(r.studentId)} · asked by {r.requestedByName}
                  </p>
                </div>
              </div>
            </Row>
          ))}
        </>
      )}

      <SectionLabel right={mine.length ? `${Math.min(mine.length, 8)} of ${mine.length}` : undefined}>
        Your students
      </SectionLabel>
      {mine.length === 0 ? (
        <Empty icon={Inbox} title="No students yet" sub="Students you submit appear here." />
      ) : (
        mine.slice(0, 8).map(a => (
          <Row key={a.id}>
            <div className="flex items-center gap-3">
              <Square tone={a.stage === 'enrolled' ? 'green' : a.status === 'submitted' ? 'gold' : 'plain'}>
                {initialsOf(a.name)}
              </Square>
              <div className="flex-1 min-w-0">
                <p className="text-[14.5px] font-bold truncate" style={{ color: '#fff' }}>{a.name}</p>
                <p className="text-[12px] truncate mt-0.5" style={{ color: dim(0.55) }}>
                  {getUniversityName(a.university) || 'University not set'}
                </p>
              </div>
              <Tag tone={a.stage === 'enrolled' ? 'green' : a.status === 'submitted' ? 'gold' : 'plain'}>
                {a.stage === 'enrolled' ? 'Enrolled' : a.status === 'submitted' ? 'Pending' : 'Active'}
              </Tag>
            </div>
          </Row>
        ))
      )}

      <div className="rounded-3xl p-5 mt-6 relative overflow-hidden" style={goldCard}>
        <div className="absolute -right-6 -top-8 w-36 h-36 rounded-full" style={{ background: goldA(0.12), filter: 'blur(28px)' }} />
        <p className="v3-serif text-[19px] font-black relative" style={{ color: '#fff' }}>
          Submitting a student?
        </p>
        <p className="text-[13px] mt-1.5 relative" style={{ color: dim(0.65) }}>
          Intake forms and document uploads are easier on a computer — passports and
          certificates need to be readable.
        </p>
        <a
          href="https://theway.ge/agencies"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-black uppercase tracking-wider relative"
          style={{ background: GOLD, color: NAVY }}
        >
          <ExternalLink className="w-4 h-4" /> Open the portal
        </a>
      </div>
    </>
  );
};

export default AgencyDesk;
