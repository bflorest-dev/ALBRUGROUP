import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
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
import { ToastModule } from 'primeng/toast';
import { SessionService } from '../../../../core/services/session.service';
import { OperationalGateService } from '../../../../core/services/operational-gate.service';
import { EstadoAsistencia } from '../../../../shared/models/schedule/estado-asistencia';
import { LeadCommercialDataTabsComponent } from '../../../../shared/components/lead-commercial-data-tabs/lead-commercial-data-tabs.component';
import {
  AdicionalResponse,
  CatalogoResponse,
  EventoResponse,
  LeadContextoLookupResponse,
  LeadDetalleResponse,
  LeadVentaResponse,
  PageQuery,
  PlanResponse,
  PromocionComercialResponse,
  UbigeoItem
} from '../../../../shared/models/preventa/preventa.models';
import { LeadRealtimeService } from '../../../preventa/services/lead-realtime.service';
import { BackofficeLeadService } from '../../services/backoffice-lead.service';

type BackofficeSection = 'plataforma' | 'gestion' | 'programados';
type VisualLeadVenta = LeadVentaResponse & { isNew?: boolean; programacionGroupKey?: string };
type AdicionalSeleccionado = { idAdicional: number; cantidad: number };
type OfertaProviderOption = { id: number; nombre: string };
type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

