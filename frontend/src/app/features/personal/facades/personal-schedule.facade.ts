import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom, timeout } from 'rxjs';
import { AttendanceService } from '../../../core/services/attendance.service';
import { OperationalGateService } from '../../../core/services/operational-gate.service';
import { ScheduleAdjustmentService } from '../../../core/services/schedule-adjustment.service';
import { AdminRrhhService } from '../../admin/services/admin-rrhh.service';
import { RrhhAsistenciaService } from '../../rrhh/asistencia/services/rrhh-asistencia.service';
import { ContratoResponse } from '../../../shared/models/rrhh/contrato-response';
import { CorregirHorarioRequest } from '../../../shared/models/schedule/corregir-horario-request';
import { DeclararDiaNoLaborableRequest, TipoDiaNoLaborable } from '../../../shared/models/schedule/dia-no-laborable-request';
import { HorarioResponse } from '../../../shared/models/schedule/horario-response';
import { AjusteJornadaRequest, JornadaEfectivaResponse, RazonAjuste, RegistrarAjusteV2Request } from '../../../shared/models/schedule/jornada-efectiva-response';
import { ReporteDiaResponse } from '../../../shared/models/schedule/reporte-dia-response';
import { RegistrarExcepcionHorarioRequest } from '../../../shared/models/schedule/registrar-excepcion-horario-request';
import { RegistrarHorarioRequest } from '../../../shared/models/schedule/registrar-horario-request';
import { ReemplazarHorarioRequest } from '../../../shared/models/schedule/reemplazar-horario-request';
import { formatApiErrorMessage } from '../../../shared/utils/api-error.utils';

const REQUEST_TIMEOUT_MS = 20_000;
const DAYS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
const MODALITIES_WITHOUT_LUNCH = new Set(['PART_TIME', 'SEMI_FULL']);

export type ScheduleHistoryKind = 'actual' | 'futuro' | 'anterior';

export interface PersonalScheduleHistoryItem {
  schedule: HorarioResponse;
  kind: ScheduleHistoryKind;
  label: string;
  range: string;
  validity: string;
  restDay: string;
}

export type CorrectionAction = 'today' | 'tomorrow' | 'today-and-tomorrow' | 'custom';

