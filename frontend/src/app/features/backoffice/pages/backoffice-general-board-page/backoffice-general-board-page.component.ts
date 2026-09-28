import { LowerCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CanDeactivateFn } from '@angular/router';
import { firstValueFrom, merge } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CurrentUserProviderScopeService } from '../../../../core/services/current-user-provider-scope.service';
import { SessionService } from '../../../../core/services/session.service';
import { MetricsPeriodo, PeriodSelectorComponent } from '../../../../shared/components/period-selector/period-selector.component';
import { TipificationPaletteByCode, TipificationStackComponent } from '../../../../shared/components/tipification-stack/tipification-stack.component';
import { TreeSelectComponent, TreeSelectGroup, TreeSelectSelection } from '../../../../shared/components/tree-select/tree-select.component';
import { VentaDrawerMode, VentaDrawerV2Component } from '../../../../shared/components/venta-drawer-v2/venta-drawer-v2.component';
import { MetricsRango } from '../../../../shared/utils/metrics-period';
import { providerLogo as resolveProviderLogo } from '../../../../shared/utils/provider-logo';
import {
  CampoFechaListadoVenta,
  AdicionalResponse,
  CatalogoResponse,
  EventoResponse,
  LeadAperturaVentaRequest,
  LeadBandejaVentaResponse,
  LeadDatosPreventaRequest,
  LeadDireccionRequest,
  LeadDetalleResponse,
  LeadOfertaComercialRequest,
  LeadTipificacionVentaRequest,
  TipificacionResponse,
  UbigeoItem,
  PlanResponse,
  PromocionComercialResponse
} from '../../../../shared/models/preventa/preventa.models';
import { buildWhatsAppUrl } from '../../../../shared/utils/phone-link';
import { LeadRealtimeService } from '../../../preventa/services/lead-realtime.service';
import { BackofficeLeadService } from '../../services/backoffice-lead.service';

type SortField = 'fechaIngresoEtapa' | 'fechaRelevante' | 'fechaUltimaGestion' | 'lead' | 'estado' | 'tipificacion';
type SortDirection = 'asc' | 'desc';
type GroupMode = 'SIN_AGRUPAR' | 'ESTADO' | 'PLAN' | 'TIPIFICACION' | 'SUBTIPIFICACION' | 'ULTIMO_GESTOR' | 'ASESOR_PREVENTA' | 'DEPARTAMENTO' | 'PROVINCIA' | 'DISTRITO';
type FilterColumn = 'NINGUNO' | 'DEPARTAMENTO' | 'ESTADO' | 'PLAN' | 'ULTIMO_GESTOR';
type Option<T extends string = string> = { label: string; value: T };

