import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';
import { ApiErrorResponse } from '../../../shared/models/api/api-error-response';
import { OfertaLaboralResponse } from '../../../shared/models/recruitment/oferta-laboral-response';
import { PostulacionHistorialResponse } from '../../../shared/models/recruitment/postulacion-historial-response';
import { PostulacionResponse } from '../../../shared/models/recruitment/postulacion-response';
import { ResumenSupervisorResponse } from '../../../shared/models/recruitment/resumen-supervisor-response';
import { AltaMetaPostulacionRequest } from '../../../shared/models/recruitment/alta-meta-postulacion-request';
import { EmpleadoIdentidadResponse } from '../../../shared/models/rrhh/empleado-identidad-response';
import {
  RecruitmentSupervisorService,
  SupervisorListFilters
} from '../services/recruitment-supervisor.service';
import {
  CurrentUserRecruitmentNegocioScopeService,
  RecruitmentNegocio
} from '../../../core/services/current-user-recruitment-negocio-scope.service';

export type SupervisorDrawer = 'none' | 'register' | 'detail' | 'edit';
export type SupervisorActionState = 'idle' | 'loading' | 'success' | 'error';
export type RegistrationMode = 'full' | 'meta';

export type SupervisorSummary = ResumenSupervisorResponse;

const EMPTY_SUMMARY: SupervisorSummary = {
  ingresosEsteMes: 0,
  ingresosHoy: 0,
  enProceso: 0,
  nuevosSinGestion: 0,
  sinContacto: 0,
  enGestion: 0,
  aprobadosEsteMes: 0,
  desaprobadosEsteMes: 0,
  enCapacitacion: 0
};

