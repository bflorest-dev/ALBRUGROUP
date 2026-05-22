import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { SessionService } from '../../../../core/services/session.service';
import {
  AdicionalResponse,
  CatalogoResponse,
  EventoResponse,
  LeadDetalleResponse,
  LeadVentaResponse,
  PageQuery,
  PlanResponse,
  PromocionComercialResponse
} from '../../../../shared/models/preventa/preventa.models';
import { LeadRealtimeService } from '../../../preventa/services/lead-realtime.service';
import { BackofficeLeadService } from '../../services/backoffice-lead.service';

type BackofficeSection = 'plataforma' | 'gestion';
type VisualLeadVenta = LeadVentaResponse & { isNew?: boolean };

@Component({
  selector: 'app-backoffice-workspace-page',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    PaginatorModule,
    SelectModule,
    SkeletonModule,
    TableModule,
    TabsModule,
    TagModule,
    TextareaModule
  ],
  templateUrl: './backoffice-workspace-page.component.html',
  styleUrl: './backoffice-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackofficeWorkspacePageComponent implements OnInit, OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sessionService = inject(SessionService);
  private readonly leadService = inject(BackofficeLeadService);
  private readonly realtimeService = inject(LeadRealtimeService);
  private readonly realtimeSubscription = new Subscription();
  private readonly newRowTimers = new Map<number, number>();
  private initialized = false;

  protected readonly pageSize = 12;
  protected readonly section = signal<BackofficeSection>('plataforma');
  protected readonly isLoading = signal(false);
  protected readonly isReconciling = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly plataformaRows = signal<VisualLeadVenta[]>([]);
  protected readonly gestionRows = signal<VisualLeadVenta[]>([]);
  protected readonly detail = signal<LeadDetalleResponse | null>(null);
  protected readonly eventos = signal<EventoResponse[]>([]);
  protected readonly selectedLeadId = signal<number | null>(null);
  protected readonly totalPlataforma = signal(0);
  protected readonly totalGestion = signal(0);
  protected readonly pagePlataforma = signal(0);
  protected readonly pageGestion = signal(0);
  protected readonly catalogo = signal<CatalogoResponse | null>(null);
  protected readonly selectedTipificacionCode = signal('');
  protected readonly planes = signal<PlanResponse[]>([]);
  protected readonly promociones = signal<PromocionComercialResponse[]>([]);
  protected readonly adicionales = signal<AdicionalResponse[]>([]);
  protected readonly detailDialogOpen = signal(false);
  protected readonly activeDataTab = signal('datos');
  protected readonly showComment = signal(false);
  protected readonly skeletonRows = Array.from({ length: 8 });
  protected readonly tipoDocumentoOptions = ['DNI', 'CE', 'PASAPORTE'];
  protected readonly tipoDomicilioOptions = ['CASA', 'DEPARTAMENTO', 'NEGOCIO'];
  protected readonly tipoViaOptions = ['CALLE', 'AVENIDA', 'JIRON'];

  protected readonly datosForm = this.fb.group({
    tipoDocumento: ['DNI', [Validators.required]],
    numeroDocumentoTitularServicio: ['', [Validators.required]],
    ubigeoNacimiento: [''],
    nombreTitularServicio: [''],
    celularRegistro: [''],
    celularReferencia: [''],
    correo: [''],
    nombreMadre: [''],
    nombrePadre: [''],
    numeroDocumentoTitularCelularRegistro: [''],
    nombreTitularCelularRegistro: ['']
  });

  protected readonly direccionForm = this.fb.group({
    ubigeoDomicilio: ['', [Validators.required]],
    tipoDomicilio: ['CASA'],
    tipoVia: ['CALLE'],
    via: [''],
    direccion: ['', [Validators.required]],
    referencia: [''],
    latitud: [-12.0464, [Validators.required]],
    longitud: [-77.0428, [Validators.required]],
    urbanizacion: [''],
    numero: [''],
    manzana: [''],
    lote: [''],
    nombreEdificio: [''],
    nombreCondominio: [''],
    plano: [''],
    piso: [''],
    interior: ['']
  });

  protected readonly ofertaForm = this.fb.group({
    idPlan: [0],
    idPromocionInterna: [0],
    adicionales: ['']
  });

  protected readonly tipificacionForm = this.fb.group({
    codigoTipificacion: ['', [Validators.required]],
    codigoSubtipificacion: ['', [Validators.required]],
    comentario: [''],
    fechaInstalacion: ['']
  });

  protected readonly tipificaciones = computed(() => [...(this.catalogo()?.tipificaciones ?? [])].sort((a, b) => a.orden - b.orden));
  protected readonly subtipificaciones = computed(() => {
    const codigo = this.selectedTipificacionCode();
    return [
      ...(this.catalogo()?.tipificaciones.find((tipificacion) => tipificacion.codigo === codigo)?.subtipificaciones ?? [])
    ].sort((a, b) => a.orden - b.orden);
  });
  protected readonly selectedSubtipificacion = computed(() => {
    const codigo = this.tipificacionForm.controls.codigoSubtipificacion.value;
    return this.subtipificaciones().find((subtipificacion) => subtipificacion.codigo === codigo);
  });
  protected readonly requiresInstallDate = computed(() => this.selectedSubtipificacion()?.etapaCambio === 'POSTVENTA');
  protected readonly planOptions = computed(() => [{ id: 0, nombre: 'Sin plan' }, ...this.planes()]);
  protected readonly promocionOptions = computed(() => [{ id: 0, reglaComercial: 'Sin promocion' }, ...this.promociones()]);
  protected readonly hasUnsavedDataChanges = computed(
    () => this.datosForm.dirty || this.direccionForm.dirty || this.ofertaForm.dirty
  );

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.section.set(data['section'] === 'gestion' ? 'gestion' : 'plataforma');
      void this.refreshCurrent(false);
    });

    this.realtimeSubscription.add(
      this.tipificacionForm.controls.codigoTipificacion.valueChanges.subscribe((codigo) => {
        this.selectedTipificacionCode.set(codigo);
        this.tipificacionForm.patchValue({ codigoSubtipificacion: '', fechaInstalacion: '' });
      })
    );

    void this.initialize();
    this.startRealtime();
  }

  ngOnDestroy(): void {
    this.realtimeSubscription.unsubscribe();
    for (const timerId of this.newRowTimers.values()) {
      window.clearTimeout(timerId);
    }
    this.newRowTimers.clear();
  }

  protected async initialize(): Promise<void> {
    this.isLoading.set(true);
    this.clearMessages();
    try {
      await Promise.all([this.refreshPlanes(), this.refreshPlataforma(false), this.refreshGestion(false)]);
      this.initialized = true;
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar BACKOFFICE.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async tomarLead(row: LeadVentaResponse): Promise<void> {
    await this.saveAction(
      () => this.leadService.tomarLead(row.id),
      'Lead asignado a tu gestion.',
      async () => {
        await this.reconcile();
        await this.router.navigate(['/app/backoffice/gestion']);
      }
    );
  }

  protected async openDetail(idLead: number): Promise<void> {
    if (this.hasUnsavedDataChanges() && this.selectedLeadId() !== idLead) {
      this.errorMessage.set('Guarda los cambios pendientes antes de gestionar otro lead.');
      return;
    }
    this.selectedLeadId.set(idLead);
    this.clearMessages();
    try {
      const detail = await firstValueFrom(this.leadService.obtenerDetalle(idLead));
      this.detail.set(detail);
      this.patchForms(detail);
      await Promise.all([this.refreshOfferCatalogs(detail.idPlan ?? 0), this.refreshEventos(idLead)]);
      try {
        await this.refreshTipificationCatalog();
      } catch {
        this.errorMessage.set('Detalle abierto, pero no se pudo cargar el catalogo de tipificaciones de VENTA.');
      }
      this.detailDialogOpen.set(true);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo abrir el detalle.'));
    }
  }

  protected requestCloseDetail(): void {
    if (this.hasUnsavedDataChanges()) {
      this.errorMessage.set('Hay datos sin guardar. Guarda los cambios antes de cerrar.');
      this.detailDialogOpen.set(true);
      return;
    }
    this.closeDetail();
  }

  protected async registrarContacto(): Promise<void> {
    const detail = this.detail();
    if (!detail) {
      return;
    }
    await this.saveAction(() => this.leadService.registrarContacto(detail.id), 'Contacto registrado.', () => this.reconcile(detail.id));
  }

  protected async guardarCambiosLead(): Promise<void> {
    const detail = this.detail();
    if (!detail) {
      return;
    }

    const tasks: { label: string; action: () => Promise<void>; form: { markAsPristine: () => void } }[] = [];
    if (this.datosForm.dirty) {
      if (this.datosForm.invalid) {
        this.errorMessage.set('Datos Preventa incompleto: tipo y documento son obligatorios.');
        return;
      }
      tasks.push({
        label: 'Datos Preventa',
        form: this.datosForm,
        action: () => firstValueFrom(this.leadService.actualizarDatosPreventa(detail.id, this.cleanObject(this.datosForm.getRawValue())))
      });
    }
    if (this.direccionForm.dirty) {
      if (this.direccionForm.invalid) {
        this.errorMessage.set('Direccion incompleta: ubigeo, direccion, latitud y longitud son obligatorios.');
        return;
      }
      tasks.push({
        label: 'Direccion',
        form: this.direccionForm,
        action: () => firstValueFrom(this.leadService.actualizarDireccion(detail.id, this.cleanObject(this.direccionForm.getRawValue())))
      });
    }
    if (this.ofertaForm.dirty) {
      const raw = this.ofertaForm.getRawValue();
      tasks.push({
        label: 'Oferta Comercial',
        form: this.ofertaForm,
        action: () =>
          firstValueFrom(
            this.leadService.actualizarOfertaComercial(detail.id, {
              idPlan: raw.idPlan || null,
              idPromocionInterna: raw.idPromocionInterna || null,
              adicionales: this.parseAdditionals(raw.adicionales)
            })
          )
      });
    }
    if (!tasks.length) {
      this.successMessage.set('No hay cambios pendientes por guardar.');
      return;
    }

    this.isSaving.set(true);
    this.clearMessages();
    const saved: string[] = [];
    const failed: string[] = [];
    try {
      for (const task of tasks) {
        try {
          await task.action();
          task.form.markAsPristine();
          saved.push(task.label);
        } catch (error) {
          failed.push(`${task.label}: ${this.getErrorMessage(error, 'No se pudo guardar')}`);
        }
      }
      if (failed.length) {
        this.errorMessage.set(`Guardado parcial. OK: ${saved.join(', ') || 'ninguno'}. Fallo: ${failed.join(' | ')}`);
        return;
      }
      this.successMessage.set(`Guardado: ${saved.join(', ')}.`);
      await this.reconcile(detail.id);
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async tipificar(): Promise<void> {
    if (this.hasUnsavedDataChanges()) {
      this.errorMessage.set('Guarda los cambios pendientes antes de tipificar.');
      return;
    }
    if (!this.catalogo()) {
      this.errorMessage.set('No se pudo cargar el catalogo de tipificaciones de VENTA.');
      return;
    }
    const detail = this.detail();
    if (!detail || this.tipificacionForm.invalid) {
      this.errorMessage.set('Selecciona tipificacion y subtipificacion.');
      return;
    }
    if (this.requiresInstallDate() && !this.tipificacionForm.controls.fechaInstalacion.value) {
      this.errorMessage.set('La fecha de instalacion es obligatoria para pasar a POSTVENTA.');
      return;
    }
    const raw = this.tipificacionForm.getRawValue();
    await this.saveAction(
      () =>
        this.leadService.tipificarLead(detail.id, {
          codigoTipificacion: raw.codigoTipificacion,
          codigoSubtipificacion: raw.codigoSubtipificacion,
          comentario: this.showComment() ? raw.comentario || null : null,
          fechaInstalacion: this.requiresInstallDate() ? raw.fechaInstalacion || null : null
        }),
      'Lead tipificado.',
      async () => {
        this.closeDetail();
        await this.reconcile(detail.id);
      }
    );
  }

  protected async onPlanChanged(): Promise<void> {
    await this.refreshOfferCatalogs(this.ofertaForm.controls.idPlan.value);
  }

  protected async changePage(pageNumber: number): Promise<void> {
    if (this.section() === 'plataforma') {
      this.pagePlataforma.set(pageNumber);
      await this.refreshPlataforma(false);
      return;
    }
    this.pageGestion.set(pageNumber);
    await this.refreshGestion(false);
  }

  protected display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  }

  protected money(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return `S/ ${value}`;
  }

  protected leadPhone(row: LeadVentaResponse | LeadDetalleResponse): string {
    return `${row.prefijo} ${row.lead}`.trim();
  }

  protected estadoSeverity(estado: string | null | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (estado === 'GESTIONADO') return 'success';
    if (estado === 'EN_GESTION') return 'warn';
    if (estado === 'AGENDADO') return 'info';
    if (estado === 'NUEVO') return 'secondary';
    return 'info';
  }

  protected toggleComment(): void {
    this.showComment.update((value) => !value);
  }

  private startRealtime(): void {
    this.realtimeSubscription.add(
      this.realtimeService.watchTopic('/topic/leads/etapa/VENTA').subscribe({
        next: (event) => {
          if (this.isRelevantRealtime(event.tipo)) {
            void this.reconcile(event.idLead);
          }
        },
        error: () => this.errorMessage.set('Realtime no disponible. La bandeja sigue operando por REST.')
      })
    );

    const empleadoId = this.sessionService.getSession()?.empleadoId;
    if (empleadoId) {
      this.realtimeSubscription.add(
        this.realtimeService.watchTopic(`/topic/leads/asesor/${empleadoId}`).subscribe({
          next: (event) => {
            if (this.isRelevantRealtime(event.tipo)) {
              void this.reconcile(event.idLead);
            }
          },
          error: () => undefined
        })
      );
    }
  }

  private isRelevantRealtime(tipo: string): boolean {
    return [
      'ASIGNACION',
      'CONTACTO',
      'DATOS_PREVENTA_ACTUALIZADOS',
      'DIRECCION_ACTUALIZADA',
      'OFERTA_COMERCIAL_ACTUALIZADA',
      'TIPIFICACION'
    ].includes(tipo);
  }

  private async reconcile(changedLeadId?: number): Promise<void> {
    if (this.isReconciling()) {
      return;
    }
    this.isReconciling.set(true);
    try {
      await Promise.all([this.refreshPlataforma(true), this.refreshGestion(true)]);
      if (changedLeadId && this.selectedLeadId() === changedLeadId) {
        await this.refreshOpenDetail(changedLeadId);
      }
    } finally {
      this.isReconciling.set(false);
    }
  }

  private async refreshCurrent(silent: boolean): Promise<void> {
    if (!this.initialized) {
      return;
    }
    if (this.section() === 'plataforma') {
      await this.refreshPlataforma(silent);
      return;
    }
    await this.refreshGestion(silent);
  }

  private async refreshPlataforma(silent: boolean): Promise<void> {
    const previous = this.plataformaRows();
    const page = await firstValueFrom(this.leadService.listarPlataforma(this.currentQuery(this.pagePlataforma())));
    this.totalPlataforma.set(page.totalElements);
    this.plataformaRows.set(this.mergeVisualRows(previous, page.content, silent));
  }

  private async refreshGestion(silent: boolean): Promise<void> {
    const previous = this.gestionRows();
    const page = await firstValueFrom(this.leadService.listarGestion(this.currentQuery(this.pageGestion())));
    this.totalGestion.set(page.totalElements);
    this.gestionRows.set(this.mergeVisualRows(previous, page.content, silent));
  }

  private async refreshOpenDetail(idLead: number): Promise<void> {
    try {
      const detail = await firstValueFrom(this.leadService.obtenerDetalle(idLead));
      this.detail.set(detail);
      if (!this.hasUnsavedDataChanges()) {
        this.patchForms(detail);
      }
      await this.refreshEventos(idLead);
    } catch {
      this.closeDetail();
    }
  }

  private async refreshEventos(idLead: number): Promise<void> {
    const page = await firstValueFrom(
      this.leadService.listarEventos(idLead, { pageNumber: 0, pageSize: 20, sortBy: 'createdAt', direction: 'desc' })
    );
    this.eventos.set(page.content);
  }

  private async refreshPlanes(): Promise<void> {
    const planes = await firstValueFrom(this.leadService.listarPlanes(undefined, true));
    this.planes.set(planes);
  }

  private async refreshTipificationCatalog(): Promise<void> {
    if (this.catalogo()) {
      return;
    }
    const catalogo = await firstValueFrom(this.leadService.getCatalogoTipificaciones());
    this.catalogo.set(catalogo);
  }

  private async refreshOfferCatalogs(idPlan: number): Promise<void> {
    const plan = this.planes().find((item) => item.id === idPlan);
    const idProveedor = plan?.idProveedor;
    const [promociones, adicionales] = await Promise.all([
      firstValueFrom(this.leadService.listarPromociones(idPlan ? { idPlan } : {})),
      idProveedor ? firstValueFrom(this.leadService.listarAdicionales(idProveedor)) : Promise.resolve([])
    ]);
    this.promociones.set(promociones);
    this.adicionales.set(adicionales);
  }

  private currentQuery(pageNumber: number): PageQuery {
    return { pageNumber, pageSize: this.pageSize, sortBy: 'lastEntryAt', direction: 'desc' };
  }

  private patchForms(detail: LeadDetalleResponse): void {
    this.datosForm.patchValue({
      tipoDocumento: detail.tipoDocumento ?? 'DNI',
      numeroDocumentoTitularServicio: detail.numeroDocumentoTitularServicio ?? '',
      ubigeoNacimiento: detail.ubigeoNacimiento ?? '',
      nombreTitularServicio: detail.nombreTitular ?? '',
      celularRegistro: detail.celularRegistro ?? '',
      celularReferencia: detail.celularReferencia ?? '',
      correo: detail.correo ?? '',
      nombreMadre: detail.nombreMadre ?? '',
      nombrePadre: detail.nombrePadre ?? '',
      numeroDocumentoTitularCelularRegistro: detail.numeroDocumentoTitularCelularRegistro ?? '',
      nombreTitularCelularRegistro: detail.nombreTitularCelularRegistro ?? ''
    });
    this.direccionForm.patchValue({
      ubigeoDomicilio: detail.ubigeoDomicilio ?? '',
      tipoDomicilio: detail.tipoDomicilio ?? 'CASA',
      tipoVia: detail.tipoVia ?? 'CALLE',
      via: detail.via ?? '',
      direccion: detail.direccion ?? '',
      referencia: detail.referencia ?? '',
      latitud: detail.latitud ?? -12.0464,
      longitud: detail.longitud ?? -77.0428,
      urbanizacion: detail.urbanizacion ?? '',
      numero: detail.numero ?? '',
      manzana: detail.manzana ?? '',
      lote: detail.lote ?? '',
      nombreEdificio: detail.nombreEdificio ?? '',
      nombreCondominio: detail.nombreCondominio ?? '',
      plano: detail.plano ?? '',
      piso: detail.piso ?? '',
      interior: detail.interior ?? ''
    });
    this.ofertaForm.patchValue({ idPlan: detail.idPlan ?? 0, idPromocionInterna: detail.idPromocionInterna ?? 0, adicionales: '' });
    this.tipificacionForm.reset({ codigoTipificacion: '', codigoSubtipificacion: '', comentario: '', fechaInstalacion: '' });
    this.selectedTipificacionCode.set('');
    this.showComment.set(false);
    this.activeDataTab.set('datos');
    this.markFormsPristine();
  }

  private mergeVisualRows(previous: VisualLeadVenta[], incoming: LeadVentaResponse[], animateNew: boolean): VisualLeadVenta[] {
    const previousById = new Map(previous.map((row) => [row.id, row]));
    const newIds: number[] = [];
    const rows = incoming.map((row) => {
      const previousRow = previousById.get(row.id);
      const isNew = animateNew && !previousRow;
      if (isNew) newIds.push(row.id);
      return { ...row, isNew: isNew || previousRow?.isNew };
    });
    this.scheduleNewRowReset(newIds);
    return rows;
  }

  private scheduleNewRowReset(ids: number[]): void {
    for (const id of ids) {
      const existingTimer = this.newRowTimers.get(id);
      if (existingTimer) window.clearTimeout(existingTimer);
      const timerId = window.setTimeout(() => {
        this.plataformaRows.update((rows) => rows.map((row) => (row.id === id ? { ...row, isNew: false } : row)));
        this.gestionRows.update((rows) => rows.map((row) => (row.id === id ? { ...row, isNew: false } : row)));
        this.newRowTimers.delete(id);
      }, 3500);
      this.newRowTimers.set(id, timerId);
    }
  }

  private closeDetail(): void {
    this.detailDialogOpen.set(false);
    this.detail.set(null);
    this.eventos.set([]);
    this.selectedLeadId.set(null);
    this.showComment.set(false);
  }

  private markFormsPristine(): void {
    this.datosForm.markAsPristine();
    this.direccionForm.markAsPristine();
    this.ofertaForm.markAsPristine();
    this.tipificacionForm.markAsPristine();
  }

  private async saveAction(action: () => import('rxjs').Observable<void>, successMessage: string, afterSuccess: () => Promise<void>): Promise<void> {
    this.isSaving.set(true);
    this.clearMessages();
    try {
      await firstValueFrom(action());
      this.successMessage.set(successMessage);
      await afterSuccess();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo completar la operacion.'));
      await this.reconcile();
    } finally {
      this.isSaving.set(false);
    }
  }

  private parseAdditionals(value: string): { idAdicional: number; cantidad: number }[] | null {
    const additionals = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [idAdicional, cantidad = '1'] = item.split(':');
        return { idAdicional: Number(idAdicional), cantidad: Number(cantidad) };
      })
      .filter((item) => Number.isFinite(item.idAdicional) && item.idAdicional > 0 && Number.isFinite(item.cantidad) && item.cantidad > 0);
    return additionals.length ? additionals : null;
  }

  private cleanObject<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(Object.entries(value).map(([key, entryValue]) => [key, entryValue === '' ? null : entryValue])) as T;
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const responseError = (error as { error?: { message?: string; error?: string } }).error;
      return responseError?.message ?? responseError?.error ?? fallback;
    }
    return fallback;
  }
}
