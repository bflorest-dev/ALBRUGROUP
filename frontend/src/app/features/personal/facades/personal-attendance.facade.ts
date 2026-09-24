import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { AttendanceService } from '../../../core/services/attendance.service';
import { OperationalGateService } from '../../../core/services/operational-gate.service';
import { RrhhAsistenciaService } from '../../rrhh/asistencia/services/rrhh-asistencia.service';
import { CumplimientoDetalleDiaResponse } from '../../../shared/models/schedule/cumplimiento-response';
import { ReporteDiaResponse } from '../../../shared/models/schedule/reporte-dia-response';
import { formatApiErrorMessage } from '../../../shared/utils/api-error.utils';

const REQUEST_TIMEOUT_MS = 20_000;

export interface PersonalAttendanceMetrics {
  presentes: number;
  faltas: number;
  tardanzas: number;
  balance: number;
  extra: number;
  compensado: number;
}

@Injectable()
export class PersonalAttendanceFacade {
  private readonly reviewService = inject(RrhhAsistenciaService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly gate = inject(OperationalGateService).createGate('personal-attendance');

  private employeeId = 0;
  private loadSequence = 0;

  readonly selectedMonth = signal(this.currentMonthValue());
  readonly days = signal<CumplimientoDetalleDiaResponse[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal('');
  readonly expandedDay = signal<string | null>(null);
  readonly dayReports = signal<Record<string, ReporteDiaResponse>>({});
  readonly isLoadingDay = signal(false);
  readonly dayError = signal('');

  readonly canDisplayOperationalData = this.gate.canDisplayOperationalData;
  readonly blockedMessage = this.gate.blockedMessage;

  readonly dayReport = computed(() => {
    const date = this.expandedDay();
    return date ? this.dayReports()[date] ?? null : null;
  });

  readonly metrics = computed<PersonalAttendanceMetrics>(() => {
    const today = this.todayValue();
    let presentes = 0;
    let faltas = 0;
    let tardanzas = 0;
    let balance = 0;
    let extra = 0;
    let compensado = 0;

    for (const day of this.days()) {
      if (day.laborable) {
        if (day.horaEntradaAsistencia) presentes += 1;
        else if (day.fecha < today) faltas += 1;
      }
      if (day.laborable && day.tardanza) tardanzas += 1;
      balance += Math.min(day.minutosBalance ?? 0, 0);
      extra += Math.max(day.minutosExtra ?? 0, 0);
      compensado += Math.max(day.minutosCompensados ?? 0, 0);
    }

    return { presentes, faltas, tardanzas, balance, extra, compensado };
  });

  async initialize(employeeId: number): Promise<void> {
    if (employeeId === this.employeeId && this.days().length) return;
    this.employeeId = employeeId;
    this.selectedMonth.set(this.currentMonthValue());
    this.resetViewState();
    if (!employeeId) return;
    await this.loadMonth();
  }

  reset(): void {
    this.employeeId = 0;
    this.selectedMonth.set(this.currentMonthValue());
    this.resetViewState();
  }

  setMonth(month: string): void {
    if (!/^\d{4}-\d{2}$/.test(month) || month === this.selectedMonth()) return;
    this.selectedMonth.set(month);
    this.expandedDay.set(null);
    this.dayReports.set({});
    this.dayError.set('');
    void this.loadMonth();
  }

  async retry(): Promise<void> {
    await this.loadMonth();
  }

  async toggleDay(date: string): Promise<void> {
    if (this.expandedDay() === date) {
      this.expandedDay.set(null);
      this.dayError.set('');
      this.isLoadingDay.set(false);
      return;
    }

    this.expandedDay.set(date);
    this.dayError.set('');
    const cached = this.dayReports()[date];
    if (cached) return;

    if (!this.employeeId || !this.canDisplayOperationalData()) {
      this.dayError.set(this.blockedMessage());
      return;
    }

    await this.loadDayReport(date);
  }

  async retryDay(): Promise<void> {
    const date = this.expandedDay();
    if (!date) return;
    this.dayReports.update((reports) => {
      const next = { ...reports };
      delete next[date];
      return next;
    });
    this.dayError.set('');
    if (!this.employeeId || !this.canDisplayOperationalData()) {
      this.dayError.set(this.blockedMessage());
      return;
    }
    await this.loadDayReport(date);
  }

  private async loadDayReport(date: string): Promise<void> {
    this.isLoadingDay.set(true);
    const requestedEmployee = this.employeeId;
    try {
      const report = await firstValueFrom(
        this.attendanceService.getReporteDia(requestedEmployee, date).pipe(timeout(REQUEST_TIMEOUT_MS))
      );
      if (this.employeeId === requestedEmployee && this.expandedDay() === date) {
        this.dayReports.update((reports) => ({ ...reports, [date]: report }));
      }
    } catch (error) {
      if (this.employeeId === requestedEmployee && this.expandedDay() === date) {
        this.dayError.set(formatApiErrorMessage(error as HttpErrorResponse, 'No se pudo cargar el detalle de este día.'));
      }
    } finally {
      if (this.employeeId === requestedEmployee && this.expandedDay() === date) {
        this.isLoadingDay.set(false);
      }
    }
  }

  private async loadMonth(): Promise<void> {
    const employeeId = this.employeeId;
    if (!employeeId) return;

    if (!this.canDisplayOperationalData()) {
      this.days.set([]);
      this.error.set(this.blockedMessage());
      return;
    }

    const sequence = ++this.loadSequence;
    this.isLoading.set(true);
    this.error.set('');
    this.days.set([]);
    this.expandedDay.set(null);
    this.dayReports.set({});
    this.dayError.set('');

    try {
      const range = this.resolveMonthRange(this.selectedMonth());
      const response = await firstValueFrom(
        this.reviewService
          .getCumplimientoDetalle({ empleadoIds: [employeeId], desde: range.desde, hasta: range.hasta })
          .pipe(timeout(REQUEST_TIMEOUT_MS))
      );
      if (sequence === this.loadSequence && employeeId === this.employeeId) {
        this.days.set(response.empleados.find((item) => item.idEmpleado === employeeId)?.dias ?? []);
      }
    } catch (error) {
      if (sequence === this.loadSequence && employeeId === this.employeeId) {
        this.error.set(formatApiErrorMessage(error as HttpErrorResponse, 'No se pudo cargar la asistencia del mes.'));
      }
    } finally {
      if (sequence === this.loadSequence && employeeId === this.employeeId) {
        this.isLoading.set(false);
      }
    }
  }

  private resetViewState(): void {
    this.loadSequence += 1;
    this.days.set([]);
    this.isLoading.set(false);
    this.error.set('');
    this.expandedDay.set(null);
    this.dayReports.set({});
    this.isLoadingDay.set(false);
    this.dayError.set('');
  }

  private resolveMonthRange(month: string): { desde: string; hasta: string } {
    const [year, monthNumber] = month.split('-').map(Number);
    const lastDay = new Date(year, monthNumber, 0).getDate();
    return {
      desde: `${month}-01`,
      hasta: `${month}-${String(lastDay).padStart(2, '0')}`
    };
  }

  private currentMonthValue(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private todayValue(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}
