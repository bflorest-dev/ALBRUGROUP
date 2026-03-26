import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from './types';
import { AuthService } from '@entidades/auth/model';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth_user') || localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    AuthService.initialize();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await AuthService.login({ username: email, password });
    const user: User = {
      id: String(response.empleadoId),
      name: response.nombreCompleto,
      roles: response.roles as User['roles'],
    };
    setCurrentUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  };

  const logout = () => {
    setCurrentUser(null);
    AuthService.logout();
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
