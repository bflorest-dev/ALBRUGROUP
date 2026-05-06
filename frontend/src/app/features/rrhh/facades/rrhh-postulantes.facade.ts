import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { catchError, filter, map, of, startWith, switchMap, timeout } from 'rxjs';
import { ApiErrorResponse } from '../../../shared/models/api/api-error-response';
import { PageResponse } from '../../../shared/models/common/page-response';
import { OfertaLaboralResponse } from '../../../shared/models/recruitment/oferta-laboral-response';
import { PostulacionRequest } from '../../../shared/models/recruitment/postulacion-request';
import { PostulacionResponse } from '../../../shared/models/recruitment/postulacion-response';
import { RrhhRecruitmentService } from '../services/rrhh-recruitment.service';

type ListRequest = {
  requestId: number;
  pageNumber: number;
  silent: boolean;
  filters: {
    etapa: string | null;
    estado: string | null;
    estadoBandeja: string | null;
  };
};

type ListState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'refreshing'; requestId: number }
  | { status: 'success'; requestId: number; page: PageResponse<PostulacionResponse> }
  | { status: 'error'; requestId: number; message: string };

type SaveRequest = {
  requestId: number;
  idPostulacion: number | null;
  payload: PostulacionRequest;
};

type SaveState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'success'; requestId: number; postulacion: PostulacionResponse; edited: boolean }
  | { status: 'error'; requestId: number; message: string };

@Injectable()
export class RrhhPostulantesFacade {
  private readonly requestTimeoutMs = 15000;
  private readonly formBuilder = inject(FormBuilder);
  private readonly recruitmentService = inject(RrhhRecruitmentService);
  private nextRequestId = 1;

  private readonly listRequest = signal<ListRequest | null>(null);
  private readonly saveRequest = signal<SaveRequest | null>(null);

