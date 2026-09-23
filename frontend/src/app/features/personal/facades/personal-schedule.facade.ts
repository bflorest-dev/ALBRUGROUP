import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom, timeout } from 'rxjs';
import { OperationalGateService } from '../../../core/services/operational-gate.service';
import { AdminRrhhService } from '../../admin/services/admin-rrhh.service';
import { ContratoResponse } from '../../../shared/models/rrhh/contrato-response';
import { CorregirHorarioRequest } from '../../../shared/models/schedule/corregir-horario-request';
import { HorarioResponse } from '../../../shared/models/schedule/horario-response';
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
      inicioAlmuerzo: this.requiresLunch() ? detail.inicioAlmuerzo || null : null,
      finAlmuerzo: this.requiresLunch() ? detail.finAlmuerzo || null : null,
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
    const ranges = [...new Set(working.map((detail) => `${detail.horaEntrada.slice(0, 5)}–${detail.horaSalida.slice(0, 5)}`))];
    return ranges.length === 1 ? ranges[0] : ranges.length ? 'Horario variable' : 'Sin horario laborable';
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
