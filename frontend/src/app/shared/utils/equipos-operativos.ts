/**
 * TEMPORAL: hoy la operacion solo usa estos equipos, asi que los selectores de metricas se acotan
 * a ellos. Es un filtro de UI mientras la estructura no permita activar/desactivar equipos.
 *
 * Cuando exista esa gestion, el filtro correcto es `activo` del backend (aplica a todo el sistema,
 * no solo a estos selectores) y este archivo debe borrarse.
 */
const EQUIPOS_OPERATIVOS = ['claroteam', 'winteam'];

export function esEquipoOperativo(nombre: string | null | undefined): boolean {
  return EQUIPOS_OPERATIVOS.includes((nombre ?? '').trim().toLowerCase());
}
