import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Observable, firstValueFrom, timeout } from 'rxjs';
import { SessionService } from '../../../core/services/session.service';
import { ApiErrorResponse } from '../../../shared/models/api/api-error-response';
import { PageResponse } from '../../../shared/models/common/page-response';
import { EventoResponse } from '../../../shared/models/recruitment/evento-response';
import { GrupoCapacitacionDetalleResponse } from '../../../shared/models/recruitment/grupo-capacitacion-detalle-response';
import { GrupoCapacitacionResponse } from '../../../shared/models/recruitment/grupo-capacitacion-response';
import { PostulacionResponse } from '../../../shared/models/recruitment/postulacion-response';
import { TipificacionResponse } from '../../../shared/models/recruitment/tipificacion-response';
import { TipificarPostulacionRequest } from '../../../shared/models/recruitment/tipificar-postulacion-request';
import { TrainerRecruitmentService } from '../services/trainer-recruitment.service';

type TrainerSection = 'grupos' | 'bandeja';

@Injectable()
export class TrainerWorkspaceFacade {
  private readonly requestTimeoutMs = 15000;
  private readonly formBuilder = inject(FormBuilder);
  private readonly recruitmentService = inject(TrainerRecruitmentService);
  private readonly sessionService = inject(SessionService);

  readonly section = signal<TrainerSection>('grupos');
  readonly empleadoId = computed(() => this.sessionService.session()?.empleadoId ?? null);

  readonly typifyForm = this.formBuilder.nonNullable.group({
    idTipificacion: [0, [Validators.required, Validators.min(1)]],
    idSubtipificacion: [0, [Validators.required, Validators.min(1)]],
    modalidadContacto: [''],
    observacion: ['']
  });

  readonly sinGrupoFilter = signal<boolean | null>(null);
  readonly catalogo = signal<TipificacionResponse[]>([]);
  readonly groupsPage = signal(this.emptyPage<GrupoCapacitacionResponse>());
  readonly trainingPage = signal(this.emptyPage<PostulacionResponse>());
  readonly selectedGroup = signal<GrupoCapacitacionResponse | null>(null);
  readonly selectedDetail = signal<GrupoCapacitacionDetalleResponse | null>(null);
  readonly selectedPostulacion = signal<PostulacionResponse | null>(null);
  readonly eventos = signal<EventoResponse[]>([]);

  readonly isLoadingCatalogo = signal(false);
  readonly isLoadingGroups = signal(false);
  readonly isLoadingTraining = signal(false);
  readonly isLoadingDetail = signal(false);
  readonly isLoadingEvents = signal(false);
  readonly isTypifying = signal(false);

  readonly catalogoErrorMessage = signal('');
  readonly groupsErrorMessage = signal('');
  readonly trainingErrorMessage = signal('');
  readonly detailErrorMessage = signal('');
  readonly eventsErrorMessage = signal('');
  readonly typifyErrorMessage = signal('');
  readonly typifySuccessMessage = signal('');

  readonly myGroups = computed(() => {
    const empleadoId = this.empleadoId();
    return this.groupsPage().content.filter((group) => group.idCapacitador === empleadoId);
  });
  readonly trainingRows = computed(() => this.trainingPage().content);
  readonly currentTrainingPage = computed(() => this.trainingPage().page);
  readonly totalTrainingPages = computed(() => this.trainingPage().totalPages);
  readonly selectedTipificacion = computed(() => {
    const id = Number(this.typifyForm.controls.idTipificacion.getRawValue());
    return this.catalogo().find((option) => option.id === id) ?? null;
  });
  readonly selectedSubtipificaciones = computed(() => this.selectedTipificacion()?.subtipificaciones ?? []);

  async initialize(): Promise<void> {
    await Promise.all([this.loadCatalogo(), this.loadGroups(), this.loadTrainingBoard()]);
  }

  setSection(section: TrainerSection): void {
    this.section.set(section);
  }

  async loadCatalogo(): Promise<void> {
    this.isLoadingCatalogo.set(true);
    this.catalogoErrorMessage.set('');

    try {
      const catalogo = await this.withTimeout(this.recruitmentService.obtenerCatalogoCapacitacion());
      this.catalogo.set(catalogo.tipificaciones);
    } catch (error) {
      this.catalogoErrorMessage.set(
        this.getErrorMessage(error, 'No fue posible cargar tipificaciones de capacitacion.')
      );
    } finally {
      this.isLoadingCatalogo.set(false);
    }
  }

  async loadGroups(): Promise<void> {
    this.isLoadingGroups.set(true);
    this.groupsErrorMessage.set('');

    try {
      const page = await this.withTimeout(this.recruitmentService.listarGruposAbiertos());
      this.groupsPage.set(page);
    } catch (error) {
      this.groupsErrorMessage.set(
        this.getErrorMessage(error, 'No fue posible cargar grupos abiertos.')
      );
    } finally {
      this.isLoadingGroups.set(false);
    }
  }

