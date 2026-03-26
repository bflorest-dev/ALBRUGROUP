import React from 'react';
import type { ReactNode } from 'react';
import { AuthProvider } from '@shared/auth/AuthContext';

interface ProveedorAuthProps {
  children: ReactNode;
}

export const ProveedorAuth: React.FC<ProveedorAuthProps> = ({ children }) => {
  return <AuthProvider>{children}</AuthProvider>;
};
