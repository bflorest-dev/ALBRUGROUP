import type { Role } from '@shared/auth/types';

export interface RouteDefinition {
  path: string;
  label: string;
  allowedRoles: Role[];
}

export const routes: RouteDefinition[] = [
  { path: '/login', label: 'Login', allowedRoles: ['LOGIN', 'ADMINISTRADOR', 'RRHH', 'RECLUTAMIENTO', 'CAPACITACIÓN', 'COMMUNITY', 'GTR', 'ASESOR_DE_VENTAS'] },
  { path: '/panel', label: 'Panel', allowedRoles: ['ADMINISTRADOR'] },
  { path: '/rrhh', label: 'RRHH', allowedRoles: ['ADMINISTRADOR', 'RRHH'] },
  { path: '/reclutamiento', label: 'Reclutamiento', allowedRoles: ['ADMINISTRADOR', 'RECLUTAMIENTO'] },
  { path: '/capacitacion', label: 'Capacitación', allowedRoles: ['ADMINISTRADOR', 'CAPACITACIÓN'] },
  { path: '/community', label: 'Community', allowedRoles: ['ADMINISTRADOR', 'COMMUNITY'] },
  { path: '/gtr', label: 'GTR', allowedRoles: ['ADMINISTRADOR', 'GTR'] },
  { path: '/asesores', label: 'Asesores de Ventas', allowedRoles: ['ADMINISTRADOR', 'ASESOR_DE_VENTAS'] },
  { path: '/no-autorizado', label: 'No Autorizado', allowedRoles: ['ADMINISTRADOR', 'RRHH', 'RECLUTAMIENTO', 'CAPACITACIÓN', 'COMMUNITY', 'GTR', 'ASESOR_DE_VENTAS', 'LOGIN'] },
];
