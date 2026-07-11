// ─────────────────────────────────────────────────────────────────────────────
// University catalog — single source of truth for university names (English),
// faculties, programs, tuition, registration timelines, SLA speed groups and
// default staff auto-assignment. The CEO can override staff assignment and SLA
// groups at runtime via the shared universityConfig (see appStore).
// ─────────────────────────────────────────────────────────────────────────────

export type ProgramLevel = 'bachelor' | 'master';

export interface UniversityProgram {
  name: string;
  level: ProgramLevel;
  years: number;
  /** Display price, e.g. "$6,000/year" or "€21,800 total" */
  price: string;
  totalPrice?: string;
}

export interface TimelineStep {
  step: string;
  duration: string;
}

/**
 * SLA speed group for the "University Initial Approval" performance timer:
 *  fast   → <36h +2 | 36–72h +1 | >72h  −2
 *  medium → <72h +2 | 72–96h +1 | >96h  −1
 *  slow   → <240h +2 | 240–280h +1 | >280h −2
 *  none   → no approval timer for this university
 */
export type UniversitySlaGroup = 'fast' | 'medium' | 'slow' | 'none';

export interface University {
  id: string;
  name: string;
  shortName?: string;
  faculties: string[];
  programs: UniversityProgram[];
  registrationTimeline: TimelineStep[];
  slaGroup: UniversitySlaGroup;
  /** Username of the staff member auto-assigned for this university (default; CEO-configurable). */
  defaultStaffUsername?: string;
}

