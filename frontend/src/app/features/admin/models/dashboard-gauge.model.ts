/** View model de una tarjeta de métricas del DASHBOARD (un equipo o el total). */
export interface DashboardGaugeCard {
  key: string;
  equipo: string;
  registros: number; // A
  leadsUnicos: number; // B
  repetidos: number; // C = A - B
  leadsRepetidos: number; // D
  tipificados: number; // F
  ventaCerrada: number; // H
  pctValidos: number; // E = B / A
  pctGestion: number; // F / B
  from: string;
  to: string;
  isTotal: boolean;
}

interface GaugeColors {
  from: string;
  to: string;
}

/** Degradado neutro para equipos sin color asignado (y para el Total). */
const DEFAULT_GAUGE_COLORS: GaugeColors = { from: '#D1D5DB', to: '#9AA5B1' };

const HEX_RE = /^#([0-9a-fA-F]{6})$/;

/** Aclara un hex mezclándolo con blanco (ratio 0-1). */
function lighten(hex: string, ratio: number): string {
  const value = hex.slice(1);
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const mix = (channel: number): string =>
    Math.round(channel + (255 - channel) * ratio)
      .toString(16)
      .padStart(2, '0');
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

/**
 * Deriva el degradado del medidor a partir del color de marca del equipo:
 * el tono fuerte es el hex elegido por el admin y el tono claro se aclara.
 * Si el equipo no tiene color (o el hex es inválido), usa el gris por defecto.
 */
export function resolveGaugeColors(color: string | null | undefined): GaugeColors {
  if (!color || !HEX_RE.test(color)) {
    return DEFAULT_GAUGE_COLORS;
  }
  return { from: lighten(color, 0.5), to: color };
}
