import type { UserRole } from '../../store/appStore';

/**
 * Which desk a signed-in role gets on mobile.
 *
 * The portal has eight roles but only four distinct jobs: /ops is the sales
 * workspace in agency mode and /agency-staff is the advisor workspace in
 * agency mode, so those pairs share a desk and differ only by which
 * applications they see.
 */
export type DeskKind = 'advisor' | 'sales' | 'ceo' | 'support' | 'agency' | 'none';

export interface Desk {
  kind: DeskKind;
  /** Label for the first tab. */
  homeLabel: string;
  /** Label + icon family for the second tab. */
  listLabel: string;
  listKind: 'cases' | 'queue' | 'analytics' | 'leads';
  /** Agency-sourced applications instead of public ones. */
  agencyMode: boolean;
}

const DESKS: Record<DeskKind, Desk> = {
  advisor: { kind: 'advisor', homeLabel: 'My day', listLabel: 'Cases', listKind: 'cases', agencyMode: false },
  sales:   { kind: 'sales',   homeLabel: 'Queue',  listLabel: 'Pipeline', listKind: 'queue', agencyMode: false },
  ceo:     { kind: 'ceo',     homeLabel: 'Overview', listLabel: 'Analytics', listKind: 'analytics', agencyMode: false },
  support: { kind: 'support', homeLabel: 'Leads',  listLabel: 'Team', listKind: 'leads', agencyMode: false },
  // Partner agencies submit students and upload paperwork — desktop work. They
  // get a signpost rather than the student app they would otherwise land in.
  agency:  { kind: 'agency',  homeLabel: 'Agency', listLabel: 'Students', listKind: 'cases', agencyMode: true },
  none:    { kind: 'none',    homeLabel: 'Home',   listLabel: 'List', listKind: 'cases', agencyMode: false },
};

export const deskOf = (role?: UserRole | string): Desk => {
  switch (role) {
    case 'staff':            return DESKS.advisor;
    case 'agency_staff':     return { ...DESKS.advisor, agencyMode: true };
    case 'sales':            return DESKS.sales;
    case 'ops':              return { ...DESKS.sales, agencyMode: true };
    case 'ceo':              return DESKS.ceo;
    case 'customer_support': return DESKS.support;
    case 'agency':           return DESKS.agency;
    default:                 return DESKS.none;
  }
};

/** Roles that get the team app rather than the student app. */
export const isTeamRole = (role?: UserRole | string): boolean =>
  deskOf(role).kind !== 'none' && role !== 'student';
