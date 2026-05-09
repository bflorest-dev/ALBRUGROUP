import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { catchError, filter, map, of, startWith, switchMap, timeout } from 'rxjs';
import { ApiErrorResponse } from '../../../shared/models/api/api-error-response';
import { PageResponse } from '../../../shared/models/common/page-response';
import { CatalogoTipificacionResponse } from '../../../shared/models/recruitment/catalogo-tipificacion-response';
import { EventoResponse } from '../../../shared/models/recruitment/evento-response';
import { GrupoCapacitacionResponse } from '../../../shared/models/recruitment/grupo-capacitacion-response';
import { PostulacionResponse } from '../../../shared/models/recruitment/postulacion-response';
import { SubtipificacionResponse } from '../../../shared/models/recruitment/subtipificacion-response';
import { TipificarPostulacionRequest } from '../../../shared/models/recruitment/tipificar-postulacion-request';
import { TipificarYAsignarGrupoCapacitacionRequest } from '../../../shared/models/recruitment/tipificar-y-asignar-grupo-capacitacion-request';
import { RecruiterPostulantesService } from '../services/recruiter-postulantes.service';

export type BandejaColumnKey =
  | 'POSTULANTE'
  | 'SIN_CONTACTO'
  | 'NO_INTERESADO'
  | 'EN_GESTION'
  | 'RECHAZADO';

export type BandejaColumn = {
  key: BandejaColumnKey;
  title: string;
  hint: string;
};

type ColumnRequest = {
  requestId: number;
  pageNumber: number;
  silent: boolean;
};

type ColumnState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'refreshing'; requestId: number }
  | { status: 'success'; requestId: number; page: PageResponse<PostulacionResponse> }
  | { status: 'error'; requestId: number; message: string };

type DetailRequest = {
  requestId: number;
  postulacion: PostulacionResponse;
};

type DetailState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number; postulacion: PostulacionResponse }
  | {
      status: 'success';
      requestId: number;
      postulacion: PostulacionResponse;
      eventos: EventoResponse[];
    }
  | { status: 'error'; requestId: number; postulacion: PostulacionResponse; message: string };

type TypifyRequest = {
  requestId: number;
  idPostulacion: number;
  payload: TipificarPostulacionRequest | TipificarYAsignarGrupoCapacitacionRequest;
  withTrainingGroup: boolean;
};

type TypifyState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number; idPostulacion: number }
  | { status: 'success'; requestId: number; postulacion: PostulacionResponse }
  | { status: 'error'; requestId: number; idPostulacion: number; message: string };

const EMPTY_PAGE: PageResponse<PostulacionResponse> = {
  content: [],
  page: 0,
  size: 8,
  totalElements: 0,
  totalPages: 1
};

@Injectable()
export class RecruiterPostulantesFacade {
  private readonly asesorVentasTrainingTipificacionId = 5;
  private readonly asesorVentasTrainingSubtipificacionId = 22;
  private readonly requestTimeoutMs = 15000;
  private readonly formBuilder = inject(FormBuilder);
  private readonly postulantesService = inject(RecruiterPostulantesService);
  private nextRequestId = 1;
  private handledTypifyRequestId = 0;

  readonly columns: BandejaColumn[] = [
    { key: 'POSTULANTE', title: 'Postulantes', hint: 'Pendientes de primer contacto' },
    { key: 'SIN_CONTACTO', title: 'Sin contacto', hint: 'Intentos sin respuesta' },
    { key: 'NO_INTERESADO', title: 'No interesados', hint: 'Descartados por decision del postulante' },
    { key: 'EN_GESTION', title: 'En gestion', hint: 'Seguimiento activo' },
    { key: 'RECHAZADO', title: 'Rechazados', hint: 'No continúan el proceso' }
  ];

  readonly modalidadContactoOptions = ['LLAMADA', 'MEET', 'PRESENCIAL'];

  private readonly columnRequests = signal<Record<BandejaColumnKey, ColumnRequest>>({
    POSTULANTE: { requestId: 0, pageNumber: 0, silent: false },
    SIN_CONTACTO: { requestId: 0, pageNumber: 0, silent: false },
    NO_INTERESADO: { requestId: 0, pageNumber: 0, silent: false },
    EN_GESTION: { requestId: 0, pageNumber: 0, silent: false },
    RECHAZADO: { requestId: 0, pageNumber: 0, silent: false }
  });

  private readonly detailRequest = signal<DetailRequest | null>(null);
  private readonly typifyRequest = signal<TypifyRequest | null>(null);

