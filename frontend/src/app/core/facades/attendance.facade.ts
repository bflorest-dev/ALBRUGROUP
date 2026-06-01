import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, filter, map, of, startWith, switchMap, timeout } from 'rxjs';
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
  private autoCheckInTimer: ReturnType<typeof setTimeout> | null = null;
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
  readonly rawStatus = computed<EstadoAsistencia>(
    () => this.attendanceDetail()?.estadoActual ?? 'OFFLINE'
  );
  readonly isWithinSchedule = computed(() => Boolean(this.attendanceDetail()?.dentroHorario));
  readonly isOperational = computed(() => Boolean(this.attendanceDetail()?.operativo));
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
        this.scheduleAutoCheckIn(state.detail);
        return;
      }

      if (state.status === 'error') {
        this.isLoading.set(false);
        this.errorMessage.set(state.message);
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
    return Boolean(detail?.operativo);
  }

  private async syncSalesAdvisorDisponibilidad(status: EstadoAsistencia): Promise<void> {
    if (this.sessionService.getSession()?.primaryRole !== 'ASESOR_VENTAS') {
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
    if (!this.isWithinSchedule()) {
      return [];
    }

    switch (status) {
      case 'OFFLINE':
        return [
          {
            id: 'REGISTRAR_INGRESO',
            targetStatus: 'ONLINE',
            label: 'ONLINE',
            helperText: 'Registrar ingreso'
          }
        ];
      case 'ONLINE':
        return [
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
          },
          {
            id: 'REGISTRAR_SALIDA',
            targetStatus: 'OFFLINE',
            label: 'OFFLINE',
            helperText: 'Registrar salida'
          }
        ];
      case 'ALMUERZO':
        return [
          {
            id: 'FINALIZAR_ALMUERZO',
            targetStatus: 'ONLINE',
            label: 'ONLINE',
            helperText: 'Finalizar almuerzo'
          }
        ];
      case 'SERVICIOS':
        return [
          {
            id: 'FINALIZAR_SERVICIOS',
            targetStatus: 'ONLINE',
            label: 'ONLINE',
            helperText: 'Finalizar servicios'
          }
        ];
      case 'CAPACITACION':
        return [];
    }
  }

  private scheduleAutoCheckIn(detail: DetalleAsistenciaResponse | null): void {
    this.clearAutoCheckInTimer();

    // Condiciones comunes: debe ser OFFLINE sin ingreso registrado y con horario definido
    if (
      !detail ||
      detail.estadoActual !== 'OFFLINE' ||
      detail.fechaHoraIngreso !== null ||
      !detail.entradaProgramada
    ) {
      return;
    }

    // Caso 1: ya está dentro del horario — marcar ONLINE de inmediato
    if (detail.dentroHorario) {
      this.autoCheckInRetried = false;
      const capturedId = this.nextRequestId;
      this.submitAction('REGISTRAR_INGRESO');
      this.autoCheckInRequestId = capturedId;
      return;
    }

    // Caso 2: antes del horario — programar timer para entradaProgramada
    const [h, m, s] = detail.entradaProgramada.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, s ?? 0, 0);
    const ms = target.getTime() - Date.now();

    // Solo si la entrada es en el futuro y dentro de las próximas 4 horas
    if (ms <= 0 || ms > 4 * 60 * 60 * 1000) {
      return;
    }

    this.autoCheckInTimer = setTimeout(() => {
      this.autoCheckInTimer = null;

      // Re-verificar al disparar: el empleado puede haber marcado manualmente
      const current = this.attendanceDetail();
      if (!current || current.estadoActual !== 'OFFLINE' || current.fechaHoraIngreso !== null) {
        return;
      }

      this.autoCheckInRetried = false;
      const capturedId = this.nextRequestId;
      this.submitAction('REGISTRAR_INGRESO');
      this.autoCheckInRequestId = capturedId;
    }, ms);
  }

  private clearAutoCheckInTimer(): void {
    if (this.autoCheckInTimer !== null) {
      clearTimeout(this.autoCheckInTimer);
      this.autoCheckInTimer = null;
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
