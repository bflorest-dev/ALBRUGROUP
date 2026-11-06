import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { AttendanceService } from '../../../core/services/attendance.service';
import { OperationalGateService } from '../../../core/services/operational-gate.service';
import { RrhhAsistenciaService } from '../../rrhh/asistencia/services/rrhh-asistencia.service';
import { CumplimientoDetalleDiaResponse } from '../../../shared/models/schedule/cumplimiento-response';
import { ReporteDiaResponse } from '../../../shared/models/schedule/reporte-dia-response';
import { CorregirMarcacionesRequest } from '../../../shared/models/schedule/marcacion-editable-response';
import { formatApiErrorMessage } from '../../../shared/utils/api-error.utils';
import { TokenService } from '../../../core/services/token.service';

const REQUEST_TIMEOUT_MS = 20_000;

export interface PersonalAttendanceMetrics {
  presentes: number;
  faltas: number;
  tardanzas: number;
  objetivo: number;
  programadas: number;
  /** Concepto 3: (salida - entrada) - almuerzo. Enfoque laxo. */
  marcacionales: number;
  /** Concepto 4: tiempo productivo en pantalla. Enfoque estricto. */
  operativas: number;
  /** Balance del empleado por marcaciones: marcacionales - programadas (dias transcurridos). */
  balanceMarcacional: number;
  /** Balance del empleado por tiempo productivo: operativas - programadas (dias transcurridos). */
  balanceOperacional: number;
}

@Injectable()
export class PersonalAttendanceFacade {
  private readonly reviewService = inject(RrhhAsistenciaService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly tokenService = inject(TokenService);
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
  readonly editingDay = signal<string | null>(null);
  readonly canEditMarcaciones = computed(() => this.tokenService.hasPermission('CORREGIR_MARCACIONES'));

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
    let objetivo = 0;
    let programadas = 0;
    let marcacionales = 0;
    let operativas = 0;
    let balanceMarcacional = 0;
    let balanceOperacional = 0;

    for (const day of this.days()) {
      // Schedule-service entrega AMBOS enfoques por dia; aqui sumamos los dos, sin decidir contrato.
      const marcacionalDia = Math.max(day.minutosTrabajadosMarcacion ?? 0, 0); // concepto 3
      const operativaDia = Math.max(day.minutosTrabajados ?? 0, 0); // concepto 4
      const programadoDia = Math.max(day.minutosProgramadoDia ?? 0, 0);

      marcacionales += marcacionalDia;
      operativas += operativaDia;

      if (day.laborable) {
        if (day.horaEntradaAsistencia) presentes += 1;
        else if (day.fecha < today) faltas += 1;
        if (day.tardanza) tardanzas += 1;
        objetivo += Math.max(day.minutosObjetivoDia ?? 0, 0);
        programadas += programadoDia;
        // Balance del empleado = cumplido vs PROGRAMADO (su responsabilidad), solo dias ya transcurridos.
        if (day.fecha <= today) {
          balanceMarcacional += Math.min(marcacionalDia - programadoDia, 0);
          balanceOperacional += Math.min(operativaDia - programadoDia, 0);
        }
      }
    }

    return {
      presentes, faltas, tardanzas, objetivo, programadas,
      marcacionales, operativas, balanceMarcacional, balanceOperacional
    };
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
    this.editingDay.set(null);
    this.dayReports.set({});
    this.dayError.set('');
    void this.loadMonth();
  }

  async retry(): Promise<void> {
    await this.loadMonth();
  }

  async refresh(): Promise<void> {
    if (!this.employeeId) return;
    await this.loadMonth();
  }

  async toggleDay(date: string): Promise<void> {
    if (this.expandedDay() === date) {
      this.editingDay.set(null);
      this.expandedDay.set(null);
      this.dayError.set('');
      this.isLoadingDay.set(false);
      return;
    }

    this.expandedDay.set(date);
    this.editingDay.set(null);
    this.dayError.set('');
    const cached = this.dayReports()[date];
    if (cached) return;

    if (!this.employeeId || !this.canDisplayOperationalData()) {
      this.dayError.set(this.blockedMessage());
      return;
    }

    await this.loadDayReport(date);
  }

  async openEditDay(date: string): Promise<void> {
    if (!this.canEditMarcaciones()) {
      this.dayError.set('No tienes permiso para corregir marcaciones.');
      return;
    }
    this.expandedDay.set(date);
    this.editingDay.set(null);
    this.dayError.set('');
    if (!this.dayReports()[date]) await this.loadDayReport(date);
    if (this.dayReports()[date] && this.expandedDay() === date) this.editingDay.set(date);
  }

  cancelEditDay(): void {
    this.editingDay.set(null);
    this.dayError.set('');
  }

  async saveMarcaciones(date: string, request: CorregirMarcacionesRequest): Promise<void> {
    if (!this.employeeId || this.editingDay() !== date) return;
    this.dayError.set('');
    this.isLoadingDay.set(true);
    const employeeId = this.employeeId;
    try {
      const report = await firstValueFrom(
        this.attendanceService.corregirMarcaciones(employeeId, date, request).pipe(timeout(REQUEST_TIMEOUT_MS))
      );
      this.dayReports.update((reports) => ({ ...reports, [date]: report }));
      this.editingDay.set(null);
      this.expandedDay.set(null);
      await this.loadMonth();
    } catch (error) {
      this.dayError.set(formatApiErrorMessage(error as HttpErrorResponse, 'No se pudieron guardar las marcaciones.'));
    } finally {
      this.isLoadingDay.set(false);
    }
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

  private async loadMonth(preserveExpandedDay: string | null = null): Promise<void> {
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
    if (!preserveExpandedDay) {
      this.expandedDay.set(null);
      this.editingDay.set(null);
      this.dayReports.set({});
    }
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
    this.editingDay.set(null);
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
