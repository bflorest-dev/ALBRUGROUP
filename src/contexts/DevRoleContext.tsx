import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Role } from '../shared/types';

interface DevRoleContextType {
  selectedRole: Role;
  setSelectedRole: (role: Role) => void;
}

const DevRoleContext = createContext<DevRoleContextType | undefined>(undefined);

// Get the stored role from localStorage or use default
const getInitialRole = (): Role => {
  try {
    const stored = localStorage.getItem('selectedRole') as Role;
    return stored || 'RRHH';
  } catch {
    return 'RRHH';
  }
};

export const useDevRole = () => {
  const context = useContext(DevRoleContext);
  if (!context) {
    throw new Error('useDevRole must be used within a DevRoleProvider');
  }
  return context;
};

interface DevRoleProviderProps {
  children: React.ReactNode;
}

export const DevRoleProvider: React.FC<DevRoleProviderProps> = ({ children }) => {
  const [selectedRole, setSelectedRole] = useState<Role>(getInitialRole());

  // Persist role to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('selectedRole', selectedRole);
    } catch (error) {
      console.error('Error saving role to localStorage:', error);
    }
  }, [selectedRole]);

  return (
    <DevRoleContext.Provider value={{ selectedRole, setSelectedRole }}>
      {children}
    </DevRoleContext.Provider>
  );
};