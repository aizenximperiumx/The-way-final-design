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
  const { currentUser, authStatus, login: storeLogin, logout: storeLogout, restoreSession, saveBackendState, backendHydrated } = useAppStore();
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
      await saveBackendState().catch(() => {});
    }
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