@Injectable()
export class PersonalScheduleFacade {
  private readonly service = inject(AdminRrhhService);
  private readonly adjustmentService = inject(ScheduleAdjustmentService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly attendanceReviewService = inject(RrhhAsistenciaService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly gate = inject(OperationalGateService).createGate('personal-schedule');

  private employeeId = 0;
  private contract: ContratoResponse | null = null;
  private pendingCorrection: {
    schedule: HorarioResponse;
    request: ReemplazarHorarioRequest;
  } | null = null;

  readonly schedule = signal<HorarioResponse | null>(null);
  readonly history = signal<HorarioResponse[]>([]);
  readonly isLoadingHistory = signal(false);
  readonly historyError = signal('');
  readonly isSaving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly correctionVisible = signal(false);
  readonly correctionReason = signal('Corrección administrativa');
  readonly correctionDate = signal(this.tomorrow());
  readonly isApplyingCorrection = signal(false);
  readonly editorKey = signal(0);

  readonly adjustmentDate = signal(this.today());
  readonly adjustmentJornada = signal<JornadaEfectivaResponse | null>(null);
  readonly adjustmentReport = signal<ReporteDiaResponse | null>(null);
  readonly isLoadingAdjustment = signal(false);
  readonly isSavingAdjustment = signal(false);
  readonly adjustmentError = signal('');
  readonly adjustmentReportError = signal('');
  readonly adjustmentSuccess = signal('');
  readonly monthlyBalanceMinutes = signal<number | null>(null);
  readonly isLoadingMonthlyBalance = signal(false);
  readonly monthlyBalanceError = signal('');
  readonly monthlyDebtMinutes = computed(() => Math.max(0, -(this.monthlyBalanceMinutes() ?? 0)));

  readonly canMutateOperationalData = this.gate.canMutateOperationalData;
  readonly blockedMessage = this.gate.blockedMessage;

  readonly form = this.formBuilder.nonNullable.group({
    fechaInicio: [this.tomorrow(), [Validators.required]],
    compensable: ['true', [Validators.required]],
    horaEntrada: ['09:00', [Validators.required]],
    horaSalida: ['18:00', [Validators.required]],
    inicioAlmuerzo: ['13:00'],
    finAlmuerzo: ['14:00'],
    diaDescanso: ['DOMINGO', [Validators.required]],
    modoAvanzado: ['true', [Validators.required]],
    detalles: this.formBuilder.nonNullable.array(this.buildDefaultRows())
  });

  readonly historyItems = computed<PersonalScheduleHistoryItem[]>(() => {
    const today = this.today();
    return this.history().map((schedule) => {
      const kind: ScheduleHistoryKind = schedule.fechaInicio > today
        ? 'futuro'
        : schedule.fechaFin && schedule.fechaFin < today
          ? 'anterior'
          : 'actual';
      const restDay = schedule.detalles.find((detail) => !detail.laborable)?.dia ?? '—';
      return {
        schedule,
        kind,
        label: kind === 'actual' ? 'Actual' : kind === 'futuro' ? 'Futuro' : 'Anterior',
        range: this.scheduleRange(schedule),
        validity: `${schedule.fechaInicio} — ${schedule.fechaFin ?? 'vigente'}`,
        restDay: this.labelDay(restDay)
      };
    });
  });

  requiresLunch(): boolean {
    return !MODALITIES_WITHOUT_LUNCH.has(this.contract?.modalidad ?? 'FULL_TIME');
  }

  initialize(employeeId: number, contract: ContratoResponse | null, schedule: HorarioResponse | null): void {
    this.employeeId = employeeId;
    this.contract = contract;
    this.schedule.set(schedule);
    this.clearMessages();
    this.closeCorrection();
    this.resetAdjustmentState();
    void this.loadMonthlyBalance(employeeId);
    this.resetForm(schedule);
    void this.loadHistory(employeeId);
  }

  reset(): void {
    this.employeeId = 0;
    this.contract = null;
    this.schedule.set(null);
    this.history.set([]);
    this.historyError.set('');
    this.resetForm(null);
    this.clearMessages();
    this.closeCorrection();
    this.resetAdjustmentState();
    this.monthlyBalanceMinutes.set(null);
    this.monthlyBalanceError.set('');
  }

  openEditor(schedule: HorarioResponse | null = this.schedule()): void {
    this.resetForm(schedule);
    this.clearMessages();
    this.closeCorrection();
  }

  closeEditor(): void {
    this.clearMessages();
    this.closeCorrection();
    this.resetForm(this.schedule());
  }

  setCorrectionReason(value: string): void {
    this.correctionReason.set(value);
  }

  setCorrectionDate(value: string): void {
    this.correctionDate.set(value);
  }

  cancelCorrection(): void {
    this.closeCorrection();
    this.error.set('');
  }

  async loadHistory(employeeId = this.employeeId): Promise<void> {
    if (!employeeId) return;
    this.isLoadingHistory.set(true);
    this.historyError.set('');
    try {
      const page = await firstValueFrom(
        this.service.listarHistoricoHorarios(employeeId).pipe(timeout(REQUEST_TIMEOUT_MS))
      );
      this.history.set(page.content ?? []);
    } catch (error) {
      this.history.set([]);
      this.historyError.set(formatApiErrorMessage(error as HttpErrorResponse, 'No se pudo cargar el historial de horarios.'));
    } finally {
      this.isLoadingHistory.set(false);
    }
  }

  async save(): Promise<boolean> {
    if (!this.canMutateOperationalData()) {
      this.error.set(this.blockedMessage());
      return false;
    }

    if (!this.employeeId || !this.contract) return false;
    this.form.updateValueAndValidity({ emitEvent: false });
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Completa los datos del horario antes de guardar.');
      return false;
    }

    const raw = this.form.getRawValue();
    const fechaInicio = raw.fechaInicio;
    const current = this.schedule();
    if (current && fechaInicio < current.fechaInicio) {
      this.error.set('La nueva fecha de inicio no puede ser anterior al horario actual.');
      return false;
    }

    this.isSaving.set(true);
    this.clearMessages();
    try {
      const request = this.buildRequest(this.contract.modalidad);
      if (!current) {
        const created = await firstValueFrom(
          this.service.registrarHorario({
            idEmpleado: this.employeeId,
            idContrato: this.contract.id,
            fechaInicio,
            ...request
          } satisfies RegistrarHorarioRequest).pipe(timeout(REQUEST_TIMEOUT_MS))
        );
        await this.finishMutation(created, 'Horario registrado correctamente.');
        return true;
      }

      const scheduleAtDate = await firstValueFrom(
        this.service.getHorarioVigente(this.employeeId, fechaInicio).pipe(timeout(REQUEST_TIMEOUT_MS))
      );
      if (scheduleAtDate.fechaInicio === fechaInicio) {
        await this.correct(scheduleAtDate, request);
      } else {
        const replaced = await firstValueFrom(
          this.service.reemplazarHorario(scheduleAtDate.id, {
            fechaInicio,
            ...request
          } satisfies ReemplazarHorarioRequest).pipe(timeout(REQUEST_TIMEOUT_MS))
        );
        await this.finishMutation(replaced, 'Horario actualizado. La nueva vigencia iniciará en la fecha seleccionada.');
      }
      return !this.correctionVisible();
    } catch (error) {
      this.error.set(formatApiErrorMessage(error as HttpErrorResponse, 'No se pudo guardar el horario.'));
      return false;
    } finally {
      this.isSaving.set(false);
    }
  }

  async applyCorrection(action: CorrectionAction): Promise<boolean> {
    if (!this.canMutateOperationalData() || !this.pendingCorrection || !this.employeeId || !this.contract) {
      return false;
    }

    const customDate = this.correctionDate();
    if (action === 'custom' && (!customDate || customDate <= this.today())) {
      this.error.set('La fecha debe ser posterior a hoy.');
      return false;
    }

    this.isApplyingCorrection.set(true);
    this.clearMessages();
    try {
      const { schedule, request } = this.pendingCorrection;
      if (action === 'today' || action === 'today-and-tomorrow') {
        await firstValueFrom(
          this.service.registrarExcepcionHorario(schedule.id, this.buildTodayException()).pipe(timeout(REQUEST_TIMEOUT_MS))
        );
      }

      if (action === 'tomorrow' || action === 'today-and-tomorrow' || action === 'custom') {
        const fechaInicio = action === 'custom' ? customDate : this.tomorrow();
        await firstValueFrom(
          this.service.reemplazarHorario(schedule.id, { ...request, fechaInicio }).pipe(timeout(REQUEST_TIMEOUT_MS))
        );
      }

      const refreshed = await firstValueFrom(
        this.service.getHorarioVigente(this.employeeId, this.today()).pipe(timeout(REQUEST_TIMEOUT_MS))
      );
      await this.finishMutation(refreshed, 'La corrección del horario fue aplicada correctamente.');
      this.closeCorrection();
      return true;
    } catch (error) {
      this.error.set(formatApiErrorMessage(error as HttpErrorResponse, 'No se pudo aplicar la corrección del horario.'));
      return false;
    } finally {
      this.isApplyingCorrection.set(false);
    }
  }

  async loadDayAdjustment(employeeId = this.employeeId, fecha = this.adjustmentDate()): Promise<void> {
    if (!employeeId || !fecha) return;
    this.adjustmentDate.set(fecha);
    this.isLoadingAdjustment.set(true);
    this.adjustmentError.set('');
    this.adjustmentReportError.set('');
    const [jornada, reporte] = await Promise.allSettled([
      firstValueFrom(this.adjustmentService.getJornada(employeeId, fecha).pipe(timeout(REQUEST_TIMEOUT_MS))),
      firstValueFrom(this.attendanceService.getReporteDia(employeeId, fecha).pipe(timeout(REQUEST_TIMEOUT_MS)))
    ]);

    if (jornada.status === 'fulfilled') {
      this.adjustmentJornada.set(jornada.value);
    } else {
      this.adjustmentJornada.set(null);
      this.adjustmentError.set(formatApiErrorMessage(jornada.reason as HttpErrorResponse, 'No fue posible cargar el horario de ese día.'));
    }
    if (reporte.status === 'fulfilled') {
      this.adjustmentReport.set(reporte.value);
    } else {
      this.adjustmentReport.set(null);
      this.adjustmentReportError.set(formatApiErrorMessage(reporte.reason as HttpErrorResponse, 'No fue posible cargar el detalle operativo de ese día.'));
    }
    this.isLoadingAdjustment.set(false);
  }

  private async loadMonthlyBalance(employeeId: number): Promise<void> {
    if (!employeeId) return;
    this.isLoadingMonthlyBalance.set(true);
    this.monthlyBalanceMinutes.set(null);
    this.monthlyBalanceError.set('');
    const { desde, hasta } = this.currentMonthRange();
    try {
      const detail = await firstValueFrom(
        this.attendanceReviewService
          .getCumplimientoDetalle({ empleadoIds: [employeeId], desde, hasta })
          .pipe(timeout(REQUEST_TIMEOUT_MS))
      );
      const days = detail.empleados.find((item) => item.idEmpleado === employeeId)?.dias ?? [];
      this.monthlyBalanceMinutes.set(days.reduce((total, day) => total + (day.minutosBalance ?? 0), 0));
    } catch (error) {
      this.monthlyBalanceMinutes.set(null);
      this.monthlyBalanceError.set(formatApiErrorMessage(error as HttpErrorResponse, 'No fue posible consultar el saldo del mes.'));
    } finally {
      this.isLoadingMonthlyBalance.set(false);
    }
  }

  async submitDayExtension(requests: AjusteJornadaRequest[], razon: RazonAjuste): Promise<boolean> {
    if (!this.canMutateOperationalData() || !this.employeeId || !requests.length) return false;
    this.startAdjustmentSave();
    let saved = 0;
    try {
      for (const request of requests) {
        await firstValueFrom(this.adjustmentService.registrarV2(this.employeeId, { ...request, razon }).pipe(timeout(REQUEST_TIMEOUT_MS)));
        saved += 1;
      }
      this.adjustmentSuccess.set(razon === 'COMPENSACION' ? 'Compensación registrada.' : 'Horas extra registradas.');
      await this.finishAdjustmentMutation();
      return true;
    } catch (error) {
      const partial = saved ? ` (${saved} de ${requests.length} guardados)` : '';
      this.adjustmentError.set(formatApiErrorMessage(error as HttpErrorResponse, 'No se pudo guardar el ajuste.') + partial);
      await this.loadDayAdjustment();
      return false;
    } finally {
      this.isSavingAdjustment.set(false);
    }
  }

  async submitCorrimiento(request: RegistrarAjusteV2Request): Promise<boolean> {
    return this.submitSingleAdjustment(request, 'Horario corrido.');
  }

  async submitJornadaExtraordinaria(fecha: string, inicio: string, fin: string, motivo: string, razon: RazonAjuste): Promise<boolean> {
    return this.submitSingleAdjustment({
      inicio: `${fecha}T${inicio}:00`,
      fin: `${fecha}T${fin}:00`,
      motivo,
      razon
    }, razon === 'COMPENSACION' ? 'Compensación registrada.' : 'Jornada habilitada.');
  }

  async submitLunchAdjustment(inicio: string | null, fin: string | null): Promise<boolean> {
    if (!this.canMutateOperationalData() || !this.employeeId) return false;
    this.startAdjustmentSave();
    try {
      await firstValueFrom(this.adjustmentService.ajustarAlmuerzo(this.employeeId, inicio, fin, this.adjustmentDate()).pipe(timeout(REQUEST_TIMEOUT_MS)));
      this.adjustmentSuccess.set(inicio ? 'Almuerzo del día actualizado.' : 'Almuerzo del día quitado.');
      await this.finishAdjustmentMutation();
      return true;
    } catch (error) {
      this.adjustmentError.set(formatApiErrorMessage(error as HttpErrorResponse, 'No se pudo ajustar el almuerzo.'));
      return false;
    } finally {
      this.isSavingAdjustment.set(false);
    }
  }

  async submitDiaLibre(fecha: string, tipo: TipoDiaNoLaborable, motivo: string, global: boolean): Promise<boolean> {
    if (!this.canMutateOperationalData() || !this.employeeId) return false;
    this.startAdjustmentSave();
    const request: DeclararDiaNoLaborableRequest = {
      fecha,
      tipo,
      motivo,
      laborable: false,
      empleadoIds: global ? undefined : [this.employeeId]
    };
    try {
      await firstValueFrom(this.adjustmentService.declararDiaNoLaborable(request).pipe(timeout(REQUEST_TIMEOUT_MS)));
      this.adjustmentSuccess.set(global ? 'Día libre declarado para todos.' : 'Día libre declarado para este empleado.');
      await this.finishAdjustmentMutation();
      return true;
    } catch (error) {
      this.adjustmentError.set(formatApiErrorMessage(error as HttpErrorResponse, 'No se pudo declarar el día libre.'));
      return false;
    } finally {
      this.isSavingAdjustment.set(false);
    }
  }

  private async correct(schedule: HorarioResponse, request: CorregirHorarioRequest): Promise<void> {
    try {
      const corrected = await firstValueFrom(
        this.service.corregirHorario(schedule.id, request).pipe(timeout(REQUEST_TIMEOUT_MS))
      );
      await this.finishMutation(corrected, 'Horario corregido. Los cambios aplican desde la vigencia actual.');
    } catch (error) {
      if ((error as HttpErrorResponse)?.status === 409) {
        this.pendingCorrection = { schedule, request: { ...request, fechaInicio: schedule.fechaInicio } };
        this.correctionReason.set('Corrección administrativa');
        this.correctionDate.set(this.tomorrow());
        this.correctionVisible.set(true);
        return;
      }
      throw error;
    }
  }

  private async submitSingleAdjustment(request: RegistrarAjusteV2Request, success: string): Promise<boolean> {
    if (!this.canMutateOperationalData() || !this.employeeId) return false;
    this.startAdjustmentSave();
    try {
      await firstValueFrom(this.adjustmentService.registrarV2(this.employeeId, request).pipe(timeout(REQUEST_TIMEOUT_MS)));
      this.adjustmentSuccess.set(success);
      await this.finishAdjustmentMutation();
      return true;
    } catch (error) {
      this.adjustmentError.set(formatApiErrorMessage(error as HttpErrorResponse, 'No se pudo guardar el ajuste.'));
      return false;
    } finally {
      this.isSavingAdjustment.set(false);
    }
  }

  private async finishAdjustmentMutation(): Promise<void> {
    if (!this.employeeId) return;
    try {
      this.schedule.set(await firstValueFrom(this.service.getHorarioVigente(this.employeeId).pipe(timeout(REQUEST_TIMEOUT_MS))));
      await this.loadHistory(this.employeeId);
    } finally {
      await this.loadDayAdjustment();
    }
  }

  private startAdjustmentSave(): void {
    this.isSavingAdjustment.set(true);
    this.adjustmentError.set('');
    this.adjustmentSuccess.set('');
  }

  private resetAdjustmentState(): void {
    this.adjustmentDate.set(this.today());
    this.adjustmentJornada.set(null);
    this.adjustmentReport.set(null);
    this.isLoadingAdjustment.set(false);
    this.isSavingAdjustment.set(false);
    this.adjustmentError.set('');
    this.adjustmentReportError.set('');
    this.adjustmentSuccess.set('');
  }

  private currentMonthRange(): { desde: string; hasta: string } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const pad = (value: number) => String(value).padStart(2, '0');
    return {
      desde: `${year}-${pad(month + 1)}-01`,
      hasta: `${year}-${pad(month + 1)}-${pad(new Date(year, month + 1, 0).getDate())}`
    };
  }

