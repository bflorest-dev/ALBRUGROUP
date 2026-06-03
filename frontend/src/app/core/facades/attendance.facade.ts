import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, filter, firstValueFrom, map, of, startWith, switchMap, timeout } from 'rxjs';
import { ApiErrorResponse } from '../../shared/models/api/api-error-response';
import { DetalleAsistenciaResponse } from '../../shared/models/schedule/detalle-asistencia-response';
import {
  ATTENDANCE_STATUS_META,
  AttendanceActionId,
  AttendanceActionOption,
  EstadoAsistencia
} from '../../shared/models/schedule/estado-asistencia';
import { MovimientoAsistenciaRequest } from '../../shared/models/schedule/movimiento-asistencia-request';
import { AttendanceService } from '../services/attendance.service';
import { DisponibilidadOperativa, PresenceService } from '../services/presence.service';
import { SessionService } from '../services/session.service';

type LoadRequest = {
  requestId: number;
};

type LoadState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'success'; requestId: number; detail: DetalleAsistenciaResponse | null }
  | { status: 'error'; requestId: number; message: string };

type ActionRequest = {
  requestId: number;
  actionId: AttendanceActionId;
};

type ActionState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number; actionId: AttendanceActionId }
  | { status: 'success'; requestId: number; actionId: AttendanceActionId; detail: DetalleAsistenciaResponse }
  | { status: 'error'; requestId: number; message: string };

@Injectable({
  providedIn: 'root'
})
export class AttendanceFacade {
  private readonly requestTimeoutMs = 15000;
  private readonly attendanceService = inject(AttendanceService);
  private readonly presenceService = inject(PresenceService);
  private readonly sessionService = inject(SessionService);
  private nextRequestId = 1;
  private initialized = false;
  private pollTimerId: ReturnType<typeof setInterval> | null = null;
  private autoCheckInArmed = false;
  private autoCheckInRequestId: number | null = null;
  private autoCheckInRetried = false;

  private readonly loadRequest = signal<LoadRequest | null>(null);
  private readonly actionRequest = signal<ActionRequest | null>(null);

