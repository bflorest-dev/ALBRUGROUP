import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from 'primeng/paginator';
import { PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SessionService } from '../../../../core/services/session.service';
import { OperationalGateService } from '../../../../core/services/operational-gate.service';
import { EstadoAsistencia } from '../../../../shared/models/schedule/estado-asistencia';
import { LeadCommercialDataTabsComponent } from '../../../../shared/components/lead-commercial-data-tabs/lead-commercial-data-tabs.component';
import { TipificationStackComponent, TipificationPaletteByCode } from '../../../../shared/components/tipification-stack/tipification-stack.component';
import { providerLogo as resolveProviderLogo } from '../../../../shared/utils/provider-logo';
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
type BackofficeGroupMode = 'SIN_AGRUPAR' | 'ESTADO' | 'ASESOR' | 'PLAN' | 'PROVEEDOR' | 'TIPIFICACION';
type BackofficeSortField = 'fechaIngresoEtapa' | 'lastEntryAt' | 'createdAt' | 'lead' | 'nombreAsesorAsignado' | 'estado';
type BackofficeSortDirection = 'asc' | 'desc';
type GestionTipificacionFilter = { label: string; value: string; codigo?: string; descripcion?: string };
type VisualLeadVenta = LeadVentaResponse & {
  isNew?: boolean;
  organizationGroupHint?: string;
  organizationGroupKey?: string;
  organizationGroupLabel?: string;
  programacionGroupKey?: string;
  // Separacion por fecha en Plataforma: etiqueta visible y clave estable para el orden interno de PrimeNG.
  fechaGroupKey?: string;
  fechaGroupLabel?: string;
  fechaGroupSortKey?: string;
};
type AdicionalSeleccionado = { idAdicional: number; cantidad: number };
type OfertaProviderOption = { id: number; nombre: string };
type ToastSeverity = 'success' | 'info' | 'warn' | 'error';
type AssignmentConflictDetails = {
  tipo?: string;
  idAsesorActual?: number | null;
  nombreAsesorActual?: string | null;
  requiereConfirmarReasignacion?: boolean;
  requiereConfirmarLeadEnGestion?: boolean;
};

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
    DrawerModule,
    InputTextModule,
    MessageModule,
    MultiSelectModule,
    PaginatorModule,
    PopoverModule,
    SelectModule,
    SkeletonModule,
    TableModule,
    TabsModule,
    TagModule,
    ToastModule,
    LeadCommercialDataTabsComponent,
    TipificationStackComponent
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
  private organizeCloseTimeout: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;
  private initializeInFlight = false;
  private lastAttendanceStatus: EstadoAsistencia | null = null;
  private detailHadOperationalAction = false;
  private readonly operationalGate = this.operationalGateService.createGate('backoffice-workspace');

  protected readonly pageSize = 12;
  protected readonly section = signal<BackofficeSection>('plataforma');
  protected readonly isLoading = signal(false);
  protected readonly isReconciling = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly leadActionId = signal<number | null>(null);
  protected readonly plataformaRows = signal<VisualLeadVenta[]>([]);
  protected readonly gestionRows = signal<VisualLeadVenta[]>([]);
  protected readonly programadosRows = signal<VisualLeadVenta[]>([]);
  protected readonly plataformaGroupingMode = signal<BackofficeGroupMode>('SIN_AGRUPAR');
  protected readonly gestionGroupingMode = signal<BackofficeGroupMode>('TIPIFICACION');
  protected readonly plataformaSortField = signal<BackofficeSortField>('fechaIngresoEtapa');
  protected readonly gestionSortField = signal<BackofficeSortField>('lastEntryAt');
  protected readonly plataformaSortDirection = signal<BackofficeSortDirection>('desc');
  protected readonly gestionSortDirection = signal<BackofficeSortDirection>('desc');
  protected readonly gestionTipificacionFilter = signal<string[]>([]);
  protected readonly detail = signal<LeadDetalleResponse | null>(null);
  // Campos que muestra el equipo del lead: se ven los visibles del equipo + los que tengan valor.
  protected readonly camposVisibles = computed<ReadonlySet<string>>(
    () => new Set((this.detail()?.camposConfig ?? []).filter((campo) => campo.visible).map((campo) => campo.campo))
  );
  protected readonly eventos = signal<EventoResponse[]>([]);
  protected readonly selectedLeadId = signal<number | null>(null);
  protected readonly totalPlataforma = signal(0);
  protected readonly totalGestion = signal(0);
  protected readonly totalProgramados = signal(0);
  protected readonly pagePlataforma = signal(0);
  protected readonly pageGestion = signal(0);
  protected readonly pageProgramados = signal(0);
  // Catálogo del modal de tipificación: es el del equipo del lead abierto (se trae por lead).
  protected readonly catalogo = signal<CatalogoResponse | null>(null);
  // Catálogo AGREGADO cross-equipo para la bandeja (paleta de color y filtro por código, ambos por
  // código, que es consistente entre equipos). No se usa para tipificar.
  protected readonly catalogoAgregado = signal<CatalogoResponse | null>(null);
  // Paleta de color por codigo de tipificacion (mismo criterio que GTR / Leads del dia): orden -> tono.
  protected readonly tipificationPaletteByCode = computed<TipificationPaletteByCode>(() => {
    const palette: TipificationPaletteByCode = {};
    const totalPalettes = 8;
    for (const tipificacion of this.catalogoAgregado()?.tipificaciones ?? []) {
      const orden = tipificacion.orden;
      palette[tipificacion.codigo.toUpperCase()] = Number.isFinite(orden) && orden > 0 ? (orden - 1) % totalPalettes : 0;
    }
    return palette;
  });
  protected readonly selectedTipificacionCode = signal('');
  protected readonly selectedSubtipificacionCode = signal('');
  protected readonly planes = signal<PlanResponse[]>([]);
  protected readonly ofertaPlanes = signal<PlanResponse[]>([]);
  protected readonly promociones = signal<PromocionComercialResponse[]>([]);
  protected readonly adicionales = signal<AdicionalResponse[]>([]);
  protected readonly selectedOfertaProviderId = signal<number | null>(null);
  protected readonly adicionalesSeleccionados = signal<AdicionalSeleccionado[]>([]);
  protected readonly departamentos = signal<UbigeoItem[]>([]);
  protected readonly provinciasDomicilio = signal<UbigeoItem[]>([]);
  protected readonly distritosDomicilio = signal<UbigeoItem[]>([]);
  private readonly adicionalesDirty = signal(false);
  protected readonly detailDrawerOpen = signal(false);
  protected readonly activeDataTab = signal('datos');
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
  protected readonly groupingModeOptions: Array<{ label: string; value: BackofficeGroupMode }> = [
    { label: 'Sin agrupar', value: 'SIN_AGRUPAR' },
    { label: 'Estado', value: 'ESTADO' },
    { label: 'Asesor', value: 'ASESOR' },
    { label: 'Plan', value: 'PLAN' },
    { label: 'Proveedor', value: 'PROVEEDOR' },
    { label: 'Tipificacion', value: 'TIPIFICACION' }
  ];
  protected readonly sortOptions: Array<{ label: string; value: BackofficeSortField }> = [
    { label: 'Fecha ingreso', value: 'fechaIngresoEtapa' },
    { label: 'Ultima actividad', value: 'lastEntryAt' },
    { label: 'Ingreso', value: 'createdAt' },
    { label: 'Lead', value: 'lead' },
    { label: 'Asesor', value: 'nombreAsesorAsignado' },
    { label: 'Estado', value: 'estado' }
  ];
  protected readonly gestionTipificacionFilterOptions = computed<GestionTipificacionFilter[]>(() => [
    { label: 'Sin tipificar', value: '__SIN_TIPIFICAR__', codigo: 'Sin tipificar', descripcion: 'Leads pendientes de primera gestion' },
    ...(this.catalogoAgregado()?.tipificaciones ?? []).map((tipificacion) => ({
      label: tipificacion.codigo,
      value: tipificacion.codigo,
      codigo: tipificacion.codigo,
      descripcion: tipificacion.descripcion
    }))
  ]);

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
    latitud: ['-12.0464' as number | string | null, [Validators.required]],
    longitud: ['-77.0428' as number | string | null, [Validators.required]],
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
    horaProgramada: [''],
    sec: [''],
    sot: ['']
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
  // Los campos del modal se activan por los comportamientos data-driven de la subtipi (no por el nombre).
  protected readonly requiresInstallDate = computed(
    () => this.selectedSubtipificacion()?.comportamientos?.includes('REQUIERE_FECHA_INSTALACION') ?? false
  );
  protected readonly requiresProgramming = computed(
    () => this.selectedSubtipificacion()?.comportamientos?.includes('REQUIERE_FECHA_PROGRAMACION') ?? false
  );
  protected readonly requiresSecSot = computed(() =>
    this.selectedSubtipificacionRequiresSecSot()
    && this.detail()?.requiereSecSotVenta === true
  );
  protected readonly ofertaProviderOptions = computed<OfertaProviderOption[]>(() => {
    const providersById = new Map<number, OfertaProviderOption>();
    for (const plan of this.ofertaPlanes()) {
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
    const providerPlans = idProveedor ? this.ofertaPlanes().filter((plan) => plan.idProveedor === idProveedor) : [];
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
    if (this.ofertaSinPlanVenta()) {
      return false;
    }
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

  protected readonly ofertaSinPlanVenta = computed(() => {
    const detail = this.detail();
    return detail?.etapa === 'VENTA' && !detail.idPlan;
  });

  protected readonly ofertaBloqueada = computed(() => this.ofertaYaRegistrada());

  protected readonly ofertaNoticeSeverity = computed<'info' | 'warn'>(() => (this.ofertaBloqueada() ? 'info' : 'warn'));

  protected readonly ofertaNoticeText = computed(() => {
    if (this.ofertaBloqueada()) {
      return 'El plan ofrecido ya fue registrado en esta venta.';
    }
    if (this.ofertaSinPlanVenta()) {
      return 'Selecciona el plan ofrecido para completar la venta.';
    }
    return 'Solo puedes registrar el plan una vez. Revisa el plan, la promocion y los adicionales antes de guardar.';
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

  // Metodo, no computed: `form.dirty` no es signal y un computed queda congelado con su primer valor.
  protected hasUnsavedDataChanges(): boolean {
    return this.datosForm.dirty || this.direccionForm.dirty || this.ofertaForm.dirty || this.adicionalesDirty();
  }
  protected readonly boardTitle = computed(() => {
    switch (this.section()) {
      case 'plataforma': return 'Leads disponibles';
      case 'programados': return 'Mis leads programados';
      default: return 'Mis leads en gestion';
    }
  });
  protected readonly boardSubtitle = computed(() => {
    switch (this.section()) {
      case 'plataforma': return 'Gestiona leads en venta y revisa quien los tiene asignados.';
      case 'programados': return 'Gestiona tus leads programados por fecha y hora cercana.';
      default: return 'Gestiona, edita, tipifica y revisa historial.';
    }
  });
  protected readonly canOrganizeActiveSection = computed(() => this.section() === 'plataforma' || this.section() === 'gestion');
  protected readonly activeGroupingMode = computed<BackofficeGroupMode>(() => {
    if (this.section() === 'plataforma') {
      return this.plataformaGroupingMode();
    }
    if (this.section() === 'gestion') {
      return this.gestionGroupingMode();
    }
    return 'SIN_AGRUPAR';
  });
  protected readonly activeSortField = computed<BackofficeSortField>(() =>
    this.section() === 'gestion' ? this.gestionSortField() : this.section() === 'programados' ? 'lastEntryAt' : this.plataformaSortField()
  );
  protected readonly activeSortDirection = computed<BackofficeSortDirection>(() =>
    this.section() === 'gestion' ? this.gestionSortDirection() : this.section() === 'programados' ? 'desc' : this.plataformaSortDirection()
  );
  protected readonly sortDirectionOptions = computed<Array<{ label: string; value: BackofficeSortDirection }>>(() =>
    this.activeSortField() === 'fechaIngresoEtapa' || this.activeSortField() === 'lastEntryAt' || this.activeSortField() === 'createdAt'
      ? [
          { label: 'Mas antiguos', value: 'asc' },
          { label: 'Mas recientes', value: 'desc' }
        ]
      : [
          { label: 'A-Z', value: 'asc' },
          { label: 'Z-A', value: 'desc' }
        ]
  );
  // La separacion por fecha (HOY / mes) solo aplica en Plataforma con la vista por defecto:
  // sin agrupacion manual y ordenado por fecha de ingreso descendente.
  protected readonly plataformaDateSeparation = computed(() =>
    this.section() === 'plataforma'
    && this.plataformaGroupingMode() === 'SIN_AGRUPAR'
    && this.plataformaSortField() === 'fechaIngresoEtapa'
    && this.plataformaSortDirection() === 'desc'
  );
  protected readonly activeRowGroupMode = computed(() =>
    this.section() === 'programados'
    || this.plataformaDateSeparation()
    || (this.canOrganizeActiveSection() && this.activeGroupingMode() !== 'SIN_AGRUPAR')
      ? 'subheader'
      : undefined
  );
  protected readonly activeGroupRowsBy = computed(() => {
    if (this.section() === 'programados') {
      return 'programacionGroupKey';
    }
    if (this.plataformaDateSeparation()) {
      return 'fechaGroupSortKey';
    }
    return this.canOrganizeActiveSection() && this.activeGroupingMode() !== 'SIN_AGRUPAR' ? 'organizationGroupKey' : undefined;
  });
  protected readonly organizationSummary = computed(() => {
    const grouping = this.groupingModeOptions.find((option) => option.value === this.activeGroupingMode())?.label ?? 'Sin agrupar';
    const sorting = this.sortOptions.find((option) => option.value === this.activeSortField())?.label ?? 'Fecha ingreso';
    const direction = this.sortDirectionOptions().find((option) => option.value === this.activeSortDirection())?.label ?? 'Mas recientes';
    const filters = this.section() === 'gestion' && this.gestionTipificacionFilter().length
      ? ` · ${this.gestionTipificacionFilter().length} tipificaciones`
      : '';
    return `${grouping} · ${sorting} (${direction})${filters}`;
  });
  protected readonly isOrganizationDefault = computed(() =>
    this.activeGroupingMode() === (this.section() === 'gestion' ? 'TIPIFICACION' : 'SIN_AGRUPAR') &&
    this.activeSortField() === (this.section() === 'plataforma' ? 'fechaIngresoEtapa' : 'lastEntryAt') &&
    this.activeSortDirection() === 'desc' &&
    (this.section() !== 'gestion' || this.gestionTipificacionFilter().length === 0)
  );
  protected readonly activeRows = computed(() => {
    if (this.plataformaDateSeparation()) {
      // PrimeNG pinta los separadores segun el orden visible. Ordenamos por bloque temporal para que
      // HOY y los meses recientes siempre queden arriba, aunque la pagina llegue mezclada por realtime.
      return this.sortedRowsForDateSeparation(this.plataformaRows().map((row) => this.withFechaGroup(row)));
    }
    let rows: VisualLeadVenta[];
    switch (this.section()) {
      case 'plataforma':
        rows = this.plataformaRows().map((row) => this.withOrganizationGroup(row, this.plataformaGroupingMode()));
        break;
      case 'programados':
        rows = this.programadosRows();
        break;
      default:
        rows = this.filterGestionRows(this.gestionRows()).map((row) => this.withOrganizationGroup(row, this.gestionGroupingMode()));
        break;
    }
    return this.sortedRowsForGrouping(rows, this.activeGroupRowsBy(), this.activeSortField(), this.activeSortDirection());
  });
  protected readonly showSecSotColumn = computed(() =>
    this.activeRows().some((row) => row.requiereSecSotVenta === true || !!row.sec || !!row.sot)
  );
  protected readonly tableColumnCount = computed(() => this.showSecSotColumn() ? 11 : 10);
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

      // Solo limpiamos con un OFFLINE CONFIRMADO por el backend; un OFFLINE "no confirmado" (estado
      // aun sin cargar / re-login) es "verificando" y no debe vaciar la bandeja.
      if (this.operationalGateService.isConfirmedOffline()) {
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

    effect(() => {
      const enabled = this.requiresSecSot() && this.canMutateOperationalData();
      this.setControlEnabled(this.tipificacionForm.controls.sec, enabled);
      this.setControlEnabled(this.tipificacionForm.controls.sot, enabled);
    });
  }

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      const nextSection = this.resolveSection(data['section']);
      if (nextSection !== this.section()) {
        this.searchInput.set('');
        this.searchTermActive.set('');
        this.searchLookup.set(null);
        this.isSearching.set(false);
      }
      this.section.set(nextSection);
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
    if (this.organizeCloseTimeout !== null) {
      clearTimeout(this.organizeCloseTimeout);
    }
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
        // La paleta y el filtro por código de la bandeja salen del catálogo agregado; si falla no bloquea.
        this.refreshTipificationCatalogAgregado().catch(() => undefined),
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
    await this.takeAndOpenLead(row);
  }

  private async takeAndOpenLead(row: LeadVentaResponse, confirmarReasignacion = false): Promise<void> {
    this.isSaving.set(true);
    this.leadActionId.set(row.id);
    try {
      await firstValueFrom(this.leadService.tomarLead(row.id, { confirmarReasignacion }));
      await this.refreshPlataforma(true);
      await this.openDetail(row.id);
    } catch (error) {
      if (!this.openTakeoverConfirmation(error, row)) {
        this.notify('error', this.getErrorMessage(error, 'No se pudo gestionar el lead.'));
        await this.reconcile();
      }
    } finally {
      this.isSaving.set(false);
      this.leadActionId.set(null);
    }
  }

  private openTakeoverConfirmation(error: unknown, row: LeadVentaResponse): boolean {
    if (!(error instanceof HttpErrorResponse) || error.status !== 409) {
      return false;
    }
    const details = (error.error as { details?: AssignmentConflictDetails } | null)?.details;
    const needsConfirmation =
      Boolean(details?.requiereConfirmarReasignacion) ||
      Boolean(details?.requiereConfirmarLeadEnGestion) ||
      details?.tipo === 'CONFIRMACION_ASIGNACION_REQUERIDA' ||
      details?.tipo === 'LEAD_EN_GESTION';
    if (!needsConfirmation) {
      return false;
    }
    const currentAdvisor = details?.nombreAsesorActual || row.nombreAsesorAsignado || 'otro Backoffice';
    this.confirmationService.confirm({
      header: 'Gestionar lead asignado',
      message: `Este lead esta siendo gestionado por ${currentAdvisor}. Si continuas, pasara a tu gestion.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Si, gestionar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => void this.takeAndOpenLead(row, true)
    });
    return true;
  }

  protected async openDetail(idLead: number): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }
    if (this.hasUnsavedDataChanges() && this.selectedLeadId() !== idLead) {
      this.notify('warn', 'Guarda los cambios pendientes antes de gestionar otro lead.');
      return;
    }
    const shouldTrackAction = this.leadActionId() === null;
    if (shouldTrackAction) {
      this.leadActionId.set(idLead);
    }
    this.selectedLeadId.set(idLead);
    try {
      const detail = await firstValueFrom(this.leadService.obtenerDetalle(idLead));
      this.detail.set(detail);
      this.detailHadOperationalAction = false;
      this.patchForms(detail);
      await Promise.all([this.refreshOfferCatalogs(detail.idPlan ?? 0), this.refreshEventos(idLead)]);
      try {
        await this.refreshTipificationCatalog(idLead);
      } catch {
        this.notify('warn', 'Detalle abierto, pero no se pudo cargar el catalogo de tipificaciones de VENTA.');
      }
      this.detailDrawerOpen.set(true);
    } catch (error) {
      this.notify('error', this.getErrorMessage(error, 'No se pudo abrir el detalle.'));
    } finally {
      if (shouldTrackAction) {
        this.leadActionId.set(null);
      }
    }
  }

  protected async requestCloseDetail(): Promise<void> {
    if (this.hasUnsavedDataChanges()) {
      this.notify('warn', 'Hay datos sin guardar. Guarda los cambios antes de cerrar.');
      this.detailDrawerOpen.set(true);
      return;
    }
    await this.releaseCurrentLeadIfIdle();
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

    if (this.isOfertaChanged() && !this.ofertaForm.controls.idPlan.value) {
      this.notify('warn', 'Selecciona un plan antes de guardar la oferta comercial.');
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
      if (!raw.idPlan) {
        this.notify('warn', 'Selecciona un plan antes de guardar la oferta comercial.');
        return;
      }
      tasks.push({
        label: 'Oferta Comercial',
        markPristine: () => {
          this.ofertaForm.markAsPristine();
          this.adicionalesDirty.set(false);
        },
        action: () =>
          firstValueFrom(
            this.leadService.actualizarOfertaComercial(detail.id, {
              idPlan: raw.idPlan,
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
        if (saved.length) {
          this.detailHadOperationalAction = true;
        }
        this.notify('error', `Guardado parcial. OK: ${saved.join(', ') || 'ninguno'}. Fallo: ${failed.join(' | ')}`);
      } else {
        this.notify('success', `Guardado: ${saved.join(', ')}.`);
        this.detailHadOperationalAction = true;
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
    // TEMPORAL: regularizacion de leads antiguos. Descomentar al cerrar la regularizacion.
    // if (this.requiresInstallDate() && !this.validateDateNotBeforeToday(
    //   this.tipificacionForm.controls.fechaInstalacion.value,
    //   'La fecha de instalacion no puede ser anterior a hoy.'
    // )) return;
    if (this.requiresProgramming()) {
      this.normalizeScheduledTime();
      if (!this.tipificacionForm.controls.fechaProgramacion.value || !this.tipificacionForm.controls.horaProgramada.value) {
        this.notify('warn', 'Ingresa fecha y hora de programacion.');
        return;
      }
      // TEMPORAL: regularizacion de leads antiguos. Descomentar al cerrar la regularizacion.
      // if (!this.validateDateNotBeforeToday(
      //   this.tipificacionForm.controls.fechaProgramacion.value,
      //   'La fecha de programacion no puede ser anterior a hoy.'
      // )) return;
    }
    const raw = this.tipificacionForm.getRawValue();
    if (this.requiresSecSot()) {
      const sec = this.resolveSecForTipification(raw.sec, detail.sec);
      const sot = this.resolveSotForTipification(raw.sot, detail.sot);
      if (!sec || !sot) {
        this.notify('warn', 'Ingresa SEC de 9 digitos y SOT de 8 digitos.');
        return;
      }
    }
    await this.saveAction(
      () =>
        this.leadService.tipificarLead(detail.id, {
          codigoTipificacion: raw.codigoTipificacion,
          codigoSubtipificacion: raw.codigoSubtipificacion,
          comentario: raw.comentario || null,
          fechaInstalacion: this.requiresInstallDate() ? raw.fechaInstalacion || null : null,
          fechaProgramacion: this.requiresProgramming() ? raw.fechaProgramacion || null : null,
          horaProgramada: this.requiresProgramming() ? raw.horaProgramada || null : null,
          sec: this.requiresSecSot() ? this.resolveSecForTipification(raw.sec, detail.sec) : null,
          sot: this.requiresSecSot() ? this.resolveSotForTipification(raw.sot, detail.sot) : null
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
      this.notify('warn', 'Escribe el lead o documento que quieres buscar.');
      return;
    }

    this.searchInput.set(term);
    this.searchLookup.set(null);
    this.searchTermActive.set(term);
    if (this.section() === 'gestion') {
      this.pageGestion.set(0);
    } else {
      this.pagePlataforma.set(0);
    }
    this.isSearching.set(true);
    try {
      if (this.section() === 'gestion') {
        await this.refreshGestion(false);
        return;
      }
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
    if (this.section() === 'gestion') {
      this.pageGestion.set(0);
      await this.refreshGestion(false);
      return;
    }
    this.pagePlataforma.set(0);
    await this.refreshPlataforma(false);
  }

  protected onOrganizeEnter(): void {
    if (this.organizeCloseTimeout !== null) {
      clearTimeout(this.organizeCloseTimeout);
      this.organizeCloseTimeout = null;
    }
  }

  protected onOrganizeLeave(popover: { hide: () => void }): void {
    this.onOrganizeEnter();
    this.organizeCloseTimeout = setTimeout(() => {
      popover.hide();
      this.organizeCloseTimeout = null;
    }, 180);
  }

  protected setActiveGroupingMode(mode: BackofficeGroupMode | null | undefined): void {
    if (!mode) {
      return;
    }
    if (this.section() === 'plataforma') {
      this.plataformaGroupingMode.set(mode);
      return;
    }
    if (this.section() === 'gestion') {
      this.gestionGroupingMode.set(mode);
    }
  }

  protected async setActiveSortField(field: BackofficeSortField | null | undefined): Promise<void> {
    if (!field) {
      return;
    }
    if (this.section() === 'gestion') {
      this.gestionSortField.set(field);
      return;
    }
    this.plataformaSortField.set(field);
    this.pagePlataforma.set(0);
    await this.refreshPlataforma(false);
  }

  protected async setActiveSortDirection(direction: BackofficeSortDirection | null | undefined): Promise<void> {
    if (!direction) {
      return;
    }
    if (this.section() === 'gestion') {
      this.gestionSortDirection.set(direction);
      return;
    }
    this.plataformaSortDirection.set(direction);
    this.pagePlataforma.set(0);
    await this.refreshPlataforma(false);
  }

  protected async clearOrganization(): Promise<void> {
    if (this.section() === 'gestion') {
      this.gestionGroupingMode.set('TIPIFICACION');
      this.gestionSortField.set('lastEntryAt');
      this.gestionSortDirection.set('desc');
      this.gestionTipificacionFilter.set([]);
      return;
    }
    this.plataformaGroupingMode.set('SIN_AGRUPAR');
    this.plataformaSortField.set('fechaIngresoEtapa');
    this.plataformaSortDirection.set('desc');
    this.pagePlataforma.set(0);
    await this.refreshPlataforma(false);
  }

  protected setGestionTipificacionFilter(values: string[] | null | undefined): void {
    this.gestionTipificacionFilter.set(values ?? []);
  }

  protected display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
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

  protected validateDateNotBeforeToday(value: string | null | undefined, message: string): boolean {
    if (value && value < this.todayLocalDate()) {
      this.notify('warn', message);
      return false;
    }
    return true;
  }

  protected setDateControl(controlName: 'fechaInstalacion' | 'fechaProgramacion', value: Date | string | null): void {
    const control = this.tipificacionForm.controls[controlName];
    control.setValue(this.toBackendDate(value));
    control.markAsTouched();
    control.markAsDirty();
  }

  protected setFixedDigits(controlName: 'sec' | 'sot', value: string, maxLength: number): void {
    const normalized = value.replace(/\D/g, '').slice(0, maxLength);
    const control = this.tipificacionForm.controls[controlName];
    if (control.value !== normalized) {
      control.setValue(normalized);
      control.markAsDirty();
    }
  }

  protected leadPhone(row: LeadVentaResponse | LeadDetalleResponse): string {
    return `${row.prefijo} ${row.lead}`.trim();
  }

  protected leadCountryCode(row: LeadVentaResponse | LeadDetalleResponse): string {
    return row.prefijo === '+51' ? 'PE' : (row.prefijo ?? '').replace(/^\+/, '');
  }

  protected assignedShortName(value?: string | null): string {
    const words = (value ?? '').trim().split(/\s+/).filter(Boolean);
    return words.length ? words.slice(0, 2).join(' ') : '-';
  }

  protected isLeadActionLoading(idLead: number): boolean {
    return this.leadActionId() === idLead;
  }

  protected leadProviderLabel(lead: LeadDetalleResponse): string {
    return this.display(lead.nombreProveedorPlan ?? lead.nombreProveedorCampana ?? lead.nombreProveedorEquipo ?? lead.nombreCampana);
  }

  protected leadDocumentLabel(lead: LeadDetalleResponse): string {
    const tipo = this.display(lead.tipoDocumento).replace('-', '').trim();
    const numero = this.display(lead.numeroDocumentoTitularServicio).replace('-', '').trim();
    return [tipo, numero].filter(Boolean).join(' ') || '-';
  }

  protected leadAddressSummary(lead: LeadDetalleResponse): string {
    const parts = [lead.direccion, lead.distritoDomicilio, lead.provinciaDomicilio, lead.departamentoDomicilio]
      .map((part) => String(part ?? '').trim())
      .filter(Boolean);
    return parts.length ? parts.join(' · ') : '-';
  }

  protected ultimaGestionValue(row: LeadVentaResponse): string | null | undefined {
    return row.fechaUltimaGestion ?? row.ultimaTipificacionAt;
  }

  // Logo del proveedor del plan ofrecido (WIN/CLARO). Devuelve string estable (o null): seguro en template.
  protected providerLogo(nombreProveedor?: string | null): string | null {
    return resolveProviderLogo(nombreProveedor);
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

  protected organizationGroupTitle(row: VisualLeadVenta): string {
    return row.organizationGroupLabel ?? 'Sin agrupar';
  }

  protected organizationGroupHint(row: VisualLeadVenta): string {
    return row.organizationGroupHint ?? 'Organizacion';
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
    // Los campos de fecha/hora dependen del comportamiento de la SUBTIPI: al cambiar de tipi se limpian y
    // se pre-cargan al elegir la subtipi (ver onSubtipificacionSelected).
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
    const detail = this.detail();
    const prog = this.requiresProgramming();
    this.tipificacionForm.patchValue(
      {
        fechaInstalacion: '',
        fechaProgramacion: prog
          ? this.tipificacionForm.controls.fechaProgramacion.value || detail?.fechaProgramacion || ''
          : '',
        horaProgramada: prog
          ? this.tipificacionForm.controls.horaProgramada.value || detail?.horaProgramada || this.defaultProgrammingTime()
          : ''
      },
      { emitEvent: false }
    );
  }

  private defaultProgrammingTime(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:00`;
  }

  protected normalizeScheduledTime(): void {
    const control = this.tipificacionForm.controls.horaProgramada;
    const normalized = this.roundToQuarterHour(control.value);
    if (!normalized || normalized === control.value) {
      return;
    }
    control.setValue(normalized, { emitEvent: false });
    control.markAsDirty();
    control.markAsTouched();
  }

  private roundToQuarterHour(value: string | null): string {
    if (!value) {
      return '';
    }
    const match = /^(\d{1,2}):(\d{1,2})/.exec(String(value).trim());
    if (!match) {
      return value;
    }
    let hour = Math.min(23, Math.max(0, Number(match[1])));
    const minute = Math.min(59, Math.max(0, Number(match[2])));
    let roundedMinute = Math.round(minute / 15) * 15;
    if (roundedMinute === 60) {
      hour = (hour + 1) % 24;
      roundedMinute = 0;
    }
    return `${String(hour).padStart(2, '0')}:${String(roundedMinute).padStart(2, '0')}`;
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

  private todayLocalDate(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  private resolveSection(value: unknown): BackofficeSection {
    return value === 'programados' ? value : 'plataforma';
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
    const blockStart = this.programacionBlockStart(hour);
    return `${this.formatHourLabel(blockStart)} - ${this.formatHourLabel(blockStart + 2)}`;
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

  private programacionBlockStart(hour: number): number {
    return Math.floor(hour / 2) * 2;
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
    const term = this.searchTermActive();
    const page = await firstValueFrom(this.leadService.listarGestion(this.currentQuery(this.pageGestion()), term || undefined));
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

  // Catálogo del modal: del equipo del lead abierto (lo resuelve el backend desde el lead). Se re-trae por
  // lead (sin cachear) porque distintos leads pueden ser de equipos con matrices distintas.
  private async refreshTipificationCatalog(idLead: number): Promise<void> {
    this.catalogo.set(await firstValueFrom(this.leadService.getCatalogoTipificaciones(idLead)));
  }

  // Catálogo agregado cross-equipo para la bandeja (paleta + filtro por código).
  private async refreshTipificationCatalogAgregado(): Promise<void> {
    this.catalogoAgregado.set(await firstValueFrom(this.leadService.getCatalogoAgregado('VENTA')));
  }

  private async refreshOfferCatalogs(idPlan: number): Promise<void> {
    const idLead = this.selectedLeadId();
    const ofertaPlanes = idLead
      ? await firstValueFrom(this.leadService.listarPlanesOferta(idLead))
      : this.planes();
    this.ofertaPlanes.set(ofertaPlanes);
    const plan = ofertaPlanes.find((item) => item.id === idPlan);
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
    return {
      pageNumber,
      pageSize: this.pageSize,
      sortBy: this.section() === 'plataforma' ? this.plataformaSortField() : 'lastEntryAt',
      direction: this.section() === 'plataforma' ? this.plataformaSortDirection() : 'desc'
    };
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
      latitud: this.toCoordinateValue(detail.latitud ?? '-12.0464'),
      longitud: this.toCoordinateValue(detail.longitud ?? '-77.0428'),
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
    const idProveedor = this.ofertaPlanes().find((plan) => plan.id === idPlan)?.idProveedor
      ?? this.planes().find((plan) => plan.id === idPlan)?.idProveedor
      ?? null;
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
      horaProgramada: '',
      sec: detail.sec ?? '',
      sot: detail.sot ?? ''
    });
    this.selectedTipificacionCode.set('');
    this.selectedSubtipificacionCode.set('');
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

  private readonly monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  private withFechaGroup(row: VisualLeadVenta): VisualLeadVenta {
    const key = this.fechaGroupKeyFor(this.fechaIngresoEtapaValue(row));
    return {
      ...row,
      fechaGroupKey: key,
      fechaGroupLabel: this.fechaGroupLabelFor(key),
      fechaGroupSortKey: this.fechaGroupSortKeyFor(key)
    };
  }

  private fechaGroupKeyFor(iso?: string | null): string {
    const date = iso ? new Date(iso) : null;
    if (!date || Number.isNaN(date.getTime())) {
      return 'SIN_FECHA';
    }
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const localDate = `${date.getFullYear()}-${month}-${day}`;
    return localDate === this.todayDate ? 'HOY' : localDate.slice(0, 7);
  }

  private fechaGroupLabelFor(key: string): string {
    if (key === 'HOY') {
      return 'Hoy';
    }
    if (key === 'SIN_FECHA') {
      return 'Sin fecha de ingreso';
    }
    const [year, month] = key.split('-').map(Number);
    const label = this.monthNames[(month - 1) % 12] ?? key;
    return year === new Date().getFullYear() ? label : `${label} ${year}`;
  }

  private fechaGroupSortKeyFor(key: string): string {
    if (key === 'HOY') {
      return '000-HOY';
    }
    if (key === 'SIN_FECHA') {
      return '999-SIN-FECHA';
    }
    const [year, month] = key.split('-').map(Number);
    if (!year || !month) {
      return '998-FECHA-INVALIDA';
    }
    const invertedMonthRank = 999999 - (year * 12 + month);
    return `100-${String(invertedMonthRank).padStart(6, '0')}`;
  }

  private withProgramacionGroup(row: LeadVentaResponse): VisualLeadVenta {
    const hour = this.parseHour(row.horaProgramada);
    const blockStart = hour === null ? null : this.programacionBlockStart(hour);
    return {
      ...row,
      programacionGroupKey: row.fechaProgramacion && blockStart !== null ? `${row.fechaProgramacion}-${blockStart}` : 'sin-programacion'
    };
  }

  private filterGestionRows(rows: VisualLeadVenta[]): VisualLeadVenta[] {
    const selected = this.gestionTipificacionFilter();
    if (!selected.length) {
      return rows;
    }
    const selectedSet = new Set(selected.map((value) => value.toLocaleUpperCase()));
    return rows.filter((row) => {
      const code = row.codigoTipificacion?.trim();
      if (!code) {
        return selectedSet.has('__SIN_TIPIFICAR__');
      }
      return selectedSet.has(code.toLocaleUpperCase());
    });
  }

  private withOrganizationGroup(row: VisualLeadVenta, mode: BackofficeGroupMode): VisualLeadVenta {
    if (mode === 'SIN_AGRUPAR') {
      return {
        ...row,
        organizationGroupHint: undefined,
        organizationGroupKey: undefined,
        organizationGroupLabel: undefined
      };
    }

    const group = this.resolveOrganizationGroup(row, mode);
    return {
      ...row,
      organizationGroupHint: group.hint,
      organizationGroupKey: `${mode}:${group.key}`,
      organizationGroupLabel: group.label
    };
  }

  private resolveOrganizationGroup(row: LeadVentaResponse, mode: BackofficeGroupMode): { hint: string; key: string; label: string } {
    switch (mode) {
      case 'ESTADO':
        return this.groupValue('Estado', row.estadoSeguimiento, 'Sin estado');
      case 'ASESOR':
        return this.groupValue('Asesor', row.nombreAsesorAsignado, 'Sin asesor');
      case 'PLAN':
        return this.groupValue('Plan', row.nombrePlanSnapshot, 'Sin plan');
      case 'PROVEEDOR':
        return this.groupValue('Proveedor', row.nombreProveedorSnapshot, 'Sin proveedor');
      case 'TIPIFICACION':
        return this.tipificacionGroupValue(row);
      default:
        return this.groupValue('Organizacion', null, 'Sin agrupar');
    }
  }

  private tipificacionGroupValue(row: LeadVentaResponse): { hint: string; key: string; label: string } {
    const code = row.codigoTipificacion?.trim();
    if (!code) {
      return { hint: 'Tipificacion', key: '00:SIN_TIPIFICAR', label: 'Sin tipificar' };
    }
    const upperCode = code.toLocaleUpperCase();
    if (upperCode === 'PROGRAMADO') {
      return { hint: 'Tipificacion', key: `01:${upperCode}`, label: code };
    }
    return { hint: 'Tipificacion', key: `10:${upperCode}`, label: code };
  }

  private groupValue(hint: string, value: unknown, emptyLabel: string): { hint: string; key: string; label: string } {
    const label = value === null || value === undefined || value === '' ? emptyLabel : String(value);
    return { hint, key: label.toLocaleUpperCase(), label };
  }

  private sortedRowsForGrouping(
    rows: VisualLeadVenta[],
    groupRowsBy: string | undefined,
    sortField: BackofficeSortField,
    sortDirection: BackofficeSortDirection
  ): VisualLeadVenta[] {
    return [...rows].sort((left, right) => {
      if (groupRowsBy) {
        const groupCompare = this.groupSortValue(left, groupRowsBy).localeCompare(this.groupSortValue(right, groupRowsBy));
        if (groupCompare !== 0) {
          return groupCompare;
        }
      }
      return this.compareRows(left, right, sortField, sortDirection);
    });
  }

  private groupSortValue(row: VisualLeadVenta, groupRowsBy: string): string {
    return String(row[groupRowsBy as keyof VisualLeadVenta] ?? '');
  }

  private sortedRowsForDateSeparation(rows: VisualLeadVenta[]): VisualLeadVenta[] {
    return [...rows].sort((left, right) => {
      const groupCompare = this.fechaGroupRank(left) - this.fechaGroupRank(right);
      if (groupCompare !== 0) {
        return groupCompare;
      }
      return this.fechaIngresoEtapaTime(right) - this.fechaIngresoEtapaTime(left);
    });
  }

  private fechaGroupRank(row: VisualLeadVenta): number {
    const key = row.fechaGroupKey ?? this.fechaGroupKeyFor(this.fechaIngresoEtapaValue(row));
    if (key === 'HOY') {
      return Number.MIN_SAFE_INTEGER;
    }
    if (key === 'SIN_FECHA') {
      return Number.MAX_SAFE_INTEGER;
    }
    const [year, month] = key.split('-').map(Number);
    if (!year || !month) {
      return Number.MAX_SAFE_INTEGER - 1;
    }
    return -(year * 12 + month);
  }

  private compareRows(left: LeadVentaResponse, right: LeadVentaResponse, field: BackofficeSortField, direction: BackofficeSortDirection): number {
    const multiplier = direction === 'asc' ? 1 : -1;
    if (field === 'fechaIngresoEtapa' || field === 'lastEntryAt' || field === 'createdAt') {
      return (this.rowDateValue(left, field) - this.rowDateValue(right, field)) * multiplier;
    }
    return this.rowTextValue(left, field).localeCompare(this.rowTextValue(right, field)) * multiplier;
  }

  private rowDateValue(row: LeadVentaResponse, field: 'fechaIngresoEtapa' | 'lastEntryAt' | 'createdAt'): number {
    const raw = field === 'fechaIngresoEtapa' ? this.fechaIngresoEtapaValue(row) : row[field];
    const time = raw ? new Date(raw).getTime() : 0;
    return Number.isFinite(time) ? time : 0;
  }

  protected fechaIngresoEtapaValue(row: LeadVentaResponse): string | null | undefined {
    return row.fechaIngresoEtapa ?? row.lastEntryAt;
  }

  private fechaIngresoEtapaTime(row: LeadVentaResponse): number {
    const raw = this.fechaIngresoEtapaValue(row);
    const time = raw ? new Date(raw).getTime() : 0;
    return Number.isFinite(time) ? time : 0;
  }

  private selectedSubtipificacionRequiresSecSot(): boolean {
    if (this.selectedSubtipificacion()?.comportamientos?.includes('REQUIERE_SEC_SOT')) {
      return true;
    }
    const codigo = this.selectedTipificacionCode().trim().toUpperCase();
    return codigo === 'SUBIDO' || codigo === 'INGRESADO';
  }

  private rowTextValue(row: LeadVentaResponse, field: BackofficeSortField): string {
    if (field === 'estado') {
      return String(row.estadoSeguimiento ?? '');
    }
    return String(row[field] ?? '');
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

  private async releaseCurrentLeadIfIdle(): Promise<void> {
    const detail = this.detail();
    const idLead = this.selectedLeadId();
    const empleadoId = this.sessionService.getSession()?.empleadoId;
    if (!detail || !idLead || this.detailHadOperationalAction || detail.idAsesorAsignado !== empleadoId) {
      return;
    }

    this.isSaving.set(true);
    try {
      await firstValueFrom(this.leadService.liberarAsignacion(idLead));
      await this.reconcile(idLead);
    } catch {
      await this.reconcile();
    } finally {
      this.isSaving.set(false);
    }
  }

  private closeDetail(): void {
    this.detailDrawerOpen.set(false);
    this.detail.set(null);
    this.eventos.set([]);
    this.selectedLeadId.set(null);
    this.selectedTipificacionCode.set('');
    this.selectedSubtipificacionCode.set('');
    this.selectedOfertaProviderId.set(null);
    this.ofertaPlanes.set([]);
    this.adicionalesSeleccionados.set([]);
    this.adicionalesDirty.set(false);
    this.detailHadOperationalAction = false;
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
      this.detailHadOperationalAction = true;
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

  private setControlEnabled(control: AbstractControl, enabled: boolean): void {
    if (enabled && control.disabled) {
      control.enable({ emitEvent: false });
    } else if (!enabled && control.enabled) {
      control.disable({ emitEvent: false });
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
      latitud: this.toCoordinateValue(raw.latitud),
      longitud: this.toCoordinateValue(raw.longitud),
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

  private toCoordinateValue(value: number | string | null | undefined): string {
    return this.stripTrailingCoordinateZeros(String(value ?? '').replace(',', '.').trim());
  }

  private resolveSecForTipification(value: string | null | undefined, fallback: string | null | undefined): string | null {
    return this.resolveFixedDigits(value, fallback, 9);
  }

  private resolveSotForTipification(value: string | null | undefined, fallback: string | null | undefined): string | null {
    return this.resolveFixedDigits(value, fallback, 8);
  }

  private resolveFixedDigits(value: string | null | undefined, fallback: string | null | undefined, length: number): string | null {
    const normalized = String(value ?? '').replace(/\D/g, '');
    if (normalized.length === length) {
      return normalized;
    }
    const fallbackNormalized = String(fallback ?? '').replace(/\D/g, '');
    return fallbackNormalized.length === length ? fallbackNormalized : null;
  }

  private stripTrailingCoordinateZeros(value: string): string {
    if (!value.includes('.')) {
      return value;
    }
    return value.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
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
    this.detailDrawerOpen.set(false);
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
