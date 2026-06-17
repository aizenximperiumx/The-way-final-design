import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { sendMail } from '../lib/mailer';
import { renderBrandedEmail } from '../lib/emailTemplate';
import { getSupabase, tryGetSupabase } from '../lib/supabase';


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

export interface DocumentRequest {
  id: string;
  studentId: string;
  applicationId?: string;
  title: string;
  description?: string;
  requestedBy: string;
  requestedByName: string;
  createdAt: string;
  status: 'pending' | 'fulfilled';
  fulfilledFile?: string;
  fulfilledAt?: string;
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
  documentRequests: DocumentRequest[];
  leads: Lead[];
  futureLeads: Application[];
  trashedApplications: Application[];
  trashedUsers: TrashedUser[];
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

  addAppointment: (appt: Omit<Appointment, 'id'>) => void;
  addChatMessage: (toUserId: string, text: string, applicationId?: string) => void;
  markChatThreadRead: (threadKey: string) => void;
  requestMoreInfo: (applicationId: string, message: string) => void;
  agencyAddExtraDocs: (applicationId: string, files: string[]) => void;
  checkExpiries: () => void;
  staffRequestDocument: (studentId: string, applicationId: string | undefined, title: string, description?: string) => void;
  studentFulfillRequest: (requestId: string, fileUrl: string) => void;
}

const ensureSignedIn = (user: User | null, authStatus: AuthStatus) => {
  if (!user || authStatus !== 'signed_in') throw new Error('Not authenticated');
  return user;
};

const requireRole = (user: User, roles: UserRole[]) => {
  if (!roles.includes(user.role)) throw new Error('Forbidden');
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

const queueBackendSave = (() => {
  let timer: number | null = null;
  return (getState: () => AppStoreState) => {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      getState().saveBackendState().catch(() => {});
    }, 600);
  };
})();

