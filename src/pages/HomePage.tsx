import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, MessageSquare, Bell, LayoutDashboard, ChevronDown } from 'lucide-react';
import logoUrl from '../../1776590293988-019da507-f581-77e9-8281-8d60b280ccd6-removebg-preview.png';

const HomePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications } = useAppStore();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = React.useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);

  const unreadNotifications = user
    ? notifications.filter(n => n.userId === user.id && !n.read).length
    : 0;

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'student':
        return '/dashboard';
      case 'sales':
        return '/sales';
      case 'ops':
        return '/ops';
      case 'staff':
      case 'agency_staff':
        return '/staff';
      case 'agency':
        return '/agencies';
      case 'ceo':
        return '/admin';
      default:
        return '/';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setProfileOpen(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="The Way" className="h-10 w-auto object-contain" />
            <span className="text-white font-black text-lg hidden sm:inline">The Way Georgia</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button
              onClick={() => navigate('/messages')}
              className="relative p-2 text-gray-400 hover:text-white transition-colors"
              title="Messages"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => navigate('/messages')}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Welcome Card */}
          <div className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-white bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 border border-amber-400/30 shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10">
                <h1 className="text-4xl sm:text-5xl font-black mb-4">Welcome back, {user.name.split(' ')[0]}!</h1>
                <p className="text-lg text-black/80 font-semibold mb-6 max-w-2xl">
                  {user.role === 'student' && 'Your student portal is ready. Check your dashboard to track your application progress.'}
                  {user.role === 'sales' && 'Your sales dashboard is active. Start managing your leads and approvals.'}
                  {user.role === 'ops' && 'Your operations dashboard is ready. Monitor agency applications and updates.'}
                  {user.role === 'staff' && 'Your staff portal is active. Manage your assigned students and documents.'}
                  {user.role === 'agency_staff' && 'Your agency staff portal is ready. Work with your agency applications.'}
                  {user.role === 'ceo' && 'Your admin dashboard is active. Full platform overview and management available.'}
                  {user.role === 'agency' && 'Your agency portal is ready. Submit and manage student applications.'}
                </p>
                <button
                  onClick={() => navigate(getDashboardPath())}
                  className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-xl font-black hover:bg-gray-800 transition-colors"
                >
                  Go to Dashboard
                  <LayoutDashboard className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Sidebar */}
          <div className="space-y-4">
            <div className="rounded-3xl bg-white/5 border border-white/10 p-5 backdrop-blur-xl hover:bg-white/10 transition-colors" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-full flex items-center justify-between gap-3 px-4 py-4 rounded-3xl bg-black/30 border border-white/10 text-left"
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">Logged in as</p>
                  <p className="text-white font-black text-lg truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 capitalize mt-1">{user.role}</p>
                </div>
                <ChevronDown className={`w-5 h-5 text-white transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="mt-3 rounded-3xl bg-gray-950/95 border border-white/10 p-3 shadow-2xl">
                  <button
                    onClick={() => {
                      navigate(getDashboardPath());
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-2xl transition-colors text-left"
                  >
                    <LayoutDashboard className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="font-semibold text-sm">Dashboard</p>
                      <p className="text-xs text-gray-400">Open your workspace</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/messages');
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 mt-2 text-white hover:bg-white/10 rounded-2xl transition-colors text-left"
                  >
                    <MessageSquare className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="font-semibold text-sm">Messages</p>
                      <p className="text-xs text-gray-400">Go to chat</p>
                    </div>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 mt-2 text-red-400 hover:bg-red-500/10 rounded-2xl transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <div>
                      <p className="font-semibold text-sm">Logout</p>
                      <p className="text-xs text-gray-400">Sign out</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-xl hover:bg-white/10 transition-colors">
              <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Account Status</p>
              <p className="text-white font-black text-2xl">Active</p>
              <div className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-600 w-full"></div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-xl hover:bg-white/10 transition-colors">
              <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Your Role</p>
              <p className="text-white font-black text-2xl capitalize">{user.role}</p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-xl hover:bg-white/10 transition-colors">
              <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Unread Notifications</p>
              <p className="text-white font-black text-2xl">{unreadNotifications}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
