import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { sendMail } from '../lib/mailer';
import { getSupabase, tryGetSupabase } from '../lib/supabase';

export type UserRole = 'ceo' | 'sales' | 'ops' | 'staff' | 'agency_staff' | 'student' | 'agency';

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
  program: string;
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
  intakeSLARewarded?: boolean;
  arrived?: boolean;
  intakeExtraDocs?: string[];
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
  backendHydrated: boolean;

  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  restoreSession: () => Promise<void>;
  refreshUsersFromBackend: () => Promise<void>;
  loadBackendState: () => Promise<void>;
  saveBackendState: () => Promise<void>;
  addApplication: (application: Omit<Application, 'id'>) => Promise<void>;

  salesApproveApplication: (applicationId: string) => Promise<{ username: string; password: string }>;
  salesRejectApplication: (applicationId: string) => void;
  salesAddIntakeDetails: (applicationId: string, details: string, attachments: string[]) => void;
  salesSetIntakeMedia: (applicationId: string, media: { videoUrl?: string; passportCopy?: string; highSchoolCertificate?: string; pdfs?: string[] }) => void;
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
  ceoResetCredentials: (userId: string, updates: Partial<Pick<User, 'username' | 'password'>>) => Promise<void>;
  ceoCreateAgencyAccount: (name: string, email: string) => Promise<User>;

  addAppointment: (appt: Omit<Appointment, 'id'>) => void;
  addChatMessage: (toUserId: string, text: string, applicationId?: string) => void;
  markChatThreadRead: (threadKey: string) => void;
  requestMoreInfo: (applicationId: string, message: string) => void;
  agencyAddExtraDocs: (applicationId: string, files: string[]) => void;
  checkExpiries: () => void;
}

const ensureSignedIn = (user: User | null, authStatus: AuthStatus) => {
  if (!user || authStatus !== 'signed_in') throw new Error('Not authenticated');
  return user;
};

const requireRole = (user: User, roles: UserRole[]) => {
  if (!roles.includes(user.role)) throw new Error('Forbidden');
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
    (set, get) => ({
      users: [],
      currentUser: null,
      authStatus: 'signed_out',
      applications: [],
      documents: [],
      notifications: [],
      chatMessages: [],
      chatThreadReadAt: {},
      appointments: [],
      backendHydrated: false,

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
        const supabase = getSupabase();
        const input = username.trim();
        const isEmail = input.includes('@');
        let email = input;
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
        set({ currentUser: null, authStatus: 'signed_out', backendHydrated: false });
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
        const supabase = getSupabase();
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
          backendHydrated: true,
        });
        await get().refreshUsersFromBackend();
      },

      saveBackendState: async () => {
        const { authStatus, backendHydrated } = get();
        if (authStatus !== 'signed_in' || !backendHydrated) return;
        const supabase = getSupabase();
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
        const json = (await resp.json()) as { id?: unknown; error?: unknown };
        if (!resp.ok || !json || typeof json.id !== 'string') {
          throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to create student account');
        }
        const studentId = json.id;

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
        queueBackendSave(get);
        return creds;
      },

      salesRejectApplication: (applicationId: string) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);

        const app = get().applications.find(a => a.id === applicationId);
        if (!app) throw new Error('Application not found');
        if (app.status !== 'submitted') throw new Error('Application already processed');
        const source = app.source ?? 'public';
        if (source === 'agency') requireRole(actor, ['ops', 'ceo']);
        if (source === 'public') requireRole(actor, ['sales', 'ceo']);

        set((state) => ({
          applications: state.applications.map(a => a.id === applicationId ? {
            ...a,
            status: 'rejected',
            stage: 'rejected',
            events: [
              ...(a.events ?? []),
              { id: `${a.id}-rejected-${Date.now()}`, type: 'rejected' as const, byId: actor.id, byName: actor.name, time: new Date().toISOString() },
            ],
          } : a)
        }));
        const hasNotes = (app.internalNotes ?? []).length > 0;
        if (!hasNotes) {
          set((state) => ({
            users: state.users.map(u => u.id === actor.id ? { ...u, points: Math.max(0, (u.points ?? 0) - 1) } : u),
          }));
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
      
      salesSetIntakeMedia: (applicationId: string, media: { videoUrl?: string; passportCopy?: string; highSchoolCertificate?: string; pdfs?: string[] }) => {
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

        set((state) => ({
          applications: state.applications.map(a => a.id === applicationId ? { ...a, stage } : a),
          users: state.users.map(u => u.id === actor.id ? { ...u, points: (u.points ?? 0) + 1 } : u),
        }));
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

      ceoResetCredentials: async (userId: string, updates: Partial<Pick<User, 'username' | 'password'>>) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        requireRole(actor, ['ceo']);
        const supabase = getSupabase();
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        if (!token) throw new Error('Not authenticated');
        const resp = await fetch('/api/admin-reset-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ userId, username: updates.username, password: updates.password }),
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

      addAppointment: (appt: Omit<Appointment, 'id'>) => {
        const actor = ensureSignedIn(get().currentUser, get().authStatus);
        if (actor.role === 'student' && appt.userId !== actor.id) throw new Error('Forbidden');
        set((state) => ({ appointments: [...state.appointments, { ...appt, id: Date.now().toString() }] }));
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
          throw new Error('Sales chat is disabled');
        } else if (actor.role === 'agency') {
          if (!applicationId) throw new Error('Thread required');
          const app = get().applications.find(a => a.id === applicationId);
          if (!app || (app.source ?? 'public') !== 'agency') throw new Error('Application not found');
          if (app.agencyId !== actor.id) throw new Error('Forbidden');
          if (!app.assignedStaffId || app.assignedStaffId !== toUserId) throw new Error('You can only message the assigned admin');
          if (toUser.role !== 'staff' && toUser.role !== 'agency_staff') throw new Error('Recipient must be an admin');
        } else if (actor.role === 'ops') {
          throw new Error('Ops chat is disabled');
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
        const soon = (dateStr?: string) => {
          if (!dateStr) return false;
          const d = new Date(dateStr);
          const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return diff > 0 && diff <= 60;
        };
        const current = get().currentUser;
        if (!current) return;
        const push = (title: string, message: string) => {
          set((state) => ({
            notifications: [
              ...state.notifications,
              { id: Date.now().toString(), userId: current.id, title, message, type: 'alert', time: new Date().toISOString(), read: false }
            ]
          }));
        };
        if (soon(current.passportExpiry)) push('Passport Expiry', `Your passport expires on ${current.passportExpiry}`);
        if (soon(current.visaExpiry)) push('Visa Expiry', `Your visa expires on ${current.visaExpiry}`);
        if (soon(current.residenceExpiry)) push('Residence Permit Expiry', `Your residence permit expires on ${current.residenceExpiry}`);
      },
    }),
    {
      name: 'the-way-storage',
      storage: createJSONStorage(() => localStorage),
      version: 5,
      partialize: (state) => ({ currentUser: state.currentUser, authStatus: state.authStatus }),
      migrate: () => ({ state: { currentUser: null, authStatus: 'signed_out' }, version: 5 } as unknown),
    }
  )
);

export { useAppStore };
