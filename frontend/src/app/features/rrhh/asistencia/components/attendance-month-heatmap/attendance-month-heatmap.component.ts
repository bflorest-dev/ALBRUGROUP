import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import type { CumplimientoDetalleDiaResponse } from '../../../../../shared/models/schedule/cumplimiento-response';

type DayState = 'presente' | 'tardanza' | 'falta' | 'descanso' | 'futuro' | 'empty';

interface HeatmapCell {
  day: number | null;
  state: DayState;
  tooltip: string;
}

/**
 * Calendario del mes (semanas en filas × días L→D en columnas) coloreado por estado diario.
 * Presentacional puro; deriva las celdas del detalle diario + el mes. Los días futuros o sin dato
 * quedan como celda vacía punteada. Domingo suele caer como descanso según el horario del empleado.
 */
@Component({
  selector: 'app-attendance-month-heatmap',
  standalone: true,
  imports: [TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './attendance-month-heatmap.component.html',
  styleUrl: './attendance-month-heatmap.component.scss'
})
export class AttendanceMonthHeatmapComponent {
  readonly dias = input<CumplimientoDetalleDiaResponse[]>([]);
  /** Mes en formato 'YYYY-MM'. */
  readonly month = input<string>('');

  protected readonly weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  protected readonly cells = computed<HeatmapCell[]>(() => {
    const month = this.month();
    if (!/^\d{4}-\d{2}$/.test(month)) return [];

    const [year, m] = month.split('-').map(Number);
    const byFecha = new Map<string, CumplimientoDetalleDiaResponse>();
    for (const dia of this.dias()) byFecha.set(dia.fecha, dia);

    const daysInMonth = new Date(year, m, 0).getDate();
    // Lunes = 0 (getDay: 0=domingo … 6=sábado).
    const firstOffset = (new Date(year, m - 1, 1).getDay() + 6) % 7;

    // Orden secuencial (Lun→Dom) con offset inicial y relleno final: al pintarse con la grilla por
    // columnas (grid-auto-flow: column, 7 filas), cada columna queda como una semana estilo GitHub.
    const cells: HeatmapCell[] = [];
    for (let i = 0; i < firstOffset; i += 1) cells.push({ day: null, state: 'empty', tooltip: '' });
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dia = byFecha.get(`${year}-${this.pad2(m)}-${this.pad2(day)}`);
      const state = this.resolveState(dia);
      cells.push({ day, state, tooltip: this.buildTooltip(day, m, dia, state) });
    }
    while (cells.length % 7 !== 0) cells.push({ day: null, state: 'empty', tooltip: '' });
    return cells;
  });

  private resolveState(dia?: CumplimientoDetalleDiaResponse): DayState {
    if (!dia) return 'futuro';
    if (!dia.laborable) return 'descanso';
    if (!dia.horaEntradaAsistencia) return 'falta';
    if (dia.tardanza) return 'tardanza';
    return 'presente';
  }

  private buildTooltip(day: number, month: number, dia: CumplimientoDetalleDiaResponse | undefined, state: DayState): string {
    const labels: Record<DayState, string> = {
      presente: 'Presente',
      tardanza: 'Tardanza',
      falta: 'Falta',
      descanso: 'Descanso',
      futuro: 'Sin datos aún',
      empty: ''
    };
    let text = `${this.pad2(day)}/${this.pad2(month)} · ${labels[state]}`;
    if (dia?.horaEntradaAsistencia) {
      const salida = dia.horaSalidaAsistencia ? dia.horaSalidaAsistencia.slice(0, 5) : '—';
      text += ` · ${dia.horaEntradaAsistencia.slice(0, 5)}–${salida}`;
    }
    if (dia && dia.minutosBalance) text += ` · ${this.balanceLabel(dia.minutosBalance)}`;
    return text;
  }

  private balanceLabel(minutes: number): string {
    const sign = minutes > 0 ? '+' : '-';
    const abs = Math.abs(minutes);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    if (h === 0) return `${sign}${m} min`;
    if (m === 0) return `${sign}${h} h`;
    return `${sign}${h} h ${m} min`;
  }

  private pad2(value: number): string {
    return value < 10 ? `0${value}` : String(value);
  }
}
