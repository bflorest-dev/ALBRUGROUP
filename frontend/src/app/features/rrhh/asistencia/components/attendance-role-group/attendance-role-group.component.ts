import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { AttendanceRoleGroup, CumplimientoRow } from '../../facades/rrhh-asistencia.facade';

/**
 * Una sub-sección de rol dentro de la bandeja: encabezado (rol + conteo) y sus filas de empleado.
 * Presentacional puro; emite el empleado al hacer click en una fila. Todos los helpers devuelven
 * primitivos (string/number) para no crear refs nuevas en cada render.
 */
@Component({
  selector: 'app-attendance-role-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './attendance-role-group.component.html',
  styleUrl: './attendance-role-group.component.scss'
})
export class AttendanceRoleGroupComponent {
  readonly group = input.required<AttendanceRoleGroup>();
  readonly rowClick = output<CumplimientoRow>();

  protected initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase();
  }

  protected asistidos(row: CumplimientoRow): number {
    return Math.max(row.diasLaborables - row.diasSinRegistro, 0);
  }

  protected ratioPct(row: CumplimientoRow): number {
    return row.diasLaborables > 0 ? Math.round((this.asistidos(row) / row.diasLaborables) * 100) : 0;
  }

  protected balanceLabel(minutes: number): string {
    if (minutes === 0) return '0 h';
    const sign = minutes > 0 ? '+' : '-';
    const abs = Math.abs(minutes);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    if (h === 0) return `${sign}${m} min`;
    if (m === 0) return `${sign}${h} h`;
    return `${sign}${h} h ${m} min`;
  }

  /** Ancho del relleno del termómetro (0–50% desde el centro). Tope: 6 h = mitad de la barra. */
  protected balancePct(minutes: number): number {
    if (minutes === 0) return 0;
    return Math.max(Math.min(Math.abs(minutes) / 360, 1) * 50, 1.5);
  }

  protected balanceTone(minutes: number): 'neg' | 'pos' | 'zero' {
    if (minutes < 0) return 'neg';
    if (minutes > 0) return 'pos';
    return 'zero';
  }
}
