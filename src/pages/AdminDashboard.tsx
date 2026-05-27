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
  Edit3
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { UNIVERSITY_OPTIONS, getUniversityName } from '../lib/universities';
import toast from 'react-hot-toast';
import { tryGetSupabase } from '../lib/supabase';

const AdminDashboard: React.FC = () => {
  useAuth();
  const { users, applications, ceoCreateAgencyAccount, ceoResetCredentials, assignStaffAdmin, ceoCreateUser, ceoUpdateUser } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'security'>('analytics');
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
  const [showUniModal, setShowUniModal] = useState(false);
  const [uniUserId, setUniUserId] = useState<string | null>(null);
  const [uniSelection, setUniSelection] = useState<string[]>([]);
  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
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

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Processing', value: processingCount, trend: '', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Enrolled', value: enrolledCount, trend: '', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Closed Cases', value: closedCount, trend: '', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Applications', value: applications.length, trend: '', icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];
  const agencyApps = applications.filter(a => (a.source ?? 'public') === 'agency');
  const agencyEnrolled = agencyApps.filter(a => isComplete(a.studentId)).length;
  const agencyProcessing = agencyApps.filter(a => !isComplete(a.studentId) && a.status === 'approved').length;
  const agencyClosed = agencyApps.filter(a => a.stage === 'enrolled' && a.arrived).length;
  const agencyAnalytics = [
    { label: 'Agency Processing', value: agencyProcessing, icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Agency Enrolled', value: agencyEnrolled, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Agency Closed', value: agencyClosed, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Agency Apps', value: agencyApps.length, icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

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

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight">Executive Overview</h1>
          <p className="text-gray-500 font-medium">Global platform performance and user management.</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
            Admin Portal
          </div>
        </div>
        <div className="tw-panel p-1 flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.id 
                  ? 'bg-black text-white shadow-lg' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence mode="wait">
        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <section className="tw-card tw-card-hover p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-black flex items-center gap-2">
                    <ShieldAlert className={`w-5 h-5 ${health.ok ? 'text-green-600' : 'text-amber-600'}`} />
                    Backend Health
                  </h2>
                  <p className="text-sm font-medium text-gray-500 mt-1">
                    {health.loading ? 'Checking...' : (health.ok ? 'All systems operational' : 'Action required')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setHealth((h) => ({ ...h, loading: true }));
                    void runHealth();
                  }}
                  className="px-5 py-2.5 rounded-2xl font-black text-sm bg-black text-white hover:bg-amber-500 hover:text-black transition-all"
                >
                  Refresh
                </button>
              </div>
              <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {health.checks.map((c) => (
                  <div key={c.name} className={`tw-panel p-4 ${c.ok ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{c.name}</p>
                    <p className={`mt-1 font-black ${c.ok ? 'text-green-700' : 'text-red-700'}`}>{c.ok ? 'OK' : 'FAIL'}</p>
                    {c.details && <p className="text-[10px] font-bold text-gray-500 mt-1 truncate">{c.details}</p>}
                  </div>
                ))}
              </div>
            </section>

            <section className="tw-card tw-card-hover p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-black flex items-center gap-2">
                    <Activity className={`w-5 h-5 ${audit.ok ? 'text-green-600' : 'text-amber-600'}`} />
                    Flow Audit
                  </h2>
                  <p className="text-sm font-medium text-gray-500 mt-1">
                    {audit.loading ? 'Running checks...' : (audit.ok ? 'No issues detected' : (audit.ok === null ? 'Run a quick sanity check for role flows' : `${audit.issueCount} issue(s) detected`))}
                  </p>
                </div>
                <button
                  onClick={() => void runFlowAudit()}
                  className="px-5 py-2.5 rounded-2xl font-black text-sm bg-black text-white hover:bg-amber-500 hover:text-black transition-all"
                >
                  Run Audit
                </button>
              </div>
              {audit.ok === false && audit.issues.length > 0 && (
                <div className="mt-5 grid md:grid-cols-2 gap-3">
                  {audit.issues.slice(0, 6).map((i) => (
                    <div key={i.code} className={`tw-panel p-4 ${i.severity === 'high' ? 'bg-red-50 border-red-100' : i.severity === 'medium' ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{i.code}</p>
                      <p className="mt-1 font-black text-black">{i.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Stats Grid */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="tw-card tw-card-hover p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      {stat.trend}
                    </span>
                  </div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-black">{stat.value}</p>
                </div>
              ))}
            </section>

            {/* Charts Section */}
            <section className="grid lg:grid-cols-2 gap-8">
              {/* Growth Area Chart */}
              <div className="tw-card tw-card-hover p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-black">Growth Trajectory</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live</span>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
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
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        itemStyle={{fontWeight: 700}}
                      />
                      <Area type="monotone" dataKey="apps" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorApps)" name="Applications" />
                      <Area type="monotone" dataKey="enrollment" stroke="#000000" strokeWidth={3} fillOpacity={0} name="Enrollments" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stage Distribution */}
              <div className="tw-card tw-card-hover p-8">
                <h3 className="text-xl font-black text-black mb-8">Funnel Distribution</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
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
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
            <section className="grid lg:grid-cols-2 gap-8">
              <div className="tw-card tw-card-hover p-8">
                <h3 className="text-xl font-black text-black mb-6">Leaderboards</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Staff Points</p>
                    <div className="space-y-3">
                      {users.filter(u => u.role === 'staff').sort((a, b) => (b.points ?? 0) - (a.points ?? 0)).map((u, i) => (
                        <div key={u.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 bg-black text-white rounded-lg flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                            <p className="font-bold text-black">{u.name}</p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-green-100 text-green-700">{u.points ?? 0}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <a
                        href={`data:text/csv;charset=utf-8,${encodeURIComponent(['Rank,Name,Points', ...users.filter(u => u.role==='staff').sort((a,b)=>(b.points??0)-(a.points??0)).map((u,i)=>`${i+1},${u.name},${u.points??0}`)].join('\\n'))}`}
                        download="staff-leaderboard.csv"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-sm font-bold hover:bg-amber-500 hover:text-black transition-all"
                      >
                        Export CSV
                      </a>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Sales Points</p>
                    <div className="space-y-3">
                      {users.filter(u => u.role === 'sales').sort((a, b) => (b.points ?? 0) - (a.points ?? 0)).map((u, i) => (
                        <div key={u.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 bg-black text-white rounded-lg flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                            <p className="font-bold text-black">{u.name}</p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-purple-100 text-purple-700">{u.points ?? 0}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <a
                        href={`data:text/csv;charset=utf-8,${encodeURIComponent(['Rank,Name,Points', ...users.filter(u => u.role==='sales').sort((a,b)=>(b.points??0)-(a.points??0)).map((u,i)=>`${i+1},${u.name},${u.points??0}`)].join('\\n'))}`}
                        download="sales-leaderboard.csv"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-sm font-bold hover:bg-amber-500 hover:text-black transition-all"
                      >
                        Export CSV
                      </a>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Agencies Points</p>
                    <div className="space-y-3">
                      {users.filter(u => u.role === 'agency').sort((a, b) => (b.points ?? 0) - (a.points ?? 0)).map((u, i) => (
                        <div key={u.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 bg-black text-white rounded-lg flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                            <p className="font-bold text-black">{u.name}</p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">{u.points ?? 0}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <a
                        href={`data:text/csv;charset=utf-8,${encodeURIComponent(['Rank,Name,Points', ...users.filter(u => u.role==='agency').sort((a,b)=>(b.points??0)-(a.points??0)).map((u,i)=>`${i+1},${u.name},${u.points??0}`)].join('\\n'))}`}
                        download="agencies-leaderboard.csv"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-sm font-bold hover:bg-amber-500 hover:text-black transition-all"
                      >
                        Export CSV
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="tw-card tw-card-hover p-8">
                <h3 className="text-xl font-black text-black mb-6">Students Overview</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Public Leads</p>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {applications.filter(a => (a.source ?? 'public') === 'public' && a.status === 'approved').map((a) => (
                        <div key={a.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                          <p className="font-bold text-black">{a.name}</p>
                          <p className="text-xs font-medium text-gray-500">{a.university || 'No university set'}</p>
                        </div>
                      ))}
                      {applications.filter(a => (a.source ?? 'public') === 'public' && a.status === 'approved').length === 0 && (
                        <p className="text-xs font-medium text-gray-400">No public students</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Agency Leads</p>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {applications.filter(a => (a.source ?? 'public') === 'agency' && a.status === 'approved').map((a) => (
                        <div key={a.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                          <p className="font-bold text-black">{a.name}</p>
                          <p className="text-xs font-medium text-gray-500">{a.university || 'No university set'}</p>
                        </div>
                      ))}
                      {applications.filter(a => (a.source ?? 'public') === 'agency' && a.status === 'approved').length === 0 && (
                        <p className="text-xs font-medium text-gray-400">No agency students</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* Agencies Analytics */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {agencyAnalytics.map((stat, idx) => (
                <div key={idx} className="tw-card tw-card-hover p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live</span>
                  </div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-black">{stat.value}</p>
                </div>
              ))}
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
            <section className="tw-card overflow-hidden">
              <div className="p-8 border-b border-gray-50">
                <h2 className="text-xl font-black text-black">Staff Coverage</h2>
                <p className="text-sm font-medium text-gray-500 mt-1">University responsibilities and current load.</p>
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
                  <div className="p-8 space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Staff Members</p>
                        <p className="text-3xl font-black text-black mt-1">{staff.length}</p>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Unassigned Students</p>
                        <p className="text-3xl font-black text-black mt-1">{unassigned}</p>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Uncovered Universities</p>
                        <p className="text-3xl font-black text-black mt-1">{uncovered.length}</p>
                      </div>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Staff Load</p>
                        <div className="space-y-2">
                          {staff
                            .slice()
                            .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))
                            .map((s) => (
                              <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-start justify-between gap-4">
                                <div>
                                  <p className="font-black text-black">{s.name}</p>
                                  <p className="text-xs font-bold text-gray-500 mt-1">
                                    {(s.staffUniversities ?? []).length ? (s.staffUniversities ?? []).map(getUniversityName).join(' • ') : 'No universities assigned'
                                    }
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Assigned</p>
                                  <p className="text-2xl font-black text-amber-600">{counts.get(s.id) ?? 0}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Uncovered Universities</p>
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                          {uncovered.length === 0 ? (
                            <p className="text-sm font-medium text-gray-600">All universities have coverage.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {uncovered.map(u => (
                                <span key={u.id} className="px-3 py-1 rounded-full bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-600">
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
            </section>
            {/* User Management Table */}
            <section className="tw-card overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-black text-black">System Users</h2>
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                  />
                </div>
                <button
                  onClick={() => setShowAgencyModal(true)}
                  className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-500 hover:text-black transition-all"
                >
                  Create Agency
                </button>
                <button
                  onClick={() => setShowOpsModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-black hover:text-white transition-all"
                >
                  Create Ops User
                </button>
                <button
                  onClick={() => setShowSalesModal(true)}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-black hover:text-white transition-all"
                >
                  Create Sales User
                </button>
                <button
                  onClick={() => setShowStaffModal(true)}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-black hover:text-white transition-all"
                >
                  Create Staff User
                </button>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-2 bg-amber-500 text-black px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-black hover:text-white transition-all"
                >
                  Assign Admin
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left bg-gray-50/50">
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined Date</th>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 font-black text-lg group-hover:bg-amber-500 group-hover:text-black transition-colors">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-black">{u.name}</p>
                              <p className="text-xs text-gray-400 font-medium">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            u.role === 'ceo' ? 'bg-black text-white' :
                            u.role === 'staff' ? 'bg-blue-100 text-blue-700' :
                            u.role === 'sales' ? 'bg-purple-100 text-purple-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <p className="text-sm font-bold text-gray-600">{u.email}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{u.phone || 'No phone'}</p>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.role === 'staff' && (
                              <button
                                onClick={() => {
                                  setUniUserId(u.id);
                                  setUniSelection(u.staffUniversities ?? []);
                                  setShowUniModal(true);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                aria-label="Staff universities"
                              >
                                <GraduationCap className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setCredUserId(u.id);
                                setCredUsername(u.username);
                                setCredPassword('');
                                setShowCredModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-amber-500 transition-colors"
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
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                              title="Lock account"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            {showAgencyModal && (
              <div className="fixed inset-0 z-[100] p-4 flex items-start justify-center overflow-y-auto">
                <div className="absolute inset-0 bg-black/60" onClick={() => { setShowAgencyModal(false); setCreatedAgencyCreds(null); }} />
                <div className="relative tw-card p-8 w-full max-w-lg my-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <h3 className="text-2xl font-black text-black mb-6">Create Agency Account</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Agency name</label>
                      <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email</label>
                      <input type="email" className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={agencyEmail} onChange={(e) => setAgencyEmail(e.target.value)} />
                    </div>
                    {createdAgencyCreds && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                        <p className="text-sm font-bold text-amber-700">Account created</p>
                        <p className="text-sm font-medium text-amber-700">Username: {createdAgencyCreds.username}</p>
                        {createdAgencyCreds.password ? (
                          <p className="text-sm font-medium text-amber-700">Password: {createdAgencyCreds.password}</p>
                        ) : (
                          <p className="text-sm font-medium text-amber-700">Credentials were sent to the agency email.</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button onClick={() => { setShowAgencyModal(false); setCreatedAgencyCreds(null); }} className="px-4 py-2 rounded-xl font-bold text-sm bg-gray-100 text-gray-600">Cancel</button>
                    <button
                      onClick={async () => {
                        const name = agencyName.trim();
                        const email = agencyEmail.trim();
                        if (!name || !email) {
                          toast.error('Please enter name and email');
                          return;
                        }
                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                          toast.error('Invalid email');
                          return;
                        }
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
                      className="px-6 py-3 rounded-2xl font-black text-sm bg-black text-white hover:bg-amber-500 hover:text-black transition-all"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showCredModal && (
              <div className="fixed inset-0 z-[100] p-4 flex items-start justify-center overflow-y-auto">
                <div className="absolute inset-0 bg-black/60" onClick={() => setShowCredModal(false)} />
                <div className="relative tw-card p-8 w-full max-w-lg my-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <h3 className="text-2xl font-black text-black mb-6">Reset Credentials</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Username</label>
                      <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={credUsername} onChange={(e) => setCredUsername(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Password</label>
                      <input type="password" className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={credPassword} onChange={(e) => setCredPassword(e.target.value)} />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button onClick={() => setShowCredModal(false)} className="px-4 py-2 rounded-xl font-bold text-sm bg-gray-100 text-gray-600">Cancel</button>
                    <button
                      onClick={async () => {
                        if (!credUserId) return;
                        try {
                          await ceoResetCredentials(credUserId, { username: credUsername, password: credPassword });
                          toast.success('Credentials updated');
                          setShowCredModal(false);
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : 'Failed to update');
                        }
                      }}
                      className="px-6 py-3 rounded-2xl font-black text-sm bg-black text-white hover:bg-amber-500 hover:text-black transition-all"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showUniModal && (
              <div className="fixed inset-0 z-[100] p-4 flex items-start justify-center overflow-y-auto">
                <div className="absolute inset-0 bg-black/60" onClick={() => setShowUniModal(false)} />
                <div className="relative tw-card p-8 w-full max-w-2xl my-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <h3 className="text-2xl font-black text-black mb-2">Staff University Responsibilities</h3>
                  <p className="text-sm font-medium text-gray-500 mb-6">{users.find(u => u.id === uniUserId)?.name ?? ''}</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {UNIVERSITY_OPTIONS.map((u) => {
                      const checked = uniSelection.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          onClick={() => setUniSelection((prev) => checked ? prev.filter(x => x !== u.id) : [...prev, u.id])}
                          className={`px-4 py-3 rounded-2xl border text-left transition-all ${
                            checked ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100 hover:bg-gray-50'
                          }`}
                          type="button"
                        >
                          <p className="text-sm font-black text-black">{u.name}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{getUniversityName(u.id)}</p>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button onClick={() => setShowUniModal(false)} className="px-4 py-2 rounded-xl font-bold text-sm bg-gray-100 text-gray-600">Cancel</button>
                    <button
                      onClick={() => {
                        if (!uniUserId) return;
                        ceoUpdateUser(uniUserId, { staffUniversities: uniSelection });
                        setShowUniModal(false);
                      }}
                      className="px-6 py-3 rounded-2xl font-black text-sm bg-black text-white hover:bg-amber-500 hover:text-black transition-all"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showAssignModal && (
              <div className="fixed inset-0 z-[100] p-4 flex items-start justify-center overflow-y-auto">
                <div className="absolute inset-0 bg-black/60" onClick={() => setShowAssignModal(false)} />
                <div className="relative tw-card p-8 w-full max-w-lg my-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <h3 className="text-2xl font-black text-black mb-6">Assign Staff Admin to Student</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Student</label>
                      <select
                        value={assignStudentId}
                        onChange={(e) => setAssignStudentId(e.target.value)}
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none appearance-none"
                      >
                        <option value="">Select student...</option>
                        {applications.filter(a => a.studentId).map(a => (
                          <option key={a.id} value={a.studentId!}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Staff</label>
                      <select
                        value={assignStaffId}
                        onChange={(e) => setAssignStaffId(e.target.value)}
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none appearance-none"
                      >
                        <option value="">Select staff...</option>
                        {users.filter(u => u.role === 'staff').map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 rounded-xl font-bold text-sm bg-gray-100 text-gray-600">Cancel</button>
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
                      className="px-6 py-3 rounded-2xl font-black text-sm bg-black text-white hover:bg-amber-500 hover:text-black transition-all"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showOpsModal && (
              <div className="fixed inset-0 z-[100] p-4 flex items-start justify-center overflow-y-auto">
                <div className="absolute inset-0 bg-black/60" onClick={() => { setShowOpsModal(false); setCreatedOpsCreds(null); }} />
                <div className="relative tw-card p-8 w-full max-w-lg my-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <h3 className="text-2xl font-black text-black mb-6">Create Ops User</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Name</label>
                      <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={opsName} onChange={(e) => setOpsName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email</label>
                      <input type="email" className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={opsEmail} onChange={(e) => setOpsEmail(e.target.value)} />
                    </div>
                    {createdOpsCreds && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                        <p className="text-sm font-bold text-amber-700">Account created</p>
                        <p className="text-sm font-medium text-amber-700">Username: {createdOpsCreds.username}</p>
                        {createdOpsCreds.password ? (
                          <p className="text-sm font-medium text-amber-700">Password: {createdOpsCreds.password}</p>
                        ) : (
                          <p className="text-sm font-medium text-amber-700">Credentials were sent to the user email.</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button onClick={() => { setShowOpsModal(false); setCreatedOpsCreds(null); }} className="px-4 py-2 rounded-xl font-bold text-sm bg-gray-100 text-gray-600">Cancel</button>
                    <button
                      onClick={async () => {
                        const name = opsName.trim();
                        const email = opsEmail.trim();
                        if (!name || !email) {
                          toast.error('Please enter name and email');
                          return;
                        }
                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                          toast.error('Invalid email');
                          return;
                        }
                        const user = { id: '', username: '', role: 'ops' as const, name, email, points: 0, createdAt: new Date().toISOString() };
                        try {
                          const created = await ceoCreateUser(user);
                          setCreatedOpsCreds({ username: created.username, ...(created.password ? { password: created.password } : {}) });
                          toast.success('Ops user created');
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : 'Failed to create user');
                        }
                      }}
                      className="px-6 py-3 rounded-2xl font-black text-sm bg-black text-white hover:bg-amber-500 hover:text-black transition-all"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showSalesModal && (
              <div className="fixed inset-0 z-[100] p-4 flex items-start justify-center overflow-y-auto">
                <div className="absolute inset-0 bg-black/60" onClick={() => { setShowSalesModal(false); setCreatedSalesCreds(null); }} />
                <div className="relative tw-card p-8 w-full max-w-lg my-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <h3 className="text-2xl font-black text-black mb-6">Create Sales User</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Name</label>
                      <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={salesName} onChange={(e) => setSalesName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email</label>
                      <input type="email" className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={salesEmail} onChange={(e) => setSalesEmail(e.target.value)} />
                    </div>
                    {createdSalesCreds && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                        <p className="text-sm font-bold text-amber-700">Account created</p>
                        <p className="text-sm font-medium text-amber-700">Username: {createdSalesCreds.username}</p>
                        {createdSalesCreds.password ? (
                          <p className="text-sm font-medium text-amber-700">Password: {createdSalesCreds.password}</p>
                        ) : (
                          <p className="text-sm font-medium text-amber-700">Credentials were sent to the user email.</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button onClick={() => { setShowSalesModal(false); setCreatedSalesCreds(null); }} className="px-4 py-2 rounded-xl font-bold text-sm bg-gray-100 text-gray-600">Cancel</button>
                    <button
                      onClick={async () => {
                        const name = salesName.trim();
                        const email = salesEmail.trim();
                        if (!name || !email) {
                          toast.error('Please enter name and email');
                          return;
                        }
                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                          toast.error('Invalid email');
                          return;
                        }
                        const user = { id: '', username: '', role: 'sales' as const, name, email, points: 0, createdAt: new Date().toISOString() };
                        try {
                          const created = await ceoCreateUser(user);
                          setCreatedSalesCreds({ username: created.username, ...(created.password ? { password: created.password } : {}) });
                          toast.success('Sales user created');
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : 'Failed to create user');
                        }
                      }}
                      className="px-6 py-3 rounded-2xl font-black text-sm bg-black text-white hover:bg-amber-500 hover:text-black transition-all"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showStaffModal && (
              <div className="fixed inset-0 z-[100] p-4 flex items-start justify-center overflow-y-auto">
                <div className="absolute inset-0 bg-black/60" onClick={() => { setShowStaffModal(false); setCreatedStaffCreds(null); }} />
                <div className="relative tw-card p-8 w-full max-w-lg my-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <h3 className="text-2xl font-black text-black mb-6">Create Staff User</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Name</label>
                      <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={staffName} onChange={(e) => setStaffName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email</label>
                      <input type="email" className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} />
                    </div>
                    {createdStaffCreds && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                        <p className="text-sm font-bold text-amber-700">Account created</p>
                        <p className="text-sm font-medium text-amber-700">Username: {createdStaffCreds.username}</p>
                        {createdStaffCreds.password ? (
                          <p className="text-sm font-medium text-amber-700">Password: {createdStaffCreds.password}</p>
                        ) : (
                          <p className="text-sm font-medium text-amber-700">Credentials were sent to the user email.</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button onClick={() => { setShowStaffModal(false); setCreatedStaffCreds(null); }} className="px-4 py-2 rounded-xl font-bold text-sm bg-gray-100 text-gray-600">Cancel</button>
                    <button
                      onClick={async () => {
                        const name = staffName.trim();
                        const email = staffEmail.trim();
                        if (!name || !email) {
                          toast.error('Please enter name and email');
                          return;
                        }
                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                          toast.error('Invalid email');
                          return;
                        }
                        const u = { id: '', username: '', role: 'staff' as const, name, email, points: 0, createdAt: new Date().toISOString() };
                        try {
                          const created = await ceoCreateUser(u);
                          setCreatedStaffCreds({ username: created.username, ...(created.password ? { password: created.password } : {}) });
                          toast.success('Staff user created');
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : 'Failed to create user');
                        }
                      }}
                      className="px-6 py-3 rounded-2xl font-black text-sm bg-black text-white hover:bg-amber-500 hover:text-black transition-all"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* Recent System Activity */}
            <div className="tw-card tw-card-hover p-8">
              <h3 className="text-xl font-black text-black mb-8 flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" />
                System Activity Log
              </h3>
              <div className="space-y-6">
                {[
                  { user: 'ceo', action: 'Modified system permissions', time: '2 mins ago', icon: Shield },
                  { user: 'sales1', action: 'Approved student APP902', time: '15 mins ago', icon: CheckCircle2 },
                  { user: 'staff2', action: 'Uploaded document for ID293', time: '45 mins ago', icon: FileText },
                  { user: 'system', action: 'Automated backup completed', time: '2 hours ago', icon: Activity },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-black">
                        <span className="text-amber-600">@{item.user}</span> {item.action}
                      </p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveTab('users')}
                className="w-full mt-8 py-3 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
              >
                View All Users
              </button>
            </div>

            {/* Security Controls */}
            <div className="tw-card tw-card-hover p-8">
              <h3 className="text-xl font-black text-black mb-8 flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-500" />
                Security Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="font-bold text-black text-sm">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-400 font-medium">Mandatory for all staff accounts</p>
                  </div>
                  <div className="w-12 h-6 bg-amber-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="font-bold text-black text-sm">Session Timeout</p>
                    <p className="text-xs text-gray-400 font-medium">Automatic logout after 30 mins</p>
                  </div>
                  <button className="text-[10px] font-black text-amber-600 bg-amber-100 px-3 py-1 rounded-lg uppercase tracking-widest">
                    Configure
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="font-bold text-black text-sm">IP Whitelisting</p>
                    <p className="text-xs text-gray-400 font-medium">Restrict admin access by IP</p>
                  </div>
                  <button className="text-[10px] font-black text-gray-400 bg-gray-200 px-3 py-1 rounded-lg uppercase tracking-widest">
                    Disabled
                  </button>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-gray-50">
                <button className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-2xl font-black hover:bg-amber-500 hover:text-black transition-all">
                  <Shield className="w-5 h-5" />
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