  private readonly loadState = toSignal(
    toObservable(this.loadRequest).pipe(
      filter((request): request is LoadRequest => request !== null),
      switchMap((request) =>
        this.attendanceService.getAsistenciaDia().pipe(
          timeout(this.requestTimeoutMs),
          map(
            (detail): LoadState => ({
              status: 'success',
              requestId: request.requestId,
              detail
            })
          ),
          startWith<LoadState>({ status: 'loading', requestId: request.requestId }),
          catchError((error: HttpErrorResponse) => {
            if (error.status === 404) {
              return of<LoadState>({
                status: 'success',
                requestId: request.requestId,
                detail: null
              });
            }

            return of<LoadState>({
              status: 'error',
              requestId: request.requestId,
              message: this.getErrorMessage(error, 'No fue posible cargar el estado de asistencia.')
            });
          })
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  private readonly actionState = toSignal(
    toObservable(this.actionRequest).pipe(
      filter((request): request is ActionRequest => request !== null),
      switchMap((request) =>
        this.executeAction(request.actionId).pipe(
          timeout(this.requestTimeoutMs),
          map(
            (detail): ActionState => ({
              status: 'success',
              requestId: request.requestId,
              actionId: request.actionId,
              detail
            })
          ),
          startWith<ActionState>({
            status: 'loading',
            requestId: request.requestId,
            actionId: request.actionId
          }),
          catchError((error: HttpErrorResponse) =>
            of<ActionState>({
              status: 'error',
              requestId: request.requestId,
              message: this.getErrorMessage(error, 'No fue posible actualizar la asistencia.')
            })
          )
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  readonly attendanceDetail = signal<DetalleAsistenciaResponse | null>(null);
  /**
   * Indica que el asesor esta gestionando un lead. Mientras sea true se conserva la presencia
   * aunque su horario haya terminado (gracia para terminar el lead en gestion antes de cerrar turno).
   */
  private readonly managingLeadActive = signal(false);
  readonly rawStatus = computed<EstadoAsistencia>(
    () => this.attendanceDetail()?.estadoActual ?? 'OFFLINE'
  );
  readonly isWithinSchedule = computed(() => Boolean(this.attendanceDetail()?.dentroHorario));
  readonly isOperational = computed(() => Boolean(this.attendanceDetail()?.operativo));
  /**
   * Jornada abierta (ONLINE) cuya hora de salida programada ya paso. Lo usan las vistas con cierre
   * propio (ej. ASESOR_VENTAS) para saber que el turno termino aunque el empleado siga operativo.
   * Heuristica con reloj local (patron permitido); solo aplica a turnos del mismo dia.
   */
  readonly isPastSalida = computed(() => {
    const detail = this.attendanceDetail();
    if (!detail || detail.jornadaCerrada || detail.estadoActual === 'OFFLINE') {
      return false;
    }
    const salidaMin = this.toMinutes(detail.salidaProgramada);
    const entradaMin = this.toMinutes(detail.entradaProgramada);
    if (salidaMin === null || entradaMin === null || salidaMin <= entradaMin) {
      return false;
    }
    return this.nowMinutes() > salidaMin;
  });
  readonly currentStatus = computed<EstadoAsistencia>(
    () => this.rawStatus() === 'ONLINE' && !this.isOperational() ? 'OFFLINE' : this.rawStatus()
  );
  readonly isLoading = signal(false);
  readonly isInitializing = computed(() => {
    const state = this.loadState();
    return state.status === 'idle' || state.status === 'loading';
  });
  readonly errorMessage = signal('');
  readonly currentStatusMeta = computed(() => ATTENDANCE_STATUS_META[this.currentStatus()]);
  readonly availableActions = computed<AttendanceActionOption[]>(() =>
    this.resolveAvailableActions(this.currentStatus())
  );

  readonly scheduleHint = computed<string>(() => {
    if (this.availableActions().length > 0) return '';
    if (this.currentStatus() === 'CAPACITACION') return '';

    const detail = this.attendanceDetail();
    if (!detail) return '';

    if (detail.jornadaCerrada) return 'Tu jornada de hoy ya está cerrada.';
    if (!detail.idHorario) return 'No tienes turno programado para hoy.';

    const entrada = detail.entradaProgramada?.substring(0, 5) ?? null;
    const salida = detail.salidaProgramada?.substring(0, 5) ?? null;

    if (entrada && salida) {
      const now = new Date();
      const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (nowStr < entrada) return `Tu turno comienza a las ${entrada}.`;
      if (nowStr > salida) return `Tu turno terminó a las ${salida}.`;
    } else if (entrada) {
      return `Tu turno comienza a las ${entrada}.`;
    }

    return 'Estás fuera de tu horario programado.';
  });

  constructor() {
    effect(() => {
      const state = this.loadState();

      if (state.status === 'loading') {
        this.isLoading.set(true);
        this.errorMessage.set('');
        return;
      }

      if (state.status === 'success') {
        this.attendanceDetail.set(state.detail);
        this.isLoading.set(false);
        this.errorMessage.set('');
        void this.syncPresence(state.detail);
        this.evaluateAttendanceAutomation(state.detail);
        return;
      }

      if (state.status === 'error') {
        this.isLoading.set(false);
        this.errorMessage.set(state.message);
        this.clearPollTimer();
      }
    });

    effect(() => {
      const state = this.actionState();

      if (state.status === 'loading') {
        this.isLoading.set(true);
        this.errorMessage.set('');
        return;
      }

      if (state.status === 'success') {
        this.attendanceDetail.set(state.detail);
        this.isLoading.set(false);
        this.errorMessage.set('');
        void this.syncPresence(state.detail);
        return;
      }

      if (state.status === 'error') {
        this.isLoading.set(false);
        this.errorMessage.set(state.message);
      }
    });

    // Auto check-in retry tracking
    effect(() => {
      const state = this.actionState();
      const trackId = this.autoCheckInRequestId;

      if (trackId === null) return;
      if (state.status !== 'success' && state.status !== 'error') return;
      if (state.requestId !== trackId) return;

      if (state.status === 'success') {
        this.autoCheckInRequestId = null;
        this.autoCheckInRetried = false;
        return;
      }

      // Error — retry once after 1 second
      if (!this.autoCheckInRetried) {
        this.autoCheckInRetried = true;
        setTimeout(() => {
          const detail = this.attendanceDetail();
          if (!detail || detail.estadoActual !== 'OFFLINE' || detail.fechaHoraIngreso !== null) {
            this.autoCheckInRequestId = null;
            this.autoCheckInRetried = false;
            return;
          }
          const retryId = this.nextRequestId;
          this.submitAction('REGISTRAR_INGRESO');
          this.autoCheckInRequestId = retryId;
        }, 1000);
      } else {
        // Both attempts failed — give up silently
        this.autoCheckInRequestId = null;
        this.autoCheckInRetried = false;
      }
    });
  }

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.reload();
  }

  reload(): void {
    this.loadRequest.set({ requestId: this.nextRequestId++ });
  }

  submitAction(actionId: AttendanceActionId): void {
    this.actionRequest.set({
      requestId: this.nextRequestId++,
      actionId
    });
  }

  private executeAction(actionId: AttendanceActionId) {
    const payload = this.buildMovementRequest();

    switch (actionId) {
      case 'REGISTRAR_INGRESO':
        return this.attendanceService.registrarIngreso(payload);
      case 'REGISTRAR_SALIDA':
        return this.attendanceService.registrarSalida(payload);
      case 'INICIAR_ALMUERZO':
        return this.attendanceService.iniciarAlmuerzo(payload);
      case 'FINALIZAR_ALMUERZO':
        return this.attendanceService.finalizarAlmuerzo(payload);
      case 'INICIAR_SERVICIOS':
        return this.attendanceService.iniciarServicios(payload);
      case 'FINALIZAR_SERVICIOS':
        return this.attendanceService.finalizarServicios(payload);
    }
  }

  private buildMovementRequest(): MovimientoAsistenciaRequest {
    return {
      fechaHora: this.formatLocalDateTime(new Date())
    };
  }

  private async syncPresence(detail: DetalleAsistenciaResponse | null): Promise<void> {
    if (this.shouldHavePresence(detail)) {
      await this.presenceService.start();
      await this.syncSalesAdvisorDisponibilidad(detail?.estadoActual ?? 'OFFLINE');
      return;
    }

    await this.presenceService.offline();
  }

  private shouldHavePresence(detail: DetalleAsistenciaResponse | null): boolean {
    // Mantener presencia tambien en pausas dentro de horario (almuerzo/servicios/capacitacion):
    // el asesor sigue conectado (disponibilidad OCUPADO) y debe seguir visible en el monitoreo.
    const enPausa =
      detail?.estadoActual === 'ALMUERZO' ||
      detail?.estadoActual === 'SERVICIOS' ||
      detail?.estadoActual === 'CAPACITACION';
    return Boolean(detail?.operativo) || this.managingLeadActive() || enPausa;
  }

  /**
   * El workspace del asesor informa si esta gestionando un lead. Si lo activa estando fuera de
   * horario, se reestablece la presencia para que pueda terminar; al desactivarlo se vuelve a
   * sincronizar (se va OFFLINE si su horario ya termino).
   */
  setManagingLeadActive(active: boolean): void {
    if (this.managingLeadActive() === active) {
      return;
    }
    this.managingLeadActive.set(active);
    void this.syncPresence(this.attendanceDetail());
  }

  private async syncSalesAdvisorDisponibilidad(status: EstadoAsistencia): Promise<void> {
    if (this.sessionService.getSession()?.primaryRole !== 'ASESOR_VENTAS') {
      return;
    }

    // Mientras gestiona un lead, el workspace es la unica autoridad de la disponibilidad
    // (decide GESTIONANDO / SATURADO). No la tocamos aqui para no pisar el GESTIONANDO con
    // DISPONIBLE cuando setManagingLeadActive(true) dispara syncPresence al abrir el lead.
    if (this.managingLeadActive()) {
      return;
    }

    const disponibilidad = this.resolveDisponibilidadFromAttendance(status);
    if (!disponibilidad) {
      return;
    }

    try {
      await this.presenceService.actualizarDisponibilidad(disponibilidad);
    } catch {
      // La presencia puede expirar entre el cambio de asistencia y el PATCH; el proximo heartbeat la recupera.
    }
  }

  private resolveDisponibilidadFromAttendance(status: EstadoAsistencia): DisponibilidadOperativa | null {
    switch (status) {
      case 'ONLINE':
        return 'DISPONIBLE';
      case 'ALMUERZO':
      case 'SERVICIOS':
      case 'CAPACITACION':
        return 'OCUPADO';
      default:
        return null;
    }
  }

  private formatLocalDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  private resolveAvailableActions(status: EstadoAsistencia): AttendanceActionOption[] {
    const dentroHorario = this.isWithinSchedule();

    switch (status) {
      case 'OFFLINE':
        // El ingreso solo se puede registrar dentro del horario (el backend no permite ingresar
        // despues de la hora de salida).
        return dentroHorario
          ? [
              {
                id: 'REGISTRAR_INGRESO',
                targetStatus: 'ONLINE',
                label: 'ONLINE',
                helperText: 'Registrar ingreso'
              }
            ]
          : [];
      case 'ONLINE': {
        const actions: AttendanceActionOption[] = [];
        if (dentroHorario) {
          actions.push(
            {
              id: 'INICIAR_ALMUERZO',
              targetStatus: 'ALMUERZO',
              label: 'ALMUERZO',
              helperText: 'Iniciar almuerzo'
            },
            {
              id: 'INICIAR_SERVICIOS',
              targetStatus: 'SERVICIOS',
              label: 'SERVICIOS',
              helperText: 'Iniciar servicios'
            }
          );
        }
        // OFFLINE siempre disponible mientras la jornada siga abierta, incluso despues de la salida,
        // para que el empleado pueda cerrar su turno cuando termine.
        actions.push({
          id: 'REGISTRAR_SALIDA',
          targetStatus: 'OFFLINE',
          label: 'OFFLINE',
          helperText: 'Registrar salida'
        });
        return actions;
      }
      case 'ALMUERZO':
        return dentroHorario
          ? [
              {
                id: 'FINALIZAR_ALMUERZO',
                targetStatus: 'ONLINE',
                label: 'ONLINE',
                helperText: 'Finalizar almuerzo'
              }
            ]
          : [];
      case 'SERVICIOS':
        return dentroHorario
          ? [
              {
                id: 'FINALIZAR_SERVICIOS',
                targetStatus: 'ONLINE',
                label: 'ONLINE',
                helperText: 'Finalizar servicios'
              }
            ]
          : [];
      case 'CAPACITACION':
        return [];
    }
  }

  /**
   * Marcado automatico SOLO para el caso 1 (el empleado se conecta antes de su hora de entrada):
   * mientras falte para la entrada se "arma" y se sondea el backend; cuando el backend confirma que
   * ya esta dentro de horario, se marca ONLINE una sola vez. Si el empleado se conecta DESPUES de su
   * entrada sin marcar (caso 2A), NO se auto-marca: debe marcar ONLINE manualmente.
   */
  private evaluateAttendanceAutomation(detail: DetalleAsistenciaResponse | null): void {
    this.clearPollTimer();

    if (
      !detail ||
      detail.estadoActual !== 'OFFLINE' ||
      detail.fechaHoraIngreso !== null ||
      !detail.entradaProgramada ||
      detail.jornadaCerrada
    ) {
      this.autoCheckInArmed = false;
      return;
    }

    if (detail.dentroHorario) {
      // Ya dentro de horario y sin ingreso.
      if (this.autoCheckInArmed) {
        // Estabamos esperando que llegara su hora de entrada: marcar ONLINE automaticamente.
        this.autoCheckInArmed = false;
        this.autoCheckInRetried = false;
        const capturedId = this.nextRequestId;
        this.submitAction('REGISTRAR_INGRESO');
        this.autoCheckInRequestId = capturedId;
      }
      // Si no estaba armado, se conecto despues de su entrada: marcado manual, no hacemos nada.
      return;
    }

    // Fuera de horario y sin ingreso: solo automatizar si aun no llega su entrada (nunca tras la salida).
    if ((this.isBeforeEntrada(detail) || this.autoCheckInArmed) && !this.isAfterSalida(detail)) {
      this.autoCheckInArmed = true;
      this.startAttendancePoll();
    } else {
      this.autoCheckInArmed = false;
    }
  }

  private startAttendancePoll(): void {
    if (this.pollTimerId !== null) {
      return;
    }
    // El backend es la autoridad de "ya es tu hora": recargamos hasta que confirme dentroHorario.
    this.pollTimerId = setInterval(() => this.reload(), 60000);
  }

  private clearPollTimer(): void {
    if (this.pollTimerId !== null) {
      clearInterval(this.pollTimerId);
      this.pollTimerId = null;
    }
  }

  private isBeforeEntrada(detail: DetalleAsistenciaResponse): boolean {
    const entradaMin = this.toMinutes(detail.entradaProgramada);
    return entradaMin !== null && this.nowMinutes() < entradaMin;
  }

  private isAfterSalida(detail: DetalleAsistenciaResponse): boolean {
    const salidaMin = this.toMinutes(detail.salidaProgramada);
    const entradaMin = this.toMinutes(detail.entradaProgramada);
    if (salidaMin === null || entradaMin === null || salidaMin <= entradaMin) {
      return false;
    }
    return this.nowMinutes() > salidaMin;
  }

  private toMinutes(time: string | null | undefined): number | null {
    if (!time) {
      return null;
    }
    const [hours, minutes] = time.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }
    return hours * 60 + minutes;
  }

  private nowMinutes(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  /**
   * Cierre best-effort de la jornada antes de un logout por inactividad. Lo usa IdleSessionService
   * cuando el empleado queda inactivo con su turno ya terminado, para que igual quede su marca OFFLINE
   * (el backend la estampa en la salida programada).
   */
  async closeShiftSilently(): Promise<void> {
    try {
      const detail = await firstValueFrom(this.attendanceService.registrarSalida(this.buildMovementRequest()));
      this.attendanceDetail.set(detail);
      void this.syncPresence(detail);
    } catch {
      // Silencioso: es un cierre best-effort previo al logout.
    }
  }

  private getErrorMessage(error: HttpErrorResponse, fallbackMessage: string): string {
    const apiError = error.error as ApiErrorResponse | null;

    if (apiError?.details?.length) {
      return `${apiError.message}: ${apiError.details.join(', ')}`;
    }

    return apiError?.message ?? fallbackMessage;
  }
}