  private async finishMutation(schedule: HorarioResponse, message: string): Promise<void> {
    this.schedule.set(schedule);
    this.success.set(message);
    this.error.set('');
    await this.loadHistory(this.employeeId);
  }

  private buildRequest(modalidad: string): {
    modalidad: string;
    compensable: boolean;
    detalles: Array<{
      dia: string;
      horaEntrada: string;
      horaSalida: string;
      inicioAlmuerzo: string | null;
      finAlmuerzo: string | null;
      laborable: boolean;
    }>;
  } {
    const raw = this.form.getRawValue();
    return {
      modalidad,
      compensable: raw.compensable === 'true',
      detalles: raw.detalles.map((detail) => ({
        dia: detail.dia,
        horaEntrada: detail.horaEntrada,
        horaSalida: detail.horaSalida,
        inicioAlmuerzo: detail.inicioAlmuerzo || null,
        finAlmuerzo: detail.finAlmuerzo || null,
        laborable: detail.laborable === 'true'
      }))
    };
  }

  private buildTodayException(): RegistrarExcepcionHorarioRequest {
    const raw = this.form.getRawValue();
    const detail = raw.detalles.find((item) => item.laborable) ?? raw.detalles[0];
    return {
      fecha: this.today(),
      tipo: 'CAMBIO_COMPLETO',
      horaEntrada: detail.horaEntrada,
      horaSalida: detail.horaSalida,
      inicioAlmuerzo: detail.inicioAlmuerzo || null,
      finAlmuerzo: detail.finAlmuerzo || null,
      laborable: true,
      motivo: this.correctionReason().trim() || 'Corrección administrativa'
    };
  }

