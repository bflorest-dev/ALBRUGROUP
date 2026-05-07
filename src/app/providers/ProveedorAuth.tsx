import React from 'react';
import type { ReactNode } from 'react';
import { AuthProvider, HeartbeatManager } from '@entities/auth';

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