  private readonly listState = toSignal(
    toObservable(this.listRequest).pipe(
      filter((request): request is ListRequest => request !== null),
      switchMap((request) =>
        this.recruitmentService.listarPostulaciones(request.filters, request.pageNumber).pipe(
          timeout(this.requestTimeoutMs),
          map(
            (page): ListState => ({
              status: 'success',
              requestId: request.requestId,
              page
            })
          ),
          startWith<ListState>({
            status: request.silent ? 'refreshing' : 'loading',
            requestId: request.requestId
          }),
          catchError((error: HttpErrorResponse) =>
            of<ListState>({
              status: 'error',
              requestId: request.requestId,
              message: this.getErrorMessage(error, 'No fue posible cargar postulaciones.')
            })
          )
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  private readonly saveState = toSignal(
    toObservable(this.saveRequest).pipe(
      filter((request): request is SaveRequest => request !== null),
      switchMap((request) => {
        const save$ = request.idPostulacion
          ? this.recruitmentService.editarPostulacion(request.idPostulacion, request.payload)
          : this.recruitmentService.registrarPostulacion(request.payload);

        return save$.pipe(
          timeout(this.requestTimeoutMs),
          map(
            (postulacion): SaveState => ({
              status: 'success',
              requestId: request.requestId,
              postulacion,
              edited: request.idPostulacion !== null
            })
          ),
          startWith<SaveState>({ status: 'loading', requestId: request.requestId }),
          catchError((error: HttpErrorResponse) =>
            of<SaveState>({
              status: 'error',
              requestId: request.requestId,
              message: this.getErrorMessage(error, 'No se pudo guardar la postulacion.')
            })
          )
        );
      })
    ),
    { initialValue: { status: 'idle' } }
  );

  readonly documentoOptions = ['DNI', 'CE'];
  readonly origenOptions = ['COMPUTRABAJO', 'INDEED', 'TIKTOK', 'FACEBOOK', 'LINKEDIN', 'REFERIDO'];
  readonly etapaOptions = ['RECLUTAMIENTO', 'CAPACITACION', 'CONTRATACION'];
  readonly estadoOptions = ['EN_PROCESO', 'CERRADA', 'FINALIZADA'];
  readonly estadoBandejaOptions = ['POSTULANTE', 'SIN_CONTACTO', 'NO_INTERESADO', 'EN_GESTION', 'RECHAZADO'];

  readonly postulanteForm = this.formBuilder.nonNullable.group({
    idOfertaLaboral: [0, [Validators.required, Validators.min(1)]],
    origen: ['COMPUTRABAJO', [Validators.required]],
    nombres: ['', [Validators.required]],
    apellidos: ['', [Validators.required]],
    tipoDocumento: ['DNI', [Validators.required]],
    documento: ['', [Validators.required]],
    celular: ['', [Validators.required]],
    fechaNacimiento: ['', [Validators.required]]
  });

  readonly filterForm = this.formBuilder.nonNullable.group({
    etapa: [''],
    estado: [''],
    estadoBandeja: ['']
  });

  readonly activeOffersState = toSignal(
    this.recruitmentService.listarOfertasActivas().pipe(
      timeout(this.requestTimeoutMs),
      map((offers) => ({ status: 'success' as const, offers })),
      startWith({ status: 'loading' as const, offers: [] as OfertaLaboralResponse[] }),
      catchError((error: HttpErrorResponse) =>
        of({
          status: 'error' as const,
          offers: [] as OfertaLaboralResponse[],
          message: this.getErrorMessage(error, 'No fue posible cargar ofertas activas.')
        })
      )
    ),
    { initialValue: { status: 'loading' as const, offers: [] as OfertaLaboralResponse[] } }
  );

  readonly postulacionesPage = signal<PageResponse<PostulacionResponse> | null>(null);
  readonly isLoadingList = signal(false);
  readonly listErrorMessage = signal('');
  readonly saveErrorMessage = signal('');
  readonly saveSuccessMessage = signal('');
  readonly editingPostulacionId = signal<number | null>(null);

  readonly activeOffers = computed(() => this.activeOffersState().offers);
  readonly activeOffersErrorMessage = computed(() => {
    const state = this.activeOffersState();
    return state.status === 'error' ? state.message : '';
  });
  readonly isLoadingActiveOffers = computed(() => this.activeOffersState().status === 'loading');
  readonly postulaciones = computed(() => this.postulacionesPage()?.content ?? []);
  readonly currentPage = computed(() => this.postulacionesPage()?.page ?? 0);
  readonly totalPages = computed(() => this.postulacionesPage()?.totalPages ?? 1);
  readonly isSaving = computed(() => this.saveState().status === 'loading');
  readonly isEditing = computed(() => this.editingPostulacionId() !== null);

  constructor() {
    effect(() => {
      const state = this.listState();

      if (state.status === 'loading') {
        this.isLoadingList.set(true);
        this.listErrorMessage.set('');
        return;
      }

      if (state.status === 'refreshing') {
        this.listErrorMessage.set('');
        return;
      }

      if (state.status === 'success') {
        this.postulacionesPage.set(state.page);
        this.isLoadingList.set(false);
        this.listErrorMessage.set('');
        return;
      }

      if (state.status === 'error') {
        this.isLoadingList.set(false);
        this.listErrorMessage.set(state.message);
      }
    });

    effect(() => {
      const state = this.saveState();

      if (state.status === 'success') {
        untracked(() => {
          this.saveErrorMessage.set('');
          this.saveSuccessMessage.set(state.edited ? 'Postulacion actualizada.' : 'Postulacion registrada.');
          this.resetForm();
          this.loadPostulaciones(0, true);
        });
        return;
      }

      if (state.status === 'error') {
        this.saveErrorMessage.set(state.message);
      }
    });
  }

  initialize(): void {
    this.loadPostulaciones();
  }

  loadPostulaciones(pageNumber = 0, silent = false): void {
    const filters = this.filterForm.getRawValue();

    this.listRequest.set({
      requestId: this.nextRequestId++,
      pageNumber,
      silent,
      filters: {
        etapa: filters.etapa || null,
        estado: filters.estado || null,
        estadoBandeja: filters.estadoBandeja || null
      }
    });
  }

  applyFilters(): void {
    this.loadPostulaciones(0);
  }

  clearFilters(): void {
    this.filterForm.reset({
      etapa: '',
      estado: '',
      estadoBandeja: ''
    });
    this.loadPostulaciones(0);
  }

  submitPostulacion(): void {
    if (this.postulanteForm.invalid) {
      this.postulanteForm.markAllAsTouched();
      return;
    }

    this.saveErrorMessage.set('');
    this.saveSuccessMessage.set('');
    this.saveRequest.set({
      requestId: this.nextRequestId++,
      idPostulacion: this.editingPostulacionId(),
      payload: this.buildPostulacionRequest()
    });
  }

  editPostulacion(postulacion: PostulacionResponse): void {
    this.editingPostulacionId.set(postulacion.id);
    this.saveErrorMessage.set('');
    this.saveSuccessMessage.set('');
    this.postulanteForm.reset({
      idOfertaLaboral: postulacion.ofertaLaboral.id,
      origen: postulacion.origen,
      nombres: postulacion.postulante.nombres,
      apellidos: postulacion.postulante.apellidos,
      tipoDocumento: postulacion.postulante.tipoDocumento,
      documento: postulacion.postulante.documento,
      celular: postulacion.postulante.celular,
      fechaNacimiento: postulacion.postulante.fechaNacimiento
    });
  }

  resetForm(): void {
    this.editingPostulacionId.set(null);
    this.postulanteForm.reset({
      idOfertaLaboral: 0,
      origen: 'COMPUTRABAJO',
      nombres: '',
      apellidos: '',
      tipoDocumento: 'DNI',
      documento: '',
      celular: '',
      fechaNacimiento: ''
    });
  }

  private buildPostulacionRequest(): PostulacionRequest {
    const raw = this.postulanteForm.getRawValue();

    return {
      idOfertaLaboral: Number(raw.idOfertaLaboral),
      origen: raw.origen,
      postulante: {
        nombres: raw.nombres.trim(),
        apellidos: raw.apellidos.trim(),
        tipoDocumento: raw.tipoDocumento,
        documento: raw.documento.trim(),
        celular: raw.celular.trim(),
        fechaNacimiento: raw.fechaNacimiento
      }
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
