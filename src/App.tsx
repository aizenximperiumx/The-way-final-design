import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import LandingPage from './pages/LandingPageV3Test';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
const StudentDashboard = React.lazy(() => import('./pages/StudentDashboard'));
const SalesDashboard = React.lazy(() => import('./pages/SalesDashboard'));
const OpsDashboard = React.lazy(() => import('./pages/OpsDashboard'));
const StaffDashboard = React.lazy(() => import('./pages/StaffDashboard'));
const AgencyStaffDashboard = React.lazy(() => import('./pages/AgencyStaffDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const SupportDashboard = React.lazy(() => import('./pages/SupportDashboard'));
const Appointments = React.lazy(() => import('./pages/Appointments'));
const Messages = React.lazy(() => import('./pages/Messages'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
import NotFound from './pages/NotFound';
const UniversitiesPage = React.lazy(() => import('./pages/UniversitiesPage'));
const AgenciesPortal = React.lazy(() => import('./pages/AgenciesPortal'));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'));

// Mobile student app (/app/*) — its own design, used inside the Capacitor shell.
const MobileLanding = React.lazy(() => import('./mobile/MobileLanding'));
const MobileLogin = React.lazy(() => import('./mobile/MobileLogin'));
const MobileHome = React.lazy(() => import('./mobile/MobileHome'));
const MobileJourney = React.lazy(() => import('./mobile/MobileJourney'));
const MobileCard = React.lazy(() => import('./mobile/MobileCard'));
const MobileMessages = React.lazy(() => import('./mobile/MobileMessages'));
const MobileProfile = React.lazy(() => import('./mobile/MobileProfile'));
const MobileGeorgia = React.lazy(() => import('./mobile/MobileGeorgia'));

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import type { UserRole } from './store/appStore';

import DashboardLayout from './components/DashboardLayout';
import logoUrl from '../thewaynewlogo-removebg-preview.png';

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
          <div className="text-center">
            <h1 className="text-4xl font-black text-amber-500 mb-4">Something went wrong.</h1>
            <p className="text-gray-400 mb-8">We've encountered a critical error. Please try refreshing the page.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-amber-500 text-black px-8 py-4 rounded-full font-bold hover:bg-white transition-all"
            >
              Refresh Platform
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Protected Route Component
const getHomePath = (role: UserRole) => {
  if (role === 'student') return '/dashboard';
  if (role === 'sales') return '/sales';
  if (role === 'ops') return '/ops';
  if (role === 'staff') return '/staff';
  if (role === 'agency_staff') return '/agency-staff';
  if (role === 'agency') return '/agencies';
  if (role === 'customer_support') return '/support';
  if (role === 'ceo') return '/admin';
  return '/';
};

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: UserRole[] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <img src={logoUrl} alt="The Way" className="mx-auto h-12 w-auto object-contain animate-bounce" />
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">The Way Georgia</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getHomePath(user.role)} replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

// Public Route Component
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center animate-pulse">
          <img src={logoUrl} alt="The Way" className="mx-auto h-12 w-auto object-contain" />
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={getHomePath(user.role)} replace />;
  }

  return <>{children}</>;
};

// Home Route Component - shows HomePage for logged-in, LandingPage for logged-out
const HomeRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <img src={logoUrl} alt="The Way" className="mx-auto h-12 w-auto object-contain animate-bounce" />
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  if (user) {
    return <HomePage />;
  }

  return <LandingPage />;
};

// ── Mobile student-app guards (/app/*) ──
const appLoader = (
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A1628' }}>
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500" />
  </div>
);
const AppPublic = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return appLoader;
  if (user?.role === 'student') return <Navigate to="/app/home" replace />;
  return <>{children}</>;
};
const AppProtected = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return appLoader;
  if (!user) return <Navigate to="/app/login" replace />;
  return <>{children}</>; // MobileLayout handles the non-student case
};
const appSuspense = (node: React.ReactNode) => <React.Suspense fallback={appLoader}>{node}</React.Suspense>;

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<HomeRoute />}
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      {/* Public marketing site — reachable even while logged in (staff "Main website" link) */}
      <Route path="/welcome" element={<LandingPage />} />
      {/* Privacy policy — public, required by the app stores */}
      <Route path="/privacy" element={<React.Suspense fallback={null}><PrivacyPage /></React.Suspense>} />

      {/* ── Mobile student app (loaded by the Capacitor shell) ── */}
      <Route path="/app" element={<AppPublic>{appSuspense(<MobileLanding />)}</AppPublic>} />
      <Route path="/app/login" element={<AppPublic>{appSuspense(<MobileLogin />)}</AppPublic>} />
      <Route path="/app/home" element={<AppProtected>{appSuspense(<MobileHome />)}</AppProtected>} />
      <Route path="/app/journey" element={<AppProtected>{appSuspense(<MobileJourney />)}</AppProtected>} />
      {/* Legacy path kept so old shells/bookmarks still work */}
      <Route path="/app/documents" element={<AppProtected>{appSuspense(<MobileJourney />)}</AppProtected>} />
      <Route path="/app/card" element={<AppProtected>{appSuspense(<MobileCard />)}</AppProtected>} />
      <Route path="/app/georgia" element={<AppProtected>{appSuspense(<MobileGeorgia />)}</AppProtected>} />
      <Route path="/app/messages" element={<AppProtected>{appSuspense(<MobileMessages />)}</AppProtected>} />
      <Route path="/app/profile" element={<AppProtected>{appSuspense(<MobileProfile />)}</AppProtected>} />
      <Route path="/universities" element={<React.Suspense fallback={<div className="p-8 text-center font-bold">Loading universities...</div>}><UniversitiesPage /></React.Suspense>} />
      <Route path="/universities/:id" element={<React.Suspense fallback={<div className="p-8 text-center font-bold">Loading universities...</div>}><UniversitiesPage /></React.Suspense>} />
      <Route
        path="/agencies"
        element={
          <ProtectedRoute allowedRoles={['agency', 'ceo']}>
            <React.Suspense fallback={<div className="p-8 text-center font-bold">Loading...</div>}><AgenciesPortal /></React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <React.Suspense fallback={<div className="p-8 text-center font-bold">Loading...</div>}><StudentDashboard /></React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <ProtectedRoute allowedRoles={['sales', 'ceo']}>
            <React.Suspense fallback={<div className="p-8 text-center font-bold">Loading...</div>}><SalesDashboard /></React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ops"
        element={
          <ProtectedRoute allowedRoles={['ops', 'ceo']}>
            <React.Suspense fallback={<div className="p-8 text-center font-bold">Loading...</div>}><OpsDashboard /></React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['staff', 'ceo']}>
            <React.Suspense fallback={<div className="p-8 text-center font-bold">Loading...</div>}><StaffDashboard /></React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/agency-staff"
        element={
          <ProtectedRoute allowedRoles={['agency_staff', 'ceo']}>
            <React.Suspense fallback={<div className="p-8 text-center font-bold">Loading...</div>}><AgencyStaffDashboard /></React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ceo']}>
            <React.Suspense fallback={<div className="p-8 text-center font-bold">Loading admin...</div>}><AdminDashboard /></React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/support"
        element={
          <ProtectedRoute allowedRoles={['customer_support', 'ceo']}>
            <React.Suspense fallback={<div className="p-8 text-center font-bold">Loading...</div>}><SupportDashboard /></React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute allowedRoles={['student', 'staff', 'agency_staff', 'sales', 'ops', 'agency', 'ceo', 'customer_support']}>
            <React.Suspense fallback={<div className="p-8 text-center font-bold">Loading...</div>}><Appointments /></React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute allowedRoles={['student', 'staff', 'agency_staff', 'sales', 'ops', 'agency', 'ceo', 'customer_support']}>
            <React.Suspense fallback={<div className="p-8 text-center font-bold">Loading...</div>}><Messages /></React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['student', 'staff', 'agency_staff', 'sales', 'ops', 'agency', 'ceo', 'customer_support']}>
            <React.Suspense fallback={<div className="p-8 text-center font-bold">Loading...</div>}><ProfilePage /></React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AuthProvider>
          <Router>
            <AppRoutes />
            <Toaster position="top-right" />
          </Router>
        </AuthProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;