  private readonly columnStates = {
    POSTULANTE: this.createColumnState('POSTULANTE'),
    SIN_CONTACTO: this.createColumnState('SIN_CONTACTO'),
    NO_INTERESADO: this.createColumnState('NO_INTERESADO'),
    EN_GESTION: this.createColumnState('EN_GESTION'),
    RECHAZADO: this.createColumnState('RECHAZADO')
  };

  private readonly detailState = toSignal(
    toObservable(this.detailRequest).pipe(
      filter((request): request is DetailRequest => request !== null),
      switchMap((request) =>
        this.postulantesService.listarEventos(request.postulacion.id).pipe(
          timeout(this.requestTimeoutMs),
          map(
            (page): DetailState => ({
              status: 'success',
              requestId: request.requestId,
              postulacion: request.postulacion,
              eventos: page.content
            })
          ),
          startWith<DetailState>({
            status: 'loading',
            requestId: request.requestId,
            postulacion: request.postulacion
          }),
          catchError((error: HttpErrorResponse) =>
            of<DetailState>({
              status: 'error',
              requestId: request.requestId,
              postulacion: request.postulacion,
              message: this.getErrorMessage(error, 'No fue posible cargar eventos.')
            })
          )
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  private readonly typifyState = toSignal(
    toObservable(this.typifyRequest).pipe(
      filter((request): request is TypifyRequest => request !== null),
      switchMap((request) => {
        const save$ = request.withTrainingGroup
          ? this.postulantesService.tipificarYAsignarGrupoCapacitacion(
              request.idPostulacion,
              request.payload as TipificarYAsignarGrupoCapacitacionRequest
            )
          : this.postulantesService.tipificarPostulacion(
              request.idPostulacion,
              request.payload as TipificarPostulacionRequest
            );

        return save$.pipe(
          timeout(this.requestTimeoutMs),
          map(
            (postulacion): TypifyState => ({
              status: 'success',
              requestId: request.requestId,
              postulacion
            })
          ),
          startWith<TypifyState>({
            status: 'loading',
            requestId: request.requestId,
            idPostulacion: request.idPostulacion
          }),
          catchError((error: HttpErrorResponse) =>
            of<TypifyState>({
              status: 'error',
              requestId: request.requestId,
              idPostulacion: request.idPostulacion,
              message: this.getErrorMessage(error, 'No fue posible tipificar la postulacion.')
            })
          )
        );
      })
    ),
    { initialValue: { status: 'idle' } }
  );

  readonly catalogoState = toSignal(
    this.postulantesService.obtenerCatalogoReclutamiento().pipe(
      timeout(this.requestTimeoutMs),
      map((catalogo) => ({ status: 'success' as const, catalogo })),
      startWith({
        status: 'loading' as const,
        catalogo: { etapa: 'RECLUTAMIENTO', tipificaciones: [] } as CatalogoTipificacionResponse
      }),
      catchError((error: HttpErrorResponse) =>
        of({
          status: 'error' as const,
          catalogo: { etapa: 'RECLUTAMIENTO', tipificaciones: [] } as CatalogoTipificacionResponse,
          message: this.getErrorMessage(error, 'No fue posible cargar catalogo de tipificacion.')
        })
      )
    ),
    {
      initialValue: {
        status: 'loading' as const,
        catalogo: { etapa: 'RECLUTAMIENTO', tipificaciones: [] } as CatalogoTipificacionResponse
      }
    }
  );

  readonly typifyForm = this.formBuilder.nonNullable.group({
    idTipificacion: [0, [Validators.required, Validators.min(1)]],
    idSubtipificacion: [0, [Validators.required, Validators.min(1)]],
    idGrupoCapacitacion: [0],
    modalidadContacto: [''],
    observacion: ['']
  });

  readonly trainingGroupsState = toSignal(
    this.postulantesService.listarGruposCapacitacionAbiertos().pipe(
      timeout(this.requestTimeoutMs),
      map((page) => ({ status: 'success' as const, groups: page.content })),
      startWith({ status: 'loading' as const, groups: [] as GrupoCapacitacionResponse[] }),
      catchError((error: HttpErrorResponse) =>
        of({
          status: 'error' as const,
          groups: [] as GrupoCapacitacionResponse[],
          message: this.getErrorMessage(error, 'No fue posible cargar grupos de capacitacion.')
        })
      )
    ),
    { initialValue: { status: 'loading' as const, groups: [] as GrupoCapacitacionResponse[] } }
  );

  readonly columnPages = signal<Record<BandejaColumnKey, PageResponse<PostulacionResponse>>>({
    POSTULANTE: EMPTY_PAGE,
    SIN_CONTACTO: EMPTY_PAGE,
    NO_INTERESADO: EMPTY_PAGE,
    EN_GESTION: EMPTY_PAGE,
    RECHAZADO: EMPTY_PAGE
  });
  readonly loadingByColumn = signal<Record<BandejaColumnKey, boolean>>({
    POSTULANTE: false,
    SIN_CONTACTO: false,
    NO_INTERESADO: false,
    EN_GESTION: false,
    RECHAZADO: false
  });
  readonly errorByColumn = signal<Record<BandejaColumnKey, string>>({
    POSTULANTE: '',
    SIN_CONTACTO: '',
    NO_INTERESADO: '',
    EN_GESTION: '',
    RECHAZADO: ''
  });
  readonly selectedPostulacion = signal<PostulacionResponse | null>(null);
  readonly eventos = signal<EventoResponse[]>([]);
  readonly detailErrorMessage = signal('');
  readonly typifyErrorMessage = signal('');
  readonly typifySuccessMessage = signal('');

  readonly catalogo = computed(() => this.catalogoState().catalogo);
  readonly tipificaciones = computed(() => this.catalogo().tipificaciones);
  readonly catalogoErrorMessage = computed(() => {
    const state = this.catalogoState();
    return state.status === 'error' ? state.message : '';
  });
  readonly isLoadingCatalogo = computed(() => this.catalogoState().status === 'loading');
  readonly trainingGroups = computed(() => this.trainingGroupsState().groups);
  readonly trainingGroupsErrorMessage = computed(() => {
    const state = this.trainingGroupsState();
    return state.status === 'error' ? state.message : '';
  });
  readonly isLoadingTrainingGroups = computed(() => this.trainingGroupsState().status === 'loading');
  readonly isLoadingDetail = computed(() => this.detailState().status === 'loading');
  readonly isTypifying = computed(() => this.typifyState().status === 'loading');

  constructor() {
    this.columns.forEach((column) => {
      effect(() => {
        const state = this.columnStates[column.key]();
        this.handleColumnState(column.key, state);
      });
    });

    effect(() => {
      const state = this.detailState();

      if (state.status === 'loading') {
        this.selectedPostulacion.set(state.postulacion);
        this.eventos.set([]);
        this.detailErrorMessage.set('');
        return;
      }

      if (state.status === 'success') {
        this.selectedPostulacion.set(state.postulacion);
        this.eventos.set(state.eventos);
        this.detailErrorMessage.set('');
        return;
      }

      if (state.status === 'error') {
        this.selectedPostulacion.set(state.postulacion);
        this.eventos.set([]);
        this.detailErrorMessage.set(state.message);
      }
    });

    effect(() => {
      const state = this.typifyState();

      if (state.status === 'success') {
        if (state.requestId === this.handledTypifyRequestId) {
          return;
        }

        this.handledTypifyRequestId = state.requestId;

        untracked(() => {
          this.typifyErrorMessage.set('');
          this.typifySuccessMessage.set('Postulacion tipificada.');
          this.resetTypifyForm();
          this.refreshAllColumns(true);
          this.openDetail(state.postulacion);
        });
        return;
      }

      if (state.status === 'error') {
        this.typifyErrorMessage.set(state.message);
      }
    });
  }

  initialize(): void {
    this.refreshAllColumns(false);
  }

  getPage(column: BandejaColumnKey): PageResponse<PostulacionResponse> {
    return this.columnPages()[column];
  }

  loadColumn(column: BandejaColumnKey, pageNumber = 0, silent = false): void {
    this.columnRequests.update((current) => ({
      ...current,
      [column]: {
        requestId: this.nextRequestId++,
        pageNumber,
        silent
      }
    }));
  }

  refreshAllColumns(silent = false): void {
    this.columns.forEach((column) => this.loadColumn(column.key, 0, silent));
  }

  openDetail(postulacion: PostulacionResponse): void {
    this.typifyErrorMessage.set('');
    this.typifySuccessMessage.set('');
    this.detailRequest.set({
      requestId: this.nextRequestId++,
      postulacion
    });
  }

  closeDetail(): void {
    this.selectedPostulacion.set(null);
    this.eventos.set([]);
    this.detailErrorMessage.set('');
    this.typifyErrorMessage.set('');
    this.typifySuccessMessage.set('');
    this.resetTypifyForm();
  }

  submitTypification(): void {
    const postulacion = this.selectedPostulacion();

    if (!postulacion) {
      return;
    }

    const withTrainingGroup = this.requiresTrainingGroupAssignment();

    if (this.typifyForm.invalid) {
      this.typifyForm.markAllAsTouched();
      return;
    }

    if (withTrainingGroup && Number(this.typifyForm.controls.idGrupoCapacitacion.value) <= 0) {
      this.typifyErrorMessage.set('Selecciona un grupo de capacitacion abierto.');
      return;
    }

    this.typifyErrorMessage.set('');
    this.typifySuccessMessage.set('');
    this.typifyRequest.set({
      requestId: this.nextRequestId++,
      idPostulacion: postulacion.id,
      payload: withTrainingGroup ? this.buildTrainingGroupTypifyRequest() : this.buildTypifyRequest(),
      withTrainingGroup
    });
  }

  resetTypifyForm(): void {
    this.typifyForm.reset({
      idTipificacion: 0,
      idSubtipificacion: 0,
      idGrupoCapacitacion: 0,
      modalidadContacto: '',
      observacion: ''
    });
  }

  resetSubtipificacion(): void {
    this.typifyForm.controls.idSubtipificacion.setValue(0);
    this.typifyForm.controls.idGrupoCapacitacion.setValue(0);
  }

  requiresTrainingGroupAssignment(): boolean {
    const postulacion = this.selectedPostulacion();

    if (!postulacion || postulacion.ofertaLaboral.puestoObjetivo !== 'ASESOR_VENTAS') {
      return false;
    }

    const raw = this.typifyForm.getRawValue();

    return (
      Number(raw.idTipificacion) === this.asesorVentasTrainingTipificacionId &&
      Number(raw.idSubtipificacion) === this.asesorVentasTrainingSubtipificacionId
    );
  }

  getSubtipificaciones(idTipificacion: number): SubtipificacionResponse[] {
    return (
      this.tipificaciones().find((tipificacion) => tipificacion.id === idTipificacion)
        ?.subtipificaciones ?? []
    );
  }

  private createColumnState(column: BandejaColumnKey) {
    const request = computed(() => this.columnRequests()[column]);

    return toSignal(
      toObservable(request).pipe(
        filter((columnRequest) => columnRequest.requestId > 0),
        switchMap((columnRequest) =>
          this.postulantesService
            .listarBandejaReclutamiento(column, columnRequest.pageNumber)
            .pipe(
              timeout(this.requestTimeoutMs),
              map(
                (page): ColumnState => ({
                  status: 'success',
                  requestId: columnRequest.requestId,
                  page
                })
              ),
              startWith<ColumnState>({
                status: columnRequest.silent ? 'refreshing' : 'loading',
                requestId: columnRequest.requestId
              }),
              catchError((error: HttpErrorResponse) =>
                of<ColumnState>({
                  status: 'error',
                  requestId: columnRequest.requestId,
                  message: this.getErrorMessage(error, `No fue posible cargar ${column}.`)
                })
              )
            )
        )
      ),
      { initialValue: { status: 'idle' } }
    );
  }

  private handleColumnState(column: BandejaColumnKey, state: ColumnState): void {
    if (state.status === 'loading') {
      this.loadingByColumn.update((current) => ({ ...current, [column]: true }));
      this.errorByColumn.update((current) => ({ ...current, [column]: '' }));
      return;
    }

    if (state.status === 'refreshing') {
      this.errorByColumn.update((current) => ({ ...current, [column]: '' }));
      return;
    }

    if (state.status === 'success') {
      this.columnPages.update((current) => ({ ...current, [column]: state.page }));
      this.loadingByColumn.update((current) => ({ ...current, [column]: false }));
      this.errorByColumn.update((current) => ({ ...current, [column]: '' }));
      return;
    }

    if (state.status === 'error') {
      this.loadingByColumn.update((current) => ({ ...current, [column]: false }));
      this.errorByColumn.update((current) => ({ ...current, [column]: state.message }));
    }
  }

  private buildTypifyRequest(): TipificarPostulacionRequest {
    const raw = this.typifyForm.getRawValue();

    return {
      idTipificacion: Number(raw.idTipificacion),
      idSubtipificacion: Number(raw.idSubtipificacion),
      modalidadContacto: raw.modalidadContacto || null,
      observacion: raw.observacion.trim() || null
    };
  }

  private buildTrainingGroupTypifyRequest(): TipificarYAsignarGrupoCapacitacionRequest {
    const raw = this.typifyForm.getRawValue();

    return {
      idTipificacion: Number(raw.idTipificacion),
      idSubtipificacion: Number(raw.idSubtipificacion),
      idGrupoCapacitacion: Number(raw.idGrupoCapacitacion),
      modalidadContacto: raw.modalidadContacto || null,
      observacion: raw.observacion.trim() || null
    };
  }

  private getErrorMessage(error: HttpErrorResponse, fallbackMessage: string): string {
    const apiError = error.error as ApiErrorResponse | null;

    if (apiError?.details?.length) {
      return `${apiError.message}: ${apiError.details.join(', ')}`;
    }

    return apiError?.message ?? fallbackMessage;
  }
}