@Component({
  selector: 'app-backoffice-workspace-page',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    DatePickerModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    PaginatorModule,
    SelectModule,
    SkeletonModule,
    TableModule,
    TabsModule,
    TagModule,
    TextareaModule,
    ToastModule,
    LeadCommercialDataTabsComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './backoffice-workspace-page.component.html',
  styleUrl: './backoffice-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackofficeWorkspacePageComponent implements OnInit, OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly operationalGateService = inject(OperationalGateService);
  private readonly sessionService = inject(SessionService);
  private readonly leadService = inject(BackofficeLeadService);
  private readonly realtimeService = inject(LeadRealtimeService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly realtimeSubscription = new Subscription();
  private readonly newRowTimers = new Map<number, number>();
  private readonly pickerDateCache = new Map<string, Date | null>();
  private initialized = false;
  private initializeInFlight = false;
  private lastAttendanceStatus: EstadoAsistencia | null = null;
  private readonly operationalGate = this.operationalGateService.createGate('backoffice-workspace');

  protected readonly pageSize = 12;
  protected readonly section = signal<BackofficeSection>('plataforma');
  protected readonly isLoading = signal(false);
  protected readonly isReconciling = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly plataformaRows = signal<VisualLeadVenta[]>([]);
  protected readonly gestionRows = signal<VisualLeadVenta[]>([]);
  protected readonly programadosRows = signal<VisualLeadVenta[]>([]);
  protected readonly detail = signal<LeadDetalleResponse | null>(null);
  protected readonly eventos = signal<EventoResponse[]>([]);
  protected readonly selectedLeadId = signal<number | null>(null);
  protected readonly totalPlataforma = signal(0);
  protected readonly totalGestion = signal(0);
  protected readonly totalProgramados = signal(0);
  protected readonly pagePlataforma = signal(0);
  protected readonly pageGestion = signal(0);
  protected readonly pageProgramados = signal(0);
  protected readonly catalogo = signal<CatalogoResponse | null>(null);
  protected readonly selectedTipificacionCode = signal('');
  protected readonly selectedSubtipificacionCode = signal('');
  protected readonly planes = signal<PlanResponse[]>([]);
  protected readonly promociones = signal<PromocionComercialResponse[]>([]);
  protected readonly adicionales = signal<AdicionalResponse[]>([]);
  protected readonly selectedOfertaProviderId = signal<number | null>(null);
  protected readonly adicionalesSeleccionados = signal<AdicionalSeleccionado[]>([]);
  protected readonly departamentos = signal<UbigeoItem[]>([]);
  protected readonly provinciasDomicilio = signal<UbigeoItem[]>([]);
  protected readonly distritosDomicilio = signal<UbigeoItem[]>([]);
  private readonly adicionalesDirty = signal(false);
  protected readonly detailDialogOpen = signal(false);
  protected readonly activeDataTab = signal('datos');
  protected readonly showComment = signal(false);
  protected readonly searchInput = signal('');
  protected readonly searchTermActive = signal('');
  protected readonly isSearching = signal(false);
  protected readonly searchLookup = signal<LeadContextoLookupResponse | null>(null);
  protected readonly todayDate = this.todayLocalDate();
  protected readonly canDisplayOperationalData = this.operationalGate.canDisplayOperationalData;
  protected readonly canMutateOperationalData = this.operationalGate.canMutateOperationalData;
  protected readonly skeletonRows = Array.from({ length: 8 });
  protected readonly tipoDocumentoOptions = ['DNI', 'CE', 'RUC'];
  protected readonly tipoDomicilioOptions = [
    'HOGAR',
    'MULTIFAMILIAR',
    'CONDOMINIO_EDIFICIO',
    'CONDOMINIO_EDIFICIO_NO_HABILITADO'
  ];
  protected readonly tipoViaOptions = ['AVENIDA', 'JIRON', 'CALLE', 'PASAJE', 'PROLONGACION'];

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
    idDepartamentoDomicilio: [0, [Validators.required, Validators.min(1)]],
    idProvinciaDomicilio: [0, [Validators.required, Validators.min(1)]],
    idDistritoDomicilio: [0, [Validators.required, Validators.min(1)]],
    ubigeoDomicilio: ['', [Validators.required]],
    tipoDomicilio: [''],
    tipoVia: [''],
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
    idProveedor: [0],
    idPlan: [0],
    idPromocionInterna: [0]
  });

  protected readonly tipificacionForm = this.fb.group({
    codigoTipificacion: ['', [Validators.required]],
    codigoSubtipificacion: ['', [Validators.required]],
    comentario: [''],
    fechaInstalacion: [''],
    fechaProgramacion: [''],
    horaProgramada: ['']
  });

  protected readonly tipificaciones = computed(() => [...(this.catalogo()?.tipificaciones ?? [])].sort((a, b) => a.orden - b.orden));
  protected readonly subtipificaciones = computed(() => {
    const codigo = this.selectedTipificacionCode();
    return [
      ...(this.catalogo()?.tipificaciones.find((tipificacion) => tipificacion.codigo === codigo)?.subtipificaciones ?? [])
    ].sort((a, b) => a.orden - b.orden);
  });
  protected readonly selectedSubtipificacion = computed(() => {
    const codigo = this.selectedSubtipificacionCode();
    return this.subtipificaciones().find((subtipificacion) => subtipificacion.codigo === codigo);
  });
  protected readonly requiresInstallDate = computed(() =>
    this.selectedTipificacionCode() === 'INSTALADO' || this.selectedSubtipificacion()?.etapaCambio === 'POSTVENTA'
  );
  protected readonly requiresProgramming = computed(() => this.selectedTipificacionCode() === 'PROGRAMADO');
  protected readonly ofertaProviderOptions = computed<OfertaProviderOption[]>(() => {
    const providersById = new Map<number, OfertaProviderOption>();
    for (const plan of this.planes()) {
      if (plan.idProveedor) {
        providersById.set(plan.idProveedor, {
          id: plan.idProveedor,
          nombre: plan.nombreProveedor ?? `Proveedor ${plan.idProveedor}`
        });
      }
    }
    return [...providersById.values()].sort((left, right) => left.nombre.localeCompare(right.nombre));
  });
  protected readonly planOptions = computed(() => {
    const idProveedor = this.selectedOfertaProviderId();
    const providerPlans = idProveedor ? this.planes().filter((plan) => plan.idProveedor === idProveedor) : [];
    return [{ id: 0, nombre: 'Sin plan' }, ...providerPlans];
  });
  protected readonly promocionOptions = computed(() => [{ id: 0, reglaComercial: 'Sin promocion' }, ...this.promociones()]);
  protected readonly ofertaAdditionalsTotal = computed(() =>
    this.adicionalesSeleccionadosView().reduce((total, adicional) => total + (adicional.precioUnitario ?? 0) * adicional.cantidad, 0)
  );

  // Regla de negocio (backend): el BackOffice solo puede registrar la oferta comercial
  // una vez por ciclo de VENTA. Se detecta replicando la validacion del backend sobre
  // el historial de eventos del lead (orden descendente, se corta al salir de VENTA).
  protected readonly ofertaYaRegistrada = computed(() => {
    for (const evento of this.eventos()) {
      if (evento.etapa !== 'VENTA') {
        break;
      }
      if (evento.accion === 'ACTUALIZACION_OFERTA_COMERCIAL') {
        return true;
      }
    }
    return false;
  });

  protected readonly adicionalDisponibles = computed(() => {
    const seleccionadosIds = new Set(this.adicionalesSeleccionados().map((item) => item.idAdicional));
    return this.adicionales().filter((adicional) => !seleccionadosIds.has(adicional.id));
  });

  protected readonly adicionalesSeleccionadosView = computed(() => {
    const catalogo = new Map(this.adicionales().map((adicional) => [adicional.id, adicional]));
    return this.adicionalesSeleccionados().map((item) => {
      const adicional = catalogo.get(item.idAdicional);
      return {
        idAdicional: item.idAdicional,
        cantidad: item.cantidad,
        nombre: adicional?.nombre ?? `Adicional #${item.idAdicional}`,
        precioUnitario: adicional?.precioUnitario ?? null
      };
    });
  });

  protected readonly hasUnsavedDataChanges = computed(
    () => this.datosForm.dirty || this.direccionForm.dirty || this.ofertaForm.dirty || this.adicionalesDirty()
  );
  protected readonly boardTitle = computed(() => {
    switch (this.section()) {
      case 'plataforma': return 'Leads disponibles';
      case 'programados': return 'Mis leads programados';
      default: return 'Mis leads en gestion';
    }
  });
  protected readonly boardSubtitle = computed(() => {
    switch (this.section()) {
      case 'plataforma': return 'Toma leads disponibles para iniciar gestion.';
      case 'programados': return 'Gestiona tus leads programados por fecha y hora cercana.';
      default: return 'Gestiona, edita, tipifica y revisa historial.';
    }
  });
  protected readonly activeRows = computed(() => {
    switch (this.section()) {
      case 'plataforma': return this.plataformaRows();
      case 'programados': return this.programadosRows();
      default: return this.gestionRows();
    }
  });
  protected readonly activeTotal = computed(() => {
    switch (this.section()) {
      case 'plataforma': return this.totalPlataforma();
      case 'programados': return this.totalProgramados();
      default: return this.totalGestion();
    }
  });
  protected readonly activePage = computed(() => {
    switch (this.section()) {
      case 'plataforma': return this.pagePlataforma();
      case 'programados': return this.pageProgramados();
      default: return this.pageGestion();
    }
  });

  constructor() {
    effect(() => {
      const status = this.operationalGateService.currentStatus();

      if (status === 'OFFLINE') {
        this.clearOperationalData();
        this.lastAttendanceStatus = status;
        return;
      }

      if (this.operationalGate.canActivateOperationalData() && !this.initialized && !this.initializeInFlight) {
        void this.initialize();
      } else if (this.operationalGate.canActivateOperationalData() && this.lastAttendanceStatus !== 'ONLINE') {
        void this.reconcile();
      }

      this.lastAttendanceStatus = status;
    });
  }

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.section.set(this.resolveSection(data['section']));
      void this.refreshCurrent(false);
    });

    this.realtimeSubscription.add(
      this.tipificacionForm.controls.codigoTipificacion.valueChanges.subscribe((codigo) => {
        this.onTipificacionSelected(codigo);
      })
    );

    this.realtimeSubscription.add(
      this.tipificacionForm.controls.codigoSubtipificacion.valueChanges.subscribe((codigo) => {
        this.onSubtipificacionSelected(codigo);
      })
    );

    if (this.operationalGate.canActivateOperationalData()) {
      void this.initialize();
    }
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
    if (!this.operationalGate.canActivateOperationalData() || this.initializeInFlight) {
      return;
    }

    this.initializeInFlight = true;
    this.isLoading.set(true);
    try {
      await Promise.all([
        this.refreshPlanes(),
        this.refreshDepartamentos(),
        this.refreshPlataforma(false),
        this.refreshGestion(false),
        this.refreshProgramados(false)
      ]);
      this.initialized = true;
      this.operationalGate.markActivated();
    } catch (error) {
      this.notify('error', this.getErrorMessage(error, 'No se pudo cargar BACKOFFICE.'));
    } finally {
      this.initializeInFlight = false;
      this.isLoading.set(false);
    }
  }

  protected async tomarLead(row: LeadVentaResponse): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }
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
    if (!this.ensureCanMutate()) {
      return;
    }
    if (this.hasUnsavedDataChanges() && this.selectedLeadId() !== idLead) {
      this.notify('warn', 'Guarda los cambios pendientes antes de gestionar otro lead.');
      return;
    }
    this.selectedLeadId.set(idLead);
    try {
      const detail = await firstValueFrom(this.leadService.obtenerDetalle(idLead));
      this.detail.set(detail);
      this.patchForms(detail);
      await Promise.all([this.refreshOfferCatalogs(detail.idPlan ?? 0), this.refreshEventos(idLead)]);
      try {
        await this.refreshTipificationCatalog();
      } catch {
        this.notify('warn', 'Detalle abierto, pero no se pudo cargar el catalogo de tipificaciones de VENTA.');
      }
      this.detailDialogOpen.set(true);
    } catch (error) {
      this.notify('error', this.getErrorMessage(error, 'No se pudo abrir el detalle.'));
    }
  }

  protected requestCloseDetail(): void {
    if (this.hasUnsavedDataChanges()) {
      this.notify('warn', 'Hay datos sin guardar. Guarda los cambios antes de cerrar.');
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

  protected guardarCambiosLead(): void {
    if (!this.ensureCanMutate()) {
      return;
    }
    const detail = this.detail();
    if (!detail) {
      return;
    }

    // La oferta comercial solo se puede registrar una vez por ciclo de VENTA:
    // si el usuario va a registrarla por primera vez, confirmamos antes de enviar.
    if (this.isOfertaChanged() && !this.ofertaYaRegistrada()) {
      this.confirmationService.confirm({
        header: 'Registrar plan ofrecido',
        message:
          'Vas a registrar el plan ofrecido. Solo se permite una vez y despues no podras cambiarlo. Revisa el plan, la promocion y los adicionales. ¿Quieres registrarlo?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Si, registrar',
        rejectLabel: 'Revisar de nuevo',
        acceptButtonStyleClass: 'p-button-warning',
        rejectButtonStyleClass: 'p-button-text',
        accept: () => void this.performSave(detail)
      });
      return;
    }

    void this.performSave(detail);
  }

  private async performSave(detail: LeadDetalleResponse): Promise<void> {
    const tasks: { label: string; action: () => Promise<void>; markPristine: () => void }[] = [];
    if (this.datosForm.dirty) {
      if (this.datosForm.invalid) {
        this.notify('warn', 'Datos Preventa incompleto: tipo y documento son obligatorios.');
        return;
      }
      tasks.push({
        label: 'Datos Preventa',
        markPristine: () => this.datosForm.markAsPristine(),
        action: () => firstValueFrom(this.leadService.actualizarDatosPreventa(detail.id, this.cleanObject(this.datosForm.getRawValue())))
      });
    }
    if (this.direccionForm.dirty) {
      if (this.direccionForm.invalid) {
        this.notify('warn', 'Direccion incompleta: ubigeo, direccion, latitud y longitud son obligatorios.');
        return;
      }
      tasks.push({
        label: 'Direccion',
        markPristine: () => this.direccionForm.markAsPristine(),
        action: () => firstValueFrom(this.leadService.actualizarDireccion(detail.id, this.getDireccionRequest()))
      });
    }
    if (this.isOfertaChanged()) {
      const raw = this.ofertaForm.getRawValue();
      const adicionales = this.adicionalesSeleccionados();
      tasks.push({
        label: 'Oferta Comercial',
        markPristine: () => {
          this.ofertaForm.markAsPristine();
          this.adicionalesDirty.set(false);
        },
        action: () =>
          firstValueFrom(
            this.leadService.actualizarOfertaComercial(detail.id, {
              idPlan: raw.idPlan || null,
              idPromocionInterna: raw.idPromocionInterna || null,
              adicionales: adicionales.length ? adicionales : null
            })
          )
      });
    }
    if (!tasks.length) {
      this.notify('info', 'No hay cambios pendientes por guardar.');
      return;
    }

    this.isSaving.set(true);
    const saved: string[] = [];
    const failed: string[] = [];
    try {
      for (const task of tasks) {
        try {
          await task.action();
          task.markPristine();
          saved.push(task.label);
        } catch (error) {
          failed.push(`${task.label}: ${this.getErrorMessage(error, 'No se pudo guardar')}`);
        }
      }
      if (failed.length) {
        this.notify('error', `Guardado parcial. OK: ${saved.join(', ') || 'ninguno'}. Fallo: ${failed.join(' | ')}`);
      } else {
        this.notify('success', `Guardado: ${saved.join(', ')}.`);
      }
      await this.reconcile(detail.id);
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async tipificar(): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }
    if (this.hasUnsavedDataChanges()) {
      this.notify('warn', 'Guarda los cambios pendientes antes de tipificar.');
      return;
    }
    if (!this.catalogo()) {
      this.notify('error', 'No se pudo cargar el catalogo de tipificaciones de VENTA.');
      return;
    }
    const detail = this.detail();
    if (!detail || this.tipificacionForm.invalid) {
      this.notify('warn', 'Selecciona tipificacion y subtipificacion.');
      return;
    }
    if (this.requiresInstallDate() && !this.tipificacionForm.controls.fechaInstalacion.value) {
      this.notify('warn', 'La fecha de instalacion es obligatoria para pasar a POSTVENTA.');
      return;
    }
    if (this.requiresProgramming()) {
      if (!this.tipificacionForm.controls.fechaProgramacion.value || !this.tipificacionForm.controls.horaProgramada.value) {
        this.notify('warn', 'Ingresa fecha y hora de programacion.');
        return;
      }
      if (this.tipificacionForm.controls.fechaProgramacion.value < this.todayLocalDate()) {
        this.notify('warn', 'La fecha de programacion no puede ser anterior a hoy.');
        return;
      }
    }
    const raw = this.tipificacionForm.getRawValue();
    await this.saveAction(
      () =>
        this.leadService.tipificarLead(detail.id, {
          codigoTipificacion: raw.codigoTipificacion,
          codigoSubtipificacion: raw.codigoSubtipificacion,
          comentario: this.showComment() ? raw.comentario || null : null,
          fechaInstalacion: this.requiresInstallDate() ? raw.fechaInstalacion || null : null,
          fechaProgramacion: this.requiresProgramming() ? raw.fechaProgramacion || null : null,
          horaProgramada: this.requiresProgramming() ? raw.horaProgramada || null : null
        }),
      'Lead tipificado.',
      async () => {
        this.closeDetail();
        await this.reconcile(detail.id);
      }
    );
  }

  protected async onPlanChanged(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const idPlan = this.ofertaForm.controls.idPlan.value;
    this.ofertaForm.controls.idPromocionInterna.setValue(0);
    await this.refreshPlanPromotions(idPlan);
  }

  protected async onOfertaProviderChanged(idProveedor: number): Promise<void> {
    this.selectedOfertaProviderId.set(idProveedor || null);
    this.ofertaForm.patchValue({
      idProveedor: idProveedor || 0,
      idPlan: 0,
      idPromocionInterna: 0
    });
    this.adicionalesSeleccionados.set([]);
    this.promociones.set([]);
    this.adicionales.set([]);
    this.adicionalesDirty.set(true);
    this.ofertaForm.markAsDirty();
    if (idProveedor) {
      await this.refreshProviderAdditionals(idProveedor);
    }
  }

  protected incrementarAdicional(adicional: AdicionalResponse): void {
    const current = this.adicionalesSeleccionados();
    const existing = current.find((item) => item.idAdicional === adicional.id);
    const updated = existing
      ? current.map((item) => (item.idAdicional === adicional.id ? { ...item, cantidad: item.cantidad + 1 } : item))
      : [...current, { idAdicional: adicional.id, cantidad: 1 }];
    this.adicionalesSeleccionados.set(updated);
    this.adicionalesDirty.set(true);
    this.ofertaForm.markAsDirty();
  }

  protected disminuirAdicional(adicional: AdicionalResponse): void {
    const updated = this.adicionalesSeleccionados()
      .map((item) => (item.idAdicional === adicional.id ? { ...item, cantidad: item.cantidad - 1 } : item))
      .filter((item) => item.cantidad > 0);
    this.adicionalesSeleccionados.set(updated);
    this.adicionalesDirty.set(true);
    this.ofertaForm.markAsDirty();
  }

  protected async changePage(pageNumber: number): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    if (this.section() === 'plataforma') {
      this.pagePlataforma.set(pageNumber);
      await this.refreshPlataforma(false);
      return;
    }
    if (this.section() === 'programados') {
      this.pageProgramados.set(pageNumber);
      await this.refreshProgramados(false);
      return;
    }
    this.pageGestion.set(pageNumber);
    await this.refreshGestion(false);
  }

  protected setSearchInput(value: string): void {
    this.searchInput.set(this.normalizeLeadNumber(value));
  }

  protected async buscarLead(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const term = this.normalizeLeadNumber(this.searchInput());
    if (!term) {
      this.notify('warn', 'Escribe el numero del lead que quieres buscar.');
      return;
    }

    this.searchInput.set(term);
    this.searchLookup.set(null);
    this.searchTermActive.set(term);
    this.pagePlataforma.set(0);
    this.isSearching.set(true);
    try {
      await this.refreshPlataforma(false);
      if (!this.plataformaRows().length) {
        const lookup = await firstValueFrom(this.leadService.buscarContextoLead(term));
        this.searchLookup.set(lookup.mensajeUsuario ? lookup : null);
      }
    } catch (error) {
      this.notify('error', this.getErrorMessage(error, 'No se pudo buscar el lead.'));
    } finally {
      this.isSearching.set(false);
    }
  }

  protected async limpiarBusqueda(): Promise<void> {
    this.searchInput.set('');
    this.searchTermActive.set('');
    this.searchLookup.set(null);
    this.pagePlataforma.set(0);
    await this.refreshPlataforma(false);
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

  protected toPickerDate(value: unknown): Date | null {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value !== 'string' || !value) {
      return null;
    }

    const cached = this.pickerDateCache.get(value);
    if (cached !== undefined) {
      return cached;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const parsed = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
    this.pickerDateCache.set(value, parsed);
    return parsed;
  }

  protected setDateControl(controlName: 'fechaInstalacion' | 'fechaProgramacion', value: Date | string | null): void {
    const control = this.tipificacionForm.controls[controlName];
    control.setValue(this.toBackendDate(value));
    control.markAsTouched();
    control.markAsDirty();
  }

  protected leadPhone(row: LeadVentaResponse | LeadDetalleResponse): string {
    return `${row.prefijo} ${row.lead}`.trim();
  }

  protected eventScheduleLabel(evento: EventoResponse): string {
    if (!evento.fechaProgramacion && !evento.horaProgramada) {
      return '-';
    }
    return `${this.formatDateOnly(evento.fechaProgramacion)} ${evento.horaProgramada ?? ''}`.trim();
  }

  protected formatDateOnly(value?: string | null): string {
    if (!value) {
      return '-';
    }
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  }

  protected programacionGroupTitle(row: LeadVentaResponse): string {
    const fecha = row.fechaProgramacion;
    const hora = row.horaProgramada;
    if (!fecha || !hora) {
      return 'Sin programacion';
    }
    const block = this.formatHourBlock(hora);
    return fecha === this.todayDate ? block : `${this.formatDateOnly(fecha)} || ${block}`;
  }

  protected programacionGroupHint(row: LeadVentaResponse): string {
    return row.fechaProgramacion === this.todayDate ? 'Hoy' : 'Programado';
  }

  protected isMine(row: LeadVentaResponse): boolean {
    const empleadoId = this.sessionService.getSession()?.empleadoId;
    return !!empleadoId && row.idAsesorAsignado === empleadoId;
  }

  protected estadoSeverity(estado: string | null | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (estado === 'GESTIONADO') return 'success';
    if (estado === 'EN_GESTION') return 'warn';
    if (estado === 'AGENDADO') return 'info';
    if (estado === 'NUEVO') return 'secondary';
    return 'info';
  }

  protected onTipificacionSelected(codigo: string | null): void {
    this.selectedTipificacionCode.set(codigo ?? '');
    this.selectedSubtipificacionCode.set('');
    this.tipificacionForm.patchValue(
      {
        codigoSubtipificacion: '',
        fechaInstalacion: '',
        fechaProgramacion: '',
        horaProgramada: ''
      },
      { emitEvent: false }
    );
  }

  protected onSubtipificacionSelected(codigo: string | null): void {
    this.selectedSubtipificacionCode.set(codigo ?? '');
    this.tipificacionForm.patchValue(
      {
        fechaInstalacion: '',
        fechaProgramacion: '',
        horaProgramada: ''
      },
      { emitEvent: false }
    );
  }

  protected onTipoDocumentoChanged(): void {
    const control = this.datosForm.controls.numeroDocumentoTitularServicio;
    this.setNumericDigits(control, control.value, this.documentoServicioMaxLength());
  }

  protected async onDepartamentoDomicilioChanged(): Promise<void> {
    const idDepartamento = this.direccionForm.controls.idDepartamentoDomicilio.value;
    this.direccionForm.patchValue({
      idProvinciaDomicilio: 0,
      idDistritoDomicilio: 0,
      ubigeoDomicilio: ''
    });
    this.provinciasDomicilio.set([]);
    this.distritosDomicilio.set([]);
    if (idDepartamento > 0) {
      await this.loadProvinciasDomicilio(idDepartamento);
    }
  }

  protected async onProvinciaDomicilioChanged(): Promise<void> {
    const idProvincia = this.direccionForm.controls.idProvinciaDomicilio.value;
    this.direccionForm.patchValue({
      idDistritoDomicilio: 0,
      ubigeoDomicilio: ''
    });
    this.distritosDomicilio.set([]);
    if (idProvincia > 0) {
      await this.loadDistritosDomicilio(idProvincia);
    }
  }

  protected onDistritoDomicilioChanged(): void {
    const idDistrito = this.direccionForm.controls.idDistritoDomicilio.value;
    const distrito = this.distritosDomicilio().find((item) => item.id === idDistrito);
    this.direccionForm.controls.ubigeoDomicilio.setValue(distrito?.codigo ?? '');
    this.direccionForm.controls.ubigeoDomicilio.markAsDirty();
  }

  protected toggleComment(): void {
    this.showComment.update((value) => !value);
  }

  private todayLocalDate(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  private resolveSection(value: unknown): BackofficeSection {
    return value === 'gestion' || value === 'programados' ? value : 'plataforma';
  }

  private toBackendDate(value: Date | string | null): string {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const month = `${value.getMonth() + 1}`.padStart(2, '0');
      const day = `${value.getDate()}`.padStart(2, '0');
      return `${value.getFullYear()}-${month}-${day}`;
    }

    return typeof value === 'string' ? value : '';
  }

  private formatHourBlock(value?: string | null): string {
    const hour = this.parseHour(value);
    if (hour === null) {
      return '-';
    }
    return `${this.formatHourLabel(hour)} - ${this.formatHourLabel(hour + 1)}`;
  }

  private parseHour(value?: string | null): number | null {
    const hour = Number(String(value ?? '').slice(0, 2));
    return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
  }

  private formatHourLabel(hour: number): string {
    const normalized = ((hour % 24) + 24) % 24;
    const suffix = normalized < 12 ? 'AM' : 'PM';
    const displayHour = normalized % 12 || 12;
    return `${displayHour}${suffix}`;
  }

  private startRealtime(): void {
    this.realtimeSubscription.add(
      this.realtimeService.watchTopic('/topic/leads/etapa/VENTA').subscribe({
        next: (event) => {
          if (this.isRelevantRealtime(event.tipo)) {
            void this.reconcile(event.idLead);
          }
        },
        error: () =>
          this.notify(
            'warn',
            'Se perdio conexion con el sistema. Si estamos en una actualizacion, recarga la pagina en unos segundos.'
          )
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
      'TIPIFICACION',
      'ATENCION_CERRADA'
    ].includes(tipo);
  }

  private async reconcile(changedLeadId?: number): Promise<void> {
    if (this.isReconciling() || !this.canDisplayOperationalData()) {
      return;
    }
    this.isReconciling.set(true);
    try {
      await Promise.all([this.refreshPlataforma(true), this.refreshGestion(true), this.refreshProgramados(true)]);
      if (changedLeadId && this.selectedLeadId() === changedLeadId) {
        await this.refreshOpenDetail(changedLeadId);
      }
    } finally {
      this.isReconciling.set(false);
    }
  }

  private async refreshCurrent(silent: boolean): Promise<void> {
    if (!this.initialized || !this.canDisplayOperationalData()) {
      return;
    }
    if (this.section() === 'plataforma') {
      await this.refreshPlataforma(silent);
      return;
    }
    if (this.section() === 'programados') {
      await this.refreshProgramados(silent);
      return;
    }
    await this.refreshGestion(silent);
  }

  private async refreshPlataforma(silent: boolean): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const previous = this.plataformaRows();
    const term = this.searchTermActive();
    const page = await firstValueFrom(this.leadService.listarPlataforma(this.currentQuery(this.pagePlataforma()), term || undefined));
    this.totalPlataforma.set(page.totalElements);
    this.plataformaRows.set(this.mergeVisualRows(previous, page.content, silent));
  }

  private async refreshGestion(silent: boolean): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const previous = this.gestionRows();
    const page = await firstValueFrom(this.leadService.listarGestion(this.currentQuery(this.pageGestion())));
    this.totalGestion.set(page.totalElements);
    this.gestionRows.set(this.mergeVisualRows(previous, page.content, silent));
  }

  private async refreshProgramados(silent: boolean): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const previous = this.programadosRows();
    const page = await firstValueFrom(this.leadService.listarProgramados(this.currentQuery(this.pageProgramados())));
    this.totalProgramados.set(page.totalElements);
    this.programadosRows.set(this.mergeVisualRows(previous, page.content.map((row) => this.withProgramacionGroup(row)), silent));
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
      this.leadService.listarEventos(idLead, this.todayDate, {
        pageNumber: 0,
        pageSize: 20,
        sortBy: 'createdAt',
        direction: 'desc'
      })
    );
    this.eventos.set(page.content);
  }

  private async refreshPlanes(): Promise<void> {
    const planes = await firstValueFrom(this.leadService.listarPlanes(undefined, true));
    this.planes.set(planes);
  }

  private async refreshDepartamentos(): Promise<void> {
    const departamentos = await firstValueFrom(this.leadService.listarDepartamentos());
    this.departamentos.set(departamentos);
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
    const idProveedor = plan?.idProveedor ?? null;
    this.selectedOfertaProviderId.set(idProveedor);
    this.ofertaForm.controls.idProveedor.setValue(idProveedor ?? 0);
    const [promociones, adicionales] = await Promise.all([
      firstValueFrom(this.leadService.listarPromociones(idPlan ? { idPlan } : {})),
      idProveedor ? firstValueFrom(this.leadService.listarAdicionales(idProveedor)) : Promise.resolve([])
    ]);
    this.promociones.set(promociones);
    this.adicionales.set(adicionales);
  }

  private async refreshPlanPromotions(idPlan: number): Promise<void> {
    const idProveedor = this.selectedOfertaProviderId() ?? undefined;
    this.promociones.set(
      await firstValueFrom(this.leadService.listarPromociones({
        idProveedor,
        ...(idPlan ? { idPlan } : {})
      }))
    );
  }

  private async refreshProviderAdditionals(idProveedor: number): Promise<void> {
    this.adicionales.set(await firstValueFrom(this.leadService.listarAdicionales(idProveedor)));
  }

  private async resolveDomicilioSelection(ubigeoDomicilio: string | null): Promise<void> {
    if (!ubigeoDomicilio) {
      this.provinciasDomicilio.set([]);
      this.distritosDomicilio.set([]);
      this.direccionForm.patchValue({
        idDepartamentoDomicilio: 0,
        idProvinciaDomicilio: 0,
        idDistritoDomicilio: 0
      });
      this.direccionForm.markAsPristine();
      return;
    }

    try {
      const departamentos = this.departamentos().length
        ? this.departamentos()
        : await firstValueFrom(this.leadService.listarDepartamentos());
      if (!this.departamentos().length) {
        this.departamentos.set(departamentos);
      }

      for (const departamento of departamentos) {
        const provincias = await firstValueFrom(this.leadService.listarProvincias(departamento.id));
        for (const provincia of provincias) {
          const distritos = await firstValueFrom(this.leadService.listarDistritos(provincia.id));
          const distrito = distritos.find((item) => item.codigo === ubigeoDomicilio);
          if (distrito) {
            this.provinciasDomicilio.set(provincias);
            this.distritosDomicilio.set(distritos);
            this.direccionForm.patchValue({
              idDepartamentoDomicilio: departamento.id,
              idProvinciaDomicilio: provincia.id,
              idDistritoDomicilio: distrito.id,
              ubigeoDomicilio
            });
            this.direccionForm.markAsPristine();
            return;
          }
        }
      }
    } catch {
      this.provinciasDomicilio.set([]);
      this.distritosDomicilio.set([]);
    }
  }

  private async loadProvinciasDomicilio(idDepartamento: number): Promise<void> {
    try {
      this.provinciasDomicilio.set(await firstValueFrom(this.leadService.listarProvincias(idDepartamento)));
    } catch (error) {
      this.notify('warn', this.getErrorMessage(error, 'No se pudieron cargar las provincias.'));
    }
  }

  private async loadDistritosDomicilio(idProvincia: number): Promise<void> {
    try {
      this.distritosDomicilio.set(await firstValueFrom(this.leadService.listarDistritos(idProvincia)));
    } catch (error) {
      this.notify('warn', this.getErrorMessage(error, 'No se pudieron cargar los distritos.'));
    }
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
      idDepartamentoDomicilio: 0,
      idProvinciaDomicilio: 0,
      idDistritoDomicilio: 0,
      ubigeoDomicilio: detail.ubigeoDomicilio ?? '',
      tipoDomicilio: detail.tipoDomicilio ?? '',
      tipoVia: detail.tipoVia ?? '',
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
    const idPlan = detail.idPlan ?? 0;
    const idProveedor = this.planes().find((plan) => plan.id === idPlan)?.idProveedor ?? null;
    this.selectedOfertaProviderId.set(idProveedor);
    this.ofertaForm.patchValue({
      idProveedor: idProveedor ?? 0,
      idPlan,
      idPromocionInterna: detail.idPromocionInterna ?? 0
    });
    this.adicionalesSeleccionados.set([]);
    this.adicionalesDirty.set(false);
    this.tipificacionForm.reset({
      codigoTipificacion: '',
      codigoSubtipificacion: '',
      comentario: '',
      fechaInstalacion: '',
      fechaProgramacion: '',
      horaProgramada: ''
    });
    this.selectedTipificacionCode.set('');
    this.selectedSubtipificacionCode.set('');
    this.showComment.set(false);
    this.activeDataTab.set('datos');
    this.markFormsPristine();
    void this.resolveDomicilioSelection(detail.ubigeoDomicilio ?? null);
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

  private withProgramacionGroup(row: LeadVentaResponse): VisualLeadVenta {
    const hour = this.parseHour(row.horaProgramada);
    return {
      ...row,
      programacionGroupKey: row.fechaProgramacion && hour !== null ? `${row.fechaProgramacion}-${hour}` : 'sin-programacion'
    };
  }

  private scheduleNewRowReset(ids: number[]): void {
    for (const id of ids) {
      const existingTimer = this.newRowTimers.get(id);
      if (existingTimer) window.clearTimeout(existingTimer);
      const timerId = window.setTimeout(() => {
        this.plataformaRows.update((rows) => rows.map((row) => (row.id === id ? { ...row, isNew: false } : row)));
        this.gestionRows.update((rows) => rows.map((row) => (row.id === id ? { ...row, isNew: false } : row)));
        this.programadosRows.update((rows) => rows.map((row) => (row.id === id ? { ...row, isNew: false } : row)));
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
    this.selectedTipificacionCode.set('');
    this.selectedSubtipificacionCode.set('');
    this.showComment.set(false);
    this.selectedOfertaProviderId.set(null);
    this.adicionalesSeleccionados.set([]);
    this.adicionalesDirty.set(false);
    this.provinciasDomicilio.set([]);
    this.distritosDomicilio.set([]);
  }

  private markFormsPristine(): void {
    this.datosForm.markAsPristine();
    this.direccionForm.markAsPristine();
    this.ofertaForm.markAsPristine();
    this.tipificacionForm.markAsPristine();
  }

  private isOfertaChanged(): boolean {
    return this.ofertaForm.dirty || this.adicionalesDirty();
  }

  private async saveAction(action: () => import('rxjs').Observable<void>, successMessage: string, afterSuccess: () => Promise<void>): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }

    this.isSaving.set(true);
    try {
      await firstValueFrom(action());
      this.notify('success', successMessage);
      await afterSuccess();
    } catch (error) {
      this.notify('error', this.getErrorMessage(error, 'No se pudo completar la operacion.'));
      await this.reconcile();
    } finally {
      this.isSaving.set(false);
    }
  }

  private normalizeLeadNumber(value?: string | null): string {
    const digits = (value ?? '').replace(/\D/g, '');
    if (!digits) {
      return '';
    }
    return digits.length > 9 ? digits.slice(-9) : digits;
  }

  private documentoServicioMaxLength(): number {
    switch (this.datosForm.controls.tipoDocumento.value) {
      case 'DNI': return 8;
      case 'RUC': return 11;
      case 'CE': return 12;
      default: return 12;
    }
  }

  private setNumericDigits(control: AbstractControl | null, value: string, maxLength: number): void {
    if (!control) {
      return;
    }
    const normalized = value.replace(/\D/g, '').slice(0, maxLength);
    if (control.value !== normalized) {
      control.setValue(normalized);
      control.markAsDirty();
    }
  }

  private getDireccionRequest() {
    const raw = this.direccionForm.getRawValue();
    return this.cleanObject({
      ubigeoDomicilio: raw.ubigeoDomicilio,
      tipoDomicilio: raw.tipoDomicilio,
      tipoVia: raw.tipoVia,
      via: raw.via,
      direccion: raw.direccion,
      referencia: raw.referencia,
      latitud: raw.latitud as number,
      longitud: raw.longitud as number,
      urbanizacion: raw.urbanizacion,
      numero: raw.numero,
      manzana: raw.manzana,
      lote: raw.lote,
      nombreEdificio: raw.nombreEdificio,
      nombreCondominio: raw.nombreCondominio,
      plano: raw.plano,
      piso: raw.piso,
      interior: raw.interior
    });
  }

  private cleanObject<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(Object.entries(value).map(([key, entryValue]) => [key, entryValue === '' ? null : entryValue])) as T;
  }

  private notify(severity: ToastSeverity, detail: string): void {
    const summary: Record<ToastSeverity, string> = {
      success: 'Listo',
      info: 'Informacion',
      warn: 'Atencion',
      error: 'Hubo un problema'
    };
    this.messageService.add({ severity, summary: summary[severity], detail, life: severity === 'error' ? 6000 : 4000 });
  }

  private ensureCanMutate(): boolean {
    if (this.canMutateOperationalData()) {
      return true;
    }

    this.notify('warn', 'Marca ONLINE para realizar esta accion.');
    return false;
  }

  private clearOperationalData(): void {
    this.operationalGate.clearActivation();
    this.initialized = false;
    this.initializeInFlight = false;
    this.isLoading.set(false);
    this.isReconciling.set(false);
    this.isSaving.set(false);
    this.plataformaRows.set([]);
    this.gestionRows.set([]);
    this.programadosRows.set([]);
    this.detail.set(null);
    this.eventos.set([]);
    this.selectedLeadId.set(null);
    this.totalPlataforma.set(0);
    this.totalGestion.set(0);
    this.totalProgramados.set(0);
    this.pagePlataforma.set(0);
    this.pageGestion.set(0);
    this.pageProgramados.set(0);
    this.detailDialogOpen.set(false);
    this.showComment.set(false);
    this.selectedOfertaProviderId.set(null);
    this.adicionalesSeleccionados.set([]);
    this.adicionalesDirty.set(false);
    this.provinciasDomicilio.set([]);
    this.distritosDomicilio.set([]);
    this.searchInput.set('');
    this.searchTermActive.set('');
    this.searchLookup.set(null);
    this.isSearching.set(false);
    this.messageService.clear();
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const responseError = (error as { error?: { message?: string; error?: string } }).error;
      return responseError?.message ?? responseError?.error ?? fallback;
    }
    return fallback;
  }
}
