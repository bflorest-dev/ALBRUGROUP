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

/** Roles operativos que pueden pertenecer a más de un equipo a la vez. */
export const MULTI_TEAM_ROLES: readonly string[] = ['ASESOR_GTR', 'ASESOR_VENTAS'];

/** True si el rol pertenece al ámbito de equipos. */
export function esRolDeEquipo(rol?: string | null): boolean {
  return !!rol && TEAM_SCOPED_ROLES.includes(rol);
}

/** True si el puesto admite pertenecer a varios equipos. */
export function puedeMultiEquipo(puestoTrabajo?: string | null): boolean {
  return !!puestoTrabajo && MULTI_TEAM_ROLES.includes(puestoTrabajo);
}
