import React from 'react';
import StaffDashboard from './StaffDashboard';

/**
 * Dedicated Agency Staff workspace (route: /agency-staff).
 *
 * It currently presents the shared student-operations view (StaffDashboard,
 * which already adapts its actions for the agency_staff role). This is now its
 * own file so you can add Agency-Staff-only sections/widgets here WITHOUT
 * affecting the Staff page — drop new components above or below <StaffDashboard />.
 */
const AgencyStaffDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 👉 Add Agency-Staff-specific sections here (they won't touch the Staff page) */}
      <StaffDashboard />
    </div>
  );
};

export default AgencyStaffDashboard;
