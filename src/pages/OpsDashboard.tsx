import React from 'react';
import SalesDashboard from './SalesDashboard';

/**
 * Dedicated Operations workspace (route: /ops).
 *
 * It currently presents the shared agency-leads pipeline (SalesDashboard
 * automatically switches to "ops mode" on the /ops route). This is now its own
 * file so you can add Ops-only sections/widgets here WITHOUT affecting the Sales
 * page — drop new components above or below <SalesDashboard /> below.
 */
const OpsDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 👉 Add Operations-specific sections here (they won't touch the Sales page) */}
      <SalesDashboard />
    </div>
  );
};

export default OpsDashboard;
