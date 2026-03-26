import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@shared/auth/useAuth';
import { canUserAccess } from './RoleHierarchy';
import type { Role } from '@shared/auth/types';

interface RequireRoleProps {
  children: React.ReactElement;
  allowedRoles: Role[];
}

export const RequireRole: React.FC<RequireRoleProps> = ({ children, allowedRoles }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (canUserAccess(currentUser.roles, allowedRoles)) {
    return children;
  }

  return <Navigate to="/no-autorizado" replace />;
};
