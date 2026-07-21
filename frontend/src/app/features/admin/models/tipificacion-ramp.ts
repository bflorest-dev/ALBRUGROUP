/**
 * Rampa ordinal para las tipificaciones: un solo tono, de claro a oscuro según avanza el desenlace
 * (sin contacto → preventa). Es una escala ordenada, no categorías sueltas, por eso una rampa y no
 * colores arbitrarios.
 *
 * Ambas rampas están verificadas con el validador del sistema de diseño
 * (`dataviz/scripts/validate_palette.js --ordinal`): luminosidad monótona, separación mínima entre
 * pasos y extremo visible contra su superficie. El modo oscuro **no es un volteo** de la clara: es
 * su propia rampa, desplazada para que el extremo profundo no se pierda contra el fondo.
 *
 * Seis pasos es el techo: con más, la separación de luminosidad cae por debajo del mínimo y los
 * pasos dejan de distinguirse. Lo que exceda va a `COLOR_OTRAS`.
 */
const RAMPA_CLARA = ['#5FC2A4', '#3FAA8C', '#248D72', '#16705A', '#0C5445', '#05372D'];
const RAMPA_OSCURA = ['#B7EBD8', '#8FDCC0', '#66CBA6', '#43B48D', '#2E9575', '#1F755C'];

/** Gris neutro para tipificaciones históricas y para la cola agrupada. */
export const COLOR_OTRAS = '#94A3B8';

export const PASOS_RAMPA = RAMPA_CLARA.length;

/**
 * Color del paso `indice` (0 = desenlace más temprano). Fuera de rango devuelve el gris neutro.
 * `oscuro` elige la rampa del modo, no invierte la clara.
 */
export function colorTipificacion(indice: number, oscuro: boolean): string {
  const rampa = oscuro ? RAMPA_OSCURA : RAMPA_CLARA;
  return indice >= 0 && indice < rampa.length ? rampa[indice] : COLOR_OTRAS;
}
