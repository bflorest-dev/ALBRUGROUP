import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest, firstValueFrom, merge } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';
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
import { Popover, PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SessionService } from '../../../../core/services/session.service';
import { PresenceService } from '../../../../core/services/presence.service';
import { OperationalGateService } from '../../../../core/services/operational-gate.service';
import { CurrentUserProviderScopeService } from '../../../../core/services/current-user-provider-scope.service';
import { EstadoAsistencia } from '../../../../shared/models/schedule/estado-asistencia';
import { LeadCommercialDataTabsComponent } from '../../../../shared/components/lead-commercial-data-tabs/lead-commercial-data-tabs.component';
import { LeadPlanSummaryComponent } from '../../../../shared/components/lead-plan-summary/lead-plan-summary.component';
import { PhoneActionButtonComponent } from '../../../../shared/components/phone-action-button/phone-action-button.component';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { MetricsPeriodo, PeriodSelectorComponent } from '../../../../shared/components/period-selector/period-selector.component';
import { MetricsRango, resolveMetricsRange } from '../../../../shared/utils/metrics-period';
import { TipificationStackComponent, TipificationPaletteByCode } from '../../../../shared/components/tipification-stack/tipification-stack.component';
import { providerLogo as resolveProviderLogo } from '../../../../shared/utils/provider-logo';
import { buildWhatsAppUrl } from '../../../../shared/utils/phone-link';
import {
  AdicionalResponse,
  CatalogoResponse,
  EventoResponse,
  LeadGtrGroupItemResponse,
  LeadContextoLookupResponse,
  LeadDetalleResponse,
  LeadInstalacionCorreccionCandidatoResponse,
  LeadInstaladoBackofficeResponse,
  LeadVentaGroupFilter,
  LeadVentaGroupType,
  LeadVentaGroupsResponse,
  LeadVentaResponse,
  PageQuery,
  PlanResponse,
  PromocionComercialResponse,
  UbigeoItem
} from '../../../../shared/models/preventa/preventa.models';
import { LeadRealtimeService } from '../../../preventa/services/lead-realtime.service';
import { BackofficeLeadService, LeadRechazadosFilters } from '../../services/backoffice-lead.service';

