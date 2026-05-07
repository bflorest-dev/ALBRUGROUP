import React from 'react';
import { useHeartbeat } from '@entities/auth/hooks/useHeartbeat';

export const HeartbeatManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useHeartbeat();

  return <>{children}</>;
};
