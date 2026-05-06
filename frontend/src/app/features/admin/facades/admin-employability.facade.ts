import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { catchError, filter, map, of, startWith, switchMap, timeout } from 'rxjs';
import { ApiErrorResponse } from '../../../shared/models/api/api-error-response';
import { PageResponse } from '../../../shared/models/common/page-response';
import { ActualizarEstadoOfertaLaboralRequest } from '../../../shared/models/recruitment/actualizar-estado-oferta-laboral-request';
import { OfertaAmpliacionRequest } from '../../../shared/models/recruitment/oferta-ampliacion-request';
import { OfertaAmpliacionResponse } from '../../../shared/models/recruitment/oferta-ampliacion-response';
import { OfertaLaboralRequest } from '../../../shared/models/recruitment/oferta-laboral-request';
import { OfertaLaboralResponse } from '../../../shared/models/recruitment/oferta-laboral-response';
import { upsertById } from '../../../shared/utils/collection.utils';
import { AdminRecruitmentService } from '../services/admin-recruitment.service';

type OfferListRequest = {
  requestId: number;
  pageNumber: number;
  estado: string | null;
  silent: boolean;
};

type OfferListState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'refreshing'; requestId: number }
  | { status: 'success'; requestId: number; page: PageResponse<OfertaLaboralResponse> }
  | { status: 'error'; requestId: number; message: string };

type CreateOfferRequestState = {
  requestId: number;
  payload: OfertaLaboralRequest;
};

type CreateOfferState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'success'; requestId: number; oferta: OfertaLaboralResponse }
  | { status: 'error'; requestId: number; message: string };

type ExpansionRequestState = {
  requestId: number;
  offerId: number;
  payload: OfertaAmpliacionRequest;
};

type ExpansionState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number; offerId: number }
  | { status: 'success'; requestId: number; offerId: number; ampliacion: OfertaAmpliacionResponse }
  | { status: 'error'; requestId: number; offerId: number; message: string };

type StatusUpdateRequestState = {
  requestId: number;
  offerId: number;
  payload: ActualizarEstadoOfertaLaboralRequest;
};

type StatusUpdateState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number; offerId: number }
  | { status: 'success'; requestId: number; oferta: OfertaLaboralResponse }
  | { status: 'error'; requestId: number; offerId: number; message: string };

@Injectable()
export class AdminEmployabilityFacade {
  private readonly requestTimeoutMs = 15000;
  private readonly statusErrorTimeoutMs = 5000;
  private readonly formBuilder = inject(FormBuilder);
  private readonly recruitmentService = inject(AdminRecruitmentService);
  private nextRequestId = 1;
  private readonly statusErrorTimers = new Map<number, ReturnType<typeof setTimeout>>();

  private readonly offerListRequest = signal<OfferListRequest | null>(null);
  private readonly createOfferRequest = signal<CreateOfferRequestState | null>(null);
  private readonly expansionRequest = signal<ExpansionRequestState | null>(null);
  private readonly statusUpdateRequest = signal<StatusUpdateRequestState | null>(null);

