import { MetricsPeriodo } from '../components/period-selector/period-selector.component';

/** Cotas a enviar al backend. Ausentes = el backend usa el dia operativo de hoy (America/Lima). */
export interface MetricsRange {
  desde?: string;
  hasta?: string;
}

/** Fecha local en `YYYY-MM-DD`. Nunca `toISOString()`: convierte a UTC y puede cambiar el dia en Peru. */
export function formatLocalDate(date: Date): string {
  const mes = `${date.getMonth() + 1}`.padStart(2, '0');
  const dia = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${mes}-${dia}`;
}

export function localToday(): string {
  return formatLocalDate(new Date());
}

/**
 * Inicio de la semana operativa: el sabado mas reciente <= hoy. La semana de la empresa va de
 * sabado a viernes, asi que un sabado devuelve hoy mismo y un viernes devuelve el sabado anterior.
 */
export function weekStart(): string {
  const now = new Date();
  const diasDesdeSabado = (now.getDay() - 6 + 7) % 7; // getDay: 0=Dom .. 6=Sab
  return formatLocalDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - diasDesdeSabado));
}

/** Primer dia del mes actual. */
export function monthStart(): string {
  const now = new Date();
  return formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

/**
 * Traduce el periodo elegido a las cotas del backend. `dia` solo aplica al periodo `dia`:
 * sin dia puntual se omiten las cotas y el backend resuelve "hoy".
 */
export function resolveMetricsRange(periodo: MetricsPeriodo, dia: string | null): MetricsRange {
  switch (periodo) {
    case 'dia':
      return dia ? { desde: dia, hasta: dia } : {};
    case 'semana':
      return { desde: weekStart() };
    case 'mes':
      return { desde: monthStart() };
  }
}
