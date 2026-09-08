export const ROLE_HOME_ROUTES: Record<string, string> = {
  ADMINISTRADOR: '/app/admin/dashboard',
  RRHH: '/app/rrhh/asistencia',
  RECLUTADOR: '/app/reclutador/grupos-capacitacion',
  CAPACITADOR: '/app/capacitador',
  ASESOR_GTR: '/app/gtr',
  SUPERVISOR_GTR: '/app/gtr',
  ASESOR_VENTAS: '/app/asesor-ventas',
  OJT: '/app/asesor-ventas',
  SUPERVISOR_VENTAS: '/app/supervisor-ventas',
  ASESOR_BACKOFFICE: '/app/backoffice/plataforma',
  SUPERVISOR_BACKOFFICE: '/app/backoffice/plataforma',
  ASESOR_POSTVENTA: '/app/postventa',
  SUPERVISOR_POSTVENTA: '/app/postventa',
  COMMUNITY: '/app/community',
  MONITOR: '/app/backoffice/plataforma'
};

export type OperationalScope = 'BACKOFFICE' | 'POSTVENTA';

export const POSTVENTA_ROLE = 'ASESOR_POSTVENTA';
export const POSTVENTA_BACKOFFICE_ROLE = 'ASESOR_BACKOFFICE';

export function resolveDefaultActiveRole(roles: readonly string[]): string | null {
  if (roles.includes(POSTVENTA_ROLE)) {
    return POSTVENTA_ROLE;
  }
  return roles[0] ?? null;
}

export function operationalScopeForRole(role?: string | null): OperationalScope | null {
  if (!role) {
    return null;
  }
  if (role === 'ASESOR_BACKOFFICE' || role === 'SUPERVISOR_BACKOFFICE' || role === 'MONITOR') {
    return 'BACKOFFICE';
  }
  if (role === 'ASESOR_POSTVENTA' || role === 'SUPERVISOR_POSTVENTA') {
    return 'POSTVENTA';
  }
  return null;
}
