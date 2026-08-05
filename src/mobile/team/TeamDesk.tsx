import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TeamLayout from './TeamLayout';
import AdvisorDesk from './AdvisorDesk';
import SalesDesk from './SalesDesk';
import CeoDesk from './CeoDesk';
import SupportDesk from './SupportDesk';
import AgencyDesk from './AgencyDesk';
import { deskOf } from './roles';

/** Routes the signed-in role to its desk. Students belong in the student app. */
const TeamDesk: React.FC = () => {
  const { user } = useAuth();
  const desk = deskOf(user?.role);

  if (user?.role === 'student') return <Navigate to="/app/home" replace />;

  return (
    <TeamLayout>
      {desk.kind === 'advisor' && <AdvisorDesk agencyMode={desk.agencyMode} />}
      {desk.kind === 'sales' && <SalesDesk agencyMode={desk.agencyMode} />}
      {desk.kind === 'ceo' && <CeoDesk />}
      {desk.kind === 'support' && <SupportDesk />}
      {desk.kind === 'agency' && <AgencyDesk />}
      {desk.kind === 'none' && (
        <p className="text-center text-sm mt-10" style={{ color: 'rgba(245,240,232,0.6)' }}>
          No desk is configured for this account.
        </p>
      )}
    </TeamLayout>
  );
};

export default TeamDesk;
