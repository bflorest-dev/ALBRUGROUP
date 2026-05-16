import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { catchError, filter, map, of, startWith, switchMap, timeout } from 'rxjs';
import { ApiErrorResponse } from '../../../shared/models/api/api-error-response';
import { PageResponse } from '../../../shared/models/common/page-response';
import { ActualizarDetalleGrupoCapacitacionRequest } from '../../../shared/models/recruitment/actualizar-detalle-grupo-capacitacion-request';
import { GrupoCapacitacionDetalleResponse } from '../../../shared/models/recruitment/grupo-capacitacion-detalle-response';
import { GrupoCapacitacionRequest } from '../../../shared/models/recruitment/grupo-capacitacion-request';
import { GrupoCapacitacionResponse } from '../../../shared/models/recruitment/grupo-capacitacion-response';
import { EmpleadoRolResponse } from '../../../shared/models/rrhh/empleado-rol-response';
import { RecruiterTrainingGroupsService } from '../services/recruiter-training-groups.service';

type GroupListRequest = {
  requestId: number;
  pageNumber: number;
  estado: string | null;
  silent: boolean;
};

type GroupListState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'refreshing'; requestId: number }
  | { status: 'success'; requestId: number; page: PageResponse<GrupoCapacitacionResponse> }
  | { status: 'error'; requestId: number; message: string };

type CreateGroupRequest = {
  requestId: number;
  payload: GrupoCapacitacionRequest;
};

type CreateGroupState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'success'; requestId: number; group: GrupoCapacitacionResponse }
  | { status: 'error'; requestId: number; message: string };

type DetailRequest = {
  requestId: number;
  idGrupoCapacitacion: number;
};

type DetailState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number; idGrupoCapacitacion: number }
  | { status: 'success'; requestId: number; group: GrupoCapacitacionResponse }
  | { status: 'error'; requestId: number; idGrupoCapacitacion: number; message: string };

type UpdateDetailRequest = {
  requestId: number;
  idGrupoCapacitacion: number;
  idPostulacion: number;
  payload: ActualizarDetalleGrupoCapacitacionRequest;
};

type UpdateDetailState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'success'; requestId: number; detail: GrupoCapacitacionDetalleResponse }
  | { status: 'error'; requestId: number; message: string };

@Injectable()
export class RecruiterTrainingGroupsFacade {
  private readonly requestTimeoutMs = 15000;
  private readonly formBuilder = inject(FormBuilder);
  private readonly trainingGroupsService = inject(RecruiterTrainingGroupsService);
  private nextRequestId = 1;
  private handledCreateRequestId = 0;
  private handledUpdateDetailRequestId = 0;

  private readonly groupListRequest = signal<GroupListRequest | null>(null);
  private readonly createGroupRequest = signal<CreateGroupRequest | null>(null);
  private readonly detailRequest = signal<DetailRequest | null>(null);
  private readonly updateDetailRequest = signal<UpdateDetailRequest | null>(null);

