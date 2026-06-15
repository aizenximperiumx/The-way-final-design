import type { Lead, LeadStatus } from '../store/appStore';

export const STATUS_ORDER: LeadStatus[] = ['new', 'contacted', 'qualified', 'won', 'lost'];

export const statusMeta: Record<LeadStatus, { label: string; cls: string; dot: string }> = {
  new:       { label: 'New',       cls: 'bg-gray-100 text-gray-600 border-gray-200',   dot: 'bg-gray-400' },
  contacted: { label: 'Contacted', cls: 'bg-blue-50 text-blue-700 border-blue-200',    dot: 'bg-blue-500' },
  qualified: { label: 'Qualified', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  won:       { label: 'Won',       cls: 'bg-green-50 text-green-700 border-green-200',  dot: 'bg-green-500' },
  lost:      { label: 'Lost',      cls: 'bg-red-50 text-red-600 border-red-200',        dot: 'bg-red-500' },
};

export const leadStatusOf = (l: Lead): LeadStatus => l.status ?? 'new';

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// A lead is "due" if its follow-up date is today/overdue and it's still open.
export const isLeadDue = (l: Lead) =>
  !!l.followUpDate && l.followUpDate <= todayStr() && l.status !== 'won' && l.status !== 'lost';
