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
  | { status: 'success'; requestId: number; detail: DetalleAsistenciaResponse }
  | { status: 'error'; requestId: number; message: string };

@Injectable({
  providedIn: 'root'
})
export class AttendanceFacade {
  private readonly requestTimeoutMs = 15000;
  private readonly attendanceService = inject(AttendanceService);
  private nextRequestId = 1;
  private initialized = false;

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
  readonly currentStatus = computed<EstadoAsistencia>(
    () => this.attendanceDetail()?.estadoActual ?? 'OFFLINE'
  );
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly currentStatusMeta = computed(() => ATTENDANCE_STATUS_META[this.currentStatus()]);
  readonly availableActions = computed<AttendanceActionOption[]>(() =>
    this.resolveAvailableActions(this.currentStatus())
  );

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
        return;
      }

      if (state.status === 'error') {
        this.isLoading.set(false);
        this.errorMessage.set(state.message);
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

  private getErrorMessage(error: HttpErrorResponse, fallbackMessage: string): string {
    const apiError = error.error as ApiErrorResponse | null;

    if (apiError?.details?.length) {
      return `${apiError.message}: ${apiError.details.join(', ')}`;
    }

    return apiError?.message ?? fallbackMessage;
  }
}