export const UNIVERSITIES: University[] = [
  {
    id: 'georgian-american-university',
    name: 'Georgian American University',
    shortName: 'GAU',
    faculties: ['Medicine', 'Informatics & Engineering', 'Business Administration', 'Law'],
    programs: [
      { name: 'Medicine', level: 'bachelor', years: 6, price: '$6,000/year' },
      { name: 'Computer Science', level: 'bachelor', years: 3, price: '$4,200/year' },
      { name: 'Business Administration', level: 'bachelor', years: 3, price: '$4,500/year' },
      { name: 'IT Governance & Strategy', level: 'bachelor', years: 2, price: '$4,200/year' },
      { name: 'IT Management', level: 'bachelor', years: 3, price: '$4,200/year' },
      { name: 'IT Governance & Strategy', level: 'master', years: 2, price: '$4,200/year' },
      { name: "Double Degree Master's", level: 'master', years: 2, price: '€21,800 total', totalPrice: '€21,800' },
      { name: 'MBA', level: 'master', years: 2, price: '$4,000/year' },
      { name: 'Executive MBA', level: 'master', years: 1, price: '$4,500/year' },
      { name: 'Cyber & Information Security', level: 'master', years: 2, price: '$4,200/year' },
    ],
    registrationTimeline: [
      { step: 'Translate and notarize documents', duration: 'Within 48 hours of signing the contract' },
      { step: 'Offer & Acceptance Letter (student has B2 English)', duration: '2–3 working days' },
      { step: 'Offer & Acceptance Letter (no B2 English)', duration: '4 working days' },
      { step: 'Ministry Acceptance', duration: '10 working days' },
      { step: 'Ministry Order', duration: '5 working days' },
      { step: 'Invoice (only if a visa is required)', duration: '5 working days after university payment' },
    ],
    slaGroup: 'fast',
    defaultStaffUsername: 'mariami',
  },
  {
    id: 'caucasus-international-university',
    name: 'Caucasus International University',
    shortName: 'CIU',
    faculties: ['Medicine', 'Dentistry', 'Pharmacy', 'Business', 'Law'],
    programs: [],
    registrationTimeline: [],
    slaGroup: 'fast',
    defaultStaffUsername: 'mariami',
  },
  {
    id: 'georgian-aviation-university',
    name: 'Georgian Aviation University',
    shortName: 'GAU (Aviation)',
    faculties: ['Flight Exploitation', 'Aircraft Maintenance', 'Aviation Engineering'],
    programs: [
      { name: 'Aircraft Flight Exploitation', level: 'bachelor', years: 3, price: '$19,000/year', totalPrice: '$57,000' },
      { name: 'Aircraft Maintenance (B2)', level: 'bachelor', years: 2, price: '$4,000/year', totalPrice: '$8,000' },
      { name: 'Single Engine Aircraft Flight Exploitation (CPL(A)-SEP)', level: 'bachelor', years: 2, price: 'Price on request' },
      { name: 'Multi Engine Aircraft Flight Exploitation (CPL(A)-SEP)', level: 'bachelor', years: 2, price: '$57,000 total', totalPrice: '$57,000' },
    ],
    registrationTimeline: [
      { step: 'Translate and notarize documents', duration: 'Within 48 hours' },
      { step: 'Offer Letter', duration: '1 working day' },
      { step: 'Initial Acceptance Letter', duration: '1 working day' },
      { step: 'Recognition completed', duration: '5 working days' },
      { step: 'Ministry Acceptance', duration: '10 working days' },
      { step: 'Ministry Order', duration: '5 working days' },
      { step: 'Invoice (if a student visa is required)', duration: '5 working days after university payment' },
    ],
    slaGroup: 'fast',
    defaultStaffUsername: 'mariami',
  },
  {
    id: 'alte-university',
    name: 'Alte University',
    shortName: 'ALTE',
    faculties: ['Business', 'Law', 'Information Technology', 'Humanities'],
    programs: [],
    registrationTimeline: [],
    slaGroup: 'fast',
    defaultStaffUsername: 'mariami',
  },
  {
    id: 'university-of-georgia',
    name: 'University of Georgia',
    shortName: 'UG',
    faculties: ['Medicine', 'Dentistry', 'Business & Economics', 'Informatics & Engineering', 'Law'],
    programs: [],
    registrationTimeline: [],
    slaGroup: 'fast',
    defaultStaffUsername: 'khatia',
  },
  {
    id: 'tbilisi-state-medical-university',
    name: 'Tbilisi State Medical University',
    shortName: 'TSMU',
    faculties: ['Medicine', 'Dentistry', 'Pharmacy', 'Public Health', 'Physical Medicine & Rehabilitation'],
    programs: [],
    registrationTimeline: [],
    slaGroup: 'medium',
    defaultStaffUsername: 'khatia',
  },
  {
    id: 'caucasus-university',
    name: 'Caucasus University',
    shortName: 'CU',
    faculties: ['Medicine', 'Business', 'Law', 'Technology', 'Media'],
    programs: [],
    registrationTimeline: [],
    slaGroup: 'medium',
    defaultStaffUsername: 'khatia',
  },
  {
    id: 'georgian-technical-university',
    name: 'Georgian Technical University',
    shortName: 'GTU',
    faculties: ['Civil Engineering', 'Informatics & Control Systems', 'Architecture', 'Chemical Technology', 'Transportation'],
    programs: [],
    registrationTimeline: [],
    slaGroup: 'medium',
    defaultStaffUsername: 'khatia',
  },
  {
    id: 'georgian-national-university-seu',
    name: 'Georgian National University SEU',
    shortName: 'SEU',
    faculties: ['Medicine', 'Dentistry', 'Business', 'Law', 'Social Sciences'],
    programs: [],
    registrationTimeline: [],
    slaGroup: 'slow',
    defaultStaffUsername: 'khatia',
  },
  {
    id: 'international-black-sea-university',
    name: 'International Black Sea University',
    shortName: 'IBSU',
    faculties: ['Medicine', 'Business', 'Computer Science', 'Education', 'Social Sciences'],
    programs: [],
    registrationTimeline: [],
    slaGroup: 'slow',
    defaultStaffUsername: 'khatia',
  },
  {
    id: 'ilia-state-university',
    name: 'Ilia State University',
    shortName: 'ISU',
    faculties: ['Medicine', 'Natural Sciences', 'Business & Technology', 'Arts & Sciences'],
    programs: [],
    registrationTimeline: [],
    slaGroup: 'slow',
    defaultStaffUsername: 'khatia',
  },
  {
    id: 'tbilisi-state-university',
    name: 'Ivane Javakhishvili Tbilisi State University',
    shortName: 'TSU',
    faculties: ['Medicine', 'Law', 'Economics & Business', 'Humanities', 'Exact & Natural Sciences'],
    programs: [],
    registrationTimeline: [
      { step: 'Translate and notarize documents', duration: 'Within 72 hours' },
      { step: 'Initial Acceptance Letter', duration: '10 working days' },
      { step: 'Ministry Acceptance', duration: '7 working days' },
      { step: 'Ministry Order', duration: '5 working days' },
      { step: 'Invoice (if a visa is required)', duration: '5 working days after university payment' },
    ],
    slaGroup: 'slow',
    defaultStaffUsername: 'khatia',
  },
  {
    id: 'new-vision-university',
    name: 'New Vision University',
    shortName: 'NVU',
    faculties: ['Medicine', 'Dentistry', 'Law', 'Business'],
    programs: [],
    registrationTimeline: [],
    slaGroup: 'none',
    // Intentionally unassigned until configured (PRD).
    defaultStaffUsername: undefined,
  },
  // Legacy entries kept so existing application records keep resolving to a name.
  {
    id: 'tbilisi-open-university',
    name: 'Tbilisi Open University',
    faculties: [],
    programs: [],
    registrationTimeline: [],
    slaGroup: 'none',
  },
  {
    id: 'geomedi',
    name: 'Teaching University Geomedi',
    faculties: ['Medicine', 'Stomatology', 'Healthcare Economics'],
    programs: [],
    registrationTimeline: [],
    slaGroup: 'none',
  },
  {
    id: 'san-diego-state-university',
    name: 'San Diego State University',
    faculties: [],
    programs: [],
    registrationTimeline: [],
    slaGroup: 'none',
  },
  {
    id: 'grigol-robakidze-university',
    name: 'Grigol Robakidze University',
    faculties: ['Medicine', 'Dentistry', 'Law', 'Business'],
    programs: [],
    registrationTimeline: [],
    slaGroup: 'none',
  },
];

export type UniversityOption = { id: string; name: string };

/** Options for pickers — active universities first, legacy last (unchanged shape for existing UI). */
export const UNIVERSITY_OPTIONS: UniversityOption[] = UNIVERSITIES.map(u => ({ id: u.id, name: u.name }));

export function getUniversity(id?: string): University | undefined {
  if (!id) return undefined;
  return UNIVERSITIES.find(u => u.id === id);
}

export function getUniversityName(id?: string): string {
  if (!id) return '';
  return getUniversity(id)?.name ?? id;
}

export function getUniversityShortName(id?: string): string {
  if (!id) return '';
  const u = getUniversity(id);
  return u?.shortName ?? u?.name ?? id;
}

/** Default university → staff-username auto-assignment map (CEO-configurable at runtime). */
export const DEFAULT_STAFF_ASSIGNMENTS: Record<string, string> = Object.fromEntries(
  UNIVERSITIES.filter(u => u.defaultStaffUsername).map(u => [u.id, u.defaultStaffUsername as string])
);

/** Default university → SLA group map (CEO-configurable at runtime). */
export const DEFAULT_SLA_GROUPS: Record<string, UniversitySlaGroup> = Object.fromEntries(
  UNIVERSITIES.map(u => [u.id, u.slaGroup])
);