  async loadTrainingBoard(pageNumber = 0): Promise<void> {
    this.isLoadingTraining.set(true);
    this.trainingErrorMessage.set('');

    try {
      const page = await this.withTimeout(
        this.recruitmentService.listarBandejaCapacitacion(this.sinGrupoFilter(), pageNumber)
      );
      this.trainingPage.set(page);
    } catch (error) {
      this.trainingErrorMessage.set(
        this.getErrorMessage(error, 'No fue posible cargar bandeja de capacitacion.')
      );
    } finally {
      this.isLoadingTraining.set(false);
    }
  }

  async setSinGrupoFilter(value: string): Promise<void> {
    if (value === 'true') {
      this.sinGrupoFilter.set(true);
    } else if (value === 'false') {
      this.sinGrupoFilter.set(false);
    } else {
      this.sinGrupoFilter.set(null);
    }

    await this.loadTrainingBoard(0);
  }

  async openGroup(groupId: number): Promise<void> {
    this.isLoadingDetail.set(true);
    this.detailErrorMessage.set('');
    this.selectedDetail.set(null);

    try {
      const group = await this.withTimeout(this.recruitmentService.obtenerGrupo(groupId));
      this.selectedGroup.set(group);
    } catch (error) {
      this.detailErrorMessage.set(this.getErrorMessage(error, 'No fue posible abrir el grupo.'));
    } finally {
      this.isLoadingDetail.set(false);
    }
  }

  async selectDetail(detail: GrupoCapacitacionDetalleResponse): Promise<void> {
    this.selectedDetail.set(detail);
    this.selectedPostulacion.set(detail.postulacion);
    this.resetTypifyForm();
    await this.loadEvents(detail.postulacion.id);
  }

  async selectPostulacion(postulacion: PostulacionResponse): Promise<void> {
    this.selectedDetail.set(null);
    this.selectedPostulacion.set(postulacion);
    this.resetTypifyForm();
    if (postulacion.idGrupoCapacitacion) {
      await this.openGroup(postulacion.idGrupoCapacitacion);
    }
    await this.loadEvents(postulacion.id);
  }

  async loadEvents(idPostulacion: number): Promise<void> {
    this.isLoadingEvents.set(true);
    this.eventsErrorMessage.set('');

    try {
      const page = await this.withTimeout(this.recruitmentService.listarEventos(idPostulacion));
      this.eventos.set(page.content);
    } catch (error) {
      this.eventsErrorMessage.set(
        this.getErrorMessage(error, 'No fue posible cargar eventos de postulacion.')
      );
    } finally {
      this.isLoadingEvents.set(false);
    }
  }

  resetSubtipificacion(): void {
    this.typifyForm.controls.idSubtipificacion.setValue(0);
  }

  async submitTypification(): Promise<void> {
    const postulacion = this.selectedPostulacion();

    if (!postulacion) {
      this.typifyErrorMessage.set('Selecciona un postulante antes de tipificar.');
      return;
    }

    if (this.typifyForm.invalid) {
      this.typifyForm.markAllAsTouched();
      return;
    }

    this.isTypifying.set(true);
    this.typifyErrorMessage.set('');
    this.typifySuccessMessage.set('');

    try {
      await this.withTimeout(
        this.recruitmentService.tipificarPostulacion(postulacion.id, this.buildTypifyRequest())
      );
      this.typifySuccessMessage.set('Tipificacion de capacitacion registrada.');
      await Promise.all([
        this.loadTrainingBoard(this.currentTrainingPage()),
        postulacion.idGrupoCapacitacion ? this.openGroup(postulacion.idGrupoCapacitacion) : Promise.resolve(),
        this.loadEvents(postulacion.id)
      ]);
    } catch (error) {
      this.typifyErrorMessage.set(
        this.getErrorMessage(error, 'No se pudo registrar la tipificacion.')
      );
    } finally {
      this.isTypifying.set(false);
    }
  }

  private buildTypifyRequest(): TipificarPostulacionRequest {
    const raw = this.typifyForm.getRawValue();

    return {
      idTipificacion: Number(raw.idTipificacion),
      idSubtipificacion: Number(raw.idSubtipificacion),
      idGrupoCapacitacion: null,
      modalidadContacto: raw.modalidadContacto || null,
      observacion: raw.observacion.trim() || null
    };
  }

  private resetTypifyForm(): void {
    this.typifyErrorMessage.set('');
    this.typifySuccessMessage.set('');
    this.typifyForm.reset({
      idTipificacion: 0,
      idSubtipificacion: 0,
      modalidadContacto: '',
      observacion: ''
    });
  }

  private emptyPage<T>(): PageResponse<T> {
    return {
      content: [],
      page: 0,
      size: 12,
      totalElements: 0,
      totalPages: 1
    };
  }

  private async withTimeout<T>(observable: Observable<T>): Promise<T> {
    return await firstValueFrom(observable.pipe(timeout(this.requestTimeoutMs)));
  }

  private getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpErrorResponse) {
      const apiError = error.error as ApiErrorResponse | null;

      if (apiError?.details?.length) {
        return `${apiError.message}: ${apiError.details.join(', ')}`;
      }

      return apiError?.message ?? fallbackMessage;
    }

    return fallbackMessage;
  }
}