  private readonly offerListState = toSignal(
    toObservable(this.offerListRequest).pipe(
      filter((request): request is OfferListRequest => request !== null),
      switchMap((request) =>
        this.recruitmentService.listarOfertas(request.pageNumber, 8, request.estado).pipe(
          timeout(this.requestTimeoutMs),
          map(
            (page): OfferListState => ({
              status: 'success',
              requestId: request.requestId,
              page
            })
          ),
          startWith<OfferListState>({
            status: request.silent ? 'refreshing' : 'loading',
            requestId: request.requestId
          }),
          catchError((error: HttpErrorResponse) =>
            of<OfferListState>({
              status: 'error',
              requestId: request.requestId,
              message: this.getErrorMessage(error, 'No fue posible cargar las ofertas laborales.')
            })
          )
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  private readonly createOfferState = toSignal(
    toObservable(this.createOfferRequest).pipe(
      filter((request): request is CreateOfferRequestState => request !== null),
      switchMap((request) =>
        this.recruitmentService.registrarOferta(request.payload).pipe(
          timeout(this.requestTimeoutMs),
          map(
            (oferta): CreateOfferState => ({
              status: 'success',
              requestId: request.requestId,
              oferta
            })
          ),
          startWith<CreateOfferState>({ status: 'loading', requestId: request.requestId }),
          catchError((error: HttpErrorResponse) =>
            of<CreateOfferState>({
              status: 'error',
              requestId: request.requestId,
              message: this.getErrorMessage(error, 'No se pudo registrar la oferta laboral.')
            })
          )
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  private readonly expansionState = toSignal(
    toObservable(this.expansionRequest).pipe(
      filter((request): request is ExpansionRequestState => request !== null),
      switchMap((request) =>
        this.recruitmentService.registrarAmpliacion(request.offerId, request.payload).pipe(
          timeout(this.requestTimeoutMs),
          map(
            (ampliacion): ExpansionState => ({
              status: 'success',
              requestId: request.requestId,
              offerId: request.offerId,
              ampliacion
            })
          ),
          startWith<ExpansionState>({
            status: 'loading',
            requestId: request.requestId,
            offerId: request.offerId
          }),
          catchError((error: HttpErrorResponse) =>
            of<ExpansionState>({
              status: 'error',
              requestId: request.requestId,
              offerId: request.offerId,
              message: this.getErrorMessage(error, 'No se pudo registrar la ampliacion.')
            })
          )
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  private readonly statusUpdateState = toSignal(
    toObservable(this.statusUpdateRequest).pipe(
      filter((request): request is StatusUpdateRequestState => request !== null),
      switchMap((request) =>
        this.recruitmentService.actualizarEstado(request.offerId, request.payload).pipe(
          timeout(this.requestTimeoutMs),
          map(
            (oferta): StatusUpdateState => ({
              status: 'success',
              requestId: request.requestId,
              oferta
            })
          ),
          startWith<StatusUpdateState>({
            status: 'loading',
            requestId: request.requestId,
            offerId: request.offerId
          }),
          catchError((error: HttpErrorResponse) =>
            of<StatusUpdateState>({
              status: 'error',
              requestId: request.requestId,
              offerId: request.offerId,
              message: this.getErrorMessage(error, 'No se pudo actualizar el estado de la oferta.')
            })
          )
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  readonly negocioOptions = ['FIBRA_MIXTO', 'CLARO'];
  readonly puestoObjetivoOptions = [
    'RRHH',
    'RECLUTADOR',
    'CAPACITADOR',
    'DESARROLLADOR',
    'CONTADOR',
    'COMMUNITY',
    'MONITOR',
    'SUPERVISOR_VENTAS',
    'ASESOR_VENTAS',
    'SUPERVISOR_BACKOFFICE',
    'ASESOR_BACKOFFICE',
    'SUPERVISOR_GTR',
    'ASESOR_GTR',
    'SUPERVISOR_POSTVENTA',
    'ASESOR_POSTVENTA'
  ];
  readonly modalidadOptions = ['PART_TIME', 'FULL_TIME', 'SEMI_FULL', 'SUPER_FULL'];
  readonly horarioOptions = ['MORNING', 'AFTERNOON'];
  readonly estadoOptions = ['ACTIVO', 'CANCELADO', 'CERRADO', 'COMPLETADO'];

  readonly createOfferForm = this.formBuilder.nonNullable.group({
    codigo: ['', [Validators.required]],
    negocio: ['FIBRA_MIXTO', [Validators.required]],
    puestoObjetivo: ['RECLUTADOR', [Validators.required]],
    modalidad: ['FULL_TIME', [Validators.required]],
    horario: ['MORNING', [Validators.required]],
    cantidadInicial: [1, [Validators.required, Validators.min(1)]],
    plazoInicial: [this.getToday(), [Validators.required]]
  });

  readonly expansionForm = this.formBuilder.nonNullable.group({
    cantidad: [1, [Validators.required, Validators.min(1)]],
    plazo: [this.getToday(), [Validators.required]]
  });

  readonly showCreateForm = signal(false);
  readonly selectedEstado = signal<string | null>(null);
  readonly offersPage = signal<PageResponse<OfertaLaboralResponse> | null>(null);
  readonly isLoadingOffers = signal(false);
  readonly listErrorMessage = signal('');
  readonly createErrorMessage = signal('');
  readonly expansionErrorByOfferId = signal<Record<number, string>>({});
  readonly expansionLoadingByOfferId = signal<Record<number, boolean>>({});
  readonly statusErrorByOfferId = signal<Record<number, string>>({});
  readonly statusLoadingByOfferId = signal<Record<number, boolean>>({});
  readonly expandedOfferId = signal<number | null>(null);
  readonly draftEstadoByOfferId = signal<Record<number, string>>({});

  readonly isCreatingOffer = computed(() => this.createOfferState().status === 'loading');
  readonly offers = computed(() => this.offersPage()?.content ?? []);
  readonly currentPage = computed(() => this.offersPage()?.page ?? 0);
  readonly totalPages = computed(() => this.offersPage()?.totalPages ?? 1);

  constructor() {
    effect(() => {
      const state = this.offerListState();

      if (state.status === 'loading') {
        this.isLoadingOffers.set(true);
        this.listErrorMessage.set('');
        return;
      }

      if (state.status === 'refreshing') {
        this.listErrorMessage.set('');
        return;
      }

      if (state.status === 'success') {
        this.offersPage.set(state.page);
        this.isLoadingOffers.set(false);
        this.listErrorMessage.set('');
        this.syncDraftEstados(state.page.content);
        return;
      }

      if (state.status === 'error') {
        this.isLoadingOffers.set(false);
        this.listErrorMessage.set(state.message);
      }
    });

    effect(() => {
      const state = this.createOfferState();

      if (state.status === 'success') {
        untracked(() => {
          this.showCreateForm.set(false);
          this.createErrorMessage.set('');
          this.insertOfferIntoList(state.oferta);
          this.createOfferForm.reset({
            codigo: '',
            negocio: 'FIBRA_MIXTO',
            puestoObjetivo: 'RECLUTADOR',
            modalidad: 'FULL_TIME',
            horario: 'MORNING',
            cantidadInicial: 1,
            plazoInicial: this.getToday()
          });
          this.loadOffers(0, true);
        });
        return;
      }

      if (state.status === 'error') {
        this.createErrorMessage.set(state.message);
      }
    });

    effect(() => {
      const state = this.expansionState();

      if (state.status === 'loading') {
        this.expansionLoadingByOfferId.update((current) => ({
          ...current,
          [state.offerId]: true
        }));
        this.expansionErrorByOfferId.update((current) => ({
          ...current,
          [state.offerId]: ''
        }));
        return;
      }

      if (state.status === 'success') {
        untracked(() => {
          this.expansionLoadingByOfferId.update((current) => ({
            ...current,
            [state.offerId]: false
          }));
          this.expansionErrorByOfferId.update((current) => ({
            ...current,
            [state.offerId]: ''
          }));
          this.appendExpansionToOffer(state.offerId, state.ampliacion);
          this.expandedOfferId.set(null);
          this.expansionForm.reset({
            cantidad: 1,
            plazo: this.getToday()
          });
        });
        return;
      }

      if (state.status === 'error') {
        this.expansionLoadingByOfferId.update((current) => ({
          ...current,
          [state.offerId]: false
        }));
        this.expansionErrorByOfferId.update((current) => ({
          ...current,
          [state.offerId]: state.message
        }));
      }
    });

    effect(() => {
      const state = this.statusUpdateState();

      if (state.status === 'loading') {
        this.clearStatusErrorTimer(state.offerId);
        this.statusLoadingByOfferId.update((current) => ({
          ...current,
          [state.offerId]: true
        }));
        this.statusErrorByOfferId.update((current) => ({
          ...current,
          [state.offerId]: ''
        }));
        return;
      }

      if (state.status === 'success') {
        untracked(() => {
          this.clearStatusErrorTimer(state.oferta.id);
          this.statusLoadingByOfferId.update((current) => ({
            ...current,
            [state.oferta.id]: false
          }));
          this.statusErrorByOfferId.update((current) => ({
            ...current,
            [state.oferta.id]: ''
          }));
          this.replaceOffer(state.oferta);
          this.draftEstadoByOfferId.update((current) => ({
            ...current,
            [state.oferta.id]: state.oferta.estado
          }));
        });
        return;
      }

      if (state.status === 'error') {
        this.statusLoadingByOfferId.update((current) => ({
          ...current,
          [state.offerId]: false
        }));
        this.statusErrorByOfferId.update((current) => ({
          ...current,
          [state.offerId]: state.message
        }));
        this.scheduleStatusErrorClear(state.offerId);
      }
    });
  }

  initialize(): void {
    this.loadOffers();
  }

  destroy(): void {
    this.statusErrorTimers.forEach((timerId) => clearTimeout(timerId));
    this.statusErrorTimers.clear();
  }

  toggleCreateForm(): void {
    this.showCreateForm.update((current) => !current);
    this.createErrorMessage.set('');
  }

  applyEstadoFilter(value: string): void {
    this.selectedEstado.set(value || null);
    this.loadOffers(0);
  }

  submitCreateOffer(): void {
    if (this.createOfferForm.invalid) {
      this.createOfferForm.markAllAsTouched();
      return;
    }

    this.createErrorMessage.set('');
    this.createOfferRequest.set({
      requestId: this.nextRequestId++,
      payload: this.createOfferForm.getRawValue()
    });
  }

  toggleExpansionForm(offerId: number): void {
    this.expansionErrorByOfferId.update((current) => ({
      ...current,
      [offerId]: ''
    }));
    this.expandedOfferId.update((current) => {
      const nextExpandedOfferId = current === offerId ? null : offerId;

      this.expansionForm.reset({
        cantidad: 1,
        plazo:
          nextExpandedOfferId === null
            ? this.getToday()
            : this.findOfferById(offerId)?.plazoInicial ?? this.getToday()
      });

      return nextExpandedOfferId;
    });
  }

  submitExpansion(offerId: number): void {
    if (this.expansionForm.invalid) {
      this.expansionForm.markAllAsTouched();
      return;
    }

    this.expansionRequest.set({
      requestId: this.nextRequestId++,
      offerId,
      payload: this.expansionForm.getRawValue()
    });
  }

  setDraftEstado(offerId: number, estado: string): void {
    this.draftEstadoByOfferId.update((current) => ({
      ...current,
      [offerId]: estado
    }));
  }

  updateEstado(offerId: number): void {
    const estado = this.draftEstadoByOfferId()[offerId] ?? this.findOfferById(offerId)?.estado ?? 'ACTIVO';

    this.statusUpdateRequest.set({
      requestId: this.nextRequestId++,
      offerId,
      payload: { estado }
    });
  }

  loadOffers(pageNumber = 0, silent = false): void {
    this.offerListRequest.set({
      requestId: this.nextRequestId++,
      pageNumber,
      estado: this.selectedEstado(),
      silent
    });
  }

  private findOfferById(offerId: number): OfertaLaboralResponse | null {
    return this.offers().find((offer) => offer.id === offerId) ?? null;
  }

  private syncDraftEstados(ofertas: OfertaLaboralResponse[]): void {
    this.draftEstadoByOfferId.set(Object.fromEntries(ofertas.map((oferta) => [oferta.id, oferta.estado])));
  }

  private insertOfferIntoList(oferta: OfertaLaboralResponse): void {
    const currentPage = this.offersPage();

    if (!currentPage) {
      return;
    }

    const alreadyExists = currentPage.content.some((item) => item.id === oferta.id);
    const updatedContent = upsertById(currentPage.content, oferta, {
      prependIfNew: true
    }).slice(0, currentPage.size);

    this.offersPage.set({
      ...currentPage,
      totalElements: currentPage.totalElements + (alreadyExists ? 0 : 1),
      content: updatedContent
    });
  }

  private replaceOffer(oferta: OfertaLaboralResponse): void {
    const currentPage = this.offersPage();

    if (!currentPage) {
      return;
    }

    this.offersPage.set({
      ...currentPage,
      content: upsertById(currentPage.content, oferta)
    });
  }

  private appendExpansionToOffer(offerId: number, ampliacion: OfertaAmpliacionResponse): void {
    const currentOffer = this.findOfferById(offerId);

    if (!currentOffer) {
      return;
    }

    this.replaceOffer({
      ...currentOffer,
      ampliaciones: [ampliacion, ...(currentOffer.ampliaciones ?? [])]
    });
  }

  private scheduleStatusErrorClear(offerId: number): void {
    this.clearStatusErrorTimer(offerId);
    const timerId = setTimeout(() => {
      this.statusErrorByOfferId.update((current) => ({
        ...current,
        [offerId]: ''
      }));
      this.statusErrorTimers.delete(offerId);
    }, this.statusErrorTimeoutMs);
    this.statusErrorTimers.set(offerId, timerId);
  }

  private clearStatusErrorTimer(offerId: number): void {
    const timerId = this.statusErrorTimers.get(offerId);
    if (timerId) {
      clearTimeout(timerId);
      this.statusErrorTimers.delete(offerId);
    }
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
