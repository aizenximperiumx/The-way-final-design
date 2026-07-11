import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, LogOut, Bell, Menu,
  Search, Calendar, MessageSquare, BarChart3, GraduationCap,
  Building2, X as CloseIcon, Trophy, Star,
  Award, ChevronRight, Mail, Zap,
  KeyRound, Phone, Eye, EyeOff, Loader2, BadgeCheck, AtSign,
  Home, Globe, Camera, Trash2, CheckCheck, ArrowUpRight,
  Plus, Pencil, Briefcase, Save, Headset
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../store/appStore';
import { getAvatar, setAvatar, clearAvatar, onAvatarChange, fileToAvatarDataUrl } from '../lib/avatar';
import { STATUS_ORDER, statusMeta, isLeadDue } from '../lib/leads';
import type { LeadStatus } from '../store/appStore';
// Dark-text wordmark for white surfaces (mobile drawer header).
import logoUrl from '../../thewaynewlogo-removebg-preview.png';
// White-text wordmark for the navy sidebar (dark text is invisible there).
import logoDarkBgUrl from '../../1776590293988-019da507-f581-77e9-8281-8d60b280ccd6-removebg-preview.png';

// Avatar: shows the uploaded photo, else a colored initial. `className` sizes it.
const Avatar = ({ name, photo, className = '', textClass = 'text-sm' }: { name?: string; photo?: string; className?: string; textClass?: string }) => (
  photo
    ? <img src={photo} alt={name ?? 'avatar'} className={`object-cover ${className}`} />
    : <div className={`bg-amber-100 text-amber-700 font-bold flex items-center justify-center ${textClass} ${className}`}>{name?.charAt(0)?.toUpperCase() ?? '?'}</div>
);

interface SidebarItem {
  label: string;
  icon: LucideIcon;
  path: string;
  roles: string[];
  badge?: string;
}

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['student'] },
  { label: 'Universities', icon: GraduationCap, path: '/universities', roles: ['student', 'sales', 'ops', 'staff', 'agency_staff', 'ceo', 'agency', 'customer_support'] },
  { label: 'Applications', icon: FileText, path: '/sales', roles: ['sales', 'ceo'] },
  { label: 'Agency Leads', icon: FileText, path: '/ops', roles: ['ops', 'ceo'] },
  { label: 'Agencies', icon: Building2, path: '/agencies', roles: ['agency', 'ceo'] },
  { label: 'Students', icon: Users, path: '/staff', roles: ['staff', 'ceo'] },
  { label: 'My Students', icon: Users, path: '/agency-staff', roles: ['agency_staff'] },
  { label: 'Support Desk', icon: Headset, path: '/support', roles: ['customer_support', 'ceo'] },
  { label: 'Analytics', icon: BarChart3, path: '/admin', roles: ['ceo'] },
  { label: 'Appointments', icon: Calendar, path: '/appointments', roles: ['student', 'staff', 'agency_staff', 'sales', 'ops', 'agency', 'ceo', 'customer_support'] },
  { label: 'Messages', icon: MessageSquare, path: '/messages', roles: ['student', 'staff', 'agency_staff', 'sales', 'ops', 'agency', 'ceo', 'customer_support'] },
];

const roleMeta: Record<string, { label: string; color: string; bg: string }> = {
  ceo:          { label: 'CEO',          color: 'text-purple-700', bg: 'bg-purple-50'  },
  sales:        { label: 'Sales',        color: 'text-blue-700',   bg: 'bg-blue-50'    },
  ops:          { label: 'Operations',   color: 'text-teal-700',   bg: 'bg-teal-50'    },
  staff:        { label: 'Staff',        color: 'text-amber-700',  bg: 'bg-amber-50'   },
  agency_staff: { label: 'Agency Staff', color: 'text-orange-700', bg: 'bg-orange-50'  },
  student:      { label: 'Student',      color: 'text-green-700',  bg: 'bg-green-50'   },
  agency:       { label: 'Agency',       color: 'text-indigo-700', bg: 'bg-indigo-50'  },
  customer_support: { label: 'Customer Support', color: 'text-rose-700', bg: 'bg-rose-50' },
};

