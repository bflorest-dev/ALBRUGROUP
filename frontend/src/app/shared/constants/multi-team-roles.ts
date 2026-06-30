/**
 * Roles (puestos) que pueden pertenecer a más de un equipo a la vez. Espejo del backend
 * (EquipoService.ROLES_MULTIEQUIPO). El resto de roles operativos van a un solo equipo.
 */
export const MULTI_TEAM_ROLES: readonly string[] = ['ASESOR_VENTAS'];

/** True si el puesto admite pertenecer a varios equipos. */
export function puedeMultiEquipo(puestoTrabajo?: string | null): boolean {
  return !!puestoTrabajo && MULTI_TEAM_ROLES.includes(puestoTrabajo);
}