  private resetForm(schedule: HorarioResponse | null): void {
    this.editorKey.update((value) => value + 1);
    const details = schedule?.detalles ?? [];
    const firstWorking = details.find((detail) => detail.laborable) ?? details[0];
    const restDay = details.find((detail) => !detail.laborable)?.dia ?? 'DOMINGO';
    this.form.reset({
      fechaInicio: this.tomorrow(),
      compensable: String(schedule?.compensable ?? true),
      horaEntrada: firstWorking?.horaEntrada?.slice(0, 5) ?? '09:00',
      horaSalida: firstWorking?.horaSalida?.slice(0, 5) ?? '18:00',
      inicioAlmuerzo: firstWorking?.inicioAlmuerzo?.slice(0, 5) ?? '13:00',
      finAlmuerzo: firstWorking?.finAlmuerzo?.slice(0, 5) ?? '14:00',
      diaDescanso: restDay,
      modoAvanzado: 'true',
      detalles: DAYS.map((dia) => {
        const detail = details.find((item) => item.dia === dia);
        return {
          dia,
          horaEntrada: detail?.horaEntrada?.slice(0, 5) ?? '09:00',
          horaSalida: detail?.horaSalida?.slice(0, 5) ?? '18:00',
          inicioAlmuerzo: detail?.inicioAlmuerzo?.slice(0, 5) ?? '',
          finAlmuerzo: detail?.finAlmuerzo?.slice(0, 5) ?? '',
          laborable: detail?.laborable === false ? 'false' : 'true'
        };
      })
    });
  }

