import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  LogOut, 
  Bell, 
  Menu, 
  Search,
  Calendar,
  MessageSquare,
  BarChart3,
  GraduationCap,
  UserCircle,
  Building2,
  Languages,
  X as CloseIcon
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../store/appStore';
import logoUrl from '../../1776590293988-019da507-f581-77e9-8281-8d60b280ccd6-removebg-preview.png';

interface SidebarItem {
  label: string;
  icon: LucideIcon;
  path: string;
  roles: string[];
}

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['student'] },
  { label: 'Universities', icon: GraduationCap, path: '/universities', roles: ['student', 'sales', 'ops', 'staff', 'agency_staff', 'ceo', 'agency'] },
  { label: 'Applications', icon: FileText, path: '/sales', roles: ['sales', 'ceo'] },
  { label: 'Agency Leads', icon: FileText, path: '/ops', roles: ['ops', 'ceo'] },
  { label: 'Agencies', icon: Building2, path: '/agencies', roles: ['agency', 'ceo'] },
  { label: 'Students', icon: Users, path: '/staff', roles: ['staff', 'agency_staff', 'ceo'] },
  { label: 'Analytics', icon: BarChart3, path: '/admin', roles: ['ceo'] },
  { label: 'Appointments', icon: Calendar, path: '/appointments', roles: ['student', 'staff', 'agency_staff', 'ceo'] },
  { label: 'Messages', icon: MessageSquare, path: '/messages', roles: ['student', 'staff', 'ceo'] },
];