const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => {
      return {
        users: [],
        currentUser: null,
        authStatus: 'signed_out',
        applications: [],
        documents: [],
        notifications: [],
        chatMessages: [],
        chatThreadReadAt: {},
        appointments: [],
        documentRequests: [],
        leads: [],
        futureLeads: [],
        trashedApplications: [],
        trashedUsers: [],
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
        return user;
      },

      logout: () => {
        const supabase = tryGetSupabase();
        if (supabase) void supabase.auth.signOut();
        localStorage.removeItem('the-way-storage');
        set({ currentUser: null, authStatus: 'signed_out', backendHydrated: false, users: [], applications: [], documents: [], notifications: [], appointments: [], chatMessages: [], chatThreadReadAt: {}, documentRequests: [], leads: [], futureLeads: [], trashedApplications: [], trashedUsers: [] });
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
        if (existing?.id === user.id && existingStatus !== 'signed_out') return;
        const authStatus: AuthStatus = 'signed_in';
        set({ currentUser: user, authStatus });
        await get().refreshUsersFromBackend();
        await get().loadBackendState();
        get().checkExpiries();
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
        set({ users });
      },

      loadBackendState: async () => {
        const { authStatus } = get();
        if (authStatus !== 'signed_in') return;
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
          documentRequests: Array.isArray(s.documentRequests) ? (s.documentRequests as DocumentRequest[]) : [],
          leads: Array.isArray(s.leads) ? (s.leads as Lead[]) : [],
          futureLeads: Array.isArray(s.futureLeads) ? (s.futureLeads as Application[]) : [],
          trashedApplications: Array.isArray(s.trashedApplications) ? (s.trashedApplications as Application[]) : [],
          trashedUsers: Array.isArray(s.trashedUsers) ? (s.trashedUsers as TrashedUser[]) : [],
          backendHydrated: true,
        });
        await get().refreshUsersFromBackend();
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
          documentRequests: get().documentRequests,
          leads: get().leads,
          futureLeads: get().futureLeads,
          trashedApplications: get().trashedApplications,
          trashedUsers: get().trashedUsers,
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
            hold: undefined,
            events: [
              ...(a.events ?? []),
              { id: `${a.id}-approved-${Date.now()}`, type: 'approved' as const, byId: actor.id, byName: actor.name, time: new Date().toISOString(), details: source === 'agency' ? 'Approved by Ops' : 'Approved by Sales' },
              ...(autoAssignedStaffId ? [{ id: `${a.id}-assigned-${autoAssignedStaffId}-${Date.now()}`, type: 'assigned_staff' as const, byId: actor.id, byName: actor.name, time: new Date().toISOString(), details: autoAssignedStaffId }] : []),
            ],
          } : a),
          notifications: [
            ...state.notifications,
            { id: Date.now().toString(), userId: studentId, title: 'Welcome to The Way', message: 'Your student account has been created', type: 'success', time: new Date().toISOString(), read: false },
            ...(autoAssignedStaffId ? [{ id: `${studentId}-auto-assign`, userId: autoAssignedStaffId, title: 'New Student Assigned', message: app.name, type: 'info' as const, time: new Date().toISOString(), read: false }] : [])
          ],
        }));
        set((state) => ({
          users: state.users.map(u => {
            if (u.id === actor.id) return { ...u, points: (u.points ?? 0) + 1 };
            if (source === 'agency' && app.agencyId && u.id === app.agencyId) {
              return { ...u, points: (u.points ?? 0) + 1 };
            }
            return u;
          }),
        }));

        if (autoAssignedStaffId) {
          const staff = get().users.find(u => u.id === autoAssignedStaffId);
          if (staff?.email) {
            const html = `<div style="font-family:Arial,sans-serif"><p>You have been assigned a new student: <b>${app.name}</b>.</p></div>`;
            sendMail({ to: staff.email, subject: 'New Student Assigned', text: `New student assigned: ${app.name}`, html });
          }
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
          set((state) => ({
            users: state.users.map(u => u.id === actor.id ? { ...u, points: Math.max(0, (u.points ?? 0) - 1) } : u),
          }));
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
          set((state) => ({
            users: state.users.map(u => u.id === actor.id ? { ...u, points: (u.points ?? 0) + 1 } : u),
          }));
        }
        if (within24h && !app?.intakeSLARewarded) {
          set((state) => ({
            users: state.users.map(u => u.id === actor.id ? { ...u, points: (u.points ?? 0) + 1 } : u),
            applications: state.applications.map(a => a.id === applicationId ? { ...a, intakeSLARewarded: true } : a),
          }));
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
        set((state) => ({
          applications: state.applications.map(a => a.id === applicationId ? {
            ...a,
            ownerId: actor.id,
            salesOwnerId: actor.id,
            events: [
              ...(a.events ?? []),
              { id: `${a.id}-claimed-${Date.now()}`, type: 'claimed' as const, byId: actor.id, byName: actor.name, time: new Date().toISOString() },
            ],
          } : a),
          users: state.users.map(u => u.id === actor.id ? { ...u, points: (u.points ?? 0) + 1 } : u),
        }));
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
          users: state.users.map(u => u.id === actor.id ? { ...u, points: (u.points ?? 0) + 1 } : u),
          notifications: app.studentId ? [
            ...state.notifications,
            { id: `${applicationId}-stage-${Date.now()}`, userId: app.studentId, title: 'Application Updated', message: `Your application has moved to: ${stageLabel}`, type: 'info' as const, time: new Date().toISOString(), read: false },
          ] : state.notifications,
        }));

        if (app.studentId) {
          const student = get().users.find(u => u.id === app.studentId);
          if (student?.email) {
            const html = `<div style="font-family:Arial,sans-serif"><p>Dear <b>${app.name}</b>,</p><p>Your application status has been updated to: <b>${stageLabel}</b>.</p><p>Log in to your portal to see more details.</p></div>`;
            sendMail({ to: student.email, subject: `Application Update: ${stageLabel} — The Way Georgia`, text: `Your application is now at stage: ${stageLabel}`, html });
          }
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
          users: state.users.map(u => u.id === actor.id ? { ...u, points: (u.points ?? 0) + 1 } : u),
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
          status: 'pending',
          uploadedAt: new Date().toISOString(),
          uploadedBy: actor.id,
        };

        const docId = Date.now().toString();
        set((state) => ({
          documents: [...state.documents, { ...newDoc, id: docId }],
          users: state.users.map(u => u.id === actor.id ? { ...u, points: (u.points ?? 0) + 1 } : u),
          applications: state.applications.map(a => a.studentId === doc.studentId ? {
            ...a,
            events: [
              ...(a.events ?? []),
              { id: `${a.id}-doc-upload-${docId}`, type: 'document_uploaded' as const, byId: actor.id, byName: actor.name, time: new Date().toISOString(), details: `${doc.title} (${doc.type})` },
            ],
          } : a),
        }));
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
          users: state.users.map(u => u.id === actor.id ? { ...u, points: (u.points ?? 0) + 1 } : u),
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
        const student = get().users.find(u => u.id === doc.studentId);
        if (student?.email) {
          const html = `<div style="font-family:Arial,sans-serif"><p>Your document <b>${doc.title}</b> has been verified.</p></div>`;
          sendMail({ to: student.email, subject: 'Document verified', text: `Your document "${doc.title}" has been verified.`, html });
        }
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
        const s = get().users.find(u => u.id === studentUserId);
        if (s?.email) {
          const html = `<div style="font-family:Arial,sans-serif"><p>Your university has been set to <b>${universityId}</b>.</p></div>`;
          sendMail({ to: s.email, subject: 'University Assigned', text: `Your university has been set to ${universityId}.`, html });
        }
        if (firstAssign) {
          set((state) => ({
            users: state.users.map(u => u.id === actor.id ? { ...u, points: (u.points ?? 0) + 1 } : u),
          }));
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
            { id: `${studentUserId}-assign`, userId: staffUserId, title: 'New Student Assigned', message: a?.name ?? 'New student', type: 'info', time: new Date().toISOString(), read: false }
          ],
        }));
        const staff = get().users.find(u => u.id === staffUserId);
        if (staff?.email) {
          const html = `<div style="font-family:Arial,sans-serif"><p>You have been assigned a new student: <b>${a?.name ?? 'New student'}</b>.</p></div>`;
          sendMail({ to: staff.email, subject: 'New Student Assigned', text: `New student assigned: ${a?.name ?? 'New student'}`, html });
        }
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
        set((state) => ({ trashedUsers: state.trashedUsers.filter(u => u.id !== userId) }));
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
        }));
        queueBackendSave(get);
      },

      addAppointment: (appt: Omit<Appointment, 'id'>) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        if (actor.role === 'student' && appt.userId !== actor.id) throw new Error('Forbidden');
        set((state) => ({ appointments: [...state.appointments, { ...appt, id: Date.now().toString() }] }));
        queueBackendSave(get);
      },

      markChatThreadRead: (threadKey: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        const key = `${actor.id}|${threadKey}`;
        set((state) => ({
          chatThreadReadAt: { ...state.chatThreadReadAt, [key]: new Date().toISOString() },
        }));
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
        const agency = get().users.find(u => u.id === app.agencyId);
        if (agency?.email) {
          const html = `<div style="font-family:Arial,sans-serif"><p>Additional information is required for application <b>${app.name}</b>:</p><p>${message}</p><p>Please log in to your portal to respond.</p></div>`;
          sendMail({ to: agency.email, subject: 'Action Required: More Info Needed — The Way Georgia', text: `More info required for ${app.name}: ${message}`, html });
        }
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
          if (current.email) sendMail({ to: current.email, subject: 'Visa Expiry Reminder — The Way Georgia', text: msg, html: `<div style="font-family:Arial,sans-serif"><p>${msg}</p></div>` });
        }

        const residenceDays = daysUntil(current.residenceExpiry);
        if (residenceDays !== null && residenceDays <= 60 && !alreadyNotified('Residence')) {
          const msg = `Your residence permit expires in ${residenceDays} day${residenceDays === 1 ? '' : 's'} (${current.residenceExpiry}). Please renew as soon as possible.`;
          push('Residence Permit Expiry Warning', msg);
          if (current.email) sendMail({ to: current.email, subject: 'Residence Permit Reminder — The Way Georgia', text: msg, html: `<div style="font-family:Arial,sans-serif"><p>${msg}</p></div>` });
        }
      },

      staffRequestDocument: (studentId: string, applicationId: string | undefined, title: string, description?: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['staff', 'agency_staff', 'ceo', 'sales', 'ops']);
        const req: DocumentRequest = {
          id: `docreq-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          studentId,
          applicationId,
          title: title.trim(),
          description: description?.trim(),
          requestedBy: actor.id,
          requestedByName: actor.name,
          createdAt: new Date().toISOString(),
          status: 'pending',
        };
        set((state) => ({
          documentRequests: [...state.documentRequests, req],
          notifications: [
            ...state.notifications,
            {
              id: `docreq-notif-${req.id}`,
              userId: studentId,
              title: 'Document Requested',
              message: `Your advisor has requested: "${title}". Please upload it in your portal.`,
              type: 'info' as const,
              time: new Date().toISOString(),
              read: false,
            },
          ],
        }));
        const student = get().users.find(u => u.id === studentId);
        if (student?.email) {
          sendMail({
            to: student.email,
            subject: 'Document Required — The Way Georgia',
            text: `Your advisor has requested a document: "${title}". ${description ?? ''} Please log in to your portal to upload it.`,
            html: `<div style="font-family:Arial,sans-serif"><p>Dear ${student.name},</p><p>Your advisor has requested the following document: <b>${title}</b>${description ? ` — ${description}` : ''}.</p><p>Please log in to your student portal to upload it.</p></div>`,
          });
        }
        queueBackendSave(get);
      },

      studentFulfillRequest: (requestId: string, fileUrl: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        const req = get().documentRequests.find(r => r.id === requestId);
        if (!req) throw new Error('Request not found');
        if (req.studentId !== actor.id) throw new Error('Forbidden');
        set((state) => ({
          documentRequests: state.documentRequests.map(r =>
            r.id === requestId ? { ...r, status: 'fulfilled' as const, fulfilledFile: fileUrl, fulfilledAt: new Date().toISOString() } : r
          ),
          notifications: [
            ...state.notifications,
            {
              id: `docreq-fulfilled-${requestId}`,
              userId: req.requestedBy,
              title: 'Document Uploaded',
              message: `Student uploaded the requested document: "${req.title}"`,
              type: 'success' as const,
              time: new Date().toISOString(),
              read: false,
            },
          ],
        }));
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
        leads: state.leads,
        futureLeads: state.futureLeads,
        trashedApplications: state.trashedApplications,
        trashedUsers: state.trashedUsers,
      }),
      migrate: () => ({ state: { currentUser: null, authStatus: 'signed_out', users: [], applications: [], documents: [], notifications: [], appointments: [], chatMessages: [], chatThreadReadAt: {} }, version: 5 } as unknown),
    }
  )
);

export { useAppStore };