const rankMedal = (rank: number) => {
  if (rank === 1) return { emoji: '🥇', color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-200' };
  if (rank === 2) return { emoji: '🥈', color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200'     };
  if (rank === 3) return { emoji: '🥉', color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200'   };
  return { emoji: `#${rank}`, color: 'text-gray-400', bg: 'bg-gray-50 border-gray-100' };
};

const howToEarn = [
  { action: 'Stage completed on time (SLA)', pts: '+2 / +1', icon: Zap },
  { action: 'Visa & residency uploaded',     pts: '+2',      icon: Users },
  { action: 'Approve a student',             pts: '+1',      icon: GraduationCap },
  { action: 'Claim a lead / complete intake', pts: '+1',     icon: FileText },
  { action: 'Deadline passed (automatic)',   pts: '−1 / −2', icon: Star },
];

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { notifications, users, applications, leads, addLead, updateLead, deleteLead, convertLeadToApplication, changePassword, markNotificationsRead, markAllNotificationsRead } = useAppStore();
  const [leadConverting, setLeadConverting] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileTab, setProfileTab] = useState<'overview' | 'leaderboard' | 'workspace' | 'account'>('overview');
  // Leads CRM (sales / customer-support / ceo)
  const [leadFormOpen, setLeadFormOpen] = useState(false);
  const [leadEditId, setLeadEditId] = useState<string | null>(null);
  const [leadDraft, setLeadDraft] = useState({ name: '', phone: '', email: '', country: '', universityInterested: '', notes: '' });
  const [leadSaving, setLeadSaving] = useState(false);
  const [noteLeadId, setNoteLeadId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  // Self-service password change (available to every role)
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  // Avatar photo (device-local)
  const [avatarUrl, setAvatarUrl] = useState<string>(() => getAvatar(user?.id));
  const avatarInputRef = useRef<HTMLInputElement>(null);
  // Global search
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifsRef = useRef<HTMLDivElement>(null);
  const lastNotifCountRef = useRef(0);

  // Keep avatar in sync with the logged-in user and any change elsewhere.
  useEffect(() => {
    setAvatarUrl(getAvatar(user?.id));
    return onAvatarChange(() => setAvatarUrl(getAvatar(user?.id)));
  }, [user?.id]);

  // Close the search dropdown on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
    };
    if (showSearch) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSearch]);

  const handleAvatarFile = async (file?: File) => {
    if (!file || !user) return;
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setAvatar(user.id, dataUrl);
      toast.success('Photo updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not set photo');
    }
  };
  const removeAvatar = () => { if (user) { clearAvatar(user.id); toast.success('Photo removed'); } };

  useEffect(() => {
    if (!user) return;
    const count = notifications.filter(n => n.userId === user.id && !n.read).length;
    if (count > lastNotifCountRef.current) {
      const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
      audio.play().catch(() => {});
    }
    lastNotifCountRef.current = count;
  }, [notifications, user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    if (showNotifs) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifs]);

  const filteredItems = sidebarItems.filter(item => user?.role && item.roles.includes(user.role));
  const handleLogout = () => { void logout(); navigate('/login'); };
  const unreadCount = notifications.filter(n => n.userId === user?.id && !n.read).length;
  const myNotifs = notifications.filter(n => n.userId === user?.id).slice().reverse();

  const roleHome = (r?: string) => {
    if (r === 'student') return '/dashboard';
    if (r === 'sales') return '/sales';
    if (r === 'ops') return '/ops';
    if (r === 'staff' || r === 'agency_staff') return '/staff';
    if (r === 'agency') return '/agencies';
    if (r === 'ceo') return '/admin';
    return '/';
  };

  // ── Global search across people + applications (role-aware) ──
  const isInternalRole = ['ceo', 'sales', 'ops', 'staff', 'agency_staff'].includes(user?.role ?? '');
  const q = searchQuery.trim().toLowerCase();
  type SearchResult = { kind: 'application' | 'user'; id: string; title: string; subtitle: string; tag: string };
  const searchResults: SearchResult[] = q.length < 1 ? [] : [
    ...applications
      .filter(a => [a.name, a.email, a.program, a.country, a.university].some(v => v && String(v).toLowerCase().includes(q)))
      .slice(0, 6)
      .map(a => ({ kind: 'application' as const, id: a.id, title: a.name || 'Unnamed', subtitle: [a.email, a.program].filter(Boolean).join(' · '), tag: a.status })),
    ...(isInternalRole
      ? users
          .filter(u => u.id !== user?.id && [u.name, u.username, u.email].some(v => v && String(v).toLowerCase().includes(q)))
          .slice(0, 4)
          .map(u => ({ kind: 'user' as const, id: u.id, title: u.name, subtitle: `@${u.username}`, tag: u.role }))
      : []),
  ];
  const pickSearchResult = (res: SearchResult) => {
    setShowSearch(false);
    setSearchQuery('');
    navigate(res.kind === 'user' ? '/admin' : roleHome(user?.role));
  };

  const handleNotifClick = (n: { id: string; read: boolean; title: string; message: string }) => {
    if (!n.read) markNotificationsRead([n.id]);
    setShowNotifs(false);
    const text = `${n.title} ${n.message}`.toLowerCase();
    navigate(text.includes('message') || text.includes('chat') ? '/messages' : roleHome(user?.role));
  };

  // Leaderboard data
  const peers = users
    .filter(u => u.role === user?.role)
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  const myRank = peers.findIndex(u => u.id === user?.id) + 1;
  const maxPoints = peers[0]?.points ?? 1;
  const meta = roleMeta[user?.role ?? 'student'] ?? roleMeta.student;
  const medal = rankMedal(myRank);

  // Internal/competitive roles see points + leaderboard; everyone gets Account.
  const isCompetitive = ['ceo', 'sales', 'ops', 'staff', 'agency_staff', 'customer_support'].includes(user?.role ?? '');
  // Roles whose profile Workspace tab is the Leads CRM.
  const hasLeads = ['sales', 'customer_support', 'ceo'].includes(user?.role ?? '');
  const canMonitorLeads = user?.role === 'customer_support' || user?.role === 'ceo';
  const myLeads = leads.filter(l => l.ownerId === user?.id);
  const monitoredLeads = canMonitorLeads ? leads.filter(l => l.ownerId !== user?.id) : [];

  const blankLead = { name: '', phone: '', email: '', country: '', universityInterested: '', notes: '' };
  const openAddLead = () => { setLeadEditId(null); setLeadDraft(blankLead); setLeadFormOpen(true); };
  const openEditLead = (l: typeof leads[number]) => {
    setLeadEditId(l.id);
    setLeadDraft({ name: l.name, phone: l.phone, email: l.email, country: l.country, universityInterested: l.universityInterested, notes: l.notes });
    setLeadFormOpen(true);
  };
  const saveLead = () => {
    if (!leadDraft.name.trim() && !leadDraft.phone.trim()) { toast.error('Add at least a name or phone'); return; }
    setLeadSaving(true);
    try {
      if (leadEditId) { updateLead(leadEditId, leadDraft); toast.success('Lead updated'); }
      else { const { duplicate } = addLead(leadDraft); toast.success(duplicate ? 'Lead added — heads up, looks like a possible duplicate' : 'Lead added'); }
      setLeadFormOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save lead'); }
    finally { setLeadSaving(false); }
  };
  const saveNote = () => {
    if (!noteLeadId) return;
    try { updateLead(noteLeadId, { notes: noteDraft }); toast.success('Note saved'); setNoteLeadId(null); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save note'); }
  };
  const removeLead = (l: typeof leads[number]) => {
    if (!window.confirm(`Delete lead "${l.name || l.phone || 'untitled'}"? This cannot be undone.`)) return;
    try { deleteLead(l.id); toast.success('Lead deleted'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not delete'); }
  };
  const setLeadStatus = (l: typeof leads[number], status: LeadStatus) => {
    try { updateLead(l.id, { status }); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update'); }
  };
  const setLeadFollow = (l: typeof leads[number], followUpDate: string) => {
    try { updateLead(l.id, { followUpDate }); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update'); }
  };
  const convertLead = async (l: typeof leads[number]) => {
    if (!window.confirm(`Convert "${l.name || l.email}" into a real application? It will enter the Sales pipeline.`)) return;
    setLeadConverting(l.id);
    try { await convertLeadToApplication(l.id); toast.success('Lead converted to an application'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not convert'); }
    finally { setLeadConverting(null); }
  };
  const dueLeadsCount = myLeads.filter(isLeadDue).length;

  // Render helper (no typed inputs inside, so safe to recreate each render).
  const leadsTable = (list: typeof leads, opts: { showOwner?: boolean; canEditFields?: boolean; canDelete?: boolean }) => (
    list.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-gray-200 py-8 text-center">
        <p className="text-sm text-gray-400 font-medium">No leads yet</p>
      </div>
    ) : (
      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-400">
              <th className="text-left font-bold px-3 py-2.5">Name</th>
              <th className="text-left font-bold px-3 py-2.5">Phone</th>
              <th className="text-left font-bold px-3 py-2.5">Email</th>
              <th className="text-left font-bold px-3 py-2.5">Country</th>
              <th className="text-left font-bold px-3 py-2.5">University</th>
              <th className="text-left font-bold px-3 py-2.5">Status</th>
              <th className="text-left font-bold px-3 py-2.5">Follow-up</th>
              {opts.showOwner && <th className="text-left font-bold px-3 py-2.5">Rep</th>}
              <th className="text-right font-bold px-3 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50/60">
                <td className="px-3 py-2.5 font-semibold text-gray-900 whitespace-nowrap">{l.name || '—'}</td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{l.phone || '—'}</td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{l.email || '—'}</td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{l.country || '—'}</td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{l.universityInterested || '—'}</td>
                <td className="px-3 py-2.5">
                  <select value={l.status ?? 'new'} onChange={(e) => setLeadStatus(l, e.target.value as LeadStatus)} className={`text-xs font-semibold rounded-full border px-2 py-1 cursor-pointer focus:outline-none ${statusMeta[l.status ?? 'new'].cls}`}>
                    {STATUS_ORDER.map(s => <option key={s} value={s}>{statusMeta[s].label}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <input type="date" value={l.followUpDate || ''} onChange={(e) => setLeadFollow(l, e.target.value)} className={`text-xs rounded-lg border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${isLeadDue(l) ? 'border-red-300 bg-red-50 text-red-700 font-semibold' : 'border-gray-200 text-gray-600'}`} />
                </td>
                {opts.showOwner && <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{l.ownerName}</td>}
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => { setNoteLeadId(l.id); setNoteDraft(l.notes); }}
                      title="Open notes"
                      className={`p-1.5 rounded-lg border transition-colors ${l.notes ? 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    {l.convertedApplicationId ? (
                      <span title="Already converted" className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-semibold border border-green-100"><BadgeCheck className="w-3.5 h-3.5" /> App</span>
                    ) : (
                      <button onClick={() => void convertLead(l)} disabled={leadConverting === l.id} title="Convert to application" className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-60"><ArrowUpRight className="w-3.5 h-3.5" /> Convert</button>
                    )}
                    {opts.canEditFields && (
                      <button onClick={() => openEditLead(l)} title="Edit lead" className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {opts.canDelete && (
                      <button onClick={() => removeLead(l)} title="Delete lead" className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  );

  const openProfile = () => {
    // Every role on the website gets the full-page profile (a dedicated growth
    // surface). The old modal below is kept only as a harmless fallback.
    navigate('/profile');
  };

  const handleChangePassword = async () => {
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    setPwSaving(true);
    try {
      await changePassword(newPw);
      toast.success('Password updated');
      setNewPw(''); setConfirmPw('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update password');
    } finally {
      setPwSaving(false);
    }
  };

  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : '—';

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex overflow-hidden tw-mobile-shell">

      {/* ── Sidebar Desktop — landing-page navy + gold ── */}
      <aside className={`hidden md:flex flex-col bg-gradient-to-b from-[#0A1628] to-[#0D1F3C] transition-all duration-300 ease-in-out shrink-0 ${isSidebarOpen ? 'w-64' : 'w-[72px]'}`}>
        {/* Logo */}
        <Link to="/" title="Home" className={`flex items-center gap-3 border-b border-white/5 hover:bg-white/5 transition-colors ${isSidebarOpen ? 'px-5 py-4' : 'px-4 py-4 justify-center'}`}>
          {isSidebarOpen ? (
            <img src={logoDarkBgUrl} alt="The Way — Home" className="h-9 w-auto object-contain shrink-0" />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-[#0A1628] font-black text-lg">W</div>
          )}
        </Link>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto custom-scrollbar">
          {isSidebarOpen && (
            <p className="px-3 pb-1.5 pt-1 text-[9px] font-bold uppercase tracking-[2px] text-gray-500">Workspace</p>
          )}
          <Link
            to="/"
            title={!isSidebarOpen ? 'Home' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative ${
              location.pathname === '/' ? 'bg-amber-400/15 text-amber-300' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            {location.pathname === '/' && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-400 rounded-r-full" />}
            <Home className={`w-5 h-5 shrink-0 ${location.pathname === '/' ? 'text-amber-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
            {isSidebarOpen && <span className="text-sm font-semibold truncate">Home</span>}
          </Link>
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                title={!isSidebarOpen ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-amber-400/15 text-amber-300'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-400 rounded-r-full" />}
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-amber-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                {isSidebarOpen && <span className={`text-sm font-semibold truncate ${isActive ? 'text-amber-300' : ''}`}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-white/5 space-y-1">
          <a
            href="/welcome"
            target="_blank"
            rel="noopener noreferrer"
            title={!isSidebarOpen ? 'Main website' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all ${!isSidebarOpen ? 'justify-center' : ''}`}
          >
            <Globe className="w-5 h-5 shrink-0 text-gray-500" />
            {isSidebarOpen && <><span className="text-sm font-semibold flex-1">Main website</span><ArrowUpRight className="w-4 h-4 text-gray-600" /></>}
          </a>
          <button
            onClick={openProfile}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all text-left ${!isSidebarOpen ? 'justify-center' : ''}`}
          >
            <Avatar name={user?.name} photo={avatarUrl} className="w-8 h-8 rounded-lg shrink-0" />
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-none">{user?.name}</p>
                <p className="text-xs text-amber-400/70 mt-0.5">{meta.label} · {user?.points ?? 0} pts</p>
              </div>
            )}
            {isSidebarOpen && <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />}
          </button>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all ${!isSidebarOpen ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="text-sm font-semibold">Log out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 shrink-0 tw-mobile-header">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <button onClick={() => setIsSidebarOpen(v => !v)} className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden lg:block" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students, applications…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setShowSearch(false); (e.target as HTMLInputElement).blur(); }
                  if (e.key === 'Enter' && searchResults[0]) pickSearchResult(searchResults[0]);
                }}
                className="pl-9 pr-8 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setShowSearch(false); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600">
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              )}
              <AnimatePresence>
                {showSearch && q.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.14 }}
                    className="absolute left-0 top-full mt-2 w-[22rem] bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    {searchResults.length === 0 ? (
                      <div className="py-8 text-center">
                        <Search className="w-7 h-7 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400 font-medium">No matches for “{searchQuery}”</p>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto py-1.5 custom-scrollbar">
                        {searchResults.map((res) => (
                          <button
                            key={`${res.kind}-${res.id}`}
                            onClick={() => pickSearchResult(res)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${res.kind === 'user' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                              {res.kind === 'user' ? <Users className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{res.title}</p>
                              {res.subtitle && <p className="text-xs text-gray-400 truncate">{res.subtitle}</p>}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5 shrink-0">{res.tag}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bell */}
            <div className="relative" ref={notifsRef}>
              <button
                onClick={() => setShowNotifs(v => !v)}
                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifs && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900">Notifications</p>
                      {unreadCount > 0 ? (
                        <button onClick={() => markAllNotificationsRead()} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors">
                          <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                        </button>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">All read</span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                      {myNotifs.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                          <p className="text-sm text-gray-400 font-medium">No notifications yet</p>
                        </div>
                      ) : myNotifs.map(n => (
                        <button key={n.id} onClick={() => handleNotifClick(n)} className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex gap-2.5 ${!n.read ? 'bg-amber-50/40' : ''}`}>
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${!n.read ? 'bg-amber-500' : 'bg-transparent'}`} />
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-gray-900">{n.title}</span>
                            <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</span>
                            <span className="block text-[10px] text-gray-400 mt-1">{new Date(n.time).toLocaleString()}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-6 bg-gray-100 mx-1" />

            {/* Account chip */}
            <button
              onClick={openProfile}
              title="Your profile"
              className="flex items-center gap-2.5 p-1 sm:pr-3 rounded-xl border border-transparent sm:border-gray-100 sm:bg-gray-50/60 hover:bg-gray-100 hover:border-gray-200 transition-colors"
            >
              <Avatar name={user?.name} photo={avatarUrl} className="w-8 h-8 rounded-lg shrink-0" />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-900 leading-none truncate max-w-[140px]">{user?.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{meta.label}</p>
              </div>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-8 tw-mobile-content">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* ── Profile Modal ── */}
      <AnimatePresence>
        {showProfile && user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowProfile(false)} />
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className={`relative bg-white rounded-3xl shadow-2xl w-full overflow-hidden transition-[max-width] duration-200 ${profileTab === 'workspace' && hasLeads ? 'max-w-4xl' : 'max-w-xl'}`}
            >
              {/* Header banner */}
              <div className="h-24 bg-gradient-to-r from-amber-500 to-orange-500 relative">
                <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors">
                  <CloseIcon className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Avatar + rank */}
              <div className="px-6 pb-2">
                <div className="flex items-end justify-between -mt-10 mb-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-xl overflow-hidden">
                      <Avatar name={user.name} photo={avatarUrl} className="w-full h-full" textClass="text-3xl" />
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void handleAvatarFile(e.target.files?.[0]); e.target.value = ''; }} />
                    <button onClick={() => avatarInputRef.current?.click()} title="Change photo" className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-md ring-2 ring-white hover:bg-amber-600 transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                    {isCompetitive && myRank > 0 && myRank <= 3 && (
                      <span className="absolute -top-2 -right-2 text-xl">{medal.emoji}</span>
                    )}
                  </div>
                  {isCompetitive ? (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-bold ${medal.bg} ${medal.color}`}>
                      <Trophy className="w-3.5 h-3.5" />
                      {myRank > 0 ? `Rank #${myRank}` : 'Unranked'}
                    </div>
                  ) : (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-100 text-sm font-bold ${meta.bg} ${meta.color}`}>
                      <BadgeCheck className="w-3.5 h-3.5" />
                      {meta.label}
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">{user.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>{meta.label}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</span>
                    </div>
                  </div>
                  {isCompetitive && (
                    <div className="text-right shrink-0">
                      <div className="text-3xl font-black text-gray-900">{(user.points ?? 0).toLocaleString()}</div>
                      <div className="text-xs text-gray-400 font-medium">total points</div>
                    </div>
                  )}
                </div>

                {/* Points progress bar */}
                {isCompetitive && peers.length > 1 && myRank > 1 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500">Progress to #{myRank - 1}</span>
                      <span className="text-xs font-bold text-amber-600">
                        {Math.max(0, (peers[myRank - 2]?.points ?? 0) - (user.points ?? 0))} pts needed
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, ((user.points ?? 0) / Math.max(peers[myRank - 2]?.points ?? 1, 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {isCompetitive && myRank === 1 && (
                  <div className="mt-4 flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">
                    <span className="text-base">🏆</span>
                    <p className="text-xs font-bold text-yellow-700">You're #1 on the leaderboard! Keep it up.</p>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 px-6 mt-2">
                {(isCompetitive ? (['overview', 'leaderboard', 'workspace', 'account'] as const) : (['workspace', 'account'] as const)).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setProfileTab(tab)}
                    className={`pb-3 pt-1 mr-6 text-sm font-semibold capitalize border-b-2 transition-all ${
                      profileTab === tab ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-6 max-h-[62vh] overflow-y-auto custom-scrollbar">
                {profileTab === 'overview' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">How to earn points</p>
                      <div className="space-y-2">
                        {howToEarn.map((item, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                                <item.icon className="w-3.5 h-3.5 text-amber-600" />
                              </div>
                              <span className="text-sm text-gray-700 font-medium">{item.action}</span>
                            </div>
                            <span className={`text-sm font-bold ${String(item.pts).startsWith('−') ? 'text-red-500' : 'text-amber-600'}`}>{item.pts}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                        <div className="text-lg font-black text-gray-900">{user.points ?? 0}</div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">My Points</div>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                        <div className="text-lg font-black text-gray-900">#{myRank || '—'}</div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">My Rank</div>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                        <div className="text-lg font-black text-gray-900">{peers.length}</div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">Competitors</div>
                      </div>
                    </div>
                  </div>
                )}

                {profileTab === 'leaderboard' && (
                  <div className="space-y-1.5">
                    {peers.length === 0 ? (
                      <div className="text-center py-8">
                        <Award className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No peers yet</p>
                      </div>
                    ) : peers.map((u, i) => {
                      const rank = i + 1;
                      const m = rankMedal(rank);
                      const isMe = u.id === user.id;
                      const pct = maxPoints > 0 ? ((u.points ?? 0) / maxPoints) * 100 : 0;
                      return (
                        <div
                          key={u.id}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isMe ? 'bg-amber-50 border border-amber-200' : 'hover:bg-gray-50'}`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 border ${m.bg} ${m.color}`}>
                            {rank <= 3 ? m.emoji : rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className={`text-sm font-semibold truncate ${isMe ? 'text-amber-700' : 'text-gray-900'}`}>
                                {u.name} {isMe && <span className="text-[10px] text-amber-500 font-bold">(you)</span>}
                              </p>
                              <span className={`text-sm font-black ml-2 shrink-0 ${isMe ? 'text-amber-700' : 'text-gray-900'}`}>
                                {(u.points ?? 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isMe ? 'bg-amber-400' : 'bg-gray-300'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {profileTab === 'workspace' && (
                  <div className="space-y-5">
                    {hasLeads ? (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-black text-gray-900">My Leads</p>
                              {dueLeadsCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                                  {dueLeadsCount} follow-up{dueLeadsCount > 1 ? 's' : ''} due
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">WhatsApp & direct prospects you're nurturing — set a status &amp; follow-up date.</p>
                          </div>
                          <button
                            onClick={leadFormOpen ? () => setLeadFormOpen(false) : openAddLead}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors shrink-0"
                          >
                            {leadFormOpen ? <><CloseIcon className="w-4 h-4" /> Close</> : <><Plus className="w-4 h-4" /> Add lead</>}
                          </button>
                        </div>

                        {leadFormOpen && (
                          <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
                            <div className="grid sm:grid-cols-2 gap-3">
                              <input value={leadDraft.name} onChange={(e) => setLeadDraft(d => ({ ...d, name: e.target.value }))} placeholder="Name" className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                              <input value={leadDraft.phone} onChange={(e) => setLeadDraft(d => ({ ...d, phone: e.target.value }))} placeholder="Phone (WhatsApp)" className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                              <input value={leadDraft.email} onChange={(e) => setLeadDraft(d => ({ ...d, email: e.target.value }))} placeholder="Email" className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                              <input value={leadDraft.country} onChange={(e) => setLeadDraft(d => ({ ...d, country: e.target.value }))} placeholder="Country" className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                              <input value={leadDraft.universityInterested} onChange={(e) => setLeadDraft(d => ({ ...d, universityInterested: e.target.value }))} placeholder="University interested in" className="sm:col-span-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                            </div>
                            <div className="flex justify-end gap-2 mt-3">
                              <button onClick={() => setLeadFormOpen(false)} className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
                              <button onClick={saveLead} disabled={leadSaving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 disabled:opacity-60">
                                <Save className="w-4 h-4" /> {leadEditId ? 'Save changes' : 'Add lead'}
                              </button>
                            </div>
                          </div>
                        )}

                        {leadsTable(myLeads, { canEditFields: true, canDelete: true })}

                        {canMonitorLeads && (
                          <div className="pt-2">
                            <p className="text-sm font-black text-gray-900 mb-2">
                              Sales Leads <span className="text-xs font-medium text-gray-400">· monitoring all reps ({monitoredLeads.length})</span>
                            </p>
                            {leadsTable(monitoredLeads, { showOwner: true, canEditFields: false, canDelete: false })}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
                          <Briefcase className="w-7 h-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-bold text-gray-900">Your {meta.label} workspace</p>
                        <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">Role-specific tools will live here. We're rolling these out per role — more coming soon.</p>
                      </div>
                    )}
                  </div>
                )}

                {profileTab === 'account' && (
                  <div className="space-y-5">
                    {/* Profile photo */}
                    <div className="flex items-center gap-4">
                      <Avatar name={user.name} photo={avatarUrl} className="w-14 h-14 rounded-2xl shrink-0" textClass="text-xl" />
                      <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => avatarInputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
                          <Camera className="w-4 h-4" /> {avatarUrl ? 'Change photo' : 'Add photo'}
                        </button>
                        {avatarUrl && (
                          <button onClick={removeAvatar} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                            <Trash2 className="w-4 h-4" /> Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Identity grid */}
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Account details</p>
                      <div className="grid sm:grid-cols-2 gap-2.5">
                        {[
                          { icon: BadgeCheck, label: 'Role', value: meta.label },
                          { icon: AtSign, label: 'Username', value: user.username || '—' },
                          { icon: Mail, label: 'Email', value: user.email || '—' },
                          { icon: Phone, label: 'Phone', value: user.phone || '—' },
                          { icon: Calendar, label: 'Member since', value: memberSince },
                          { icon: Star, label: 'Points', value: String(user.points ?? 0) },
                        ].map((row) => (
                          <div key={row.label} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                              <row.icon className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{row.label}</p>
                              <p className="text-sm font-semibold text-gray-900 truncate">{row.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Change password */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <KeyRound className="w-4 h-4 text-gray-400" />
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Change password</p>
                      </div>
                      <div className="space-y-2.5">
                        <div className="relative">
                          <input
                            type={showPw ? 'text' : 'password'}
                            value={newPw}
                            onChange={(e) => setNewPw(e.target.value)}
                            placeholder="New password"
                            autoComplete="new-password"
                            className="w-full pl-3 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all"
                          />
                          <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <input
                          type={showPw ? 'text' : 'password'}
                          value={confirmPw}
                          onChange={(e) => setConfirmPw(e.target.value)}
                          placeholder="Confirm new password"
                          autoComplete="new-password"
                          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => void handleChangePassword()}
                          disabled={pwSaving || !newPw || !confirmPw}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {pwSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : 'Update password'}
                        </button>
                        <p className="text-[11px] text-gray-400">Minimum 8 characters. You'll stay signed in on this device.</p>
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                    >
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lead notes card ── */}
      <AnimatePresence>
        {noteLeadId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setNoteLeadId(null)} />
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 8 }} transition={{ duration: 0.18 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <p className="text-sm font-bold text-gray-900">Lead notes</p>
                </div>
                <button onClick={() => setNoteLeadId(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"><CloseIcon className="w-4 h-4" /></button>
              </div>
              <div className="p-5">
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={6}
                  autoFocus
                  placeholder="Type notes about this lead — interests, budget, follow-up date, objections…"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button onClick={() => setNoteLeadId(null)} className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={saveNote} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors"><Save className="w-4 h-4" /> Save note</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile Sidebar Overlay ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/40 z-40 md:hidden" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed inset-y-0 left-0 w-72 bg-white z-50 md:hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                  <img src={logoUrl} alt="The Way — Home" className="h-9 w-auto object-contain" />
                </Link>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative ${
                    location.pathname === '/' ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Home className={`w-5 h-5 shrink-0 ${location.pathname === '/' ? 'text-amber-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-semibold">Home</span>
                </Link>
                {filteredItems.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative ${
                        isActive ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-500 rounded-r-full" />}
                      <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-amber-600' : 'text-gray-400'}`} />
                      <span className="text-sm font-semibold">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-3 border-t border-gray-100 space-y-1">
                <a href="/welcome" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                  <Globe className="w-5 h-5 shrink-0 text-gray-400" />
                  <span className="text-sm font-semibold flex-1">Main website</span>
                  <ArrowUpRight className="w-4 h-4 text-gray-300" />
                </a>
                <button onClick={() => { openProfile(); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <Avatar name={user?.name} photo={avatarUrl} className="w-8 h-8 rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-400">{meta.label} · {user?.points ?? 0} pts</p>
                  </div>
                </button>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-semibold">Log out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile Bottom Nav — navy app bar ── */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden pb-safe">
          <div className="bg-gradient-to-r from-[#0A1628] to-[#0D1F3C] border-t border-white/10 px-2 pb-2 pt-1 flex items-center gap-1 shadow-[0_-4px_20px_rgba(10,22,40,0.25)]">
            {filteredItems.slice(0, 4).map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link key={item.path} to={item.path} className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all ${isActive ? 'text-amber-400 bg-white/5' : 'text-gray-500'}`}>
                  <item.icon className="w-5 h-5" />
                  <span className="text-[9px] font-bold uppercase tracking-wide truncate">{item.label}</span>
                </Link>
              );
            })}
            <button onClick={() => setIsMobileMenuOpen(true)} className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-gray-500">
              <Menu className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wide">More</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default DashboardLayout;
