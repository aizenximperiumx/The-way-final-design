import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { sendMail } from '../lib/mailer';
import { renderBrandedEmail } from '../lib/emailTemplate';
import { getUniversityName, DEFAULT_STAFF_ASSIGNMENTS, DEFAULT_SLA_GROUPS, type UniversitySlaGroup } from '../lib/universities';
import {
  PIPELINE_ORDER,
  getStageMeta,
  getSlaWindow,
  nextStageOf,
  slaPointsForCompletion,
  slaDeadline,
  slaLedgerId,
  ledgerTotals,
  legacyStageToPipeline,
  VISA_RESIDENCY_POINTS,
  type ApplicationPipeline,
  type PipelineStageId,
  type PointsEntry,
  type UniversityConfig,
} from '../lib/pipeline';
import { getSupabase, tryGetSupabase } from '../lib/supabase';

export type { ApplicationPipeline, PipelineStageId, PointsEntry, UniversityConfig } from '../lib/pipeline';


export type UserRole = 'ceo' | 'sales' | 'ops' | 'staff' | 'agency_staff' | 'student' | 'agency' | 'customer_support';

// Manually-tracked WhatsApp / direct leads owned by a sales (or customer-support)
// rep. Separate from public Applications — these are early prospects a rep is
// nurturing before a formal application exists.
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'won' | 'lost';

export interface Lead {
  id: string;
  ownerId: string;          // sales/support user who owns this lead
  ownerName: string;
  name: string;
  phone: string;
  email: string;
  country: string;
  universityInterested: string;
  notes: string;
  status: LeadStatus;
  followUpDate?: string;     // YYYY-MM-DD — drives the "follow-ups due" queue
  convertedApplicationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  twoFactorCode?: string;
  points?: number;
  staffUniversities?: string[];
  assignedUniversityId?: string;
  passportExpiry?: string;
  visaExpiry?: string;
  residenceExpiry?: string;
}

export type ApplicationStatus = 'submitted' | 'approved' | 'rejected';
export type ApplicationStage =
  | 'applied'
  | 'contacted'
  | 'accepted'
  | 'documents'
  | 'visa'
  | 'enrolled'
  | 'rejected';

export interface InternalNote {
  id: string;
  author?: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export type ApplicationEventType =
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'claimed'
  | 'needs_info'
  | 'extra_docs_added'
  | 'identity_updated'
  | 'university_set'
  | 'assigned_staff'
  | 'arrival_set'
  | 'document_uploaded'
  | 'document_verified';

export interface ApplicationEvent {
  id: string;
  type: ApplicationEventType;
  byId?: string;
  byName: string;
  time: string;
  details?: string;
}

export interface ApplicationHold {
  message: string;
  byId?: string;
  byName: string;
  time: string;
}

export interface Application {
  id: string;
  studentId?: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  dob?: string;
  program?: string;
  aviationDegree?: string;
  studyLevel?: string;
  university?: string;
  status: ApplicationStatus;
  stage: ApplicationStage;
  createdAt: string;
  internalNotes?: InternalNote[];
  events?: ApplicationEvent[];
  hold?: ApplicationHold;
  approvedBy?: string;
  approvedAt?: string;
  ownerId?: string;
  salesOwnerId?: string;
  assignedStaffId?: string;
  source?: 'public' | 'agency';
  agencyId?: string;
  contactEmail?: string;
  studentEmail?: string;
  intakeDetails?: string;
  intakeAttachments?: string[];
  intakeVideoUrl?: string;
  intakePassportCopy?: string;
  intakeHighSchoolCertificate?: string;
  intakeHighSchoolMissingNote?: string;
  intakeBirthCertificate?: string;
  intakeMotherPassport?: string;
  intakeFatherPassport?: string;
  intakeSLARewarded?: boolean;
  arrived?: boolean;
  intakeExtraDocs?: string[];
  rejectedAt?: string;
  rejectedReason?: string;
  archivedAt?: string;
  trashedAt?: string;
  trashedByName?: string;
  /** New case pipeline (Processing/Closed/Cancelled + document stages). */
  pipeline?: ApplicationPipeline;
  /** Student service rating collected after residency upload. */
  rating?: { stars: number; comment?: string; at: string };
  // Login identity for the created student account. The PASSWORD is never
  // stored — it is shown once at creation and delivered by email; agencies
  // request a reset (CEO-approved) when access is lost.
  studentCredentials?: { username: string; password?: string; updatedAt: string };
}

export interface CredentialRequest {
  id: string;
  applicationId: string;
  studentId: string;
  studentName: string;
  agencyId: string;
  agencyName: string;
  reason: string;
  status: 'pending' | 'resolved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolvedByName?: string;
  resolutionNote?: string;
}

export interface TrashedUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  trashedAt: string;
  trashedByName: string;
}

export type DocumentStatus = 'pending' | 'verified' | 'rejected';
export interface Document {
  id: string;
  studentId: string;
  title: string;
  type: string;
  status: DocumentStatus;
  uploadedAt: string;
  uploadedBy?: string;
  file?: string;
}

export type NotificationType = 'info' | 'success' | 'alert';
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  time: string;
  read: boolean;
  /** Deep link — clicking the notification opens this in-app path. */
  link?: string;
}

export type AppointmentType = 'video' | 'in-person';
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';
export interface Appointment {
  id: string;
  userId: string;
  userName?: string;
  title: string;
  type: AppointmentType;
  date: string;
  time: string;
  status: AppointmentStatus;
  createdAt: string;
}

export type AuthStatus = 'signed_out' | 'signed_in';

/**
 * A requested document. Target 'student' → the student uploads it in their
 * portal; target 'agency' → the owning agency (agent) uploads it.
 * Lifecycle: pending → uploaded → approved | rejected (rejected → re-upload
 * puts it back to pending with the reviewer's note attached).
 * Legacy status 'fulfilled' (pre-2026) is treated as 'uploaded'.
 */
export type DocumentRequestStatus = 'pending' | 'uploaded' | 'approved' | 'rejected' | 'fulfilled';

export interface DocumentRequest {
  id: string;
  studentId: string;
  applicationId?: string;
  title: string;
  description?: string;
  requestedBy: string;
  requestedByName: string;
  createdAt: string;
  status: DocumentRequestStatus;
  target?: 'student' | 'agency';
  agencyId?: string;
  fulfilledFile?: string;
  fulfilledAt?: string;
  uploadedByName?: string;
  reviewNote?: string;
  reviewedAt?: string;
  reviewedByName?: string;
  /** How many times a re-upload was requested. */
  reuploadCount?: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  toUserId: string;
  applicationId?: string;
  text: string;
  time: string;
}

export interface AppStoreState {
  users: User[];
  currentUser: User | null;
  authStatus: AuthStatus;
  applications: Application[];
  documents: Document[];
  notifications: Notification[];
  appointments: Appointment[];
  chatMessages: ChatMessage[];
  chatThreadReadAt: Record<string, string>;
  chatEmailNotify: Record<string, { firstAt: string; reminded: boolean }>;
  documentRequests: DocumentRequest[];
  leads: Lead[];
  futureLeads: Application[];
  trashedApplications: Application[];
  trashedUsers: TrashedUser[];
  credentialRequests: CredentialRequest[];
  /** Persistent staff-performance points ledger (single source of truth for points). */
  pointsLedger: PointsEntry[];
  /** CEO-editable university → staff assignment + SLA groups (null → defaults). */
  universityConfig: UniversityConfig | null;
  /** Tombstones so purged applications / restored users never resurrect on merge. */
  purgedApplicationIds: string[];
  unTrashedUserIds: string[];
  language: 'en' | 'ar';
  backendHydrated: boolean;

  setLanguage: (lang: 'en' | 'ar') => void;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<void>;
  markNotificationsRead: (ids?: string[]) => void;
  markAllNotificationsRead: () => void;
  updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  addLead: (lead: Pick<Lead, 'name' | 'phone' | 'email' | 'country' | 'universityInterested' | 'notes'> & Partial<Pick<Lead, 'status' | 'followUpDate'>>) => { duplicate: boolean };
  updateLead: (id: string, updates: Partial<Pick<Lead, 'name' | 'phone' | 'email' | 'country' | 'universityInterested' | 'notes' | 'status' | 'followUpDate'>>) => void;
  deleteLead: (id: string) => void;
  convertLeadToApplication: (id: string) => Promise<void>;
  restoreSession: () => Promise<void>;
  refreshUsersFromBackend: () => Promise<void>;
  loadBackendState: () => Promise<void>;
  saveBackendState: () => Promise<void>;
  addApplication: (application: Omit<Application, 'id'>) => Promise<void>;
  setApplicationUniversity: (applicationId: string, universityId: string) => void;
  setApplicationMeta: (
    applicationId: string,
    meta: Partial<Pick<Application, 'dob' | 'aviationDegree' | 'studyLevel' | 'program' | 'name' | 'email' | 'phone' | 'country' | 'studentEmail'>>
  ) => void;

  salesApproveApplication: (applicationId: string) => Promise<{ username: string; password: string; emailSent?: boolean; warning?: string }>;
  salesRejectApplication: (applicationId: string) => void;
  salesAddIntakeDetails: (applicationId: string, details: string, attachments: string[]) => void;
  salesSetIntakeMedia: (
    applicationId: string,
    media: {
      videoUrl?: string;
      passportCopy?: string;
      highSchoolCertificate?: string;
      highSchoolMissingNote?: string;
      birthCertificate?: string;
      motherPassport?: string;
      fatherPassport?: string;
      pdfs?: string[];
    }
  ) => void;
  salesClaimLead: (applicationId: string) => void;
  salesAddExtraDocs: (applicationId: string, files: string[]) => void;

  staffUpdateApplicationStage: (applicationId: string, stage: ApplicationStage) => void;
  staffAddInternalNote: (applicationId: string, text: string) => void;
  staffUploadDocument: (doc: Omit<Document, 'id' | 'status' | 'uploadedAt'>) => void;
  staffUpdateStudentProfile: (studentUserId: string, updates: Partial<Pick<User, 'name' | 'email' | 'phone' | 'passportExpiry' | 'visaExpiry' | 'residenceExpiry'>>) => void;
  staffVerifyDocument: (documentId: string) => void;
  assignUniversity: (studentUserId: string, universityId: string) => void;
  assignStaffAdmin: (studentUserId: string, staffUserId: string) => void;
  setArrivalStatus: (applicationId: string, arrived: boolean) => void;
  salesAssignAdmin: (studentUserId: string, staffUserId: string) => void;

  ceoCreateUser: (user: User) => Promise<User>;
  ceoUpdateUser: (userId: string, updates: Partial<User>) => void;
  ceoResetCredentials: (userId: string, updates: Partial<Pick<User, 'username' | 'password' | 'email'>>) => Promise<void>;
  ceoCreateAgencyAccount: (name: string, email: string) => Promise<User>;

  ceoTrashApplication: (applicationId: string) => void;
  ceoRestoreApplication: (applicationId: string) => void;
  ceoPurgeApplication: (applicationId: string) => void;
  ceoRestoreFutureLead: (applicationId: string) => void;
  ceoDeleteFutureLead: (applicationId: string) => void;
  ceoDisableUser: (userId: string) => Promise<void>;
  ceoRestoreUser: (userId: string) => Promise<void>;
  ceoPurgeUser: (userId: string) => Promise<void>;

  agencyRequestCredentialChange: (applicationId: string, reason: string) => void;
  ceoResolveCredentialRequest: (requestId: string) => Promise<void>;
  ceoRejectCredentialRequest: (requestId: string, note?: string) => void;

  addAppointment: (appt: Omit<Appointment, 'id'>) => void;
  addChatMessage: (toUserId: string, text: string, applicationId?: string) => void;
  markChatThreadRead: (threadKey: string) => void;
  checkChatReminders: () => void;
  requestMoreInfo: (applicationId: string, message: string) => void;
  agencyAddExtraDocs: (applicationId: string, files: string[]) => void;
  checkExpiries: () => void;
  staffRequestDocument: (studentId: string, applicationId: string | undefined, title: string, description?: string, target?: 'student' | 'agency') => void;
  studentFulfillRequest: (requestId: string, fileUrl: string) => void;
  agentFulfillRequest: (requestId: string, fileUrl: string) => void;
  reviewDocumentRequest: (requestId: string, decision: 'approved' | 'rejected' | 'reupload', note?: string) => void;

  // ── Case pipeline (Processing/Closed/Cancelled + document stages) ──
  grantStagePermission: (applicationId: string, stage: PipelineStageId) => void;
  completePipelineStage: (applicationId: string, stage: PipelineStageId) => void;
  ceoCancelApplication: (applicationId: string, reason?: string) => void;
  studentRateService: (applicationId: string, stars: number, comment?: string) => void;

  // ── Staff performance points ──
  ceoAdjustPoints: (userId: string, delta: number, reason: string) => void;
  evaluateSlaDeadlines: () => void;

  // ── University configuration (CEO) ──
  ceoSetUniversityStaff: (universityId: string, staffUsername: string | null) => void;
  ceoSetUniversitySlaGroup: (universityId: string, group: UniversitySlaGroup) => void;
}

const ensureSignedIn = (user: User | null, authStatus: AuthStatus) => {
  if (!user || authStatus !== 'signed_in') throw new Error('Not authenticated');
  return user;
};

const requireRole = (user: User, roles: UserRole[]) => {
  if (!roles.includes(user.role)) throw new Error('Forbidden');
};

// ── Points / assignment helpers ──────────────────────────────────────────────

/** Merged university → staff-username assignments (CEO config wins over defaults). */
const effectiveAssignments = (config: UniversityConfig | null): Record<string, string> => ({
  ...DEFAULT_STAFF_ASSIGNMENTS,
  ...(config?.assignments ?? {}),
});

const effectiveSlaGroup = (config: UniversityConfig | null, universityId?: string): UniversitySlaGroup => {
  if (!universityId) return 'none';
  const fromConfig = config?.slaGroups?.[universityId];
  return fromConfig ?? DEFAULT_SLA_GROUPS[universityId] ?? 'none';
};

/** Resolve the staff user auto-assigned for a university (by configured username). */
const resolveAutoStaff = (users: User[], config: UniversityConfig | null, universityId?: string): User | undefined => {
  if (!universityId) return undefined;
  const username = effectiveAssignments(config)[universityId];
  if (!username) return undefined;
  return users.find(u => u.role === 'staff' && u.username.toLowerCase() === username.toLowerCase());
};

/** Recompute every user's points total from the persistent ledger. */
const withLedgerPoints = (users: User[], ledger: PointsEntry[]): User[] => {
  const totals = ledgerTotals(ledger);
  return users.map(u => ({ ...u, points: totals.get(u.id) ?? 0 }));
};

/**
 * State patch that applies ledger totals to BOTH the users list and the
 * signed-in user object (they are separate store fields — updating only
 * `users` left the header/profile points chip stuck at 0).
 */
const ledgerPatch = (
  state: Pick<AppStoreState, 'users' | 'currentUser'>,
  pointsLedger: PointsEntry[],
): Pick<AppStoreState, 'users' | 'currentUser' | 'pointsLedger'> => ({
  pointsLedger,
  users: withLedgerPoints(state.users, pointsLedger),
  currentUser: state.currentUser
    ? { ...state.currentUser, points: ledgerTotals(pointsLedger).get(state.currentUser.id) ?? 0 }
    : state.currentUser,
});

