import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface AppContextType {
  // Propiedades globales de la app
  // Placeholder para futuras propiedades
  placeholder?: never;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value: AppContextType = {};

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp debe ser usado dentro de AppProvider');
  }
  return context;
};
