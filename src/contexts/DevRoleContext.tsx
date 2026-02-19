import React, { createContext, useContext, useState } from 'react';
import type { Role } from '../shared/types';

interface DevRoleContextType {
  selectedRole: Role;
  setSelectedRole: (role: Role) => void;
}

const DevRoleContext = createContext<DevRoleContextType | undefined>(undefined);

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
  const [selectedRole, setSelectedRole] = useState<Role>('RRHH');

  return (
    <DevRoleContext.Provider value={{ selectedRole, setSelectedRole }}>
      {children}
    </DevRoleContext.Provider>
  );
};