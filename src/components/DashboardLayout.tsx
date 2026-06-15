import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, LogOut, Bell, Menu,
  Search, Calendar, MessageSquare, BarChart3, GraduationCap,
  Building2, X as CloseIcon, Trophy, Star,
  Award, ChevronRight, Mail, Zap,
  KeyRound, Phone, Eye, EyeOff, Loader2, BadgeCheck, AtSign
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../store/appStore';
// Dark-text wordmark — the previous logo had white text that was invisible on
// the white sidebar, leaving only the orange marks with an empty gap.
import logoUrl from '../../thewaynewlogo-removebg-preview.png';

interface SidebarItem {
  label: string;
  icon: LucideIcon;
  path: string;
  roles: string[];
  badge?: string;
}

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['student'] },
  { label: 'Universities', icon: GraduationCap, path: '/universities', roles: ['student', 'sales', 'ops', 'staff', 'agency_staff', 'ceo', 'agency'] },
  { label: 'Applications', icon: FileText, path: '/sales', roles: ['sales', 'ceo'] },
  { label: 'Agency Leads', icon: FileText, path: '/ops', roles: ['ops', 'ceo'] },
  { label: 'Agencies', icon: Building2, path: '/agencies', roles: ['agency', 'ceo'] },
  { label: 'Students', icon: Users, path: '/staff', roles: ['staff', 'agency_staff', 'ceo'] },
  { label: 'Analytics', icon: BarChart3, path: '/admin', roles: ['ceo'] },
  { label: 'Appointments', icon: Calendar, path: '/appointments', roles: ['student', 'staff', 'agency_staff', 'sales', 'ops', 'agency', 'ceo'] },
  { label: 'Messages', icon: MessageSquare, path: '/messages', roles: ['student', 'staff', 'agency_staff', 'sales', 'ops', 'agency', 'ceo'] },
];

const roleMeta: Record<string, { label: string; color: string; bg: string }> = {
  ceo:          { label: 'CEO',          color: 'text-purple-700', bg: 'bg-purple-50'  },
  sales:        { label: 'Sales',        color: 'text-blue-700',   bg: 'bg-blue-50'    },
  ops:          { label: 'Operations',   color: 'text-teal-700',   bg: 'bg-teal-50'    },
  staff:        { label: 'Staff',        color: 'text-amber-700',  bg: 'bg-amber-50'   },
  agency_staff: { label: 'Agency Staff', color: 'text-orange-700', bg: 'bg-orange-50'  },
  student:      { label: 'Student',      color: 'text-green-700',  bg: 'bg-green-50'   },
  agency:       { label: 'Agency',       color: 'text-indigo-700', bg: 'bg-indigo-50'  },
};

