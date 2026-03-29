import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@shared/auth/useAuth';
import { canUserAccess } from './RoleHierarchy';
import type { Role } from '@shared/auth/types';

const roleRoutes: Partial<Record<Role, string>> = {
  COMMUNITY: '/community/dashboard',
  ASESOR_GTR: '/gtr/dashboard',
  ASESOR_VENTAS: '/ventas/dashboard',
  ASESOR_BACKOFFICE: '/backoffice/dashboard',
};

const getRoleDashboard = (roles: Role[] | undefined): string => {
  if (!roles || roles.length === 0) return '/login';
  const role = roles[0]!;
  return roleRoutes[role] ?? '/no-autorizado';
};

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

  const redirectRoute = getRoleDashboard(currentUser.roles);
  return <Navigate to={redirectRoute} replace />;
};