  private buildDefaultRows() {
    return DAYS.map((dia) =>
      this.formBuilder.nonNullable.group({
        dia: [dia, [Validators.required]],
        horaEntrada: ['09:00', [Validators.required]],
        horaSalida: ['18:00', [Validators.required]],
        inicioAlmuerzo: ['13:00'],
        finAlmuerzo: ['14:00'],
        laborable: [dia === 'DOMINGO' ? 'false' : 'true', [Validators.required]]
      })
    );
  }

  private closeCorrection(): void {
    this.correctionVisible.set(false);
    this.pendingCorrection = null;
    this.isApplyingCorrection.set(false);
  }

  private clearMessages(): void {
    this.error.set('');
    this.success.set('');
  }

  private scheduleRange(schedule: HorarioResponse): string {
    const working = schedule.detalles.filter((detail) => detail.laborable);
    if (!working.length) return 'Sin horario laborable';
    const entries = working.map((detail) => `${this.shortDay(detail.dia)} ${detail.horaEntrada.slice(0, 5)}–${detail.horaSalida.slice(0, 5)}`);
    const ranges = [...new Set(working.map((detail) => `${detail.horaEntrada.slice(0, 5)}–${detail.horaSalida.slice(0, 5)}`))];
    if (ranges.length === 1) return ranges[0];
    const visible = entries.slice(0, 3);
    const remaining = entries.length - visible.length;
    return `${visible.join(' · ')}${remaining > 0 ? ` · +${remaining} días` : ''}`;
  }

  private shortDay(day: string): string {
    return ({
      LUNES: 'Lun',
      MARTES: 'Mar',
      MIERCOLES: 'Mié',
      JUEVES: 'Jue',
      VIERNES: 'Vie',
      SABADO: 'Sáb',
      DOMINGO: 'Dom'
    } as Record<string, string>)[day] ?? day;
  }

  private labelDay(day: string): string {
    return day.charAt(0) + day.slice(1).toLowerCase();
  }

  private today(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private tomorrow(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