type BackofficeSection = 'plataforma' | 'programados' | 'subsanables' | 'rechazados' | 'instalados' | 'correccion-instalacion';
type BackofficeGroupMode = 'SIN_AGRUPAR' | 'ESTADO' | 'ASESOR' | 'PLAN' | 'PROVEEDOR' | 'TIPIFICACION';
type BackofficeSortField = 'fechaIngresoEtapa' | 'fechaRechazo' | 'fechaInstalacion' | 'fechaTipificacionInstalado' | 'fechaProgramacion' | 'fechaUltimaGestion' | 'lastEntryAt' | 'createdAt' | 'lead' | 'nombreAsesorAsignado' | 'estado' | 'estadoClientePostventa' | 'tipificacion';
type BackofficeSortDirection = 'asc' | 'desc';
// Campo de fecha contra el que la bandeja filtra el periodo (mecanica "Usar fecha de").
type BackofficeCampoFecha = 'PROGRAMACION' | 'RECHAZO' | 'INSTALACION' | 'TIPIFICACION_INSTALADO' | 'INGRESO' | 'ULTIMA_GESTION';
type DrawerMode = 'gestion' | 'consulta';
type OrganizationFilterOption = { label: string; value: string; codigo?: string; descripcion?: string; sinValor?: boolean; rawValue?: string | null };
type VisualLeadVenta = LeadVentaResponse & {
  isNew?: boolean;
  searchConsultationOnly?: boolean;
  organizationGroupHint?: string;
  organizationGroupKey?: string;
  organizationGroupLabel?: string;
  // Separacion por fecha en Plataforma: etiqueta visible y clave estable para el orden interno de PrimeNG.
  fechaGroupKey?: string;
  fechaGroupLabel?: string;
  fechaGroupSortKey?: string;
  fechaInstalacion?: string | null;
  fechaTipificacionInstalado?: string | null;
  idAsesorInstalador?: number | null;
  nombreAsesorInstalador?: string | null;
  estadoClientePostventa?: string | null;
  etapaActual?: string | null;
};
type CorreccionInstalacionRow = LeadInstalacionCorreccionCandidatoResponse & { isNew?: boolean };
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
const TIPIFICACIONES_RECHAZO_VENTA = new Set(['SUBSANABLE', 'NO RECUPERABLE']);
// Ventana para agrupar la rafaga de eventos realtime en una sola reconciliacion (ver startRealtime).
const REALTIME_RECONCILE_DEBOUNCE_MS = 600;

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
    TooltipModule,
    LeadCommercialDataTabsComponent,
    LeadPlanSummaryComponent,
    PhoneActionButtonComponent,
    SectionHeaderComponent,
    PeriodSelectorComponent,
    TipificationStackComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './backoffice-workspace-page.component.html',
  styleUrl: './backoffice-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackofficeWorkspacePageComponent implements OnInit, OnDestroy {
  @ViewChild('tipificationFooter') private tipificationFooter?: ElementRef<HTMLElement>;
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly operationalGateService = inject(OperationalGateService);
  private readonly providerScope = inject(CurrentUserProviderScopeService);
  private lastProviderId: number | null | undefined = undefined;
  private readonly sessionService = inject(SessionService);
  private readonly presenceService = inject(PresenceService);
  private readonly leadService = inject(BackofficeLeadService);
  private readonly realtimeService = inject(LeadRealtimeService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly realtimeSubscription = new Subscription();
  private readonly newRowTimers = new Map<number, number>();
  private readonly pickerDateCache = new Map<string, Date | null>();
  private readonly provinciasCache = new Map<number, UbigeoItem[]>();
  private readonly distritosCache = new Map<number, UbigeoItem[]>();
  private organizeCloseTimeout: ReturnType<typeof setTimeout> | null = null;
  private organizeArrowRaf = 0;
  private plataformaRequestSeq = 0;
  private programadosRequestSeq = 0;
  private subsanablesRequestSeq = 0;
  private rechazadosRequestSeq = 0;
  private instaladosRequestSeq = 0;
  private correccionInstalacionRequestSeq = 0;
  private domicilioResolveSeq = 0;
  private initialized = false;
  private initializeInFlight = false;
  private lastAttendanceStatus: EstadoAsistencia | null = null;
  private detailHadOperationalAction = false;
  private readonly operationalGate = this.operationalGateService.createGate('backoffice-workspace');

  protected readonly pageSize = 12;
  protected readonly section = signal<BackofficeSection>('plataforma');
  private readonly adminEquipoId = signal<number | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isReconciling = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly leadActionId = signal<number | null>(null);
  protected readonly plataformaRows = signal<VisualLeadVenta[]>([]);
  protected readonly programadosRows = signal<VisualLeadVenta[]>([]);
  protected readonly subsanablesRows = signal<VisualLeadVenta[]>([]);
  protected readonly rechazadosRows = signal<VisualLeadVenta[]>([]);
  protected readonly instaladosRows = signal<VisualLeadVenta[]>([]);
  protected readonly correccionInstalacionRows = signal<CorreccionInstalacionRow[]>([]);
  protected readonly plataformaGroupingMode = signal<BackofficeGroupMode>('SIN_AGRUPAR');
  protected readonly plataformaSortField = signal<BackofficeSortField>('fechaIngresoEtapa');
  protected readonly plataformaSortDirection = signal<BackofficeSortDirection>('desc');
  protected readonly plataformaCampoFecha = signal<BackofficeCampoFecha>('INGRESO');
  protected readonly detail = signal<LeadDetalleResponse | null>(null);
  // Campos que muestra el equipo del lead: se ven los visibles del equipo + los que tengan valor.
  protected readonly camposVisibles = computed<ReadonlySet<string>>(
    () => new Set((this.detail()?.camposConfig ?? []).filter((campo) => campo.visible).map((campo) => campo.campo))
  );
  protected readonly eventos = signal<EventoResponse[]>([]);
  protected readonly selectedLeadId = signal<number | null>(null);
  protected readonly totalPlataforma = signal(0);
  protected readonly totalProgramados = signal(0);
  protected readonly totalSubsanables = signal(0);
  protected readonly totalRechazados = signal(0);
  protected readonly totalInstalados = signal(0);
  protected readonly totalCorreccionInstalacion = signal(0);
  protected readonly pagePlataforma = signal(0);
  protected readonly pageProgramados = signal(0);
  protected readonly pageSubsanables = signal(0);
  protected readonly pageRechazados = signal(0);
  protected readonly pageInstalados = signal(0);
  protected readonly pageCorreccionInstalacion = signal(0);
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
  protected readonly tipificacionCommentPlaceholder = signal('Agrega una nota si ayuda a la siguiente gestion');
  protected readonly planes = signal<PlanResponse[]>([]);
  protected readonly ofertaPlanes = signal<PlanResponse[]>([]);
  protected readonly promociones = signal<PromocionComercialResponse[]>([]);
  protected readonly adicionales = signal<AdicionalResponse[]>([]);
  protected readonly selectedOfertaProviderId = signal<number | null>(null);
  protected readonly adicionalesSeleccionados = signal<AdicionalSeleccionado[]>([]);
  protected readonly departamentos = signal<UbigeoItem[]>([]);
  protected readonly provinciasDomicilio = signal<UbigeoItem[]>([]);
  protected readonly distritosDomicilio = signal<UbigeoItem[]>([]);
  protected readonly ubigeoDomicilioLoading = signal(false);
  protected readonly ubigeoDomicilioError = signal<string | null>(null);
  private readonly adicionalesDirty = signal(false);
  protected readonly detailDrawerOpen = signal(false);
  protected readonly correctionDrawerOpen = signal(false);
  protected readonly correctionTarget = signal<CorreccionInstalacionRow | null>(null);
  protected readonly drawerMode = signal<DrawerMode>('gestion');
  protected readonly detailReadOnly = computed(() => this.drawerMode() === 'consulta');
  protected readonly activeDataTab = signal('datos');
  protected readonly tipificationFooterPinned = signal(false);
  protected readonly tipificationOverlayOpen = signal(false);
  protected readonly tipificationFooterExpanded = computed(() =>
    !this.detailReadOnly() && (this.tipificationFooterPinned() || this.tipificationOverlayOpen())
  );
  protected readonly searchInput = signal('');
  protected readonly searchTermActive = signal('');
  protected readonly isSearching = signal(false);
  protected readonly searchLookup = signal<LeadContextoLookupResponse | null>(null);
  // Busqueda GLOBAL de VENTA: es transversal a las 3 tabs. Con un termino activo, la tabla muestra los
  // resultados de `/venta?lead=` (encuentra el lead en cualquier estado), no la bandeja de la tab.
  private readonly searchRows = signal<VisualLeadVenta[]>([]);
  private readonly searchTotal = signal(0);
  private readonly searchPage = signal(0);
  private searchRequestSeq = 0;
  protected readonly isSearchMode = computed(() => this.section() !== 'correccion-instalacion' && this.searchTermActive().length > 0);
  protected readonly todayDate = this.todayLocalDate();
  // Periodo del `app-period-selector` por bandeja. Arranca en Hoy con fechas explicitas para que la
  // primera carga no dependa de defaults del backend.
  private readonly plataformaPeriodo = signal<MetricsPeriodo>('dia');
  private readonly plataformaDia = signal<string | null>(this.todayDate);
  private readonly plataformaHasta = signal<string | null>(this.todayDate);
  private readonly programadosPeriodo = signal<MetricsPeriodo>('dia');
  private readonly programadosDia = signal<string | null>(this.todayDate);
  private readonly programadosHasta = signal<string | null>(this.todayDate);
  // Programados: orden en servidor + campo de fecha del filtro. Default operativo = fecha de
  // programacion ascendente (la agenda mas proxima primero), filtrando por fecha de programacion.
  private readonly programadosSortField = signal<BackofficeSortField>('fechaProgramacion');
  private readonly programadosSortDirection = signal<BackofficeSortDirection>('asc');
  private readonly programadosCampoFecha = signal<BackofficeCampoFecha>('PROGRAMACION');
  // Agrupar por (categorico): las fechas NO agrupan (eso lo cubre "Usar fecha de").
  private readonly programadosGroupBy = signal<BackofficeGroupMode>('SIN_AGRUPAR');
  // Subsanables y Rechazados comparten endpoint/columnas => comparten estado de organizacion.
  private readonly rechazoSortField = signal<BackofficeSortField>('fechaRechazo');
  private readonly rechazoSortDirection = signal<BackofficeSortDirection>('desc');
  private readonly rechazoCampoFecha = signal<BackofficeCampoFecha>('RECHAZO');
  private readonly rechazoGroupBy = signal<BackofficeGroupMode>('SIN_AGRUPAR');
  // Instalados: Estado = postventa; su "Ultima gestion" es la fecha de tipificacion (instalado).
  private readonly instaladosSortField = signal<BackofficeSortField>('fechaInstalacion');
  private readonly instaladosSortDirection = signal<BackofficeSortDirection>('desc');
  private readonly instaladosCampoFecha = signal<BackofficeCampoFecha>('INSTALACION');
  private readonly instaladosGroupBy = signal<BackofficeGroupMode>('SIN_AGRUPAR');
  private readonly subsanablesPeriodo = signal<MetricsPeriodo>('dia');
  private readonly subsanablesDia = signal<string | null>(this.todayDate);
  private readonly subsanablesHasta = signal<string | null>(this.todayDate);
  private readonly rechazadosPeriodo = signal<MetricsPeriodo>('dia');
  private readonly rechazadosDia = signal<string | null>(this.todayDate);
  private readonly rechazadosHasta = signal<string | null>(this.todayDate);
  private readonly instaladosPeriodo = signal<MetricsPeriodo>('dia');
  private readonly instaladosDia = signal<string | null>(this.todayDate);
  private readonly instaladosHasta = signal<string | null>(this.todayDate);
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
  // Programados: opciones del popover (orden + campo de fecha del filtro).
  protected readonly programadosSortOptions: Array<{ label: string; value: BackofficeSortField }> = [
    { label: 'Fecha programacion', value: 'fechaProgramacion' },
    { label: 'Fecha ingreso', value: 'fechaIngresoEtapa' },
    { label: 'Ultima gestion', value: 'fechaUltimaGestion' },
    { label: 'Estado', value: 'estado' }
  ];
  protected readonly programadosCampoFechaOptions: Array<{ label: string; value: BackofficeCampoFecha }> = [
    { label: 'Fecha programacion', value: 'PROGRAMACION' },
    { label: 'Fecha ingreso', value: 'INGRESO' },
    { label: 'Ultima gestion', value: 'ULTIMA_GESTION' }
  ];
  // Solo categoricos (Tipificacion se omite: en Programados todos son PROGRAMADO).
  protected readonly programadosGroupOptions: Array<{ label: string; value: BackofficeGroupMode }> = [
    { label: 'Sin agrupar', value: 'SIN_AGRUPAR' },
    { label: 'Estado', value: 'ESTADO' },
    { label: 'Plan', value: 'PLAN' },
    { label: 'Asesor', value: 'ASESOR' }
  ];
  // Subsanables / Rechazados: aqui la tipificacion es uniforme pero la subtipificacion varia, asi
  // que ordenar/agrupar por Tipificacion si aporta.
  protected readonly rechazoSortOptions: Array<{ label: string; value: BackofficeSortField }> = [
    { label: 'Fecha rechazo', value: 'fechaRechazo' },
    { label: 'Fecha ingreso', value: 'fechaIngresoEtapa' },
    { label: 'Ultima gestion', value: 'fechaUltimaGestion' },
    { label: 'Estado', value: 'estado' },
    { label: 'Tipificacion', value: 'tipificacion' }
  ];
  protected readonly rechazoCampoFechaOptions: Array<{ label: string; value: BackofficeCampoFecha }> = [
    { label: 'Fecha rechazo', value: 'RECHAZO' },
    { label: 'Fecha ingreso', value: 'INGRESO' },
    { label: 'Ultima gestion', value: 'ULTIMA_GESTION' }
  ];
  protected readonly rechazoGroupOptions: Array<{ label: string; value: BackofficeGroupMode }> = [
    { label: 'Sin agrupar', value: 'SIN_AGRUPAR' },
    { label: 'Estado', value: 'ESTADO' },
    { label: 'Plan', value: 'PLAN' },
    { label: 'Tipificacion', value: 'TIPIFICACION' },
    { label: 'Asesor', value: 'ASESOR' }
  ];
  // Instalados: la tipificacion es uniforme (INSTALADO) => no ordena/agrupa. Estado = postventa.
  protected readonly instaladosSortOptions: Array<{ label: string; value: BackofficeSortField }> = [
    { label: 'Fecha instalacion', value: 'fechaInstalacion' },
    { label: 'Fecha tipificacion', value: 'fechaTipificacionInstalado' },
    { label: 'Estado', value: 'estadoClientePostventa' }
  ];
  protected readonly instaladosCampoFechaOptions: Array<{ label: string; value: BackofficeCampoFecha }> = [
    { label: 'Fecha instalacion', value: 'INSTALACION' },
    { label: 'Fecha tipificacion', value: 'TIPIFICACION_INSTALADO' }
  ];
  protected readonly instaladosGroupOptions: Array<{ label: string; value: BackofficeGroupMode }> = [
    { label: 'Sin agrupar', value: 'SIN_AGRUPAR' },
    { label: 'Estado', value: 'ESTADO' },
    { label: 'Plan', value: 'PLAN' },
    { label: 'Asesor', value: 'ASESOR' }
  ];
  // Plataforma: orden en servidor + agrupado por subcabeceras (mismo patron que las demas tabs).
  protected readonly plataformaSortOptions: Array<{ label: string; value: BackofficeSortField }> = [
    { label: 'Fecha ingreso', value: 'fechaIngresoEtapa' },
    { label: 'Ultima gestion', value: 'fechaUltimaGestion' },
    { label: 'Estado', value: 'estado' },
    { label: 'Tipificacion', value: 'tipificacion' }
  ];
  protected readonly plataformaCampoFechaOptions: Array<{ label: string; value: BackofficeCampoFecha }> = [
    { label: 'Fecha ingreso', value: 'INGRESO' },
    { label: 'Ultima gestion', value: 'ULTIMA_GESTION' }
  ];
  protected readonly plataformaGroupOptions: Array<{ label: string; value: BackofficeGroupMode }> = [
    { label: 'Sin agrupar', value: 'SIN_AGRUPAR' },
    { label: 'Estado', value: 'ESTADO' },
    { label: 'Plan', value: 'PLAN' },
    { label: 'Tipificacion', value: 'TIPIFICACION' },
    { label: 'Asesor', value: 'ASESOR' }
  ];
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
    fechaRechazo: [''],
    horaProgramada: [''],
    sec: [''],
    sot: [''],
    customerId: ['']
  });

  protected readonly correctionForm = this.fb.group({
    sec: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
    sot: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    fechaInstalacion: ['', [Validators.required]]
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
  protected readonly requiresRejectionDate = computed(() => this.isRejectionTipification(this.selectedTipificacionCode()));
  protected readonly requiresSecSot = computed(() =>
    this.selectedSubtipificacionRequiresSecSot()
    && this.detail()?.requiereSecSotVenta === true
  );
  protected readonly requiresCustomerId = computed(() =>
    (this.selectedSubtipificacion()?.comportamientos?.includes('REQUIERE_CUSTOMER_ID') ?? false)
    && this.normalizedCode(this.detail()?.nombreProveedorPlan) === 'CLARO'
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
    if (this.detailReadOnly()) {
      return false;
    }
    return this.datosForm.dirty || this.direccionForm.dirty || this.ofertaForm.dirty || this.adicionalesDirty();
  }
  protected readonly boardTitle = computed(() => {
    switch (this.section()) {
      case 'programados': return 'Leads programados';
      case 'subsanables': return 'Leads subsanables';
      case 'rechazados': return 'Leads rechazados';
      case 'instalados': return 'Leads instalados';
      case 'correccion-instalacion': return 'Instalaciones pendientes';
      default: return 'Leads disponibles';
    }
  });
  protected readonly boardSubtitle = computed(() => {
    switch (this.section()) {
      case 'programados': return 'Gestiona leads programados por fecha y hora cercana.';
      case 'subsanables': return 'Revisa leads subsanables por fecha de rechazo.';
      case 'rechazados': return 'Revisa leads rechazados por fecha de rechazo.';
      case 'instalados': return 'Revisa leads instalados y su estado actual en Postventa.';
      case 'correccion-instalacion': return 'Completa datos técnicos pendientes de leads instalados.';
      default: return 'Gestiona leads en venta y revisa quien los tiene asignados.';
    }
  });
  protected readonly canOrganizeActiveSection = computed(() =>
    this.section() === 'plataforma'
    || this.section() === 'programados'
    || this.isFechaRechazoSection()
    || this.isFechaInstalacionSection()
  );
  protected readonly activeGroupingMode = computed<BackofficeGroupMode>(() => {
    if (this.section() === 'plataforma') {
      return this.plataformaGroupingMode();
    }
    if (this.section() === 'programados') {
      return this.programadosGroupBy();
    }
    if (this.isFechaRechazoSection()) {
      return this.rechazoGroupBy();
    }
    if (this.isFechaInstalacionSection()) {
      return this.instaladosGroupBy();
    }
    return 'SIN_AGRUPAR';
  });
  protected readonly activeSortField = computed<BackofficeSortField>(() =>
    this.section() === 'programados'
      ? this.programadosSortField()
      : this.isFechaRechazoSection()
        ? this.rechazoSortField()
        : this.isFechaInstalacionSection()
          ? this.instaladosSortField()
          : this.plataformaSortField()
  );
  protected readonly activeSortDirection = computed<BackofficeSortDirection>(() =>
    this.section() === 'programados'
      ? this.programadosSortDirection()
      : this.isFechaRechazoSection()
        ? this.rechazoSortDirection()
        : this.isFechaInstalacionSection()
          ? this.instaladosSortDirection()
          : this.plataformaSortDirection()
  );
  // Campo de fecha activo (mecanica "Usar fecha de").
  protected readonly activeCampoFecha = computed<BackofficeCampoFecha>(() =>
    this.section() === 'programados'
      ? this.programadosCampoFecha()
      : this.isFechaRechazoSection()
        ? this.rechazoCampoFecha()
        : this.isFechaInstalacionSection()
          ? this.instaladosCampoFecha()
          : this.section() === 'plataforma'
            ? this.plataformaCampoFecha()
            : 'INGRESO'
  );
  protected readonly sortDirectionOptions = computed<Array<{ label: string; value: BackofficeSortDirection }>>(() =>
    this.activeSortField() === 'fechaIngresoEtapa'
    || this.activeSortField() === 'fechaRechazo'
    || this.activeSortField() === 'fechaInstalacion'
    || this.activeSortField() === 'fechaTipificacionInstalado'
    || this.activeSortField() === 'fechaProgramacion'
    || this.activeSortField() === 'fechaUltimaGestion'
    || this.activeSortField() === 'lastEntryAt'
    || this.activeSortField() === 'createdAt'
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
  // Agrupado categorico (Estado/Plan/Tipi/Asesor) activo: subcabeceras por valor sobre el orden
  // que fija el backend. Aplica a cualquier tab organizable (incluida Plataforma).
  protected readonly activeCategoricalGrouping = computed(() =>
    this.canOrganizeActiveSection()
    && this.activeGroupingMode() !== 'SIN_AGRUPAR'
  );
  protected readonly activeRowGroupMode = computed(() =>
    !this.isSearchMode()
    && (this.activeCategoricalGrouping() || this.plataformaDateSeparation())
      ? 'subheader'
      : undefined
  );
  protected readonly activeGroupRowsBy = computed(() => {
    if (this.isSearchMode()) {
      return undefined;
    }
    if (this.activeCategoricalGrouping()) {
      return 'organizationGroupKey';
    }
    if (this.plataformaDateSeparation()) {
      return 'fechaGroupSortKey';
    }
    return undefined;
  });
  protected readonly showOperationalDateColumn = computed(() =>
    this.isSearchMode() || this.section() !== 'plataforma'
  );
  protected readonly enableTableRowHover = computed(() => this.adminEquipoId() === null);
  protected readonly backofficeTableStyleClass = computed(() =>
    this.adminEquipoId() === null
      ? 'p-datatable-sm backoffice-table'
      : 'p-datatable-sm backoffice-table backoffice-table--admin'
  );
  // En Instalados el lead ya salio de VENTA: no hay "fecha de ingreso a la etapa", asi que se oculta.
  protected readonly showFechaIngresoColumn = computed(() => !this.isFechaInstalacionSection());
  protected readonly operationalDateColumnLabel = computed(() => {
    if (this.isSearchMode()) {
      return 'Fecha relevante';
    }
    if (this.section() === 'programados') {
      return 'Fecha programacion';
    }
    if (this.isFechaInstalacionSection()) {
      return 'Fecha instalacion';
    }
    if (this.isFechaRechazoSection()) {
      return 'Fecha rechazo';
    }
    return 'Fecha relevante';
  });
  // Campo de orden que representa la columna de fecha operativa de la tab (para las cabeceras).
  protected readonly operationalDateSortField = computed<BackofficeSortField>(() => {
    if (this.section() === 'programados') {
      return 'fechaProgramacion';
    }
    if (this.isFechaRechazoSection()) {
      return 'fechaRechazo';
    }
    return 'fechaInstalacion';
  });
  // La columna "Estado" ordena por el estado de seguimiento, salvo en Instalados (estado postventa).
  protected readonly estadoSortField = computed<BackofficeSortField>(() =>
    this.isFechaInstalacionSection() ? 'estadoClientePostventa' : 'estado'
  );
  // La columna "Ultima gestion" en Instalados es la fecha de tipificacion (instalado).
  protected readonly ultimaGestionSortField = computed<BackofficeSortField>(() =>
    this.isFechaInstalacionSection() ? 'fechaTipificacionInstalado' : 'fechaUltimaGestion'
  );
  protected readonly isOrganizationDefault = computed(() => {
    if (this.section() === 'programados') {
      return this.programadosSortField() === 'fechaProgramacion'
        && this.programadosSortDirection() === 'asc'
        && this.programadosCampoFecha() === 'PROGRAMACION'
        && this.programadosGroupBy() === 'SIN_AGRUPAR';
    }
    if (this.isFechaRechazoSection()) {
      return this.rechazoSortField() === 'fechaRechazo'
        && this.rechazoSortDirection() === 'desc'
        && this.rechazoCampoFecha() === 'RECHAZO'
        && this.rechazoGroupBy() === 'SIN_AGRUPAR';
    }
    if (this.isFechaInstalacionSection()) {
      return this.instaladosSortField() === 'fechaInstalacion'
        && this.instaladosSortDirection() === 'desc'
        && this.instaladosCampoFecha() === 'INSTALACION'
        && this.instaladosGroupBy() === 'SIN_AGRUPAR';
    }
    // Plataforma.
    return this.plataformaGroupingMode() === 'SIN_AGRUPAR'
      && this.plataformaSortField() === 'fechaIngresoEtapa'
      && this.plataformaSortDirection() === 'desc'
      && this.plataformaCampoFecha() === 'INGRESO';
  });
  protected readonly activeRows = computed(() => {
    // Busqueda global: la tabla muestra los resultados transversales, sin agrupacion ni separacion.
    if (this.isSearchMode()) {
      return this.searchRows();
    }
    if (this.plataformaDateSeparation()) {
      // PrimeNG pinta los separadores segun el orden visible. Ordenamos por bloque temporal para que
      // HOY y los meses recientes siempre queden arriba, aunque la pagina llegue mezclada por realtime.
      return this.sortedRowsForDateSeparation(this.plataformaRows().map((row) => this.withFechaGroup(row)));
    }
    if (this.section() === 'programados') {
      // Programados se ordena en servidor (fecha filtro + columna); no reordenamos en cliente.
      // Con agrupador categorico, marcamos la clave/etiqueta de grupo para las subcabeceras.
      const groupBy = this.programadosGroupBy();
      return groupBy === 'SIN_AGRUPAR'
        ? this.programadosRows()
        : this.programadosRows().map((row) => this.withOrganizationGroup(row, groupBy));
    }
    if (this.isFechaRechazoSection()) {
      // Subsanables/Rechazados: orden en servidor; subcabeceras solo si hay agrupador categorico.
      const rows = this.section() === 'subsanables' ? this.subsanablesRows() : this.rechazadosRows();
      const groupBy = this.rechazoGroupBy();
      return groupBy === 'SIN_AGRUPAR' ? rows : rows.map((row) => this.withOrganizationGroup(row, groupBy));
    }
    if (this.isFechaInstalacionSection()) {
      // Instalados: orden en servidor; subcabeceras solo si hay agrupador categorico.
      const groupBy = this.instaladosGroupBy();
      return groupBy === 'SIN_AGRUPAR'
        ? this.instaladosRows()
        : this.instaladosRows().map((row) => this.withOrganizationGroup(row, groupBy));
    }
    // Plataforma: orden en servidor. Default = separacion HOY/mes (arriba); con agrupador categorico,
    // subcabeceras por valor. Nunca reordenamos en cliente.
    const grouping = this.plataformaGroupingMode();
    return grouping === 'SIN_AGRUPAR'
      ? this.plataformaRows()
      : this.plataformaRows().map((row) => this.withOrganizationGroup(row, grouping));
  });
  protected readonly showSecSotColumn = computed(() =>
    this.activeRows().some((row) => row.requiereSecSotVenta === true || !!row.sec || !!row.sot)
  );
  protected readonly showElapsedDaysConnector = computed(() =>
    this.showFechaIngresoColumn() && this.showOperationalDateColumn()
  );
  protected readonly tableColumnCount = computed(() =>
    (this.showSecSotColumn() ? 11 : 10)
    + (this.showOperationalDateColumn() ? 1 : 0)
    + (this.showElapsedDaysConnector() ? 1 : 0)
    - (this.showFechaIngresoColumn() ? 0 : 1)
  );
  protected readonly activeTotal = computed(() => {
    if (this.isSearchMode()) {
      return this.searchTotal();
    }
    switch (this.section()) {
      case 'programados': return this.totalProgramados();
      case 'subsanables': return this.totalSubsanables();
      case 'rechazados': return this.totalRechazados();
      case 'instalados': return this.totalInstalados();
      case 'correccion-instalacion': return this.totalCorreccionInstalacion();
      default: return this.totalPlataforma();
    }
  });
  protected readonly activePage = computed(() => {
    if (this.isSearchMode()) {
      return this.searchPage();
    }
    switch (this.section()) {
      case 'programados': return this.pageProgramados();
      case 'subsanables': return this.pageSubsanables();
      case 'rechazados': return this.pageRechazados();
      case 'instalados': return this.pageInstalados();
      case 'correccion-instalacion': return this.pageCorreccionInstalacion();
      default: return this.pagePlataforma();
    }
  });

  // Estado del `app-period-selector` de la bandeja activa (una sola fila de controles, compartida).
  protected readonly activePeriodo = computed<MetricsPeriodo>(() => {
    switch (this.section()) {
      case 'programados': return this.programadosPeriodo();
      case 'subsanables': return this.subsanablesPeriodo();
      case 'rechazados': return this.rechazadosPeriodo();
      case 'instalados': return this.instaladosPeriodo();
      case 'correccion-instalacion': return 'dia';
      default: return this.plataformaPeriodo();
    }
  });
  protected readonly activeDia = computed<string | null>(() => {
    switch (this.section()) {
      case 'programados': return this.programadosDia();
      case 'subsanables': return this.subsanablesDia();
      case 'rechazados': return this.rechazadosDia();
      case 'instalados': return this.instaladosDia();
      case 'correccion-instalacion': return null;
      default: return this.plataformaDia();
    }
  });
  protected readonly activeHasta = computed<string | null>(() => {
    switch (this.section()) {
      case 'programados': return this.programadosHasta();
      case 'subsanables': return this.subsanablesHasta();
      case 'rechazados': return this.rechazadosHasta();
      case 'instalados': return this.instaladosHasta();
      case 'correccion-instalacion': return null;
      default: return this.plataformaHasta();
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

      // initialize()/reconcile() leen Y escriben signals (isReconciling, plataformaRows, ...). Si se
      // invocan dentro del tracking del effect, este pasa a depender de esas signals y su propia
      // escritura lo vuelve a disparar: bucle de change detection que Angular no estabiliza (NG0103)
      // y que satura la bandeja con refrescos. Es un caso que golpea sobre todo al ADMIN, cuyo estado
      // de asistencia nunca es 'ONLINE' (rol ALWAYS_OPERATIONAL), asi que la rama de reconcile siempre
      // se cumple. Con untracked el effect solo reacciona a los cambios de estado de asistencia.
      if (this.operationalGate.canActivateOperationalData() && !this.initialized && !this.initializeInFlight) {
        untracked(() => void this.initialize());
      } else if (this.operationalGate.canActivateOperationalData() && this.lastAttendanceStatus !== 'ONLINE') {
        untracked(() => void this.reconcile());
      }

      this.lastAttendanceStatus = status;
    });

    effect(() => {
      const canEdit = this.canMutateOperationalData();
      const requiresCustomerId = this.requiresCustomerId();
      const secSotEnabled = this.requiresSecSot() && canEdit && !requiresCustomerId;
      this.setControlEnabled(this.tipificacionForm.controls.sec, secSotEnabled);
      this.setControlEnabled(this.tipificacionForm.controls.sot, this.requiresSecSot() && canEdit);
      this.setControlEnabled(this.tipificacionForm.controls.customerId, requiresCustomerId && canEdit);
    });

    // Cambio de proveedor activo (selector del sidebar): las bandejas no se mezclan, así que al
    // cambiar limpiamos todo y recargamos con el nuevo proveedor (el header X-Proveedor-Id lo aplica
    // el interceptor). La primera ejecución solo registra el valor inicial.
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
      untracked(() => {
        this.plataformaRows.set([]);
        this.programadosRows.set([]);
        this.subsanablesRows.set([]);
        this.rechazadosRows.set([]);
        this.instaladosRows.set([]);
        this.correccionInstalacionRows.set([]);
        this.totalPlataforma.set(0);
        this.totalProgramados.set(0);
        this.totalSubsanables.set(0);
        this.totalRechazados.set(0);
        this.totalInstalados.set(0);
        this.totalCorreccionInstalacion.set(0);
        this.pagePlataforma.set(0);
        this.pageProgramados.set(0);
        this.pageSubsanables.set(0);
        this.pageRechazados.set(0);
        this.pageInstalados.set(0);
        this.pageCorreccionInstalacion.set(0);
        void this.refreshCurrent(false);
      });
    });
  }

  ngOnInit(): void {
    combineLatest([this.route.data, this.route.paramMap]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([data, params]) => {
      const nextSection = this.resolveSection(data['section']);
      const idEquipo = Number(params.get('idEquipo'));
      const nextAdminEquipoId = Number.isFinite(idEquipo) && idEquipo > 0 ? idEquipo : null;
      const sectionChanged = nextSection !== this.section();
      if (nextSection !== this.section() || nextAdminEquipoId !== this.adminEquipoId()) {
        this.searchInput.set('');
        this.searchTermActive.set('');
        this.searchLookup.set(null);
        this.isSearching.set(false);
        this.plataformaRows.set([]);
        this.programadosRows.set([]);
        this.subsanablesRows.set([]);
        this.rechazadosRows.set([]);
        this.instaladosRows.set([]);
        this.correccionInstalacionRows.set([]);
        this.totalPlataforma.set(0);
        this.totalProgramados.set(0);
        this.totalSubsanables.set(0);
        this.totalRechazados.set(0);
        this.totalInstalados.set(0);
        this.totalCorreccionInstalacion.set(0);
        this.pagePlataforma.set(0);
        this.pageProgramados.set(0);
        this.pageSubsanables.set(0);
        this.pageRechazados.set(0);
        this.pageInstalados.set(0);
        this.pageCorreccionInstalacion.set(0);
      }
      if (sectionChanged) {
        this.resetSectionPeriodToToday(nextSection);
      }
      this.adminEquipoId.set(nextAdminEquipoId);
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
    this.setBackofficeManagingPresence(false);
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
        this.refreshProgramados(false),
        this.refreshSubsanables(false),
        this.refreshRechazados(false),
        this.refreshInstalados(false),
        this.section() === 'correccion-instalacion' ? this.refreshCorreccionInstalacion(false) : Promise.resolve()
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
      await this.openDetail(row.id, row);
      void this.refreshActiveRowsAfterLeadAction();
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

  private async refreshActiveRowsAfterLeadAction(): Promise<void> {
    try {
      if (this.isSearchMode()) {
        await this.refreshSearch();
        return;
      }
      await this.refreshCurrent(true);
    } catch {
      // El drawer ya esta abierto; el siguiente refresco/realtime conciliara la bandeja.
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

  protected async openDetail(idLead: number, sourceRow?: LeadVentaResponse): Promise<void> {
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
    this.drawerMode.set('gestion');
    this.selectedLeadId.set(idLead);
    try {
      const resolvedSourceRow = this.resolvePrefillSourceRow(idLead, sourceRow);
      const detail = await firstValueFrom(this.leadService.obtenerDetalle(idLead));
      if (this.selectedLeadId() !== idLead) {
        return; // el usuario ya abrio/cerro otro lead mientras cargaba el detalle
      }
      this.detail.set(detail);
      this.detailHadOperationalAction = false;
      this.patchForms(detail, resolvedSourceRow);
      // Abrimos el drawer YA, con los datos iniciales del detalle. El catalogo de tipificaciones, los
      // catalogos de oferta y los eventos NO son parte de la primera vista y son varias llamadas
      // secuenciales al backend: en produccion (tras Cloudflare) sumaban ~1-2 s antes de abrir. Se
      // cargan en segundo plano, con el drawer ya visible, y cada seccion muestra su propio contenido
      // al llegar.
      this.detailDrawerOpen.set(true);
      this.setBackofficeManagingPresence(true);
      void this.loadGestionDetailInBackground(idLead, detail.idPlan ?? 0);
    } catch (error) {
      this.notify('error', this.getErrorMessage(error, 'No se pudo abrir el detalle.'));
    } finally {
      if (shouldTrackAction) {
        this.leadActionId.set(null);
      }
    }
  }

  // Cargas que no bloquean la apertura del drawer (ver openDetail). Cada refresh valida internamente
  // que el lead siga abierto antes de escribir su signal, para no pisar otro lead si el usuario cambia.
  private async loadGestionDetailInBackground(idLead: number, idPlan: number): Promise<void> {
    try {
      await this.refreshTipificationCatalog(idLead);
    } catch {
      if (this.selectedLeadId() === idLead) {
        this.notify('warn', 'Detalle abierto, pero no se pudo cargar el catalogo de tipificaciones de VENTA.');
      }
    }
    await Promise.all([
      this.refreshOfferCatalogs(idPlan).catch(() => undefined),
      this.refreshHistorialBackofficeVenta(idLead).catch(() => undefined)
    ]);
  }

  protected async openConsultation(idLead: number): Promise<void> {
    const shouldTrackAction = this.leadActionId() === null;
    if (shouldTrackAction) {
      this.leadActionId.set(idLead);
    }
    this.drawerMode.set('consulta');
    this.selectedLeadId.set(idLead);
    try {
      const sourceRow = this.findActiveVentaRow(idLead);
      const detail = await firstValueFrom(this.leadService.obtenerDetalleConsulta(idLead));
      this.detail.set(detail);
      this.detailHadOperationalAction = false;
      this.patchForms(detail, sourceRow);
      await this.refreshHistorialBackofficeVenta(idLead);
      this.detailDrawerOpen.set(true);
    } catch (error) {
      this.notify('error', this.getErrorMessage(error, 'No se pudo abrir la consulta.'));
    } finally {
      if (shouldTrackAction) {
        this.leadActionId.set(null);
      }
    }
  }

  protected async requestCloseDetail(): Promise<void> {
    if (this.hasUnsavedDataChanges()) {
      this.confirmationService.confirm({
        header: 'Cerrar gestion',
        message: 'Hay cambios sin tipificar. Si cierras ahora, esos cambios no se guardaran.',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Cerrar sin guardar',
        rejectLabel: 'Seguir editando',
        acceptButtonStyleClass: 'p-button-warning',
        rejectButtonStyleClass: 'p-button-text',
        accept: () => void this.closeDetailFromRequest()
      });
      this.detailDrawerOpen.set(true);
      return;
    }
    await this.closeDetailFromRequest();
  }

  private async closeDetailFromRequest(): Promise<void> {
    if (!this.detailReadOnly()) {
      await this.releaseCurrentLeadIfIdle();
    }
    this.closeDetail();
  }

  protected setTipificationFooterPinned(value: boolean): void {
    if (!value && this.tipificationOverlayOpen()) {
      return;
    }
    this.tipificationFooterPinned.set(value);
  }

  protected setTipificationOverlayOpen(value: boolean): void {
    if (value) {
      this.tipificationFooterPinned.set(true);
      this.tipificationOverlayOpen.set(true);
      return;
    }
    window.setTimeout(() => this.tipificationOverlayOpen.set(false), 120);
  }

  @HostListener('document:pointermove', ['$event'])
  protected releaseTipificationFooterWhenPointerLeaves(event: PointerEvent): void {
    if (!this.tipificationFooterPinned() || this.tipificationOverlayOpen()) {
      return;
    }
    const footer = this.tipificationFooter?.nativeElement;
    if (!footer) {
      this.tipificationFooterPinned.set(false);
      return;
    }
    const rect = footer.getBoundingClientRect();
    const insideFooter =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!insideFooter) {
      this.tipificationFooterPinned.set(false);
    }
  }

  protected async registrarContacto(): Promise<void> {
    const detail = this.detail();
    if (!detail) {
      return;
    }
    await this.saveAction(() => this.leadService.registrarContacto(detail.id), 'Contacto registrado.', () => this.reconcile(detail.id));
  }

  protected async registrarLlamadaOperativa(): Promise<void> {
    const detail = this.detail();
    if (!detail) {
      return;
    }
    await this.saveAction(() => this.leadService.registrarContacto(detail.id), 'Llamada registrada.', () => this.reconcile(detail.id));
  }

  protected showCallError(message: string): void {
    this.notify('error', message);
  }

  protected async registrarChat(): Promise<void> {
    const detail = this.detail();
    if (!detail) {
      return;
    }

    const url = buildWhatsAppUrl(detail.prefijo, detail.lead, detail.usermeta);
    if (!url) {
      this.notify('warn', 'El lead no tiene telefono ni usermeta para abrir WhatsApp.');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    const idLead = detail.id;
    await this.saveAction(() => this.leadService.registrarContacto(idLead), 'Chat registrado.', () => this.reconcile(idLead));
  }

  protected hasLeadChat(row: Pick<LeadDetalleResponse, 'prefijo' | 'lead' | 'usermeta'>): boolean {
    return !!buildWhatsAppUrl(row.prefijo, row.lead, row.usermeta);
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

  private async performSave(
    detail: LeadDetalleResponse,
    options: { notifyEmpty?: boolean; notifySuccess?: boolean } = {}
  ): Promise<boolean> {
    const notifyEmpty = options.notifyEmpty ?? true;
    const notifySuccess = options.notifySuccess ?? true;
    const tasks: { label: string; action: () => Promise<void>; markPristine: () => void }[] = [];
    if (this.datosForm.dirty) {
      if (this.datosForm.invalid) {
        this.notify('warn', 'Datos Preventa incompleto: tipo y documento son obligatorios.');
        return false;
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
        return false;
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
        return false;
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
      if (notifyEmpty) {
        this.notify('info', 'No hay cambios pendientes por guardar.');
      }
      return true;
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
        await this.reconcile(detail.id);
        return false;
      } else {
        if (notifySuccess) {
          this.notify('success', `Guardado: ${saved.join(', ')}.`);
        }
        this.detailHadOperationalAction = true;
        await this.reconcile(detail.id);
        return true;
      }
    } catch (error) {
      this.notify('error', this.getErrorMessage(error, 'No se pudieron guardar los cambios.'));
      return false;
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async tipificar(): Promise<void> {
    if (!this.ensureCanMutate()) {
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
    if (this.hasUnsavedDataChanges()) {
      const saved = await this.performSave(detail, { notifyEmpty: false, notifySuccess: false });
      if (!saved) {
        this.notify('warn', 'Corrige los datos pendientes para poder tipificar.');
        return;
      }
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
    if (this.requiresRejectionDate() && !this.tipificacionForm.controls.fechaRechazo.value) {
      this.notify('warn', 'Ingresa la fecha de rechazo.');
      return;
    }
    const raw = this.tipificacionForm.getRawValue();
    const requiresSecSot = this.requiresSecSot();
    const requiresCustomerId = this.requiresCustomerId();
    if (requiresSecSot) {
      const sec = this.resolveSecForTipification(raw.sec, detail.sec);
      const sot = this.resolveSotForTipification(raw.sot, detail.sot);
      if ((requiresCustomerId ? !sot : (!sec || !sot))) {
        this.notify('warn', requiresCustomerId ? 'Ingresa SOT de 8 digitos.' : 'Ingresa SEC de 9 digitos y SOT de 8 digitos.');
        return;
      }
    }
    if (requiresCustomerId && !/^\d{8}$/.test(raw.customerId ?? '')) {
      this.notify('warn', 'Ingresa Customer ID de 8 digitos.');
      return;
    }
    await this.saveAction(
      () =>
        this.leadService.tipificarLead(detail.id, {
          codigoTipificacion: raw.codigoTipificacion,
          codigoSubtipificacion: raw.codigoSubtipificacion,
          comentario: raw.comentario || null,
          fechaInstalacion: this.requiresInstallDate() ? raw.fechaInstalacion || null : null,
          fechaProgramacion: this.requiresProgramming() ? raw.fechaProgramacion || null : null,
          fechaRechazo: this.requiresRejectionDate() ? raw.fechaRechazo || null : null,
          horaProgramada: this.requiresProgramming() ? raw.horaProgramada || null : null,
          sec: requiresSecSot && !requiresCustomerId ? this.resolveSecForTipification(raw.sec, detail.sec) : null,
          sot: requiresSecSot ? this.resolveSotForTipification(raw.sot, detail.sot) : null,
          customerId: requiresCustomerId ? raw.customerId || null : null
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
    // El p-paginator reemite onPageChange durante el change detection cuando cambian sus inputs
    // ([first]/[totalRecords], p.ej. al llegar el total tras un refresh). Si eso vuelve a llamar
    // refreshX, se re-setea el total y el paginador vuelve a emitir: bucle sincrono que Angular no
    // logra estabilizar (NG0103) y que satura red e hilo principal. Ignoramos la reemision cuando la
    // pagina no cambia realmente: solo reaccionamos a un cambio de pagina del usuario.
    if (pageNumber === this.activePage()) {
      return;
    }
    if (this.isSearchMode()) {
      this.searchPage.set(pageNumber);
      await this.refreshSearch();
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
    if (this.section() === 'subsanables') {
      this.pageSubsanables.set(pageNumber);
      await this.refreshSubsanables(false);
      return;
    }
    if (this.section() === 'rechazados') {
      this.pageRechazados.set(pageNumber);
      await this.refreshRechazados(false);
      return;
    }
    if (this.section() === 'instalados') {
      this.pageInstalados.set(pageNumber);
      await this.refreshInstalados(false);
      return;
    }
    if (this.section() === 'correccion-instalacion') {
      this.pageCorreccionInstalacion.set(pageNumber);
      await this.refreshCorreccionInstalacion(false);
      return;
    }
    this.pagePlataforma.set(pageNumber);
    await this.refreshPlataforma(false);
  }

  protected setSearchInput(value: string): void {
    this.searchInput.set(this.normalizeSearchInput(value));
  }

  protected async buscarLead(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const term = this.normalizeSearchTerm(this.searchInput());
    if (this.section() === 'correccion-instalacion') {
      this.searchInput.set(term);
      this.searchLookup.set(null);
      this.searchTermActive.set(term);
      this.pageCorreccionInstalacion.set(0);
      this.isSearching.set(true);
      try {
        await this.refreshCorreccionInstalacion(false);
      } catch (error) {
        this.notify('error', this.getErrorMessage(error, 'No se pudo buscar el dato ingresado.'));
      } finally {
        this.isSearching.set(false);
      }
      return;
    }
    if (!term) {
      this.notify('warn', 'Escribe el lead, documento o @usermeta que quieres buscar.');
      return;
    }

    this.searchInput.set(term);
    this.searchLookup.set(null);
    this.searchTermActive.set(term);
    this.searchPage.set(0);
    this.isSearching.set(true);
    try {
      await this.refreshSearch();
      if (!this.searchRows().length) {
        const lookup = await firstValueFrom(this.leadService.buscarContextoLead(term));
        if (this.searchTermActive() !== term) {
          return;
        }
        const consultationDetail = lookup.idLead ? await this.safeGetSearchConsultationDetail(lookup.idLead) : null;
        const latestEvent = lookup.idLead ? await this.safeGetLatestSearchConsultationEvent(lookup.idLead) : null;
        const consultationRow = this.buildSearchConsultationRow(lookup, term, consultationDetail, latestEvent);
        if (consultationRow) {
          this.searchRows.set([consultationRow]);
          this.searchTotal.set(1);
          this.searchLookup.set(this.withConsultationLookupMessage(lookup));
        } else {
          this.searchLookup.set(lookup.mensajeUsuario ? lookup : null);
        }
      }
    } catch (error) {
      this.notify('error', this.getErrorMessage(error, 'No se pudo buscar el dato ingresado.'));
    } finally {
      this.isSearching.set(false);
    }
  }

  protected async limpiarBusqueda(): Promise<void> {
    this.searchInput.set('');
    this.searchTermActive.set('');
    this.searchLookup.set(null);
    this.searchRows.set([]);
    this.searchTotal.set(0);
    this.searchPage.set(0);
    await this.refreshCurrent(false);
  }

  private async safeGetSearchConsultationDetail(idLead: number): Promise<LeadDetalleResponse | null> {
    try {
      return await firstValueFrom(this.leadService.obtenerDetalleConsulta(idLead));
    } catch {
      return null;
    }
  }

  private async safeGetLatestSearchConsultationEvent(idLead: number): Promise<EventoResponse | null> {
    try {
      const page = await firstValueFrom(this.leadService.listarHistorialBackofficeVenta(idLead, {
        pageNumber: 0,
        pageSize: 1,
        sortBy: 'createdAt',
        direction: 'desc'
      }));
      return page.content[0] ?? null;
    } catch {
      return null;
    }
  }

  private buildSearchConsultationRow(
    lookup: LeadContextoLookupResponse,
    term: string,
    detail: LeadDetalleResponse | null,
    latestEvent: EventoResponse | null
  ): VisualLeadVenta | null {
    if (!lookup.existe || !lookup.idLead || this.normalizedCode(lookup.etapaActual) === 'VENTA') {
      return null;
    }
    const provider = detail?.nombreProveedorPlan
      ?? detail?.nombreProveedorCampana
      ?? detail?.nombreProveedorEquipo
      ?? detail?.nombreCampana
      ?? null;
    return {
      id: detail?.id ?? lookup.idLead,
      prefijo: detail?.prefijo ?? lookup.prefijo ?? '',
      lead: detail?.lead ?? lookup.lead ?? term,
      usermeta: detail?.usermeta ?? null,
      etapa: detail?.etapa ?? lookup.etapaActual ?? null,
      estadoSeguimiento: detail?.estadoSeguimiento ?? lookup.estadoActual ?? null,
      idAsesorAsignado: detail?.idAsesorAsignado ?? null,
      nombreAsesorAsignado: detail?.nombreAsesorAsignado ?? lookup.nombreAsesorAsignado ?? null,
      tipoDocumento: detail?.tipoDocumento ?? null,
      numeroDocumentoTitularServicio: detail?.numeroDocumentoTitularServicio ?? detail?.numeroDocumento ?? null,
      base: detail?.base ?? null,
      idTipificacion: null,
      codigoTipificacion: latestEvent?.tipificacion ?? null,
      idSubtipificacion: null,
      codigoSubtipificacion: latestEvent?.subtipificacion ?? null,
      nombrePlanSnapshot: detail?.nombrePlan ?? null,
      nombreProveedorSnapshot: provider,
      precioPlanSnapshot: detail?.precioPlan ?? null,
      nombrePromocionInternaSnapshot: detail?.nombrePromocionInterna ?? null,
      precioAdicionalesSnapshot: detail?.precioAdicionales ?? null,
      precioFinal: detail?.precioFinal ?? null,
      diaCorteFacturacion: detail?.diaCorteFacturacion ?? null,
      mesesPermanenciaSnapshot: detail?.mesesPermanenciaSnapshot ?? null,
      createdAt: null,
      lastEntryAt: detail?.lastEntryAt ?? null,
      fechaIngresoEtapa: null,
      updatedAt: null,
      totalAsignaciones: detail?.totalAsignaciones ?? null,
      fechaProgramacion: detail?.fechaProgramacion ?? latestEvent?.fechaProgramacion ?? null,
      horaProgramada: detail?.horaProgramada ?? latestEvent?.horaProgramada ?? null,
      fechaRechazo: latestEvent?.fechaRechazo ?? null,
      sec: detail?.sec ?? null,
      sot: detail?.sot ?? null,
      customerId: detail?.customerId ?? null,
      requiereSecSotVenta: detail?.requiereSecSotVenta ?? null,
      nombreAsesorMeritoPreventa: detail?.nombreAsesorMeritoPreventa ?? null,
      nombreAsesorUltimaGestion: latestEvent?.nombreActor ?? detail?.nombreAsesorAsignado ?? lookup.nombreAsesorAsignado ?? null,
      fechaUltimaGestion: latestEvent?.createdAt ?? null,
      ultimoComentarioTipificacion: latestEvent?.comentario ?? null,
      searchConsultationOnly: true
    };
  }

  private withConsultationLookupMessage(lookup: LeadContextoLookupResponse): LeadContextoLookupResponse {
    const etapa = this.displayLookupStage(lookup.etapaActual);
    return {
      ...lookup,
      mensajeUsuario: `Este lead está en ${etapa}. Puedes revisarlo en modo consulta.`
    };
  }

  protected openCorrection(row: CorreccionInstalacionRow): void {
    this.correctionTarget.set(row);
    this.correctionForm.reset({
      sec: row.sec ?? '',
      sot: row.sot ?? '',
      fechaInstalacion: row.fechaInstalacion ?? ''
    });
    this.correctionForm.markAsPristine();
    this.correctionDrawerOpen.set(true);
  }

  protected closeCorrection(): void {
    this.correctionDrawerOpen.set(false);
    this.correctionTarget.set(null);
    this.correctionForm.reset({ sec: '', sot: '', fechaInstalacion: '' });
  }

  protected onCorrectionSecInput(value: string): void {
    this.setNumericDigits(this.correctionForm.controls.sec, value, 9);
  }

  protected onCorrectionSotInput(value: string): void {
    this.setNumericDigits(this.correctionForm.controls.sot, value, 8);
  }

  protected async saveCorrection(): Promise<void> {
    const target = this.correctionTarget();
    if (!target || this.isSaving()) {
      return;
    }
    if (!this.ensureCanMutate()) {
      return;
    }
    if (this.correctionForm.invalid) {
      this.correctionForm.markAllAsTouched();
      this.notify('warn', this.firstCorrectionFormError());
      return;
    }

    const raw = this.correctionForm.getRawValue();
    this.isSaving.set(true);
    this.leadActionId.set(target.idLead);
    try {
      await firstValueFrom(this.leadService.corregirInstalacion(target.idLead, {
        sec: raw.sec,
        sot: raw.sot,
        fechaInstalacion: raw.fechaInstalacion
      }));
      this.notify('success', 'Datos de instalación corregidos.');
      this.closeCorrection();
      await this.refreshCorreccionInstalacion(false);
      await this.refreshInstalados(false);
    } catch (error) {
      this.notify('error', this.getErrorMessage(error, 'No se pudo corregir la instalación.'));
    } finally {
      this.isSaving.set(false);
      this.leadActionId.set(null);
    }
  }

  protected correctionFieldInvalid(field: 'sec' | 'sot' | 'fechaInstalacion'): boolean {
    const control = this.correctionForm.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  private firstCorrectionFormError(): string {
    const controls = this.correctionForm.controls;
    if (controls.sec.invalid) {
      return 'El SEC debe tener 9 dígitos.';
    }
    if (controls.sot.invalid) {
      return 'El SOT debe tener 8 dígitos.';
    }
    return 'La fecha de instalación es obligatoria.';
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

  /**
   * Centra la flecha del popover ORGANIZAR bajo el boton. PrimeNG la ancla al borde izquierdo del
   * target menos `2 * border-radius`, con lo que sale del control; aqui se reubica al centro del boton
   * (mismo fix que el calendario del boton HOY). Se usa geometria de layout (`offsetLeft`, ajena al
   * `transform: scale` de la animacion de entrada) para el contenedor; el boton no se anima.
   */
  protected recenterOrganizeArrow(popover: Popover): void {
    cancelAnimationFrame(this.organizeArrowRaf);
    this.organizeArrowRaf = requestAnimationFrame(() => {
      const overlay = popover as unknown as { container?: HTMLElement | null; target?: HTMLElement | null };
      const container = overlay.container;
      const target = overlay.target;
      if (!container || !target) {
        return;
      }
      const boton = target.getBoundingClientRect();
      const centroBotonDoc = boton.left + window.scrollX + boton.width / 2;
      const left = centroBotonDoc - this.leftEnDocumento(container);
      container.style.setProperty('--p-popover-arrow-offset', '0px');
      container.style.setProperty('--p-popover-arrow-left', `${left}px`);
    });
  }

  /** Posicion X del borde del elemento en coordenadas de documento, sumando `offsetLeft` (sin transform). */
  private leftEnDocumento(el: HTMLElement): number {
    let x = 0;
    let node: HTMLElement | null = el;
    while (node) {
      x += node.offsetLeft;
      node = node.offsetParent as HTMLElement | null;
    }
    return x;
  }

  // Resetea la pagina y recarga la bandeja rechazo/subsanable activa tras un cambio de organizacion.
  private async applyRechazoOrganizeChange(): Promise<void> {
    if (this.section() === 'subsanables') {
      this.pageSubsanables.set(0);
      await this.refreshSubsanables(false);
    } else {
      this.pageRechazados.set(0);
      await this.refreshRechazados(false);
    }
  }

  private async applyInstaladosOrganizeChange(): Promise<void> {
    this.pageInstalados.set(0);
    await this.refreshInstalados(false);
  }

  protected async setActiveGroupingMode(mode: BackofficeGroupMode | null | undefined): Promise<void> {
    if (!mode) {
      return;
    }
    if (this.section() === 'programados') {
      if (mode === this.programadosGroupBy()) {
        return;
      }
      this.programadosGroupBy.set(mode);
      this.pageProgramados.set(0);
      await this.refreshProgramados(false);
      return;
    }
    if (this.isFechaRechazoSection()) {
      if (mode === this.rechazoGroupBy()) {
        return;
      }
      this.rechazoGroupBy.set(mode);
      await this.applyRechazoOrganizeChange();
      return;
    }
    if (this.isFechaInstalacionSection()) {
      if (mode === this.instaladosGroupBy()) {
        return;
      }
      this.instaladosGroupBy.set(mode);
      await this.applyInstaladosOrganizeChange();
      return;
    }
    if (this.section() === 'plataforma') {
      this.plataformaGroupingMode.set(mode);
      this.pagePlataforma.set(0);
      await this.refreshCurrent(false);
    }
  }

  protected async setActiveSortField(field: BackofficeSortField | null | undefined): Promise<void> {
    if (!field) {
      return;
    }
    if (this.section() === 'programados') {
      this.programadosSortField.set(field);
      this.programadosSortDirection.set(this.defaultSortDirection(field));
      this.pageProgramados.set(0);
      await this.refreshProgramados(false);
      return;
    }
    if (this.isFechaRechazoSection()) {
      this.rechazoSortField.set(field);
      this.rechazoSortDirection.set(this.defaultSortDirection(field));
      await this.applyRechazoOrganizeChange();
      return;
    }
    if (this.isFechaInstalacionSection()) {
      this.instaladosSortField.set(field);
      this.instaladosSortDirection.set(this.defaultSortDirection(field));
      await this.applyInstaladosOrganizeChange();
      return;
    }
    this.plataformaSortField.set(field);
    this.plataformaSortDirection.set(this.defaultSortDirection(field));
    this.pagePlataforma.set(0);
    await this.refreshPlataforma(false);
  }

  protected async setActiveSortDirection(direction: BackofficeSortDirection | null | undefined): Promise<void> {
    if (!direction) {
      return;
    }
    if (this.section() === 'programados') {
      this.programadosSortDirection.set(direction);
      this.pageProgramados.set(0);
      await this.refreshProgramados(false);
      return;
    }
    if (this.isFechaRechazoSection()) {
      this.rechazoSortDirection.set(direction);
      await this.applyRechazoOrganizeChange();
      return;
    }
    if (this.isFechaInstalacionSection()) {
      this.instaladosSortDirection.set(direction);
      await this.applyInstaladosOrganizeChange();
      return;
    }
    this.plataformaSortDirection.set(direction);
    this.pagePlataforma.set(0);
    await this.refreshPlataforma(false);
  }

  /** Cambia el campo de fecha contra el que la bandeja filtra el periodo ("Usar fecha de"). */
  protected async setActiveCampoFecha(campo: BackofficeCampoFecha | null | undefined): Promise<void> {
    if (!campo) {
      return;
    }
    if (this.section() === 'programados') {
      if (campo === this.programadosCampoFecha()) {
        return;
      }
      this.programadosCampoFecha.set(campo);
      this.pageProgramados.set(0);
      await this.refreshProgramados(false);
      return;
    }
    if (this.isFechaRechazoSection()) {
      if (campo === this.rechazoCampoFecha()) {
        return;
      }
      this.rechazoCampoFecha.set(campo);
      await this.applyRechazoOrganizeChange();
      return;
    }
    if (this.isFechaInstalacionSection()) {
      if (campo === this.instaladosCampoFecha()) {
        return;
      }
      this.instaladosCampoFecha.set(campo);
      await this.applyInstaladosOrganizeChange();
      return;
    }
    if (this.section() === 'plataforma') {
      if (campo === this.plataformaCampoFecha()) {
        return;
      }
      this.plataformaCampoFecha.set(campo);
      this.pagePlataforma.set(0);
      await this.refreshPlataforma(false);
    }
  }

  protected async clearOrganization(): Promise<void> {
    if (this.section() === 'programados') {
      this.programadosSortField.set('fechaProgramacion');
      this.programadosSortDirection.set('asc');
      this.programadosCampoFecha.set('PROGRAMACION');
      this.programadosGroupBy.set('SIN_AGRUPAR');
      this.pageProgramados.set(0);
      await this.refreshProgramados(false);
      return;
    }
    if (this.isFechaRechazoSection()) {
      this.rechazoSortField.set('fechaRechazo');
      this.rechazoSortDirection.set('desc');
      this.rechazoCampoFecha.set('RECHAZO');
      this.rechazoGroupBy.set('SIN_AGRUPAR');
      await this.applyRechazoOrganizeChange();
      return;
    }
    if (this.isFechaInstalacionSection()) {
      this.instaladosSortField.set('fechaInstalacion');
      this.instaladosSortDirection.set('desc');
      this.instaladosCampoFecha.set('INSTALACION');
      this.instaladosGroupBy.set('SIN_AGRUPAR');
      await this.applyInstaladosOrganizeChange();
      return;
    }
    this.plataformaGroupingMode.set('SIN_AGRUPAR');
    this.plataformaSortField.set('fechaIngresoEtapa');
    this.plataformaSortDirection.set('desc');
    this.plataformaCampoFecha.set('INGRESO');
    this.pagePlataforma.set(0);
    await this.refreshPlataforma(false);
  }

  // --- Ordenamiento por cabecera (patron GTR: desc -> asc -> quitar) ---

  /** Direccion por defecto de un campo: fechas descendente (recientes primero); texto/estado ascendente. */
  private defaultSortDirection(field: BackofficeSortField): BackofficeSortDirection {
    const dateFields: BackofficeSortField[] = [
      'fechaIngresoEtapa', 'fechaProgramacion', 'fechaUltimaGestion',
      'fechaRechazo', 'fechaInstalacion', 'fechaTipificacionInstalado', 'lastEntryAt', 'createdAt'
    ];
    return dateFields.includes(field) ? 'desc' : 'asc';
  }

  /** Campos con cabecera ordenable en la seccion activa. */
  protected columnSortable(field: BackofficeSortField): boolean {
    if (this.section() === 'programados') {
      return field === 'fechaIngresoEtapa'
        || field === 'fechaProgramacion'
        || field === 'fechaUltimaGestion'
        || field === 'estado';
    }
    if (this.isFechaRechazoSection()) {
      return field === 'fechaIngresoEtapa'
        || field === 'fechaRechazo'
        || field === 'fechaUltimaGestion'
        || field === 'estado'
        || field === 'tipificacion';
    }
    if (this.isFechaInstalacionSection()) {
      // Fecha ingreso no aplica (el lead ya salio de VENTA); tipificacion es uniforme (INSTALADO).
      return field === 'fechaInstalacion'
        || field === 'fechaTipificacionInstalado'
        || field === 'estadoClientePostventa';
    }
    if (this.section() === 'plataforma') {
      return field === 'fechaIngresoEtapa'
        || field === 'fechaUltimaGestion'
        || field === 'estado'
        || field === 'tipificacion';
    }
    return false;
  }

  protected columnSortActive(field: BackofficeSortField): boolean {
    return this.columnSortable(field) && this.activeSortField() === field;
  }

  protected columnSortIcon(field: BackofficeSortField): string {
    if (!this.columnSortActive(field)) {
      return 'pi pi-sort-alt';
    }
    return this.activeSortDirection() === 'asc' ? 'pi pi-sort-amount-up-alt' : 'pi pi-sort-amount-down';
  }

  protected columnSortLabel(field: BackofficeSortField, label: string): string {
    if (!this.columnSortActive(field)) {
      return `Ordenar por ${label}`;
    }
    return this.activeSortDirection() === this.defaultSortDirection(field)
      ? `Orden activo por ${label}. Presiona para invertir.`
      : `Orden activo por ${label}. Presiona para volver al orden inicial.`;
  }

  /** Ciclo de 3 estados sobre una columna: default(desc/asc del campo) -> inverso -> quitar. */
  protected async changeColumnSort(field: BackofficeSortField): Promise<void> {
    if (!this.columnSortable(field) || !this.canDisplayOperationalData()) {
      return;
    }
    const defaultDirection = this.defaultSortDirection(field);
    if (this.activeSortField() !== field) {
      await this.applyColumnSort(field, defaultDirection);
    } else if (this.activeSortDirection() === defaultDirection) {
      await this.applyColumnSort(field, defaultDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Tercer clic: quitar el orden de la columna y volver al default de la bandeja.
      await this.clearOrganization();
    }
  }

  private async applyColumnSort(field: BackofficeSortField, direction: BackofficeSortDirection): Promise<void> {
    if (this.section() === 'programados') {
      this.programadosSortField.set(field);
      this.programadosSortDirection.set(direction);
      this.pageProgramados.set(0);
      await this.refreshProgramados(false);
      return;
    }
    if (this.isFechaRechazoSection()) {
      this.rechazoSortField.set(field);
      this.rechazoSortDirection.set(direction);
      await this.applyRechazoOrganizeChange();
      return;
    }
    if (this.isFechaInstalacionSection()) {
      this.instaladosSortField.set(field);
      this.instaladosSortDirection.set(direction);
      await this.applyInstaladosOrganizeChange();
      return;
    }
    if (this.section() === 'plataforma') {
      this.plataformaSortField.set(field);
      this.plataformaSortDirection.set(direction);
      this.pagePlataforma.set(0);
      await this.refreshPlataforma(false);
    }
  }

  private resetSectionPeriodToToday(section: BackofficeSection): void {
    switch (section) {
      case 'programados':
        this.programadosPeriodo.set('dia');
        this.programadosDia.set(this.todayDate);
        this.programadosHasta.set(this.todayDate);
        break;
      case 'subsanables':
        this.subsanablesPeriodo.set('dia');
        this.subsanablesDia.set(this.todayDate);
        this.subsanablesHasta.set(this.todayDate);
        break;
      case 'rechazados':
        this.rechazadosPeriodo.set('dia');
        this.rechazadosDia.set(this.todayDate);
        this.rechazadosHasta.set(this.todayDate);
        break;
      case 'instalados':
        this.instaladosPeriodo.set('dia');
        this.instaladosDia.set(this.todayDate);
        this.instaladosHasta.set(this.todayDate);
        break;
      case 'correccion-instalacion':
        break;
      default:
        this.plataformaPeriodo.set('dia');
        this.plataformaDia.set(this.todayDate);
        this.plataformaHasta.set(this.todayDate);
        break;
    }
  }

  /** Cambio de segmento (Hoy/Semanal/Mensual) del selector de periodo de la bandeja activa. */
  protected async onPeriodoChange(periodo: MetricsPeriodo | null | undefined): Promise<void> {
    if (!periodo || !this.canDisplayOperationalData()) {
      return;
    }
    if (this.activePeriodo() === periodo) {
      return;
    }
    switch (this.section()) {
      case 'programados':
        this.programadosPeriodo.set(periodo);
        if (periodo === 'dia') {
          this.programadosDia.set(this.todayDate);
          this.programadosHasta.set(this.todayDate);
        } else {
          this.programadosDia.set(null);
          this.programadosHasta.set(null);
        }
        this.pageProgramados.set(0);
        break;
      case 'subsanables':
        this.subsanablesPeriodo.set(periodo);
        if (periodo === 'dia') {
          this.subsanablesDia.set(this.todayDate);
          this.subsanablesHasta.set(this.todayDate);
        } else {
          this.subsanablesDia.set(null);
          this.subsanablesHasta.set(null);
        }
        this.pageSubsanables.set(0);
        break;
      case 'rechazados':
        this.rechazadosPeriodo.set(periodo);
        if (periodo === 'dia') {
          this.rechazadosDia.set(this.todayDate);
          this.rechazadosHasta.set(this.todayDate);
        } else {
          this.rechazadosDia.set(null);
          this.rechazadosHasta.set(null);
        }
        this.pageRechazados.set(0);
        break;
      case 'instalados':
        this.instaladosPeriodo.set(periodo);
        if (periodo === 'dia') {
          this.instaladosDia.set(this.todayDate);
          this.instaladosHasta.set(this.todayDate);
        } else {
          this.instaladosDia.set(null);
          this.instaladosHasta.set(null);
        }
        this.pageInstalados.set(0);
        break;
      default:
        this.plataformaPeriodo.set(periodo);
        if (periodo === 'dia') {
          this.plataformaDia.set(this.todayDate);
          this.plataformaHasta.set(this.todayDate);
        } else {
          this.plataformaDia.set(null);
          this.plataformaHasta.set(null);
        }
        this.pagePlataforma.set(0);
        break;
    }
    await this.refreshCurrent(false);
  }

  /** Rango elegido en el calendario del selector. Un dia suelto llega como `desde === hasta`. */
  protected async onRangoChange(rango: MetricsRango): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    switch (this.section()) {
      case 'programados':
        this.programadosPeriodo.set('dia');
        this.programadosDia.set(rango.desde);
        this.programadosHasta.set(rango.hasta);
        this.pageProgramados.set(0);
        break;
      case 'subsanables':
        this.subsanablesPeriodo.set('dia');
        this.subsanablesDia.set(rango.desde);
        this.subsanablesHasta.set(rango.hasta);
        this.pageSubsanables.set(0);
        break;
      case 'rechazados':
        this.rechazadosPeriodo.set('dia');
        this.rechazadosDia.set(rango.desde);
        this.rechazadosHasta.set(rango.hasta);
        this.pageRechazados.set(0);
        break;
      case 'instalados':
        this.instaladosPeriodo.set('dia');
        this.instaladosDia.set(rango.desde);
        this.instaladosHasta.set(rango.hasta);
        this.pageInstalados.set(0);
        break;
      default:
        this.plataformaPeriodo.set('dia');
        this.plataformaDia.set(rango.desde);
        this.plataformaHasta.set(rango.hasta);
        this.pagePlataforma.set(0);
        break;
    }
    await this.refreshCurrent(false);
  }

  protected display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  }

  private displayLookupStage(value: string | null | undefined): string {
    const stage = this.normalizedCode(value);
    if (stage === 'PREVENTA') return 'Preventa';
    if (stage === 'POSTVENTA') return 'Postventa';
    if (stage === 'COBRANZA') return 'Cobranza';
    return this.display(value);
  }

  protected displayDateOnly(value?: string | null): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
    if (!match) {
      return '-';
    }
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  private toCalendarDay(value?: string | null): number | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
    if (!match) {
      return null;
    }
    return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  // Hora en formato 12h con AM/PM (coherente con las otras columnas de hora, que usan `hh:mm a`).
  protected displayTimeOnly(value?: string | null): string {
    const match = /^(\d{2}):(\d{2})/.exec(value ?? '');
    if (!match) {
      return '';
    }
    const hour24 = Number(match[1]);
    const suffix = hour24 < 12 ? 'AM' : 'PM';
    const hour12 = hour24 % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${match[2]} ${suffix}`;
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

  protected setDateControl(controlName: 'fechaInstalacion' | 'fechaProgramacion' | 'fechaRechazo', value: Date | string | null): void {
    const control = this.tipificacionForm.controls[controlName];
    control.setValue(this.toBackendDate(value));
    control.markAsTouched();
    control.markAsDirty();
  }

  protected setFixedDigits(controlName: 'sec' | 'sot' | 'customerId', value: string, maxLength: number): void {
    const normalized = value.replace(/\D/g, '').slice(0, maxLength);
    const control = this.tipificacionForm.controls[controlName];
    if (control.value !== normalized) {
      control.setValue(normalized);
      control.markAsDirty();
    }
  }

  protected leadUsermeta(row: Pick<LeadVentaResponse, 'usermeta'> | Pick<LeadDetalleResponse, 'usermeta'>): string {
    const usermeta = (row.usermeta ?? '').trim().replace(/^@+/, '');
    return usermeta ? `@${usermeta}` : '';
  }

  protected assignedShortName(value?: string | null): string {
    const words = (value ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (!words.length) {
      return '-';
    }
    return words
      .map((word) => word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 3).toUpperCase())
      .join('~');
  }

  protected personShortName(value?: string | null): string {
    const words = (value ?? '').trim().split(/\s+/).filter(Boolean);
    return words.length ? words.slice(0, 2).join(' ') : '-';
  }

  protected meritNameParts(value?: string | null): string[] {
    return (value ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
  }

  protected operationalDateKind(row: VisualLeadVenta): 'programacion' | 'rechazo' | 'instalacion' | null {
    const tipificacion = this.normalizedCode(row.codigoTipificacion);
    if (row.fechaInstalacion || tipificacion === 'INSTALADO') {
      return 'instalacion';
    }
    if (row.fechaRechazo || tipificacion === 'SUBSANABLE' || tipificacion === 'NO_RECUPERABLE') {
      return 'rechazo';
    }
    if (row.fechaProgramacion || tipificacion === 'PROGRAMADO') {
      return 'programacion';
    }
    return null;
  }

  protected operationalDateLabel(row: VisualLeadVenta): string {
    switch (this.operationalDateKind(row)) {
      case 'programacion':
        return 'Programacion';
      case 'rechazo':
        return 'Rechazo';
      case 'instalacion':
        return 'Instalacion';
      default:
        return '';
    }
  }

  protected operationalDateValue(row: VisualLeadVenta): string | null | undefined {
    switch (this.operationalDateKind(row)) {
      case 'programacion':
        return row.fechaProgramacion;
      case 'rechazo':
        return row.fechaRechazo;
      case 'instalacion':
        return row.fechaInstalacion;
      default:
        return null;
    }
  }

  protected operationalTimeValue(row: VisualLeadVenta): string | null | undefined {
    return this.operationalDateKind(row) === 'programacion' ? row.horaProgramada : null;
  }

  protected elapsedDaysBetweenDates(row: VisualLeadVenta): number | null {
    const ingreso = this.toCalendarDay(row.fechaIngresoEtapa);
    const operativo = this.toCalendarDay(this.operationalDateValue(row));
    if (ingreso === null || operativo === null || operativo < ingreso) {
      return null;
    }
    const dayMs = 24 * 60 * 60 * 1000;
    return Math.round((operativo - ingreso) / dayMs);
  }

  protected elapsedDaysText(row: VisualLeadVenta): string {
    const days = this.elapsedDaysBetweenDates(row);
    return days === 1 ? 'dia' : 'dias';
  }

  protected elapsedDaysTooltip(row: VisualLeadVenta): string {
    const days = this.elapsedDaysBetweenDates(row);
    if (days === null) {
      return 'No hay fechas suficientes para calcular los dias';
    }
    return days === 1
      ? 'Paso 1 dia entre ambas fechas'
      : `Pasaron ${days} dias entre ambas fechas`;
  }

  protected lastTipificationComment(row: LeadVentaResponse): string {
    return (row.ultimoComentarioTipificacion ?? '').trim();
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

  private normalizedCode(value: string | null | undefined): string {
    return String(value ?? '').trim().toUpperCase();
  }

  protected estadoSeverity(estado: string | null | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (estado === 'GESTIONADO') return 'success';
    if (estado === 'EN_GESTION') return 'warn';
    if (estado === 'AGENDADO') return 'info';
    if (estado === 'NUEVO') return 'secondary';
    return 'info';
  }

  protected postventaStatusSeverity(estado: string | null | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const normalized = this.normalizedCode(estado);
    if (normalized === 'ACTIVO') return 'success';
    if (normalized === 'SUSPENDIDO') return 'warn';
    if (normalized === 'BAJA') return 'danger';
    return 'secondary';
  }

  protected onTipificacionSelected(codigo: string | null): void {
    this.selectedTipificacionCode.set(codigo ?? '');
    this.selectedSubtipificacionCode.set('');
    const rechazo = this.isRejectionTipification(codigo);
    const fechaRechazoActual = this.tipificacionForm.controls.fechaRechazo.value;
    const fechaRechazoDetalle = this.detail()?.fechaRechazo ?? '';
    // Los campos de fecha/hora dependen del comportamiento de la SUBTIPI: al cambiar de tipi se limpian y
    // se pre-cargan al elegir la subtipi (ver onSubtipificacionSelected).
    this.tipificacionForm.patchValue(
      {
        codigoSubtipificacion: '',
        fechaInstalacion: '',
        fechaProgramacion: '',
        fechaRechazo: rechazo ? fechaRechazoActual || fechaRechazoDetalle : fechaRechazoDetalle,
        horaProgramada: ''
      },
      { emitEvent: false }
    );
  }

  private isRejectionTipification(codigo: string | null | undefined): boolean {
    return TIPIFICACIONES_RECHAZO_VENTA.has(String(codigo ?? '').trim().toUpperCase());
  }

  protected onSubtipificacionSelected(codigo: string | null): void {
    this.selectedSubtipificacionCode.set(codigo ?? '');
    const detail = this.detail();
    const prog = this.requiresProgramming();
    const rechazo = this.requiresRejectionDate();
    this.tipificacionForm.patchValue(
      {
        fechaInstalacion: '',
        fechaProgramacion: prog
          ? this.tipificacionForm.controls.fechaProgramacion.value || detail?.fechaProgramacion || ''
          : '',
        fechaRechazo: rechazo || detail?.fechaRechazo
          ? this.tipificacionForm.controls.fechaRechazo.value || detail?.fechaRechazo || ''
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
    this.ubigeoDomicilioError.set(null);
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
    this.ubigeoDomicilioError.set(null);
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
    return value === 'programados'
      || value === 'subsanables'
      || value === 'rechazados'
      || value === 'instalados'
      || value === 'correccion-instalacion'
      ? value
      : 'plataforma';
  }

  private toBackendDate(value: Date | string | null): string {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const month = `${value.getMonth() + 1}`.padStart(2, '0');
      const day = `${value.getDate()}`.padStart(2, '0');
      return `${value.getFullYear()}-${month}-${day}`;
    }

    return typeof value === 'string' ? value : '';
  }

  private startRealtime(): void {
    // El topic de etapa VENTA emite por cada evento de TODOS los equipos (firehose). Sin coalescing,
    // cada evento dispara una reconciliacion y la tabla se repinta sin parar: en hover parpadea, el
    // selector de fecha pierde clics y Gestionar no llega a abrir el drawer. Es especialmente severo en
    // la vista ADMIN, donde cada bandeja trae el equipo completo. Agrupamos la rafaga con debounceTime:
    // una tanda de eventos = una sola reconciliacion.
    const streams = [this.realtimeService.watchTopic('/topic/leads/etapa/VENTA')];
    const empleadoId = this.sessionService.getSession()?.empleadoId;
    if (empleadoId) {
      streams.push(this.realtimeService.watchTopic(`/topic/leads/asesor/${empleadoId}`));
    }

    this.realtimeSubscription.add(
      merge(...streams)
        .pipe(
          filter((event) => this.isRelevantRealtime(event.tipo)),
          map((event) => event.idLead),
          debounceTime(REALTIME_RECONCILE_DEBOUNCE_MS)
        )
        .subscribe({
          next: (idLead) => void this.reconcile(idLead),
          error: () =>
            this.notify(
              'warn',
              'Se perdio conexion con el sistema. Si estamos en una actualizacion, recarga la pagina en unos segundos.'
            )
        })
    );
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
      // Solo la bandeja visible. Repintar las 5 en cada evento saturaba el hilo principal (en ADMIN
      // cada bandeja trae el equipo completo). Las demas se recargan al cambiar de tab (refreshCurrent
      // corre en el cambio de ruta), asi que no quedan stale para el usuario.
      await (this.isSearchMode() ? this.refreshSearch() : this.refreshCurrent(true));
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
    if (this.section() === 'subsanables') {
      await this.refreshSubsanables(silent);
      return;
    }
    if (this.section() === 'rechazados') {
      await this.refreshRechazados(silent);
      return;
    }
    if (this.section() === 'instalados') {
      await this.refreshInstalados(silent);
      return;
    }
    if (this.section() === 'correccion-instalacion') {
      await this.refreshCorreccionInstalacion(silent);
      return;
    }
    await this.refreshPlataforma(silent);
  }

  private async refreshPlataforma(silent: boolean): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const requestSeq = ++this.plataformaRequestSeq;
    const requestKey = this.plataformaRequestKey();
    const previous = this.plataformaRows();
    const query = this.currentQuery(this.pagePlataforma(), 'plataforma');
    const adminEquipoId = this.adminEquipoId();
    // La busqueda es un modo global aparte (ver refreshSearch); la bandeja Plataforma no filtra por termino.
    const page = await firstValueFrom(
      this.leadService.listarPlataforma(
        query,
        undefined,
        adminEquipoId,
        this.plataformaRange(),
        this.plataformaCampoFecha(),
        this.groupByParam(this.plataformaGroupingMode())
      )
    );
    if (requestSeq !== this.plataformaRequestSeq || requestKey !== this.plataformaRequestKey()) {
      return;
    }
    this.totalPlataforma.set(page.totalElements);
    this.plataformaRows.set(this.mergeVisualRows(previous, page.content, this.shouldAnimatePlataformaRefresh(silent, previous)));
  }

  private async refreshProgramados(silent: boolean): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const requestSeq = ++this.programadosRequestSeq;
    const requestKey = this.programadosRequestKey();
    const previous = this.programadosRows();
    const query = this.currentQuery(this.pageProgramados(), 'programados');
    const adminEquipoId = this.adminEquipoId();
    const page = await firstValueFrom(
      this.leadService.listarProgramados(
        query, adminEquipoId, this.programadosRange(), this.programadosCampoFecha(), this.groupByParam(this.programadosGroupBy())
      )
    );
    if (requestSeq !== this.programadosRequestSeq || requestKey !== this.programadosRequestKey()) {
      return;
    }
    this.totalProgramados.set(page.totalElements);
    this.programadosRows.set(
      this.mergeVisualRows(
        previous,
        page.content,
        this.shouldAnimateProgramadosRefresh(silent, previous)
      )
    );
  }

  private async refreshSubsanables(silent: boolean): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const requestSeq = ++this.subsanablesRequestSeq;
    const requestKey = this.subsanablesRequestKey();
    const previous = this.subsanablesRows();
    const query = this.currentQuery(this.pageSubsanables(), 'subsanables');
    const filters = this.subsanablesFilters();
    const adminEquipoId = this.adminEquipoId();
    const page = await firstValueFrom(
      this.leadService.listarSubsanables(query, filters, adminEquipoId, this.rechazoCampoFecha(), this.groupByParam(this.rechazoGroupBy()))
    );
    if (requestSeq !== this.subsanablesRequestSeq || requestKey !== this.subsanablesRequestKey()) {
      return;
    }
    this.totalSubsanables.set(page.totalElements);
    this.subsanablesRows.set(
      this.mergeVisualRows(previous, page.content, this.shouldAnimateSubsanablesRefresh(silent, previous))
    );
  }

  private async refreshRechazados(silent: boolean): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const requestSeq = ++this.rechazadosRequestSeq;
    const requestKey = this.rechazadosRequestKey();
    const previous = this.rechazadosRows();
    const query = this.currentQuery(this.pageRechazados(), 'rechazados');
    const filters = this.rechazadosFilters();
    const adminEquipoId = this.adminEquipoId();
    const page = await firstValueFrom(
      this.leadService.listarRechazados(query, filters, adminEquipoId, this.rechazoCampoFecha(), this.groupByParam(this.rechazoGroupBy()))
    );
    if (requestSeq !== this.rechazadosRequestSeq || requestKey !== this.rechazadosRequestKey()) {
      return;
    }
    this.totalRechazados.set(page.totalElements);
    this.rechazadosRows.set(
      this.mergeVisualRows(previous, page.content, this.shouldAnimateRechazadosRefresh(silent, previous))
    );
  }

  private async refreshInstalados(silent: boolean): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const requestSeq = ++this.instaladosRequestSeq;
    const requestKey = this.instaladosRequestKey();
    const previous = this.instaladosRows();
    const query = this.currentQuery(this.pageInstalados(), 'instalados');
    const filters = this.instaladosFilters();
    const adminEquipoId = this.adminEquipoId();
    const page = await firstValueFrom(
      this.leadService.listarInstalados(query, filters, adminEquipoId, this.instaladosCampoFecha(), this.groupByParam(this.instaladosGroupBy()))
    );
    if (requestSeq !== this.instaladosRequestSeq || requestKey !== this.instaladosRequestKey()) {
      return;
    }
    this.totalInstalados.set(page.totalElements);
    this.instaladosRows.set(
      this.mergeVisualRows(
        previous,
        page.content.map((row) => this.toInstaladoVisualRow(row)),
        this.shouldAnimateInstaladosRefresh(silent, previous)
      )
    );
  }

  private async refreshCorreccionInstalacion(silent: boolean): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const requestSeq = ++this.correccionInstalacionRequestSeq;
    const requestKey = this.correccionInstalacionRequestKey();
    const previous = this.correccionInstalacionRows();
    const query = this.currentQuery(this.pageCorreccionInstalacion(), 'correccion-instalacion');
    const page = await firstValueFrom(
      this.leadService.listarCorreccionesInstalacion(query, this.searchTermActive() || null, this.adminEquipoId())
    );
    if (requestSeq !== this.correccionInstalacionRequestSeq || requestKey !== this.correccionInstalacionRequestKey()) {
      return;
    }
    const previousById = new Map(previous.map((row) => [row.idLead, row]));
    const rows = page.content.map((row) => ({ ...row, isNew: silent && !previousById.has(row.idLead) }));
    this.totalCorreccionInstalacion.set(page.totalElements);
    this.correccionInstalacionRows.set(rows);
  }

  /**
   * Busqueda GLOBAL de VENTA (transversal a las 3 tabs). Usa `/venta?lead=`, que ahora encuentra el
   * lead en cualquier estado; los resultados se muestran en la tabla unificada (ver activeRows).
   */
  private async refreshSearch(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const requestSeq = ++this.searchRequestSeq;
    const term = this.searchTermActive();
    if (!term) {
      this.searchRows.set([]);
      this.searchTotal.set(0);
      return;
    }
    const query = this.currentQuery(this.searchPage(), 'plataforma');
    const page = await firstValueFrom(
      this.leadService.listarPlataforma(query, term, this.adminEquipoId())
    );
    if (requestSeq !== this.searchRequestSeq || this.searchTermActive() !== term) {
      return;
    }
    this.searchTotal.set(page.totalElements);
    this.searchRows.set(page.content);
  }

  private async refreshOpenDetail(idLead: number): Promise<void> {
    try {
      const detail = await firstValueFrom(
        this.detailReadOnly()
          ? this.leadService.obtenerDetalleConsulta(idLead)
          : this.leadService.obtenerDetalle(idLead)
      );
      this.detail.set(detail);
      if (!this.hasUnsavedDataChanges()) {
        this.patchForms(detail, this.resolvePrefillSourceRow(idLead));
      }
      await this.refreshHistorialBackofficeVenta(idLead);
    } catch {
      this.closeDetail();
    }
  }

  private async refreshEventos(idLead: number): Promise<void> {
    const page = await firstValueFrom(
      this.leadService.listarEventos(idLead, {
        pageNumber: 0,
        pageSize: 100,
        sortBy: 'createdAt',
        direction: 'desc'
      })
    );
    if (this.selectedLeadId() !== idLead) {
      return; // llegada tardia de otro lead ya cerrado/cambiado
    }
    this.eventos.set(page.content.filter((evento) => this.normalizedCode(evento.etapa) === 'VENTA'));
  }

  private async refreshHistorialBackofficeVenta(idLead: number): Promise<void> {
    const page = await firstValueFrom(
      this.leadService.listarHistorialBackofficeVenta(idLead, {
        pageNumber: 0,
        pageSize: 100,
        sortBy: 'createdAt',
        direction: 'desc'
      })
    );
    if (this.selectedLeadId() !== idLead) {
      return;
    }
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
    const catalogo = await firstValueFrom(this.leadService.getCatalogoTipificaciones(idLead));
    if (this.selectedLeadId() !== idLead) {
      return; // llegada tardia de otro lead ya cerrado/cambiado
    }
    this.catalogo.set(catalogo);
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
    if (this.selectedLeadId() !== idLead) {
      return; // llegada tardia de otro lead ya cerrado/cambiado
    }
    this.ofertaPlanes.set(ofertaPlanes);
    const plan = ofertaPlanes.find((item) => item.id === idPlan);
    const idProveedor = plan?.idProveedor ?? null;
    this.selectedOfertaProviderId.set(idProveedor);
    this.ofertaForm.controls.idProveedor.setValue(idProveedor ?? 0);
    const [promociones, adicionales] = await Promise.all([
      firstValueFrom(this.leadService.listarPromociones(idPlan ? { idPlan } : {})),
      idProveedor ? firstValueFrom(this.leadService.listarAdicionales(idProveedor)) : Promise.resolve([])
    ]);
    if (this.selectedLeadId() !== idLead) {
      return; // llegada tardia de otro lead ya cerrado/cambiado
    }
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
    const requestSeq = ++this.domicilioResolveSeq;
    this.ubigeoDomicilioError.set(null);
    if (!ubigeoDomicilio) {
      this.ubigeoDomicilioLoading.set(false);
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

    const codigo = ubigeoDomicilio.replace(/\D/g, '');
    if (codigo.length !== 6) {
      this.provinciasDomicilio.set([]);
      this.distritosDomicilio.set([]);
      this.ubigeoDomicilioLoading.set(false);
      this.ubigeoDomicilioError.set('No pudimos reconocer la ubicación guardada.');
      return;
    }

    this.ubigeoDomicilioLoading.set(true);
    try {
      const departamentos = this.departamentos().length
        ? this.departamentos()
        : await firstValueFrom(this.leadService.listarDepartamentos());
      if (requestSeq !== this.domicilioResolveSeq) {
        return;
      }
      if (!this.departamentos().length) {
        this.departamentos.set(departamentos);
      }

      const departamento = departamentos.find((item) => item.codigo === codigo.slice(0, 2));
      if (!departamento) {
        this.ubigeoDomicilioError.set('No encontramos el departamento guardado.');
        return;
      }

      const provincias = await this.getProvinciasDomicilio(departamento.id);
      if (requestSeq !== this.domicilioResolveSeq) {
        return;
      }
      const provincia = provincias.find((item) => item.codigo === codigo.slice(0, 4));
      if (!provincia) {
        this.provinciasDomicilio.set(provincias);
        this.distritosDomicilio.set([]);
        this.ubigeoDomicilioError.set('No encontramos la provincia guardada.');
        return;
      }

      const distritos = await this.getDistritosDomicilio(provincia.id);
      if (requestSeq !== this.domicilioResolveSeq) {
        return;
      }
      const distrito = distritos.find((item) => item.codigo === codigo);
      if (!distrito) {
        this.provinciasDomicilio.set(provincias);
        this.distritosDomicilio.set(distritos);
        this.ubigeoDomicilioError.set('No encontramos el distrito guardado.');
        return;
      }

      this.provinciasDomicilio.set(provincias);
      this.distritosDomicilio.set(distritos);
      this.direccionForm.patchValue({
        idDepartamentoDomicilio: departamento.id,
        idProvinciaDomicilio: provincia.id,
        idDistritoDomicilio: distrito.id,
        ubigeoDomicilio: codigo
      });
      this.direccionForm.markAsPristine();
    } catch (error) {
      this.provinciasDomicilio.set([]);
      this.distritosDomicilio.set([]);
      this.ubigeoDomicilioError.set(this.getErrorMessage(error, 'No pudimos cargar la ubicación guardada.'));
    } finally {
      if (requestSeq === this.domicilioResolveSeq) {
        this.ubigeoDomicilioLoading.set(false);
      }
    }
  }

  private async loadProvinciasDomicilio(idDepartamento: number): Promise<void> {
    this.ubigeoDomicilioLoading.set(true);
    try {
      this.ubigeoDomicilioError.set(null);
      this.provinciasDomicilio.set(await this.getProvinciasDomicilio(idDepartamento));
    } catch (error) {
      const message = this.getErrorMessage(error, 'No se pudieron cargar las provincias.');
      this.ubigeoDomicilioError.set(message);
      this.notify('warn', message);
    } finally {
      this.ubigeoDomicilioLoading.set(false);
    }
  }

  private async loadDistritosDomicilio(idProvincia: number): Promise<void> {
    this.ubigeoDomicilioLoading.set(true);
    try {
      this.ubigeoDomicilioError.set(null);
      this.distritosDomicilio.set(await this.getDistritosDomicilio(idProvincia));
    } catch (error) {
      const message = this.getErrorMessage(error, 'No se pudieron cargar los distritos.');
      this.ubigeoDomicilioError.set(message);
      this.notify('warn', message);
    } finally {
      this.ubigeoDomicilioLoading.set(false);
    }
  }

  private async getProvinciasDomicilio(idDepartamento: number): Promise<UbigeoItem[]> {
    const cached = this.provinciasCache.get(idDepartamento);
    if (cached) {
      return cached;
    }
    const provincias = await firstValueFrom(this.leadService.listarProvincias(idDepartamento));
    this.provinciasCache.set(idDepartamento, provincias);
    return provincias;
  }

  private async getDistritosDomicilio(idProvincia: number): Promise<UbigeoItem[]> {
    const cached = this.distritosCache.get(idProvincia);
    if (cached) {
      return cached;
    }
    const distritos = await firstValueFrom(this.leadService.listarDistritos(idProvincia));
    this.distritosCache.set(idProvincia, distritos);
    return distritos;
  }

  private currentQuery(pageNumber: number, section = this.section()): PageQuery {
    return {
      pageNumber,
      pageSize: this.pageSize,
      sortBy: section === 'plataforma'
        ? this.plataformaSortField()
        : section === 'programados'
          ? this.programadosSortField()
          : section === 'correccion-instalacion'
            ? 'fechaTipificacionInstalado'
            : this.isFechaRechazoSection(section)
              ? this.rechazoSortField()
              : this.isFechaInstalacionSection(section)
                ? this.instaladosSortField()
                : 'lastEntryAt',
      direction: section === 'plataforma'
        ? this.plataformaSortDirection()
        : section === 'programados'
          ? this.programadosSortDirection()
          : this.isFechaRechazoSection(section)
            ? this.rechazoSortDirection()
            : this.isFechaInstalacionSection(section)
              ? this.instaladosSortDirection()
              : 'desc'
    };
  }

  protected isFechaRechazoSection(section = this.section()): boolean {
    return section === 'subsanables' || section === 'rechazados';
  }

  protected isFechaInstalacionSection(section = this.section()): boolean {
    return section === 'instalados';
  }

  private plataformaRequestKey(): string {
    return JSON.stringify({
      section: this.section(),
      equipo: this.adminEquipoId(),
      page: this.pagePlataforma(),
      query: this.currentQuery(this.pagePlataforma(), 'plataforma'),
      campoFecha: this.plataformaCampoFecha(),
      groupBy: this.plataformaGroupingMode(),
      range: this.plataformaRange()
    });
  }

  private programadosRequestKey(): string {
    return JSON.stringify({
      section: this.section(),
      equipo: this.adminEquipoId(),
      page: this.pageProgramados(),
      query: this.currentQuery(this.pageProgramados(), 'programados'),
      range: this.programadosRange(),
      campoFecha: this.programadosCampoFecha(),
      groupBy: this.programadosGroupBy()
    });
  }

  // Mapea el modo de agrupado de la UI al parametro TipoGrupoVenta del backend (null = sin agrupar).
  private groupByParam(mode: BackofficeGroupMode): string | null {
    switch (mode) {
      case 'ESTADO': return 'ESTADO';
      case 'PLAN': return 'PLAN';
      case 'TIPIFICACION': return 'TIPIFICACION';
      case 'ASESOR': return 'ULTIMO_GESTOR';
      default: return null;
    }
  }

  private subsanablesRequestKey(): string {
    return JSON.stringify({
      section: this.section(),
      equipo: this.adminEquipoId(),
      page: this.pageSubsanables(),
      query: this.currentQuery(this.pageSubsanables(), 'subsanables'),
      filters: this.subsanablesFilters(),
      campoFecha: this.rechazoCampoFecha(),
      groupBy: this.rechazoGroupBy()
    });
  }

  private rechazadosRequestKey(): string {
    return JSON.stringify({
      section: this.section(),
      equipo: this.adminEquipoId(),
      page: this.pageRechazados(),
      query: this.currentQuery(this.pageRechazados(), 'rechazados'),
      filters: this.rechazadosFilters(),
      campoFecha: this.rechazoCampoFecha(),
      groupBy: this.rechazoGroupBy()
    });
  }

  private instaladosRequestKey(): string {
    return JSON.stringify({
      section: this.section(),
      equipo: this.adminEquipoId(),
      page: this.pageInstalados(),
      query: this.currentQuery(this.pageInstalados(), 'instalados'),
      filters: this.instaladosFilters(),
      campoFecha: this.instaladosCampoFecha(),
      groupBy: this.instaladosGroupBy()
    });
  }

  private correccionInstalacionRequestKey(): string {
    return JSON.stringify({
      section: this.section(),
      equipo: this.adminEquipoId(),
      buscar: this.searchTermActive(),
      page: this.pageCorreccionInstalacion(),
      query: this.currentQuery(this.pageCorreccionInstalacion(), 'correccion-instalacion')
    });
  }

  private plataformaRange(): LeadRechazadosFilters {
    const range = resolveMetricsRange(this.plataformaPeriodo(), this.plataformaDia(), this.plataformaHasta());
    return { fechaDesde: range.desde ?? null, fechaHasta: range.hasta ?? null };
  }

  private programadosRange(): LeadRechazadosFilters {
    const range = resolveMetricsRange(this.programadosPeriodo(), this.programadosDia(), this.programadosHasta());
    return { fechaDesde: range.desde ?? null, fechaHasta: range.hasta ?? null };
  }

  private subsanablesFilters(): LeadRechazadosFilters {
    const range = resolveMetricsRange(this.subsanablesPeriodo(), this.subsanablesDia(), this.subsanablesHasta());
    return { fechaDesde: range.desde ?? null, fechaHasta: range.hasta ?? null };
  }

  private rechazadosFilters(): LeadRechazadosFilters {
    const range = resolveMetricsRange(this.rechazadosPeriodo(), this.rechazadosDia(), this.rechazadosHasta());
    return { fechaDesde: range.desde ?? null, fechaHasta: range.hasta ?? null };
  }

  private instaladosFilters(): LeadRechazadosFilters {
    const range = resolveMetricsRange(this.instaladosPeriodo(), this.instaladosDia(), this.instaladosHasta());
    return { fechaDesde: range.desde ?? null, fechaHasta: range.hasta ?? null };
  }

  private shouldAnimatePlataformaRefresh(silent: boolean, previous: VisualLeadVenta[]): boolean {
    return silent && this.section() === 'plataforma' && this.pagePlataforma() === 0 && previous.length > 0;
  }

  private shouldAnimateProgramadosRefresh(silent: boolean, previous: VisualLeadVenta[]): boolean {
    return silent && this.section() === 'programados' && this.pageProgramados() === 0 && previous.length > 0;
  }

  private shouldAnimateSubsanablesRefresh(silent: boolean, previous: VisualLeadVenta[]): boolean {
    return silent && this.section() === 'subsanables' && this.pageSubsanables() === 0 && previous.length > 0;
  }

  private shouldAnimateRechazadosRefresh(silent: boolean, previous: VisualLeadVenta[]): boolean {
    return silent && this.section() === 'rechazados' && this.pageRechazados() === 0 && previous.length > 0;
  }

  private shouldAnimateInstaladosRefresh(silent: boolean, previous: VisualLeadVenta[]): boolean {
    return silent && this.section() === 'instalados' && this.pageInstalados() === 0 && previous.length > 0;
  }

  private toInstaladoVisualRow(row: LeadInstaladoBackofficeResponse): VisualLeadVenta {
    return {
      id: row.idLead,
      prefijo: row.prefijo ?? '',
      lead: row.lead ?? '',
      usermeta: row.usermeta ?? null,
      etapa: row.etapaActual ?? null,
      etapaActual: row.etapaActual ?? null,
      estadoSeguimiento: row.estadoClientePostventa ?? null,
      tipoDocumento: row.tipoDocumento ?? null,
      numeroDocumentoTitularServicio: row.numeroDocumento ?? null,
      nombreProveedorSnapshot: row.proveedor ?? null,
      nombrePlanSnapshot: row.plan ?? null,
      codigoTipificacion: 'INSTALADO',
      fechaInstalacion: row.fechaInstalacion ?? null,
      fechaTipificacionInstalado: row.fechaTipificacionInstalado ?? null,
      idAsesorInstalador: row.idAsesorInstalador ?? null,
      nombreAsesorInstalador: row.nombreAsesorInstalador ?? null,
      estadoClientePostventa: row.estadoClientePostventa ?? null,
      lastEntryAt: row.fechaTipificacionInstalado ?? null,
      createdAt: row.fechaTipificacionInstalado ?? null,
      fechaUltimaGestion: row.fechaTipificacionInstalado ?? null,
      nombreAsesorMeritoPreventa: row.nombreAsesorMeritoPreventa ?? null,
      nombreAsesorUltimaGestion: row.nombreAsesorInstalador ?? null
    };
  }

  private patchForms(detail: LeadDetalleResponse, sourceRow?: VisualLeadVenta): void {
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
    const codigoTipificacion = sourceRow?.codigoTipificacion ?? '';
    const codigoSubtipificacion = sourceRow?.codigoSubtipificacion ?? '';
    const comentarioPrevio = (sourceRow?.ultimoComentarioTipificacion ?? '').trim();
    this.tipificacionCommentPlaceholder.set(comentarioPrevio || 'Agrega una nota si ayuda a la siguiente gestion');
    this.selectedTipificacionCode.set(codigoTipificacion);
    this.selectedSubtipificacionCode.set(codigoSubtipificacion);
    this.tipificacionForm.reset({
      codigoTipificacion,
      codigoSubtipificacion,
      comentario: '',
      fechaInstalacion: sourceRow?.fechaInstalacion ?? '',
      fechaProgramacion: detail.fechaProgramacion ?? sourceRow?.fechaProgramacion ?? '',
      fechaRechazo: detail.fechaRechazo ?? sourceRow?.fechaRechazo ?? '',
      horaProgramada: detail.horaProgramada ?? sourceRow?.horaProgramada ?? '',
      sec: detail.sec ?? '',
      sot: detail.sot ?? '',
      customerId: detail.customerId ?? sourceRow?.customerId ?? ''
    }, { emitEvent: false });
    this.activeDataTab.set('datos');
    this.markFormsPristine();
    void this.resolveDomicilioSelection(detail.ubigeoDomicilio ?? null);
  }

  private mergeVisualRows(previous: VisualLeadVenta[], incoming: LeadVentaResponse[], animateNew: boolean): VisualLeadVenta[] {
    const previousById = new Map(previous.map((row) => [row.id, row]));
    const newIds = animateNew ? incoming.filter((row) => !previousById.has(row.id)).map((row) => row.id) : [];
    const animatedIds = newIds.length <= 3 ? new Set(newIds) : new Set<number>();
    const rows = incoming.map((row) => ({ ...row, isNew: animatedIds.has(row.id) }));
    this.scheduleNewRowReset([...animatedIds]);
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
      organizationGroupKey: this.organizationFilterValue(mode, group.key),
      organizationGroupLabel: group.label
    };
  }

  private organizationFilterValue(mode: BackofficeGroupMode, key: string): string {
    return `${mode}:${key}`;
  }

  private resolveOrganizationGroup(row: LeadVentaResponse, mode: BackofficeGroupMode): { hint: string; key: string; label: string } {
    switch (mode) {
      case 'ESTADO':
        return this.groupValue('Estado', row.estadoSeguimiento, 'Sin estado');
      case 'ASESOR':
        // "Asesor" = ultimo gestor (mismo criterio que la columna y que el groupBy del backend).
        return this.groupValue('Asesor', row.nombreAsesorUltimaGestion ?? row.nombreAsesorAsignado, 'Sin gestor');
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

  protected fechaIngresoEtapaValue(row: LeadVentaResponse): string | null | undefined {
    return row.fechaIngresoEtapa;
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

  private scheduleNewRowReset(ids: number[]): void {
    for (const id of ids) {
      const existingTimer = this.newRowTimers.get(id);
        if (existingTimer) window.clearTimeout(existingTimer);
        const timerId = window.setTimeout(() => {
          this.plataformaRows.update((rows) => rows.map((row) => (row.id === id ? { ...row, isNew: false } : row)));
          this.programadosRows.update((rows) => rows.map((row) => (row.id === id ? { ...row, isNew: false } : row)));
          this.subsanablesRows.update((rows) => rows.map((row) => (row.id === id ? { ...row, isNew: false } : row)));
          this.rechazadosRows.update((rows) => rows.map((row) => (row.id === id ? { ...row, isNew: false } : row)));
          this.instaladosRows.update((rows) => rows.map((row) => (row.id === id ? { ...row, isNew: false } : row)));
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
    this.setBackofficeManagingPresence(false);
    this.detailDrawerOpen.set(false);
    this.detail.set(null);
    this.eventos.set([]);
    this.selectedLeadId.set(null);
    this.selectedTipificacionCode.set('');
    this.selectedSubtipificacionCode.set('');
    this.tipificacionCommentPlaceholder.set('Agrega una nota si ayuda a la siguiente gestion');
    this.selectedOfertaProviderId.set(null);
    this.ofertaPlanes.set([]);
    this.adicionalesSeleccionados.set([]);
    this.adicionalesDirty.set(false);
    this.detailHadOperationalAction = false;
    this.drawerMode.set('gestion');
    this.provinciasDomicilio.set([]);
    this.distritosDomicilio.set([]);
    this.ubigeoDomicilioLoading.set(false);
    this.ubigeoDomicilioError.set(null);
  }

  private setBackofficeManagingPresence(active: boolean): void {
    if (!this.isBackofficePresenceRole() || this.drawerMode() !== 'gestion') {
      return;
    }
    void this.presenceService.actualizarDisponibilidad(active ? 'GESTIONANDO' : 'DISPONIBLE').catch(() => undefined);
  }

  private isBackofficePresenceRole(): boolean {
    const role = this.sessionService.getPrimaryRole();
    return role === 'ASESOR_BACKOFFICE' || role === 'SUPERVISOR_BACKOFFICE';
  }

  private findActiveVentaRow(idLead: number): VisualLeadVenta | undefined {
    return this.activeRows().find((row) => row.id === idLead)
      ?? this.plataformaRows().find((row) => row.id === idLead)
      ?? this.programadosRows().find((row) => row.id === idLead)
      ?? this.subsanablesRows().find((row) => row.id === idLead)
      ?? this.rechazadosRows().find((row) => row.id === idLead)
      ?? this.instaladosRows().find((row) => row.id === idLead);
  }

  private resolvePrefillSourceRow(idLead: number, fallback?: LeadVentaResponse): VisualLeadVenta | LeadVentaResponse | undefined {
    const current = this.findActiveVentaRow(idLead);
    if (this.hasTipificationPrefillData(current) || !fallback) {
      return current ?? fallback;
    }
    return this.hasTipificationPrefillData(fallback) ? fallback : current ?? fallback;
  }

  private hasTipificationPrefillData(row?: VisualLeadVenta | LeadVentaResponse): boolean {
    const fechaInstalacion = row && 'fechaInstalacion' in row ? row.fechaInstalacion : null;
    return Boolean(
      row?.codigoTipificacion
      || row?.codigoSubtipificacion
      || row?.fechaProgramacion
      || row?.horaProgramada
      || row?.fechaRechazo
      || fechaInstalacion
      || row?.ultimoComentarioTipificacion
    );
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

  private normalizeLeadOrDocumentSearch(value?: string | null): string {
    return (value ?? '').replace(/\D/g, '');
  }

  private normalizeSearchTerm(value?: string | null): string {
    const raw = (value ?? '').trim();
    if (!raw) {
      return '';
    }
    if (raw.startsWith('@')) {
      const usermeta = raw.replace(/\s+/g, '').replace(/^@+/, '');
      return usermeta ? `@${usermeta}` : '';
    }
    return this.normalizeLeadOrDocumentSearch(raw);
  }

  private normalizeSearchInput(value?: string | null): string {
    const raw = (value ?? '').trim();
    if (!raw) {
      return '';
    }
    if (raw.startsWith('@')) {
      const usermeta = raw.replace(/\s+/g, '').replace(/^@+/, '');
      return usermeta ? `@${usermeta}` : '@';
    }
    return this.normalizeLeadOrDocumentSearch(raw);
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
    this.programadosRows.set([]);
    this.subsanablesRows.set([]);
    this.rechazadosRows.set([]);
    this.instaladosRows.set([]);
    this.correccionInstalacionRows.set([]);
    this.detail.set(null);
    this.eventos.set([]);
    this.selectedLeadId.set(null);
    this.totalPlataforma.set(0);
    this.totalProgramados.set(0);
    this.totalSubsanables.set(0);
    this.totalRechazados.set(0);
    this.totalInstalados.set(0);
    this.totalCorreccionInstalacion.set(0);
    this.pagePlataforma.set(0);
    this.pageProgramados.set(0);
    this.pageSubsanables.set(0);
    this.pageRechazados.set(0);
    this.pageInstalados.set(0);
    this.pageCorreccionInstalacion.set(0);
    this.detailDrawerOpen.set(false);
    this.correctionDrawerOpen.set(false);
    this.correctionTarget.set(null);
    this.selectedOfertaProviderId.set(null);
    this.adicionalesSeleccionados.set([]);
    this.adicionalesDirty.set(false);
    this.provinciasDomicilio.set([]);
    this.distritosDomicilio.set([]);
    this.ubigeoDomicilioLoading.set(false);
    this.ubigeoDomicilioError.set(null);
    this.searchInput.set('');
    this.searchTermActive.set('');
    this.searchLookup.set(null);
    this.isSearching.set(false);
    this.messageService.clear();
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const responseError = (error as { error?: { message?: string; error?: string } }).error;
      return this.humanizeApiMessage(responseError?.message ?? responseError?.error ?? fallback);
    }
    return fallback;
  }

  private humanizeApiMessage(message: string): string {
    return message
      .replaceAll('fechaRechazo', 'Fecha de rechazo')
      .replaceAll('tipificacion', 'tipificación')
      .replaceAll('instalacion', 'instalación')
      .replaceAll('programacion', 'programación')
      .replaceAll('digitos', 'dígitos');
  }
}
