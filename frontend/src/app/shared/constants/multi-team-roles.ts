/**
 * Roles operativos que participan en el concepto de equipo. Espejo del backend
 * (EquipoService.ROLES_OPERATIVOS).
 */
export const TEAM_SCOPED_ROLES: readonly string[] = [
  'ASESOR_GTR',
  'SUPERVISOR_GTR',
  'ASESOR_VENTAS',
  'SUPERVISOR_VENTAS',
  'OJT',
  'FREELANCE'
];

/** Ambitos secundarios usados por los roles gestionados por proveedor. */
export type ProviderScope = 'BACKOFFICE' | 'POSTVENTA';

/** Espejo del backend (ProveedorScopeService) para resolver la matriz de PERSONAL. */
export const PROVIDER_SCOPED_ROLES: Readonly<Record<string, ProviderScope>> = {
  ASESOR_BACKOFFICE: 'BACKOFFICE',
  SUPERVISOR_BACKOFFICE: 'BACKOFFICE',
  MONITOR: 'BACKOFFICE',
  ASESOR_POSTVENTA: 'POSTVENTA',
  SUPERVISOR_POSTVENTA: 'POSTVENTA'
};

/** Roles operativos que pueden pertenecer a más de un equipo a la vez. */
export const MULTI_TEAM_ROLES: readonly string[] = ['ASESOR_GTR', 'ASESOR_VENTAS'];

/** True si el rol pertenece al ámbito de equipos. */
export function esRolDeEquipo(rol?: string | null): boolean {
  return !!rol && TEAM_SCOPED_ROLES.includes(rol);
}

/** Devuelve el ambito por proveedor del rol, si corresponde. */
export function ambitoProveedorPorRol(rol?: string | null): ProviderScope | null {
  return rol ? PROVIDER_SCOPED_ROLES[rol] ?? null : null;
}

/** True si el puesto admite pertenecer a varios equipos. */
export function puedeMultiEquipo(puestoTrabajo?: string | null): boolean {
  return !!puestoTrabajo && MULTI_TEAM_ROLES.includes(puestoTrabajo);
}
