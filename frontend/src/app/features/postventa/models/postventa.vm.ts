import { LeadPostventaBandejaResponse } from '../services/postventa-lead.service';

/** Severidad de tag de PrimeNG. */
export type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

/** Opcion de un control de seleccion (nunca exponemos IDs crudos al usuario). */
export interface SelectOption<T extends string | number | boolean> {
  readonly label: string;
  readonly value: T;
}

/** Fila de bandeja enriquecida con la agrupacion por fecha de instalacion (Hoy / mes) y el
 *  nombre del cliente partido en dos lineas para apilarlo en su columna. */
export type VisualLeadPostventa = LeadPostventaBandejaResponse & {
  readonly fechaGroupKey: string;
  readonly fechaGroupLabel: string;
  readonly fechaGroupSortKey: string;
  readonly clienteLinea1: string;
  readonly clienteLinea2: string;
};

/** Parte un nombre completo en dos lineas por palabras (mitad y mitad) para apilarlo. */
export function splitNombreDosLineas(value?: string | null): { linea1: string; linea2: string } {
  const parts = (value ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { linea1: SIN_DATO, linea2: '' };
  }
  if (parts.length === 1) {
    return { linea1: parts[0], linea2: '' };
  }
  const corte = Math.ceil(parts.length / 2);
  return { linea1: parts.slice(0, corte).join(' '), linea2: parts.slice(corte).join(' ') };
}

/** Texto + color de un estado, resuelto una sola vez por codigo (referencia estable para el template). */
export interface EstadoBadge {
  readonly label: string;
  readonly severity: TagSeverity;
}

const SIN_DATO = '—';

/** Diccionario de estados de la bandeja en lenguaje de usuario final (no el enum crudo). */
const ESTADO_BADGES: Record<string, EstadoBadge> = {
  // Cliente
  ACTIVO: { label: 'Activo', severity: 'success' },
  SUSPENDIDO: { label: 'Suspendido', severity: 'warn' },
  BAJA: { label: 'Baja', severity: 'danger' },
  // Credenciales
  ENTREGADAS: { label: 'Entregadas', severity: 'success' },
  PENDIENTES: { label: 'Pendientes', severity: 'warn' },
  NO_REQUIERE: { label: 'No requiere', severity: 'secondary' },
  // Pago
  PAGADA: { label: 'Pagado', severity: 'success' },
  PAGO_CONFIRMADO: { label: 'Pago confirmado', severity: 'success' },
  PENDIENTE_PAGO: { label: 'Pago pendiente', severity: 'warn' },
  PAGO_PENDIENTE: { label: 'Pago pendiente', severity: 'warn' },
  POR_EMITIR: { label: 'Por emitir', severity: 'info' },
  VENCIDA: { label: 'Vencido', severity: 'danger' },
  VENCIDO: { label: 'Vencido', severity: 'danger' },
  EN_COBRANZA: { label: 'En cobranza', severity: 'warn' },
  PROGRAMADO: { label: 'Programado', severity: 'info' },
  FACTURA_EMITIDA: { label: 'Factura emitida', severity: 'info' },
  ANULADO: { label: 'Anulado', severity: 'secondary' },
  // Servicio
  MUY_SATISFECHO: { label: 'Muy satisfecho', severity: 'success' },
  SATISFECHO: { label: 'Satisfecho', severity: 'success' },
  INSATISFECHO: { label: 'Insatisfecho', severity: 'danger' },
  SIN_CALIFICAR: { label: 'Sin encuesta', severity: 'secondary' },
  // Resumen de satisfaccion (StatusSatisfaccion)
  POCO_SATISFECHO: { label: 'Poco satisfecho', severity: 'warn' },
  NADA_SATISFECHO: { label: 'Nada satisfecho', severity: 'danger' },
  // Entregas / credenciales
  ACTIVA: { label: 'Activa', severity: 'success' },
  CANCELADA: { label: 'Cancelada', severity: 'secondary' },
  REEMPLAZADA: { label: 'Reemplazada', severity: 'info' },
  EXPIRADA: { label: 'Expirada', severity: 'danger' },
  SUSPENDIDA: { label: 'Suspendida', severity: 'warn' }
};

/** Resuelve el badge (texto + color) de un estado; cae a un texto legible si no esta mapeado. */
export function estadoBadge(value: unknown): EstadoBadge {
  const key = String(value ?? '').toUpperCase();
  if (key in ESTADO_BADGES) {
    return ESTADO_BADGES[key];
  }
  return { label: humanize(value), severity: 'secondary' };
}

/** Convierte un valor a texto legible: guiones bajos a espacios, capitaliza. */
export function humanize(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return SIN_DATO;
  }
  const text = String(value).replaceAll('_', ' ').toLowerCase().trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Valor mostrable o guion largo si viene vacio. */
export function display(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return SIN_DATO;
  }
  return String(value);
}

/** Nombre corto (dos palabras) para columnas angostas, sin recortar en seco. */
export function shortName(value?: string | null): string {
  if (!value) {
    return SIN_DATO;
  }
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return parts.length <= 2 ? value : `${parts[0]} ${parts[1]}`;
}