@Component({
  selector: 'app-backoffice-general-board-page',
  standalone: true,
  imports: [
    LowerCasePipe,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PaginatorModule,
    PopoverModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    PeriodSelectorComponent,
    TipificationStackComponent,
    TreeSelectComponent,
    VentaDrawerV2Component
  ],
  providers: [ConfirmationService],
  templateUrl: './backoffice-general-board-page.component.html',
  styleUrl: './backoffice-general-board-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackofficeGeneralBoardPageComponent implements OnInit {
  private readonly leadService = inject(BackofficeLeadService);
  private readonly providerScope = inject(CurrentUserProviderScopeService);
  private readonly realtimeService = inject(LeadRealtimeService);
  private readonly sessionService = inject(SessionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private lastProviderId: number | null | undefined = undefined;
  private openingRequest: Promise<void> = Promise.resolve();
  private assignmentHeld = false;
  private loadedComment = '';

  private static readonly DEFAULT_SORT: SortField = 'fechaIngresoEtapa';
  private static readonly DEFAULT_DIRECTION: SortDirection = 'desc';
  private static readonly SEARCH_DEBOUNCE_MS = 320;
  private static readonly REALTIME_RELOAD_DEBOUNCE_MS = 600;

  protected readonly pageSize = 15;
  protected readonly rows = signal<LeadBandejaVentaResponse[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(0);
  protected readonly loading = signal(false);
  protected readonly catalogLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly catalogoFlat = signal<TipificacionResponse[]>([]);
  protected readonly searchInput = signal('');
  protected readonly searchActive = signal('');
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private loadRequestToken = 0;
  protected readonly periodo = signal<MetricsPeriodo>('dia');
  protected readonly dia = signal<string | null>(this.today());
  protected readonly hasta = signal<string | null>(this.today());
  protected readonly campoFecha = signal<CampoFechaListadoVenta>('INGRESO');
  protected readonly groupBy = signal<GroupMode>('SIN_AGRUPAR');
  protected readonly sortBy = signal<SortField>(BackofficeGeneralBoardPageComponent.DEFAULT_SORT);
  protected readonly direction = signal<SortDirection>(BackofficeGeneralBoardPageComponent.DEFAULT_DIRECTION);

  // --- Tipificacion tree-select ---
  private static readonly SIN_TIP_KEY = '__SIN_TIPIFICACION__';
  protected readonly tipGroups = signal<TreeSelectGroup[]>([]);
  protected readonly selectedTipificaciones = signal<string[]>([]);
  protected readonly selectedSubtipificaciones = signal<string[]>([]);
  private readonly allTipKeys = computed(() =>
    this.tipGroups().flatMap(g => g.nodes.map(n => n.key))
  );

  // --- Filtrar por ---
  protected readonly filterColumn = signal<FilterColumn>('NINGUNO');
  protected readonly filterEstado = signal<string | null>(null);
  protected readonly filterPlan = signal<string | null>(null);
  protected readonly filterGestor = signal<string | null>(null);
  protected readonly planOptions = signal<Option[]>([]);
  protected readonly gestorOptions = signal<Option[]>([]);

  // --- Geo cascade filter ---
  protected readonly departamentos = signal<UbigeoItem[]>([]);
  protected readonly provincias = signal<UbigeoItem[]>([]);
  protected readonly distritos = signal<UbigeoItem[]>([]);
  protected readonly selectedDepartamento = signal<number | null>(null);
  protected readonly selectedProvincia = signal<number | null>(null);
  protected readonly selectedDistrito = signal<number | null>(null);

  // --- Detail drawer (VentaDrawerV2) ---
  protected readonly drawerOpen = signal(false);
  protected readonly drawerMode = signal<VentaDrawerMode>('consulta');
  protected readonly detail = signal<LeadDetalleResponse | null>(null);
  protected readonly eventos = signal<EventoResponse[]>([]);
  protected readonly historialLoading = signal(false);
  protected readonly historialError = signal<string | null>(null);
  protected readonly catalogo = signal<CatalogoResponse | null>(null);
  protected readonly ofertaPlanes = signal<PlanResponse[]>([]);
  protected readonly promociones = signal<PromocionComercialResponse[]>([]);
  protected readonly adicionales = signal<AdicionalResponse[]>([]);
  protected readonly adicionalesSeleccionados = signal<Array<{ idAdicional: number; cantidad: number }>>([]);
  protected readonly selectedOfertaProviderId = signal<number | null>(null);
  protected readonly provinciasDomicilio = signal<UbigeoItem[]>([]);
  protected readonly distritosDomicilio = signal<UbigeoItem[]>([]);
  protected readonly isSaving = signal(false);
  protected readonly closePending = signal(false);
  protected readonly releaseError = signal<string | null>(null);
  protected readonly actionMessage = signal<string | null>(null);
  protected readonly openingLead = signal(false);
  protected readonly assignmentConflict = signal<{
    row: LeadBandejaVentaResponse;
    idAsesor: number | null;
    nombreAsesor: string;
  } | null>(null);
  protected readonly consultaFromConflict = signal(false);
  private selectedLeadId = signal<number | null>(null);
  private failedDetailRow = signal<LeadBandejaVentaResponse | null>(null);

  protected readonly tipoDocumentoOptions = ['DNI', 'CE', 'RUC'];
  protected readonly tipoDomicilioOptions = ['HOGAR', 'MULTIFAMILIAR', 'CONDOMINIO_EDIFICIO', 'CONDOMINIO_EDIFICIO_NO_HABILITADO'];
  protected readonly tipoViaOptions = ['AVENIDA', 'JIRON', 'CALLE', 'PASAJE', 'PROLONGACION'];
  protected readonly camposVisibles = computed<ReadonlySet<string>>(
    () => new Set((this.detail()?.camposConfig ?? []).filter((campo) => campo.visible).map((campo) => campo.campo))
  );
  protected readonly tipificaciones = computed(() => [...(this.catalogo()?.tipificaciones ?? [])].sort((a, b) => a.orden - b.orden));
  protected readonly subtipificaciones = computed(() => {
    const code = this.selectedTipificacionCode();
    return [...(this.catalogo()?.tipificaciones.find((tipificacion) => tipificacion.codigo === code)?.subtipificaciones ?? [])]
      .sort((a, b) => a.orden - b.orden);
  });
  protected readonly selectedSubtipificacion = computed(() =>
    this.subtipificaciones().find((item) => item.codigo === this.selectedSubtipificacionCode())
  );
  protected readonly requiresInstallDate = computed(
    () => this.selectedSubtipificacion()?.comportamientos?.includes('REQUIERE_FECHA_INSTALACION') ?? false
  );
  protected readonly requiresProgramming = computed(
    () => this.selectedSubtipificacion()?.comportamientos?.includes('REQUIERE_FECHA_PROGRAMACION') ?? false
  );
  protected readonly requiresRejectionDate = computed(
    () => this.selectedSubtipificacion()?.comportamientos?.includes('REQUIERE_FECHA_RECHAZO') ?? false
  );
  protected readonly requiresSecSot = computed(() => {
    const code = this.selectedTipificacionCode().trim().toUpperCase();
    const subtipificationRequires = this.selectedSubtipificacion()?.comportamientos?.includes('REQUIERE_SEC_SOT') ?? false;
    return (subtipificationRequires || code === 'SUBIDO' || code === 'INGRESADO')
      && this.detail()?.requiereSecSotVenta === true;
  });
  protected readonly requiresCustomerId = computed(
    () => (this.selectedSubtipificacion()?.comportamientos?.includes('REQUIERE_CUSTOMER_ID') ?? false)
      && (this.detail()?.nombreProveedorPlan ?? '').trim().toUpperCase() === 'CLARO'
  );
  protected readonly providerOptions = computed(() => {
    const byId = new Map<number, { id: number; nombre: string }>();
    for (const plan of this.ofertaPlanes()) {
      if (plan.idProveedor) byId.set(plan.idProveedor, { id: plan.idProveedor, nombre: plan.nombreProveedor ?? `Proveedor ${plan.idProveedor}` });
    }
    return [...byId.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  });
  protected readonly drawerPlanOptions = computed(() => {
    const providerId = this.selectedOfertaProviderId();
    const plans = providerId ? this.ofertaPlanes().filter((plan) => plan.idProveedor === providerId) : [];
    return [{ id: 0, nombre: 'Sin plan' }, ...plans];
  });
  protected readonly promocionOptions = computed(() => [{ id: 0, reglaComercial: 'Sin promocion' }, ...this.promociones()]);
  protected readonly selectedAdditionals = computed(() => {
    const available = this.adicionales();
    return this.adicionalesSeleccionados().map((selected) => {
      const detailItem = this.detail()?.adicionales?.find((item) => item.idAdicional === selected.idAdicional);
      const catalogItem = available.find((item) => item.id === selected.idAdicional);
      return {
        idAdicional: selected.idAdicional,
        nombre: catalogItem?.nombre ?? detailItem?.nombreAdicional ?? `Adicional ${selected.idAdicional}`,
        precioUnitario: catalogItem?.precioUnitario ?? detailItem?.precioUnitario ?? 0,
        cantidad: selected.cantidad
      };
    });
  });
  protected readonly additionalsTotal = computed(
    () => this.selectedAdditionals().reduce((total, item) => total + (item.precioUnitario ?? 0) * item.cantidad, 0)
  );
  protected readonly offerAlreadyRegistered = computed(() => {
    if (this.detail()?.etapa === 'VENTA' && !this.detail()?.idPlan) return false;
    return this.eventos().some((event) => event.etapa === 'VENTA' && event.accion === 'ACTUALIZACION_OFERTA_COMERCIAL');
  });
  protected readonly offerLocked = computed(
    () => this.detail()?.ofertaComercialActualizadaVenta === true || this.offerAlreadyRegistered()
  );
  protected readonly offerNoticeText = computed(() => this.offerLocked()
    ? 'El plan ofrecido ya fue registrado en esta venta.'
    : 'Solo puedes registrar el plan una vez. Revisa el plan, la promoción y los adicionales antes de guardar.');
  protected readonly saveDrawerChanges = async (): Promise<boolean> => this.saveChanges();
  protected readonly canMutateDrawer = computed(
    () => this.drawerMode() === 'gestion' && !this.closePending() && !this.isSaving()
  );

  protected readonly datosForm = this.fb.group({
    tipoDocumento: ['DNI'],
    numeroDocumentoTitularServicio: [''],
    ubigeoNacimiento: [''],
    nombreTitularServicio: [''],
    celularRegistro: [''],
    celularReferencia: [''],
    celularGrabacion: [''],
    correo: [''],
    fechaNacimiento: [''],
    parentesco: [''],
    nombreMadre: [''],
    nombrePadre: [''],
    numeroDocumentoTitularCelularRegistro: [''],
    nombreTitularCelularRegistro: ['']
  });
  protected readonly selectedTipificacionCode = signal('');
  protected readonly selectedSubtipificacionCode = signal('');

  protected readonly direccionForm = this.fb.group({
    idDepartamentoDomicilio: [0],
    idProvinciaDomicilio: [0],
    idDistritoDomicilio: [0],
    ubigeoDomicilio: [''],
    tipoDomicilio: [''],
    tipoVia: [''],
    via: [''],
    direccion: [''],
    referencia: [''],
    latitud: ['' as string | number | null],
    longitud: ['' as string | number | null],
    urbanizacion: [''],
    numero: [''],
    manzana: [''],
    lote: [''],
    nombreEdificio: [''],
    nombreCondominio: [''],
    plano: [''],
    piso: [''],
    interior: [''],
    tecnologia: [''],
    esFullClaro: [false],
    esJalaCobertura: [false],
    esZonaPintada: [false]
  });

  protected readonly ofertaForm = this.fb.group({
    idProveedor: [0],
    idPlan: [0],
    idPromocionInterna: [0]
  });

  protected readonly tipificacionForm = this.fb.group({
    codigoTipificacion: [''],
    codigoSubtipificacion: [''],
    comentario: [''],
    fechaInstalacion: [''],
    fechaProgramacion: [''],
    fechaRechazo: [''],
    horaProgramada: [''],
    sec: [''],
    sot: [''],
    customerId: ['']
  });

  protected readonly showSecSotColumn = computed(() =>
    this.rows().some((row) => Boolean(row.sec?.trim()) || Boolean(row.sot?.trim()) || row.requiereSecSotVenta === true)
  );

  protected readonly tipificationPaletteByCode = computed<TipificationPaletteByCode>(() => {
    const palette: TipificationPaletteByCode = {};
    const totalPalettes = 8;
    const SIN = BackofficeGeneralBoardPageComponent.SIN_TIP_KEY;
    for (const group of this.tipGroups()) {
      for (const node of group.nodes) {
        if (node.key === SIN) continue;
        const tipResp = this.catalogoFlat().find(t => t.codigo === node.key);
        const orden = tipResp?.orden ?? 0;
        palette[node.key.toUpperCase()] = Number.isFinite(orden) && orden > 0 ? (orden - 1) % totalPalettes : 0;
      }
    }
    return palette;
  });

  protected readonly tipFilterCount = computed(() => {
    const tips = this.selectedTipificaciones();
    const subtips = this.selectedSubtipificaciones();
    if (tips.length === 0 && subtips.length === 0) return 0;
    const all = this.allTipKeys();
    if (subtips.length === 0 && tips.length === all.length && all.every(k => tips.includes(k))) return 0;
    return tips.length + subtips.length;
  });

  protected readonly activeFilterCount = computed(() => {
    let count = this.tipFilterCount();
    if (this.searchActive()) count += 1;
    if (this.groupBy() !== 'SIN_AGRUPAR') count += 1;
    if (this.hasActiveFilter()) count += 1;
    return count;
  });

  protected readonly campoFechaOptions: Option<CampoFechaListadoVenta>[] = [
    { label: 'Fecha ingreso', value: 'INGRESO' },
    { label: 'Fecha programación', value: 'PROGRAMACION' },
    { label: 'Fecha rechazo', value: 'RECHAZO' },
    { label: 'Fecha instalación', value: 'INSTALACION' },
    { label: 'Última gestión', value: 'ULTIMA_GESTION' }
  ];

  protected readonly groupOptions: Option<GroupMode>[] = [
    { label: 'Sin agrupar', value: 'SIN_AGRUPAR' },
    { label: 'Estado', value: 'ESTADO' },
    { label: 'Plan', value: 'PLAN' },
    { label: 'Tipificación', value: 'TIPIFICACION' },
    { label: 'Subtipificación', value: 'SUBTIPIFICACION' },
    { label: 'Último gestor', value: 'ULTIMO_GESTOR' },
    { label: 'Asesor preventa', value: 'ASESOR_PREVENTA' },
    { label: 'Departamento', value: 'DEPARTAMENTO' },
    { label: 'Provincia', value: 'PROVINCIA' },
    { label: 'Distrito', value: 'DISTRITO' }
  ];

  protected readonly sortOptions: Option<SortField>[] = [
    { label: 'Fecha ingreso', value: 'fechaIngresoEtapa' },
    { label: 'Fecha relevante', value: 'fechaRelevante' },
    { label: 'Última gestión', value: 'fechaUltimaGestion' },
    { label: 'Estado', value: 'estado' },
    { label: 'Tipificación', value: 'tipificacion' }
  ];

  protected readonly directionOptions = computed<Option<SortDirection>[]>(() => {
    const isDate = this.isDateSort(this.sortBy());
    return isDate
      ? [{ label: 'Más recientes', value: 'desc' }, { label: 'Más antiguos', value: 'asc' }]
      : [{ label: 'A-Z', value: 'asc' }, { label: 'Z-A', value: 'desc' }];
  });

  protected readonly filterColumnOptions: Option<FilterColumn>[] = [
    { label: 'Ninguno', value: 'NINGUNO' },
    { label: 'Departamento', value: 'DEPARTAMENTO' },
    { label: 'Estado', value: 'ESTADO' },
    { label: 'Plan', value: 'PLAN' },
    { label: 'Último gestor', value: 'ULTIMO_GESTOR' }
  ];

  protected readonly estadoOptions: Option[] = [
    { label: 'Nuevo', value: 'NUEVO' },
    { label: 'En gestión', value: 'EN_GESTION' },
    { label: 'Asignado', value: 'ASIGNADO' },
    { label: 'Gestionado', value: 'GESTIONADO' }
  ];

  protected readonly hasActiveFilter = computed(() =>
    this.filterColumn() !== 'NINGUNO' && (
      this.selectedDepartamento() !== null
      || this.filterEstado() !== null
      || this.filterPlan() !== null
      || this.filterGestor() !== null
    )
  );

  protected readonly activeFilterLabel = computed(() => {
    switch (this.filterColumn()) {
      case 'DEPARTAMENTO': {
        const parts: string[] = [];
        const dep = this.departamentos().find(d => d.id === this.selectedDepartamento());
        if (dep) parts.push(dep.nombre);
        const prov = this.provincias().find(p => p.id === this.selectedProvincia());
        if (prov) parts.push(prov.nombre);
        const dist = this.distritos().find(d => d.id === this.selectedDistrito());
        if (dist) parts.push(dist.nombre);
        return parts.length ? parts.join(' · ') : 'Departamento';
      }
      case 'ESTADO':
        return this.filterEstado()
          ? this.estadoOptions.find(o => o.value === this.filterEstado())?.label ?? this.filterEstado()!
          : 'Estado';
      case 'PLAN':
        return this.filterPlan() ?? 'Plan';
      case 'ULTIMO_GESTOR':
        return this.filterGestor() ?? 'Último gestor';
      default:
        return '';
    }
  });

  protected readonly isOrganizationDefault = computed(() =>
    this.campoFecha() === 'INGRESO'
    && this.groupBy() === 'SIN_AGRUPAR'
    && this.sortBy() === BackofficeGeneralBoardPageComponent.DEFAULT_SORT
    && this.direction() === BackofficeGeneralBoardPageComponent.DEFAULT_DIRECTION
    && !this.hasActiveFilter()
  );

  protected readonly campoFechaLabel = computed(() => {
    const found = this.campoFechaOptions.find((o) => o.value === this.campoFecha());
    return found?.label ?? 'Fecha ingreso';
  });

  constructor() {
    effect(() => {
      const activeId = this.providerScope.activeId();
      if (this.lastProviderId === undefined) {
        this.lastProviderId = activeId;
        return;
      }
      if (activeId === this.lastProviderId) {
        return;
      }
      this.lastProviderId = activeId;
      untracked(async () => {
        this.rows.set([]);
        this.total.set(0);
        this.page.set(0);
        this.filterColumn.set('NINGUNO');
        this.filterEstado.set(null);
        this.filterPlan.set(null);
        this.filterGestor.set(null);
        this.selectedDepartamento.set(null);
        this.selectedProvincia.set(null);
        this.selectedDistrito.set(null);
        await this.loadCatalogo();
        void this.loadFilterCatalogs();
        void this.loadRows();
      });
    });
  }

  async ngOnInit(): Promise<void> {
    await this.providerScope.load();
    await this.loadCatalogo();
    await Promise.all([this.loadRows(), this.loadDepartamentos(), this.loadFilterCatalogs()]);
    this.startRealtime();
  }

  protected async refresh(): Promise<void> {
    await this.loadRows();
  }

  protected onSearchInput(value: string): void {
    this.searchInput.set(value);
    this.cancelSearchDebounce();
    this.searchDebounceTimer = setTimeout(() => {
      this.searchDebounceTimer = null;
      const raw = this.searchInput().trim();
      if (raw && !this.normalizeSearch(raw)) {
        return;
      }
      void this.buscar();
    }, BackofficeGeneralBoardPageComponent.SEARCH_DEBOUNCE_MS);
  }

  protected async buscar(): Promise<void> {
    this.cancelSearchDebounce();
    const term = this.normalizeSearch(this.searchInput());
    if (term === this.searchActive() && term === this.searchInput()) {
      return;
    }
    this.searchInput.set(term);
    this.searchActive.set(term);
    this.page.set(0);
    await this.loadRows();
  }

  protected async limpiarBusqueda(): Promise<void> {
    this.cancelSearchDebounce();
    this.searchInput.set('');
    this.searchActive.set('');
    this.page.set(0);
    await this.loadRows();
  }

  // --- Detail drawer (VentaDrawerV2) ---

  protected async onRowClick(row: LeadBandejaVentaResponse): Promise<void> {
    if (this.openingLead()) await this.openingRequest;
    if (this.drawerOpen() && !(await this.requestCloseDrawer())) return;
    await this.openLead(row, {});
  }

  private async openLead(row: LeadBandejaVentaResponse, request: LeadAperturaVentaRequest): Promise<void> {
    const operation = this.loadLeadForDrawer(row, request);
    this.openingRequest = operation;
    try {
      await operation;
    } finally {
      if (this.openingRequest === operation) this.openingRequest = Promise.resolve();
    }
  }

  private async loadLeadForDrawer(row: LeadBandejaVentaResponse, request: LeadAperturaVentaRequest): Promise<void> {
    this.openingLead.set(true);
    this.assignmentConflict.set(null);
    this.failedDetailRow.set(null);
    this.error.set(null);
    this.actionMessage.set(null);
    this.releaseError.set(null);
    this.selectedLeadId.set(row.idLead);
    this.detail.set(null);
    this.drawerMode.set('consulta');
    this.eventos.set([]);
    this.historialError.set(null);
    this.catalogo.set(null);
    try {
      const response = await firstValueFrom(this.leadService.abrirLead(row.idLead, request));
      if (this.selectedLeadId() !== row.idLead) return;
      const mode: VentaDrawerMode = response.modo === 'GESTION' ? 'gestion' : 'consulta';
      this.drawerMode.set(mode);
      this.assignmentHeld = mode === 'gestion';
      this.detail.set(response.detalle);
      this.patchForms(response.detalle);
      this.drawerOpen.set(true);
      void this.loadHistorial(row.idLead);
      if (mode === 'gestion') void this.loadGestionCatalogs(row.idLead, response.detalle);
      else this.actionMessage.set('Modo Consulta: puedes revisar el detalle sin cambiar datos ni asignaciones.');
    } catch (error) {
      if (this.selectedLeadId() !== row.idLead) return;
      if (this.captureAssignmentConflict(error, row)) return;
      this.failedDetailRow.set(row);
      this.error.set(this.resolveDetailLoadError(error));
    } finally {
      this.openingLead.set(false);
    }
  }

  private captureAssignmentConflict(error: unknown, row: LeadBandejaVentaResponse): boolean {
    if (!(error instanceof HttpErrorResponse) || error.status !== 409) return false;
    const body = error.error as { details?: Record<string, unknown> } | null;
    const details = body?.details;
    if (!details || typeof details !== 'object' || !('idAsesorActual' in details)) return false;
    const rawId = Number(details['idAsesorActual']);
    this.consultaFromConflict.set(false);
    this.assignmentConflict.set({
      row,
      idAsesor: Number.isFinite(rawId) ? rawId : null,
      nombreAsesor: String(details['nombreAsesorActual'] ?? 'otro empleado')
    });
    return true;
  }

  protected continueFromConflict(): void {
    const conflict = this.assignmentConflict();
    if (!conflict) return;
    const request: LeadAperturaVentaRequest = this.consultaFromConflict()
      ? { modoConsulta: true }
      : { confirmarReasignacion: true, idAsesorConfirmado: conflict.idAsesor ?? undefined };
    void this.openLead(conflict.row, request);
  }

  protected cancelConflict(): void {
    this.assignmentConflict.set(null);
    this.selectedLeadId.set(null);
  }

  protected async retryError(): Promise<void> {
    const row = this.failedDetailRow();
    if (row) {
      await this.onRowClick(row);
      return;
    }
    await this.refresh();
  }

  protected async closeDrawer(): Promise<void> {
    await this.requestCloseDrawer();
  }

  async canDeactivate(): Promise<boolean> {
    await this.openingRequest;
    if (!this.drawerOpen()) {
      this.assignmentConflict.set(null);
      return true;
    }
    return this.requestCloseDrawer();
  }

  @HostListener('window:pagehide')
  protected releaseOnPageHide(): void {
    const idLead = this.selectedLeadId();
    if (this.assignmentHeld && idLead) {
      void firstValueFrom(this.leadService.liberarAsignacion(idLead)).catch(() => undefined);
    }
  }

  private async requestCloseDrawer(): Promise<boolean> {
    if (!this.drawerOpen()) return true;
    if (this.isSaving() || this.closePending()) return false;
    if (this.hasUnsavedChanges()) {
      if (!(await this.confirmDiscardChanges())) return false;
      const currentDetail = this.detail();
      if (currentDetail) {
        this.patchForms(currentDetail);
        if (this.drawerMode() === 'gestion') {
          void this.loadGestionCatalogs(currentDetail.id, currentDetail);
        }
      }
    }

    const idLead = this.selectedLeadId();
    if (this.drawerMode() === 'gestion' && this.assignmentHeld && idLead) {
      this.closePending.set(true);
      this.releaseError.set(null);
      try {
        await firstValueFrom(this.leadService.liberarAsignacion(idLead));
        this.assignmentHeld = false;
      } catch (error) {
        this.releaseError.set(`No se pudo liberar la asignación. ${this.resolveDetailLoadError(error)}`);
        return false;
      } finally {
        this.closePending.set(false);
      }
    }

    this.resetDrawer();
    void this.loadRows();
    return true;
  }

  private resetDrawer(): void {
    this.drawerOpen.set(false);
    this.drawerMode.set('consulta');
    this.detail.set(null);
    this.selectedLeadId.set(null);
    this.assignmentHeld = false;
    this.releaseError.set(null);
    this.actionMessage.set(null);
    this.catalogo.set(null);
    this.eventos.set([]);
    this.historialError.set(null);
    this.provinciasDomicilio.set([]);
    this.distritosDomicilio.set([]);
    this.ofertaPlanes.set([]);
    this.promociones.set([]);
    this.adicionales.set([]);
    this.adicionalesSeleccionados.set([]);
  }

  private hasUnsavedChanges(): boolean {
    return this.datosForm.dirty || this.direccionForm.dirty || this.ofertaForm.dirty || this.tipificacionForm.dirty;
  }

  private confirmDiscardChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      this.confirmationService.confirm({
        header: 'Cerrar gestión',
        message: 'Hay cambios sin guardar. Si cierras ahora, esos cambios se descartarán.',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Cerrar sin guardar',
        rejectLabel: 'Seguir editando',
        acceptButtonStyleClass: 'p-button-warning',
        rejectButtonStyleClass: 'p-button-text',
        accept: () => finish(true),
        reject: () => finish(false)
      });
    });
  }

  protected async retryHistorial(): Promise<void> {
    const id = this.selectedLeadId();
    if (id) await this.loadHistorial(id);
  }

  private async loadHistorial(idLead: number): Promise<void> {
    this.historialLoading.set(true);
    this.historialError.set(null);
    try {
      const page = await firstValueFrom(this.leadService.listarHistorialBackofficeVenta(
        idLead,
        { pageNumber: 0, pageSize: 100, sortBy: 'createdAt', direction: 'desc' }
      ));
      if (this.selectedLeadId() !== idLead) return;
      this.eventos.set(page.content ?? []);
    } catch {
      if (this.selectedLeadId() === idLead) {
        this.eventos.set([]);
        this.historialError.set('No se pudo cargar el historial.');
      }
    } finally {
      if (this.selectedLeadId() === idLead) this.historialLoading.set(false);
    }
  }

  private async loadGestionCatalogs(idLead: number, lead: LeadDetalleResponse): Promise<void> {
    const [catalogResult, plansResult] = await Promise.allSettled([
      firstValueFrom(this.leadService.getCatalogoTipificaciones(idLead)),
      firstValueFrom(this.leadService.listarPlanesOferta(idLead))
    ]);
    if (this.selectedLeadId() !== idLead || !this.drawerOpen()) return;
    if (catalogResult.status === 'fulfilled') {
      this.catalogo.set(catalogResult.value);
    } else {
      this.actionMessage.set('No se pudo cargar el catálogo de tipificaciones. Puedes reintentar desde la bandeja.');
    }
    if (plansResult.status === 'fulfilled') {
      this.ofertaPlanes.set(plansResult.value ?? []);
      const currentPlan = plansResult.value.find((plan) => plan.id === (lead.idPlan ?? 0));
      const providerId = currentPlan?.idProveedor ?? null;
      this.selectedOfertaProviderId.set(providerId);
      this.ofertaForm.controls.idProveedor.setValue(providerId ?? 0, { emitEvent: false });
      this.adicionalesSeleccionados.set((lead.adicionales ?? [])
        .filter((item) => (item.idAdicional ?? 0) > 0 && (item.cantidad ?? 0) > 0)
        .map((item) => ({ idAdicional: item.idAdicional!, cantidad: item.cantidad! })));
      try {
        const [promotions, additionals] = await Promise.all([
          firstValueFrom(this.leadService.listarPromociones(lead.idPlan ? { idPlan: lead.idPlan } : {})),
          providerId ? firstValueFrom(this.leadService.listarAdicionales(providerId)) : Promise.resolve([])
        ]);
        if (this.selectedLeadId() !== idLead) return;
        this.promociones.set(promotions);
        this.adicionales.set(additionals);
      } catch {
        this.actionMessage.set('El drawer abrió, pero no se pudieron cargar todos los planes y promociones.');
      }
    } else {
      this.actionMessage.set('El drawer abrió, pero no se pudo cargar el catálogo de planes.');
    }
  }

  protected async onTipoDocumentoChanged(): Promise<void> {
    if (!this.canMutateDrawer()) return;
    const control = this.datosForm.controls.numeroDocumentoTitularServicio;
    const tipo = this.datosForm.controls.tipoDocumento.value;
    const maxLength = tipo === 'DNI' ? 8 : tipo === 'RUC' ? 11 : 12;
    const normalized = String(control.value ?? '').replace(/[^0-9]/g, '').slice(0, maxLength);
    if (normalized !== control.value) control.setValue(normalized);
  }

  protected async onDepartamentoDomicilioChanged(): Promise<void> {
    if (!this.canMutateDrawer()) return;
    const id = this.direccionForm.controls.idDepartamentoDomicilio.value;
    this.direccionForm.patchValue({ idProvinciaDomicilio: 0, idDistritoDomicilio: 0, ubigeoDomicilio: '' });
    this.provinciasDomicilio.set([]);
    this.distritosDomicilio.set([]);
    if (id && id > 0) {
      try {
        this.provinciasDomicilio.set(await firstValueFrom(this.leadService.listarProvincias(id)));
      } catch (error) {
        this.actionMessage.set(this.resolveDetailLoadError(error));
      }
    }
  }

  protected async onProvinciaDomicilioChanged(): Promise<void> {
    if (!this.canMutateDrawer()) return;
    const id = this.direccionForm.controls.idProvinciaDomicilio.value;
    this.direccionForm.patchValue({ idDistritoDomicilio: 0, ubigeoDomicilio: '' });
    try {
      this.distritosDomicilio.set(id && id > 0 ? await firstValueFrom(this.leadService.listarDistritos(id)) : []);
    } catch (error) {
      this.actionMessage.set(this.resolveDetailLoadError(error));
    }
  }

  protected onDistritoDomicilioChanged(): void {
    if (!this.canMutateDrawer()) return;
    const id = this.direccionForm.controls.idDistritoDomicilio.value;
    const distrito = this.distritosDomicilio().find((item) => item.id === id);
    this.direccionForm.controls.ubigeoDomicilio.setValue(distrito?.codigo ?? '');
    this.direccionForm.controls.ubigeoDomicilio.markAsDirty();
  }

  protected async onOfertaProviderChanged(idProveedor: number): Promise<void> {
    if (!this.canMutateDrawer() || this.offerLocked()) return;
    this.selectedOfertaProviderId.set(idProveedor || null);
    this.ofertaForm.patchValue({ idProveedor: idProveedor || 0, idPlan: 0, idPromocionInterna: 0 });
    this.adicionalesSeleccionados.set([]);
    this.promociones.set([]);
    this.adicionales.set(idProveedor ? await firstValueFrom(this.leadService.listarAdicionales(idProveedor)) : []);
    this.ofertaForm.markAsDirty();
  }

  protected async onPlanChanged(): Promise<void> {
    if (!this.canMutateDrawer() || this.offerLocked()) return;
    const idPlan = this.ofertaForm.controls.idPlan.value;
    this.ofertaForm.controls.idPromocionInterna.setValue(0);
    const idProveedor = this.selectedOfertaProviderId() ?? undefined;
    this.promociones.set(await firstValueFrom(this.leadService.listarPromociones({
      ...(idProveedor ? { idProveedor } : {}),
      ...(idPlan ? { idPlan } : {})
    })));
  }

  protected incrementarAdicional(adicional: AdicionalResponse): void {
    if (!this.canMutateDrawer() || this.offerLocked()) return;
    const selected = this.adicionalesSeleccionados();
    const found = selected.find((item) => item.idAdicional === adicional.id);
    this.adicionalesSeleccionados.set(found
      ? selected.map((item) => item.idAdicional === adicional.id ? { ...item, cantidad: item.cantidad + 1 } : item)
      : [...selected, { idAdicional: adicional.id, cantidad: 1 }]);
    this.ofertaForm.markAsDirty();
  }

  protected disminuirAdicional(adicional: AdicionalResponse): void {
    if (!this.canMutateDrawer() || this.offerLocked()) return;
    this.adicionalesSeleccionados.set(this.adicionalesSeleccionados()
      .map((item) => item.idAdicional === adicional.id ? { ...item, cantidad: item.cantidad - 1 } : item)
      .filter((item) => item.cantidad > 0));
    this.ofertaForm.markAsDirty();
  }

  protected onTipificacionSelected(code: string | null): void {
    if (!this.canMutateDrawer()) return;
    this.selectedTipificacionCode.set(code ?? '');
    this.selectedSubtipificacionCode.set('');
    this.tipificacionForm.patchValue({ codigoTipificacion: code ?? '', codigoSubtipificacion: '', fechaInstalacion: '', fechaProgramacion: '', horaProgramada: '' });
  }

  protected onSubtipificacionSelected(code: string | null): void {
    if (!this.canMutateDrawer()) return;
    this.selectedSubtipificacionCode.set(code ?? '');
    const raw = this.tipificacionForm.getRawValue();
    this.tipificacionForm.patchValue({
      codigoSubtipificacion: code ?? '',
      fechaInstalacion: '',
      fechaProgramacion: this.requiresProgramming() ? raw.fechaProgramacion || this.detail()?.fechaProgramacion || '' : '',
      fechaRechazo: this.requiresRejectionDate() ? raw.fechaRechazo || this.detail()?.fechaRechazo || '' : '',
      horaProgramada: this.requiresProgramming() ? raw.horaProgramada || this.detail()?.horaProgramada || this.defaultProgrammingTime() : ''
    });
  }

  protected async guardarCambios(): Promise<boolean> {
    return this.saveChanges();
  }

  private async saveChanges(): Promise<boolean> {
    const detail = this.detail();
    if (!detail || !this.canMutateDrawer()) return false;
    const saveOffer = this.ofertaForm.dirty;
    if (saveOffer && this.offerLocked()) {
      this.actionMessage.set('La oferta comercial ya fue registrada y no se puede cambiar.');
      return false;
    }
    if (saveOffer && !this.ofertaForm.controls.idPlan.value) {
      this.actionMessage.set('Selecciona un plan antes de guardar la oferta comercial.');
      return false;
    }
    if (saveOffer && !this.offerAlreadyRegistered() && !(await this.confirmOfferRegistration())) return false;

    const tasks: Array<{ label: string; action: () => Promise<void>; done: () => void }> = [];
    if (this.datosForm.dirty) {
      const raw = this.datosForm.getRawValue();
      if (!raw.tipoDocumento || !raw.numeroDocumentoTitularServicio?.trim()) {
        this.actionMessage.set('Tipo y número de documento son obligatorios.');
        return false;
      }
      const request: LeadDatosPreventaRequest = {
        tipoDocumento: raw.tipoDocumento,
        numeroDocumentoTitularServicio: raw.numeroDocumentoTitularServicio.trim(),
        ubigeoNacimiento: raw.ubigeoNacimiento || null,
        nombreTitularServicio: raw.nombreTitularServicio?.trim() || null,
        celularRegistro: raw.celularRegistro?.trim() || null,
        celularReferencia: raw.celularReferencia?.trim() || null,
        celularGrabacion: raw.celularGrabacion?.trim() || null,
        correo: raw.correo?.trim() || null,
        fechaNacimiento: raw.fechaNacimiento || null,
        parentesco: raw.parentesco || null,
        nombreMadre: raw.nombreMadre?.trim() || null,
        nombrePadre: raw.nombrePadre?.trim() || null,
        numeroDocumentoTitularCelularRegistro: raw.numeroDocumentoTitularCelularRegistro?.trim() || null,
        nombreTitularCelularRegistro: raw.nombreTitularCelularRegistro?.trim() || null
      };
      tasks.push({ label: 'Datos del lead', action: async () => { await firstValueFrom(this.leadService.actualizarDatosPreventa(detail.id, request)); }, done: () => this.datosForm.markAsPristine() });
    }
    if (this.direccionForm.dirty) {
      const raw = this.direccionForm.getRawValue();
      if (!raw.ubigeoDomicilio?.trim() || !raw.direccion?.trim() || !String(raw.latitud ?? '').trim() || !String(raw.longitud ?? '').trim()) {
        this.actionMessage.set('Completa ubigeo, dirección, latitud y longitud.');
        return false;
      }
      const request: LeadDireccionRequest = {
        ubigeoDomicilio: raw.ubigeoDomicilio,
        tipoDomicilio: raw.tipoDomicilio || null,
        tipoVia: raw.tipoVia || null,
        via: raw.via?.trim() || null,
        direccion: raw.direccion.trim(),
        referencia: raw.referencia?.trim() || null,
        latitud: String(raw.latitud),
        longitud: String(raw.longitud),
        urbanizacion: raw.urbanizacion?.trim() || null,
        numero: raw.numero?.trim() || null,
        manzana: raw.manzana?.trim() || null,
        lote: raw.lote?.trim() || null,
        nombreEdificio: raw.nombreEdificio?.trim() || null,
        nombreCondominio: raw.nombreCondominio?.trim() || null,
        plano: raw.plano?.trim() || null,
        piso: raw.piso?.trim() || null,
        interior: raw.interior?.trim() || null,
        tecnologia: raw.tecnologia || null,
        esFullClaro: raw.esFullClaro,
        esJalaCobertura: raw.esJalaCobertura,
        esZonaPintada: raw.esZonaPintada
      };
      tasks.push({ label: 'Dirección', action: async () => { await firstValueFrom(this.leadService.actualizarDireccion(detail.id, request)); }, done: () => this.direccionForm.markAsPristine() });
    }
    if (saveOffer) {
      const raw = this.ofertaForm.getRawValue();
      const request: LeadOfertaComercialRequest = {
        idPlan: raw.idPlan || null,
        idPromocionInterna: raw.idPromocionInterna || null,
        adicionales: this.adicionalesSeleccionados().map((item) => ({ ...item }))
      };
      tasks.push({ label: 'Oferta comercial', action: async () => { await firstValueFrom(this.leadService.actualizarOfertaComercial(detail.id, request)); }, done: () => this.ofertaForm.markAsPristine() });
    }
    if (!tasks.length) {
      this.actionMessage.set('No hay cambios pendientes por guardar.');
      return true;
    }

    this.isSaving.set(true);
    this.actionMessage.set(null);
    const failures: string[] = [];
    try {
      for (const task of tasks) {
        try {
          await task.action();
          task.done();
        } catch (error) {
          failures.push(`${task.label}: ${this.resolveDetailLoadError(error)}`);
          break;
        }
      }
      if (failures.length) {
        this.actionMessage.set(failures.join(' '));
        return false;
      }
      await this.refreshDrawerDetail(detail.id);
      this.actionMessage.set('Cambios guardados.');
      return true;
    } finally {
      this.isSaving.set(false);
    }
  }

  private async confirmOfferRegistration(): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      this.confirmationService.confirm({
        header: 'Registrar plan ofrecido',
        message: 'Solo se permite registrar el plan ofrecido una vez en esta venta. ¿Deseas continuar?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, registrar',
        rejectLabel: 'Revisar',
        accept: () => finish(true),
        reject: () => finish(false)
      });
    });
  }

  protected async tipificar(): Promise<void> {
    const detail = this.detail();
    if (!detail || !this.canMutateDrawer()) return;
    if (!this.catalogo()) {
      this.actionMessage.set('No se pudo cargar el catálogo de tipificaciones de VENTA.');
      return;
    }
    const raw = this.tipificacionForm.getRawValue();
    if (!raw.codigoTipificacion || !raw.codigoSubtipificacion) {
      this.actionMessage.set('Selecciona tipificación y subtipificación.');
      return;
    }
    if ((this.datosForm.dirty || this.direccionForm.dirty || this.ofertaForm.dirty) && !(await this.saveChanges())) return;
    if (this.requiresInstallDate() && !raw.fechaInstalacion) {
      this.actionMessage.set('La fecha de instalación es obligatoria para pasar a POSTVENTA.');
      return;
    }
    if (this.requiresInstallDate() && raw.fechaInstalacion && raw.fechaInstalacion > this.today()) {
      this.actionMessage.set('La fecha de instalación no puede ser futura.');
      return;
    }
    if (this.requiresProgramming() && (!raw.fechaProgramacion || !raw.horaProgramada)) {
      this.actionMessage.set('Ingresa fecha y hora de programación.');
      return;
    }
    if (this.requiresProgramming()) {
      raw.horaProgramada = this.roundToQuarterHour(raw.horaProgramada);
      this.tipificacionForm.controls.horaProgramada.setValue(raw.horaProgramada, { emitEvent: false });
    }
    if (this.requiresRejectionDate() && !raw.fechaRechazo) {
      this.actionMessage.set('Ingresa la fecha de rechazo.');
      return;
    }
    const sec = String(raw.sec ?? '').replace(/\D/g, '');
    const sot = String(raw.sot ?? '').replace(/\D/g, '');
    const customerId = String(raw.customerId ?? '').replace(/\D/g, '');
    if (this.requiresSecSot() && (this.requiresCustomerId() ? sot.length !== 8 : sec.length !== 9 || sot.length !== 8)) {
      this.actionMessage.set(this.requiresCustomerId() ? 'Ingresa SOT de 8 dígitos.' : 'Ingresa SEC de 9 dígitos y SOT de 8 dígitos.');
      return;
    }
    if (this.requiresCustomerId() && customerId.length !== 8) {
      this.actionMessage.set('Ingresa Customer ID de 8 dígitos.');
      return;
    }
    const request: LeadTipificacionVentaRequest = {
      codigoTipificacion: raw.codigoTipificacion,
      codigoSubtipificacion: raw.codigoSubtipificacion,
      comentario: (raw.comentario ?? '').trim() !== this.loadedComment ? (raw.comentario?.trim() || null) : null,
      fechaInstalacion: this.requiresInstallDate() ? raw.fechaInstalacion || null : null,
      fechaProgramacion: this.requiresProgramming() ? raw.fechaProgramacion || null : null,
      fechaRechazo: this.requiresRejectionDate() ? raw.fechaRechazo || null : null,
      horaProgramada: this.requiresProgramming() ? raw.horaProgramada || null : null,
      sec: this.requiresSecSot() && !this.requiresCustomerId() ? sec : null,
      sot: this.requiresSecSot() ? sot : null,
      customerId: this.requiresCustomerId() ? customerId : null
    };
    this.isSaving.set(true);
    this.actionMessage.set(null);
    try {
      await firstValueFrom(this.leadService.tipificarLead(detail.id, request));
      this.tipificacionForm.markAsPristine();
      await this.loadRows();
      this.isSaving.set(false);
      await this.requestCloseDrawer();
    } catch (error) {
      this.actionMessage.set(this.resolveDetailLoadError(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async registrarContacto(): Promise<void> {
    const detail = this.detail();
    if (!detail || !this.canMutateDrawer()) return;
    await this.runLeadAction('Contacto registrado.', () => this.leadService.registrarContacto(detail.id));
  }

  protected async registrarChat(): Promise<void> {
    const detail = this.detail();
    if (!detail || !this.canMutateDrawer()) return;
    const url = buildWhatsAppUrl(detail.prefijo, detail.lead, detail.usermeta);
    if (!url) {
      this.actionMessage.set('El lead no tiene teléfono ni usermeta para abrir WhatsApp.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    await this.runLeadAction('Chat registrado.', () => this.leadService.registrarContacto(detail.id));
  }

  protected async registrarLlamadaOperativa(): Promise<void> {
    await this.registrarContacto();
  }

  protected showCallError(message: string): void {
    this.actionMessage.set(message);
  }

  private async runLeadAction(success: string, action: () => import('rxjs').Observable<void>): Promise<void> {
    this.actionMessage.set(null);
    try {
      await firstValueFrom(action());
      this.actionMessage.set(success);
    } catch (error) {
      this.actionMessage.set(this.resolveDetailLoadError(error));
    }
  }

  private async refreshDrawerDetail(idLead: number): Promise<void> {
    try {
      const detail = await firstValueFrom(this.leadService.obtenerDetalleConsulta(idLead));
      if (this.selectedLeadId() !== idLead) return;
      this.detail.set(detail);
      this.patchForms(detail);
      void this.loadHistorial(idLead);
      if (this.drawerMode() === 'gestion') void this.loadGestionCatalogs(idLead, detail);
    } catch {
      this.actionMessage.set('Los cambios se guardaron, pero no se pudo actualizar el detalle.');
    }
  }

  private async resolveDomicilioSelection(ubigeo: string | null): Promise<void> {
    if (!ubigeo || ubigeo.length < 6) return;
    try {
      const departments = this.departamentos().length
        ? this.departamentos()
        : await firstValueFrom(this.leadService.listarDepartamentos());
      const department = departments.find((item) => item.codigo && ubigeo.startsWith(item.codigo));
      if (!department || this.selectedLeadId() !== this.detail()?.id) return;
      this.departamentos.set(departments);
      const provinces = await firstValueFrom(this.leadService.listarProvincias(department.id));
      const province = provinces.find((item) => item.codigo && ubigeo.startsWith(item.codigo));
      this.direccionForm.controls.idDepartamentoDomicilio.setValue(department.id, { emitEvent: false });
      this.provinciasDomicilio.set(provinces);
      if (!province || this.selectedLeadId() !== this.detail()?.id) return;
      const districts = await firstValueFrom(this.leadService.listarDistritos(province.id));
      const district = districts.find((item) => item.codigo === ubigeo);
      this.direccionForm.controls.idProvinciaDomicilio.setValue(province.id, { emitEvent: false });
      this.provinciasDomicilio.set(provinces);
      this.distritosDomicilio.set(districts);
      this.direccionForm.controls.idDistritoDomicilio.setValue(district?.id ?? 0, { emitEvent: false });
    } catch {
      this.actionMessage.set('No se pudo cargar la ubicación actual del lead.');
    }
  }

  private defaultProgrammingTime(): string {
    const now = new Date();
    const rounded = Math.ceil(now.getMinutes() / 15) * 15;
    const hour = rounded === 60 ? (now.getHours() + 1) % 24 : now.getHours();
    return `${String(hour).padStart(2, '0')}:${String(rounded === 60 ? 0 : rounded).padStart(2, '0')}`;
  }

  private roundToQuarterHour(value: string | null): string {
    if (!value) return '';
    const match = /^(\d{1,2}):(\d{1,2})/.exec(value.trim());
    if (!match) return value;
    let hour = Math.min(23, Math.max(0, Number(match[1])));
    let minute = Math.round(Math.min(59, Math.max(0, Number(match[2])) / 15)) * 15;
    if (minute === 60) {
      hour = (hour + 1) % 24;
      minute = 0;
    }
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  private patchForms(d: LeadDetalleResponse): void {
    this.datosForm.patchValue({
      tipoDocumento: d.tipoDocumento ?? 'DNI',
      numeroDocumentoTitularServicio: d.numeroDocumentoTitularServicio ?? '',
      ubigeoNacimiento: d.ubigeoNacimiento ?? '',
      nombreTitularServicio: d.nombreTitular ?? '',
      celularRegistro: d.celularRegistro ?? '',
      celularReferencia: d.celularReferencia ?? '',
      celularGrabacion: d.celularGrabacion ?? '',
      correo: d.correo ?? '',
      fechaNacimiento: d.fechaNacimiento ?? '',
      parentesco: d.parentesco ?? '',
      nombreMadre: d.nombreMadre ?? '',
      nombrePadre: d.nombrePadre ?? '',
      numeroDocumentoTitularCelularRegistro: d.numeroDocumentoTitularCelularRegistro ?? '',
      nombreTitularCelularRegistro: d.nombreTitularCelularRegistro ?? ''
    });
    this.direccionForm.patchValue({
      idDepartamentoDomicilio: 0,
      idProvinciaDomicilio: 0,
      idDistritoDomicilio: 0,
      ubigeoDomicilio: d.ubigeoDomicilio ?? '',
      tipoDomicilio: d.tipoDomicilio ?? '',
      tipoVia: d.tipoVia ?? '',
      via: d.via ?? '',
      direccion: d.direccion ?? '',
      referencia: d.referencia ?? '',
      latitud: d.latitud ?? '',
      longitud: d.longitud ?? '',
      urbanizacion: d.urbanizacion ?? '',
      numero: d.numero ?? '',
      manzana: d.manzana ?? '',
      lote: d.lote ?? '',
      nombreEdificio: d.nombreEdificio ?? '',
      nombreCondominio: d.nombreCondominio ?? '',
      plano: d.plano ?? '',
      piso: d.piso ?? '',
      interior: d.interior ?? '',
      tecnologia: d.tecnologia ?? '',
      esFullClaro: d.esFullClaro ?? false,
      esJalaCobertura: d.esJalaCobertura ?? false,
      esZonaPintada: d.esZonaPintada ?? false
    });
    this.ofertaForm.patchValue({
      idProveedor: 0,
      idPlan: d.idPlan ?? 0,
      idPromocionInterna: d.idPromocionInterna ?? 0
    });
    this.selectedTipificacionCode.set(d.tipificacionActual ?? '');
    this.selectedSubtipificacionCode.set(d.subtipificacionActual ?? '');
    this.loadedComment = (d.comentario ?? '').trim();
    this.tipificacionForm.reset({
      codigoTipificacion: d.tipificacionActual ?? '',
      codigoSubtipificacion: d.subtipificacionActual ?? '',
      comentario: d.comentario ?? '',
      fechaInstalacion: '',
      fechaProgramacion: d.fechaProgramacion ?? '',
      fechaRechazo: d.fechaRechazo ?? '',
      horaProgramada: d.horaProgramada ?? '',
      sec: d.sec ?? '',
      sot: d.sot ?? '',
      customerId: d.customerId ?? ''
    }, { emitEvent: false });
    this.adicionalesSeleccionados.set((d.adicionales ?? [])
      .filter((item) => (item.idAdicional ?? 0) > 0 && (item.cantidad ?? 0) > 0)
      .map((item) => ({ idAdicional: item.idAdicional!, cantidad: item.cantidad! })));
    this.datosForm.markAsPristine();
    this.direccionForm.markAsPristine();
    this.ofertaForm.markAsPristine();
    this.tipificacionForm.markAsPristine();
    this.selectedOfertaProviderId.set(null);
    this.provinciasDomicilio.set([]);
    this.distritosDomicilio.set([]);
    void this.resolveDomicilioSelection(d.ubigeoDomicilio ?? null);
  }

  protected onTipSelectionChange(_sel: TreeSelectSelection): void {
    this.page.set(0);
    void this.loadRows();
  }

  // --- Geo cascade ---

  protected async onDepartamentoChange(id: number | null): Promise<void> {
    this.selectedDepartamento.set(id);
    this.selectedProvincia.set(null);
    this.selectedDistrito.set(null);
    this.provincias.set([]);
    this.distritos.set([]);
    if (id !== null) {
      const provs = await firstValueFrom(this.leadService.listarProvincias(id));
      this.provincias.set(provs);
    }
    this.page.set(0);
    await this.loadRows();
  }

  protected async onProvinciaChange(id: number | null): Promise<void> {
    this.selectedProvincia.set(id);
    this.selectedDistrito.set(null);
    this.distritos.set([]);
    if (id !== null) {
      const dists = await firstValueFrom(this.leadService.listarDistritos(id));
      this.distritos.set(dists);
    }
    this.page.set(0);
    await this.loadRows();
  }

  protected async onDistritoChange(id: number | null): Promise<void> {
    this.selectedDistrito.set(id);
    this.page.set(0);
    await this.loadRows();
  }

  protected async onFilterColumnChange(col: FilterColumn): Promise<void> {
    this.filterColumn.set(col);
    this.filterEstado.set(null);
    this.filterPlan.set(null);
    this.filterGestor.set(null);
    this.selectedDepartamento.set(null);
    this.selectedProvincia.set(null);
    this.selectedDistrito.set(null);
    this.provincias.set([]);
    this.distritos.set([]);
    this.page.set(0);
    await this.loadRows();
  }

  protected async onFilterEstadoChange(val: string | null): Promise<void> {
    this.filterEstado.set(val);
    this.page.set(0);
    await this.loadRows();
  }

  protected async onFilterPlanChange(val: string | null): Promise<void> {
    this.filterPlan.set(val);
    this.page.set(0);
    await this.loadRows();
  }

  protected async onFilterGestorChange(val: string | null): Promise<void> {
    this.filterGestor.set(val);
    this.page.set(0);
    await this.loadRows();
  }

  // --- Period ---

  protected async onPeriodoChange(periodo: MetricsPeriodo): Promise<void> {
    this.periodo.set(periodo);
  }

  protected async onRangoChange(rango: MetricsRango): Promise<void> {
    this.dia.set(rango.desde);
    this.hasta.set(rango.hasta);
    this.page.set(0);
    await this.loadRows();
  }

  // --- Organize ---

  protected async setCampoFecha(value: CampoFechaListadoVenta): Promise<void> {
    this.campoFecha.set(value);
    this.page.set(0);
    await this.loadRows();
  }

  protected async setGroupBy(value: GroupMode): Promise<void> {
    this.groupBy.set(value);
    this.page.set(0);
    await this.loadRows();
  }

  protected async setSortBy(value: SortField): Promise<void> {
    this.sortBy.set(value);
    this.direction.set(this.defaultSortDirection(value));
    this.page.set(0);
    await this.loadRows();
  }

  protected async setDirection(value: SortDirection): Promise<void> {
    this.direction.set(value);
    this.page.set(0);
    await this.loadRows();
  }

  protected async changeColumnSort(field: SortField): Promise<void> {
    const defaultDir = this.defaultSortDirection(field);
    if (this.sortBy() !== field) {
      this.sortBy.set(field);
      this.direction.set(defaultDir);
    } else if (this.direction() === defaultDir) {
      this.direction.set(defaultDir === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(BackofficeGeneralBoardPageComponent.DEFAULT_SORT);
      this.direction.set(BackofficeGeneralBoardPageComponent.DEFAULT_DIRECTION);
    }
    this.page.set(0);
    await this.loadRows();
  }

  protected async onPage(event: { page?: number }): Promise<void> {
    this.page.set(event.page ?? 0);
    await this.loadRows();
  }

  protected async clearOrganize(): Promise<void> {
    this.campoFecha.set('INGRESO');
    this.groupBy.set('SIN_AGRUPAR');
    this.sortBy.set(BackofficeGeneralBoardPageComponent.DEFAULT_SORT);
    this.direction.set(BackofficeGeneralBoardPageComponent.DEFAULT_DIRECTION);
    this.filterColumn.set('NINGUNO');
    this.filterEstado.set(null);
    this.filterPlan.set(null);
    this.filterGestor.set(null);
    this.selectedDepartamento.set(null);
    this.selectedProvincia.set(null);
    this.selectedDistrito.set(null);
    this.provincias.set([]);
    this.distritos.set([]);
    this.page.set(0);
    await this.loadRows();
  }

  protected async clearFilters(): Promise<void> {
    this.selectedTipificaciones.set(this.allTipKeys());
    this.selectedSubtipificaciones.set([]);
    this.filterColumn.set('NINGUNO');
    this.filterEstado.set(null);
    this.filterPlan.set(null);
    this.filterGestor.set(null);
    this.selectedDepartamento.set(null);
    this.selectedProvincia.set(null);
    this.selectedDistrito.set(null);
    this.provincias.set([]);
    this.distritos.set([]);
    this.searchInput.set('');
    this.searchActive.set('');
    this.campoFecha.set('INGRESO');
    this.groupBy.set('SIN_AGRUPAR');
    this.sortBy.set(BackofficeGeneralBoardPageComponent.DEFAULT_SORT);
    this.direction.set(BackofficeGeneralBoardPageComponent.DEFAULT_DIRECTION);
    this.dia.set(this.today());
    this.hasta.set(this.today());
    this.page.set(0);
    await this.loadRows();
  }

  protected sortIcon(field: SortField): string {
    if (this.sortBy() !== field) {
      return 'pi pi-sort-alt';
    }
    return this.direction() === 'asc' ? 'pi pi-sort-amount-up-alt' : 'pi pi-sort-amount-down';
  }

  protected formatRelevantDate(row: LeadBandejaVentaResponse): string {
    if (row.fechaRelevanteAt) {
      return this.formatInstantDate(row.fechaRelevanteAt);
    }
    return row.fechaRelevante ? this.formatDate(row.fechaRelevante) : '';
  }

  protected formatRelevantTime(row: LeadBandejaVentaResponse): string {
    if (row.horaRelevante) {
      return this.displayTimeOnly(row.horaRelevante);
    }
    return this.formatInstantTime(row.fechaRelevanteAt);
  }

  protected fechaKind(row: LeadBandejaVentaResponse): string {
    const labels: Record<string, string> = {
      PROGRAMACION: 'Programación',
      RECHAZO: 'Rechazo',
      INSTALACION: 'Instalación',
      REGISTRO_CRM: 'Ingresado',
      GRABACION: 'Grabación',
      TIPIFICACION: 'Tipificación',
      INGRESO: 'Ingreso',
      ULTIMA_GESTION: 'Última gestión'
    };
    return labels[String(row.tipoFechaRelevante ?? '')] ?? 'Fecha';
  }

  protected formatIngreso(row: LeadBandejaVentaResponse): string {
    return row.fechaIngresoEtapa ? this.formatInstantDate(row.fechaIngresoEtapa) : 'Sin ingreso';
  }

  protected formatIngresoTime(row: LeadBandejaVentaResponse): string {
    return this.formatInstantTime(row.fechaIngresoEtapa);
  }

  protected relevantLabel(row: LeadBandejaVentaResponse): string {
    const date = this.formatRelevantDate(row);
    if (!date) {
      return '';
    }
    const time = this.formatRelevantTime(row);
    return `${this.fechaKind(row)}${time ? ` · ${time}` : ''}`;
  }

  protected periodLabel(): string {
    const desde = this.dia();
    const hasta = this.hasta();
    if (!desde && !hasta) {
      return 'Sin periodo';
    }
    if (!hasta || desde === hasta) {
      return this.formatDate(desde ?? hasta ?? '');
    }
    return `${this.formatDate(desde ?? '')} - ${this.formatDate(hasta)}`;
  }

  protected display(value: unknown, fallback = 'Sin dato'): string {
    const text = value === null || value === undefined ? '' : String(value).trim();
    return text || fallback;
  }

  protected money(value?: number | null): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return 'Sin precio';
    }
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
  }

  protected displayOperationalCode(value: string | null | undefined, emptyLabel: string): string {
    const text = (value ?? '').trim();
    return text || emptyLabel;
  }

  protected advisorAlias(value?: string | null): string {
    const words = (value ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (!words.length) {
      return 'SIN';
    }
    return words.map((word) => word.slice(0, 3).toUpperCase()).join('');
  }

  protected providerInitial(value?: string | null): string {
    const text = this.display(value, 'P');
    return text.slice(0, 1).toUpperCase();
  }

  protected providerLogo(nombreProveedor?: string | null): string | null {
    return resolveProviderLogo(nombreProveedor);
  }

  protected formatInstantShort(value?: string | null): string {
    const date = this.parseInstant(value);
    if (!date) {
      return '';
    }
    return `${this.formatInstantDate(value)} ${this.formatInstantTime(value)}`;
  }

  protected commentText(row: LeadBandejaVentaResponse): string {
    return (row.comentarioLead ?? '').trim();
  }

  protected isConsulta(row: LeadBandejaVentaResponse): boolean {
    return String(row.etapaActual ?? '').trim().toUpperCase() !== 'VENTA';
  }

  protected consultaLabel(row: LeadBandejaVentaResponse): string {
    const etapa = String(row.etapaActual ?? '').trim().toUpperCase();
    return etapa && etapa !== 'VENTA' ? `En ${etapa}` : 'Consulta';
  }

  protected etapaTagClass(row: LeadBandejaVentaResponse): string {
    const etapa = String(row.etapaActual ?? '').trim().toUpperCase();
    const known = ['PREVENTA', 'VENTA', 'POSTVENTA', 'COBRANZA'];
    const tone = known.includes(etapa) ? etapa.toLowerCase() : 'default';
    return `etapa-tag etapa-tag--${tone}`;
  }

  protected groupLabel(row: LeadBandejaVentaResponse): string {
    switch (this.groupBy()) {
      case 'ESTADO':
        return this.display(row.estadoSeguimiento, 'Sin estado');
      case 'PLAN':
        return this.display(row.plan, 'Sin plan');
      case 'TIPIFICACION':
        return this.display(row.codigoTipificacionBandeja, 'Sin tipificación');
      case 'SUBTIPIFICACION': {
        const tip = this.display(row.codigoTipificacionBandeja, '');
        const sub = this.display(row.codigoSubtipificacionBandeja, '');
        if (tip && sub) return `${tip} / ${sub}`;
        if (tip) return tip;
        return 'Sin tipificación';
      }
      case 'ULTIMO_GESTOR':
        return this.display(row.nombreAsesorUltimaGestion ?? row.nombreAsesorEvento, 'Sin gestor');
      case 'ASESOR_PREVENTA':
        return this.display(row.nombreAsesorMeritoPreventa, 'Sin asesor preventa');
      case 'DEPARTAMENTO':
        return this.display(row.departamentoGrupo, 'Sin ubigeo');
      case 'PROVINCIA':
        return this.display(row.departamentoGrupo, 'Sin ubigeo');
      case 'DISTRITO':
        return this.display(row.departamentoGrupo, 'Sin ubigeo');
      default:
        return '';
    }
  }

  protected showGroupHeader(index: number, row: LeadBandejaVentaResponse): boolean {
    if (this.groupBy() === 'SIN_AGRUPAR') {
      return false;
    }
    const previous = this.rows()[index - 1];
    return !previous || this.groupLabel(previous) !== this.groupLabel(row);
  }

  protected tableColumnCount(): number {
    return this.showSecSotColumn() ? 9 : 8;
  }

  private async loadDepartamentos(): Promise<void> {
    try {
      const deptos = await firstValueFrom(this.leadService.listarDepartamentos());
      this.departamentos.set(deptos);
    } catch {
      this.departamentos.set([]);
    }
  }

  private async loadFilterCatalogs(): Promise<void> {
    try {
      const [planes, gestores] = await Promise.all([
        firstValueFrom(this.leadService.listarPlanes(undefined, true)),
        firstValueFrom(this.leadService.listarGestoresBandeja(this.providerScope.activeId()))
      ]);
      this.planOptions.set(planes.map(p => ({ label: p.nombre, value: p.nombre })));
      this.gestorOptions.set(gestores.map(g => ({ label: g, value: g })));
    } catch {
      this.planOptions.set([]);
      this.gestorOptions.set([]);
    }
  }

  private async loadCatalogo(): Promise<void> {
    this.catalogLoading.set(true);
    try {
      const porProveedor = await firstValueFrom(
        this.leadService.getCatalogoPorProveedor('VENTA', this.providerScope.activeId())
      );
      const flat: TipificacionResponse[] = [];
      const groups: TreeSelectGroup[] = porProveedor.map(prov => {
        const sorted = [...(prov.tipificaciones ?? [])].sort((a, b) => a.orden - b.orden);
        for (const t of sorted) {
          if (!flat.some(f => f.codigo === t.codigo)) flat.push(t);
        }
        return {
          label: prov.nombreProveedor,
          nodes: sorted.map(t => ({
            key: t.codigo,
            label: t.codigo,
            tooltip: t.descripcion,
            children: [...(t.subtipificaciones ?? [])].sort((a, b) => a.orden - b.orden).map(s => ({
              key: s.codigo,
              label: s.codigo,
              tooltip: s.descripcion
            }))
          }))
        };
      });
      const SIN = BackofficeGeneralBoardPageComponent.SIN_TIP_KEY;
      const sinTipNode = { key: SIN, label: 'Sin tipificación', tooltip: 'Leads sin tipificación en la etapa', children: [] as { key: string; label: string; tooltip?: string }[] };
      if (groups.length > 0) {
        groups[0] = { ...groups[0], nodes: [sinTipNode, ...groups[0].nodes] };
      } else {
        groups.push({ label: '', nodes: [sinTipNode] });
      }
      this.catalogoFlat.set(flat);
      this.tipGroups.set(groups);
      const allKeys = groups.flatMap(g => g.nodes.map(n => n.key));
      this.selectedTipificaciones.set(allKeys);
      this.selectedSubtipificaciones.set([]);
    } catch (err) {
      console.error('[Bandeja General] Error cargando catálogo tipificaciones', err);
    } finally {
      this.catalogLoading.set(false);
    }
  }

  private startRealtime(): void {
    const streams = [this.realtimeService.watchTopic('/topic/leads/etapa/VENTA')];
    const empleadoId = this.sessionService.getSession()?.empleadoId;
    if (empleadoId) {
      streams.push(this.realtimeService.watchTopic(`/topic/leads/asesor/${empleadoId}`));
    }

    merge(...streams)
      .pipe(
        filter((event) => this.isRelevantRealtime(event.tipo)),
        debounceTime(BackofficeGeneralBoardPageComponent.REALTIME_RELOAD_DEBOUNCE_MS),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => void this.loadRows());
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

  private async loadRows(): Promise<void> {
    const requestToken = ++this.loadRequestToken;
    this.loading.set(true);
    this.error.set(null);
    this.failedDetailRow.set(null);
    try {
      const SIN = BackofficeGeneralBoardPageComponent.SIN_TIP_KEY;
      const allTips = this.selectedTipificaciones();
      const allSubtips = this.selectedSubtipificaciones();

      if (allTips.length === 0 && allSubtips.length === 0) {
        this.rows.set([]);
        this.total.set(0);
        return;
      }

      const realCodes = allTips.filter(k => k !== SIN);
      const sinTipChecked = allTips.includes(SIN);
      const allKeys = this.allTipKeys().filter(k => k !== SIN);
      const isFullSelection = sinTipChecked
        && allSubtips.length === 0
        && realCodes.length >= allKeys.length
        && allKeys.every(k => realCodes.includes(k));

      const response = await firstValueFrom(this.leadService.listarBandejaVentaNormalizada({
        pageNumber: this.page(),
        pageSize: this.pageSize,
        sortBy: this.sortBy(),
        direction: this.direction(),
        lead: this.searchActive() || null,
        codigosTipificacion: isFullSelection ? [] : realCodes,
        sinTipificacion: isFullSelection ? undefined : (sinTipChecked || undefined),
        codigosSubtipificacion: isFullSelection ? [] : allSubtips,
        idProveedor: this.providerScope.activeId(),
        idDepartamento: this.selectedDepartamento(),
        idProvincia: this.selectedProvincia(),
        idDistrito: this.selectedDistrito(),
        estado: this.filterEstado(),
        nombrePlan: this.filterPlan(),
        nombreGestor: this.filterGestor(),
        fechaDesde: this.dia(),
        fechaHasta: this.hasta(),
        campoFecha: this.campoFecha(),
        groupBy: this.groupBy() === 'SIN_AGRUPAR' ? null : this.groupBy()
      }));
      if (requestToken !== this.loadRequestToken) {
        return;
      }
      this.rows.set(response.content ?? []);
      this.total.set(response.totalElements ?? 0);
    } catch (error) {
      if (requestToken !== this.loadRequestToken) {
        return;
      }
      console.error('Error al cargar bandeja general de venta', error);
      this.rows.set([]);
      this.total.set(0);
      this.error.set(this.resolveLoadError(error));
    } finally {
      if (requestToken === this.loadRequestToken) {
        this.loading.set(false);
      }
    }
  }

  private cancelSearchDebounce(): void {
    if (this.searchDebounceTimer !== null) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
  }

  private today(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  private normalizeSearch(value: string): string {
    const raw = value.trim();
    if (!raw) {
      return '';
    }
    if (raw.startsWith('@')) {
      const usermeta = raw.replace(/\s+/g, '').replace(/^@+/, '');
      return usermeta ? `@${usermeta}` : '';
    }
    return raw.replace(/\D/g, '');
  }

  private resolveLoadError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo cargar la bandeja general.';
    }
    const backendMessage = typeof error.error?.message === 'string'
      ? error.error.message
      : typeof error.error?.error === 'string'
        ? error.error.error
        : '';
    const detail = backendMessage || error.message;
    return `No se pudo cargar la bandeja general. HTTP ${error.status}${detail ? `: ${detail}` : ''}`;
  }

  private resolveDetailLoadError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo cargar el detalle del lead.';
    }
    const backendMessage = typeof error.error?.message === 'string'
      ? error.error.message
      : typeof error.error?.error === 'string'
        ? error.error.error
        : '';
    const detail = backendMessage || error.message;
    return `No se pudo cargar el detalle del lead. HTTP ${error.status}${detail ? `: ${detail}` : ''}`;
  }

  private defaultSortDirection(field: SortField): SortDirection {
    return this.isDateSort(field) ? 'desc' : 'asc';
  }

  private isDateSort(field: SortField): boolean {
    return field === 'fechaIngresoEtapa' || field === 'fechaRelevante' || field === 'fechaUltimaGestion';
  }

  private formatDate(value: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
    if (!match) {
      return value;
    }
    return `${match[3]}/${match[2]}/${match[1].slice(2)}`;
  }

  /** Fecha de un instante del servidor expresada en la zona operativa de Lima. */
  private formatInstantDate(value?: string | null): string {
    const date = this.parseInstant(value);
    if (!date) {
      return '';
    }
    return date.toLocaleDateString('en-GB', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  }

  private displayTimeOnly(value?: string | null): string {
    const match = /^(\d{2}):(\d{2})/.exec(value ?? '');
    if (!match) {
      return '';
    }
    const hour24 = Number(match[1]);
    const suffix = hour24 < 12 ? 'AM' : 'PM';
    const hour12 = hour24 % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${match[2]} ${suffix}`;
  }

  private formatInstantTime(value?: string | null): string {
    const date = this.parseInstant(value);
    if (!date) {
      return '';
    }
    return date.toLocaleTimeString('en-US', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  private parseInstant(value?: string | null): Date | null {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}

export const canDeactivateBackofficeGeneralBoard: CanDeactivateFn<BackofficeGeneralBoardPageComponent> =
  (component) => component?.canDeactivate?.() ?? true;
