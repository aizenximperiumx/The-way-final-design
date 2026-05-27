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
const StaffDashboard = React.lazy(() => import('./pages/StaffDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const Appointments = React.lazy(() => import('./pages/Appointments'));
const Messages = React.lazy(() => import('./pages/Messages'));
import NotFound from './pages/NotFound';
const UniversitiesPage = React.lazy(() => import('./pages/UniversitiesPage'));
const AgenciesPortal = React.lazy(() => import('./pages/AgenciesPortal'));

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
  if (role === 'staff' || role === 'agency_staff') return '/staff';
  if (role === 'agency') return '/agencies';
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
            <React.Suspense fallback={<div className="p-8 text-center font-bold">Loading...</div>}><SalesDashboard /></React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['staff', 'agency_staff', 'ceo']}>
            <React.Suspense fallback={<div className="p-8 text-center font-bold">Loading...</div>}><StaffDashboard /></React.Suspense>
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
        path="/appointments"
        element={
          <ProtectedRoute allowedRoles={['student', 'staff', 'agency_staff', 'sales', 'ops', 'agency', 'ceo']}>
            <React.Suspense fallback={<div className="p-8 text-center font-bold">Loading...</div>}><Appointments /></React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute allowedRoles={['student', 'staff', 'agency_staff', 'sales', 'ops', 'agency', 'ceo']}>
            <React.Suspense fallback={<div className="p-8 text-center font-bold">Loading...</div>}><Messages /></React.Suspense>
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



