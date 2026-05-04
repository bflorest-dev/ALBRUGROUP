import { useAuth } from '@entities/auth';
import type { Role } from '@entities/auth';

export const useIsAuthorized = (allowedRoles: Role[]): boolean => {
  const { currentUser } = useAuth();
  if (!currentUser) return false;
  if (currentUser.roles.includes('ADMINISTRADOR')) return true;
  return currentUser.roles.some((role) => allowedRoles.includes(role as Role));
};
