import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { CumplimientoDetalleDiaResponse } from '../../../../shared/models/schedule/cumplimiento-response';
import { AttendanceDayReportComponent } from '../../../rrhh/asistencia/components/attendance-day-report/attendance-day-report.component';
import { PersonalAttendanceFacade } from '../../facades/personal-attendance.facade';

export type PersonalAttendanceDayState = 'libre' | 'pendiente' | 'futuro' | 'falta' | 'tardanza' | 'presente' | 'extra';

export function personalAttendanceDayState(day: CumplimientoDetalleDiaResponse, today = currentDateValue()): PersonalAttendanceDayState {
  if (!day.laborable) return 'libre';
  if (day.fecha > today) return 'futuro';
  if (!day.horaEntradaAsistencia && day.fecha === today && day.horaEntradaEstablecida) return 'pendiente';
  if (!day.horaEntradaAsistencia) return 'falta';
  if (day.minutosExtra > 0 && !day.horaEntradaEstablecida) return 'extra';
  if (day.tardanza) return 'tardanza';
  return 'presente';
}

export function personalAttendanceBalanceLabel(minutes: number): string {
  const deficit = Math.max(0, Math.abs(Math.min(minutes, 0)));
  if (!deficit) return '0 h';
  const hours = Math.floor(deficit / 60);
  const rest = deficit % 60;
  if (!hours) return `−${rest} min`;
  if (!rest) return `−${hours} h`;
  return `−${hours} h ${rest} min`;
}

export function personalAttendanceDurationLabel(minutes: number): string {
  const value = Math.max(0, minutes);
  if (!value) return '0';
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  if (!hours) return `${rest} min`;
  if (!rest) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

@Component({
  selector: 'app-personal-attendance-panel',
  standalone: true,
  imports: [AttendanceDayReportComponent],
  templateUrl: './personal-attendance-panel.component.html',
  styleUrl: './personal-attendance-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalAttendancePanelComponent {
  readonly employeeId = input(0);
  protected readonly attendance = inject(PersonalAttendanceFacade);

  constructor() {
    effect(() => {
      const employeeId = this.employeeId();
      this.attendance.canDisplayOperationalData();
      if (employeeId) this.attendance.initialize(employeeId);
      else this.attendance.reset();
    });
  }

  protected setMonth(value: string): void {
    this.attendance.setMonth(value);
  }

  protected retry(): void {
    void this.attendance.retry();
  }

  protected toggleDay(date: string): void {
    void this.attendance.toggleDay(date);
  }

  protected retryDay(): void {
    void this.attendance.retryDay();
  }

  protected dayState(day: CumplimientoDetalleDiaResponse): PersonalAttendanceDayState {
    return personalAttendanceDayState(day);
  }

  protected dayStateLabel(day: CumplimientoDetalleDiaResponse): string {
    const labels: Record<PersonalAttendanceDayState, string> = {
      libre: 'Libre',
      pendiente: 'Pendiente',
      futuro: 'Futuro',
      falta: 'Falta',
      tardanza: 'Tardanza',
      presente: 'Presente',
      extra: 'Jornada extra'
    };
    return labels[this.dayState(day)];
  }

  protected dayDate(day: string): string {
    const [year, month, date] = day.split('-').map(Number);
    if (!year || !month || !date) return day;
    const weekday = new Intl.DateTimeFormat('es-PE', { weekday: 'short' }).format(new Date(year, month - 1, date));
    return `${weekday.replace('.', '')} ${String(date).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
  }

  protected monthLabel(month: string): string {
    const [year, monthNumber] = month.split('-').map(Number);
    if (!year || !monthNumber) return month;
    return new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' })
      .format(new Date(year, monthNumber - 1, 1));
  }

  protected monthStatus(month: string): string {
    const current = currentMonthValue();
    if (month < current) return 'Mes cerrado';
    if (month > current) return 'Mes futuro';
    return 'Mes actual';
  }

  protected scheduleLabel(day: CumplimientoDetalleDiaResponse): string {
    if (!day.laborable) return '—';
    return this.range(day.horaEntradaEstablecida, day.horaSalidaEstablecida);
  }

  protected connectionLabel(day: CumplimientoDetalleDiaResponse): string {
    if (!day.horaEntradaAsistencia) return '—';
    const exit = day.horaSalidaAsistencia && !day.salidaForzada ? this.time(day.horaSalidaAsistencia) : '—';
    return `${this.time(day.horaEntradaAsistencia)} – ${exit}`;
  }

  protected lunchLabel(day: CumplimientoDetalleDiaResponse, actual = false): string {
    const start = actual ? day.almuerzoRealInicio : day.inicioAlmuerzoProgramado;
    const end = actual ? day.almuerzoRealFin : day.finAlmuerzoProgramado;
    return start ? this.range(start, end) : '';
  }

  protected balanceLabel(minutes: number): string {
    return personalAttendanceBalanceLabel(minutes);
  }

  protected durationLabel(minutes: number): string {
    return personalAttendanceDurationLabel(minutes);
  }

  protected trackDay(_: number, day: CumplimientoDetalleDiaResponse): string {
    return day.fecha;
  }

  private range(start: string | null, end: string | null): string {
    if (!start) return '—';
    return `${this.time(start)} – ${end ? this.time(end) : '—'}`;
  }

  private time(value: string): string {
    return value.slice(0, 5);
  }
}

function currentDateValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function currentMonthValue(): string {
  return currentDateValue().slice(0, 7);
}