const labelMap: Record<string, { en: string; ar: string }> = {
  'Dashboard': { en: 'Dashboard', ar: 'لوحة التحكم' },
  'Universities': { en: 'Universities', ar: 'الجامعات' },
  'Applications': { en: 'Applications', ar: 'الطلبات' },
  'Agency Leads': { en: 'Agency Leads', ar: 'طلبات الوكالات' },
  'Agencies': { en: 'Agencies', ar: 'الوكالات' },
  'Students': { en: 'Students', ar: 'الطلاب' },
  'Analytics': { en: 'Analytics', ar: 'التحليلات' },
  'Appointments': { en: 'Appointments', ar: 'المواعيد' },
  'Messages': { en: 'Messages', ar: 'الرسائل' },
  'Logout': { en: 'Logout', ar: 'تسجيل الخروج' },
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { notifications, users } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const lastNotifCountRef = React.useRef(0);
  useEffect(() => {
    if (!user) return;
    const count = notifications.filter(n => n.userId === user.id && !n.read).length;
    if (count > lastNotifCountRef.current) {
      const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
      audio.play().catch(() => {});
    }
    lastNotifCountRef.current = count;
  }, [notifications, user]);

  const filteredItems = sidebarItems.filter(item => user?.role && item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex overflow-hidden tw-mobile-shell">
      {/* Sidebar - Desktop */}
      <aside 
        className={`hidden md:flex flex-col bg-black text-white transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        <div className="p-6 flex items-center gap-3">
          <img src={logoUrl} alt="The Way" className="h-12 w-auto object-contain" />
          {/* Brand text removed per design; logo only */}
        </div>

        <nav className="flex-1 px-4 mt-6 space-y-2">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-black' : 'group-hover:text-white'}`} />
                {isSidebarOpen && <span className="font-bold text-sm tracking-wide">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 w-full px-4 py-3.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-bold text-sm tracking-wide">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="relative h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 tw-mobile-header">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative max-w-md hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm w-80 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setShowNotifs((v) => !v)} className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-all" aria-label="Notifications">
              <Bell className="w-5 h-5" />
              {notifications.some(n => n.userId === user?.id && !n.read) && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            {showNotifs && (
              <>
                <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowNotifs(false)} />
                <div className="absolute right-4 top-[72px] w-[min(24rem,calc(100vw-2rem))] tw-panel overflow-hidden z-50 hidden md:block">
                <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                  <p className="text-sm font-black text-black">Notifications</p>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {notifications.filter(n => n.userId === user?.id).length}
                  </span>
                </div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-gray-50">
                  {notifications.filter(n => n.userId === user?.id).slice().reverse().map(n => (
                    <div key={n.id} className="px-4 py-3 hover:bg-gray-50">
                      <p className="text-sm font-bold text-black">{n.title}</p>
                      <p className="text-xs font-medium text-gray-500">{n.message}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1">{new Date(n.time).toLocaleString()}</p>
                    </div>
                  ))}
                  {notifications.filter(n => n.userId === user?.id).length === 0 && (
                    <div className="px-4 py-6 text-sm font-medium text-gray-500 text-center">No notifications</div>
                  )}
                </div>
                </div>
                <div className="fixed left-0 right-0 bottom-0 top-20 tw-panel overflow-hidden z-50 md:hidden">
                  <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                    <p className="text-sm font-black text-black">Notifications</p>
                    <button onClick={() => setShowNotifs(false)} className="p-2 rounded-xl hover:bg-gray-50" aria-label="Close notifications">
                      <CloseIcon className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <div className="h-full overflow-y-auto custom-scrollbar divide-y divide-gray-50 pb-[calc(72px+env(safe-area-inset-bottom))]">
                    {notifications.filter(n => n.userId === user?.id).slice().reverse().map(n => (
                      <div key={n.id} className="px-4 py-3 hover:bg-gray-50">
                        <p className="text-sm font-bold text-black">{n.title}</p>
                        <p className="text-xs font-medium text-gray-500">{n.message}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">{new Date(n.time).toLocaleString()}</p>
                      </div>
                    ))}
                    {notifications.filter(n => n.userId === user?.id).length === 0 && (
                      <div className="px-4 py-6 text-sm font-medium text-gray-500 text-center">No notifications</div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            <div className="h-8 w-px bg-gray-100 mx-2"></div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-black leading-none">{user?.name}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{user?.role}</p>
              </div>
              <button onClick={() => setShowProfile(true)} className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 border border-amber-200 shadow-sm overflow-hidden" aria-label="Profile">
                <UserCircle className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar pb-[calc(132px+env(safe-area-inset-bottom))] md:pb-8 tw-mobile-content">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] p-4 flex items-start justify-center overflow-y-auto">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowProfile(false)} />
            <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} className="relative tw-card p-8 w-full max-w-lg my-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <h3 className="text-2xl font-black text-black mb-6">Profile</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700 font-black text-xl">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-black">{user.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="tw-panel p-4 bg-gray-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email</p>
                  <p className="font-bold">{user.email}</p>
                </div>
                <div className="tw-panel p-4 bg-gray-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Points</p>
                  <p className="font-black text-2xl">{user.points ?? 0}</p>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Leaderboard Snapshot</p>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {users.filter(u => u.role === user.role).sort((a,b)=> (b.points??0)-(a.points??0)).slice(0,10).map((u,i)=>(
                    <div key={u.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-black text-white rounded-lg flex items-center justify-center text-[10px] font-black">{i+1}</span>
                        <p className="font-bold text-black">{u.name}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">{u.points ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setShowProfile(false)} className="px-6 py-3 rounded-2xl font-black text-sm bg-black text-white hover:bg-amber-500 hover:text-black transition-all">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-80 bg-black z-50 md:hidden flex flex-col p-6"
            >
              <div className="flex items-center justify-between">
                <img src={logoUrl} alt="The Way" className="h-12 w-auto object-contain" />
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-xl hover:bg-white/10 text-white/70" aria-label="Close menu">
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <nav className="mt-6 space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {filteredItems.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                          : 'text-gray-200 hover:bg-white/10'
                      }`}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="font-black text-sm tracking-wide">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 w-full px-4 py-3.5 text-gray-200 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-all duration-200"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <span className="font-black text-sm tracking-wide">Logout</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-2 tw-mobile-bottomnav">
            {filteredItems.slice(0, 4).map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition-all ${
                    isActive ? 'bg-amber-500/15 text-amber-700' : 'text-gray-600'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest truncate">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-16 flex flex-col items-center justify-center gap-1 py-2 rounded-2xl text-gray-600"
              aria-label="More"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">More</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default DashboardLayout;




