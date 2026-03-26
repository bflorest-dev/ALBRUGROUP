import { useAuth } from '../auth/useAuth';
import type { Role } from '../auth/types';

export const useIsAuthorized = (allowedRoles: Role[]): boolean => {
  const { currentUser } = useAuth();
  if (!currentUser) return false;
  if (currentUser.roles.includes('ADMINISTRADOR')) return true;
  return currentUser.roles.some(role => allowedRoles.includes(role));
};
