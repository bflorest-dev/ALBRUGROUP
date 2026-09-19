/**
 * Paleta ordinal sólida para las tipificaciones de campañas.
 *
 * La posición es el contrato: índice 0 = Sin tipificar, índice 1 = Sin contacto, ...,
 * índice 6 = Preventa. Los nombres no participan en la selección del color, así que una
 * tipificación conserva su color mientras conserve su orden en el catálogo.
 *
 * La rampa clara sigue la referencia solicitada: dos neutros, naranja, amarillo, azul, morado y
 * verde. Son colores categóricos intencionalmente saturados; no se mezclan con la escala suave de
 * fondos de celda que se usa en la matriz.
 */
const RAMPA_CLARA = [
  '#D9D9D9',
  '#8F8F8F',
  '#EF7D2B',
  '#FFDD67',
  '#8DA7D4',
  '#8B008B',
  '#4F7F35'
];

/** Variante de contraste para superficies oscuras, conservando el mismo orden y familias de color. */
const RAMPA_OSCURA = [
  '#C8C8C8',
  '#A6A6A6',
  '#F39245',
  '#FFE58C',
  '#A6BCE0',
  '#B33DB3',
  '#76A95B'
];

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
 * Color del paso ordinal `indice` (0–6). Fuera de rango devuelve el gris neutro.
 * `oscuro` elige la variante de contraste, sin invertir la paleta clara.
 */
export function colorRampa(indice: number, oscuro: boolean): string {
  const rampa = oscuro ? RAMPA_OSCURA : RAMPA_CLARA;
  return indice >= 0 && indice < rampa.length ? rampa[indice] : COLOR_OTRAS;
}