@Injectable()
export class RecruitmentSupervisorFacade {
  private readonly service = inject(RecruitmentSupervisorService);
  private readonly negocioScope = inject(CurrentUserRecruitmentNegocioScopeService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly requestTimeoutMs = 15000;
  private summaryRequestId = 0;
  private initialized = false;

  readonly form = this.formBuilder.nonNullable.group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    tipoDocumento: ['DNI', Validators.required],
    documento: ['', Validators.required],
    celular: ['', Validators.required],
    numeroExclusivoLlamadas: [''],
    usuarioMeta: [''],
    fechaNacimiento: ['', Validators.required],
    origen: ['COMPUTRABAJO', Validators.required],
    puestoObjetivo: ['ASESOR_VENTAS', Validators.required],
    negocio: [''],
    modalidad: [''],
    horario: [''],
    fechaPostulacion: [this.today(), Validators.required],
    idOfertaLaboral: [0]
  });

  readonly metaForm = this.formBuilder.nonNullable.group({
    usuarioMeta: ['', Validators.required],
    origen: ['FACEBOOK', Validators.required],
    puestoObjetivo: ['ASESOR_VENTAS', Validators.required],
    negocio: ['WIN', Validators.required],
    fechaPostulacion: [this.today(), Validators.required]
  });

  readonly rows = signal<PostulacionResponse[]>([]);
  readonly selectedPostulacion = signal<PostulacionResponse | null>(null);
  readonly history = signal<PostulacionHistorialResponse[]>([]);
  readonly offers = signal<OfertaLaboralResponse[]>([]);
  readonly drawer = signal<SupervisorDrawer>('none');
  readonly registrationMode = signal<RegistrationMode>('full');
  readonly listLoading = signal(false);
  readonly listError = signal('');
  readonly summary = signal<SupervisorSummary>(EMPTY_SUMMARY);
  readonly summaryLoading = signal(false);
  readonly summaryError = signal('');
  readonly historyLoading = signal(false);
  readonly historyError = signal('');
  readonly catalogLoading = signal(false);
  readonly catalogError = signal('');
  readonly actionState = signal<SupervisorActionState>('idle');
  readonly actionMessage = signal('');
  readonly actionError = signal('');
  readonly searchTerm = signal('');
  readonly etapaFilter = signal('');
  readonly estadoBandejaFilter = signal('');
  readonly negocioFilter = signal<RecruitmentNegocio>('WIN');
  readonly responsibleEmployees = signal<Record<number, EmpleadoIdentidadResponse>>({});
  readonly pageNumber = signal(0);
  readonly totalPages = signal(1);
  readonly totalElements = signal(0);
  readonly isEditing = computed(() => this.drawer() === 'edit');

  constructor() {
    effect(() => {
      const negocio = this.negocioScope.active();
      const changed = this.negocioFilter() !== negocio;
      this.negocioFilter.set(negocio);
      this.form.controls.negocio.setValue(negocio);
      this.metaForm.controls.negocio.setValue(negocio);
      if (this.initialized && changed) {
        this.rows.set([]);
        this.totalPages.set(1);
        this.totalElements.set(0);
        this.summary.set(EMPTY_SUMMARY);
        this.listError.set('');
        this.summaryError.set('');
        this.selectedPostulacion.set(null);
        this.history.set([]);
        this.drawer.set('none');
        this.load(0);
        this.loadSummary();
        this.offers.set([]);
      }
    });
  }

  readonly filteredRows = computed(() => {
    const search = this.normalize(this.searchTerm());
    if (!search) return this.rows();

    return this.rows().filter((row) => {
      const haystack = this.normalize([
        row.postulante.nombres,
        row.postulante.apellidos,
        row.postulante.documento,
        row.postulante.celular,
        row.postulante.usuarioMeta ?? '',
        row.puestoObjetivo,
        row.negocio ?? '',
        row.estadoBandeja,
        row.ultimaGestionModalidad ?? '',
        row.ultimoResultado ?? '',
        row.proximaActividadTipo ?? '',
        row.ofertaLaboral?.codigo ?? ''
      ].join(' '));
      return haystack.includes(search);
    });
  });

  initialize(): void {
    this.initialized = true;
    this.negocioFilter.set(this.negocioScope.active());
    this.load();
    this.loadSummary();
  }

  load(pageNumber = this.pageNumber()): void {
    this.listLoading.set(true);
    this.listError.set('');
    this.pageNumber.set(pageNumber);

    const filters: SupervisorListFilters = {
      pageNumber,
      pageSize: 12,
      sortBy: 'updatedAt',
      direction: 'desc',
      negocio: this.negocioFilter()
    };
    if (this.etapaFilter()) filters.etapa = this.etapaFilter();
    if (this.estadoBandejaFilter()) filters.estadoBandeja = this.estadoBandejaFilter();

    this.service.listarPostulaciones(filters).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => this.listLoading.set(false))
    ).subscribe({
      next: (page) => {
        this.rows.set(page.content);
        this.listError.set('');
        this.totalPages.set(Math.max(page.totalPages, 1));
        this.totalElements.set(page.totalElements);
        this.loadResponsibleEmployees(page.content.flatMap(row => [
          row.ultimaGestionResponsableId,
          row.idEmpleadoRegistrador
        ]));
      },
      error: (error: HttpErrorResponse) => {
        this.rows.set([]);
        this.totalPages.set(1);
        this.totalElements.set(0);
        this.listError.set(this.errorMessage(error, 'No fue posible cargar los postulantes.'));
      }
    });
  }

  refresh(): void {
    this.load(this.pageNumber());
    this.loadSummary();
  }

  handleRealtime(): void {
    this.refresh();
    const selected = this.selectedPostulacion();
    if (selected) {
      this.loadHistory(selected.postulante.id);
    }
  }

  handleCatalogRealtime(): void {
    this.loadCatalogs(true);
  }

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  setEtapaFilter(value: string): void {
    this.etapaFilter.set(value);
    this.load(0);
  }

  setEstadoBandejaFilter(value: string): void {
    this.estadoBandejaFilter.set(value);
    this.load(0);
  }

  setNegocioFilter(value: string): void {
    if (value === 'WIN' || value === 'CLARO') {
      this.negocioScope.setActive(value);
    }
  }

  openRegister(): void {
    this.registrationMode.set('full');
    this.resetForm();
    this.selectedPostulacion.set(null);
    this.actionState.set('idle');
    this.actionMessage.set('');
    this.actionError.set('');
    this.drawer.set('register');
    this.loadCatalogs();
  }

  selectRegistrationMode(mode: RegistrationMode): void {
    if (this.registrationMode() === mode) return;

    this.registrationMode.set(mode);
    if (mode === 'meta') {
      this.resetMetaForm();
    } else {
      this.resetForm();
    }
    this.actionState.set('idle');
    this.actionMessage.set('');
    this.actionError.set('');
  }

  isMetaRegistration(): boolean {
    return this.drawer() === 'register' && this.registrationMode() === 'meta';
  }

  openDetail(postulacion: PostulacionResponse): void {
    this.selectedPostulacion.set(postulacion);
    this.drawer.set('detail');
    this.actionState.set('idle');
    this.actionMessage.set('');
    this.actionError.set('');
    this.loadCatalogs();
    this.loadHistory(postulacion.postulante.id);
  }

  openEdit(): void {
    const selected = this.selectedPostulacion();
    if (!selected) return;

    this.form.patchValue({
      nombres: selected.postulante.nombres,
      apellidos: selected.postulante.apellidos,
      tipoDocumento: selected.postulante.tipoDocumento,
      documento: selected.postulante.documento,
      celular: selected.postulante.celular,
      numeroExclusivoLlamadas: selected.postulante.numeroExclusivoLlamadas ?? '',
      usuarioMeta: selected.postulante.usuarioMeta ?? '',
      fechaNacimiento: selected.postulante.fechaNacimiento,
      origen: selected.origen,
      puestoObjetivo: selected.puestoObjetivo,
      negocio: selected.negocio ?? '',
      modalidad: selected.modalidad ?? '',
      horario: selected.horario ?? '',
      fechaPostulacion: selected.fechaPostulacion,
      idOfertaLaboral: selected.ofertaLaboral?.id ?? 0
    });
    this.actionState.set('idle');
    this.actionMessage.set('');
    this.actionError.set('');
    this.drawer.set('edit');
    this.loadCatalogs();
  }

  closeDrawer(): void {
    this.drawer.set('none');
    this.selectedPostulacion.set(null);
    this.history.set([]);
    this.historyError.set('');
    this.actionState.set('idle');
    this.actionMessage.set('');
    this.actionError.set('');
  }

  save(): void {
    if (this.isMetaRegistration()) {
      this.saveMeta();
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid || this.actionState() === 'loading') return;

    const selected = this.selectedPostulacion();
    const request = this.toRequest();
    this.actionState.set('loading');
    this.actionMessage.set(selected ? 'Guardando correcciones…' : 'Registrando postulante…');
    this.actionError.set('');

    const request$ = selected
      ? this.service.actualizarPostulacion(selected.id, request)
      : this.service.registrarPostulacion(request);

    request$.pipe(timeout(this.requestTimeoutMs)).subscribe({
      next: (saved) => {
        this.selectedPostulacion.set(saved);
        this.actionState.set('success');
        this.actionMessage.set(selected ? 'Correcciones guardadas' : 'Postulante registrado');
        this.drawer.set('detail');
        this.loadHistory(saved.postulante.id);
        this.refresh();
      },
      error: (error: HttpErrorResponse) => {
        this.actionState.set('error');
        this.actionMessage.set('');
        this.actionError.set(this.errorMessage(error, 'No fue posible guardar los cambios.'));
      }
    });
  }

  private saveMeta(): void {
    this.metaForm.markAllAsTouched();
    if (this.metaForm.invalid || this.actionState() === 'loading') return;

    const value = this.metaForm.getRawValue();
    const request: AltaMetaPostulacionRequest = {
      usuarioMeta: value.usuarioMeta.trim(),
      origen: value.origen,
      puestoObjetivo: value.puestoObjetivo,
      negocio: this.negocioScope.active(),
      fechaPostulacion: value.fechaPostulacion
    };
    this.actionState.set('loading');
    this.actionMessage.set('Registrando usuario Meta…');
    this.actionError.set('');
    this.service.registrarPostulacionRapidaMeta(request).pipe(timeout(this.requestTimeoutMs)).subscribe({
      next: (saved) => {
        this.selectedPostulacion.set(saved);
        this.actionState.set('success');
        this.actionMessage.set('Postulante Meta registrado');
        this.drawer.set('detail');
        this.loadHistory(saved.postulante.id);
        this.refresh();
      },
      error: (error: HttpErrorResponse) => {
        this.actionState.set('error');
        this.actionMessage.set('');
        this.actionError.set(this.errorMessage(error, 'No fue posible registrar el usuario Meta.'));
      }
    });
  }

  associateOffer(idOfertaLaboral: number): void {
    const selected = this.selectedPostulacion();
    if (!selected || !idOfertaLaboral || this.actionState() === 'loading') return;

    this.actionState.set('loading');
    this.actionMessage.set('Asociando oferta…');
    this.actionError.set('');
    this.service.asignarOferta(selected.id, idOfertaLaboral).pipe(timeout(this.requestTimeoutMs)).subscribe({
      next: (updated) => this.completeAction(updated, 'Oferta asociada'),
      error: (error: HttpErrorResponse) => this.failAction(error, 'No fue posible asociar la oferta.')
    });
  }

  retryHistory(): void {
    const selected = this.selectedPostulacion();
    if (selected) this.loadHistory(selected.postulante.id);
  }

  nextPage(): void {
    if (this.pageNumber() + 1 < this.totalPages()) this.load(this.pageNumber() + 1);
  }

  previousPage(): void {
    if (this.pageNumber() > 0) this.load(this.pageNumber() - 1);
  }

  label(value: string | null | undefined): string {
    if (!value) return 'Pendiente';
    const horarioLabels: Record<string, string> = {
      MORNING: 'Mañana',
      AFTERNOON: 'Tarde',
      NIGHT: 'Noche'
    };
    if (horarioLabels[value]) return horarioLabels[value];
    return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }

  date(value: string | null | undefined): string {
    if (!value) return 'Pendiente';
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? (() => {
          const [year, month, day] = value.split('-').map(Number);
          return new Date(year, month - 1, day);
        })()
      : new Date(value);
    return parsed.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  dateTime(value: string | null | undefined): string {
    if (!value) return 'Pendiente';
    return new Date(value).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  compactDate(value: string | null | undefined): string {
    if (!value) return 'Pendiente';
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? (() => {
          const [year, month, day] = value.split('-').map(Number);
          return new Date(year, month - 1, day);
        })()
      : new Date(value);
    const month = parsed.toLocaleDateString('es-PE', { month: 'short' }).replace(/\./g, '').toUpperCase();
    return `${String(parsed.getDate()).padStart(2, '0')} ${month}-${String(parsed.getFullYear()).slice(-2)}`;
  }

  compactDateTime(value: string | null | undefined): string {
    if (!value) return 'Pendiente';
    const parsed = new Date(value);
    const month = parsed.toLocaleDateString('es-PE', { month: 'short' }).replace(/\./g, '').toUpperCase();
    const time = parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${String(parsed.getDate()).padStart(2, '0')} ${month}, ${time}`;
  }

  recruiterName(row: PostulacionResponse): string {
    return this.responsibleName(row.ultimaGestionResponsableId);
  }

  recruiterInitials(row: PostulacionResponse): string {
    return this.responsibleInitials(row.ultimaGestionResponsableId);
  }

  lastManagementDate(row: PostulacionResponse): string {
    return row.ultimaGestionAt ? this.compactDateTime(row.ultimaGestionAt) : 'Sin gestión registrada';
  }

  lastManagementDetail(row: PostulacionResponse): string {
    if (!row.ultimaGestionAt) return 'Aún sin contacto';
    const channel = row.ultimaGestionModalidad ? this.label(row.ultimaGestionModalidad) : 'Gestión registrada';
    const result = row.ultimoResultado ? this.label(row.ultimoResultado) : '';
    return result ? `${channel} · ${result}` : channel;
  }

  nextStep(row: PostulacionResponse): string {
    if (row.proximaActividadTipo) return this.label(row.proximaActividadTipo);
    if (row.estadoBandeja === 'POSTULANTE') return 'Pendiente de primer contacto';
    if (row.estadoBandeja === 'SIN_CONTACTO') return 'Reintentar contacto';
    return 'Sin próxima actividad';
  }

  nextStepDate(row: PostulacionResponse): string {
    return row.proximaActividadAt ? this.compactDateTime(row.proximaActividadAt) : 'Sin fecha programada';
  }

  responsibleName(id: number | null | undefined): string {
    if (!id) return 'Sin gestión registrada';
    const employee = this.responsibleEmployees()[id];
    return employee ? `${employee.nombres} ${employee.apellidos}`.trim() : `Empleado #${id}`;
  }

  responsibleInitials(id: number | null | undefined): string {
    if (!id) return '—';
    const employee = this.responsibleEmployees()[id];
    if (!employee) return 'E';
    return `${employee.nombres?.trim()?.[0] ?? ''}${employee.apellidos?.trim()?.[0] ?? ''}`.toUpperCase() || 'E';
  }

  eventResponsibleName(id: number | null | undefined): string {
    return this.responsibleName(id);
  }

  eventDate(event: { fechaHoraGestion?: string | null; createdAt: string }): string {
    return this.dateTime(event.fechaHoraGestion ?? event.createdAt);
  }

  compatibleOffers(postulacion: PostulacionResponse): OfertaLaboralResponse[] {
    return this.offers().filter(offer =>
      offer.puestoObjetivo === postulacion.puestoObjetivo
      && (!postulacion.negocio || offer.negocio === postulacion.negocio)
    );
  }

  offerAssignmentHint(postulacion: PostulacionResponse): string {
    if (postulacion.ofertaLaboral) return `Oferta actual: ${postulacion.ofertaLaboral.codigo}`;
    const count = this.compatibleOffers(postulacion).length;
    return count ? 'Solo se muestran ofertas compatibles con el objetivo y negocio.' : 'No hay ofertas compatibles disponibles.';
  }

  isNewPostulacion(row: PostulacionResponse): boolean {
    if (row.estadoBandeja !== 'POSTULANTE' || row.ultimaGestionAt || row.ultimoResultado) return false;
    const createdAt = new Date(row.createdAt).getTime();
    if (!Number.isFinite(createdAt)) return false;
    const ageInHours = (Date.now() - createdAt) / (1000 * 60 * 60);
    return ageInHours >= -1 && ageInHours <= 48;
  }

  private loadHistory(idPostulante: number): void {
    this.historyLoading.set(true);
    this.historyError.set('');
    this.service.obtenerHistorial(idPostulante).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => this.historyLoading.set(false))
    ).subscribe({
      next: (response) => {
        const history = response.postulaciones ?? [];
        this.history.set(history);
        this.loadResponsibleEmployees(history.flatMap(item => [
          item.postulacion.idEmpleadoRegistrador,
          ...item.eventos.map(event => event.idEmpleadoResponsable)
        ]));
      },
      error: (error: HttpErrorResponse) => {
        this.history.set([]);
        this.historyError.set(this.errorMessage(error, 'No fue posible cargar el historial.'));
      }
    });
  }

  private loadResponsibleEmployees(ids: Array<number | null | undefined>): void {
    const missingIds = [...new Set(ids.filter((id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0))]
      .filter(id => !this.responsibleEmployees()[id]);
    if (!missingIds.length) return;

    this.service.listarIdentidadEmpleados(missingIds).pipe(timeout(this.requestTimeoutMs)).subscribe({
      next: employees => {
        this.responsibleEmployees.update(current => employees.reduce<Record<number, EmpleadoIdentidadResponse>>(
          (directory, employee) => ({ ...directory, [employee.idEmpleado]: employee }),
          { ...current }
        ));
      }
    });
  }

  private loadCatalogs(force = false): void {
    if (!force && this.offers().length) return;
    this.catalogLoading.set(true);
    this.catalogError.set('');
    this.service.listarOfertasActivas(this.negocioScope.active()).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => this.catalogLoading.set(false)),
      catchError((error: HttpErrorResponse) => {
        this.catalogError.set(this.errorMessage(error, 'No fue posible cargar ofertas.'));
        return of([] as OfertaLaboralResponse[]);
      })
    ).subscribe((offers) => {
      this.offers.set(offers);
    });
  }

  private loadSummary(): void {
    const requestId = ++this.summaryRequestId;
    this.summaryLoading.set(true);
    this.summaryError.set('');
    this.service.obtenerResumenSupervisor(this.negocioScope.active()).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => {
        if (requestId === this.summaryRequestId) this.summaryLoading.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        if (requestId === this.summaryRequestId) {
          this.summaryError.set(this.errorMessage(error, 'No fue posible cargar el resumen.'));
        }
        return of(null);
      })
    ).subscribe((summary) => {
      if (!summary || requestId !== this.summaryRequestId) return;
      this.summary.set(summary);
    });
  }

  private completeAction(updated: PostulacionResponse, message: string): void {
    this.selectedPostulacion.set(updated);
    this.actionState.set('success');
    this.actionMessage.set(message);
    this.refresh();
    this.loadHistory(updated.postulante.id);
  }

  private failAction(error: HttpErrorResponse, fallback: string): void {
    this.actionState.set('error');
    this.actionMessage.set('');
    this.actionError.set(this.errorMessage(error, fallback));
  }

  private resetForm(): void {
    this.form.reset({
      nombres: '',
      apellidos: '',
      tipoDocumento: 'DNI',
      documento: '',
      celular: '',
      numeroExclusivoLlamadas: '',
      usuarioMeta: '',
      fechaNacimiento: '',
      origen: 'COMPUTRABAJO',
      puestoObjetivo: 'ASESOR_VENTAS',
      negocio: this.negocioScope.active(),
      modalidad: '',
      horario: '',
      fechaPostulacion: this.today(),
      idOfertaLaboral: 0
    });
  }

  private resetMetaForm(): void {
    this.metaForm.reset({
      usuarioMeta: '',
      origen: 'FACEBOOK',
      puestoObjetivo: 'ASESOR_VENTAS',
      negocio: this.negocioScope.active(),
      fechaPostulacion: this.today()
    });
  }

  private toRequest() {
    const value = this.form.getRawValue();
    return {
      idOfertaLaboral: value.idOfertaLaboral > 0 ? value.idOfertaLaboral : null,
      origen: value.origen,
      puestoObjetivo: value.puestoObjetivo,
      negocio: value.negocio || null,
      modalidad: value.modalidad || null,
      horario: value.horario || null,
      fechaPostulacion: value.fechaPostulacion,
      postulante: {
        nombres: value.nombres.trim(),
        apellidos: value.apellidos.trim(),
        tipoDocumento: value.tipoDocumento,
        documento: value.documento.trim(),
        celular: value.celular.trim(),
        numeroExclusivoLlamadas: value.numeroExclusivoLlamadas.trim() || null,
        usuarioMeta: value.usuarioMeta.trim() || null,
        fechaNacimiento: value.fechaNacimiento
      }
    };
  }

  private today(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private normalize(value: string): string {
    return value.toLocaleLowerCase('es-PE').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private errorMessage(error: HttpErrorResponse, fallback: string): string {
    const apiError = error.error as ApiErrorResponse | null;
    if (apiError?.details?.length) return `${apiError.message}: ${apiError.details.join(', ')}`;
    return apiError?.message ?? fallback;
  }
}