  private readonly groupListState = toSignal(
    toObservable(this.groupListRequest).pipe(
      filter((request): request is GroupListRequest => request !== null),
      switchMap((request) =>
        this.trainingGroupsService.listarGrupos(request.estado, request.pageNumber).pipe(
          timeout(this.requestTimeoutMs),
          map(
            (page): GroupListState => ({
              status: 'success',
              requestId: request.requestId,
              page
            })
          ),
          startWith<GroupListState>({
            status: request.silent ? 'refreshing' : 'loading',
            requestId: request.requestId
          }),
          catchError((error: HttpErrorResponse) =>
            of<GroupListState>({
              status: 'error',
              requestId: request.requestId,
              message: this.getErrorMessage(error, 'No fue posible cargar grupos de capacitacion.')
            })
          )
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  private readonly createGroupState = toSignal(
    toObservable(this.createGroupRequest).pipe(
      filter((request): request is CreateGroupRequest => request !== null),
      switchMap((request) =>
        this.trainingGroupsService.crearGrupo(request.payload).pipe(
          timeout(this.requestTimeoutMs),
          map(
            (group): CreateGroupState => ({
              status: 'success',
              requestId: request.requestId,
              group
            })
          ),
          startWith<CreateGroupState>({ status: 'loading', requestId: request.requestId }),
          catchError((error: HttpErrorResponse) =>
            of<CreateGroupState>({
              status: 'error',
              requestId: request.requestId,
              message: this.getErrorMessage(error, 'No se pudo crear el grupo de capacitacion.')
            })
          )
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  private readonly detailState = toSignal(
    toObservable(this.detailRequest).pipe(
      filter((request): request is DetailRequest => request !== null),
      switchMap((request) =>
        this.trainingGroupsService.obtenerGrupo(request.idGrupoCapacitacion).pipe(
          timeout(this.requestTimeoutMs),
          map(
            (group): DetailState => ({
              status: 'success',
              requestId: request.requestId,
              group
            })
          ),
          startWith<DetailState>({
            status: 'loading',
            requestId: request.requestId,
            idGrupoCapacitacion: request.idGrupoCapacitacion
          }),
          catchError((error: HttpErrorResponse) =>
            of<DetailState>({
              status: 'error',
              requestId: request.requestId,
              idGrupoCapacitacion: request.idGrupoCapacitacion,
              message: this.getErrorMessage(error, 'No se pudo obtener el detalle del grupo.')
            })
          )
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  private readonly updateDetailState = toSignal(
    toObservable(this.updateDetailRequest).pipe(
      filter((request): request is UpdateDetailRequest => request !== null),
      switchMap((request) =>
        this.trainingGroupsService
          .actualizarDetalleGrupo(request.idGrupoCapacitacion, request.idPostulacion, request.payload)
          .pipe(
            timeout(this.requestTimeoutMs),
            map(
              (detail): UpdateDetailState => ({
                status: 'success',
                requestId: request.requestId,
                detail
              })
            ),
            startWith<UpdateDetailState>({ status: 'loading', requestId: request.requestId }),
            catchError((error: HttpErrorResponse) =>
              of<UpdateDetailState>({
                status: 'error',
                requestId: request.requestId,
                message: this.getErrorMessage(
                  error,
                  'No se pudo actualizar el seguimiento del postulante.'
                )
              })
            )
          )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  readonly estadoOptions = ['ABIERTO', 'EN_CURSO', 'CERRADO', 'ANULADO'];
  readonly turnoOptions = ['MORNING', 'AFTERNOON'];
  readonly salaOptions = ['SALA_FIBRA', 'SALA_CLARO'];
  readonly estadoCapacitacionOptions = [
    'ASIGNADO',
    'EN_CAPACITACION',
    'APROBADO',
    'DESAPROBADO',
    'RETIRADO'
  ];

  readonly groupForm = this.formBuilder.nonNullable.group({
    codigo: ['', [Validators.required]],
    idCapacitador: [0, [Validators.required, Validators.min(1)]],
    turno: ['MORNING', [Validators.required]],
    sala: ['SALA_FIBRA', [Validators.required]],
    fechaInicio: [this.getToday(), [Validators.required]]
  });

  readonly detailForm = this.formBuilder.nonNullable.group({
    estadoCapacitacion: ['ASIGNADO', [Validators.required]],
    fechaResultado: [''],
    idEmpleadoContratado: [''],
    fechaContratacion: [''],
    cumplioTresMeses: [''],
    fechaCumplioTresMeses: ['']
  });

  readonly capacitadoresState = toSignal(
    this.trainingGroupsService.listarCapacitadores().pipe(
      timeout(this.requestTimeoutMs),
      map((capacitadores) => ({ status: 'success' as const, capacitadores })),
      startWith({ status: 'loading' as const, capacitadores: [] as EmpleadoRolResponse[] }),
      catchError((error: HttpErrorResponse) =>
        of({
          status: 'error' as const,
          capacitadores: [] as EmpleadoRolResponse[],
          message: this.getErrorMessage(error, 'No fue posible cargar capacitadores.')
        })
      )
    ),
    { initialValue: { status: 'loading' as const, capacitadores: [] as EmpleadoRolResponse[] } }
  );

  readonly selectedEstado = signal<string | null>('ABIERTO');
  readonly groupsPage = signal<PageResponse<GrupoCapacitacionResponse> | null>(null);
  readonly selectedGroup = signal<GrupoCapacitacionResponse | null>(null);
  readonly selectedDetail = signal<GrupoCapacitacionDetalleResponse | null>(null);
  readonly isLoadingGroups = signal(false);
  readonly listErrorMessage = signal('');
  readonly createErrorMessage = signal('');
  readonly createSuccessMessage = signal('');
  readonly detailErrorMessage = signal('');
  readonly updateDetailErrorMessage = signal('');
  readonly updateDetailSuccessMessage = signal('');

  readonly capacitadores = computed(() => this.capacitadoresState().capacitadores);
  readonly capacitadoresErrorMessage = computed(() => {
    const state = this.capacitadoresState();
    return state.status === 'error' ? state.message : '';
  });
  readonly isLoadingCapacitadores = computed(() => this.capacitadoresState().status === 'loading');
  readonly groups = computed(() => this.groupsPage()?.content ?? []);
  readonly currentPage = computed(() => this.groupsPage()?.page ?? 0);
  readonly totalPages = computed(() => this.groupsPage()?.totalPages ?? 1);
  readonly isCreatingGroup = computed(() => this.createGroupState().status === 'loading');
  readonly isLoadingDetail = computed(() => this.detailState().status === 'loading');
  readonly isUpdatingDetail = computed(() => this.updateDetailState().status === 'loading');

  constructor() {
    effect(() => {
      const state = this.groupListState();

      if (state.status === 'loading') {
        this.isLoadingGroups.set(true);
        this.listErrorMessage.set('');
        return;
      }

      if (state.status === 'refreshing') {
        this.listErrorMessage.set('');
        return;
      }

      if (state.status === 'success') {
        this.groupsPage.set(state.page);
        this.isLoadingGroups.set(false);
        this.listErrorMessage.set('');
        return;
      }

      if (state.status === 'error') {
        this.isLoadingGroups.set(false);
        this.listErrorMessage.set(state.message);
      }
    });

    effect(() => {
      const state = this.createGroupState();

      if (state.status === 'success') {
        if (state.requestId === this.handledCreateRequestId) {
          return;
        }

        this.handledCreateRequestId = state.requestId;

        untracked(() => {
          this.createErrorMessage.set('');
          this.createSuccessMessage.set(`Grupo ${state.group.codigo} creado.`);
          this.resetForm();
          this.loadGroups(0, true);
          this.openDetail(state.group.id);
        });
        return;
      }

      if (state.status === 'error') {
        this.createErrorMessage.set(state.message);
      }
    });

    effect(() => {
      const state = this.detailState();

      if (state.status === 'success') {
        this.selectedGroup.set(state.group);
        this.detailErrorMessage.set('');
        this.selectedDetail.set(null);
        this.updateDetailErrorMessage.set('');
        this.updateDetailSuccessMessage.set('');
        return;
      }

      if (state.status === 'error') {
        this.detailErrorMessage.set(state.message);
      }
    });

    effect(() => {
      const state = this.updateDetailState();

      if (state.status === 'success') {
        if (state.requestId === this.handledUpdateDetailRequestId) {
          return;
        }

        this.handledUpdateDetailRequestId = state.requestId;

        const groupId = this.selectedGroup()?.id;

        untracked(() => {
          this.updateDetailErrorMessage.set('');
          this.updateDetailSuccessMessage.set('Seguimiento actualizado.');
          this.selectedDetail.set(state.detail);

          if (groupId) {
            this.openDetail(groupId);
          }
        });
        return;
      }

      if (state.status === 'error') {
        this.updateDetailSuccessMessage.set('');
        this.updateDetailErrorMessage.set(state.message);
      }
    });
  }

  initialize(): void {
    this.loadGroups();
  }

  loadGroups(pageNumber = 0, silent = false): void {
    this.groupListRequest.set({
      requestId: this.nextRequestId++,
      pageNumber,
      estado: this.selectedEstado(),
      silent
    });
  }

  applyEstadoFilter(value: string): void {
    this.selectedEstado.set(value || null);
    this.loadGroups(0);
  }

  submitGroup(): void {
    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      return;
    }

    this.createErrorMessage.set('');
    this.createSuccessMessage.set('');
    this.createGroupRequest.set({
      requestId: this.nextRequestId++,
      payload: this.buildGroupRequest()
    });
  }

  openDetail(idGrupoCapacitacion: number): void {
    this.detailErrorMessage.set('');
    this.detailRequest.set({
      requestId: this.nextRequestId++,
      idGrupoCapacitacion
    });
  }

  closeDetail(): void {
    this.selectedGroup.set(null);
    this.selectedDetail.set(null);
    this.detailErrorMessage.set('');
    this.updateDetailErrorMessage.set('');
    this.updateDetailSuccessMessage.set('');
  }

  selectDetail(detalle: GrupoCapacitacionDetalleResponse): void {
    this.selectedDetail.set(detalle);
    this.updateDetailErrorMessage.set('');
    this.updateDetailSuccessMessage.set('');
    this.detailForm.reset({
      estadoCapacitacion: detalle.estadoCapacitacion,
      fechaResultado: detalle.fechaResultado ?? '',
      idEmpleadoContratado: detalle.idEmpleadoContratado?.toString() ?? '',
      fechaContratacion: detalle.fechaContratacion ?? '',
      cumplioTresMeses:
        detalle.cumplioTresMeses === null ? '' : detalle.cumplioTresMeses ? 'true' : 'false',
      fechaCumplioTresMeses: detalle.fechaCumplioTresMeses ?? ''
    });
  }

  cancelDetailEdit(): void {
    this.selectedDetail.set(null);
    this.updateDetailErrorMessage.set('');
    this.updateDetailSuccessMessage.set('');
  }

  submitDetailUpdate(): void {
    const group = this.selectedGroup();
    const detail = this.selectedDetail();

    if (!group || !detail) {
      return;
    }

    if (this.detailForm.invalid) {
      this.detailForm.markAllAsTouched();
      return;
    }

    this.updateDetailErrorMessage.set('');
    this.updateDetailSuccessMessage.set('');
    this.updateDetailRequest.set({
      requestId: this.nextRequestId++,
      idGrupoCapacitacion: group.id,
      idPostulacion: detail.postulacion.id,
      payload: this.buildDetailUpdateRequest()
    });
  }

  resetForm(): void {
    this.groupForm.reset({
      codigo: '',
      idCapacitador: 0,
      turno: 'MORNING',
      sala: 'SALA_FIBRA',
      fechaInicio: this.getToday()
    });
  }

  private buildGroupRequest(): GrupoCapacitacionRequest {
    const raw = this.groupForm.getRawValue();

    return {
      codigo: raw.codigo.trim(),
      idCapacitador: Number(raw.idCapacitador),
      turno: raw.turno,
      sala: raw.sala,
      fechaInicio: raw.fechaInicio
    };
  }

  private buildDetailUpdateRequest(): ActualizarDetalleGrupoCapacitacionRequest {
    const raw = this.detailForm.getRawValue();

    return {
      estadoCapacitacion: raw.estadoCapacitacion || null,
      fechaResultado: raw.fechaResultado || null,
      idEmpleadoContratado: raw.idEmpleadoContratado ? Number(raw.idEmpleadoContratado) : null,
      fechaContratacion: raw.fechaContratacion || null,
      cumplioTresMeses:
        raw.cumplioTresMeses === '' ? null : raw.cumplioTresMeses === 'true',
      fechaCumplioTresMeses: raw.fechaCumplioTresMeses || null
    };
  }

  private getToday(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private getErrorMessage(error: HttpErrorResponse, fallbackMessage: string): string {
    const apiError = error.error as ApiErrorResponse | null;

    if (apiError?.details?.length) {
      return `${apiError.message}: ${apiError.details.join(', ')}`;
    }

    return apiError?.message ?? fallbackMessage;
  }
}
