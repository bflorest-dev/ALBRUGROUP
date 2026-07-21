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

/*
 * Escala aparte para FONDOS DE CELDA. No es la misma que la de las barras y no debe unificarse:
 * un relleno de barra tiene que destacar contra la superficie (saturado), mientras que un fondo de
 * celda va detrás de una cifra y tiene que dejarla legible (pálido). Reutilizar la rampa de barras
 * aquí daba 2.5:1 de contraste sobre los tonos medios: el número se perdía.
 *
 * En claro, los cinco primeros pasos mantienen tinta oscura por encima de 4.5:1; solo el último
 * invierte a tinta clara. En oscuro todos los pasos son profundos y la tinta es siempre clara.
 */
const CELDA_CLARA = ['#E8F7F1', '#CFEFE3', '#B0E4D2', '#8DD7BF', '#66C8A8', '#15705A'];
const CELDA_OSCURA = ['#0C231E', '#0F2E27', '#133A31', '#17473B', '#1C5546', '#216452'];

/** Fondo de celda para el paso `indice`. Fuera de rango = sin tinte. */
export function colorCelda(indice: number, oscuro: boolean): string {
  const escala = oscuro ? CELDA_OSCURA : CELDA_CLARA;
  return indice >= 0 && indice < escala.length ? escala[indice] : 'transparent';
}

/** Si el fondo es profundo, la cifra necesita tinta clara para seguir leyéndose. */
export function celdaConTintaClara(indice: number, oscuro: boolean): boolean {
  return oscuro ? indice >= 0 : indice === CELDA_CLARA.length - 1;
}

export const PASOS_RAMPA = RAMPA_CLARA.length;

/**
 * Color del paso `indice` (0 = el más claro). Fuera de rango devuelve el gris neutro.
 * `oscuro` elige la rampa del modo, no invierte la clara.
 *
 * Sirve para las dos lecturas de la rampa: orden de tipificación (barras) e intensidad de
 * magnitud (matriz de calor). Es la misma escala validada en ambos casos.
 */
export function colorRampa(indice: number, oscuro: boolean): string {
  const rampa = oscuro ? RAMPA_OSCURA : RAMPA_CLARA;
  return indice >= 0 && indice < rampa.length ? rampa[indice] : COLOR_OTRAS;
}
