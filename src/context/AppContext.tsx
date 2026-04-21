import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useAppStore, type AppStoreState } from '../store/appStore';

type AppContextType = AppStoreState;

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const store = useAppStore();

  return (
    <AppContext.Provider value={store}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
