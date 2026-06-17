import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Shield,
  Users,
  Activity,
  FileText,
  GraduationCap,
  Lock,
  Ban,
  ArrowUpRight,
  CheckCircle2,
  BarChart3,
  ShieldAlert,
  Edit3,
  X,
  Copy,
  Check,
  Trash2,
  RotateCcw,
  Archive,
  Inbox,
  KeyRound,
  Clock
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { UNIVERSITY_OPTIONS, getUniversityName } from '../lib/universities';
import toast from 'react-hot-toast';
import { tryGetSupabase } from '../lib/supabase';

/* ── Shared modal shell (module scope so typing in inputs doesn't remount them) ── */
const ModalShell = ({ title, onClose, children, maxW = 'max-w-lg' }: { title: string; onClose: () => void; children: React.ReactNode; maxW?: string }) => (
  <div className="fixed inset-0 z-[100] p-4 flex items-start justify-center overflow-y-auto">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxW} my-10 max-h-[90vh] overflow-y-auto`}>
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

/* ── Shared form field (module scope, same reason) ── */
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{label}</label>
    {children}
  </div>
);

const AdminDashboard: React.FC = () => {
  useAuth();
  const {
    users, applications, futureLeads, trashedApplications, trashedUsers,
    ceoCreateAgencyAccount, ceoResetCredentials, assignStaffAdmin, ceoCreateUser, ceoUpdateUser,
    ceoTrashApplication, ceoRestoreApplication, ceoPurgeApplication,
    ceoRestoreFutureLead, ceoDeleteFutureLead,
    ceoDisableUser, ceoRestoreUser, ceoPurgeUser,
    credentialRequests, ceoResolveCredentialRequest, ceoRejectCredentialRequest,
  } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'forms' | 'requests' | 'trash' | 'security'>('analytics');
  const pendingCredRequests = credentialRequests.filter(r => r.status === 'pending');
  const [health, setHealth] = useState<{ loading: boolean; ok: boolean | null; checks: Array<{ name: string; ok: boolean; details?: string }> }>({ loading: true, ok: null, checks: [] });
  const [audit, setAudit] = useState<{ loading: boolean; ok: boolean | null; issueCount: number; issues: Array<{ severity: 'high' | 'medium' | 'low'; code: string; message: string }> }>({ loading: false, ok: null, issueCount: 0, issues: [] });
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [agencyName, setAgencyName] = useState('');
  const [agencyEmail, setAgencyEmail] = useState('');
  const [createdAgencyCreds, setCreatedAgencyCreds] = useState<{ username: string; password?: string } | null>(null);
  const [createdOpsCreds, setCreatedOpsCreds] = useState<{ username: string; password?: string } | null>(null);
  const [createdSalesCreds, setCreatedSalesCreds] = useState<{ username: string; password?: string } | null>(null);
  const [createdStaffCreds, setCreatedStaffCreds] = useState<{ username: string; password?: string } | null>(null);
  const [showCredModal, setShowCredModal] = useState(false);
  const [credUserId, setCredUserId] = useState<string | null>(null);
  const [credUsername, setCredUsername] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [credEmail, setCredEmail] = useState('');
  const [credSaving, setCredSaving] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignStudentId, setAssignStudentId] = useState<string>('');
  const [assignStaffId, setAssignStaffId] = useState<string>('');
  const [showOpsModal, setShowOpsModal] = useState(false);
  const [opsName, setOpsName] = useState('');
  const [opsEmail, setOpsEmail] = useState('');
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [salesName, setSalesName] = useState('');
  const [salesEmail, setSalesEmail] = useState('');
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [createdSupportCreds, setCreatedSupportCreds] = useState<{ username: string; password?: string } | null>(null);
  const [showUniModal, setShowUniModal] = useState(false);
  const [uniUserId, setUniUserId] = useState<string | null>(null);
  const [uniSelection, setUniSelection] = useState<string[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'forms', label: 'Forms', icon: FileText },
    { id: 'requests', label: 'Requests', icon: KeyRound },
    { id: 'trash', label: 'Trash', icon: Trash2 },
    { id: 'security', label: 'Security', icon: ShieldAlert },
  ] as const;

  const approvedApplications = applications.filter(a => a.status === 'approved');
  const stepIds = ['translation','university-approval','recognition-letter','ministry-order','visa-documents'] as const;
  const isComplete = (studentId?: string) => {
    if (!studentId) return false;
    return stepIds.every(id => users.some(u => u.role === 'student' && u.id === studentId) &&
      applications.some(a => a.studentId === studentId) &&
      (useAppStore.getState().documents.some(d => d.studentId === studentId && d.type === id && d.status === 'verified')));
  };
  const enrolledCount = approvedApplications.filter(a => isComplete(a.studentId)).length;
  const processingCount = approvedApplications.filter(a => !isComplete(a.studentId)).length;
  const closedCount = approvedApplications.filter(a => a.stage === 'enrolled' && a.arrived).length;

  const stageData = [
    { name: 'Applied', value: applications.filter(a => a.stage === 'applied').length },
    { name: 'Contacted', value: applications.filter(a => a.stage === 'contacted').length },
    { name: 'Accepted', value: applications.filter(a => a.stage === 'accepted').length },
    { name: 'Documents', value: applications.filter(a => a.stage === 'documents').length },
    { name: 'Visa', value: applications.filter(a => a.stage === 'visa').length },
    { name: 'Enrolled', value: applications.filter(a => a.stage === 'enrolled').length },
  ];

  const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#000000'];

  const trashedUserIds = new Set(trashedUsers.map(u => u.id));
  const filteredUsers = users.filter(u =>
    !trashedUserIds.has(u.id) && (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const stats = [
    { label: 'Processing', value: processingCount, trend: '', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Enrolled', value: enrolledCount, trend: '', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Closed Cases', value: closedCount, trend: '', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Applications', value: applications.length, trend: '', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];
  const agencyApps = applications.filter(a => (a.source ?? 'public') === 'agency');
  const agencyEnrolled = agencyApps.filter(a => isComplete(a.studentId)).length;
  const agencyProcessing = agencyApps.filter(a => !isComplete(a.studentId) && a.status === 'approved').length;
  const agencyClosed = agencyApps.filter(a => a.stage === 'enrolled' && a.arrived).length;
  const agencyAnalytics = [
    { label: 'Agency Processing', value: agencyProcessing, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Agency Enrolled', value: agencyEnrolled, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Agency Closed', value: agencyClosed, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Agency Apps', value: agencyApps.length, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  const copyToClipboard = (text: string, field: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const roleColors: Record<string, string> = {
    ceo: 'bg-gray-900 text-white',
    staff: 'bg-blue-100 text-blue-700',
    sales: 'bg-purple-100 text-purple-700',
    ops: 'bg-teal-100 text-teal-700',
    agency: 'bg-amber-100 text-amber-700',
    customer_support: 'bg-rose-100 text-rose-700',
  };
  const roleAvatarColors: Record<string, string> = {
    ceo: 'bg-gray-900 text-white',
    staff: 'bg-blue-100 text-blue-700',
    sales: 'bg-purple-100 text-purple-700',
    ops: 'bg-teal-100 text-teal-700',
    agency: 'bg-amber-100 text-amber-700',
    customer_support: 'bg-rose-100 text-rose-700',
  };

  const runHealth = async () => {
    try {
      const supabase = tryGetSupabase();
      const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : undefined;
      const resp = await fetch('/api/health', { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      const json = (await resp.json()) as { ok?: unknown; checks?: unknown };
      const ok = typeof json.ok === 'boolean' ? json.ok : false;
      const checks = Array.isArray(json.checks) ? (json.checks as Array<{ name: string; ok: boolean; details?: string }>) : [];
      setHealth({ loading: false, ok, checks });
    } catch {
      setHealth({ loading: false, ok: false, checks: [{ name: 'API:/api/health', ok: false, details: 'Failed to fetch' }] });
    }
  };

  const runFlowAudit = async () => {
    setAudit((a) => ({ ...a, loading: true }));
    try {
      const supabase = tryGetSupabase();
      const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : undefined;
      const resp = await fetch('/api/flow-audit', { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      const json = (await resp.json()) as { ok?: unknown; issueCount?: unknown; issues?: unknown };
      const ok = typeof json.ok === 'boolean' ? json.ok : false;
      const issueCount = typeof json.issueCount === 'number' ? json.issueCount : 0;
      const issues = Array.isArray(json.issues) ? (json.issues as Array<{ severity: 'high' | 'medium' | 'low'; code: string; message: string }>) : [];
      setAudit({ loading: false, ok, issueCount, issues });
    } catch {
      setAudit({ loading: false, ok: false, issueCount: 1, issues: [{ severity: 'high', code: 'AUDIT_FETCH_FAILED', message: 'Failed to run flow audit' }] });
    }
  };

  useEffect(() => {
    if (activeTab !== 'analytics') return;
    window.setTimeout(() => {
      setHealth((h) => ({ ...h, loading: true }));
      void runHealth();
    }, 0);
  }, [activeTab]);

  /* ── Shared modal shell ── */
  const inputCls ="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none transition-all";
  const selectCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none transition-all appearance-none bg-white";

  /* ── Shared credentials display ── */
  const CredsDisplay = ({ creds }: { creds: { username: string; password?: string } }) => (
    <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-xl space-y-3">
      <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Account created</p>
      <div className="space-y-2">
        <div>
          <p className="text-xs text-gray-400 mb-1">Username</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800">{creds.username}</code>
            <button onClick={() => copyToClipboard(creds.username, 'username')} className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-amber-600 hover:border-amber-200 transition-colors">
              {copiedField === 'username' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {creds.password ? (
          <div>
            <p className="text-xs text-gray-400 mb-1">Password</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800">{creds.password}</code>
              <button onClick={() => copyToClipboard(creds.password!, 'password')} className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-amber-600 hover:border-amber-200 transition-colors">
                {copiedField === 'password' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-green-700">Credentials were sent to the user email.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF9] space-y-6 pb-12">
      {/* Page Header */}
      <section className="flex flex-col gap-1">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-700 mb-2">
              Admin Portal
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Executive Overview</h1>
            <p className="text-sm text-gray-500 mt-0.5">Global platform performance and user management.</p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="mt-4 border-b border-gray-200">
          <nav className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    {stat.trend ? (
                      <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        {stat.trend}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </section>

            {/* Backend Health */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className={`w-4 h-4 ${health.ok ? 'text-green-600' : 'text-amber-500'}`} />
                  <span className="text-base font-bold text-gray-900">Backend Health</span>
                  <span className="text-sm text-gray-500">
                    {health.loading ? '— Checking...' : (health.ok ? '— All systems operational' : '— Action required')}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setHealth((h) => ({ ...h, loading: true }));
                    void runHealth();
                  }}
                  className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Refresh
                </button>
              </div>
              {health.checks.length > 0 && (
                <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {health.checks.map((c) => (
                    <div key={c.name} className={`rounded-xl p-4 border ${c.ok ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 truncate">{c.name}</p>
                      <p className={`mt-1 font-bold text-sm ${c.ok ? 'text-green-700' : 'text-red-700'}`}>{c.ok ? 'OK' : 'FAIL'}</p>
                      {c.details && <p className="text-[10px] text-gray-500 mt-1 truncate">{c.details}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Flow Audit */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Activity className={`w-4 h-4 ${audit.ok ? 'text-green-600' : 'text-amber-500'}`} />
                  <span className="text-base font-bold text-gray-900">Flow Audit</span>
                  <span className="text-sm text-gray-500">
                    {audit.loading ? '— Running checks...' : (audit.ok ? '— No issues detected' : (audit.ok === null ? '— Run a sanity check for role flows' : `— ${audit.issueCount} issue(s) detected`))}
                  </span>
                </div>
                <button
                  onClick={() => void runFlowAudit()}
                  className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors"
                >
                  Run Audit
                </button>
              </div>
              {audit.ok === false && audit.issues.length > 0 && (
                <div className="p-5 grid md:grid-cols-2 gap-3">
                  {audit.issues.slice(0, 6).map((i) => (
                    <div key={i.code} className={`rounded-xl p-4 border ${i.severity === 'high' ? 'bg-red-50 border-red-100' : i.severity === 'medium' ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{i.code}</p>
                      <p className="mt-1 font-semibold text-sm text-gray-900">{i.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Charts Section */}
            <section className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-bold text-gray-900">Growth Trajectory</h3>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Live</span>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280} debounce={1}>
                    <AreaChart data={applications.map((_, i) => ({ idx: i + 1, apps: i + 1, enrollment: applications.slice(0, i + 1).filter(x => isComplete(x.studentId)).length }))}>
                      <defs>
                        <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="idx" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94a3b8'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94a3b8'}} />
                      <Tooltip
                        contentStyle={{borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.06)'}}
                        itemStyle={{fontWeight: 600}}
                      />
                      <Area type="monotone" dataKey="apps" stroke="#F59E0B" strokeWidth={2.5} fillOpacity={1} fill="url(#colorApps)" name="Applications" />
                      <Area type="monotone" dataKey="enrollment" stroke="#6b7280" strokeWidth={2.5} fillOpacity={0} name="Enrollments" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-900 mb-6">Funnel Distribution</h3>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280} debounce={1}>
                    <PieChart>
                      <Pie
                        data={stageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stageData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.06)'}}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="grid lg:grid-cols-2 gap-6">
              {/* Leaderboards */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-base font-bold text-gray-900">Leaderboards</h3>
                </div>
                <div className="p-5 grid md:grid-cols-3 gap-5">
                  {[
                    { role: 'staff', label: 'Staff Points', badgeCls: 'bg-blue-100 text-blue-700', exportFile: 'staff-leaderboard.csv' },
                    { role: 'sales', label: 'Sales Points', badgeCls: 'bg-purple-100 text-purple-700', exportFile: 'sales-leaderboard.csv' },
                    { role: 'agency', label: 'Agencies Points', badgeCls: 'bg-amber-100 text-amber-700', exportFile: 'agencies-leaderboard.csv' },
                  ].map(({ role, label, badgeCls, exportFile }) => (
                    <div key={role}>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">{label}</p>
                      <div className="space-y-2">
                        {users.filter(u => u.role === role).sort((a, b) => (b.points ?? 0) - (a.points ?? 0)).map((u, i) => (
                          <div key={u.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 px-3 py-2.5 rounded-xl">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 bg-gray-900 text-white rounded-md flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                              <p className="font-semibold text-sm text-gray-900 truncate">{u.name}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeCls}`}>{u.points ?? 0}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3">
                        <a
                          href={`data:text/csv;charset=utf-8,${encodeURIComponent(['Rank,Name,Points', ...users.filter(u => u.role===role).sort((a,b)=>(b.points??0)-(a.points??0)).map((u,i)=>`${i+1},${u.name},${u.points??0}`)].join('\\n'))}`}
                          download={exportFile}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
                        >
                          Export CSV
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Students Overview */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-base font-bold text-gray-900">Students Overview</h3>
                </div>
                <div className="p-5 grid md:grid-cols-2 gap-5">
                  {[
                    { label: 'Public Leads', source: 'public' },
                    { label: 'Agency Leads', source: 'agency' },
                  ].map(({ label, source }) => (
                    <div key={source}>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">{label}</p>
                      <div className="space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar">
                        {applications.filter(a => (a.source ?? 'public') === source && a.status === 'approved').map((a) => (
                          <div key={a.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                            <p className="font-semibold text-sm text-gray-900">{a.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{a.university || 'No university set'}</p>
                          </div>
                        ))}
                        {applications.filter(a => (a.source ?? 'public') === source && a.status === 'approved').length === 0 && (
                          <p className="text-xs text-gray-400">No {source} students</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Agency Analytics */}
            <section>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Agency Analytics</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {agencyAnalytics.map((stat, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Live</span>
                    </div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Staff Coverage */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Staff Coverage</h2>
                <p className="text-sm text-gray-500 mt-0.5">University responsibilities and current load.</p>
              </div>
              {(() => {
                const staff = users.filter(u => u.role === 'staff');
                const approved = applications.filter(a => a.status === 'approved');
                const counts = new Map<string, number>();
                approved.forEach((a) => {
                  if (!a.assignedStaffId) return;
                  counts.set(a.assignedStaffId, (counts.get(a.assignedStaffId) ?? 0) + 1);
                });
                const uncovered = UNIVERSITY_OPTIONS.filter(u => !staff.some(s => (s.staffUniversities ?? []).includes(u.id)));
                const unassigned = approved.filter(a => !a.assignedStaffId).length;
                return (
                  <div className="p-5 space-y-5">
                    <div className="grid md:grid-cols-3 gap-4">
                      {[
                        { label: 'Staff Members', value: staff.length },
                        { label: 'Unassigned Students', value: unassigned },
                        { label: 'Uncovered Universities', value: uncovered.length },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid lg:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Staff Load</p>
                        <div className="space-y-2">
                          {staff
                            .slice()
                            .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))
                            .map((s) => (
                              <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-start justify-between gap-4">
                                <div>
                                  <p className="font-semibold text-sm text-gray-900">{s.name}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {(s.staffUniversities ?? []).length ? (s.staffUniversities ?? []).map(getUniversityName).join(' • ') : 'No universities assigned'}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Assigned</p>
                                  <p className="text-xl font-bold text-amber-600 mt-0.5">{counts.get(s.id) ?? 0}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Uncovered Universities</p>
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                          {uncovered.length === 0 ? (
                            <p className="text-sm text-gray-600">All universities have coverage.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {uncovered.map(u => (
                                <span key={u.id} className="px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600">
                                  {u.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* System Users */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <h2 className="text-base font-bold text-gray-900 shrink-0">System Users</h2>
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 md:ml-auto">
                    <button
                      onClick={() => setShowAgencyModal(true)}
                      className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors"
                    >
                      + Agency
                    </button>
                    <button
                      onClick={() => setShowOpsModal(true)}
                      className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors"
                    >
                      + Ops
                    </button>
                    <button
                      onClick={() => setShowSalesModal(true)}
                      className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors"
                    >
                      + Sales
                    </button>
                    <button
                      onClick={() => setShowStaffModal(true)}
                      className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors"
                    >
                      + Staff
                    </button>
                    <button
                      onClick={() => setShowSupportModal(true)}
                      className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors"
                    >
                      + Support
                    </button>
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Assign Admin
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-50">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="group flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${roleAvatarColors[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + username */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-400 truncate">@{u.username} · {u.email}</p>
                    </div>

                    {/* Role badge */}
                    <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider shrink-0 ${roleColors[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>

                    {/* Joined */}
                    <span className="hidden lg:block text-xs text-gray-400 shrink-0 w-24 text-right">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {u.role === 'staff' && (
                        <button
                          onClick={() => {
                            setUniUserId(u.id);
                            setUniSelection(u.staffUniversities ?? []);
                            setShowUniModal(true);
                          }}
                          className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          aria-label="Staff universities"
                        >
                          <GraduationCap className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setCredUserId(u.id);
                          setCredUsername(u.username);
                          setCredEmail(u.email);
                          setCredPassword('');
                          setShowCredModal(true);
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                        aria-label="Edit credentials"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (!window.confirm(`Lock ${u.name}'s account? This will reset their password to a random value, preventing login.`)) return;
                          void useAppStore.getState().ceoResetCredentials(u.id, { password: `LOCKED-${Date.now()}` })
                            .then(() => toast.success(`${u.name}'s account locked`))
                            .catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'));
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        aria-label="Lock account"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (!window.confirm(`Delete ${u.name}'s account?\n\nThey will be moved to Trash and blocked from logging in. You can restore them or delete permanently from the Trash tab.`)) return;
                          void ceoDisableUser(u.id)
                            .then(() => toast.success(`${u.name} moved to Trash`))
                            .catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'));
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        aria-label="Delete account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="py-12 text-center text-gray-400 text-sm">No users found.</div>
                )}
              </div>
            </div>

            {/* Modals */}
            {showAgencyModal && (
              <ModalShell title="Create Agency Account" onClose={() => { setShowAgencyModal(false); setCreatedAgencyCreds(null); }}>
                <div className="space-y-4">
                  <Field label="Agency name">
                    <input className={inputCls} value={agencyName} onChange={(e) => setAgencyName(e.target.value)} />
                  </Field>
                  <Field label="Email">
                    <input type="email" className={inputCls} value={agencyEmail} onChange={(e) => setAgencyEmail(e.target.value)} />
                  </Field>
                  {createdAgencyCreds && <CredsDisplay creds={createdAgencyCreds} />}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => { setShowAgencyModal(false); setCreatedAgencyCreds(null); }} className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                  <button
                    onClick={async () => {
                      const name = agencyName.trim();
                      const email = agencyEmail.trim();
                      if (!name || !email) { toast.error('Please enter name and email'); return; }
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Invalid email'); return; }
                      try {
                        const created = await ceoCreateAgencyAccount(name, email);
                        setCreatedAgencyCreds({ username: created.username, ...(created.password ? { password: created.password } : {}) });
                        toast.success('Agency account created');
                        setAgencyName('');
                        setAgencyEmail('');
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Failed to create agency');
                      }
                    }}
                    className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors"
                  >
                    Create
                  </button>
                </div>
              </ModalShell>
            )}

            {showCredModal && (
              <ModalShell title="Edit Account" onClose={() => setShowCredModal(false)}>
                <div className="space-y-4">
                  <Field label="Username">
                    <input className={inputCls} value={credUsername} onChange={(e) => setCredUsername(e.target.value)} autoComplete="off" />
                  </Field>
                  <Field label="Email">
                    <input type="email" className={inputCls} value={credEmail} onChange={(e) => setCredEmail(e.target.value)} autoComplete="off" placeholder="login@email.com" />
                  </Field>
                  <Field label="New Password">
                    <input type="text" className={inputCls} value={credPassword} onChange={(e) => setCredPassword(e.target.value)} autoComplete="new-password" placeholder="Leave blank to keep current" />
                  </Field>
                  <p className="text-xs text-gray-400">Only the fields you change are updated. The user can sign in with the new email/username immediately.</p>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setShowCredModal(false)} className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                  <button
                    disabled={credSaving}
                    onClick={async () => {
                      if (!credUserId) return;
                      const original = users.find(u => u.id === credUserId);
                      const updates: { username?: string; email?: string; password?: string } = {};
                      const uname = credUsername.trim();
                      const mail = credEmail.trim();
                      if (uname && uname !== original?.username) updates.username = uname;
                      if (mail && mail !== original?.email) updates.email = mail;
                      if (credPassword) {
                        if (credPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
                        updates.password = credPassword;
                      }
                      if (Object.keys(updates).length === 0) { toast.error('Nothing to update'); return; }
                      setCredSaving(true);
                      try {
                        await ceoResetCredentials(credUserId, updates);
                        toast.success('Account updated');
                        setShowCredModal(false);
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Failed to update');
                      } finally {
                        setCredSaving(false);
                      }
                    }}
                    className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-60"
                  >
                    {credSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </ModalShell>
            )}

            {showUniModal && (
              <ModalShell title="Staff University Responsibilities" onClose={() => setShowUniModal(false)} maxW="max-w-2xl">
                <p className="text-sm text-gray-500 -mt-2 mb-4">{users.find(u => u.id === uniUserId)?.name ?? ''}</p>
                <div className="grid md:grid-cols-2 gap-2">
                  {UNIVERSITY_OPTIONS.map((u) => {
                    const checked = uniSelection.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => setUniSelection((prev) => checked ? prev.filter(x => x !== u.id) : [...prev, u.id])}
                        className={`px-4 py-3 rounded-xl border text-left transition-all ${
                          checked ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        type="button"
                      >
                        <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{getUniversityName(u.id)}</p>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setShowUniModal(false)} className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                  <button
                    onClick={() => {
                      if (!uniUserId) return;
                      ceoUpdateUser(uniUserId, { staffUniversities: uniSelection });
                      setShowUniModal(false);
                    }}
                    className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </ModalShell>
            )}

            {showAssignModal && (
              <ModalShell title="Assign Staff Admin to Student" onClose={() => setShowAssignModal(false)}>
                <div className="space-y-4">
                  <Field label="Student">
                    <select value={assignStudentId} onChange={(e) => setAssignStudentId(e.target.value)} className={selectCls}>
                      <option value="">Select student...</option>
                      {applications.filter(a => a.studentId).map(a => (
                        <option key={a.id} value={a.studentId!}>{a.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Staff">
                    <select value={assignStaffId} onChange={(e) => setAssignStaffId(e.target.value)} className={selectCls}>
                      <option value="">Select staff...</option>
                      {users.filter(u => u.role === 'staff').map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setShowAssignModal(false)} className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                  <button
                    onClick={() => {
                      if (!assignStudentId || !assignStaffId) return;
                      try {
                        assignStaffAdmin(assignStudentId, assignStaffId);
                        setShowAssignModal(false);
                      } catch {
                        // assignment failed
                      }
                    }}
                    className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors"
                  >
                    Assign
                  </button>
                </div>
              </ModalShell>
            )}

            {showOpsModal && (
              <ModalShell title="Create Ops User" onClose={() => { setShowOpsModal(false); setCreatedOpsCreds(null); }}>
                <div className="space-y-4">
                  <Field label="Name">
                    <input className={inputCls} value={opsName} onChange={(e) => setOpsName(e.target.value)} />
                  </Field>
                  <Field label="Email">
                    <input type="email" className={inputCls} value={opsEmail} onChange={(e) => setOpsEmail(e.target.value)} />
                  </Field>
                  {createdOpsCreds && <CredsDisplay creds={createdOpsCreds} />}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => { setShowOpsModal(false); setCreatedOpsCreds(null); }} className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                  <button
                    onClick={async () => {
                      const name = opsName.trim();
                      const email = opsEmail.trim();
                      if (!name || !email) { toast.error('Please enter name and email'); return; }
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Invalid email'); return; }
                      const user = { id: '', username: '', role: 'ops' as const, name, email, points: 0, createdAt: new Date().toISOString() };
                      try {
                        const created = await ceoCreateUser(user);
                        setCreatedOpsCreds({ username: created.username, ...(created.password ? { password: created.password } : {}) });
                        toast.success('Ops user created');
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Failed to create user');
                      }
                    }}
                    className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors"
                  >
                    Create
                  </button>
                </div>
              </ModalShell>
            )}

            {showSalesModal && (
              <ModalShell title="Create Sales User" onClose={() => { setShowSalesModal(false); setCreatedSalesCreds(null); }}>
                <div className="space-y-4">
                  <Field label="Name">
                    <input className={inputCls} value={salesName} onChange={(e) => setSalesName(e.target.value)} />
                  </Field>
                  <Field label="Email">
                    <input type="email" className={inputCls} value={salesEmail} onChange={(e) => setSalesEmail(e.target.value)} />
                  </Field>
                  {createdSalesCreds && <CredsDisplay creds={createdSalesCreds} />}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => { setShowSalesModal(false); setCreatedSalesCreds(null); }} className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                  <button
                    onClick={async () => {
                      const name = salesName.trim();
                      const email = salesEmail.trim();
                      if (!name || !email) { toast.error('Please enter name and email'); return; }
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Invalid email'); return; }
                      const user = { id: '', username: '', role: 'sales' as const, name, email, points: 0, createdAt: new Date().toISOString() };
                      try {
                        const created = await ceoCreateUser(user);
                        setCreatedSalesCreds({ username: created.username, ...(created.password ? { password: created.password } : {}) });
                        toast.success('Sales user created');
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Failed to create user');
                      }
                    }}
                    className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors"
                  >
                    Create
                  </button>
                </div>
              </ModalShell>
            )}

            {showStaffModal && (
              <ModalShell title="Create Staff User" onClose={() => { setShowStaffModal(false); setCreatedStaffCreds(null); }}>
                <div className="space-y-4">
                  <Field label="Name">
                    <input className={inputCls} value={staffName} onChange={(e) => setStaffName(e.target.value)} />
                  </Field>
                  <Field label="Email">
                    <input type="email" className={inputCls} value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} />
                  </Field>
                  {createdStaffCreds && <CredsDisplay creds={createdStaffCreds} />}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => { setShowStaffModal(false); setCreatedStaffCreds(null); }} className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                  <button
                    onClick={async () => {
                      const name = staffName.trim();
                      const email = staffEmail.trim();
                      if (!name || !email) { toast.error('Please enter name and email'); return; }
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Invalid email'); return; }
                      const u = { id: '', username: '', role: 'staff' as const, name, email, points: 0, createdAt: new Date().toISOString() };
                      try {
                        const created = await ceoCreateUser(u);
                        setCreatedStaffCreds({ username: created.username, ...(created.password ? { password: created.password } : {}) });
                        toast.success('Staff user created');
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Failed to create user');
                      }
                    }}
                    className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors"
                  >
                    Create
                  </button>
                </div>
              </ModalShell>
            )}

            {showSupportModal && (
              <ModalShell title="Create Customer Support User" onClose={() => { setShowSupportModal(false); setCreatedSupportCreds(null); }}>
                <div className="space-y-4">
                  <Field label="Name">
                    <input className={inputCls} value={supportName} onChange={(e) => setSupportName(e.target.value)} />
                  </Field>
                  <Field label="Email">
                    <input type="email" className={inputCls} value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                  </Field>
                  <p className="text-xs text-gray-400">Customer Support can manage their own leads and monitor every sales rep's leads &amp; notes.</p>
                  {createdSupportCreds && <CredsDisplay creds={createdSupportCreds} />}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => { setShowSupportModal(false); setCreatedSupportCreds(null); }} className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                  <button
                    onClick={async () => {
                      const name = supportName.trim();
                      const email = supportEmail.trim();
                      if (!name || !email) { toast.error('Please enter name and email'); return; }
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Invalid email'); return; }
                      const u = { id: '', username: '', role: 'customer_support' as const, name, email, points: 0, createdAt: new Date().toISOString() };
                      try {
                        const created = await ceoCreateUser(u);
                        setCreatedSupportCreds({ username: created.username, ...(created.password ? { password: created.password } : {}) });
                        toast.success('Customer Support user created');
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Failed to create user');
                      }
                    }}
                    className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors"
                  >
                    Create
                  </button>
                </div>
              </ModalShell>
            )}
          </motion.div>
        )}

        {activeTab === 'forms' && (
          <motion.div
            key="forms"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Active forms */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-bold text-gray-900">Active Forms</h3>
                <span className="ml-auto text-xs font-semibold text-gray-400">{applications.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {applications.map((a) => (
                  <div key={a.id} className="group flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{a.name || 'Unnamed'}</p>
                      <p className="text-xs text-gray-400 truncate">{a.program || a.university || a.studentEmail || a.email || '—'}</p>
                    </div>
                    <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider shrink-0 bg-gray-100 text-gray-600">{a.source ?? 'public'}</span>
                    <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider shrink-0 bg-amber-50 text-amber-700">{a.status}</span>
                    <span className="hidden lg:block text-xs text-gray-400 shrink-0 w-24 text-right">{new Date(a.createdAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          if (!window.confirm(`Delete this form (${a.name || 'Unnamed'})?\n\nIt will be moved to Trash. You can restore it or delete permanently from the Trash tab.`)) return;
                          try { ceoTrashApplication(a.id); toast.success('Form moved to Trash'); }
                          catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        aria-label="Delete form"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {applications.length === 0 && (
                  <div className="py-12 text-center text-gray-400 text-sm">No active forms.</div>
                )}
              </div>
            </div>

            {/* Future leads (archived rejected forms) */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Archive className="w-4 h-4 text-blue-500" />
                <h3 className="text-base font-bold text-gray-900">Future Leads</h3>
                <span className="ml-auto text-xs font-semibold text-gray-400">{futureLeads.length}</span>
              </div>
              <p className="px-5 pt-3 text-xs text-gray-400">Rejected forms are archived here for later re-contact (e.g. if country rules change).</p>
              <div className="divide-y divide-gray-50">
                {futureLeads.map((a) => (
                  <div key={a.id} className="group flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{a.name || 'Unnamed'}</p>
                      <p className="text-xs text-gray-400 truncate">{a.studentEmail || a.email || a.phone || '—'}{a.program ? ` · ${a.program}` : ''}</p>
                    </div>
                    <span className="hidden lg:block text-xs text-gray-400 shrink-0 w-28 text-right">
                      {a.rejectedAt ? `rejected ${new Date(a.rejectedAt).toLocaleDateString()}` : ''}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          try { ceoRestoreFutureLead(a.id); toast.success('Re-opened as an active form'); }
                          catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                        aria-label="Re-open lead"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (!window.confirm(`Permanently delete this lead (${a.name || 'Unnamed'})? This cannot be undone.`)) return;
                          try { ceoDeleteFutureLead(a.id); toast.success('Lead deleted'); }
                          catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        aria-label="Delete lead permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {futureLeads.length === 0 && (
                  <div className="py-12 text-center text-gray-400 text-sm">No future leads yet.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'requests' && (
          <motion.div
            key="requests"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-bold text-gray-900">Credential Change Requests</h3>
                <span className="ml-auto text-xs font-semibold text-gray-400">{pendingCredRequests.length} pending</span>
              </div>
              <p className="px-5 pt-3 text-xs text-gray-400">Agencies can't contact their students directly, so they request credential changes here for your approval.</p>
              <div className="divide-y divide-gray-50">
                {pendingCredRequests.length === 0 && (
                  <div className="py-12 text-center text-gray-400 text-sm">No pending requests.</div>
                )}
                {pendingCredRequests.map((r) => (
                  <div key={r.id} className="px-5 py-4 flex flex-wrap items-start justify-between gap-4 hover:bg-gray-50/60 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{r.studentName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Requested by <span className="font-semibold text-gray-600">{r.agencyName}</span> · {new Date(r.createdAt).toLocaleString()}</p>
                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">{r.reason}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (!window.confirm(`Approve and generate new credentials for ${r.studentName}? The new password will be emailed to ${r.agencyName}.`)) return;
                          void ceoResolveCredentialRequest(r.id)
                            .then(() => toast.success('New credentials generated and sent to the agency'))
                            .catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'));
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors"
                      >
                        <Check className="w-4 h-4" /> Approve & reset
                      </button>
                      <button
                        onClick={() => {
                          const note = window.prompt(`Decline the request for ${r.studentName}? Optionally add a reason:`, '');
                          if (note === null) return;
                          try { ceoRejectCredentialRequest(r.id, note || undefined); toast.success('Request declined'); }
                          catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                      >
                        <X className="w-4 h-4" /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recently handled */}
            {credentialRequests.some(r => r.status !== 'pending') && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <h3 className="text-base font-bold text-gray-900">Recently Handled</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {credentialRequests.filter(r => r.status !== 'pending').slice(0, 20).map((r) => (
                    <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{r.studentName} <span className="text-xs font-normal text-gray-400">· {r.agencyName}</span></p>
                        <p className="text-xs text-gray-400">{r.resolvedAt ? new Date(r.resolvedAt).toLocaleString() : ''}{r.resolvedByName ? ` · by ${r.resolvedByName}` : ''}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider shrink-0 ${r.status === 'resolved' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'trash' && (
          <motion.div
            key="trash"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Trashed accounts */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-red-500" />
                <h3 className="text-base font-bold text-gray-900">Deleted Accounts</h3>
                <span className="ml-auto text-xs font-semibold text-gray-400">{trashedUsers.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {trashedUsers.map((u) => (
                  <div key={u.id} className="group flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-400 truncate">@{u.username} · {u.email}</p>
                    </div>
                    <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider shrink-0 bg-gray-100 text-gray-600">{u.role}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          void ceoRestoreUser(u.id)
                            .then(() => toast.success(`${u.name} restored`))
                            .catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'));
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                        aria-label="Restore account"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (!window.confirm(`Permanently delete ${u.name}'s account?\n\nThis removes them from Supabase and CANNOT be undone.`)) return;
                          void ceoPurgeUser(u.id)
                            .then(() => toast.success(`${u.name} permanently deleted`))
                            .catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'));
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        aria-label="Delete account permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {trashedUsers.length === 0 && (
                  <div className="py-12 text-center text-gray-400 text-sm">No deleted accounts.</div>
                )}
              </div>
            </div>

            {/* Trashed forms */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-red-500" />
                <h3 className="text-base font-bold text-gray-900">Deleted Forms</h3>
                <span className="ml-auto text-xs font-semibold text-gray-400">{trashedApplications.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {trashedApplications.map((a) => (
                  <div key={a.id} className="group flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{a.name || 'Unnamed'}</p>
                      <p className="text-xs text-gray-400 truncate">{a.program || a.university || a.studentEmail || a.email || '—'}</p>
                    </div>
                    <span className="hidden lg:block text-xs text-gray-400 shrink-0 w-28 text-right">
                      {a.trashedAt ? `deleted ${new Date(a.trashedAt).toLocaleDateString()}` : ''}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          try { ceoRestoreApplication(a.id); toast.success('Form restored'); }
                          catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                        aria-label="Restore form"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (!window.confirm(`Permanently delete this form (${a.name || 'Unnamed'})? This cannot be undone.`)) return;
                          try { ceoPurgeApplication(a.id); toast.success('Form permanently deleted'); }
                          catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        aria-label="Delete form permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {trashedApplications.length === 0 && (
                  <div className="py-12 text-center text-gray-400 text-sm">No deleted forms.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* System Activity Log */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-bold text-gray-900">System Activity Log</h3>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { user: 'ceo', action: 'Modified system permissions', time: '2 mins ago', icon: Shield },
                  { user: 'sales1', action: 'Approved student APP902', time: '15 mins ago', icon: CheckCircle2 },
                  { user: 'staff2', action: 'Uploaded document for ID293', time: '45 mins ago', icon: FileText },
                  { user: 'system', action: 'Automated backup completed', time: '2 hours ago', icon: Activity },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        <span className="text-amber-600">@{item.user}</span> {item.action}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <button
                  onClick={() => setActiveTab('users')}
                  className="w-full py-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  View All Users
                </button>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-bold text-gray-900">Security Settings</h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-400 mt-0.5">Mandatory for all staff accounts</p>
                  </div>
                  <div className="w-12 h-6 bg-amber-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Session Timeout</p>
                    <p className="text-xs text-gray-400 mt-0.5">Automatic logout after 30 mins</p>
                  </div>
                  <button className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">
                    Configure
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">IP Whitelisting</p>
                    <p className="text-xs text-gray-400 mt-0.5">Restrict admin access by IP</p>
                  </div>
                  <button className="text-xs font-semibold text-gray-400 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg">
                    Disabled
                  </button>
                </div>
              </div>
              <div className="px-5 pb-5 pt-1">
                <button className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors">
                  <Shield className="w-4 h-4" />
                  Run Security Audit
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
