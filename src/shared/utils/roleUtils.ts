import type { Role } from '../auth/types';

export const roleHierarchy: Partial<Record<Role, Role[]>> = {
  'ADMINISTRADOR': ['ADMINISTRADOR', 'RRHH', 'RECLUTAMIENTO', 'CAPACITACIÓN', 'COMMUNITY', 'GTR', 'ASESOR_DE_VENTAS', 'LOGIN'],
  'RRHH': ['RRHH'],
  'RECLUTAMIENTO': ['RECLUTAMIENTO'],
  'CAPACITACIÓN': ['CAPACITACIÓN'],
  'COMMUNITY': ['COMMUNITY'],
  'GTR': ['GTR'],
  'ASESOR_DE_VENTAS': ['ASESOR_DE_VENTAS'],
  'LOGIN': ['LOGIN'],
};

export const canAccess = (userRoles: Role[], allowedRoles: Role[]): boolean => {
  if (userRoles.includes('ADMINISTRADOR')) return true;
  return userRoles.some(role => allowedRoles.includes(role));
};