const rankMedal = (rank: number) => {
  if (rank === 1) return { emoji: '🥇', color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-200' };
  if (rank === 2) return { emoji: '🥈', color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200'     };
  if (rank === 3) return { emoji: '🥉', color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200'   };
  return { emoji: `#${rank}`, color: 'text-gray-400', bg: 'bg-gray-50 border-gray-100' };
};

const howToEarn = [
  { action: 'Claim a lead',          pts: +1,  icon: Zap       },
  { action: 'Approve a student',     pts: +1,  icon: Users     },
  { action: 'Assign a university',   pts: +1,  icon: GraduationCap },
  { action: 'Add internal note',     pts: +1,  icon: FileText  },
  { action: 'Complete intake',       pts: +1,  icon: Star      },
];

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { notifications, users, changePassword } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileTab, setProfileTab] = useState<'overview' | 'leaderboard' | 'account'>('overview');
  // Self-service password change (available to every role)
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const notifsRef = useRef<HTMLDivElement>(null);
  const lastNotifCountRef = useRef(0);

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

  // Leaderboard data
  const peers = users
    .filter(u => u.role === user?.role)
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  const myRank = peers.findIndex(u => u.id === user?.id) + 1;
  const maxPoints = peers[0]?.points ?? 1;
  const meta = roleMeta[user?.role ?? 'student'] ?? roleMeta.student;
  const medal = rankMedal(myRank);

  // Internal/competitive roles see points + leaderboard; everyone gets Account.
  const isCompetitive = ['ceo', 'sales', 'ops', 'staff', 'agency_staff'].includes(user?.role ?? '');

  const openProfile = () => {
    setProfileTab(isCompetitive ? 'overview' : 'account');
    setNewPw(''); setConfirmPw(''); setShowPw(false);
    setShowProfile(true);
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

      {/* ── Sidebar Desktop ── */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-gray-100 transition-all duration-300 ease-in-out shrink-0 ${isSidebarOpen ? 'w-64' : 'w-[72px]'}`}>
        {/* Logo */}
        <div className={`flex items-center gap-3 border-b border-gray-100 ${isSidebarOpen ? 'px-5 py-4' : 'px-4 py-4 justify-center'}`}>
          <img src={logoUrl} alt="The Way" className="h-9 w-auto object-contain shrink-0" />
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                title={!isSidebarOpen ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-500 rounded-r-full" />}
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-amber-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {isSidebarOpen && <span className={`text-sm font-semibold truncate ${isActive ? 'text-amber-700' : ''}`}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <button
            onClick={openProfile}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all text-left ${!isSidebarOpen ? 'justify-center' : ''}`}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm shrink-0">
              {user?.name?.charAt(0) ?? '?'}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate leading-none">{user?.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{meta.label}</p>
              </div>
            )}
            {isSidebarOpen && <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />}
          </button>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all ${!isSidebarOpen ? 'justify-center' : ''}`}
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
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all"
              />
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
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${unreadCount > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        {unreadCount > 0 ? `${unreadCount} new` : 'All read'}
                      </span>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                      {myNotifs.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                          <p className="text-sm text-gray-400 font-medium">No notifications yet</p>
                        </div>
                      ) : myNotifs.map(n => (
                        <div key={n.id} className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-amber-50/40' : ''}`}>
                          {!n.read && <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full mb-1" />}
                          <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(n.time).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-6 bg-gray-100 mx-1" />

            {/* Profile trigger */}
            <button
              onClick={openProfile}
              className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                {user?.name?.charAt(0) ?? '?'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-900 leading-none">{user?.name}</p>
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
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden"
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
                    <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-xl flex items-center justify-center text-3xl font-black text-amber-600 bg-amber-50">
                      {user.name.charAt(0)}
                    </div>
                    {isCompetitive && myRank > 0 && myRank <= 3 && (
                      <span className="absolute -bottom-2 -right-2 text-xl">{medal.emoji}</span>
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
                {(isCompetitive ? (['overview', 'leaderboard', 'account'] as const) : (['account'] as const)).map(tab => (
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

              <div className="p-6 max-h-72 overflow-y-auto custom-scrollbar">
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
                            <span className="text-sm font-bold text-amber-600">+{item.pts} pt</span>
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

                {profileTab === 'account' && (
                  <div className="space-y-5">
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

      {/* ── Mobile Sidebar Overlay ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/40 z-40 md:hidden" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed inset-y-0 left-0 w-72 bg-white z-50 md:hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <img src={logoUrl} alt="The Way" className="h-9 w-auto object-contain" />
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
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
                <button onClick={() => { openProfile(); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm shrink-0">{user?.name?.charAt(0)}</div>
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

      {/* ── Mobile Bottom Nav ── */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden pb-safe">
          <div className="bg-white border-t border-gray-100 px-2 pb-2 pt-1 flex items-center gap-1">
            {filteredItems.slice(0, 4).map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link key={item.path} to={item.path} className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all ${isActive ? 'text-amber-600 bg-amber-50' : 'text-gray-400'}`}>
                  <item.icon className="w-5 h-5" />
                  <span className="text-[9px] font-bold uppercase tracking-wide truncate">{item.label}</span>
                </Link>
              );
            })}
            <button onClick={() => setIsMobileMenuOpen(true)} className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-gray-400">
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