/** Append ledger entries, skipping ids that already exist (idempotent by design). */
const appendLedger = (ledger: PointsEntry[], entries: PointsEntry[]): PointsEntry[] => {
  const existing = new Set(ledger.map(e => e.id));
  const fresh = entries.filter(e => !existing.has(e.id));
  return fresh.length ? [...ledger, ...fresh] : ledger;
};

const parseDate = (value: string) => {
  const v = typeof value === 'string' ? value.trim() : '';
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const calculateAge = (dob: string) => {
  const d = parseDate(dob);
  if (!d) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  if (age < 0 || age > 125) return null;
  return age;
};

const generateStudentCredentials = () => {
  const username = `std${Math.floor(1000 + Math.random() * 9000)}`;
  const password = `Way${Math.floor(1000 + Math.random() * 9000)}`;
  return { username, password };
};

// Debounced backend save with a flushable pending flag. loadBackendState MUST
// flush any pending save first — otherwise a background refresh could pull the
// server's older snapshot over fresh local mutations (approve, intake, …) and
// the debounced save would then persist the reverted data. That exact race
// silently reverted a sales approval during end-to-end testing.
const pendingSave = { timer: null as number | null };

const queueBackendSave = (getState: () => AppStoreState) => {
  if (pendingSave.timer) window.clearTimeout(pendingSave.timer);
  pendingSave.timer = window.setTimeout(() => {
    pendingSave.timer = null;
    getState().saveBackendState().catch(() => {});
  }, 600);
};

/** Flush a pending debounced save NOW (used before any backend load). */
const flushBackendSave = async (getState: () => AppStoreState) => {
  if (pendingSave.timer === null) return;
  window.clearTimeout(pendingSave.timer);
  pendingSave.timer = null;
  await getState().saveBackendState().catch(() => {});
};

const SITE_URL = 'https://theway.ge';

const chatPathForRole = (role: string): string =>
  role === 'student' ? '/messages'
    : role === 'agency' ? '/agencies'
    : role === 'staff' ? '/staff'
    : role === 'agency_staff' ? '/agency-staff'
    : role === 'sales' ? '/sales'
    : role === 'ops' ? '/ops'
    : role === 'ceo' ? '/admin' : '/messages';

type NotifyEmail = {
  subject: string;
  title: string;
  intro: string;
  preheader?: string;
  ctaLabel?: string;
  ctaPath?: string;   // e.g. '/dashboard' — appended to SITE_URL
  note?: string;
  outro?: string;
};

// De-dupe identical emails fired in quick succession (e.g. bulk doc verifies).
const recentEmailKeys = new Map<string, number>();

// Resolve who actually receives a user-facing email and send the branded
// template. For agency-sourced students, route to the agency contact instead
// of the student (partner-agency students are not contacted directly).
const emailNotifyUser = (
  getState: () => AppStoreState,
  recipientUserId: string,
  email: NotifyEmail,
  opts?: { dedupeKey?: string },
) => {
  try {
    const state = getState();
    const recipient = state.users.find(u => u.id === recipientUserId);
    if (!recipient) return;

    let toEmail = recipient.email;
    let greetingName = recipient.name;

    if (recipient.role === 'student') {
      const studentApp = state.applications.find(a => a.studentId === recipientUserId)
        ?? state.applications.find(a => a.studentId === recipientUserId && (a.source ?? 'public') === 'agency');
      const isAgencySourced = studentApp && (studentApp.source ?? 'public') === 'agency' && studentApp.agencyId;
      if (isAgencySourced) {
        const agency = state.users.find(u => u.id === studentApp!.agencyId);
        if (agency?.email) {
          toEmail = agency.email;
          greetingName = agency.name;
          email = {
            ...email,
            intro: `${email.intro} (Student: ${recipient.name})`,
          };
        }
      }
    }

    if (!toEmail) return;

    if (opts?.dedupeKey) {
      const key = `${toEmail}|${opts.dedupeKey}`;
      const now = Date.now();
      const last = recentEmailKeys.get(key);
      if (last && now - last < 10_000) return;
      recentEmailKeys.set(key, now);
    }

    const html = renderBrandedEmail({
      title: email.title,
      preheader: email.preheader ?? email.intro,
      greeting: greetingName ? `Dear ${greetingName},` : undefined,
      intro: email.intro,
      ...(email.ctaLabel && email.ctaPath ? { ctaLabel: email.ctaLabel, ctaUrl: `${SITE_URL}${email.ctaPath}` } : {}),
      ...(email.note ? { note: email.note } : {}),
      ...(email.outro ? { outro: email.outro } : {}),
    });
    const textLines = [email.title, '', email.intro];
    if (email.ctaLabel && email.ctaPath) textLines.push('', `${email.ctaLabel}: ${SITE_URL}${email.ctaPath}`);
    if (email.outro) textLines.push('', email.outro);
    textLines.push('', 'Warm regards,', 'The Way Team');
    void sendMail({ to: toEmail, subject: email.subject, text: textLines.join('\n'), html });
  } catch {
    // Email is best-effort; never block the state update.
  }
};

// Document types (as used by the staff upload UI) that complete pipeline stages.
export const STAGE_TO_DOC_TYPES: Record<PipelineStageId, string[]> = {
  translated_documents: ['translation'],
  university_approval: ['university-approval'],
  recognition_letter: ['recognition-letter'],
  ministry_order: ['ministry-order'],
  visa_documents: ['visa-documents'],
  visa_residency: ['visa', 'residency'],
};

const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => {

      // ── Pipeline core ───────────────────────────────────────────────────
      // Completes `stage` on an application: stamps completedAt, awards SLA
      // points to the assigned staff member (deterministic ledger id — can
      // never double-score), advances to the next stage (starting its timer
      // unless it waits for permission), and closes the case after
      // visa+residency (+2, Processing → Closed, student rating prompt).
      const completeStageCore = (applicationId: string, stage: PipelineStageId, byId: string, byName: string): boolean => {
        const app = get().applications.find(a => a.id === applicationId);
        const pipeline = app?.pipeline;
        if (!app || !pipeline || pipeline.status !== 'processing') return false;
        if (pipeline.current !== stage) return false;
        const track = pipeline.stages[stage] ?? {};
        if (track.completedAt) return false;
        const meta = getStageMeta(stage);
        if (meta.permissionGated && !track.permissionAt) return false;
        // PRD §2: Recognition is blocked until the high-school certificate exists.
        if (stage === 'recognition_letter' && !app.intakeHighSchoolCertificate) return false;

        const now = new Date().toISOString();
        const isFinal = stage === 'visa_residency';
        const next = isFinal ? null : nextStageOf(stage);
        const nextMeta = next ? getStageMeta(next) : null;

        // SLA scoring for the assigned staff member.
        const group = effectiveSlaGroup(get().universityConfig, app.university);
        const window = getSlaWindow(stage, group);
        const startedAt = track.startedAt;
        const entries: PointsEntry[] = [];
        if (app.assignedStaffId) {
          if (isFinal) {
            entries.push({
              id: slaLedgerId(applicationId, stage),
              userId: app.assignedStaffId,
              delta: VISA_RESIDENCY_POINTS,
              reason: `Visa & residency completed — ${app.name}`,
              kind: 'sla', at: now, applicationId, applicationName: app.name, stage,
            });
          } else if (window && startedAt) {
            const delta = slaPointsForCompletion(window, startedAt, now);
            entries.push({
              id: slaLedgerId(applicationId, stage),
              userId: app.assignedStaffId,
              delta,
              reason: `${meta.label} ${delta > 0 ? 'completed on time' : 'completed late'} — ${app.name}`,
              kind: 'sla', at: now, applicationId, applicationName: app.name, stage,
            });
          }
        }

        set((state) => {
          const pointsLedger = appendLedger(state.pointsLedger, entries);
          return {
            applications: state.applications.map(a => {
              if (a.id !== applicationId || !a.pipeline) return a;
              const nextPipeline: ApplicationPipeline = {
                ...a.pipeline,
                stages: {
                  ...a.pipeline.stages,
                  [stage]: { ...track, completedAt: now, completedById: byId, completedByName: byName },
                  ...(next ? { [next]: { ...(a.pipeline.stages[next] ?? {}), ...(nextMeta?.permissionGated ? {} : { startedAt: (a.pipeline.stages[next]?.startedAt) ?? now }) } } : {}),
                },
                current: isFinal ? 'done' : (next as PipelineStageId),
                ...(isFinal ? { status: 'closed' as const, closedAt: now } : {}),
              };
              return {
                ...a,
                pipeline: nextPipeline,
                ...(isFinal ? { stage: 'enrolled' as const } : {}),
                events: [
                  ...(a.events ?? []),
                  { id: `${a.id}-pipeline-${stage}-${Date.now()}`, type: 'document_verified' as const, byId, byName, time: now, details: `${meta.label} completed${isFinal ? ' — case closed' : ''}` },
                ],
              };
            }),
            ...ledgerPatch(state, pointsLedger),
            notifications: [
              ...state.notifications,
              ...(app.studentId ? [{
                id: `${applicationId}-stage-${stage}-done`,
                userId: app.studentId,
                title: isFinal ? 'Congratulations — your case is complete!' : 'Application progress',
                message: isFinal
                  ? 'Your visa & residency are ready. We would love to hear your feedback!'
                  : `${meta.label} has been completed. Next: ${nextMeta?.label ?? ''}`,
                type: (isFinal ? 'success' : 'info') as NotificationType,
                time: now, read: false,
                link: '/dashboard',
              }] : []),
              ...(entries.length && app.assignedStaffId ? [{
                id: `${applicationId}-stage-${stage}-pts`,
                userId: app.assignedStaffId,
                title: entries[0].delta >= 0 ? `+${entries[0].delta} performance points` : `${entries[0].delta} performance points`,
                message: `${meta.label} — ${app.name}`,
                type: (entries[0].delta >= 0 ? 'success' : 'alert') as NotificationType,
                time: now, read: false,
                link: '/profile',
              }] : []),
            ],
          };
        });

        if (isFinal && app.studentId) {
          emailNotifyUser(get, app.studentId, {
            subject: 'Your case is complete — The Way',
            title: 'Congratulations!',
            intro: 'Your visa and residency documents are ready and your case is now complete.',
            ctaLabel: 'Open your dashboard',
            ctaPath: '/dashboard',
            outro: 'We would love to hear about your experience — please leave us a rating in your portal.',
          }, { dedupeKey: `${applicationId}-closed` });
        }
        queueBackendSave(get);
        return true;
      };

      // Auto-complete every stage whose documents are already uploaded (runs
      // after uploads, verifications and permission grants). Chains forward:
      // e.g. permission arrives after the letter was uploaded early.
      const autoCompleteFromDocuments = (applicationId: string, byId: string, byName: string) => {
        for (let guard = 0; guard < PIPELINE_ORDER.length; guard += 1) {
          const app = get().applications.find(a => a.id === applicationId);
          const pipeline = app?.pipeline;
          if (!app || !pipeline || pipeline.status !== 'processing' || pipeline.current === 'done') return;
          const stage = pipeline.current as PipelineStageId;
          const requiredTypes = STAGE_TO_DOC_TYPES[stage];
          const docs = get().documents;
          const allPresent = requiredTypes.every(t =>
            docs.some(d => d.studentId === app.studentId && d.type === t)
          );
          if (!allPresent) return;
          if (!completeStageCore(applicationId, stage, byId, byName)) return;
        }
      };

      return {
        users: [],
        currentUser: null,
        authStatus: 'signed_out',
        applications: [],
        documents: [],
        notifications: [],
        chatMessages: [],
        chatThreadReadAt: {},
        chatEmailNotify: {},
        appointments: [],
        documentRequests: [],
        leads: [],
        futureLeads: [],
        trashedApplications: [],
        trashedUsers: [],
        credentialRequests: [],
        pointsLedger: [],
        universityConfig: null,
        purgedApplicationIds: [],
        unTrashedUserIds: [],
        language: 'en',
        backendHydrated: false,

      setLanguage: (language) => set({ language }),
      // Your actions here
      login: async (username: string, password: string) => {
        const maskEmail = (value: string) => {
          const s = value.trim();
          const at = s.indexOf('@');
          if (at <= 1) return '***';
          const local = s.slice(0, at);
          const domain = s.slice(at + 1);
          return `${local[0]}***@${domain}`;
        };
        const supabase = tryGetSupabase();
        const input = username.trim();
        const isEmail = input.includes('@');
        let email = input;
        if (!supabase) {
          throw new Error('Supabase is not configured or available');
        }
        if (!isEmail) {
          const r = await fetch('/api/lookup-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: input }),
          }).catch(() => null);
          if (!r) throw new Error('Backend is not reachable. Please try again.');
          const text = await r.text().catch(() => '');
          const j = (text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null) as { email?: unknown; error?: unknown } | null;
          if (!r.ok) {
            const errBase = j && typeof j.error === 'string' ? j.error : `Login backend error (HTTP ${r.status})`;
            const extra = (!j && text) ? `: ${text.slice(0, 200)}` : '';
            throw new Error(`${errBase}${extra}`);
          }
          if (!j || typeof j.email !== 'string') {
            const extra = text ? `: ${text.slice(0, 200)}` : '';
            throw new Error(`Login backend returned an invalid response${extra}`);
          }
          if (!j.email) throw new Error('Username not found (or profile email is missing).');
          email = j.email;
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const msg = error.message || 'Invalid email or password';
          if (!isEmail && msg.toLowerCase().includes('invalid login credentials')) {
            throw new Error(`Invalid login credentials for ${maskEmail(email)}`);
          }
          throw new Error(msg);
        }
        if (!data.user) throw new Error('Login failed');
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        if (!token) throw new Error('Login failed');
        const meResp = await fetch('/api/me-profile', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
        if (!meResp) throw new Error('Backend is not reachable. Please try again.');
        const meText = await meResp.text().catch(() => '');
        const meJson = (meText ? (() => { try { return JSON.parse(meText); } catch { return null; } })() : null) as { user?: unknown; error?: unknown; details?: unknown } | null;
        if (!meResp.ok || !meJson || !meJson.user || typeof meJson.user !== 'object') {
          const errBase = meJson && typeof meJson.error === 'string' ? meJson.error : `Failed to load profile (HTTP ${meResp.status})`;
          const details =
            meJson && typeof meJson.details === 'string'
              ? meJson.details
              : (meJson && meJson.details != null ? JSON.stringify(meJson.details) : '');
          const extra = details ? `: ${details.slice(0, 200)}` : ((!meJson && meText) ? `: ${meText.slice(0, 200)}` : '');
          throw new Error(`${errBase}${extra}`);
        }
        const u = meJson.user as Record<string, unknown>;
        const user: User = {
          id: typeof u.id === 'string' ? u.id : String(u.id ?? ''),
          username: typeof u.username === 'string' ? u.username : input,
          role: (typeof u.role === 'string' ? u.role : 'student') as UserRole,
          name: typeof u.name === 'string' ? u.name : '',
          email,
          phone: undefined,
          createdAt: new Date().toISOString(),
          points: 0,
        };
        const authStatus: AuthStatus = 'signed_in';
        set({ currentUser: user, authStatus });
        await get().refreshUsersFromBackend();
        await get().loadBackendState();
        get().checkExpiries();
        get().checkChatReminders();
        return user;
      },

      logout: () => {
        const supabase = tryGetSupabase();
        if (supabase) void supabase.auth.signOut();
        localStorage.removeItem('the-way-storage');
        set({ currentUser: null, authStatus: 'signed_out', backendHydrated: false, users: [], applications: [], documents: [], notifications: [], appointments: [], chatMessages: [], chatThreadReadAt: {}, chatEmailNotify: {}, documentRequests: [], leads: [], futureLeads: [], trashedApplications: [], trashedUsers: [], credentialRequests: [], pointsLedger: [], universityConfig: null, purgedApplicationIds: [], unTrashedUserIds: [] });
      },

      changePassword: async (newPassword: string) => {
        const pw = (newPassword ?? '').trim();
        if (pw.length < 8) throw new Error('Password must be at least 8 characters');
        const supabase = tryGetSupabase();
        if (!supabase) throw new Error('Account service is not available right now');
        const { error } = await supabase.auth.updateUser({ password: pw });
        if (error) throw new Error(error.message || 'Could not update password');
      },

      markNotificationsRead: (ids?: string[]) => {
        const me = get().currentUser;
        if (!me) return;
        const idSet = ids ? new Set(ids) : null;
        set((state) => ({
          notifications: state.notifications.map(n =>
            n.userId === me.id && (!idSet || idSet.has(n.id)) ? { ...n, read: true } : n
          ),
        }));
        queueBackendSave(get);
      },

      markAllNotificationsRead: () => {
        get().markNotificationsRead();
      },

      updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => {
        set((state) => ({
          appointments: state.appointments.map(a => a.id === appointmentId ? { ...a, status } : a),
        }));
        queueBackendSave(get);
      },

      addLead: (lead) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['sales', 'customer_support', 'ceo']);
        const email = (lead.email || '').trim().toLowerCase();
        const phone = (lead.phone || '').replace(/\s+/g, '');
        const duplicate = get().leads.some(l => l.ownerId === actor.id && (
          (!!email && l.email.trim().toLowerCase() === email) ||
          (!!phone && l.phone.replace(/\s+/g, '') === phone)
        ));
        const now = new Date().toISOString();
        const newLead: Lead = {
          id: `lead-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          ownerId: actor.id,
          ownerName: actor.name,
          name: (lead.name || '').trim(),
          phone: (lead.phone || '').trim(),
          email: (lead.email || '').trim(),
          country: (lead.country || '').trim(),
          universityInterested: (lead.universityInterested || '').trim(),
          notes: lead.notes ?? '',
          status: lead.status ?? 'new',
          followUpDate: lead.followUpDate || undefined,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ leads: [newLead, ...state.leads] }));
        queueBackendSave(get);
        return { duplicate };
      },

      convertLeadToApplication: async (id: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['sales', 'customer_support', 'ceo']);
        const lead = get().leads.find(l => l.id === id);
        if (!lead) throw new Error('Lead not found');
        if (lead.convertedApplicationId) throw new Error('This lead has already been converted');
        if (!lead.name.trim() && !lead.email.trim()) throw new Error('Add a name and email before converting');
        const beforeIds = new Set(get().applications.map(a => a.id));
        // Create a real public application from the lead's details.
        await get().addApplication({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          country: lead.country,
          program: lead.universityInterested || 'Not specified',
          status: 'submitted',
          stage: 'applied',
          createdAt: new Date().toISOString(),
          source: 'public',
        } as Omit<Application, 'id'>);
        // addApplication reloads state; find the newly-created application id.
        const created = get().applications.find(a => !beforeIds.has(a.id) && a.email === lead.email);
        set((state) => ({
          leads: state.leads.map(l => l.id === id
            ? { ...l, status: 'won', convertedApplicationId: created?.id, updatedAt: new Date().toISOString() }
            : l),
        }));
        queueBackendSave(get);
      },

      updateLead: (id, updates) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['sales', 'customer_support', 'ceo']);
        const lead = get().leads.find(l => l.id === id);
        if (!lead) throw new Error('Lead not found');
        // Owners edit their own leads; support/ceo may also edit (monitoring notes).
        const canEdit = lead.ownerId === actor.id || actor.role === 'ceo' || actor.role === 'customer_support';
        if (!canEdit) throw new Error('You can only edit your own leads');
        set((state) => ({
          leads: state.leads.map(l => l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l),
        }));
        queueBackendSave(get);
      },

      deleteLead: (id) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['sales', 'customer_support', 'ceo']);
        const lead = get().leads.find(l => l.id === id);
        if (!lead) return;
        if (lead.ownerId !== actor.id && actor.role !== 'ceo') throw new Error('You can only delete your own leads');
        set((state) => ({ leads: state.leads.filter(l => l.id !== id) }));
        queueBackendSave(get);
      },

      restoreSession: async () => {
        const supabase = tryGetSupabase();
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (!session?.user?.id) return;
        const token = session.access_token;
        const meResp = await fetch('/api/me-profile', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
        if (!meResp || !meResp.ok) return;
        const meJson = (await meResp.json().catch(() => null)) as { user?: unknown } | null;
        if (!meJson || !meJson.user || typeof meJson.user !== 'object') return;
        const p = meJson.user as Record<string, unknown>;
        const user: User = {
          id: typeof p.id === 'string' ? p.id : String(p.id ?? ''),
          username: typeof p.username === 'string' ? p.username : '',
          role: (typeof p.role === 'string' ? p.role : 'student') as UserRole,
          name: typeof p.name === 'string' ? p.name : '',
          email: session.user.email ?? '',
          phone: undefined,
          createdAt: new Date().toISOString(),
          points: 0,
        };
        const existing = get().currentUser;
        const existingStatus = get().authStatus;
        if (existing?.id === user.id && existingStatus !== 'signed_out') {
          // Session already restored from localStorage — but a page refresh
          // must still pull FRESH backend data (PRD §7), otherwise the user
          // keeps seeing the persisted snapshot until the next poll.
          await get().loadBackendState();
          get().checkExpiries();
          get().checkChatReminders();
          return;
        }
        const authStatus: AuthStatus = 'signed_in';
        set({ currentUser: user, authStatus });
        await get().refreshUsersFromBackend();
        await get().loadBackendState();
        get().checkExpiries();
        get().checkChatReminders();
      },

      refreshUsersFromBackend: async () => {
        const supabase = tryGetSupabase();
        if (!supabase) return;
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;
        const r = await fetch('/api/users-list', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
        if (!r || !r.ok) return;
        const j = (await r.json().catch(() => null)) as { users?: unknown } | null;
        if (!j || !Array.isArray(j.users)) return;
        const users: User[] = (j.users as unknown[]).map((row) => {
          const p = (row && typeof row === 'object') ? (row as Record<string, unknown>) : {};
          return {
            id: typeof p.id === 'string' ? p.id : String(p.id ?? ''),
            username: typeof p.username === 'string' ? p.username : '',
            role: (typeof p.role === 'string' ? p.role : 'student') as UserRole,
            name: typeof p.name === 'string' ? p.name : '',
            email: typeof p.email === 'string' ? p.email : '',
            phone: undefined,
            createdAt: new Date().toISOString(),
            points: 0,
          };
        });
        // Points live in the persistent ledger, not in profiles — reapply totals.
        set((state) => ({
          users: withLedgerPoints(users, state.pointsLedger),
          currentUser: state.currentUser
            ? { ...state.currentUser, points: ledgerTotals(state.pointsLedger).get(state.currentUser.id) ?? 0 }
            : state.currentUser,
        }));
      },

      loadBackendState: async () => {
        const { authStatus } = get();
        if (authStatus !== 'signed_in') return;
        // Never pull the server snapshot over unsaved local changes.
        await flushBackendSave(get);
        const supabase = tryGetSupabase();
        if (!supabase) return;
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;
        const resp = await fetch('/api/state-get', { headers: { Authorization: `Bearer ${token}` } });
        const json = (await resp.json()) as { state?: unknown };
        if (!resp.ok || !json || !json.state || typeof json.state !== 'object') return;
        const s = json.state as Record<string, unknown>;
        set({
          applications: Array.isArray(s.applications) ? (s.applications as Application[]) : [],
          documents: Array.isArray(s.documents) ? (s.documents as Document[]) : [],
          notifications: Array.isArray(s.notifications) ? (s.notifications as Notification[]) : [],
          appointments: Array.isArray(s.appointments) ? (s.appointments as Appointment[]) : [],
          chatMessages: Array.isArray(s.chatMessages) ? (s.chatMessages as ChatMessage[]) : [],
          chatThreadReadAt: (s.chatThreadReadAt && typeof s.chatThreadReadAt === 'object') ? (s.chatThreadReadAt as Record<string, string>) : {},
          chatEmailNotify: (s.chatEmailNotify && typeof s.chatEmailNotify === 'object') ? (s.chatEmailNotify as Record<string, { firstAt: string; reminded: boolean }>) : {},
          documentRequests: Array.isArray(s.documentRequests) ? (s.documentRequests as DocumentRequest[]) : [],
          leads: Array.isArray(s.leads) ? (s.leads as Lead[]) : [],
          futureLeads: Array.isArray(s.futureLeads) ? (s.futureLeads as Application[]) : [],
          trashedApplications: Array.isArray(s.trashedApplications) ? (s.trashedApplications as Application[]) : [],
          trashedUsers: Array.isArray(s.trashedUsers) ? (s.trashedUsers as TrashedUser[]) : [],
          credentialRequests: Array.isArray(s.credentialRequests) ? (s.credentialRequests as CredentialRequest[]) : [],
          pointsLedger: Array.isArray(s.pointsLedger) ? (s.pointsLedger as PointsEntry[]) : [],
          universityConfig: (s.universityConfig && typeof s.universityConfig === 'object') ? (s.universityConfig as UniversityConfig) : null,
          purgedApplicationIds: Array.isArray(s.purgedApplicationIds) ? (s.purgedApplicationIds as string[]) : [],
          unTrashedUserIds: Array.isArray(s.unTrashedUserIds) ? (s.unTrashedUserIds as string[]) : [],
          backendHydrated: true,
        });
        await get().refreshUsersFromBackend();

        // Internal roles keep the shared state healthy: migrate legacy-stage
        // applications onto the new pipeline and apply any overdue SLA
        // penalties (idempotent — deterministic ledger ids).
        const me = get().currentUser;
        if (me && ['ceo', 'sales', 'ops', 'staff', 'agency_staff', 'customer_support'].includes(me.role)) {
          const nowIso = new Date().toISOString();
          let migrated = false;
          set((state) => {
            const applications = state.applications.map(a => {
              let next = a;
              if (!a.pipeline && a.status === 'approved') {
                migrated = true;
                next = { ...next, pipeline: legacyStageToPipeline(a.stage, nowIso) };
              }
              // Security migration: scrub any password persisted by the old
              // "store credentials" design — passwords are email-only now.
              if (next.studentCredentials?.password) {
                migrated = true;
                next = { ...next, studentCredentials: { username: next.studentCredentials.username, updatedAt: next.studentCredentials.updatedAt } };
              }
              return next;
            });
            return migrated ? { applications } : {};
          });
          get().evaluateSlaDeadlines();
          if (migrated) queueBackendSave(get);
        }
      },

      saveBackendState: async () => {
        const { authStatus, backendHydrated } = get();
        if (authStatus !== 'signed_in' || !backendHydrated) return;
        const supabase = tryGetSupabase();
        if (!supabase) return;
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;
        const snapshot = {
          applications: get().applications,
          documents: get().documents,
          notifications: get().notifications,
          appointments: get().appointments,
          chatMessages: get().chatMessages,
          chatThreadReadAt: get().chatThreadReadAt,
          chatEmailNotify: get().chatEmailNotify,
          documentRequests: get().documentRequests,
          leads: get().leads,
          futureLeads: get().futureLeads,
          trashedApplications: get().trashedApplications,
          trashedUsers: get().trashedUsers,
          credentialRequests: get().credentialRequests,
          pointsLedger: get().pointsLedger,
          universityConfig: get().universityConfig,
          purgedApplicationIds: get().purgedApplicationIds,
          unTrashedUserIds: get().unTrashedUserIds,
        };
        await fetch('/api/state-save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ state: snapshot }),
        });
      },

      addApplication: async (application: Omit<Application, 'id'>) => {
        const source = application.source ?? 'public';
        if (source === 'agency') {
          const actor = ensureSignedIn(get().currentUser, get().authStatus);
          requireRole(actor, ['agency', 'ceo']);
        }
        const supabase = tryGetSupabase();
        const { data: session } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
        const token = session.session?.access_token;
        const resp = await fetch('/api/apply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ ...application, source }),
        });
        const text = await resp.text().catch(() => '');
        const json = (text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null) as { id?: unknown; error?: unknown; details?: unknown } | null;
        if (!resp.ok || !json || typeof json.id !== 'string') {
          const err = json && typeof json.error === 'string' ? json.error : 'Failed to submit';
          const details =
            json && typeof json.details === 'string'
              ? json.details
              : (json && json.details != null ? JSON.stringify(json.details) : '');
          const statusPrefix = `HTTP ${resp.status}`;
          const message = details ? `${err}: ${details}` : err;
          throw new Error(`${statusPrefix} - ${message}`);
        }
        await get().loadBackendState();
      },

      setApplicationUniversity: (applicationId: string, universityId: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['sales', 'ops', 'ceo']);
        const app = get().applications.find(a => a.id === applicationId);
        if (!app) throw new Error('Application not found');
        const source = app.source ?? 'public';
        if (actor.role === 'sales' && source === 'agency') throw new Error('Forbidden');
        if (actor.role === 'ops' && source !== 'agency') throw new Error('Forbidden');
        set((state) => ({
          applications: state.applications.map(a => a.id === applicationId ? {
            ...a,
            university: universityId,
            events: [
              ...(a.events ?? []),
              { id: `${a.id}-uni-${Date.now()}`, type: 'university_set' as const, byId: actor.id, byName: actor.name, time: new Date().toISOString(), details: universityId },
            ],
          } : a),
        }));
        queueBackendSave(get);
      },

      setApplicationMeta: (applicationId: string, meta) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['sales', 'ops', 'ceo']);
        const app = get().applications.find(a => a.id === applicationId);
        if (!app) throw new Error('Application not found');
        const source = app.source ?? 'public';
        if (actor.role === 'sales' && source === 'agency') throw new Error('Forbidden');
        if (actor.role === 'ops' && source !== 'agency') throw new Error('Forbidden');
        set((state) => ({
          applications: state.applications.map(a => a.id === applicationId ? {
            ...a,
            ...meta,
            events: [
              ...(a.events ?? []),
              { id: `${a.id}-meta-${Date.now()}`, type: 'identity_updated' as const, byId: actor.id, byName: actor.name, time: new Date().toISOString() },
            ],
          } : a),
        }));
        queueBackendSave(get);
      },

      salesApproveApplication: async (applicationId: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);

        const app = get().applications.find(a => a.id === applicationId);
        if (!app) throw new Error('Application not found');
        if (app.status !== 'submitted') throw new Error('Application already processed');
        const source = app.source ?? 'public';
        if (source === 'agency') requireRole(actor, ['ops', 'ceo']);
        if (source === 'public') requireRole(actor, ['sales', 'ceo']);
        if (source === 'public' && !app.intakeDetails) throw new Error('Fill intake before approval');
        if (source === 'agency' && !app.studentEmail) throw new Error('Student email is required');
        const isAviation = ((app.program ?? '').toLowerCase().includes('aviation')) || Boolean(app.aviationDegree);
        if (!isAviation && !app.university) throw new Error('Select a university before approval');
        if (!app.dob) throw new Error('Date of birth is required (fill intake)');
        const age = calculateAge(app.dob);
        if (age == null) throw new Error('Invalid date of birth');
        if (age < 18) {
          if (!app.intakeBirthCertificate) throw new Error('Birth certificate is required for underage students');
          if (!app.intakeMotherPassport) throw new Error("Mother's passport is required for underage students");
          if (!app.intakeFatherPassport) throw new Error("Father's passport is required for underage students");
        }

        const creds = generateStudentCredentials();
        const studentEmail = app.studentEmail ?? app.email;
        const autoAssignedStaffId = (() => {
          if (!app.university) return undefined;
          // Primary: the configurable university → staff mapping (PRD §9).
          const configured = resolveAutoStaff(get().users, get().universityConfig, app.university);
          if (configured) return configured.id;
          // Fallback: legacy per-staff university lists (load-balanced).
          const candidates = get().users.filter(u => u.role === 'staff' && (u.staffUniversities ?? []).includes(app.university!));
          if (candidates.length === 0) return undefined;
          const counts = new Map<string, number>();
          get().applications.forEach(a => {
            if (!a.assignedStaffId) return;
            counts.set(a.assignedStaffId, (counts.get(a.assignedStaffId) ?? 0) + 1);
          });
          candidates.sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0));
          return candidates[0]?.id;
        })();
        const supabase = getSupabase();
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        if (!token) throw new Error('Not authenticated');
        const resp = await fetch('/api/admin-create-student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ email: studentEmail, username: creds.username, password: creds.password, name: app.name, phone: app.phone }),
        });
        const text = await resp.text().catch(() => '');
        const json = (text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null) as { id?: unknown; error?: unknown; details?: unknown; emailSent?: unknown; warning?: unknown } | null;
        if (!resp.ok || !json || typeof json.id !== 'string') {
          const err = json && typeof json.error === 'string' ? json.error : 'Failed to create student account';
          const details =
            json && typeof json.details === 'string'
              ? json.details
              : (json && json.details != null ? JSON.stringify(json.details) : '');
          throw new Error(details ? `${err}: ${details.slice(0, 240)}` : err);
        }
        const studentId = json.id;

        // Add the newly created student to the local users list so client flows
        // (messaging, lookups, UI) immediately recognize the student without
        // relying on a backend users-list endpoint being available.
        set((state) => ({
          users: state.users.some(u => u.id === studentId) ? state.users : [
            ...state.users,
            {
              id: studentId,
              username: creds.username,
              role: 'student' as const,
              name: app.name || '',
              email: studentEmail || '',
              createdAt: new Date().toISOString(),
              points: 0,
            }
          ],
        }));

        set((state) => ({
          applications: state.applications.map(a => a.id === applicationId ? {
            ...a,
            status: 'approved',
            stage: 'contacted',
            approvedBy: actor.id,
            approvedAt: new Date().toISOString(),
            studentId,
            ownerId: actor.id,
            salesOwnerId: actor.id,
            assignedStaffId: autoAssignedStaffId ?? a.assignedStaffId,
            studentCredentials: { username: creds.username, updatedAt: new Date().toISOString() },
            hold: undefined,
            // Approval opens the case: Processing, first stage timer running.
            pipeline: a.pipeline ?? {
              status: 'processing' as const,
              current: 'translated_documents' as const,
              stages: { translated_documents: { startedAt: new Date().toISOString() } },
            },
            events: [
              ...(a.events ?? []),
              { id: `${a.id}-approved-${Date.now()}`, type: 'approved' as const, byId: actor.id, byName: actor.name, time: new Date().toISOString(), details: source === 'agency' ? 'Approved by Ops' : 'Approved by Sales' },
              ...(autoAssignedStaffId ? [{ id: `${a.id}-assigned-${autoAssignedStaffId}-${Date.now()}`, type: 'assigned_staff' as const, byId: actor.id, byName: actor.name, time: new Date().toISOString(), details: autoAssignedStaffId }] : []),
            ],
          } : a),
          notifications: [
            ...state.notifications,
            { id: Date.now().toString(), userId: studentId, title: 'Welcome to The Way', message: 'Your student account has been created', type: 'success', time: new Date().toISOString(), read: false },
            ...(autoAssignedStaffId ? [{ id: `${studentId}-auto-assign`, userId: autoAssignedStaffId, title: 'New Student Assigned', message: app.name, type: 'info' as const, time: new Date().toISOString(), read: false, link: `/staff?student=${applicationId}` }] : [])
          ],
        }));
        set((state) => {
          const at = new Date().toISOString();
          const entries: PointsEntry[] = [
            { id: `act-${applicationId}-approved`, userId: actor.id, delta: 1, reason: `Approved application — ${app.name}`, kind: 'activity', at, applicationId, applicationName: app.name },
            ...(source === 'agency' && app.agencyId
              ? [{ id: `act-${applicationId}-agency-approved`, userId: app.agencyId, delta: 1, reason: `Student approved — ${app.name}`, kind: 'activity' as const, at, applicationId, applicationName: app.name }]
              : []),
          ];
          const pointsLedger = appendLedger(state.pointsLedger, entries);
          return ledgerPatch(state, pointsLedger);
        });

        if (autoAssignedStaffId) {
          emailNotifyUser(get, autoAssignedStaffId, {
            subject: 'New student assigned — The Way',
            title: 'A new student was assigned to you',
            intro: `You have been assigned a new student: ${app.name}.`,
            ctaLabel: 'Open your dashboard',
            ctaPath: '/staff',
            outro: 'Log in to review their application and documents.',
          }, { dedupeKey: `${studentId}-autoassign` });
        }
        await get().refreshUsersFromBackend();
        // Ensure the newly created student remains in the client users list
        if (!get().users.some(u => u.id === studentId)) {
          set((state) => ({
            users: [
              ...state.users,
              {
                id: studentId,
                username: creds.username,
                role: 'student',
                name: app.name || '',
                email: studentEmail || '',
                createdAt: new Date().toISOString(),
                points: 0,
              }
            ]
          }));
        }
        queueBackendSave(get);
        return {
          ...creds,
          ...(typeof json.emailSent === 'boolean' ? { emailSent: json.emailSent } : {}),
          ...(typeof json.warning === 'string' ? { warning: json.warning } : {}),
        };
      },

      salesRejectApplication: (applicationId: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);

        const app = get().applications.find(a => a.id === applicationId);
        if (!app) throw new Error('Application not found');
        if (app.status !== 'submitted') throw new Error('Application already processed');
        const source = app.source ?? 'public';
        if (source === 'agency') requireRole(actor, ['ops', 'ceo']);
        if (source === 'public') requireRole(actor, ['sales', 'ceo']);

        const nowIso = new Date().toISOString();
        const rejectedApp: Application = {
          ...app,
          status: 'rejected',
          stage: 'rejected',
          rejectedAt: nowIso,
          archivedAt: nowIso,
          events: [
            ...(app.events ?? []),
            { id: `${app.id}-rejected-${Date.now()}`, type: 'rejected' as const, byId: actor.id, byName: actor.name, time: nowIso },
          ],
        };
        // Rejected forms leave the active board and are archived as Future Leads
        // (re-contactable later if rules change).
        set((state) => ({
          applications: state.applications.filter(a => a.id !== applicationId),
          futureLeads: [rejectedApp, ...state.futureLeads.filter(a => a.id !== applicationId)],
        }));
        const hasNotes = (app.internalNotes ?? []).length > 0;
        if (!hasNotes) {
          set((state) => {
            const pointsLedger = appendLedger(state.pointsLedger, [{
              id: `act-${applicationId}-rejected-nonotes`,
              userId: actor.id,
              delta: -1,
              reason: `Rejected without internal notes — ${app.name}`,
              kind: 'activity',
              at: nowIso,
              applicationId,
              applicationName: app.name,
            }]);
            return ledgerPatch(state, pointsLedger);
          });
        }
        const applicantEmail = app.studentEmail ?? app.email;
        if (applicantEmail) {
          const html = renderBrandedEmail({
            title: 'Application Update',
            greeting: `Dear ${app.name},`,
            intro: 'Thank you for your interest in studying in Georgia with The Way. After careful review, we are unable to approve your application at this time.',
            outro: 'Eligibility rules can change, and we may reach out again if your situation or the requirements change in the future. If you have any questions, please reply to this email — we are happy to help.',
          });
          const text = `Dear ${app.name},\n\nThank you for your interest in studying in Georgia with The Way. After careful review, we are unable to approve your application at this time.\n\nEligibility rules can change, and we may reach out again in the future. If you have any questions, please reply to this email.\n\nWarm regards,\nThe Way Team`;
          sendMail({ to: applicantEmail, subject: 'Application Update — The Way', text, html });
        }
        queueBackendSave(get);
      },

      salesAddIntakeDetails: (applicationId: string, details: string, attachments: string[]) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        const app = get().applications.find(a => a.id === applicationId);
        if (!app) throw new Error('Application not found');
        const source = app.source ?? 'public';
        if (source === 'agency') requireRole(actor, ['ops', 'ceo']);
        if (source === 'public') requireRole(actor, ['sales', 'ceo']);
        const firstTime = !app?.intakeDetails;
        const within24h = app ? ((new Date().getTime() - new Date(app.createdAt).getTime()) <= 24 * 60 * 60 * 1000) : false;
        set((state) => ({
          applications: state.applications.map(a => a.id === applicationId ? {
            ...a,
            intakeDetails: details,
            intakeAttachments: attachments,
            internalNotes: [...(a.internalNotes ?? []), { id: Date.now().toString(), authorName: actor.name, text: `Sales Intake:\n${details}`, createdAt: new Date().toISOString() }]
          } : a)
        }));
        if (firstTime) {
          set((state) => {
            const pointsLedger = appendLedger(state.pointsLedger, [{
              id: `act-${applicationId}-intake`,
              userId: actor.id,
              delta: 1,
              reason: `Filled intake — ${app.name}`,
              kind: 'activity',
              at: new Date().toISOString(),
              applicationId,
              applicationName: app.name,
            }]);
            return ledgerPatch(state, pointsLedger);
          });
        }
        if (within24h && !app?.intakeSLARewarded) {
          set((state) => {
            const pointsLedger = appendLedger(state.pointsLedger, [{
              id: `act-${applicationId}-intake-sla`,
              userId: actor.id,
              delta: 1,
              reason: `Intake completed within 24h — ${app.name}`,
              kind: 'activity',
              at: new Date().toISOString(),
              applicationId,
              applicationName: app.name,
            }]);
            return {
              ...ledgerPatch(state, pointsLedger),
              applications: state.applications.map(a => a.id === applicationId ? { ...a, intakeSLARewarded: true } : a),
            };
          });
        }
        queueBackendSave(get);
      },
      
      salesSetIntakeMedia: (applicationId: string, media: { videoUrl?: string; passportCopy?: string; highSchoolCertificate?: string; highSchoolMissingNote?: string; birthCertificate?: string; motherPassport?: string; fatherPassport?: string; pdfs?: string[] }) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        const app = get().applications.find(a => a.id === applicationId);
        if (!app) throw new Error('Application not found');
        const source = app.source ?? 'public';
        if (source === 'agency') requireRole(actor, ['ops', 'ceo']);
        if (source === 'public') requireRole(actor, ['sales', 'ceo']);
        set((state) => ({
          applications: state.applications.map(a => a.id === applicationId ? {
            ...a,
            intakeVideoUrl: media.videoUrl ?? a.intakeVideoUrl,
            intakePassportCopy: media.passportCopy ?? a.intakePassportCopy,
            intakeHighSchoolCertificate: media.highSchoolCertificate ?? a.intakeHighSchoolCertificate,
            intakeHighSchoolMissingNote: media.highSchoolMissingNote ?? a.intakeHighSchoolMissingNote,
            intakeBirthCertificate: media.birthCertificate ?? a.intakeBirthCertificate,
            intakeMotherPassport: media.motherPassport ?? a.intakeMotherPassport,
            intakeFatherPassport: media.fatherPassport ?? a.intakeFatherPassport,
            intakeAttachments: media.pdfs ? [ ...(a.intakeAttachments ?? []), ...media.pdfs ] : a.intakeAttachments,
          } : a)
        }));
        queueBackendSave(get);
      },

      salesClaimLead: (applicationId: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        const app = get().applications.find(a => a.id === applicationId);
        if (!app) throw new Error('Application not found');
        const source = app.source ?? 'public';
        if (source === 'agency') requireRole(actor, ['ops', 'ceo']);
        if (source === 'public') requireRole(actor, ['sales', 'ceo']);
        set((state) => {
          const pointsLedger = appendLedger(state.pointsLedger, [{
            id: `act-${applicationId}-claimed`,
            userId: actor.id,
            delta: 1,
            reason: `Claimed lead — ${app.name}`,
            kind: 'activity',
            at: new Date().toISOString(),
            applicationId,
            applicationName: app.name,
          }]);
          return {
            applications: state.applications.map(a => a.id === applicationId ? {
              ...a,
              ownerId: actor.id,
              salesOwnerId: actor.id,
              events: [
                ...(a.events ?? []),
                { id: `${a.id}-claimed-${Date.now()}`, type: 'claimed' as const, byId: actor.id, byName: actor.name, time: new Date().toISOString() },
              ],
            } : a),
            ...ledgerPatch(state, pointsLedger),
          };
        });
        queueBackendSave(get);
      },

      salesAddExtraDocs: (applicationId: string, files: string[]) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        const app = get().applications.find(a => a.id === applicationId);
        if (!app) throw new Error('Application not found');
        const source = app.source ?? 'public';
        if (source === 'agency') requireRole(actor, ['ops', 'ceo']);
        if (source === 'public') requireRole(actor, ['sales', 'ceo']);
        set((state) => ({
          applications: state.applications.map(a => a.id === applicationId ? {
            ...a,
            intakeAttachments: [ ...(a.intakeAttachments ?? []), ...files ],
          } : a)
        }));
        queueBackendSave(get);
      },

      staffUpdateApplicationStage: (applicationId: string, stage: ApplicationStage) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['staff', 'ceo', 'agency_staff']);

        const app = get().applications.find(a => a.id === applicationId);
        if (!app) throw new Error('Application not found');
        if (app.status !== 'approved') throw new Error('Only approved students can be progressed');

        const stageLabels: Record<ApplicationStage, string> = {
          applied: 'Applied', contacted: 'Contacted', accepted: 'Accepted',
          documents: 'Documents Stage', visa: 'Visa Stage', enrolled: 'Enrolled', rejected: 'Rejected',
        };
        const stageLabel = stageLabels[stage] ?? stage;

        set((state) => ({
          applications: state.applications.map(a => a.id === applicationId ? { ...a, stage } : a),
          notifications: app.studentId ? [
            ...state.notifications,
            { id: `${applicationId}-stage-${Date.now()}`, userId: app.studentId, title: 'Application Updated', message: `Your application has moved to: ${stageLabel}`, type: 'info' as const, time: new Date().toISOString(), read: false, link: '/dashboard' },
          ] : state.notifications,
        }));

        if (app.studentId) {
          emailNotifyUser(get, app.studentId, {
            subject: `Application Update: ${stageLabel} — The Way`,
            title: 'Your application was updated',
            intro: `Your application has moved to a new stage: ${stageLabel}.`,
            ctaLabel: 'View your application',
            ctaPath: '/dashboard',
            outro: 'Log in to your portal to see the latest details and next steps.',
          }, { dedupeKey: `${applicationId}-stage-${stage}` });
        }
        queueBackendSave(get);
      },

      staffAddInternalNote: (applicationId: string, text: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['staff', 'ceo', 'agency_staff']);

        const app = get().applications.find(a => a.id === applicationId);
        if (!app) throw new Error('Application not found');

        const note: InternalNote = {
          id: Date.now().toString(),
          author: actor.id,
          authorName: actor.name,
          text,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          applications: state.applications.map(a => a.id === applicationId ? {
            ...a,
            internalNotes: [...(a.internalNotes ?? []), note],
          } : a),
        }));
        queueBackendSave(get);
      },

      staffUploadDocument: (doc: Omit<Document, 'id' | 'status' | 'uploadedAt'>) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['staff', 'ceo', 'agency_staff']);

        if (!get().users.some(u => u.id === doc.studentId && u.role === 'student')) throw new Error('Student not found');
        const a = get().applications.find(x => x.studentId === doc.studentId);
        if (doc.type === 'recognition-letter' && !a?.intakeHighSchoolCertificate) {
          throw new Error('High school certificate must be uploaded before recognition');
        }

        const newDoc: Omit<Document, 'id'> = {
          ...doc,
          // Staff upload their own work product — no self-verification click
          // needed. (Student/agent uploads go through the review workflow.)
          status: 'verified',
          uploadedAt: new Date().toISOString(),
          uploadedBy: actor.id,
        };

        const docId = Date.now().toString();
        set((state) => ({
          documents: [...state.documents, { ...newDoc, id: docId }],
          notifications: [
            ...state.notifications,
            { id: `${docId}-upload-notif`, userId: doc.studentId, title: 'New Document Added', message: doc.title, type: 'info' as const, time: new Date().toISOString(), read: false },
          ],
          applications: state.applications.map(a => a.studentId === doc.studentId ? {
            ...a,
            events: [
              ...(a.events ?? []),
              { id: `${a.id}-doc-upload-${docId}`, type: 'document_uploaded' as const, byId: actor.id, byName: actor.name, time: new Date().toISOString(), details: `${doc.title} (${doc.type})` },
            ],
          } : a),
        }));
        emailNotifyUser(get, doc.studentId, {
          subject: `New document added: ${doc.title} — The Way`,
          title: 'A new document was added',
          intro: `A new document — "${doc.title}" — has been added to your account.`,
          ctaLabel: 'Open your dashboard',
          ctaPath: '/dashboard',
          outro: 'Log in to your dashboard to view and download it.',
        }, { dedupeKey: `${docId}-upload` });
        // Uploading a stage document (translation, approval letter, visa,
        // residency, …) completes the matching pipeline stage automatically.
        if (a) autoCompleteFromDocuments(a.id, actor.id, actor.name);
        queueBackendSave(get);
      },

      staffVerifyDocument: (documentId: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['staff', 'ceo', 'agency_staff']);
        const doc = get().documents.find(d => d.id === documentId);
        if (!doc) throw new Error('Document not found');
        const app = get().applications.find(a => a.studentId === doc.studentId);
        if (doc.type === 'recognition-letter' && !app?.intakeHighSchoolCertificate) {
          throw new Error('High school certificate must be uploaded before recognition');
        }
        const now = new Date().toISOString();
        set((state) => ({
          documents: state.documents.map(d => d.id === documentId ? { ...d, status: 'verified' } : d),
          applications: app
            ? state.applications.map(a => a.id === app.id ? {
              ...a,
              assignedStaffId: a.assignedStaffId ?? actor.id,
              events: [
                ...(a.events ?? []),
                { id: `${a.id}-doc-verified-${documentId}`, type: 'document_verified' as const, byId: actor.id, byName: actor.name, time: now, details: `${doc.title} (${doc.type})` },
              ],
            } : a)
            : state.applications,
          notifications: [
            ...state.notifications,
            { id: `${documentId}-notif`, userId: doc.studentId, title: 'Document Verified', message: doc.title, type: 'success', time: now, read: false }
          ],
        }));
        emailNotifyUser(get, doc.studentId, {
          subject: `Document ready: ${doc.title} — The Way`,
          title: 'Your document is ready',
          intro: `Good news — your document "${doc.title}" has been verified and is ready.`,
          ctaLabel: 'Download from your dashboard',
          ctaPath: '/dashboard',
          outro: 'Log in to your dashboard to download your document.',
        }, { dedupeKey: `${documentId}-verified` });
        if (app) autoCompleteFromDocuments(app.id, actor.id, actor.name);
        queueBackendSave(get);
      },

      assignUniversity: (studentUserId: string, universityId: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['sales', 'ops', 'staff', 'agency_staff', 'ceo']);
        const app = get().applications.find(a => a.studentId === studentUserId);
        const source = app?.source ?? 'public';
        if (actor.role === 'sales' && source === 'agency') throw new Error('Forbidden');
        if (actor.role === 'ops' && source !== 'agency') throw new Error('Forbidden');
        const firstAssign = !app?.university;
        set((state) => ({
          users: state.users.map(u => u.id === studentUserId ? { ...u, assignedUniversityId: universityId } : u),
          applications: state.applications.map(a => a.studentId === studentUserId ? {
            ...a,
            university: universityId,
            events: [
              ...(a.events ?? []),
              { id: `${a.id}-uni-${Date.now()}`, type: 'university_set' as const, byId: actor.id, byName: actor.name, time: new Date().toISOString(), details: universityId },
            ],
          } : a),
          notifications: [
            ...state.notifications,
            { id: `${studentUserId}-uni`, userId: studentUserId, title: 'University Assigned', message: universityId, type: 'info', time: new Date().toISOString(), read: false }
          ],
        }));
        emailNotifyUser(get, studentUserId, {
          subject: 'University Assigned — The Way',
          title: 'Your university has been assigned',
          intro: `Your university has been set to ${getUniversityName(universityId)}.`,
          ctaLabel: 'View your application',
          ctaPath: '/dashboard',
          outro: 'Log in to your portal to see your university and next steps.',
        }, { dedupeKey: `${studentUserId}-uni-${universityId}` });
        if (firstAssign && actor.role !== 'staff') {
          set((state) => {
            const pointsLedger = appendLedger(state.pointsLedger, [{
              id: `act-uni-${studentUserId}`,
              userId: actor.id,
              delta: 1,
              reason: `Assigned university — ${getUniversityName(universityId)}`,
              kind: 'activity',
              at: new Date().toISOString(),
            }]);
            return ledgerPatch(state, pointsLedger);
          });
        }
        // PRD §9: selecting a university auto-assigns the mapped staff member.
        const targetApp = get().applications.find(a => a.studentId === studentUserId);
        if (targetApp && !targetApp.assignedStaffId) {
          const autoStaff = resolveAutoStaff(get().users, get().universityConfig, universityId);
          if (autoStaff) {
            set((state) => ({
              applications: state.applications.map(a => a.studentId === studentUserId ? {
                ...a,
                assignedStaffId: autoStaff.id,
                events: [
                  ...(a.events ?? []),
                  { id: `${a.id}-auto-assigned-${Date.now()}`, type: 'assigned_staff' as const, byId: actor.id, byName: 'Auto-assignment', time: new Date().toISOString(), details: autoStaff.id },
                ],
              } : a),
              notifications: [
                ...state.notifications,
                { id: `${studentUserId}-auto-assign-${autoStaff.id}`, userId: autoStaff.id, title: 'New Student Assigned', message: `${targetApp.name} — ${getUniversityName(universityId)}`, type: 'info', time: new Date().toISOString(), read: false, link: `/staff?student=${targetApp.id}` },
              ],
            }));
            emailNotifyUser(get, autoStaff.id, {
              subject: 'New student assigned — The Way',
              title: 'A new student was assigned to you',
              intro: `You have been assigned a new student: ${targetApp.name} (${getUniversityName(universityId)}).`,
              ctaLabel: 'Open your dashboard',
              ctaPath: '/staff',
              outro: 'Log in to review their application and documents.',
            }, { dedupeKey: `${studentUserId}-autoassign-${autoStaff.id}` });
          }
        }
        queueBackendSave(get);
      },
      
      assignStaffAdmin: (studentUserId: string, staffUserId: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        if (!get().users.some(u => u.id === staffUserId && u.role === 'staff')) throw new Error('Staff not found');
        const a = get().applications.find(x => x.studentId === studentUserId);
        set((state) => ({
          applications: state.applications.map(a0 => a0.studentId === studentUserId ? {
            ...a0,
            assignedStaffId: staffUserId,
            events: [
              ...(a0.events ?? []),
              { id: `${a0.id}-assigned-${staffUserId}-${Date.now()}`, type: 'assigned_staff' as const, byId: actor.id, byName: actor.name, time: new Date().toISOString(), details: staffUserId },
            ],
          } : a0),
          notifications: [
            ...state.notifications,
            { id: `${studentUserId}-assign`, userId: staffUserId, title: 'New Student Assigned', message: a?.name ?? 'New student', type: 'info', time: new Date().toISOString(), read: false, link: a ? `/staff?student=${a.id}` : '/staff' }
          ],
        }));
        emailNotifyUser(get, staffUserId, {
          subject: 'New student assigned — The Way',
          title: 'A new student was assigned to you',
          intro: `You have been assigned a new student: ${a?.name ?? 'New student'}.`,
          ctaLabel: 'Open your dashboard',
          ctaPath: '/staff',
          outro: 'Log in to review their application and documents.',
        }, { dedupeKey: `${studentUserId}-assign-${staffUserId}` });
      },

      salesAssignAdmin: (studentUserId: string, staffUserId: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['sales', 'ops', 'ceo']);
        if (!get().users.some(u => u.id === staffUserId && u.role === 'staff')) throw new Error('Staff not found');
        const app = get().applications.find(a => a.studentId === studentUserId);
        if (!app || app.status !== 'approved') throw new Error('Student not found or not approved');
        const source = app.source ?? 'public';
        if (actor.role === 'sales' && source === 'agency') throw new Error('Forbidden');
        if (actor.role === 'ops' && source !== 'agency') throw new Error('Forbidden');
        set((state) => ({
          applications: state.applications.map(a => a.studentId === studentUserId ? {
            ...a,
            assignedStaffId: staffUserId,
            events: [
              ...(a.events ?? []),
              { id: `${a.id}-assigned-${staffUserId}-${Date.now()}`, type: 'assigned_staff' as const, byId: actor.id, byName: actor.name, time: new Date().toISOString(), details: staffUserId },
            ],
          } : a),
        }));
      },

      setArrivalStatus: (applicationId: string, arrived: boolean) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['staff', 'ceo', 'agency_staff']);
        set((state) => ({
          applications: state.applications.map(a => a.id === applicationId ? {
            ...a,
            arrived,
            events: [
              ...(a.events ?? []),
              { id: `${a.id}-arrived-${Date.now()}`, type: 'arrival_set' as const, byId: actor.id, byName: actor.name, time: new Date().toISOString(), details: arrived ? 'Arrived' : 'Not arrived' },
            ],
          } : a),
        }));
      },

      staffUpdateStudentProfile: (studentUserId: string, updates: Partial<Pick<User, 'name' | 'email' | 'phone' | 'passportExpiry' | 'visaExpiry' | 'residenceExpiry'>>) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['staff', 'ceo']);

        const student = get().users.find(u => u.id === studentUserId);
        if (!student || student.role !== 'student') throw new Error('Student not found');
        const lockedUpdates = actor.role === 'ceo'
          ? updates
          : {
            passportExpiry: updates.passportExpiry,
            visaExpiry: updates.visaExpiry,
            residenceExpiry: updates.residenceExpiry,
          };

        set((state) => ({
          users: state.users.map(u => u.id === studentUserId ? { ...u, ...lockedUpdates } : u),
          applications: state.applications.map(a => a.studentId === studentUserId ? {
            ...a,
            ...(actor.role === 'ceo' ? {
              name: updates.name ?? a.name,
              email: updates.email ?? a.email,
              phone: updates.phone ?? a.phone,
            } : {}),
            events: [
              ...(a.events ?? []),
              ...(actor.role === 'ceo' && (updates.name || updates.email || updates.phone)
                ? [{ id: `${a.id}-identity-${Date.now()}`, type: 'identity_updated' as const, byId: actor.id, byName: actor.name, time: new Date().toISOString(), details: 'Identity/contact updated' }]
                : []),
            ],
          } : a),
        }));
      },

      ceoCreateUser: async (user: User) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        const supabase = getSupabase();
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        if (!token) throw new Error('Not authenticated');
        const resp = await fetch('/api/admin-create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            email: user.email,
            ...(user.password ? { password: user.password } : {}),
            ...(user.username ? { username: user.username } : {}),
            role: user.role,
            name: user.name,
            ...(user.phone ? { phone: user.phone } : {}),
          }),
        });
        const json = (await resp.json()) as { id?: unknown; username?: unknown; email?: unknown; role?: unknown; name?: unknown; password?: unknown; error?: unknown };
        if (!resp.ok || !json || typeof json.id !== 'string') {
          throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to create user');
        }
        const created: User = {
          ...user,
          id: json.id,
          username: typeof json.username === 'string' ? json.username : user.username,
          email: typeof json.email === 'string' ? json.email : user.email,
          role: (typeof json.role === 'string' ? json.role : user.role) as UserRole,
          name: typeof json.name === 'string' ? json.name : user.name,
          password: typeof json.password === 'string' ? json.password : user.password,
          createdAt: new Date().toISOString(),
        };
        await get().refreshUsersFromBackend();
        return created;
      },

      ceoUpdateUser: (userId: string, updates: Partial<User>) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        const patch: Record<string, unknown> = {};
        if (typeof updates.name === 'string') patch.name = updates.name;
        if (typeof updates.username === 'string') patch.username = updates.username;
        if (typeof updates.role === 'string') patch.role = updates.role;
        void (async () => {
          const supabase = tryGetSupabase();
          if (!supabase) return;
          const token = (await supabase.auth.getSession()).data.session?.access_token;
          if (!token) return;
          await fetch('/api/admin-update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ userId, ...patch }),
          });
          await get().refreshUsersFromBackend();
        })();
      },

      ceoResetCredentials: async (userId: string, updates: Partial<Pick<User, 'username' | 'password' | 'email'>>) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        const supabase = getSupabase();
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        if (!token) throw new Error('Not authenticated');
        const resp = await fetch('/api/admin-reset-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ userId, username: updates.username, password: updates.password, email: updates.email }),
        });
        const json = (await resp.json()) as { ok?: unknown; error?: unknown };
        if (!resp.ok) {
          throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to reset');
        }
        await get().refreshUsersFromBackend();
      },

      ceoCreateAgencyAccount: async (name: string, email: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        const user: User = {
          id: '',
          username: '',
          role: 'agency',
          name,
          email,
          points: 0,
          createdAt: new Date().toISOString(),
        };
        const created = await get().ceoCreateUser(user);
        return created;
      },

      ceoTrashApplication: (applicationId: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        const app = get().applications.find(a => a.id === applicationId);
        if (!app) throw new Error('Application not found');
        const trashed: Application = { ...app, trashedAt: new Date().toISOString(), trashedByName: actor.name };
        set((state) => ({
          applications: state.applications.filter(a => a.id !== applicationId),
          trashedApplications: [trashed, ...state.trashedApplications.filter(a => a.id !== applicationId)],
        }));
        queueBackendSave(get);
      },

      ceoRestoreApplication: (applicationId: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        const app = get().trashedApplications.find(a => a.id === applicationId);
        if (!app) throw new Error('Application not found in trash');
        const restored: Application = { ...app, trashedAt: undefined, trashedByName: undefined };
        set((state) => ({
          trashedApplications: state.trashedApplications.filter(a => a.id !== applicationId),
          applications: [restored, ...state.applications.filter(a => a.id !== applicationId)],
        }));
        queueBackendSave(get);
      },

      ceoPurgeApplication: (applicationId: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        set((state) => ({
          trashedApplications: state.trashedApplications.filter(a => a.id !== applicationId),
          // Tombstone: the server merge drops this id everywhere, forever.
          purgedApplicationIds: state.purgedApplicationIds.includes(applicationId)
            ? state.purgedApplicationIds
            : [...state.purgedApplicationIds, applicationId],
        }));
        queueBackendSave(get);
      },

      ceoRestoreFutureLead: (applicationId: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        const app = get().futureLeads.find(a => a.id === applicationId);
        if (!app) throw new Error('Lead not found');
        const restored: Application = {
          ...app,
          status: 'submitted',
          stage: 'applied',
          rejectedAt: undefined,
          rejectedReason: undefined,
          archivedAt: undefined,
        };
        set((state) => ({
          futureLeads: state.futureLeads.filter(a => a.id !== applicationId),
          applications: [restored, ...state.applications.filter(a => a.id !== applicationId)],
        }));
        queueBackendSave(get);
      },

      ceoDeleteFutureLead: (applicationId: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        set((state) => ({
          futureLeads: state.futureLeads.filter(a => a.id !== applicationId),
          purgedApplicationIds: state.purgedApplicationIds.includes(applicationId)
            ? state.purgedApplicationIds
            : [...state.purgedApplicationIds, applicationId],
        }));
        queueBackendSave(get);
      },

      ceoDisableUser: async (userId: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        if (userId === actor.id) throw new Error('You cannot disable your own account');
        const target = get().users.find(u => u.id === userId);
        const supabase = getSupabase();
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        if (!token) throw new Error('Not authenticated');
        const resp = await fetch('/api/admin-user-lifecycle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ userId, action: 'disable' }),
        });
        const json = (await resp.json()) as { ok?: unknown; error?: unknown };
        if (!resp.ok) throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to disable account');
        if (target) {
          const snapshot: TrashedUser = {
            id: target.id,
            username: target.username,
            name: target.name,
            email: target.email,
            role: target.role,
            trashedAt: new Date().toISOString(),
            trashedByName: actor.name,
          };
          set((state) => ({ trashedUsers: [snapshot, ...state.trashedUsers.filter(u => u.id !== userId)] }));
        }
        queueBackendSave(get);
      },

      ceoRestoreUser: async (userId: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        const supabase = getSupabase();
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        if (!token) throw new Error('Not authenticated');
        const resp = await fetch('/api/admin-user-lifecycle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ userId, action: 'enable' }),
        });
        const json = (await resp.json()) as { ok?: unknown; error?: unknown };
        if (!resp.ok) throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to restore account');
        set((state) => ({
          trashedUsers: state.trashedUsers.filter(u => u.id !== userId),
          unTrashedUserIds: state.unTrashedUserIds.includes(userId) ? state.unTrashedUserIds : [...state.unTrashedUserIds, userId],
        }));
        await get().refreshUsersFromBackend();
        queueBackendSave(get);
      },

      ceoPurgeUser: async (userId: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        if (userId === actor.id) throw new Error('You cannot delete your own account');
        const supabase = getSupabase();
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        if (!token) throw new Error('Not authenticated');
        const resp = await fetch('/api/admin-user-lifecycle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ userId, action: 'delete' }),
        });
        const json = (await resp.json()) as { ok?: unknown; error?: unknown };
        if (!resp.ok) throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to delete account');
        set((state) => ({
          trashedUsers: state.trashedUsers.filter(u => u.id !== userId),
          users: state.users.filter(u => u.id !== userId),
          unTrashedUserIds: state.unTrashedUserIds.includes(userId) ? state.unTrashedUserIds : [...state.unTrashedUserIds, userId],
        }));
        queueBackendSave(get);
      },

      agencyRequestCredentialChange: (applicationId: string, reason: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['agency']);
        const app = get().applications.find(a => a.id === applicationId);
        if (!app) throw new Error('Application not found');
        if ((app.source ?? 'public') !== 'agency' || app.agencyId !== actor.id) throw new Error('Forbidden');
        if (!app.studentId) throw new Error('Student account not created yet');
        const trimmed = reason.trim();
        if (!trimmed) throw new Error('Please add a reason for the change');
        const existingPending = get().credentialRequests.find(r => r.applicationId === applicationId && r.status === 'pending');
        if (existingPending) throw new Error('A request for this student is already pending');
        const now = new Date().toISOString();
        const req: CredentialRequest = {
          id: `credreq-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          applicationId,
          studentId: app.studentId,
          studentName: app.name,
          agencyId: actor.id,
          agencyName: actor.name,
          reason: trimmed,
          status: 'pending',
          createdAt: now,
        };
        const ceoUsers = get().users.filter(u => u.role === 'ceo');
        set((state) => ({
          credentialRequests: [req, ...state.credentialRequests],
          notifications: [
            ...state.notifications,
            ...ceoUsers.map(u => ({
              id: `${req.id}-notify-${u.id}`,
              userId: u.id,
              title: 'Credential change requested',
              message: `${actor.name} requested new login credentials for ${app.name}`,
              type: 'alert' as const,
              time: now,
              read: false,
              link: '/admin?tab=requests',
            })),
          ],
        }));
        ceoUsers.forEach(u => emailNotifyUser(get, u.id, {
          subject: 'Credential change requested — The Way',
          title: 'An agency requested a credential change',
          intro: `${actor.name} requested new login credentials for their student "${app.name}". Reason: ${trimmed}`,
          ctaLabel: 'Review in admin',
          ctaPath: '/admin',
          outro: 'Open the admin dashboard to approve or decline the request.',
        }, { dedupeKey: `${req.id}-ceo-${u.id}` }));
        queueBackendSave(get);
      },

      ceoResolveCredentialRequest: async (requestId: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        const req = get().credentialRequests.find(r => r.id === requestId);
        if (!req) throw new Error('Request not found');
        if (req.status !== 'pending') throw new Error('Request already handled');
        const app = get().applications.find(a => a.id === req.applicationId);
        const username = app?.studentCredentials?.username
          ?? get().users.find(u => u.id === req.studentId)?.username
          ?? '';
        const newPassword = generateStudentCredentials().password;
        // Reset the student's password via the admin endpoint (keeps username).
        await get().ceoResetCredentials(req.studentId, { password: newPassword });
        const now = new Date().toISOString();
        set((state) => ({
          applications: state.applications.map(a => a.id === req.applicationId
            ? { ...a, studentCredentials: { username, updatedAt: now } }
            : a),
          credentialRequests: state.credentialRequests.map(r => r.id === requestId
            ? { ...r, status: 'resolved' as const, resolvedAt: now, resolvedByName: actor.name }
            : r),
          notifications: [
            ...state.notifications,
            { id: `${requestId}-resolved`, userId: req.agencyId, title: 'Credentials updated', message: `New login credentials are ready for ${req.studentName}`, type: 'success' as const, time: now, read: false },
          ],
        }));
        // Email the agency the new credentials (the agency manages the student's access).
        const agency = get().users.find(u => u.id === req.agencyId);
        if (agency?.email) {
          const html = renderBrandedEmail({
            title: 'Updated student credentials',
            greeting: `Dear ${agency.name},`,
            intro: `The login credentials for your student "${req.studentName}" have been updated as requested.`,
            credentials: { username, password: newPassword },
            ctaLabel: 'Open your portal',
            ctaUrl: `${SITE_URL}/agencies`,
            note: 'Please share these with your student securely. The previous password no longer works.',
          });
          const text = `Updated credentials for ${req.studentName}\nUsername: ${username}\nPassword: ${newPassword}`;
          void sendMail({ to: agency.email, subject: 'Updated student credentials — The Way', text, html });
        }
        queueBackendSave(get);
      },

      ceoRejectCredentialRequest: (requestId: string, note?: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        const req = get().credentialRequests.find(r => r.id === requestId);
        if (!req) throw new Error('Request not found');
        if (req.status !== 'pending') throw new Error('Request already handled');
        const now = new Date().toISOString();
        set((state) => ({
          credentialRequests: state.credentialRequests.map(r => r.id === requestId
            ? { ...r, status: 'rejected' as const, resolvedAt: now, resolvedByName: actor.name, resolutionNote: note?.trim() || undefined }
            : r),
          notifications: [
            ...state.notifications,
            { id: `${requestId}-rejected`, userId: req.agencyId, title: 'Credential request declined', message: `Your credential change request for ${req.studentName} was declined${note ? `: ${note}` : ''}`, type: 'info' as const, time: now, read: false },
          ],
        }));
        emailNotifyUser(get, req.agencyId, {
          subject: 'Credential request declined — The Way',
          title: 'Your credential request was declined',
          intro: `Your request to change the login credentials for "${req.studentName}" was declined${note?.trim() ? `: ${note.trim()}` : '.'}`,
          ctaLabel: 'Open your portal',
          ctaPath: '/agencies',
        }, { dedupeKey: `${requestId}-rejected` });
        queueBackendSave(get);
      },

      addAppointment: (appt: Omit<Appointment, 'id'>) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        if (actor.role === 'student' && appt.userId !== actor.id) throw new Error('Forbidden');
        const apptId = Date.now().toString();
        set((state) => ({ appointments: [...state.appointments, { ...appt, id: apptId }] }));
        // Notify the person the appointment is for (skip if they created it themselves).
        if (appt.userId && appt.userId !== actor.id) {
          const whenLabel = [appt.date, appt.time].filter(Boolean).join(' at ');
          emailNotifyUser(get, appt.userId, {
            subject: 'Your appointment is confirmed — The Way',
            title: 'Your appointment is confirmed',
            intro: `Your appointment${appt.title ? ` "${appt.title}"` : ''} has been scheduled${whenLabel ? ` for ${whenLabel}` : ''}.`,
            ctaLabel: 'View your appointments',
            ctaPath: '/appointments',
            outro: 'Log in to your portal to view or manage your appointments.',
          }, { dedupeKey: `${apptId}-appt` });
        }
        queueBackendSave(get);
      },

      markChatThreadRead: (threadKey: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        const key = `${actor.id}|${threadKey}`;
        const notifyKey = `${threadKey}|${actor.id}`;
        set((state) => {
          const nextNotify = { ...state.chatEmailNotify };
          delete nextNotify[notifyKey];
          return {
            chatThreadReadAt: { ...state.chatThreadReadAt, [key]: new Date().toISOString() },
            chatEmailNotify: nextNotify,
          };
        });
        queueBackendSave(get);
      },

      checkChatReminders: () => {
        const DAY = 24 * 60 * 60 * 1000;
        const now = Date.now();
        const state = get();
        const pending = state.chatEmailNotify ?? {};
        const nextNotify: Record<string, { firstAt: string; reminded: boolean }> = { ...pending };
        let changed = false;

        for (const [key, info] of Object.entries(pending)) {
          // key = `${threadKey}|${recipientId}` where threadKey itself contains '|'
          const sep = key.lastIndexOf('|');
          if (sep < 0) { delete nextNotify[key]; changed = true; continue; }
          const recipientId = key.slice(sep + 1);
          const threadKey = key.slice(0, sep);

          // Latest message addressed to the recipient in this thread.
          const latest = state.chatMessages
            .filter(m => m.toUserId === recipientId &&
              `${m.applicationId ?? 'direct'}|${[m.userId, m.toUserId].sort().join('|')}` === threadKey)
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())[0];
          if (!latest) { delete nextNotify[key]; changed = true; continue; }

          const readAt = state.chatThreadReadAt[`${recipientId}|${threadKey}`];
          const stillUnread = !readAt || new Date(latest.time).getTime() > new Date(readAt).getTime();
          if (!stillUnread) { delete nextNotify[key]; changed = true; continue; }

          if (!info.reminded && now - new Date(info.firstAt).getTime() >= DAY) {
            const recipient = state.users.find(u => u.id === recipientId);
            if (recipient) {
              emailNotifyUser(get, recipientId, {
                subject: 'Reminder: you have an unread message — The Way',
                title: 'You still have an unread message',
                intro: 'You have a message on The Way platform that you haven\'t read yet.',
                ctaLabel: 'Open your messages',
                ctaPath: chatPathForRole(recipient.role),
                outro: 'This is a one-time reminder. Log in to read and reply.',
              }, { dedupeKey: `chat-reminder-${key}` });
            }
            nextNotify[key] = { ...info, reminded: true };
            changed = true;
          }
        }

        if (changed) {
          set({ chatEmailNotify: nextNotify });
          queueBackendSave(get);
        }
      },

      requestMoreInfo: (applicationId: string, message: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ops', 'ceo']);
        const app = get().applications.find(a => a.id === applicationId);
        if (!app) throw new Error('Application not found');
        if ((app.source ?? 'public') !== 'agency') throw new Error('Only agency applications support requests');
        if (app.status !== 'submitted') throw new Error('Only submitted applications can be requested');
        if (!app.agencyId) throw new Error('Agency not found');

        const now = new Date().toISOString();
        set((state) => ({
          applications: state.applications.map(a => a.id === applicationId ? {
            ...a,
            hold: { message, byId: actor.id, byName: actor.name, time: now },
            internalNotes: [
              ...(a.internalNotes ?? []),
              { id: `${applicationId}-needs-info-${Date.now()}`, author: actor.id, authorName: actor.name, text: `Needs info:\n${message}`, createdAt: now },
            ],
            events: [
              ...(a.events ?? []),
              { id: `${applicationId}-needs-info-${Date.now()}`, type: 'needs_info' as const, byId: actor.id, byName: actor.name, time: now, details: message },
            ],
          } : a),
          notifications: [
            ...state.notifications,
            { id: `${applicationId}-agency-needs-info`, userId: app.agencyId!, title: 'More info required', message, type: 'alert', time: now, read: false },
          ],
        }));
        emailNotifyUser(get, app.agencyId, {
          subject: 'Action required: more info needed — The Way',
          title: 'More information is required',
          intro: `Additional information is required for the application of ${app.name}: ${message}`,
          ctaLabel: 'Respond in your portal',
          ctaPath: '/agencies',
          note: 'Please respond as soon as possible so we can continue processing this application.',
        }, { dedupeKey: `${applicationId}-needs-info` });
      },

      agencyAddExtraDocs: (applicationId: string, files: string[]) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['agency']);
        const app = get().applications.find(a => a.id === applicationId);
        if (!app) throw new Error('Application not found');
        if ((app.source ?? 'public') !== 'agency') throw new Error('Only agency applications support this');
        if (app.agencyId !== actor.id) throw new Error('Forbidden');
        if (app.status !== 'submitted') throw new Error('Only submitted applications can be updated');
        if (!files.length) return;

        const now = new Date().toISOString();
        const opsUsers = get().users.filter(u => u.role === 'ops');
        const ceoUsers = get().users.filter(u => u.role === 'ceo');
        set((state) => ({
          applications: state.applications.map(a => a.id === applicationId ? {
            ...a,
            intakeExtraDocs: [ ...(a.intakeExtraDocs ?? []), ...files ],
            events: [
              ...(a.events ?? []),
              { id: `${a.id}-extra-docs-${Date.now()}`, type: 'extra_docs_added' as const, byId: actor.id, byName: actor.name, time: now, details: `${files.length} file(s)` },
            ],
          } : a),
          notifications: [
            ...state.notifications,
            ...[...opsUsers, ...ceoUsers].map(u => ({
              id: `${applicationId}-extra-docs-notify-${u.id}-${Date.now()}`,
              userId: u.id,
              title: 'Agency added documents',
              message: `${app.name} • ${files.length} new file(s)`,
              type: 'info' as const,
              time: now,
              read: false,
            })),
          ],
        }));
      },

      addChatMessage: (toUserId: string, text: string, applicationId?: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        const toUser = get().users.find(u => u.id === toUserId);
        if (!toUser) throw new Error('Recipient not found');

        if (actor.role === 'student') {
          if (toUser.role === 'ceo') {
            applicationId = applicationId ?? `complaint-${actor.id}`;
          } else {
            const app = get().applications.find(a => a.studentId === actor.id);
            if (!app?.assignedStaffId || app.assignedStaffId !== toUserId) throw new Error('You can only message your assigned admin');
            applicationId = applicationId ?? app.id;
          }
        } else if (actor.role === 'staff' || actor.role === 'agency_staff') {
          if (toUser.role === 'agency') {
            if (!applicationId) throw new Error('Thread required');
            const app = get().applications.find(a => a.id === applicationId);
            if (!app || (app.source ?? 'public') !== 'agency') throw new Error('Application not found');
            if (!app.assignedStaffId || app.assignedStaffId !== actor.id) throw new Error('Forbidden');
            if (!app.agencyId || app.agencyId !== toUserId) throw new Error('Forbidden');
          } else {
            if (toUser.role !== 'student') throw new Error('Staff can only message students');
            const app = get().applications.find(a => a.studentId === toUserId);
            if (!app?.assignedStaffId || app.assignedStaffId !== actor.id) throw new Error('This student is not assigned to you');
            applicationId = applicationId ?? app.id;
          }
        } else if (actor.role === 'sales') {
          // Sales can message students (their approved apps), staff, ops, and CEO
          if (toUser.role === 'student') {
            applicationId = applicationId ?? get().applications.find(a => a.studentId === toUserId && (a.source ?? 'public') === 'public')?.id;
          }
        } else if (actor.role === 'agency') {
          if (!applicationId) throw new Error('Thread required');
          const app = get().applications.find(a => a.id === applicationId);
          if (!app || (app.source ?? 'public') !== 'agency') throw new Error('Application not found');
          if (app.agencyId !== actor.id) throw new Error('Forbidden');
          if (!app.assignedStaffId || app.assignedStaffId !== toUserId) throw new Error('You can only message the assigned admin');
          if (toUser.role !== 'staff' && toUser.role !== 'agency_staff') throw new Error('Recipient must be an admin');
        } else if (actor.role === 'ops') {
          // Ops can message agencies, staff, sales, and CEO
          if (toUser.role === 'student') {
            applicationId = applicationId ?? get().applications.find(a => a.studentId === toUserId && a.source === 'agency')?.id;
          }
        } else if (actor.role === 'ceo') {
          if (toUser.role === 'student') {
            applicationId = applicationId ?? `complaint-${toUserId}`;
          }
        }
        const msg: ChatMessage = { id: Date.now().toString(), userId: actor.id, toUserId, applicationId, text, time: new Date().toISOString() };
        set((state) => ({ chatMessages: [...state.chatMessages, msg] }));
        const threadKey = `${applicationId ?? 'direct'}|${[actor.id, toUserId].sort().join('|')}`;
        const readKey = `${actor.id}|${threadKey}`;
        set((state) => ({ chatThreadReadAt: { ...state.chatThreadReadAt, [readKey]: msg.time } }));
        // Email the recipient ONCE per unread thread. Follow-up messages while
        // the thread is still unread do not send more emails; a single reminder
        // is sent ~1 day later (see checkChatReminders) if still unread. Reading
        // the thread clears the state (in markChatThreadRead) so the next new
        // message can notify again.
        const notifyKey = `${threadKey}|${toUserId}`;
        if (!get().chatEmailNotify[notifyKey]) {
          const ctaPath = chatPathForRole(toUser.role);
          emailNotifyUser(get, toUserId, {
            subject: 'You have a new message — The Way',
            title: 'You have a new message',
            intro: `${actor.name} sent you a new message on The Way platform.`,
            ctaLabel: 'Open your messages',
            ctaPath,
            outro: 'Log in to read and reply to your messages.',
          }, { dedupeKey: `chat-${threadKey}` });
          set((state) => ({
            chatEmailNotify: { ...state.chatEmailNotify, [notifyKey]: { firstAt: msg.time, reminded: false } },
          }));
        }
        get().checkChatReminders();
        queueBackendSave(get);
      },

      checkExpiries: () => {
        const now = new Date();
        const daysUntil = (dateStr?: string) => {
          if (!dateStr) return null;
          const d = new Date(dateStr);
          if (Number.isNaN(d.getTime())) return null;
          const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return diff > 0 ? Math.floor(diff) : null;
        };
        const current = get().currentUser;
        if (!current || current.role !== 'student') return;

        const alreadyNotified = (key: string) =>
          get().notifications.some(n => n.userId === current.id && n.title.includes(key) &&
            (now.getTime() - new Date(n.time).getTime()) < 1000 * 60 * 60 * 12);

        const push = (title: string, message: string) => {
          set((state) => ({
            notifications: [
              ...state.notifications,
              { id: `expiry-${Date.now()}`, userId: current.id, title, message, type: 'alert' as const, time: new Date().toISOString(), read: false }
            ]
          }));
          queueBackendSave(get);
        };

        const visaDays = daysUntil(current.visaExpiry);
        if (visaDays !== null && visaDays <= 60 && !alreadyNotified('Visa Expiry')) {
          const msg = `Your visa expires in ${visaDays} day${visaDays === 1 ? '' : 's'} (${current.visaExpiry}). Please renew as soon as possible.`;
          push('Visa Expiry Warning', msg);
          if (current.email) {
            const html = renderBrandedEmail({
              title: 'Visa expiry reminder',
              greeting: `Dear ${current.name},`,
              intro: msg,
              ctaLabel: 'Open your dashboard',
              ctaUrl: `${SITE_URL}/dashboard`,
              note: 'If you need help with your renewal, reply to this email and our team will assist you.',
            });
            void sendMail({ to: current.email, subject: 'Visa Expiry Reminder — The Way', text: msg, html });
          }
        }

        const residenceDays = daysUntil(current.residenceExpiry);
        if (residenceDays !== null && residenceDays <= 60 && !alreadyNotified('Residence')) {
          const msg = `Your residence permit expires in ${residenceDays} day${residenceDays === 1 ? '' : 's'} (${current.residenceExpiry}). Please renew as soon as possible.`;
          push('Residence Permit Expiry Warning', msg);
          if (current.email) {
            const html = renderBrandedEmail({
              title: 'Residence permit reminder',
              greeting: `Dear ${current.name},`,
              intro: msg,
              ctaLabel: 'Open your dashboard',
              ctaUrl: `${SITE_URL}/dashboard`,
              note: 'If you need help with your renewal, reply to this email and our team will assist you.',
            });
            void sendMail({ to: current.email, subject: 'Residence Permit Reminder — The Way', text: msg, html });
          }
        }
      },

      staffRequestDocument: (studentId: string, applicationId: string | undefined, title: string, description?: string, target?: 'student' | 'agency') => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['staff', 'agency_staff', 'ceo', 'sales', 'ops']);
        const app = applicationId
          ? get().applications.find(a => a.id === applicationId)
          : get().applications.find(a => a.studentId === studentId);
        const effectiveTarget: 'student' | 'agency' = target
          ?? (((app?.source ?? 'public') === 'agency' && app?.agencyId) ? 'agency' : 'student');
        const agencyId = effectiveTarget === 'agency' ? app?.agencyId : undefined;
        if (effectiveTarget === 'agency' && !agencyId) throw new Error('This application has no agency to request from');
        const req: DocumentRequest = {
          id: `docreq-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          studentId,
          applicationId: applicationId ?? app?.id,
          title: title.trim(),
          description: description?.trim(),
          requestedBy: actor.id,
          requestedByName: actor.name,
          createdAt: new Date().toISOString(),
          status: 'pending',
          target: effectiveTarget,
          ...(agencyId ? { agencyId } : {}),
        };
        const recipientId = effectiveTarget === 'agency' ? agencyId! : studentId;
        set((state) => ({
          documentRequests: [...state.documentRequests, req],
          notifications: [
            ...state.notifications,
            {
              id: `docreq-notif-${req.id}`,
              userId: recipientId,
              title: 'Document Requested',
              message: effectiveTarget === 'agency'
                ? `Documents requested for ${app?.name ?? 'your student'}: "${title}". Please upload in your portal.`
                : `Your advisor has requested: "${title}". Please upload it in your portal.`,
              type: 'info' as const,
              time: new Date().toISOString(),
              read: false,
              link: effectiveTarget === 'agency' ? '/agencies' : '/dashboard',
            },
          ],
        }));
        emailNotifyUser(get, recipientId, {
          subject: 'Action needed: document required — The Way',
          title: 'A document was requested',
          intro: effectiveTarget === 'agency'
            ? `The following document was requested for your student ${app?.name ?? ''}: "${title}"${description ? ` — ${description}` : ''}.`
            : `Your advisor has requested the following document: "${title}"${description ? ` — ${description}` : ''}.`,
          ctaLabel: 'Upload in your portal',
          ctaPath: effectiveTarget === 'agency' ? '/agencies' : '/dashboard',
          note: 'Please upload this document as soon as possible so we can continue processing the application.',
        }, { dedupeKey: `${req.id}-request` });
        queueBackendSave(get);
      },

      studentFulfillRequest: (requestId: string, fileUrl: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        const req = get().documentRequests.find(r => r.id === requestId);
        if (!req) throw new Error('Request not found');
        if (req.studentId !== actor.id) throw new Error('Forbidden');
        set((state) => ({
          documentRequests: state.documentRequests.map(r =>
            r.id === requestId ? { ...r, status: 'uploaded' as const, fulfilledFile: fileUrl, fulfilledAt: new Date().toISOString(), uploadedByName: actor.name } : r
          ),
          notifications: [
            ...state.notifications,
            {
              id: `docreq-fulfilled-${requestId}-${Date.now()}`,
              userId: req.requestedBy,
              title: 'Document Uploaded',
              message: `Student uploaded the requested document: "${req.title}"`,
              type: 'success' as const,
              time: new Date().toISOString(),
              read: false,
              link: req.applicationId ? `/staff?student=${req.applicationId}` : '/staff',
            },
          ],
        }));
        emailNotifyUser(get, req.requestedBy, {
          subject: 'Requested document uploaded — The Way',
          title: 'A requested document was uploaded',
          intro: `${actor.name} uploaded the document you requested: "${req.title}".`,
          ctaLabel: 'Review in your dashboard',
          ctaPath: '/staff',
          outro: 'Log in to review and approve the document.',
        }, { dedupeKey: `${requestId}-fulfilled-${Date.now()}` });
        queueBackendSave(get);
      },

      agentFulfillRequest: (requestId: string, fileUrl: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['agency']);
        const req = get().documentRequests.find(r => r.id === requestId);
        if (!req) throw new Error('Request not found');
        if (req.target !== 'agency' || req.agencyId !== actor.id) throw new Error('Forbidden');
        if (req.status === 'approved') throw new Error('This request is already approved');
        set((state) => ({
          documentRequests: state.documentRequests.map(r =>
            r.id === requestId ? { ...r, status: 'uploaded' as const, fulfilledFile: fileUrl, fulfilledAt: new Date().toISOString(), uploadedByName: actor.name } : r
          ),
          notifications: [
            ...state.notifications,
            {
              id: `docreq-agent-uploaded-${requestId}-${Date.now()}`,
              userId: req.requestedBy,
              title: 'Requested Document Uploaded',
              message: `${actor.name} uploaded: "${req.title}"`,
              type: 'success' as const,
              time: new Date().toISOString(),
              read: false,
              link: req.applicationId ? `/staff?student=${req.applicationId}` : '/staff',
            },
          ],
        }));
        emailNotifyUser(get, req.requestedBy, {
          subject: 'Requested document uploaded — The Way',
          title: 'A requested document was uploaded',
          intro: `${actor.name} uploaded the document you requested: "${req.title}".`,
          ctaLabel: 'Review in your dashboard',
          ctaPath: '/staff',
          outro: 'Log in to approve or reject the document.',
        }, { dedupeKey: `${requestId}-agent-uploaded-${Date.now()}` });
        queueBackendSave(get);
      },

      reviewDocumentRequest: (requestId: string, decision: 'approved' | 'rejected' | 'reupload', note?: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['staff', 'agency_staff', 'ops', 'ceo']);
        const req = get().documentRequests.find(r => r.id === requestId);
        if (!req) throw new Error('Request not found');
        if (req.status !== 'uploaded' && req.status !== 'fulfilled') throw new Error('Nothing to review — no upload yet');
        const now = new Date().toISOString();
        const uploaderId = req.target === 'agency' ? req.agencyId : req.studentId;
        const file = req.fulfilledFile;

        if (decision === 'approved') {
          set((state) => ({
            documentRequests: state.documentRequests.map(r => r.id === requestId
              ? { ...r, status: 'approved' as const, reviewedAt: now, reviewedByName: actor.name, reviewNote: note?.trim() || undefined }
              : r),
            // Approved files automatically appear in the student application (PRD §8).
            applications: file ? state.applications.map(a => (a.id === req.applicationId || (!req.applicationId && a.studentId === req.studentId)) ? {
              ...a,
              intakeExtraDocs: (a.intakeExtraDocs ?? []).includes(file) ? a.intakeExtraDocs : [...(a.intakeExtraDocs ?? []), file],
              events: [
                ...(a.events ?? []),
                { id: `${a.id}-docreq-approved-${Date.now()}`, type: 'extra_docs_added' as const, byId: actor.id, byName: actor.name, time: now, details: `Approved requested document: ${req.title}` },
              ],
            } : a) : state.applications,
            documents: (file && req.studentId && state.users.some(u => u.id === req.studentId))
              ? [...state.documents, {
                  id: `docreq-doc-${requestId}`,
                  studentId: req.studentId,
                  title: req.title,
                  type: 'requested-document',
                  status: 'verified' as const,
                  uploadedAt: now,
                  uploadedBy: actor.id,
                  file,
                }].filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i)
              : state.documents,
            notifications: uploaderId ? [
              ...state.notifications,
              { id: `docreq-approved-${requestId}`, userId: uploaderId, title: 'Document Approved', message: `"${req.title}" was approved.`, type: 'success' as const, time: now, read: false },
            ] : state.notifications,
          }));
        } else {
          const backToPending = decision === 'reupload';
          set((state) => ({
            documentRequests: state.documentRequests.map(r => r.id === requestId
              ? {
                  ...r,
                  status: (backToPending ? 'pending' : 'rejected') as DocumentRequestStatus,
                  reviewedAt: now,
                  reviewedByName: actor.name,
                  reviewNote: note?.trim() || undefined,
                  ...(backToPending ? { fulfilledFile: undefined, fulfilledAt: undefined, reuploadCount: (r.reuploadCount ?? 0) + 1 } : {}),
                }
              : r),
            notifications: uploaderId ? [
              ...state.notifications,
              {
                id: `docreq-${decision}-${requestId}-${Date.now()}`,
                userId: uploaderId,
                title: backToPending ? 'Re-upload Requested' : 'Document Rejected',
                message: `"${req.title}"${note?.trim() ? ` — ${note.trim()}` : ''}`,
                type: 'alert' as const,
                time: now,
                read: false,
              },
            ] : state.notifications,
          }));
        }
        if (uploaderId) {
          emailNotifyUser(get, uploaderId, {
            subject: `Document ${decision === 'approved' ? 'approved' : decision === 'rejected' ? 'rejected' : 're-upload requested'} — The Way`,
            title: decision === 'approved' ? 'Your document was approved' : decision === 'rejected' ? 'Your document was rejected' : 'Please re-upload a document',
            intro: `"${req.title}"${note?.trim() ? ` — ${note.trim()}` : ''}`,
            ctaLabel: 'Open your portal',
            ctaPath: req.target === 'agency' ? '/agencies' : '/dashboard',
          }, { dedupeKey: `${requestId}-${decision}-${Date.now()}` });
        }
        queueBackendSave(get);
      },

      // ── Case pipeline actions ────────────────────────────────────────────

      grantStagePermission: (applicationId: string, stage: PipelineStageId) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['agency', 'sales', 'ceo']);
        const app = get().applications.find(a => a.id === applicationId);
        if (!app?.pipeline) throw new Error('Application has no active case');
        if (app.pipeline.status !== 'processing') throw new Error('Case is not in processing');
        const meta = getStageMeta(stage);
        if (!meta.permissionGated) throw new Error('This stage does not need permission');
        if (actor.role === 'agency' && app.agencyId !== actor.id) throw new Error('Forbidden');
        if (app.pipeline.current !== stage) throw new Error(`Permission can only be granted for the current stage (${getStageMeta(app.pipeline.current as PipelineStageId)?.label ?? app.pipeline.current})`);
        const track = app.pipeline.stages[stage] ?? {};
        if (track.permissionAt) throw new Error('Permission was already granted');
        // PRD §2: Recognition stays blocked until the high-school certificate exists.
        if (stage === 'recognition_letter' && !app.intakeHighSchoolCertificate) {
          throw new Error('Recognition is blocked: the high school certificate has not been uploaded yet');
        }
        const now = new Date().toISOString();
        set((state) => ({
          applications: state.applications.map(a => (a.id === applicationId && a.pipeline) ? {
            ...a,
            pipeline: {
              ...a.pipeline,
              stages: {
                ...a.pipeline.stages,
                [stage]: { ...track, permissionAt: now, permissionById: actor.id, permissionByName: actor.name, startedAt: now },
              },
            },
            events: [
              ...(a.events ?? []),
              { id: `${a.id}-permission-${stage}-${Date.now()}`, type: 'needs_info' as const, byId: actor.id, byName: actor.name, time: now, details: `Permission granted: ${meta.label} — timer started` },
            ],
          } : a),
          notifications: app.assignedStaffId ? [
            ...state.notifications,
            { id: `${applicationId}-perm-${stage}`, userId: app.assignedStaffId, title: `${meta.label}: permission granted`, message: `${app.name} — the SLA timer is now running.`, type: 'info' as const, time: now, read: false },
          ] : state.notifications,
        }));
        if (app.assignedStaffId) {
          emailNotifyUser(get, app.assignedStaffId, {
            subject: `${meta.label}: permission granted — The Way`,
            title: 'A stage timer has started',
            intro: `${actor.name} granted permission for "${meta.label}" on ${app.name}'s case. The SLA timer is now running.`,
            ctaLabel: 'Open your dashboard',
            ctaPath: '/staff',
          }, { dedupeKey: `${applicationId}-perm-${stage}` });
        }
        // The document may already be uploaded — complete instantly if so.
        autoCompleteFromDocuments(applicationId, actor.id, actor.name);
        queueBackendSave(get);
      },

      completePipelineStage: (applicationId: string, stage: PipelineStageId) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['staff', 'agency_staff', 'ceo']);
        const app = get().applications.find(a => a.id === applicationId);
        if (!app?.pipeline) throw new Error('Application has no active case');
        if (app.pipeline.status !== 'processing') throw new Error('Case is not in processing');
        if (app.pipeline.current !== stage) throw new Error('Only the current stage can be completed');
        const meta = getStageMeta(stage);
        const track = app.pipeline.stages[stage] ?? {};
        if (meta.permissionGated && !track.permissionAt) throw new Error(`${meta.label} needs permission from Agency/Sales/CEO first`);
        if (stage === 'recognition_letter' && !app.intakeHighSchoolCertificate) {
          throw new Error('Recognition is blocked: the high school certificate has not been uploaded yet');
        }
        if (stage === 'visa_residency') {
          const docs = get().documents;
          const hasBoth = STAGE_TO_DOC_TYPES.visa_residency.every(t => docs.some(d => d.studentId === app.studentId && d.type === t));
          if (!hasBoth) throw new Error('Upload both the visa and the residency documents first');
        }
        if (!completeStageCore(applicationId, stage, actor.id, actor.name)) {
          throw new Error('Could not complete this stage');
        }
      },

      ceoCancelApplication: (applicationId: string, reason?: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        const app = get().applications.find(a => a.id === applicationId);
        if (!app?.pipeline) throw new Error('Application has no active case');
        if (app.pipeline.status !== 'processing') throw new Error('Only processing cases can be cancelled');
        const now = new Date().toISOString();
        set((state) => ({
          applications: state.applications.map(a => (a.id === applicationId && a.pipeline) ? {
            ...a,
            pipeline: {
              ...a.pipeline,
              status: 'cancelled' as const,
              cancelledAt: now,
              cancelledById: actor.id,
              cancelledByName: actor.name,
              cancelReason: reason?.trim() || undefined,
            },
            events: [
              ...(a.events ?? []),
              { id: `${a.id}-cancelled-${Date.now()}`, type: 'rejected' as const, byId: actor.id, byName: actor.name, time: now, details: `Case cancelled by CEO${reason?.trim() ? `: ${reason.trim()}` : ''}` },
            ],
          } : a),
          notifications: [
            ...state.notifications,
            ...(app.assignedStaffId ? [{ id: `${applicationId}-cancelled-staff`, userId: app.assignedStaffId, title: 'Case Cancelled', message: `${app.name} — cancelled by CEO`, type: 'alert' as const, time: now, read: false }] : []),
            ...(app.studentId ? [{ id: `${applicationId}-cancelled-student`, userId: app.studentId, title: 'Application Update', message: 'Your case has been cancelled. Please contact us for details.', type: 'alert' as const, time: now, read: false }] : []),
          ],
        }));
        queueBackendSave(get);
      },

      studentRateService: (applicationId: string, stars: number, comment?: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['student']);
        const app = get().applications.find(a => a.id === applicationId);
        if (!app || app.studentId !== actor.id) throw new Error('Application not found');
        const residencyDone = app.pipeline?.status === 'closed' || Boolean(app.pipeline?.stages?.visa_residency?.completedAt);
        if (!residencyDone) throw new Error('Rating opens after your residency is uploaded');
        const s = Math.round(stars);
        if (s < 1 || s > 5) throw new Error('Rating must be between 1 and 5 stars');
        if (app.rating) throw new Error('You have already rated our service — thank you!');
        const now = new Date().toISOString();
        const ceoUsers = get().users.filter(u => u.role === 'ceo');
        set((state) => ({
          applications: state.applications.map(a => a.id === applicationId ? {
            ...a,
            rating: { stars: s, comment: comment?.trim() || undefined, at: now },
          } : a),
          notifications: [
            ...state.notifications,
            ...ceoUsers.map(u => ({
              id: `${applicationId}-rating-${u.id}`,
              userId: u.id,
              title: `New ${s}-star rating`,
              message: `${app.name} rated the service ${s}/5${comment?.trim() ? ` — "${comment.trim().slice(0, 120)}"` : ''}`,
              type: 'success' as const,
              time: now,
              read: false,
              link: '/admin?tab=performance',
            })),
          ],
        }));
        queueBackendSave(get);
      },

      // ── Staff performance points ─────────────────────────────────────────

      ceoAdjustPoints: (userId: string, delta: number, reason: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        const target = get().users.find(u => u.id === userId);
        if (!target) throw new Error('User not found');
        const d = Math.trunc(delta);
        if (!d) throw new Error('Adjustment cannot be zero');
        const why = reason.trim();
        if (!why) throw new Error('Please add a reason for the adjustment');
        const now = new Date().toISOString();
        set((state) => {
          const pointsLedger = appendLedger(state.pointsLedger, [{
            id: `adj-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            userId,
            delta: d,
            reason: why,
            kind: 'adjustment',
            at: now,
            byId: actor.id,
            byName: actor.name,
          }]);
          return {
            ...ledgerPatch(state, pointsLedger),
            notifications: [
              ...state.notifications,
              {
                id: `adj-notif-${userId}-${Date.now()}`,
                userId,
                title: d > 0 ? `+${d} points adjustment` : `${d} points adjustment`,
                message: `${actor.name}: ${why}`,
                type: (d > 0 ? 'success' : 'alert') as NotificationType,
                time: now,
                read: false,
                link: '/profile',
              },
            ],
          };
        });
        queueBackendSave(get);
      },

      evaluateSlaDeadlines: () => {
        const me = get().currentUser;
        if (!me || !['ceo', 'sales', 'ops', 'staff', 'agency_staff', 'customer_support'].includes(me.role)) return;
        const now = new Date();
        const nowIso = now.toISOString();
        const ledger = get().pointsLedger;
        const existingIds = new Set(ledger.map(e => e.id));
        const penalties: PointsEntry[] = [];
        const lateNotifs: Notification[] = [];
        const ceoUsers = get().users.filter(u => u.role === 'ceo');

        for (const app of get().applications) {
          const pipeline = app.pipeline;
          if (!pipeline || pipeline.status !== 'processing' || pipeline.current === 'done') continue;
          const stage = pipeline.current as PipelineStageId;
          const track = pipeline.stages[stage];
          if (!track?.startedAt || track.completedAt) continue;
          if (!app.assignedStaffId) continue;
          const group = effectiveSlaGroup(get().universityConfig, app.university);
          const window = getSlaWindow(stage, group);
          if (!window) continue;
          if (now.getTime() <= slaDeadline(window, track.startedAt).getTime()) continue;
          const id = slaLedgerId(app.id, stage);
          if (existingIds.has(id)) continue;
          const meta = getStageMeta(stage);
          penalties.push({
            id,
            userId: app.assignedStaffId,
            delta: window.latePoints,
            reason: `${meta.label} deadline passed — ${app.name}`,
            kind: 'sla',
            at: nowIso,
            applicationId: app.id,
            applicationName: app.name,
            stage,
          });
          lateNotifs.push({
            id: `sla-late-${app.id}-${stage}-staff`,
            userId: app.assignedStaffId,
            title: `${window.latePoints} points — deadline passed`,
            message: `${meta.label} for ${app.name} is overdue.`,
            type: 'alert',
            time: nowIso,
            read: false,
            link: `/staff?student=${app.id}`,
          });
          for (const ceo of ceoUsers) {
            lateNotifs.push({
              id: `sla-late-${app.id}-${stage}-ceo-${ceo.id}`,
              userId: ceo.id,
              title: 'SLA deadline passed',
              message: `${meta.label} for ${app.name} is overdue (assigned staff penalized ${window.latePoints}).`,
              type: 'alert',
              time: nowIso,
              read: false,
              link: '/admin?tab=performance',
            });
          }
        }

        if (!penalties.length) return;
        set((state) => {
          const pointsLedger = appendLedger(state.pointsLedger, penalties);
          const freshNotifIds = new Set(state.notifications.map(n => n.id));
          return {
            ...ledgerPatch(state, pointsLedger),
            notifications: [...state.notifications, ...lateNotifs.filter(n => !freshNotifIds.has(n.id))],
          };
        });
        queueBackendSave(get);
      },

      // ── University configuration (CEO) ───────────────────────────────────

      ceoSetUniversityStaff: (universityId: string, staffUsername: string | null) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        const now = new Date().toISOString();
        set((state) => {
          const cur = state.universityConfig;
          return {
            universityConfig: {
              assignments: { ...(cur?.assignments ?? {}), [universityId]: staffUsername ?? '' },
              slaGroups: { ...(cur?.slaGroups ?? {}) },
              updatedAt: now,
              updatedByName: actor.name,
            },
          };
        });
        queueBackendSave(get);
      },

      ceoSetUniversitySlaGroup: (universityId: string, group: UniversitySlaGroup) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        const now = new Date().toISOString();
        set((state) => {
          const cur = state.universityConfig;
          return {
            universityConfig: {
              assignments: { ...(cur?.assignments ?? {}) },
              slaGroups: { ...(cur?.slaGroups ?? {}), [universityId]: group },
              updatedAt: now,
              updatedByName: actor.name,
            },
          };
        });
        queueBackendSave(get);
      },
    };
    },
    {
      name: 'the-way-storage',
      storage: createJSONStorage(() => localStorage),
      version: 5,
      partialize: (state) => ({
        language: state.language,
        currentUser: state.currentUser,
        authStatus: state.authStatus,
        users: state.users,
        applications: state.applications,
        documents: state.documents,
        notifications: state.notifications,
        appointments: state.appointments,
        chatMessages: state.chatMessages,
        chatThreadReadAt: state.chatThreadReadAt,
        chatEmailNotify: state.chatEmailNotify,
        documentRequests: state.documentRequests,
        leads: state.leads,
        futureLeads: state.futureLeads,
        trashedApplications: state.trashedApplications,
        trashedUsers: state.trashedUsers,
        credentialRequests: state.credentialRequests,
        pointsLedger: state.pointsLedger,
        universityConfig: state.universityConfig,
        purgedApplicationIds: state.purgedApplicationIds,
        unTrashedUserIds: state.unTrashedUserIds,
      }),
      migrate: () => ({ state: { currentUser: null, authStatus: 'signed_out', users: [], applications: [], documents: [], notifications: [], appointments: [], chatMessages: [], chatThreadReadAt: {} }, version: 5 } as unknown),
    }
  )
);

export { useAppStore };
