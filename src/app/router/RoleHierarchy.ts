import type { Role } from '@entities/auth';

export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  'ADMINISTRADOR': [
    'ADMINISTRADOR',
    'RRHH',
    'RECLUTAMIENTO',
    'CAPACITACIÓN',
    'COMMUNITY',
    'GTR',
    'ASESOR_DE_VENTAS',
    'LOGIN',
  ],
  'RRHH': ['RRHH', 'LOGIN'],
  'RECLUTAMIENTO': ['RECLUTAMIENTO', 'LOGIN'],
  'RECLUTADOR': ['RECLUTADOR', 'RECLUTAMIENTO', 'LOGIN'],
  'CAPACITACIÓN': ['CAPACITACIÓN', 'CAPACITACION', 'LOGIN'],
  'CAPACITADOR': ['CAPACITADOR', 'CAPACITACIÓN', 'CAPACITACION', 'LOGIN'],
  'COMMUNITY': ['COMMUNITY', 'LOGIN'],
  'GTR': ['GTR', 'LOGIN'],
  'ASESOR_DE_VENTAS': ['ASESOR_DE_VENTAS', 'LOGIN'],
  'CAPACITACION': ['CAPACITACION', 'LOGIN'],
  'CONTABILIDAD': ['CONTABILIDAD', 'LOGIN'],
  'SUPERVISOR_VENTAS': ['SUPERVISOR_VENTAS', 'LOGIN'],
  'ASESOR_VENTAS': ['ASESOR_VENTAS', 'LOGIN'],
  'SUPERVISOR_BACKOFFICE': ['SUPERVISOR_BACKOFFICE', 'LOGIN'],
  'ASESOR_BACKOFFICE': ['ASESOR_BACKOFFICE', 'LOGIN'],
  'SUPERVISOR_GTR': ['SUPERVISOR_GTR', 'LOGIN'],
  'ASESOR_GTR': ['ASESOR_GTR', 'LOGIN'],
  'SUPERVISOR_POSTVENTA': ['SUPERVISOR_POSTVENTA', 'LOGIN'],
  'ASESOR_POSTVENTA': ['ASESOR_POSTVENTA', 'LOGIN'],
  'LOGIN': ['LOGIN'],
};

export const canUserAccess = (userRoles: Role[], allowedRoles: Role[]): boolean => {
  // ADMINISTRADOR tiene acceso a todo
  if (userRoles.includes('ADMINISTRADOR')) {
    return true;
  }
  // Revisar si el usuario tiene alguno de los roles permitidos
  return userRoles.some(role => allowedRoles.includes(role));
};
