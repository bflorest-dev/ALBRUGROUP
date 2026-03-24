import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Role } from '@compartido/tipos';

interface DevRoleContextType {
  selectedRole: Role;
  setSelectedRole: (role: Role) => void;
}

const DevRoleContext = createContext<DevRoleContextType | undefined>(undefined);

// Get the stored role from localStorage or use default
const getInitialRole = (): Role => {
  try {
    // Si no hay token de autenticación, mostrar LOGIN
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('[DevRoleContext] No token found, showing LOGIN');
      return 'LOGIN';
    }
    
    // Si hay token, usar el rol guardado o ADMINISTRADOR por defecto
    const stored = localStorage.getItem('selectedRole') as Role;
    console.log('[DevRoleContext] Token found, using role:', stored || 'ADMINISTRADOR');
    return stored || 'ADMINISTRADOR';
  } catch {
    return 'LOGIN';
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