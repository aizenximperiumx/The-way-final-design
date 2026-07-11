import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAppStore, type AuthStatus, type User } from '../store/appStore';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  authStatus: AuthStatus;
  loading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser, authStatus, login: storeLogin, logout: storeLogout, restoreSession, saveBackendState, loadBackendState, backendHydrated } = useAppStore();
  const [isHydrated, setIsHydrated] = useState(useAppStore.persist.hasHydrated());
  const saveTimer = useRef<number | null>(null);
  const lastSnapshot = useRef<string>('');

  useEffect(() => {
    const unsubFinishHydration = useAppStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    return () => {
      unsubFinishHydration();
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    void restoreSession();
  }, [isHydrated, restoreSession]);

  useEffect(() => {
    if (!isHydrated) return;
    if (authStatus !== 'signed_in' || !backendHydrated) return;

    const unsub = useAppStore.subscribe((s) => {
      const snapshot = JSON.stringify({
        applications: s.applications,
        documents: s.documents,
        notifications: s.notifications,
        appointments: s.appointments,
        chatMessages: s.chatMessages,
        chatThreadReadAt: s.chatThreadReadAt,
        documentRequests: s.documentRequests,
        pointsLedger: s.pointsLedger,
        universityConfig: s.universityConfig,
      });
      if (snapshot === lastSnapshot.current) return;
      lastSnapshot.current = snapshot;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        void saveBackendState();
      }, 700);
    });

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      unsub();
    };
  }, [isHydrated, authStatus, backendHydrated, saveBackendState]);

  // Everyone shares one backend state but historically only pulled it at
  // login. Re-fetch when the user returns to the tab AND on a gentle polling
  // interval, so a teammate's fresh data (documents, requests, points,
  // notifications) appears without a re-login or manual refresh. Any pending
  // local edit is flushed first so the refresh can't race a save in flight.
  const internalRole = currentUser?.role === 'ceo' || currentUser?.role === 'sales'
    || currentUser?.role === 'ops' || currentUser?.role === 'staff' || currentUser?.role === 'agency_staff'
    || currentUser?.role === 'customer_support';
  useEffect(() => {
    if (!isHydrated || authStatus !== 'signed_in' || !backendHydrated) return;
    let refreshing = false;
    const refresh = async () => {
      if (refreshing || document.visibilityState !== 'visible') return;
      refreshing = true;
      try {
        if (saveTimer.current) { window.clearTimeout(saveTimer.current); saveTimer.current = null; await saveBackendState(); }
        await loadBackendState();
      } catch { /* offline / transient — ignore */ }
      finally { refreshing = false; }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    // Live polling: internal roles every 2 minutes, students/agencies every 3.
    const pollMs = internalRole ? 120_000 : 180_000;
    const pollId = window.setInterval(() => { void refresh(); }, pollMs);
    // Overdue-SLA check runs locally more often than the server sweep.
    const slaId = internalRole
      ? window.setInterval(() => { try { useAppStore.getState().evaluateSlaDeadlines(); } catch { /* noop */ } }, 300_000)
      : undefined;
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.clearInterval(pollId);
      if (slaId) window.clearInterval(slaId);
    };
  }, [isHydrated, authStatus, backendHydrated, internalRole, saveBackendState, loadBackendState]);

  const login = async (username: string, password: string) => {
    try {
      const user = await storeLogin(username, password);
      if (user) return user;
      toast.error('Invalid username or password');
      return null;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Login failed';
      toast.error(message);
      return null;
    }
  };

  const logout = async () => {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    await saveBackendState().catch(() => {});
    storeLogout();
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user: authStatus === 'signed_in' ? currentUser : null,
        authStatus,
        loading: !isHydrated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
