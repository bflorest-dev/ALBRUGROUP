import React from 'react';
import type { ReactNode } from 'react';
import { AuthProvider } from '@shared/auth/AuthContext';
import { HeartbeatManager } from '@shared/auth/HeartbeatManager';

interface ProveedorAuthProps {
  children: ReactNode;
}

export const ProveedorAuth: React.FC<ProveedorAuthProps> = ({ children }) => {
  return (
    <AuthProvider>
      <HeartbeatManager>
        {children}
      </HeartbeatManager>
    </AuthProvider>
  );
};
