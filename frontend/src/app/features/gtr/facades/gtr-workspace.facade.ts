import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable, computed, effect, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import {
  AsesorGtrPresenceResponse,
  ConnectedUserResponse,
  PresenceService
} from '../../../core/services/presence.service';
import { BrowserSessionService } from '../../../core/services/browser-session.service';
import { OperationalGateService } from '../../../core/services/operational-gate.service';
import { EstadoAsistencia } from '../../../shared/models/schedule/estado-asistencia';
import { AttendanceRealtimeService } from '../../../core/services/attendance-realtime.service';
import { PresenceRealtimeService } from '../../../core/services/presence-realtime.service';
import { UsuarioResponse } from '../../../shared/models/auth/usuario-response';
import { PresenceRealtimeEvent } from '../../../shared/models/gateway/presence-realtime-event';
import {
  AdicionalResponse,
  AsesorLeadsPendientesResponse,
  BaseLead,
  CampanaResponse,
  CampoCaptura,
  CampoConfigItem,
  CatalogoResponse,
  Etapa,
  EventoResponse,
  LeadDetalleResponse,
  LeadDireccionRequest,
  LeadGtrGroupFilter,
  LeadGtrGroupItemResponse,
  LeadGtrGroupMode,
  LeadGtrGroupType,
  LeadGtrGroupsResponse,
  LeadAgendadoGtrResponse,
  LeadGtrLookupResponse,
  LeadGtrResponse,
  LeadGtrMetricasResponse,
  LeadIntakeMasivoExcelResponse,
  LeadIntakeMasivoExcelResultadoResponse,
  LeadIntakeRequest,
  LeadIntakeRetroactivoRequest,
  LeadOfertaComercialRequest,
  MasivoLeadFilters,
  PageQuery,
  PlanResponse,
  PromocionComercialResponse,
  UbigeoItem
} from '../../../shared/models/preventa/preventa.models';
import { LeadCommercialDataTab } from '../../../shared/components/lead-commercial-data-tabs/lead-commercial-data-tabs.component';
import { buildTelUrl, buildWhatsAppUrl } from '../../../shared/utils/phone-link';
import { providerLogo as resolveProviderLogo } from '../../../shared/utils/provider-logo';
import {
  AjusteJornadaRequest,
  JornadaEfectivaResponse,
  PreviewAjusteJornadaResponse
} from '../../../shared/models/schedule/jornada-efectiva-response';
import { ScheduleAdjustmentService } from '../../../core/services/schedule-adjustment.service';
import { LeadRealtimeService } from '../../preventa/services/lead-realtime.service';
import { PreventaLeadService } from '../../preventa/services/preventa-lead.service';
import {
  GtrHistoricosFiltersFormValue,
  GtrHistoricosStateService
} from '../services/gtr-historicos-state.service';

type VisualLeadGtr = LeadGtrResponse & { isNew?: boolean };

/** Tipo minimo aceptado por openEventHistory — compatible con LeadGtrResponse, LeadAgendadoGtrResponse y LeadVentaResponse. */
export interface EventHistoryTarget {
  id: number;
  prefijo: string;
  lead: string;
  tieneMultiplesRegistrosDia?: boolean | null;
  tieneRegistrosMismaCampanaDia?: boolean | null;
}
type VisualLeadAgendadoGtr = LeadAgendadoGtrResponse & { isNew?: boolean };
export type GtrSection = 'plataforma' | 'agendados' | 'historicos' | 'ranking';

type SelectOption<T> = {
  label: string;
  value: T;
};

type TipificacionSelectOption = SelectOption<number> & {
  codigo: string;
  descripcion: string;
};

type SubtipificacionSelectOption = SelectOption<number> & {
  codigo: string;
  descripcion: string;
  idTipificacion: number;
};

type TipificacionVisualMeta = {
  orden: number;
  paletteIndex: number;
};

type OfertaProviderOption = { id: number; nombre: string };
type OfertaAdditionalSelection = {
  idAdicional: number;
  nombre: string;
  precioUnitario?: number | null;
  cantidad: number;
};

const CAMPOS_CONFIGURABLES: Record<CampoCaptura, { tab: 'datos' | 'direccion'; control: string; label: string }> = {
  NOMBRE_MADRE: { tab: 'datos', control: 'nombreMadre', label: 'Madre' },
  NOMBRE_PADRE: { tab: 'datos', control: 'nombrePadre', label: 'Padre' },
  DOC_TITULAR_CELULAR: {
    tab: 'datos',
    control: 'numeroDocumentoTitularCelularRegistro',
    label: 'Numero de Documento del Titular del Celular'
  },
  NOMBRE_TITULAR_CELULAR: { tab: 'datos', control: 'nombreTitularCelularRegistro', label: 'Nombre del Titular del Celular' },
  PLANO: { tab: 'direccion', control: 'plano', label: 'Plano' }
};

type AgendadosSortField = 'programado' | 'agendado';
type GtrPlatformSortField =
  | 'lastEntryAt'
  | 'createdAt'
  | 'campana'
  | 'primeraCodigoTipificacion'
  | 'codigoTipificacion'
  | 'estado'
  | 'nombreAsesorAsignado';
type GtrHistoricosSortField = 'lastEntryAt' | 'codigoTipificacion' | 'estado' | 'nombreAsesorAsignado';
type GtrPlatformSortDirection = 'asc' | 'desc';
type GtrHistoricosGroupMode = 'SIN_AGRUPAR' | 'ULTIMA_TIPIFICACION' | 'ESTADO' | 'INGRESO';

type AdvisorOption = {
  empleadoId: number;
  nombreCompleto: string;
  roles: string[];
  connected: boolean;
  operativo: boolean;
  disponibilidad?: string | null;
  estadoSchedule?: string | null;
  esperadoHoy?: boolean;
  lastSeen?: string | null;
};

/** Asesor enriquecido con sus leads pendientes y si dejó leads abandonados (desconectado con pendientes). */
type AdvisorView = AdvisorOption & {
  leadsPendientes: number;
  esAbandonador: boolean;
};

type PendingReassignment = {
  row: LeadGtrResponse;
  advisor: AdvisorOption;
  currentAdvisorName: string;
  requiresInManagement: boolean;
  requiresReassignment: boolean;
  requiresPreviousManagement: boolean;
  previousManagementAt?: string | null;
};

type PendingTakeover = {
  idLead: number;
  leadLabel: string;
  currentAdvisorName: string;
  requiresInManagement: boolean;
  requiresReassignment: boolean;
  requiresPreviousManagement: boolean;
  previousManagementAt?: string | null;
};

type AssignmentConflictDetails = {
  tipo?: string;
  nombreAsesorActual?: string | null;
  ultimaGestionAt?: string | null;
  requiereConfirmarLeadEnGestion?: boolean;
  requiereConfirmarReasignacion?: boolean;
  requiereConfirmarGestionPrevia?: boolean;
};

type GtrDialog = 'lead' | 'intake-confirm' | 'snapshot' | 'typify' | 'assign' | 'reassign-confirm' | 'takeover-confirm' | 'events' | 'advisor-events' | 'search' | 'schedule-extension' | null;
type EventAnomalyFilter = 'multiple-records' | 'same-campaign' | null;
type LeadHistoryMode = 'eventos-dia' | 'tipificacion' | 'asesor';
type IntakeMode = 'normal' | 'retroactivo';
type TipificationHistoryGroupOption = {
  label: string;
  value: string;
  count: number;
};

type LoadError = {
  label: string;
  message: string;
};

const PERU_PHONE_PREFIX = '+51';
const PERU_LEAD_PATTERN = /^9\d{8}$/;
const INTERNATIONAL_LEAD_PATTERN = /^\d{6,15}$/;
const RESTRICT_RETROACTIVE_INTAKE_BY_TIME = true;

@Injectable()
export class GtrWorkspaceFacade {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly preventaService = inject(PreventaLeadService);
  private readonly scheduleAdjustmentService = inject(ScheduleAdjustmentService);
  private readonly realtimeService = inject(LeadRealtimeService);
  private readonly attendanceRealtimeService = inject(AttendanceRealtimeService);
  private readonly operationalGateService = inject(OperationalGateService);
  private readonly browserSessionService = inject(BrowserSessionService);
  private readonly presenceService = inject(PresenceService);
  private readonly presenceRealtimeService = inject(PresenceRealtimeService);
  private readonly historicosStateService = inject(GtrHistoricosStateService);
  private readonly realtimeSubscription = new Subscription();
  private readonly newRowTimers = new Map<number, number>();
  private attendanceRefreshId: number | null = null;
  private retroactiveWindowTimerId: number | null = null;
  private started = false;
  private realtimeStarted = false;
  private initializeInFlight = false;
  private lastAttendanceStatus: EstadoAsistencia | null = null;
  private lastMasivoSearchFiltersKey: string | null = null;
  private readonly formSubscription = new Subscription();
  private readonly operationalGate = this.operationalGateService.createGate('gtr-workspace');

  readonly pageSize = 12;
  readonly historicosPageSize = 20;
  readonly today = this.formatLocalDate(new Date());
  readonly todayLabel = this.formatReadableDate(new Date());
  readonly section = signal<GtrSection>('plataforma');
  private readonly currentOperationalClock = signal(new Date());
  readonly intakeMode = signal<IntakeMode>('normal');
  readonly isLoading = signal(false);
  readonly isReconciling = signal(false);
  readonly isSaving = signal(false);
  readonly isSavingSnapshot = signal(false);
  readonly isLoadingAgendados = signal(false);
  readonly isLoadingMasivos = signal(false);
  readonly isUploadingMasivoExcel = signal(false);
  readonly isLoadingEvents = signal(false);
  readonly isLoadingTipificationHistory = signal(false);
  readonly intakeNumberMaxLength = signal(9);
  private readonly selectedIntakeCampaignId = signal<number | null>(null);
  readonly masivoExcelResultsDialogOpen = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly intakeError = signal<string | null>(null);
  readonly rows = signal<VisualLeadGtr[]>([]);
  readonly agendadosRows = signal<VisualLeadAgendadoGtr[]>([]);
  readonly masivoRows = signal<VisualLeadGtr[]>([]);
  readonly eventRows = signal<EventoResponse[]>([]);
  readonly tipificationHistoryRows = signal<EventoResponse[]>([]);
  readonly tipificationHistoryLoaded = signal(false);
  readonly selectedEventAnomalyFilter = signal<EventAnomalyFilter>(null);
  readonly leadHistoryMode = signal<LeadHistoryMode>('eventos-dia');
  readonly selectedTipificationHistoryFilter = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly searchResults = signal<LeadGtrResponse[]>([]);
  readonly searchLookup = signal<LeadGtrLookupResponse | null>(null);
  readonly pendingIntakeLookup = signal<LeadGtrLookupResponse | null>(null);
  readonly searchTotalElements = signal(0);
  readonly searchTotalPages = signal(0);
  readonly searchPageNumber = signal(0);
  readonly isSearching = signal(false);
  readonly searchExecuted = signal(false);
  readonly platformGroupingMode = signal<LeadGtrGroupMode>('SIN_AGRUPAR');
  readonly platformSelectedGroup = signal<LeadGtrGroupItemResponse | null>(null);
  readonly platformSortField = signal<GtrPlatformSortField>('lastEntryAt');
  readonly platformSortDirection = signal<GtrPlatformSortDirection>('desc');
  readonly platformGroups = signal<LeadGtrGroupsResponse>({
    asesores: [],
    campanas: [],
    estados: [],
    primerasTipificaciones: [],
    ultimasTipificaciones: [],
    ingresos: []
  });
  readonly historicosGroupingMode = signal<GtrHistoricosGroupMode>('SIN_AGRUPAR');
  readonly historicosSelectedGroup = signal<LeadGtrGroupItemResponse | null>(null);
  readonly historicosSortField = signal<GtrHistoricosSortField>('lastEntryAt');
  readonly historicosSortDirection = signal<GtrPlatformSortDirection>('desc');
  readonly historicosGroups = signal<LeadGtrGroupsResponse>({
    asesores: [],
    campanas: [],
    estados: [],
    primerasTipificaciones: [],
    ultimasTipificaciones: [],
    ingresos: []
  });
  readonly metrics = signal<LeadGtrMetricasResponse>({
    nuevos: 0,
    sinGestionar: 0,
    gestionados: 0,
    preventas: 0,
    ingresos: 0
  });
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly pageNumber = signal(0);
  readonly agendadosTotalElements = signal(0);
  readonly agendadosTotalPages = signal(0);
  readonly agendadosPageNumber = signal(0);
  // Orden de la bandeja de agendados: 'programado' = hora de la cita; 'agendado' = momento de tipificacion.
  readonly agendadosSortField = signal<AgendadosSortField>('programado');
  readonly agendadosSortDirection = signal<'asc' | 'desc'>('asc');
  readonly masivoTotalElements = signal(0);
  readonly masivoTotalPages = signal(0);
  readonly masivoPageNumber = signal(0);
  readonly masivoSearched = signal(false);
  readonly masivoExcelImport = signal<LeadIntakeMasivoExcelResponse | null>(null);
  readonly masivoExcelResults = computed<LeadIntakeMasivoExcelResultadoResponse[]>(
    () => this.masivoExcelImport()?.resultados ?? []
  );
  readonly masivoExcelFailureResults = computed<LeadIntakeMasivoExcelResultadoResponse[]>(() =>
    this.masivoExcelResults().filter((row) => !row.registrado)
  );
  readonly selectedIds = signal<Set<number>>(new Set());
  readonly advisors = signal<AdvisorOption[]>([]);
  readonly selectedAssignmentAdvisorId = signal(0);
  /** Leads que siguen en manos de cada asesor (ASIGNADO/EN_GESTION en PREVENTA). */
  readonly pendientesPorAsesor = signal<AsesorLeadsPendientesResponse[]>([]);
  /** Modal de leads abandonados: id del asesor cuyo listado esta abierto. */
  readonly abandonedTargetId = signal<number | null>(null);
  /** Asesor destino elegido para reasignar los leads abandonados. */
  readonly abandonedReassignTargetId = signal<number | null>(null);
  /** Leads abandonados seleccionados para reasignar. */
  readonly abandonedSelectedLeadIds = signal<Set<number>>(new Set());
  readonly campanas = signal<CampanaResponse[]>([]);
  readonly catalogoTipificaciones = signal<TipificacionSelectOption[]>([]);
  readonly catalogoSubtipificaciones = signal<SubtipificacionSelectOption[]>([]);
  readonly typifyDetail = signal<LeadDetalleResponse | null>(null);
  readonly typifyCatalogo = signal<CatalogoResponse | null>(null);
  readonly selectedTipificacionCode = signal('');
  readonly planes = signal<PlanResponse[]>([]);
  readonly promociones = signal<PromocionComercialResponse[]>([]);
  readonly adicionales = signal<AdicionalResponse[]>([]);
  readonly selectedOfertaProviderId = signal<number | null>(null);
  readonly selectedOfertaAdditionals = signal<OfertaAdditionalSelection[]>([]);
  readonly departamentos = signal<UbigeoItem[]>([]);
  readonly provinciasDomicilio = signal<UbigeoItem[]>([]);
  readonly distritosDomicilio = signal<UbigeoItem[]>([]);
  readonly activeDataTab = signal<LeadCommercialDataTab>('datos');
  readonly showComment = signal(false);
  readonly isLoadingTypifyDetail = signal(false);
  readonly selectedMasivoTipificacionIds = signal<Set<number>>(new Set());
  readonly subtipificacionFilter = signal('');
  readonly activeDialog = signal<GtrDialog>(null);
  // Recuerda desde que dialogo se abrio el historial para volver a el al cerrarlo (p. ej. la busqueda).
  private eventsReturnDialog: GtrDialog = null;
  readonly activeAssignmentLead = signal<LeadGtrResponse | null>(null);
  readonly activeSnapshotLead = signal<LeadGtrResponse | null>(null);
  readonly activeEventsLead = signal<EventHistoryTarget | null>(null);
  // --- Historial de eventos del dia de un asesor (boton en la card del drawer) ---
  readonly advisorEventsTarget = signal<AdvisorOption | null>(null);
  readonly advisorEventRows = signal<EventoResponse[]>([]);
  readonly isLoadingAdvisorEvents = signal(false);
  readonly pendingReassignment = signal<PendingReassignment | null>(null);
  readonly pendingTakeover = signal<PendingTakeover | null>(null);
  readonly advisorsPanelOpen = signal(false);
  // --- Ampliacion de horario (modal sobre una card de asesor) ---
  readonly extensionTarget = signal<AdvisorOption | null>(null);
  readonly extensionJornada = signal<JornadaEfectivaResponse | null>(null);
  readonly extensionPreview = signal<PreviewAjusteJornadaResponse | null>(null);
  readonly isLoadingExtensionContext = signal(false);
  readonly isSavingExtension = signal(false);
  /** Error propio del modal de ampliacion: se muestra dentro del dialogo, nunca detras. */
  readonly extensionError = signal<string | null>(null);
  private readonly campaignOriginOptions: Array<SelectOption<BaseLead>> = [
    { label: 'WhatsApp', value: 'WHATSAPP' },
    { label: 'Messenger', value: 'MESSENGER' }
  ];
  private readonly noCampaignOriginOptions: Array<SelectOption<BaseLead>> = [
    { label: 'Recontacto', value: 'RECONTACTO' },
    { label: 'Predictivo', value: 'PREDICTIVO' },
    { label: 'Referido', value: 'REFERIDO' },
    { label: 'Masivo', value: 'MASIVO' },
    { label: 'Sin identificar', value: 'SIN_IDENTIFICAR' }
  ];
  readonly intakeBaseOptions = computed<Array<SelectOption<BaseLead>>>(() =>
    this.selectedIntakeCampaignId() ? this.campaignOriginOptions : this.noCampaignOriginOptions
  );
  readonly canDisplayOperationalData = this.operationalGate.canDisplayOperationalData;
  readonly canMutateOperationalData = this.operationalGate.canMutateOperationalData;

  /**
   * Asesores enriquecidos con sus leads pendientes y ordenados con los "abandonadores"
   * (desconectados con leads sin atender) arriba. Computed: referencia estable para PrimeNG/OnPush.
   */
  readonly advisorsView = computed<AdvisorView[]>(() => {
    const pendientes = new Map(this.pendientesPorAsesor().map((grupo) => [grupo.idAsesor, grupo.total]));
    return this.advisors()
      .map((advisor) => {
        const leadsPendientes = pendientes.get(advisor.empleadoId) ?? 0;
        return { ...advisor, leadsPendientes, esAbandonador: !advisor.connected && leadsPendientes > 0 };
      })
      .sort(
        (left, right) =>
          Number(right.esAbandonador) - Number(left.esAbandonador) ||
          Number(right.operativo) - Number(left.operativo) ||
          Number(right.connected) - Number(left.connected) ||
          left.nombreCompleto.localeCompare(right.nombreCompleto)
      );
  });
  /** Lista visible del panel GTR: oculta OJT salvo que tenga leads abandonados. */
  readonly advisorsPanelView = computed<AdvisorView[]>(() =>
    this.advisorsView().filter((advisor) => !this.isOjtAdvisor(advisor) || advisor.esAbandonador)
  );
  /** Total de leads abandonados visibles en el panel Asesores. */
  readonly abandonadosCount = computed(() =>
    this.advisorsPanelView()
      .filter((advisor) => advisor.esAbandonador)
      .reduce((total, advisor) => total + advisor.leadsPendientes, 0)
  );
  /** Grupo de leads del asesor cuyo modal de abandonados esta abierto. */
  readonly abandonedTargetGroup = computed<AsesorLeadsPendientesResponse | null>(() => {
    const id = this.abandonedTargetId();
    return id === null ? null : this.pendientesPorAsesor().find((grupo) => grupo.idAsesor === id) ?? null;
  });
  /** Asesores disponibles (conectados) para recibir una reasignacion. */
  readonly availableAdvisorsForReassign = computed(() =>
    this.advisors().filter((advisor) => advisor.connected)
  );

  readonly intakeForm = this.fb.group({
    prefijo: ['+51', [Validators.required, Validators.pattern(/^\+\d{1,3}$/)]],
    lead: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
    idCampana: [null as number | null],
    base: ['SIN_IDENTIFICAR' as BaseLead, [Validators.required]]
  });
  readonly retroactiveHourControl = new FormControl<Date | null>(this.createTimeValue(19, 0), {
    validators: [Validators.required]
  });
  readonly retroactiveMinTime = this.createTimeValue(18, 0);
  readonly retroactiveMaxTime = this.createTimeValue(23, 59);
  readonly isRetroactiveIntake = computed(() => this.intakeMode() === 'retroactivo');
  readonly canShowRetroactiveIntake = computed(() => {
    if (this.section() === 'ranking') {
      return false;
    }
    if (!RESTRICT_RETROACTIVE_INTAKE_BY_TIME) {
      return true;
    }
    const hour = this.getLimaDateParts(this.currentOperationalClock()).hour;
    return hour >= 4 && hour < 9;
  });
  readonly retroactiveDateLabel = computed(() =>
    this.formatPreviousLimaDate(this.currentOperationalClock())
  );
  readonly intakeDialogTitle = computed(() =>
    this.isRetroactiveIntake() ? 'Registrar lead de ayer' : 'Nuevo Lead'
  );

  readonly assignmentForm = this.fb.group({
    idAsesorAsignado: [0, [Validators.required, Validators.min(1)]]
  });

  readonly snapshotForm = this.fb.group({
    idLead: [0, [Validators.required, Validators.min(1)]],
    numeroDocumentoTitularServicio: [''],
    direccion: ['']
  });

  readonly datosForm = this.fb.group({
    tipoDocumento: ['', [Validators.required]],
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

  readonly direccionForm = this.fb.group({
    idDepartamentoDomicilio: [0, [Validators.required, Validators.min(1)]],
    idProvinciaDomicilio: [0, [Validators.required, Validators.min(1)]],
    idDistritoDomicilio: [0, [Validators.required, Validators.min(1)]],
    ubigeoDomicilio: ['', [Validators.required]],
    tipoDomicilio: [''],
    tipoVia: [''],
    via: [''],
    direccion: ['', [Validators.required]],
    referencia: [''],
    latitud: [null as number | null, [Validators.required]],
    longitud: [null as number | null, [Validators.required]],
    urbanizacion: [''],
    numero: [''],
    manzana: [''],
    lote: [''],
    nombreEdificio: [''],
    nombreCondominio: [''],
    piso: [''],
    interior: [''],
    plano: ['']
  });

  readonly ofertaForm = this.fb.group({
    idProveedor: [0],
    idPlan: [0],
    idPromocionInterna: [0]
  });

  readonly tipificacionForm = this.fb.group({
    codigoTipificacion: ['', [Validators.required]],
    codigoSubtipificacion: ['', [Validators.required]],
    comentario: [''],
    horaProgramada: ['']
  });

  readonly masivoFiltersForm = this.fb.group({
    idProveedor: [0],
    etapa: [''],
    tipificaciones: [[] as number[]],
    subtipificaciones: [[] as number[]],
    fechaDesde: [''],
    fechaHasta: ['']
  });

  readonly etapaOptions: SelectOption<Etapa | ''>[] = [
    { label: 'Todas las etapas', value: '' },
    { label: 'Preventa', value: 'PREVENTA' },
    { label: 'Venta', value: 'VENTA' },
    { label: 'Postventa', value: 'POSTVENTA' },
    { label: 'Cobranza', value: 'COBRANZA' }
  ];
  readonly tipoDocumentoOptions = ['DNI', 'CE', 'RUC'];
  readonly tipoDomicilioOptions = [
    'HOGAR',
    'MULTIFAMILIAR',
    'CONDOMINIO_EDIFICIO',
    'CONDOMINIO_EDIFICIO_NO_HABILITADO'
  ];
  readonly tipoViaOptions = ['AVENIDA', 'JIRON', 'CALLE', 'PASAJE', 'PROLONGACION'];
  readonly providerOptions = computed<SelectOption<number>[]>(() => {
    const providers = new Map<number, string>();
    for (const campana of this.campanas()) {
      if (campana.idProveedor) {
        providers.set(campana.idProveedor, campana.nombreProveedor ?? `Proveedor ${campana.idProveedor}`);
      }
    }
    return [
      { label: 'Todos los proveedores', value: 0 },
      ...[...providers.entries()]
        .map(([value, label]) => ({ label, value }))
        .sort((left, right) => left.label.localeCompare(right.label))
    ];
  });
  readonly subtipificaciones = computed(() => {
    const codigo = this.selectedTipificacionCode();
    const subtipificaciones =
      this.typifyCatalogo()?.tipificaciones.find((tipificacion) => tipificacion.codigo === codigo)?.subtipificaciones ?? [];

    return [...subtipificaciones].sort((left, right) => left.orden - right.orden);
  });
  readonly tipificaciones = computed(() =>
    [...(this.typifyCatalogo()?.tipificaciones ?? [])].sort((left, right) => left.orden - right.orden)
  );
  readonly camposConfig = computed<CampoConfigItem[]>(() => this.typifyDetail()?.camposConfig ?? []);
  readonly camposVisibles = computed<ReadonlySet<string>>(
    () => new Set(this.camposConfig().filter((campo) => campo.visible).map((campo) => campo.campo))
  );
  readonly ofertaProviderOptions = computed<OfertaProviderOption[]>(() => {
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
  readonly planOptions = computed(() => {
    const idProveedor = this.selectedOfertaProviderId();
    const providerPlans = idProveedor ? this.planes().filter((plan) => plan.idProveedor === idProveedor) : [];
    return [{ id: 0, nombre: 'Sin plan' }, ...providerPlans];
  });
  readonly promocionOptions = computed(() => [
    { id: 0, reglaComercial: 'Sin promocion' },
    ...this.promociones()
  ]);
  readonly ofertaAdditionalsTotal = computed(() =>
    this.selectedOfertaAdditionals().reduce((total, adicional) => total + (adicional.precioUnitario ?? 0) * adicional.cantidad, 0)
  );
  readonly requiresScheduledTime = computed(() => this.selectedTipificacionCode() === 'AGENDADO');
  readonly requiresVentaCompleta = computed(() => this.selectedTipificacionCode() === 'PREVENTA_COMPLETA');
  readonly tipificacionVisualMetaByCode = computed(() => {
    const meta = new Map<string, TipificacionVisualMeta>();
    for (const option of this.catalogoTipificaciones()) {
      if (!('codigo' in option) || !('orden' in option)) {
        continue;
      }
      const codigo = String(option.codigo).toUpperCase();
      const orden = Number(option.orden);
      meta.set(codigo, {
        orden,
        paletteIndex: this.tipificacionPaletteIndex(orden)
      });
    }
    return meta;
  });
  readonly filteredEventRows = computed(() => {
    const rows = this.eventRows();
    const filter = this.selectedEventAnomalyFilter();

    if (!filter) {
      return rows;
    }

    const registroRows = rows.filter((evento) => evento.accion === 'REGISTRO');
    if (filter === 'multiple-records') {
      return registroRows;
    }

    const countsByCampaign = new Map<number, number>();

    for (const evento of registroRows) {
      if (!evento.idCampana) {
        continue;
      }
      countsByCampaign.set(evento.idCampana, (countsByCampaign.get(evento.idCampana) ?? 0) + 1);
    }

    return registroRows
      .filter((evento) => !!evento.idCampana && (countsByCampaign.get(evento.idCampana) ?? 0) > 1)
      .sort((left, right) => {
        const rightCount = right.idCampana ? (countsByCampaign.get(right.idCampana) ?? 0) : 0;
        const leftCount = left.idCampana ? (countsByCampaign.get(left.idCampana) ?? 0) : 0;
        if (rightCount !== leftCount) {
          return rightCount - leftCount;
        }

        const leftCampaign = this.eventCampaignLabel(left) ?? '';
        const rightCampaign = this.eventCampaignLabel(right) ?? '';
        const campaignSort = leftCampaign.localeCompare(rightCampaign);
        if (campaignSort !== 0) {
          return campaignSort;
        }

        return this.eventTimestamp(right) - this.eventTimestamp(left);
      });
  });
  readonly tipificationHistoryGroupOptions = computed<TipificationHistoryGroupOption[]>(() => {
    const mode = this.leadHistoryMode();
    const counts = new Map<string, { label: string; count: number }>();

    for (const event of this.tipificationHistoryRows()) {
      const label = mode === 'asesor'
        ? this.tipificationHistoryAdvisor(event)
        : this.display(event.tipificacion);
      const value = this.normalizeLookup(label);
      const current = counts.get(value);
      counts.set(value, {
        label,
        count: (current?.count ?? 0) + 1
      });
    }

    return [...counts.entries()]
      .map(([value, item]) => ({ value, label: item.label, count: item.count }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
  });
  readonly filteredTipificationHistoryRows = computed(() => {
    const selected = this.selectedTipificationHistoryFilter();
    if (!selected) {
      return this.tipificationHistoryRows();
    }

    const mode = this.leadHistoryMode();
    return this.tipificationHistoryRows().filter((event) => {
      const label = mode === 'asesor'
        ? this.tipificationHistoryAdvisor(event)
        : this.display(event.tipificacion);
      return this.normalizeLookup(label) === selected;
    });
  });
  readonly intakeNumberInvalidMessage = computed(() =>
    this.intakeNumberMaxLength() === 9
      ? 'Ingresa un celular valido de 9 digitos que empiece con 9.'
      : 'Ingresa un numero valido para el prefijo seleccionado.'
  );
  readonly intakeCampaignPlaceholder = computed(() => {
    const selectedId = this.selectedIntakeCampaignId();
    if (selectedId === null) {
      return 'Sin campaña';
    }

    return this.campanas().find((campana) => Number(campana.id) === selectedId)?.nombre ?? 'Campaña seleccionada';
  });

  // Tabla plana ordenada por el criterio activo. El backend decide qué filas trae cada página;
  // este orden client-side mantiene la página visualmente consistente (incl. inserts realtime).
  readonly agendadosView = computed<VisualLeadAgendadoGtr[]>(() => {
    const field = this.agendadosSortField();
    const factor = this.agendadosSortDirection() === 'desc' ? -1 : 1;
    return [...this.agendadosRows()].sort(
      (left, right) => (this.agendadoSortValue(left, field) - this.agendadoSortValue(right, field)) * factor
    );
  });
  readonly availableSubtipificaciones = computed(() => {
    const hasActiveFilter = this.subtipificacionFilter().trim().length > 0;
    if (hasActiveFilter) {
      return this.catalogoSubtipificaciones();
    }

    const selected = this.selectedMasivoTipificacionIds();
    if (!selected.size) {
      return [];
    }
    return this.catalogoSubtipificaciones().filter((option) => selected.has(option.idTipificacion));
  });

  readonly sectionTitle = computed(() => {
    switch (this.section()) {
      case 'agendados':  return 'Leads Agendados';
      case 'historicos': return 'Historicos';
      case 'ranking':    return 'Ranking de Asesores';
      default:           return 'Gestion de Leads';
    }
  });

  readonly sectionSubtitle = computed(() => {
    switch (this.section()) {
      case 'agendados':  return this.todayLabel;
      case 'historicos': return 'Busqueda de leads masivos';
      case 'ranking':    return this.todayLabel;
      default:           return this.todayLabel;
    }
  });

  readonly metricCards = computed(() => {
    const metrics = this.metrics();
    return [
      { label: 'Ingresos', value: metrics.ingresos, tone: 'blue' },
      { label: 'Nuevos', value: metrics.nuevos, tone: 'blue' },
      { label: 'Sin Gestionar', value: metrics.sinGestionar, tone: 'amber' },
      { label: 'Gestionados', value: metrics.gestionados, tone: 'green' },
      { label: 'Preventas', value: metrics.preventas, tone: 'violet' }
    ];
  });

  readonly platformGroupingModeOptions: Array<{ label: string; value: LeadGtrGroupMode }> = [
    { label: 'Sin agrupar', value: 'SIN_AGRUPAR' },
    { label: 'Proveedor', value: 'CAMPANA' },
    { label: 'Primera tipificación', value: 'PRIMERA_TIPIFICACION' },
    { label: 'Última tipificación', value: 'ULTIMA_TIPIFICACION' },
    { label: 'Estado', value: 'ESTADO' },
    { label: 'Asesor', value: 'ASESOR' }
  ];
  readonly platformSortOptions: Array<{ label: string; value: GtrPlatformSortField }> = [
    { label: 'Última gestión', value: 'lastEntryAt' },
    { label: 'Ingreso', value: 'createdAt' },
    { label: 'Proveedor', value: 'campana' },
    { label: 'Primera tipificación', value: 'primeraCodigoTipificacion' },
    { label: 'Última tipificación', value: 'codigoTipificacion' },
    { label: 'Estado', value: 'estado' },
    { label: 'Asesor', value: 'nombreAsesorAsignado' }
  ];
  readonly platformSortDirectionOptions = computed<Array<{ label: string; value: GtrPlatformSortDirection }>>(() =>
    this.platformSortField() === 'lastEntryAt' || this.platformSortField() === 'createdAt'
      ? [
          { label: 'Más antiguos', value: 'asc' },
          { label: 'Más recientes', value: 'desc' }
        ]
      : [
          { label: 'A-Z', value: 'asc' },
          { label: 'Z-A', value: 'desc' }
        ]
  );
  readonly platformOrganizationSummary = computed(() => {
    const grouping = this.platformGroupingModeOptions.find((option) => option.value === this.platformGroupingMode())?.label;
    const sorting = this.platformSortOptions.find((option) => option.value === this.platformSortField())?.label;
    const direction = this.platformSortDirectionOptions().find((option) => option.value === this.platformSortDirection())?.label;
    return `${grouping ?? 'Sin agrupar'} · ${sorting ?? 'Última gestión'} (${direction ?? 'Más recientes'})`;
  });
  readonly platformActiveGroupOptions = computed<LeadGtrGroupItemResponse[]>(() => {
    const groups = this.platformGroups();
    switch (this.platformGroupingMode()) {
      case 'ASESOR':
        return groups.asesores;
      case 'CAMPANA':
        return groups.campanas;
      case 'ESTADO':
        return groups.estados;
      case 'PRIMERA_TIPIFICACION':
        return groups.primerasTipificaciones;
      case 'ULTIMA_TIPIFICACION':
        return groups.ultimasTipificaciones;
      default:
        return [];
    }
  });
  readonly isPlatformOrganizationDefault = computed(() =>
    this.platformGroupingMode() === 'SIN_AGRUPAR' &&
    this.platformSelectedGroup() === null &&
    this.platformSortField() === 'lastEntryAt' &&
    this.platformSortDirection() === 'desc'
  );
  readonly historicosGroupingModeOptions: Array<{ label: string; value: GtrHistoricosGroupMode }> = [
    { label: 'Sin agrupar', value: 'SIN_AGRUPAR' },
    { label: 'Última tipificación', value: 'ULTIMA_TIPIFICACION' },
    { label: 'Estado', value: 'ESTADO' },
    { label: 'Ingreso', value: 'INGRESO' }
  ];
  readonly historicosSortOptions: Array<{ label: string; value: GtrHistoricosSortField }> = [
    { label: 'Ingreso', value: 'lastEntryAt' },
    { label: 'Última tipificación', value: 'codigoTipificacion' },
    { label: 'Estado', value: 'estado' },
    { label: 'Asesor', value: 'nombreAsesorAsignado' }
  ];
  readonly historicosSortDirectionOptions = computed<Array<{ label: string; value: GtrPlatformSortDirection }>>(() =>
    this.historicosSortField() === 'lastEntryAt'
      ? [
          { label: 'Más antiguos', value: 'asc' },
          { label: 'Más recientes', value: 'desc' }
        ]
      : [
          { label: 'A-Z', value: 'asc' },
          { label: 'Z-A', value: 'desc' }
        ]
  );
  readonly historicosActiveGroupOptions = computed<LeadGtrGroupItemResponse[]>(() => {
    const groups = this.historicosGroups();
    switch (this.historicosGroupingMode()) {
      case 'ESTADO':
        return groups.estados;
      case 'INGRESO':
        return groups.ingresos ?? [];
      case 'ULTIMA_TIPIFICACION':
        return groups.ultimasTipificaciones;
      default:
        return [];
    }
  });
  readonly isHistoricosOrganizationDefault = computed(() =>
    this.historicosGroupingMode() === 'SIN_AGRUPAR' &&
    this.historicosSelectedGroup() === null &&
    this.historicosSortField() === 'lastEntryAt' &&
    this.historicosSortDirection() === 'desc'
  );

  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly availableAssignmentAdvisors = computed(() => {
    const availabilityOrder = new Map<string, number>([
      ['DISPONIBLE', 0],
      ['CON_LEADS', 1],
      ['GESTIONANDO', 2],
      ['SIN_GESTIONAR', 3],
      ['OCUPADO', 4],
      ['SATURADO', 5]
    ]);

    return this.advisorsView()
      .filter((advisor) => availabilityOrder.has(advisor.disponibilidad ?? ''))
      .sort((left, right) => {
        const leftOrder = availabilityOrder.get(left.disponibilidad ?? '') ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = availabilityOrder.get(right.disponibilidad ?? '') ?? Number.MAX_SAFE_INTEGER;

        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }

        return left.nombreCompleto.localeCompare(right.nombreCompleto);
      });
  });
  readonly selectedAdvisor = computed(() => {
    const advisorId = this.selectedAssignmentAdvisorId();
    return this.advisorsView().find((advisor) => advisor.empleadoId === advisorId) ?? null;
  });
  readonly selectedSnapshotLead = computed(() => {
    const lead = this.activeSnapshotLead();
    if (lead) {
      return lead;
    }

    const idLead = this.snapshotForm.controls.idLead.value;
    return this.rows().find((row) => row.id === idLead)
      ?? this.searchResults().find((row) => row.id === idLead)
      ?? null;
  });

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    this.restoreHistoricosState();
    this.updateIntakeLeadValidation(this.intakeForm.controls.prefijo.value);
    this.formSubscription.add(
      this.intakeForm.controls.prefijo.valueChanges.subscribe((prefijo) => {
        this.updateIntakeLeadValidation(prefijo);
      })
    );
    this.formSubscription.add(
      this.intakeForm.controls.idCampana.valueChanges.subscribe((idCampana) => {
        this.selectedIntakeCampaignId.set(idCampana === null ? null : Number(idCampana));
        this.syncIntakeOriginWithCampaign();
      })
    );
    this.formSubscription.add(
      this.tipificacionForm.controls.codigoTipificacion.valueChanges.subscribe((codigo) => {
        this.selectedTipificacionCode.set(codigo);
        this.tipificacionForm.controls.codigoSubtipificacion.setValue('');
        if (codigo !== 'AGENDADO') {
          this.tipificacionForm.controls.horaProgramada.setValue('');
        }
      })
    );

    effect(() => {
      const status = this.operationalGateService.currentStatus();

      if (!this.started) {
        this.lastAttendanceStatus = status;
        return;
      }

      if (status === 'OFFLINE') {
        this.clearOperationalData();
        this.lastAttendanceStatus = status;
        return;
      }

      if (this.canDisplayOperationalData()) {
        this.startRealtime();
      }

      if (this.operationalGate.canActivateOperationalData() && !this.startedInitialLoad()) {
        void this.initialize();
      } else if (this.operationalGate.canActivateOperationalData() && this.lastAttendanceStatus !== 'ONLINE') {
        void this.reconcile();
      }

      this.lastAttendanceStatus = status;
    });
  }

  setSection(section: GtrSection): void {
    const previousSection = this.section();
    if (previousSection === section) {
      return;
    }
    if (previousSection === 'historicos') {
      this.saveHistoricosState();
    }
    this.section.set(section);
    this.selectedIds.set(section === 'historicos' ? this.getStoredHistoricosSelectedIds() : new Set());
    if (this.started && section !== 'ranking') {
      void this.initialize();
    }
  }

  start(): void {
    this.started = true;
    this.startRetroactiveWindowClock();
    if (this.section() !== 'ranking' && this.operationalGate.canActivateOperationalData()) {
      void this.initialize();
    }
    if (this.canDisplayOperationalData()) {
      this.startRealtime();
    }
    this.document.defaultView?.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  stop(): void {
    this.saveHistoricosState();
    this.started = false;
    this.formSubscription.unsubscribe();
    this.realtimeSubscription.unsubscribe();
    this.realtimeStarted = false;
    this.stopAttendanceRefresh();
    this.stopRetroactiveWindowClock();
    this.document.defaultView?.removeEventListener('visibilitychange', this.handleVisibilityChange);

    for (const timerId of this.newRowTimers.values()) {
      window.clearTimeout(timerId);
    }
    this.newRowTimers.clear();
  }

  async initialize(): Promise<void> {
    if (!this.operationalGate.canActivateOperationalData() || this.initializeInFlight) {
      return;
    }

    this.initializeInFlight = true;
    this.isLoading.set(true);
    this.clearMessages();
    const errors: LoadError[] = [];
    const section = this.section();
    const sectionLoads: Array<[string, () => Promise<void>]> = [];

    if (section === 'plataforma') {
      sectionLoads.push(['bandeja diaria', () => this.refreshPage(false)]);
      sectionLoads.push(['metricas', () => this.refreshMetrics()]);
      sectionLoads.push(['agrupaciones', () => this.refreshPlatformGroups()]);
    }

    if (section === 'agendados') {
      sectionLoads.push(['agendados', () => this.refreshAgendados(false)]);
    }

    sectionLoads.push(['catalogo de tipificaciones', () => this.refreshCatalogoTipificaciones()]);

    try {
      await Promise.all([
        this.runInitialLoad('asesores', () => this.refreshAdvisors(), errors),
        this.runInitialLoad('leads pendientes', () => this.refreshPendientes(), errors),
        this.runInitialLoad('campanas', () => this.refreshCampanas(), errors),
        ...sectionLoads.map(([label, load]) => this.runInitialLoad(label, load, errors))
      ]);

      if (errors.length) {
        this.errorMessage.set(
          `No se pudo cargar: ${errors.map((error) => `${error.label} (${error.message})`).join(', ')}.`
        );
      }
      this.operationalGate.markActivated();
    } finally {
      this.initializeInFlight = false;
      this.isLoading.set(false);
    }
  }

  async submitIntake(): Promise<void> {
    await this.submitIntakeInternal(false);
  }

  async confirmIntakeRegistration(): Promise<void> {
    await this.submitIntakeInternal(true);
  }

  cancelIntakeConfirmation(): void {
    this.pendingIntakeLookup.set(null);
    this.intakeError.set(null);
    this.activeDialog.set('lead');
  }

  intakeConfirmationMessage(): string {
    const lookup = this.pendingIntakeLookup();
    if (!lookup?.existe) {
      return '';
    }

    if (lookup.etapaActual === 'PREVENTA') {
      return 'Este lead ya se encuentra registrado en el sistema. Registralo nuevamente solo si se ha vuelto a comunicar por un canal de nuestras campañas.';
    }

    const contextMessage =
      lookup.mensajeUsuario ??
      'Este lead ya se encuentra registrado en el sistema y no puede gestionarse desde GTR por el momento.';
    return `${contextMessage}\nRegistralo nuevamente solo si se ha vuelto a comunicar por un canal de nuestras campañas.`;
  }

  private async submitIntakeInternal(skipLookupConfirmation: boolean): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }
    this.updateIntakeLeadValidation(this.intakeForm.controls.prefijo.value);
    if (this.intakeForm.invalid || !this.isRetroactiveHourValid()) {
      this.intakeForm.markAllAsTouched();
      if (this.isRetroactiveIntake()) {
        this.retroactiveHourControl.markAsTouched();
      }
      this.intakeError.set(null);
      return;
    }

    const formValue = this.intakeForm.getRawValue();
    const request: LeadIntakeRequest = {
      prefijo: formValue.prefijo,
      lead: formValue.lead,
      idCampana: formValue.idCampana || null,
      base: formValue.base
    };
    if (!skipLookupConfirmation) {
      this.clearMessages();
      this.intakeError.set(null);
      try {
        const lookup = await firstValueFrom(this.preventaService.buscarContextoLeadGtr(request.lead));
        if (lookup.existe) {
          this.pendingIntakeLookup.set(lookup);
          this.activeDialog.set('intake-confirm');
          return;
        }
      } catch (error) {
        this.intakeError.set(this.getErrorMessage(error, 'No se pudo validar el lead antes del registro.'));
        return;
      }
    }

    this.isSaving.set(true);
    this.clearMessages();
    this.intakeError.set(null);
    try {
      const isRetroactive = this.isRetroactiveIntake();
      const retroactiveTime = this.toApiTime(this.retroactiveHourControl.value);
      if (isRetroactive && retroactiveTime) {
        const retroactiveRequest: LeadIntakeRetroactivoRequest = {
          ...request,
          horaRegistro: retroactiveTime
        };
        await firstValueFrom(this.preventaService.registrarIngresoLeadRetroactivo(retroactiveRequest));
      } else {
        await firstValueFrom(this.preventaService.registrarIngresoLead(request));
      }
      this.resetIntakeForm();
      this.pendingIntakeLookup.set(null);
      this.successMessage.set(
        isRetroactive
          ? `Lead anadido a la bandeja de hoy. Su registro quedo atribuido al ${this.retroactiveDateLabel()} a las ${retroactiveTime}.`
          : 'Lead registrado, puedes gestionarlo para anadir informacion basica de validacion.'
      );
      this.intakeMode.set('normal');
      this.activeDialog.set(null);
      await this.reconcile();
    } catch (error) {
      this.intakeError.set(this.getErrorMessage(error, 'No se pudo ingresar el lead.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async uploadMasivoExcel(event: Event): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      this.errorMessage.set('Selecciona un archivo .xlsx.');
      return;
    }

    this.isUploadingMasivoExcel.set(true);
    this.clearMessages();
    try {
      const response = await firstValueFrom(this.preventaService.registrarIngresoLeadsExcel(file));
      this.masivoExcelImport.set(response);
      this.masivoExcelResultsDialogOpen.set(true);
      this.successMessage.set(
        `Excel procesado: ${response.totalRegistrados} registrados y ${response.totalFallidos} fallidos.`
      );
      await Promise.all([
        this.reconcile(),
        this.masivoSearched() ? this.refreshMasivos() : Promise.resolve()
      ]);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo procesar el Excel.'));
    } finally {
      this.isUploadingMasivoExcel.set(false);
    }
  }

  closeMasivoExcelResultsDialog(): void {
    this.masivoExcelResultsDialogOpen.set(false);
    this.masivoExcelImport.set(null);
  }

  async copyMasivoExcelFailures(): Promise<void> {
    const failureRows = this.masivoExcelFailureResults();
    if (!failureRows.length) {
      this.errorMessage.set('No hay fallos para copiar.');
      return;
    }

    const clipboard = this.document.defaultView?.navigator?.clipboard;
    if (!clipboard) {
      this.errorMessage.set('No fue posible acceder al portapapeles.');
      return;
    }

    try {
      await clipboard.writeText(this.buildMasivoExcelFailuresText(failureRows));
      this.successMessage.set('Fallos copiados al portapapeles.');
    } catch {
      this.errorMessage.set('No se pudieron copiar los fallos.');
    }
  }

  beginSnapshot(row: LeadGtrResponse): void {
    this.activeSnapshotLead.set(row);
    this.snapshotForm.reset({
      idLead: row.id,
      numeroDocumentoTitularServicio: row.numeroDocumentoTitularServicio ?? '',
      direccion: row.direccionSnapshot ?? ''
    });
  }

  openNewLead(): void {
    if (!this.ensureCanMutate()) {
      return;
    }
    this.clearMessages();
    this.intakeMode.set('normal');
    this.resetIntakeForm();
    this.pendingIntakeLookup.set(null);
    this.intakeError.set(null);
    this.activeDialog.set('lead');
  }

  openRetroactiveLead(): void {
    if (!this.ensureCanMutate()) {
      return;
    }
    this.clearMessages();
    this.intakeMode.set('retroactivo');
    this.resetIntakeForm();
    this.pendingIntakeLookup.set(null);
    this.intakeError.set(null);
    this.activeDialog.set('lead');
  }

  isRetroactiveHourValid(): boolean {
    if (!this.isRetroactiveIntake()) {
      return true;
    }
    const value = this.retroactiveHourControl.value;
    if (!value || Number.isNaN(value.getTime())) {
      return false;
    }
    const minutes = value.getHours() * 60 + value.getMinutes();
    return minutes >= 18 * 60 && minutes <= 23 * 60 + 59;
  }

  retroactiveHourLabel(): string {
    return this.toApiTime(this.retroactiveHourControl.value) ?? '19:00';
  }

  normalizeLeadNumber(value: string): void {
    const normalized = this.normalizeLeadSearchInput(value);
    if (this.intakeForm.controls.lead.value !== normalized) {
      this.intakeForm.controls.lead.setValue(normalized);
    }
  }

  openSnapshot(row: LeadGtrResponse): void {
    if (!this.ensureCanMutate()) {
      return;
    }
    this.beginSnapshot(row);
    this.activeDialog.set('snapshot');
  }

  async openTipificationFromSnapshot(): Promise<void> {
    const lead = this.selectedSnapshotLead();
    if (!lead) {
      this.errorMessage.set('Selecciona un lead antes de tipificar.');
      return;
    }
    await this.openTipification(lead.id);
  }

  async openTipification(
    idLead: number,
    options: { confirmarReasignacion?: boolean; confirmarGestionPrevia?: boolean } = {}
  ): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }
    this.clearMessages();
    this.pendingTakeover.set(null);
    this.isLoadingTypifyDetail.set(true);
    this.activeDialog.set('typify');
    try {
      await firstValueFrom(this.preventaService.tomarGestionGtr(idLead, options));
      await this.ensureTypifyCatalogs();
      const detail = await firstValueFrom(this.preventaService.obtenerDetalleAsesor(idLead));
      this.typifyDetail.set(detail);
      this.patchTypifyForms(detail);
      await this.refreshOfferCatalogs(detail.idPlan ?? 0);
    } catch (error) {
      if (!this.handleTakeoverConflict(error, idLead)) {
        this.errorMessage.set(this.getTipificationOpenError(error));
        this.closeTipificationDialog();
      }
    } finally {
      this.isLoadingTypifyDetail.set(false);
    }
  }

  closeTipificationDialog(): void {
    this.typifyDetail.set(null);
    this.activeDialog.set('snapshot');
    this.resetTipificationState();
  }

  async confirmTakeover(): Promise<void> {
    const pending = this.pendingTakeover();
    if (!pending) {
      return;
    }
    await this.openTipification(pending.idLead, {
      confirmarReasignacion: pending.requiresReassignment,
      confirmarGestionPrevia: pending.requiresPreviousManagement
    });
  }

  cancelTakeover(): void {
    this.pendingTakeover.set(null);
    this.activeDialog.set('snapshot');
  }

  async tipificarLeadGtr(): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }
    const detail = this.typifyDetail();
    if (!detail || this.tipificacionForm.invalid) {
      this.errorMessage.set('Selecciona tipificacion y subtipificacion.');
      return;
    }
    if (this.requiresScheduledTime() && !this.tipificacionForm.controls.horaProgramada.value) {
      this.errorMessage.set('La hora programada es obligatoria para AGENDADO.');
      return;
    }
    if (this.requiresVentaCompleta()) {
      const message = this.getVentaCompletaMissingMessage();
      if (message) {
        this.errorMessage.set(message);
        return;
      }
    }

    const raw = this.tipificacionForm.getRawValue();
    const tipificacionPayload = {
      codigoTipificacion: raw.codigoTipificacion,
      codigoSubtipificacion: raw.codigoSubtipificacion,
      comentario: this.showComment() ? raw.comentario || null : null,
      horaProgramada: this.requiresScheduledTime() ? raw.horaProgramada || null : null
    };
    const forceFullSave = this.requiresVentaCompleta();

    if (forceFullSave || this.hasUnsavedDataChanges()) {
      const canProceed = await this.guardarAntesDeTipificar(detail, forceFullSave);
      if (!canProceed) {
        return;
      }
    }

    this.isSaving.set(true);
    this.clearMessages();
    try {
      await firstValueFrom(this.preventaService.tipificarLead(detail.id, tipificacionPayload));
      this.successMessage.set('Lead tipificado.');
      this.closeDialog();
      await this.reconcile();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo tipificar el lead.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  openWhatsAppChat(row: Pick<LeadGtrResponse, 'prefijo' | 'lead'>): void {
    const url = this.whatsAppUrl(row.prefijo, row.lead);
    if (!url) {
      this.errorMessage.set('El lead no tiene un numero valido para abrir WhatsApp.');
      return;
    }

    this.document.defaultView?.open(url, '_blank', 'noopener,noreferrer');
  }

  openDialer(row: Pick<LeadGtrResponse, 'prefijo' | 'lead'>): void {
    if (!this.ensureCanMutate()) {
      return;
    }

    const url = this.telUrl(row.prefijo, row.lead);
    if (!url) {
      this.errorMessage.set('El lead no tiene un numero valido para iniciar la llamada.');
      return;
    }

    this.browserSessionService.allowExternalNavigation();
    this.document.defaultView?.location.assign(url);
  }

  openAssignment(row?: LeadGtrResponse): void {
    if (!this.ensureCanMutate()) {
      return;
    }
    this.assignmentForm.reset({ idAsesorAsignado: 0 });
    this.selectedAssignmentAdvisorId.set(0);
    this.pendingReassignment.set(null);
    this.activeAssignmentLead.set(row ?? null);
    this.activeDialog.set('assign');
  }

  changeAssignmentAdvisor(advisorId: number | null): void {
    this.selectedAssignmentAdvisorId.set(advisorId ?? 0);
    this.pendingReassignment.set(null);
    this.clearMessages();
  }

  async openLeadHistory(row: EventHistoryTarget): Promise<void> {
    this.eventsReturnDialog = this.activeDialog();
    this.activeEventsLead.set(row);
    this.eventRows.set([]);
    this.tipificationHistoryRows.set([]);
    this.tipificationHistoryLoaded.set(false);
    this.leadHistoryMode.set('eventos-dia');
    this.selectedEventAnomalyFilter.set(null);
    this.selectedTipificationHistoryFilter.set(null);
    this.activeDialog.set('events');
    await this.loadEventHistory(row);
  }

  private async loadEventHistory(row: EventHistoryTarget): Promise<void> {
    this.isLoadingEvents.set(true);
    this.clearMessages();
    try {
      const page = await firstValueFrom(
        this.preventaService.listarEventosLead(row.id, this.today, {
          pageNumber: 0,
          pageSize: 100,
          sortBy: 'createdAt',
          direction: 'desc'
        })
      );
      this.eventRows.set(page.content);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar el historial de eventos.'));
    } finally {
      this.isLoadingEvents.set(false);
    }
  }

  async setLeadHistoryMode(mode: LeadHistoryMode): Promise<void> {
    if (this.leadHistoryMode() === mode) {
      return;
    }

    this.leadHistoryMode.set(mode);
    this.selectedTipificationHistoryFilter.set(null);

    if (mode !== 'eventos-dia') {
      await this.ensureTipificationHistoryLoaded();
    }
  }

  leadHistoryModeSelected(mode: LeadHistoryMode): boolean {
    return this.leadHistoryMode() === mode;
  }

  private async ensureTipificationHistoryLoaded(): Promise<void> {
    if (this.tipificationHistoryLoaded() || this.isLoadingTipificationHistory()) {
      return;
    }

    const row = this.activeEventsLead();
    if (!row) {
      return;
    }

    this.isLoadingTipificationHistory.set(true);
    this.clearMessages();
    try {
      const page = await firstValueFrom(
        this.preventaService.listarEventosLeadFiltrados(row.id, {
          pageNumber: 0,
          pageSize: 100,
          sortBy: 'createdAt',
          direction: 'desc'
        }, {
          accion: 'TIPIFICACION'
        })
      );
      this.tipificationHistoryRows.set(page.content);
      this.tipificationHistoryLoaded.set(true);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar el historial de tipificaciones.'));
    } finally {
      this.isLoadingTipificationHistory.set(false);
    }
  }

  closeLeadHistory(): void {
    const returnTo = this.eventsReturnDialog;
    this.eventsReturnDialog = null;
    this.activeEventsLead.set(null);
    this.eventRows.set([]);
    this.tipificationHistoryRows.set([]);
    this.tipificationHistoryLoaded.set(false);
    this.leadHistoryMode.set('eventos-dia');
    this.selectedEventAnomalyFilter.set(null);
    this.selectedTipificationHistoryFilter.set(null);
    // Vuelve al dialogo desde el que se abrio el historial (p. ej. la busqueda) sin perder su estado.
    this.activeDialog.set(returnTo);
  }

  async openAdvisorEvents(advisor: AdvisorOption): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    this.advisorEventsTarget.set(advisor);
    this.advisorEventRows.set([]);
    this.activeDialog.set('advisor-events');
    await this.loadAdvisorEvents(advisor);
  }

  private async loadAdvisorEvents(advisor: AdvisorOption): Promise<void> {
    this.isLoadingAdvisorEvents.set(true);
    this.clearMessages();
    try {
      const page = await firstValueFrom(
        this.preventaService.listarEventosEmpleado(advisor.empleadoId, this.today, {
          pageNumber: 0,
          pageSize: 100,
          sortBy: 'createdAt',
          direction: 'desc'
        })
      );
      this.advisorEventRows.set(page.content);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar los eventos del asesor.'));
    } finally {
      this.isLoadingAdvisorEvents.set(false);
    }
  }

  closeAdvisorEvents(): void {
    this.advisorEventsTarget.set(null);
    this.advisorEventRows.set([]);
    this.activeDialog.set(null);
  }

  openSearchDialog(): void {
    if (!this.canDisplayOperationalData()) {
      this.errorMessage.set('Marca ONLINE para activar la busqueda.');
      return;
    }
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.searchLookup.set(null);
    this.searchTotalElements.set(0);
    this.searchTotalPages.set(0);
    this.searchPageNumber.set(0);
    this.searchExecuted.set(false);
    this.activeDialog.set('search');
  }

  setSearchQuery(value: string): void {
    const normalized = this.normalizeLeadSearchInput(value);
    this.searchQuery.set(normalized);
  }

  async executeSearch(): Promise<void> {
    const value = this.searchQuery().trim();
    if (!value) {
      this.errorMessage.set('Ingresa el numero del lead a buscar.');
      return;
    }
    this.searchPageNumber.set(0);
    await this.runSearch();
  }

  async changeSearchPage(pageNumber: number): Promise<void> {
    if (pageNumber === this.searchPageNumber()) {
      return;
    }
    this.searchPageNumber.set(pageNumber);
    await this.runSearch();
  }

  private async runSearch(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const value = this.searchQuery().trim();
    if (!value) {
      return;
    }
    this.isSearching.set(true);
    this.clearMessages();
    this.searchLookup.set(null);
    try {
      const page = await firstValueFrom(
        this.preventaService.buscarLeadGtr(value, {
          pageNumber: this.searchPageNumber(),
          pageSize: this.pageSize,
          sortBy: 'lastEntryAt',
          direction: 'desc'
        })
      );
      this.searchResults.set(page.content);
      this.searchTotalElements.set(page.totalElements);
      this.searchTotalPages.set(page.totalPages);
      this.searchExecuted.set(true);
      if (page.content.length === 0 && this.searchPageNumber() === 0) {
        const lookup = await firstValueFrom(this.preventaService.buscarContextoLeadGtr(value));
        // Mostrar el aviso cuando el número existe pero su lead está en otra etapa (aunque ahora SÍ
        // pueda registrarse para atención): el GTR necesita saber que el número está en otra etapa.
        const enOtraEtapa = !!lookup.etapaActual && lookup.etapaActual !== 'PREVENTA';
        this.searchLookup.set(
          lookup.existe && (enOtraEtapa || !lookup.puedeGestionarseEnGtr) ? lookup : null
        );
      }
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo buscar el lead.'));
    } finally {
      this.isSearching.set(false);
    }
  }

  openAgendadoAssignment(row: LeadAgendadoGtrResponse): void {
    if (!this.ensureCanMutate()) {
      return;
    }
    this.openAssignment(this.mapAgendadoToLead(row));
  }

  closeDialog(): void {
    const currentDialog = this.activeDialog();
    if (currentDialog === 'lead' || currentDialog === 'intake-confirm') {
      this.clearMessages();
    }
    this.assignmentForm.reset({ idAsesorAsignado: 0 });
    this.selectedAssignmentAdvisorId.set(0);
    this.resetIntakeForm();
    this.intakeMode.set('normal');
    this.activeDialog.set(null);
    this.activeAssignmentLead.set(null);
    this.activeSnapshotLead.set(null);
    this.typifyDetail.set(null);
    this.resetTipificationState();
    this.activeEventsLead.set(null);
    this.pendingReassignment.set(null);
    this.pendingTakeover.set(null);
    this.eventRows.set([]);
    this.tipificationHistoryRows.set([]);
    this.tipificationHistoryLoaded.set(false);
    this.selectedEventAnomalyFilter.set(null);
    this.leadHistoryMode.set('eventos-dia');
    this.selectedTipificationHistoryFilter.set(null);
    this.pendingIntakeLookup.set(null);
    this.intakeError.set(null);
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.searchLookup.set(null);
    this.searchTotalElements.set(0);
    this.searchTotalPages.set(0);
    this.searchPageNumber.set(0);
    this.searchExecuted.set(false);
  }

  toggleAdvisorsPanel(): void {
    this.advisorsPanelOpen.update((isOpen) => !isOpen);
  }

  closeAdvisorsPanel(): void {
    this.advisorsPanelOpen.set(false);
  }

  hasUnsavedDataChanges(): boolean {
    return this.datosForm.dirty || this.direccionForm.dirty || this.ofertaForm.dirty;
  }

  toggleComment(): void {
    this.showComment.update((value) => !value);
  }

  onTipoDocumentoChanged(): void {
    const control = this.datosForm.controls.numeroDocumentoTitularServicio;
    this.setNumericDigits(control, control.value, this.documentoServicioMaxLength());
  }

  async onPlanChanged(): Promise<void> {
    const idPlan = this.ofertaForm.controls.idPlan.value;
    this.ofertaForm.controls.idPromocionInterna.setValue(0);
    await this.refreshPlanPromotions(idPlan);
  }

  async onOfertaProviderChanged(idProveedor: number): Promise<void> {
    this.selectedOfertaProviderId.set(idProveedor || null);
    this.ofertaForm.patchValue({
      idProveedor: idProveedor || 0,
      idPlan: 0,
      idPromocionInterna: 0
    });
    this.selectedOfertaAdditionals.set([]);
    this.promociones.set([]);
    this.adicionales.set([]);
    this.ofertaForm.markAsDirty();
    if (idProveedor) {
      await this.refreshProviderAdditionals(idProveedor);
    }
  }

  incrementarAdicional(adicional: AdicionalResponse): void {
    const current = this.selectedOfertaAdditionals();
    const existing = current.find((item) => item.idAdicional === adicional.id);
    const updated = existing
      ? current.map((item) =>
          item.idAdicional === adicional.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      : [
          ...current,
          {
            idAdicional: adicional.id,
            nombre: adicional.nombre,
            precioUnitario: adicional.precioUnitario,
            cantidad: 1
          }
        ];
    this.selectedOfertaAdditionals.set(updated);
    this.ofertaForm.markAsDirty();
  }

  disminuirAdicional(adicional: AdicionalResponse): void {
    const updated = this.selectedOfertaAdditionals()
      .map((item) => (item.idAdicional === adicional.id ? { ...item, cantidad: item.cantidad - 1 } : item))
      .filter((item) => item.cantidad > 0);
    this.selectedOfertaAdditionals.set(updated);
    this.ofertaForm.markAsDirty();
  }

  async onDepartamentoDomicilioChanged(): Promise<void> {
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

  async onProvinciaDomicilioChanged(): Promise<void> {
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

  onDistritoDomicilioChanged(): void {
    const idDistrito = this.direccionForm.controls.idDistritoDomicilio.value;
    const distrito = this.distritosDomicilio().find((item) => item.id === idDistrito);
    this.direccionForm.controls.ubigeoDomicilio.setValue(distrito?.codigo ?? '');
    this.direccionForm.controls.ubigeoDomicilio.markAsDirty();
  }

  setActiveDataTab(value: string | number | undefined): void {
    if (value === 'datos' || value === 'direccion' || value === 'oferta') {
      this.activeDataTab.set(value);
    }
  }

  async limpiarTabActiva(): Promise<void> {
    const detail = this.typifyDetail();
    if (!detail) {
      return;
    }

    this.clearMessages();
    switch (this.activeDataTab()) {
      case 'datos':
        this.patchDatosForm(detail);
        this.datosForm.markAsPristine();
        this.successMessage.set('Cambios de Datos Preventa limpiados.');
        return;
      case 'direccion':
        this.patchDireccionForm(detail);
        this.direccionForm.markAsPristine();
        void this.resolveDomicilioSelection(detail.ubigeoDomicilio ?? null);
        this.successMessage.set('Cambios de Direccion limpiados.');
        return;
      case 'oferta':
        this.patchOfertaForm(detail);
        this.ofertaForm.markAsPristine();
        await this.refreshOfferCatalogs(detail.idPlan ?? 0);
        this.successMessage.set('Cambios de Oferta Comercial limpiados.');
        return;
    }
  }

  cancelSnapshot(): void {
    this.activeSnapshotLead.set(null);
    this.snapshotForm.reset({
      idLead: 0,
      numeroDocumentoTitularServicio: '',
      direccion: ''
    });
  }

  async saveSnapshot(): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }
    const raw = this.snapshotForm.getRawValue();
    const numeroDocumentoTitularServicio = raw.numeroDocumentoTitularServicio.trim();
    const direccion = raw.direccion.trim();

    if (!raw.idLead || (!numeroDocumentoTitularServicio && !direccion)) {
      this.errorMessage.set('Selecciona un lead y completa documento o direccion.');
      return;
    }

    this.isSavingSnapshot.set(true);
    this.clearMessages();
    try {
      await firstValueFrom(
        this.preventaService.actualizarSnapshotsLead(raw.idLead, {
          numeroDocumentoTitularServicio: numeroDocumentoTitularServicio || null,
          direccion: direccion || null
        })
      );
      this.successMessage.set('Snapshot inicial actualizado.');
      this.cancelSnapshot();
      this.closeDialog();
      await this.reconcile();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo actualizar el snapshot.'));
    } finally {
      this.isSavingSnapshot.set(false);
    }
  }

  async assignOne(
    row: LeadGtrResponse,
    confirmarReasignacion = false,
    confirmarGestionPrevia = false
  ): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }
    const advisor = this.selectedAdvisor();
    if (!advisor) {
      this.errorMessage.set('Selecciona un asesor.');
      return;
    }

    if (!(await this.ensureAdvisorConnected(advisor))) {
      return;
    }

    if (!confirmarReasignacion && this.preventAssignmentFromCurrentRow(row, advisor)) {
      return;
    }

    this.isSaving.set(true);
    this.clearMessages();
    try {
      await firstValueFrom(
        this.preventaService.asignarLead(row.id, {
          idAsesorAsignado: advisor.empleadoId,
          nombreAsesorAsignado: advisor.nombreCompleto,
          confirmarReasignacion,
          confirmarGestionPrevia
        })
      );
      this.successMessage.set(`Lead ${row.lead} asignado a ${advisor.nombreCompleto}.`);
      this.closeDialog();
      await this.reconcile();
    } catch (error) {
      if (this.openReassignmentConfirmation(error, row, advisor)) {
        return;
      }
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo asignar el lead.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async confirmReassignment(): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }
    const pending = this.pendingReassignment();
    if (!pending) {
      return;
    }

    this.assignmentForm.controls.idAsesorAsignado.setValue(pending.advisor.empleadoId);
    this.selectedAssignmentAdvisorId.set(pending.advisor.empleadoId);
    await this.assignOne(pending.row, pending.requiresReassignment, pending.requiresPreviousManagement);
  }

  cancelReassignment(): void {
    this.pendingReassignment.set(null);
    this.activeDialog.set('assign');
  }

  async assignSelected(): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }
    const advisor = this.selectedAdvisor();
    const idsLead = [...this.selectedIds()];

    if (!advisor || idsLead.length === 0) {
      this.errorMessage.set('Selecciona asesor y al menos un lead.');
      return;
    }

    if (!(await this.ensureAdvisorConnected(advisor))) {
      return;
    }

    this.isSaving.set(true);
    this.clearMessages();
    try {
      const response = await firstValueFrom(
        this.preventaService.asignarLeads({
          idsLead,
          idAsesorAsignado: advisor.empleadoId,
          nombreAsesorAsignado: advisor.nombreCompleto
        })
      );
      this.selectedIds.set(new Set());
      this.successMessage.set(
        `Asignacion masiva: ${response.totalAsignados} asignados, ${response.totalFallidos} fallidos.`
      );
      this.closeDialog();
      await this.reconcile();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo completar la asignacion masiva.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async refreshPendientes(): Promise<void> {
    const data = await firstValueFrom(this.preventaService.listarLeadsPendientesPorAsesor());
    this.pendientesPorAsesor.set(data);
  }

  openAbandonedLeads(idAsesor: number): void {
    this.abandonedTargetId.set(idAsesor);
    const grupo = this.pendientesPorAsesor().find((item) => item.idAsesor === idAsesor);
    this.abandonedSelectedLeadIds.set(new Set(grupo?.leads.map((lead) => lead.id) ?? []));
    this.abandonedReassignTargetId.set(null);
    this.clearMessages();
  }

  closeAbandonedLeads(): void {
    this.abandonedTargetId.set(null);
    this.abandonedSelectedLeadIds.set(new Set());
    this.abandonedReassignTargetId.set(null);
  }

  /** Abre el modal para ampliar el horario (de hoy) de un asesor de la lista. */
  openScheduleExtension(advisor: AdvisorOption): void {
    if (!this.ensureCanMutate()) {
      return;
    }
    this.extensionTarget.set(advisor);
    this.extensionJornada.set(null);
    this.extensionPreview.set(null);
    this.extensionError.set(null);
    this.activeDialog.set('schedule-extension');
    void this.loadExtensionContext(advisor.empleadoId);
  }

  private async loadExtensionContext(idEmpleado: number): Promise<void> {
    this.isLoadingExtensionContext.set(true);
    this.extensionError.set(null);
    try {
      const jornada = await firstValueFrom(this.scheduleAdjustmentService.getJornadaGtr(idEmpleado));
      this.extensionJornada.set(jornada);
    } catch (error) {
      this.extensionError.set(this.getErrorMessage(error, 'No se pudo cargar el horario del asesor.'));
    } finally {
      this.isLoadingExtensionContext.set(false);
    }
  }

  closeScheduleExtension(): void {
    this.extensionTarget.set(null);
    this.extensionJornada.set(null);
    this.extensionPreview.set(null);
    this.extensionError.set(null);
    this.activeDialog.set(null);
  }

  async previewScheduleExtension(request: AjusteJornadaRequest): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }
    const advisor = this.extensionTarget();
    if (!advisor) return;
    this.isLoadingExtensionContext.set(true);
    this.extensionError.set(null);
    try {
      this.extensionPreview.set(
        await firstValueFrom(
          this.scheduleAdjustmentService.previewGtr(advisor.empleadoId, request)
        )
      );
    } catch (error) {
      this.extensionError.set(this.getErrorMessage(error, 'No se pudo preparar la vista previa.'));
    } finally {
      this.isLoadingExtensionContext.set(false);
    }
  }

  async submitScheduleExtension(request: AjusteJornadaRequest): Promise<void> {
    if (!this.ensureCanMutate()) return;
    const advisor = this.extensionTarget();
    if (!advisor) return;
    this.isSavingExtension.set(true);
    this.extensionError.set(null);
    try {
      await firstValueFrom(this.scheduleAdjustmentService.registrarGtr(advisor.empleadoId, request));
      this.successMessage.set(`Jornada de ${advisor.nombreCompleto} actualizada.`);
      this.closeScheduleExtension();
      await this.refreshAdvisors();
    } catch (error) {
      this.extensionError.set(this.getErrorMessage(error, 'No se pudo guardar el ajuste de jornada.'));
    } finally {
      this.isSavingExtension.set(false);
    }
  }

  private toApiTime(value: Date | null): string | null {
    if (!value) return null;
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  }

  isAbandonedLeadSelected(idLead: number): boolean {
    return this.abandonedSelectedLeadIds().has(idLead);
  }

  toggleAbandonedLead(idLead: number, checked: boolean): void {
    this.abandonedSelectedLeadIds.update((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(idLead);
      } else {
        next.delete(idLead);
      }
      return next;
    });
  }

  /** Reasigna los leads abandonados seleccionados a un asesor disponible. */
  async reasignarAbandonados(): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }
    const grupo = this.abandonedTargetGroup();
    const targetId = this.abandonedReassignTargetId();
    const idsLead = [...this.abandonedSelectedLeadIds()];
    if (!grupo || !targetId || idsLead.length === 0) {
      this.errorMessage.set('Selecciona un asesor destino y al menos un lead.');
      return;
    }
    const target = this.advisors().find((advisor) => advisor.empleadoId === targetId);
    if (!target) {
      this.errorMessage.set('El asesor destino ya no esta disponible.');
      return;
    }
    if (!(await this.ensureAdvisorConnected(target))) {
      return;
    }

    this.isSaving.set(true);
    this.clearMessages();
    let asignados = 0;
    let fallidos = 0;
    for (const idLead of idsLead) {
      try {
        await firstValueFrom(
          this.preventaService.asignarLead(idLead, {
            idAsesorAsignado: target.empleadoId,
            nombreAsesorAsignado: target.nombreCompleto,
            confirmarReasignacion: true,
            confirmarGestionPrevia: true
          })
        );
        asignados++;
      } catch {
        fallidos++;
      }
    }
    this.isSaving.set(false);

    if (asignados > 0) {
      this.successMessage.set(
        `Reasignados ${asignados} lead(s) a ${target.nombreCompleto}${fallidos ? `. ${fallidos} no se pudieron reasignar.` : '.'}`
      );
    } else {
      this.errorMessage.set('No se pudo reasignar ningun lead. Intenta de nuevo.');
    }
    this.closeAbandonedLeads();
    await this.refreshPendientes();
    await this.reconcile();
  }

  async refreshAdvisors(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }

    let activeUsers: UsuarioResponse[] = [];
    try {
      // Asesores, supervisores y OJT pueden recibir leads asignados.
      const [asesores, supervisores, ojt] = await Promise.all([
        firstValueFrom(this.preventaService.listarUsuariosActivosPorRol('ASESOR_VENTAS')),
        firstValueFrom(this.preventaService.listarUsuariosActivosPorRol('SUPERVISOR_VENTAS')),
        firstValueFrom(this.preventaService.listarUsuariosActivosPorRol('OJT'))
      ]);
      activeUsers = this.mergePorEmpleado(asesores, supervisores, ojt);
    } catch (error) {
      this.advisors.set([]);
      throw new Error(this.getErrorMessage(error, 'catalogo de asesores activos'));
    }

    let connectedUsers: ConnectedUserResponse[] = [];
    try {
      const [asesoresConectados, supervisoresConectados, ojtConectados] = await Promise.all([
        firstValueFrom(this.presenceService.listarUsuariosConectados('ASESOR_VENTAS')),
        firstValueFrom(this.presenceService.listarUsuariosConectados('SUPERVISOR_VENTAS')),
        firstValueFrom(this.presenceService.listarUsuariosConectados('OJT'))
      ]);
      connectedUsers = this.mergePorEmpleado(asesoresConectados, supervisoresConectados, ojtConectados);
    } catch (error) {
      this.advisors.set(this.mapAdvisorOptions(activeUsers, []));
      throw new Error(this.getErrorMessage(error, 'presencia de asesores'));
    }

    let monitorUsers: AsesorGtrPresenceResponse[] = [];
    try {
      monitorUsers = await firstValueFrom(this.presenceService.listarAsesoresConectadosGtr(this.today));
    } catch {
      monitorUsers = [];
    }

    this.advisors.set(this.mapAdvisorOptions(activeUsers, connectedUsers, monitorUsers));
  }

  /** Une listas de usuarios deduplicando por empleadoId. */
  private mergePorEmpleado<T extends { empleadoId: number }>(...lists: T[][]): T[] {
    const porId = new Map<number, T>();
    for (const item of lists.flat()) {
      porId.set(item.empleadoId, item);
    }
    return [...porId.values()];
  }

  private mapAdvisorOptions(
    activeUsers: UsuarioResponse[],
    connectedUsers: ConnectedUserResponse[],
    monitorUsers: AsesorGtrPresenceResponse[] = []
  ): AdvisorOption[] {
    const connectedById = new Map(connectedUsers.map((advisor) => [advisor.empleadoId, advisor]));
    const monitorById = new Map(monitorUsers.map((advisor) => [advisor.empleadoId, advisor]));
    return activeUsers
      .map((user: UsuarioResponse) => {
        const presence = connectedById.get(user.empleadoId);
        const monitor = monitorById.get(user.empleadoId);
        return {
          empleadoId: user.empleadoId,
          nombreCompleto: user.nombreCompleto,
          roles: user.roles ?? presence?.roles ?? [],
          connected: !!presence,
          operativo: monitor?.operativo ?? false,
          estadoSchedule: monitor?.estadoSchedule ?? null,
          esperadoHoy: monitor?.esperadoHoy ?? false,
          disponibilidad: monitor?.disponibilidad ?? presence?.disponibilidad,
          lastSeen: monitor?.lastSeen ?? presence?.lastSeen
        };
      })
      .sort(
        (left, right) =>
          Number(right.operativo) - Number(left.operativo) ||
          Number(right.connected) - Number(left.connected) ||
          Number(this.isOjtAdvisor(left)) - Number(this.isOjtAdvisor(right)) ||
          left.nombreCompleto.localeCompare(right.nombreCompleto)
      );
  }

  isOjtAdvisor(advisor: Pick<AdvisorOption, 'roles'>): boolean {
    return advisor.roles?.includes('OJT') ?? false;
  }

  async nextPage(): Promise<void> {
    if (this.pageNumber() + 1 >= this.totalPages()) {
      return;
    }
    this.pageNumber.update((value) => value + 1);
    await this.refreshPage(false);
  }

  async setPlatformGroupingMode(mode: LeadGtrGroupMode): Promise<void> {
    if (!mode || mode === this.platformGroupingMode()) {
      return;
    }
    this.platformGroupingMode.set(mode);
    this.platformSelectedGroup.set(null);
    this.pageNumber.set(0);
    await this.refreshPage(false);
  }

  async selectPlatformGroup(group: LeadGtrGroupItemResponse | null | undefined): Promise<void> {
    this.platformSelectedGroup.set(group ?? null);
    this.pageNumber.set(0);
    await this.refreshPage(false);
  }

  async setPlatformSortField(field: GtrPlatformSortField): Promise<void> {
    if (!field || field === this.platformSortField()) {
      return;
    }
    this.platformSortField.set(field);
    this.platformSortDirection.set(field === 'lastEntryAt' || field === 'createdAt' ? 'desc' : 'asc');
    this.pageNumber.set(0);
    await this.refreshPage(false);
  }

  async setPlatformSortDirection(direction: GtrPlatformSortDirection): Promise<void> {
    if (!direction || direction === this.platformSortDirection()) {
      return;
    }
    this.platformSortDirection.set(direction);
    this.pageNumber.set(0);
    await this.refreshPage(false);
  }

  async clearPlatformOrganization(): Promise<void> {
    this.platformGroupingMode.set('SIN_AGRUPAR');
    this.platformSelectedGroup.set(null);
    this.platformSortField.set('lastEntryAt');
    this.platformSortDirection.set('desc');
    this.pageNumber.set(0);
    await this.refreshPage(false);
  }

  async setHistoricosGroupingMode(mode: GtrHistoricosGroupMode): Promise<void> {
    if (!mode || mode === this.historicosGroupingMode()) {
      return;
    }
    this.historicosGroupingMode.set(mode);
    this.historicosSelectedGroup.set(null);
    this.masivoPageNumber.set(0);
    if (this.masivoSearched()) {
      await this.refreshMasivos();
    }
  }

  async selectHistoricosGroup(group: LeadGtrGroupItemResponse | null | undefined): Promise<void> {
    this.historicosSelectedGroup.set(group ?? null);
    this.masivoPageNumber.set(0);
    if (this.masivoSearched()) {
      await this.refreshMasivos();
    }
  }

  async setHistoricosSortField(field: GtrHistoricosSortField): Promise<void> {
    if (!field || field === this.historicosSortField()) {
      return;
    }
    this.historicosSortField.set(field);
    this.historicosSortDirection.set(field === 'lastEntryAt' ? 'desc' : 'asc');
    this.masivoPageNumber.set(0);
    if (this.masivoSearched()) {
      await this.refreshMasivos();
    }
  }

  async setHistoricosSortDirection(direction: GtrPlatformSortDirection): Promise<void> {
    if (!direction || direction === this.historicosSortDirection()) {
      return;
    }
    this.historicosSortDirection.set(direction);
    this.masivoPageNumber.set(0);
    if (this.masivoSearched()) {
      await this.refreshMasivos();
    }
  }

  async clearHistoricosOrganization(): Promise<void> {
    this.historicosGroupingMode.set('SIN_AGRUPAR');
    this.historicosSelectedGroup.set(null);
    this.historicosSortField.set('lastEntryAt');
    this.historicosSortDirection.set('desc');
    this.masivoPageNumber.set(0);
    if (this.masivoSearched()) {
      await this.refreshMasivos();
    }
  }

  async previousPage(): Promise<void> {
    if (this.pageNumber() === 0) {
      return;
    }
    this.pageNumber.update((value) => value - 1);
    await this.refreshPage(false);
  }

  async changePage(pageNumber: number): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    if (pageNumber === this.pageNumber()) {
      return;
    }
    this.pageNumber.set(pageNumber);
    await this.refreshPage(false);
  }

  async changeAgendadosPage(pageNumber: number): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    if (pageNumber === this.agendadosPageNumber()) {
      return;
    }
    this.agendadosPageNumber.set(pageNumber);
    await this.refreshAgendados(false);
  }

  async changeAgendadosSort(field: AgendadosSortField): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    if (this.agendadosSortField() === field) {
      this.agendadosSortDirection.update((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      this.agendadosSortField.set(field);
      this.agendadosSortDirection.set('asc');
    }
    this.agendadosPageNumber.set(0);
    await this.refreshAgendados(false);
  }

  agendadoSortActive(field: AgendadosSortField): boolean {
    return this.agendadosSortField() === field;
  }

  agendadoSortIcon(field: AgendadosSortField): string {
    if (this.agendadosSortField() !== field) {
      return 'pi pi-sort-alt';
    }
    return this.agendadosSortDirection() === 'asc' ? 'pi pi-sort-amount-up-alt' : 'pi pi-sort-amount-down';
  }

  async buscarMasivos(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.errorMessage.set('Marca ONLINE para activar esta bandeja.');
      return;
    }
    this.clearMessages();
    this.masivoSearched.set(true);
    this.masivoPageNumber.set(0);
    this.selectedIds.set(new Set());
    await this.refreshHistoricosGroups();
    await this.refreshMasivos();
  }

  async changeMasivoPage(pageNumber: number): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    if (pageNumber === this.masivoPageNumber()) {
      return;
    }
    this.masivoPageNumber.set(pageNumber);
    await this.refreshMasivos();
  }

  clearMasivoFilters(): void {
    if (!this.canMutateOperationalData()) {
      this.errorMessage.set('Marca ONLINE para modificar filtros operativos.');
      return;
    }
    this.masivoFiltersForm.reset({
      idProveedor: 0,
      etapa: '',
      tipificaciones: [],
      subtipificaciones: [],
      fechaDesde: '',
      fechaHasta: ''
    });
    this.masivoRows.set([]);
    this.masivoTotalElements.set(0);
    this.masivoTotalPages.set(0);
    this.masivoPageNumber.set(0);
    this.masivoSearched.set(false);
    this.selectedIds.set(new Set());
    this.lastMasivoSearchFiltersKey = null;
    this.historicosGroupingMode.set('SIN_AGRUPAR');
    this.historicosSelectedGroup.set(null);
    this.historicosSortField.set('lastEntryAt');
    this.historicosSortDirection.set('desc');
    this.historicosGroups.set({
      asesores: [],
      campanas: [],
      estados: [],
      primerasTipificaciones: [],
      ultimasTipificaciones: [],
      ingresos: []
    });
    this.selectedMasivoTipificacionIds.set(new Set());
    this.subtipificacionFilter.set('');
    this.historicosStateService.clear();
  }

  onMasivoTipificacionesChange(): void {
    const selected = new Set(this.masivoFiltersForm.controls.tipificaciones.value);
    this.selectedMasivoTipificacionIds.set(selected);
    if (!selected.size) {
      this.masivoFiltersForm.controls.subtipificaciones.setValue([]);
      return;
    }

    const validIds = new Set(
      this.catalogoSubtipificaciones().filter((option) => selected.has(option.idTipificacion)).map((option) => option.value)
    );
    this.masivoFiltersForm.controls.subtipificaciones.setValue(
      this.masivoFiltersForm.controls.subtipificaciones.value.filter((id) => validIds.has(id))
    );
  }

  onMasivoSubtipificacionesChange(): void {
    const selectedSubtipificaciones = new Set(this.masivoFiltersForm.controls.subtipificaciones.value);
    const selectedTipificaciones = new Set(this.masivoFiltersForm.controls.tipificaciones.value);

    for (const subtipificacion of this.catalogoSubtipificaciones()) {
      if (selectedSubtipificaciones.has(subtipificacion.value)) {
        selectedTipificaciones.add(subtipificacion.idTipificacion);
      }
    }

    const nextTipificaciones = [...selectedTipificaciones];
    this.masivoFiltersForm.controls.tipificaciones.setValue(nextTipificaciones);
    this.selectedMasivoTipificacionIds.set(new Set(nextTipificaciones));
  }

  onMasivoSubtipificacionesFilter(value: string | null | undefined): void {
    this.subtipificacionFilter.set(value?.trim() ?? '');
  }

  clearMasivoSubtipificacionesFilter(): void {
    this.subtipificacionFilter.set('');
  }

  toggleSelection(idLead: number, checked: boolean): void {
    if (!this.canMutateOperationalData()) {
      this.errorMessage.set('Marca ONLINE para seleccionar leads.');
      return;
    }
    const next = new Set(this.selectedIds());
    if (checked) {
      next.add(idLead);
    } else {
      next.delete(idLead);
    }
    this.selectedIds.set(next);
  }

  isSelected(idLead: number): boolean {
    return this.selectedIds().has(idLead);
  }

  readonly allVisibleSelected = computed(() => {
    const rows = this.rows();
    if (rows.length === 0) {
      return false;
    }
    const selected = this.selectedIds();
    return rows.every((row) => selected.has(row.id));
  });

  readonly someVisibleSelected = computed(() => {
    const selected = this.selectedIds();
    return this.rows().some((row) => selected.has(row.id)) && !this.allVisibleSelected();
  });

  readonly allMasivoVisibleSelected = computed(() => {
    const rows = this.masivoRows();
    if (rows.length === 0) {
      return false;
    }
    const selected = this.selectedIds();
    return rows.every((row) => selected.has(row.id));
  });

  readonly someMasivoVisibleSelected = computed(() => {
    const selected = this.selectedIds();
    return this.masivoRows().some((row) => selected.has(row.id)) && !this.allMasivoVisibleSelected();
  });

  toggleSelectAllVisible(checked: boolean): void {
    if (!this.canMutateOperationalData()) {
      this.errorMessage.set('Marca ONLINE para seleccionar leads.');
      return;
    }
    const next = new Set(this.selectedIds());
    for (const row of this.rows()) {
      if (checked) {
        next.add(row.id);
      } else {
        next.delete(row.id);
      }
    }
    this.selectedIds.set(next);
  }

  toggleSelectAllMasivoVisible(checked: boolean): void {
    if (!this.canMutateOperationalData()) {
      this.errorMessage.set('Marca ONLINE para seleccionar leads.');
      return;
    }
    const next = new Set(this.selectedIds());
    for (const row of this.masivoRows()) {
      if (checked) {
        next.add(row.id);
      } else {
        next.delete(row.id);
      }
    }
    this.selectedIds.set(next);
  }

  display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  }

  estadoSeverity(value: string | null | undefined): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (value) {
      case 'NUEVO':
        return 'info';
      case 'ASIGNADO':
        return 'warn';
      case 'EN_GESTION':
      case 'AGENDADO':
        return 'secondary';
      case 'GESTIONADO':
        return 'success';
      default:
        return 'secondary';
    }
  }

  advisorSeverity(value: string | null | undefined): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (value) {
      case 'DISPONIBLE':
        return 'success';
      case 'CON_LEADS':
        return 'info';
      case 'GESTIONANDO':
        return 'warn';
      case 'SIN_GESTIONAR':
        return 'warn';
      case 'OCUPADO':
        return 'secondary';
      case 'SATURADO':
      case 'SIN_PRESENCIA':
      case 'OFFLINE':
        return 'danger';
      default:
        return 'info';
    }
  }

  advisorLeadCountSeverity(total: number | null | undefined): 'info' | 'secondary' {
    return Number(total ?? 0) > 0 ? 'info' : 'secondary';
  }

  advisorLeadCountLabel(total: number | null | undefined): string {
    const count = Number(total ?? 0);
    return `${count} ${count === 1 ? 'LEAD' : 'LEADS'}`;
  }

  advisorUnattendedLeadLabel(total: number | null | undefined): string {
    const count = Number(total ?? 0);
    return `${count} ${count === 1 ? 'lead sin atender' : 'leads sin atender'}`;
  }

  warningTitle(row: LeadGtrResponse): string {
    const reasons: string[] = [];
    if (row.tieneMultiplesRegistrosDia) {
      reasons.push('multiples registros');
    }
    if (row.tieneRegistrosMismaCampanaDia) {
      reasons.push('registros con la misma campana');
    }
    return reasons.length ? `Alerta: ${reasons.join(' y ')}` : 'Sin alertas';
  }

  toggleEventAnomalyFilter(filter: Exclude<EventAnomalyFilter, null>): void {
    this.selectedEventAnomalyFilter.update((current) => (current === filter ? null : filter));
  }

  eventAnomalyTagClass(filter: Exclude<EventAnomalyFilter, null>, tone: 'danger' | 'violet'): string {
    const selected = this.selectedEventAnomalyFilter() === filter ? ' event-alert-tag--selected' : '';
    return `event-alert-tag event-alert-tag--${tone}${selected}`;
  }

  toggleTipificationHistoryFilter(value: string | null): void {
    if (!value) {
      this.selectedTipificationHistoryFilter.set(null);
      return;
    }
    this.selectedTipificationHistoryFilter.update((current) => (current === value ? null : value));
  }

  tipificationHistoryFilterSelected(value: string | null): boolean {
    return this.selectedTipificationHistoryFilter() === value;
  }

  tipificationHistoryAdvisor(evento: EventoResponse): string {
    return this.display(evento.nombreActor || evento.nombreAsesorAsignado || 'Sin responsable');
  }

  eventSummary(evento: EventoResponse): string {
    const accion = (evento.accion ?? '').toUpperCase();
    const tipificacion = evento.tipificacion?.trim() || null;
    const subtipificacion = evento.subtipificacion?.trim() || null;
    const tipParts = [tipificacion, subtipificacion].filter(Boolean);

    if (accion === 'TIPIFICACION') {
      return tipParts.length ? tipParts.join(' / ') : '-';
    }

    if (accion === 'REGISTRO' || accion === 'REGISTRO_MASIVO') {
      return this.eventCampaignLabel(evento) ?? '-';
    }

    if (tipParts.length) {
      return tipParts.join(' / ');
    }
    return this.eventCampaignLabel(evento) ?? '-';
  }

  private eventCampaignLabel(evento: EventoResponse): string | null {
    if (!evento.idCampana) {
      return null;
    }

    const campana = this.campanas().find((item) => item.id === evento.idCampana);
    return campana?.nombre ?? `Campana ${evento.idCampana}`;
  }

  private eventTimestamp(evento: EventoResponse): number {
    return evento.createdAt ? new Date(evento.createdAt).getTime() : 0;
  }

  tipificacionLabel(codigo?: string | null, subcodigo?: string | null): string {
    const codigoDisplay = this.display(codigo);
    const subcodigoDisplay = this.display(subcodigo);
    if (codigoDisplay === '-' && subcodigoDisplay === '-') {
      return '-';
    }
    if (codigoDisplay === '-') {
      return subcodigoDisplay;
    }
    if (subcodigoDisplay === '-') {
      return codigoDisplay;
    }
    return `${codigoDisplay} / ${subcodigoDisplay}`;
  }

  tipificacionParts(codigo?: string | null, subcodigo?: string | null): { tipificacion: string; subtipificacion: string } {
    return {
      tipificacion: this.display(codigo),
      subtipificacion: this.display(subcodigo)
    };
  }

  tipificacionTagClass(codigo?: string | null, kind: 'tipificacion' | 'subtipificacion' = 'tipificacion'): string {
    const normalized = this.display(codigo).toUpperCase();
    const base = 'gtr-tip-tag';
    const meta = this.tipificacionVisualMetaByCode().get(normalized);
    const tone = meta ? `palette-${meta.paletteIndex}` : 'neutral';
    return `${base} ${base}--${tone} ${base}--${kind}`;
  }

  leadPrefixLabel(prefijo?: string | null): string {
    if (prefijo === '+51') {
      return '🇵🇪';
    }
    return this.display(prefijo);
  }

  providerLogo(nombreProveedor?: string | null): string | null {
    return resolveProviderLogo(nombreProveedor);
  }

  advisorDotClass(advisor: AdvisorOption): string {
    switch (advisor.disponibilidad) {
      case 'DISPONIBLE':
        return 'dot--available';
      case 'CON_LEADS':
        return 'dot--with-leads';
      case 'GESTIONANDO':
        return 'dot--working';
      case 'SIN_GESTIONAR':
        return 'dot--pending';
      case 'OCUPADO':
        return 'dot--busy';
      case 'SATURADO':
        return 'dot--saturated';
      default:
        return advisor.connected ? 'dot--connected' : 'dot--offline';
    }
  }

  async submitAssignment(): Promise<void> {
    const row = this.activeAssignmentLead();
    if (row) {
      await this.assignOne(row);
      return;
    }

    await this.assignSelected();
  }

  private async ensureAdvisorConnected(advisor: AdvisorOption): Promise<boolean> {
    try {
      const status = await firstValueFrom(this.presenceService.estaConectado(advisor.empleadoId));

      if (status.conectado) {
        return true;
      }

      this.markAdvisorDisconnected(advisor.empleadoId);
      this.errorMessage.set(`${advisor.nombreCompleto} ya no tiene presencia activa. Actualiza y selecciona otro asesor.`);
      void this.refreshAdvisors().catch(() => undefined);
      return false;
    } catch (error) {
      this.markAdvisorDisconnected(advisor.empleadoId);
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo validar la presencia del asesor.'));
      void this.refreshAdvisors().catch(() => undefined);
      return false;
    }
  }

  private markAdvisorDisconnected(empleadoId: number): void {
    this.advisors.update((advisors) =>
      advisors.map((advisor) =>
        advisor.empleadoId === empleadoId
          ? { ...advisor, connected: false, operativo: false, disponibilidad: 'SIN_PRESENCIA', estadoSchedule: 'OFFLINE' }
          : advisor
      )
    );
  }

  private preventAssignmentFromCurrentRow(row: LeadGtrResponse, advisor: AdvisorOption): boolean {
    const currentAdvisorName = row.nombreAsesorAsignado?.trim();
    if (!currentAdvisorName) {
      return false;
    }

    this.clearMessages();

    if (this.sameAdvisorName(currentAdvisorName, advisor.nombreCompleto)) {
      this.errorMessage.set(`El Lead ya esta asignado a ${advisor.nombreCompleto}.`);
      return true;
    }

    return false;
  }

  private openReassignmentConfirmation(error: unknown, row: LeadGtrResponse, advisor: AdvisorOption): boolean {
    if (!(error instanceof HttpErrorResponse) || error.status !== 409) {
      return false;
    }

    const details = (error.error as { details?: AssignmentConflictDetails } | null)?.details;
    const requiresInManagement =
      Boolean(details?.requiereConfirmarLeadEnGestion) ||
      details?.tipo === 'LEAD_EN_GESTION';
    const requiresReassignment =
      requiresInManagement ||
      Boolean(details?.requiereConfirmarReasignacion) ||
      details?.tipo === 'LEAD_YA_ASIGNADO' ||
      details?.tipo === 'CONFIRMACION_ASIGNACION_REQUERIDA';
    const requiresPreviousManagement =
      Boolean(details?.requiereConfirmarGestionPrevia) ||
      details?.tipo === 'ASESOR_YA_GESTIONO_LEAD' ||
      details?.tipo === 'CONFIRMACION_ASIGNACION_REQUERIDA';

    if (!requiresReassignment && !requiresPreviousManagement) {
      return false;
    }

    this.showReassignmentConfirmation(
      row,
      advisor,
      details?.nombreAsesorActual || 'otro asesor',
      requiresInManagement,
      requiresReassignment,
      requiresPreviousManagement,
      details?.ultimaGestionAt ?? null
    );
    return true;
  }

  private showReassignmentConfirmation(
    row: LeadGtrResponse,
    advisor: AdvisorOption,
    currentAdvisorName: string,
    requiresInManagement: boolean,
    requiresReassignment: boolean,
    requiresPreviousManagement: boolean,
    previousManagementAt: string | null
  ): void {
    this.errorMessage.set(null);
    this.pendingReassignment.set({
      row,
      advisor,
      currentAdvisorName,
      requiresInManagement,
      requiresReassignment,
      requiresPreviousManagement,
      previousManagementAt
    });
    this.activeDialog.set('reassign-confirm');
  }

  private handleTakeoverConflict(error: unknown, idLead: number): boolean {
    if (!(error instanceof HttpErrorResponse) || error.status !== 409) {
      return false;
    }

    const details = (error.error as { details?: AssignmentConflictDetails } | null)?.details;
    const requiresInManagement =
      Boolean(details?.requiereConfirmarLeadEnGestion) ||
      details?.tipo === 'LEAD_EN_GESTION';
    const requiresReassignment =
      requiresInManagement ||
      Boolean(details?.requiereConfirmarReasignacion) ||
      details?.tipo === 'LEAD_YA_ASIGNADO' ||
      details?.tipo === 'CONFIRMACION_ASIGNACION_REQUERIDA';
    const requiresPreviousManagement =
      Boolean(details?.requiereConfirmarGestionPrevia) ||
      details?.tipo === 'ASESOR_YA_GESTIONO_LEAD' ||
      details?.tipo === 'CONFIRMACION_ASIGNACION_REQUERIDA';

    if (!requiresReassignment && !requiresPreviousManagement) {
      return false;
    }

    this.errorMessage.set(null);
    this.pendingTakeover.set({
      idLead,
      leadLabel: this.getTakeoverLeadLabel(idLead),
      currentAdvisorName: details?.nombreAsesorActual || 'otro asesor',
      requiresInManagement,
      requiresReassignment,
      requiresPreviousManagement,
      previousManagementAt: details?.ultimaGestionAt ?? null
    });
    this.activeDialog.set('takeover-confirm');
    return true;
  }

  private getTakeoverLeadLabel(idLead: number): string {
    const row = this.selectedSnapshotLead();
    if (row?.id === idLead) {
      return `${this.leadPrefixLabel(row.prefijo)} ${row.lead}`;
    }
    return `Lead ${idLead}`;
  }

  private sameAdvisorName(currentAdvisorName: string, targetAdvisorName: string): boolean {
    return this.normalizeLookup(currentAdvisorName) === this.normalizeLookup(targetAdvisorName);
  }

  private normalizeLookup(value?: string | null): string {
    return (value ?? '').trim().toUpperCase();
  }

  private normalizeLeadSearchInput(value?: string | null): string {
    const digits = (value ?? '').replace(/\D/g, '');
    if (!digits) {
      return '';
    }
    return digits.length > 9 ? digits.slice(-9) : digits;
  }

  private buildMasivoExcelFailuresText(rows: LeadIntakeMasivoExcelResultadoResponse[]): string {
    return rows
      .map((row) => {
        const parts = [
          `Fila ${row.fila}`,
          row.lead ? `Lead ${row.lead}` : null,
          row.mensaje ? `Motivo: ${row.mensaje}` : null,
          row.advertencias?.length ? `Advertencias: ${row.advertencias.join(', ')}` : null
        ].filter(Boolean);

        return parts.join(' | ');
      })
      .join('\n');
  }

  private startRealtime(): void {
    if (this.realtimeStarted) {
      return;
    }

    this.realtimeStarted = true;
    this.realtimeSubscription.add(
      this.realtimeService.watchTopic('/topic/leads/etapa/PREVENTA').subscribe({
        next: (event) => {
          if (
            [
              'REGISTRO',
              'REGISTRO_MASIVO',
              'ASIGNACION',
              'CONTACTO',
              'GESTION_INICIADA',
              'SNAPSHOTS_ACTUALIZADOS',
              'DATOS_PREVENTA_ACTUALIZADOS',
              'DIRECCION_ACTUALIZADA',
              'TIPIFICACION',
              'ATENCION_CERRADA',
              'ELIMINACION'
            ].includes(event.tipo)
          ) {
            void this.reconcile();
          }
        },
        error: () => {
          this.errorMessage.set('Se perdio conexion con el sistema. Si estamos en una actualizacion, recarga la pagina en unos segundos hasta que esta alerta desaparezca.');
        }
      })
    );

    this.realtimeSubscription.add(
      this.attendanceRealtimeService.watchTopic('/topic/asistencia/monitor').subscribe({
        next: () => {
          this.scheduleAttendanceRefresh();
        },
        error: () => undefined
      })
    );

    this.realtimeSubscription.add(
      this.presenceRealtimeService.watchAll().subscribe({
        next: (event) => {
          this.applyPresenceRealtimeEvent(event);
        },
        error: () => undefined
      })
    );
  }

  private readonly handleVisibilityChange = (): void => {
    if (this.document.visibilityState === 'visible' && this.canDisplayOperationalData()) {
      void this.refreshAdvisors().catch(() => undefined);
      void this.refreshPendientes().catch(() => undefined);
    }
  };

  private scheduleAttendanceRefresh(): void {
    if (this.document.visibilityState === 'hidden' || !this.canDisplayOperationalData()) {
      return;
    }

    if (this.attendanceRefreshId !== null) {
      return;
    }

    this.attendanceRefreshId = window.setTimeout(() => {
      this.attendanceRefreshId = null;
      void this.refreshAdvisors().catch(() => undefined);
    }, 500);
  }

  private stopAttendanceRefresh(): void {
    if (this.attendanceRefreshId !== null) {
      window.clearTimeout(this.attendanceRefreshId);
      this.attendanceRefreshId = null;
    }
  }

  private async reconcile(): Promise<void> {
    if (this.isReconciling() || !this.canDisplayOperationalData()) {
      return;
    }

    this.isReconciling.set(true);
    try {
      const section = this.section();
      await Promise.all([
        section === 'plataforma' ? this.refreshPage(true) : Promise.resolve(),
        section === 'plataforma' ? this.refreshMetrics() : Promise.resolve(),
        section === 'plataforma' ? this.refreshPlatformGroups() : Promise.resolve(),
        section === 'agendados' ? this.refreshAgendados(true) : Promise.resolve(),
        section === 'historicos' && this.masivoSearched() ? this.refreshMasivos() : Promise.resolve(),
        this.refreshAdvisors(),
        this.refreshPendientes()
      ]);
    } finally {
      this.isReconciling.set(false);
    }
  }

  private async refreshPage(silent: boolean): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const previous = this.rows();
    const page = await firstValueFrom(
      this.preventaService.listarBandejaGtr(this.today, this.currentQuery(this.pageSize), this.platformGroupFilter())
    );
    this.totalElements.set(page.totalElements);
    this.totalPages.set(page.totalPages);
    this.rows.set(this.mergeVisualRows(previous, page.content, silent));
  }

  private async refreshAgendados(silent: boolean): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    this.isLoadingAgendados.set(!silent);
    try {
      const previous = this.agendadosRows();
      const page = await firstValueFrom(
        this.preventaService.listarAgendadosGtr({
          pageNumber: this.agendadosPageNumber(),
          pageSize: this.pageSize,
          sortBy: this.agendadosSortField(),
          direction: this.agendadosSortDirection()
        })
      );
      this.agendadosTotalElements.set(page.totalElements);
      this.agendadosTotalPages.set(page.totalPages);
      this.agendadosRows.set(this.mergeVisualAgendados(previous, page.content, silent));
    } finally {
      this.isLoadingAgendados.set(false);
    }
  }

  private async refreshMasivos(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    this.isLoadingMasivos.set(true);
    try {
      const page = await firstValueFrom(
        this.preventaService.listarLeadsMasivo(this.getMasivoFilters(), {
          pageNumber: this.masivoPageNumber(),
          pageSize: this.historicosPageSize,
          sortBy: this.historicosSortField(),
          direction: this.historicosSortDirection()
        })
      );
      this.masivoTotalElements.set(page.totalElements);
      this.masivoTotalPages.set(page.totalPages);
      this.masivoRows.set(page.content);
      this.lastMasivoSearchFiltersKey = this.historicosFiltersKey(this.currentHistoricosFiltersFormValue());
      this.saveHistoricosState();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo listar leads masivos.'));
    } finally {
      this.isLoadingMasivos.set(false);
    }
  }

  private async refreshMetrics(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    this.metrics.set(await firstValueFrom(this.preventaService.obtenerMetricasGtr(this.today)));
  }

  private async refreshPlatformGroups(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const groups = await firstValueFrom(this.preventaService.listarAgrupacionesBandejaGtr(this.today));
    this.platformGroups.set({
      asesores: groups.asesores ?? [],
      campanas: groups.campanas ?? [],
      estados: groups.estados ?? [],
      primerasTipificaciones: groups.primerasTipificaciones ?? [],
      ultimasTipificaciones: groups.ultimasTipificaciones ?? []
    });

    const selected = this.platformSelectedGroup();
    if (selected && !this.platformActiveGroupOptions().some((group) => this.samePlatformGroup(group, selected))) {
      this.platformSelectedGroup.set(null);
    }
  }

  private async refreshHistoricosGroups(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const groups = await firstValueFrom(
      this.preventaService.listarAgrupacionesLeadsMasivo(this.getMasivoBaseFilters())
    );
    this.historicosGroups.set({
      asesores: [],
      campanas: [],
      estados: groups.estados ?? [],
      primerasTipificaciones: [],
      ultimasTipificaciones: groups.ultimasTipificaciones ?? [],
      ingresos: groups.ingresos ?? []
    });

    const selected = this.historicosSelectedGroup();
    if (selected && !this.historicosActiveGroupOptions().some((group) => this.samePlatformGroup(group, selected))) {
      this.historicosSelectedGroup.set(null);
    }
  }

  private async refreshCampanas(): Promise<void> {
    this.campanas.set(await firstValueFrom(this.preventaService.listarCampanasActivas()));
  }

  private async ensureTypifyCatalogs(): Promise<void> {
    if (this.typifyCatalogo() && this.planes().length && this.departamentos().length) {
      return;
    }
    const [catalogo, planes, departamentos] = await Promise.all([
      this.typifyCatalogo()
        ? Promise.resolve(this.typifyCatalogo()!)
        : firstValueFrom(this.preventaService.getCatalogoTipificaciones('PREVENTA')),
      this.planes().length ? Promise.resolve(this.planes()) : firstValueFrom(this.preventaService.listarPlanes(undefined, true)),
      this.departamentos().length ? Promise.resolve(this.departamentos()) : firstValueFrom(this.preventaService.listarDepartamentos())
    ]);
    this.typifyCatalogo.set(catalogo);
    this.planes.set(planes);
    this.departamentos.set(departamentos);
  }

  private async refreshCatalogoTipificaciones(): Promise<void> {
    const catalogo = await firstValueFrom(this.preventaService.getCatalogoTipificaciones('PREVENTA'));
    this.typifyCatalogo.set(catalogo);
    this.catalogoTipificaciones.set(
      catalogo.tipificaciones
        .map((tipificacion) => ({
          codigo: tipificacion.codigo,
          descripcion: tipificacion.descripcion,
          label: `${tipificacion.codigo} || ${tipificacion.descripcion}`,
          orden: tipificacion.orden,
          value: tipificacion.id
        }))
        .sort((left, right) => left.label.localeCompare(right.label))
    );
    this.catalogoSubtipificaciones.set(
      catalogo.tipificaciones
        .flatMap((tipificacion) =>
          tipificacion.subtipificaciones.map((subtipificacion) => ({
            codigo: subtipificacion.codigo,
            descripcion: subtipificacion.descripcion,
            idTipificacion: tipificacion.id,
            label: `${subtipificacion.codigo} || ${subtipificacion.descripcion}`,
            orden: subtipificacion.orden,
            value: subtipificacion.id
          }))
        )
        .sort((left, right) => left.label.localeCompare(right.label))
    );
  }

  private async refreshOfferCatalogs(idPlan: number): Promise<void> {
    const plan = this.planes().find((item) => item.id === idPlan);
    const idProveedor = plan?.idProveedor ?? null;
    this.selectedOfertaProviderId.set(idProveedor);
    this.ofertaForm.controls.idProveedor.setValue(idProveedor ?? 0);
    const [promociones, adicionales] = await Promise.all([
      firstValueFrom(this.preventaService.listarPromociones(idPlan ? { idPlan } : {})),
      idProveedor ? firstValueFrom(this.preventaService.listarAdicionales(idProveedor)) : Promise.resolve([])
    ]);
    this.promociones.set(promociones);
    this.adicionales.set(adicionales);
  }

  private async refreshPlanPromotions(idPlan: number): Promise<void> {
    const idProveedor = this.selectedOfertaProviderId() ?? undefined;
    this.promociones.set(
      await firstValueFrom(this.preventaService.listarPromociones({
        idProveedor,
        ...(idPlan ? { idPlan } : {})
      }))
    );
  }

  private async refreshProviderAdditionals(idProveedor: number): Promise<void> {
    this.adicionales.set(await firstValueFrom(this.preventaService.listarAdicionales(idProveedor)));
  }

  private patchTypifyForms(detail: LeadDetalleResponse): void {
    this.patchDatosForm(detail);
    this.patchDireccionForm(detail);
    this.patchOfertaForm(detail);
    this.tipificacionForm.reset({
      codigoTipificacion: '',
      codigoSubtipificacion: '',
      comentario: '',
      horaProgramada: ''
    });
    this.selectedTipificacionCode.set('');
    this.showComment.set(false);
    this.activeDataTab.set('datos');
    this.markTypifyFormsPristine();
  }

  private patchDatosForm(detail: LeadDetalleResponse): void {
    this.datosForm.patchValue({
      tipoDocumento: detail.tipoDocumento ?? '',
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
  }

  private patchDireccionForm(detail: LeadDetalleResponse): void {
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
      latitud: detail.latitud ?? null,
      longitud: detail.longitud ?? null,
      urbanizacion: detail.urbanizacion ?? '',
      numero: detail.numero ?? '',
      manzana: detail.manzana ?? '',
      lote: detail.lote ?? '',
      nombreEdificio: detail.nombreEdificio ?? '',
      nombreCondominio: detail.nombreCondominio ?? '',
      piso: detail.piso ?? '',
      interior: detail.interior ?? '',
      plano: detail.plano ?? ''
    });
    void this.resolveDomicilioSelection(detail.ubigeoDomicilio ?? null);
  }

  private patchOfertaForm(detail: LeadDetalleResponse): void {
    const idPlan = detail.idPlan ?? 0;
    const idProveedor = this.planes().find((plan) => plan.id === idPlan)?.idProveedor ?? null;
    this.selectedOfertaProviderId.set(idProveedor);
    this.selectedOfertaAdditionals.set([]);
    this.ofertaForm.patchValue({
      idProveedor: idProveedor ?? 0,
      idPlan,
      idPromocionInterna: detail.idPromocionInterna ?? 0
    });
  }

  private markTypifyFormsPristine(): void {
    this.datosForm.markAsPristine();
    this.direccionForm.markAsPristine();
    this.ofertaForm.markAsPristine();
    this.tipificacionForm.markAsPristine();
  }

  private resetTipificationState(): void {
    this.typifyDetail.set(null);
    this.selectedTipificacionCode.set('');
    this.selectedOfertaProviderId.set(null);
    this.selectedOfertaAdditionals.set([]);
    this.promociones.set([]);
    this.adicionales.set([]);
    this.provinciasDomicilio.set([]);
    this.distritosDomicilio.set([]);
    this.activeDataTab.set('datos');
    this.showComment.set(false);
    this.tipificacionForm.reset({
      codigoTipificacion: '',
      codigoSubtipificacion: '',
      comentario: '',
      horaProgramada: ''
    });
    this.markTypifyFormsPristine();
  }

  private async guardarAntesDeTipificar(detail: LeadDetalleResponse, forceFullSave = false): Promise<boolean> {
    const tasks: { label: string; action: () => Promise<void>; form: { markAsPristine: () => void } }[] = [];

    if (forceFullSave || this.datosForm.dirty) {
      if (this.datosForm.invalid) {
        this.errorMessage.set('Datos Preventa incompleto: tipo y numero de documento son obligatorios.');
        return false;
      }
      tasks.push({
        label: 'Datos Preventa',
        form: this.datosForm,
        action: () =>
          firstValueFrom(this.preventaService.actualizarDatosPreventa(detail.id, this.cleanObject(this.datosForm.getRawValue())))
      });
    }

    if (forceFullSave || this.direccionForm.dirty) {
      if (this.direccionForm.invalid) {
        this.errorMessage.set(this.getDireccionValidationMessage());
        return false;
      }
      tasks.push({
        label: 'Direccion',
        form: this.direccionForm,
        action: () =>
          firstValueFrom(this.preventaService.actualizarDireccion(detail.id, this.getDireccionRequest()))
      });
    }

    if (forceFullSave || this.ofertaForm.dirty) {
      tasks.push({
        label: 'Oferta Comercial',
        form: this.ofertaForm,
        action: () =>
          firstValueFrom(this.preventaService.actualizarOfertaComercial(detail.id, this.getOfertaRequest()))
      });
    }

    this.isSaving.set(true);
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
    } finally {
      this.isSaving.set(false);
    }

    if (failed.length) {
      const okMsg = saved.length ? `OK: ${saved.join(', ')}. ` : '';
      this.errorMessage.set(`Guardado parcial. ${okMsg}Fallo: ${failed.join(' | ')}. Corrige e intenta tipificar de nuevo.`);
      return false;
    }

    return true;
  }

  private documentoServicioMaxLength(): number {
    switch (this.datosForm.controls.tipoDocumento.value) {
      case 'DNI':
        return 8;
      case 'RUC':
        return 11;
      case 'CE':
        return 12;
      default:
        return 12;
    }
  }

  private setNumericDigits(control: AbstractControl | null, value: string, maxLength: number): void {
    if (!control) {
      return;
    }
    const normalized = value.replace(/\D/g, '').slice(0, maxLength);
    if (control.value !== normalized) {
      control.setValue(normalized);
    }
  }

  private cleanObject<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(Object.entries(value).map(([key, entryValue]) => [key, entryValue === '' ? null : entryValue])) as T;
  }

  private getOfertaRequest(): LeadOfertaComercialRequest {
    const raw = this.ofertaForm.getRawValue();
    const adicionales = this.selectedOfertaAdditionals()
      .filter((item) => item.cantidad > 0)
      .map((item) => ({
        idAdicional: item.idAdicional,
        cantidad: item.cantidad
      }));

    return {
      idPlan: raw.idPlan || null,
      idPromocionInterna: raw.idPromocionInterna || null,
      adicionales: adicionales.length ? adicionales : null
    };
  }

  private getDireccionRequest(): LeadDireccionRequest {
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
      piso: raw.piso,
      interior: raw.interior,
      plano: raw.plano
    });
  }

  private getVentaCompletaMissingMessage(): string | null {
    const blank = (value: string | null | undefined): boolean => !value || !value.trim();
    const d = this.datosForm.controls;
    const a = this.direccionForm.controls;

    const faltantes: { tab: 'datos' | 'direccion' | 'oferta'; campo: string }[] = [];

    if (blank(d.tipoDocumento.value)) faltantes.push({ tab: 'datos', campo: 'Documento' });
    if (blank(d.numeroDocumentoTitularServicio.value)) faltantes.push({ tab: 'datos', campo: 'Numero de Documento' });
    if (blank(d.nombreTitularServicio.value)) faltantes.push({ tab: 'datos', campo: 'Titular del Servicio' });
    if (blank(d.celularRegistro.value)) faltantes.push({ tab: 'datos', campo: 'Celular a registrar' });
    if (blank(d.correo.value)) faltantes.push({ tab: 'datos', campo: 'Correo' });

    for (const campo of this.camposConfig()) {
      if (!campo.visible || !campo.requerido) {
        continue;
      }
      const meta = CAMPOS_CONFIGURABLES[campo.campo];
      if (!meta) {
        continue;
      }
      const value =
        meta.tab === 'datos' ? this.datosForm.get(meta.control)?.value : this.direccionForm.get(meta.control)?.value;
      if (blank(value)) {
        faltantes.push({ tab: meta.tab, campo: meta.label });
      }
    }

    if (blank(a.ubigeoDomicilio.value)) faltantes.push({ tab: 'direccion', campo: 'Distrito' });
    if (blank(a.tipoDomicilio.value)) faltantes.push({ tab: 'direccion', campo: 'Tipo de Domicilio' });
    if (blank(a.direccion.value)) faltantes.push({ tab: 'direccion', campo: 'Direccion' });
    if (blank(a.referencia.value)) faltantes.push({ tab: 'direccion', campo: 'Referencia' });
    if (blank(a.piso.value)) faltantes.push({ tab: 'direccion', campo: 'Piso' });
    if (blank(a.interior.value)) faltantes.push({ tab: 'direccion', campo: 'Interior' });

    if (!this.ofertaForm.controls.idPlan.value) {
      faltantes.push({ tab: 'oferta', campo: 'Plan' });
    }

    if (!faltantes.length) {
      return null;
    }

    const tabsOrdenadas: { tab: 'datos' | 'direccion' | 'oferta'; titulo: string }[] = [
      { tab: 'datos', titulo: 'Datos' },
      { tab: 'direccion', titulo: 'Direccion' },
      { tab: 'oferta', titulo: 'Oferta comercial' }
    ];

    const grupos = tabsOrdenadas
      .map(({ tab, titulo }) => {
        const campos = faltantes.filter((item) => item.tab === tab).map((item) => item.campo);
        return campos.length ? `${titulo}: ${campos.join(', ')}` : null;
      })
      .filter((grupo): grupo is string => grupo !== null);

    this.activeDataTab.set(faltantes[0].tab);
    return `Para cerrar la venta, completa estos datos. ${grupos.join('. ')}.`;
  }

  private getDireccionValidationMessage(): string {
    const missing: string[] = [];
    if (this.direccionForm.controls.idDepartamentoDomicilio.invalid) missing.push('departamento');
    if (this.direccionForm.controls.idProvinciaDomicilio.invalid) missing.push('provincia');
    if (this.direccionForm.controls.idDistritoDomicilio.invalid) missing.push('distrito');
    if (this.direccionForm.controls.direccion.invalid) missing.push('direccion');
    if (this.direccionForm.controls.latitud.invalid) missing.push('latitud');
    if (this.direccionForm.controls.longitud.invalid) missing.push('longitud');
    return missing.length ? `Direccion incompleta. Revisa: ${missing.join(', ')}.` : 'Direccion incompleta.';
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
        : await firstValueFrom(this.preventaService.listarDepartamentos());
      if (!this.departamentos().length) {
        this.departamentos.set(departamentos);
      }

      for (const departamento of departamentos) {
        const provincias = await firstValueFrom(this.preventaService.listarProvincias(departamento.id));
        for (const provincia of provincias) {
          const distritos = await firstValueFrom(this.preventaService.listarDistritos(provincia.id));
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
      this.provinciasDomicilio.set(await firstValueFrom(this.preventaService.listarProvincias(idDepartamento)));
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar las provincias.'));
    }
  }

  private async loadDistritosDomicilio(idProvincia: number): Promise<void> {
    try {
      this.distritosDomicilio.set(await firstValueFrom(this.preventaService.listarDistritos(idProvincia)));
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar los distritos.'));
    }
  }

  private tipificacionPaletteIndex(orden: number): number {
    const totalPalettes = 8;
    if (!Number.isFinite(orden) || orden <= 0) {
      return 0;
    }
    return (orden - 1) % totalPalettes;
  }

  private currentQuery(pageSize: number): PageQuery {
    return {
      pageNumber: pageSize === 100 ? 0 : this.pageNumber(),
      pageSize,
      sortBy: this.platformSortField(),
      direction: this.platformSortDirection()
    };
  }

  private platformGroupFilter(): LeadGtrGroupFilter {
    const mode = this.platformGroupingMode();
    const group = this.platformSelectedGroup();
    if (mode === 'SIN_AGRUPAR' || !group) {
      return {};
    }

    const filter: LeadGtrGroupFilter = {
      tipoGrupo: mode as LeadGtrGroupType,
      sinValor: group.sinValor
    };

    if (group.idGrupo !== null && group.idGrupo !== undefined) {
      filter.idGrupo = group.idGrupo;
    }
    if (mode === 'ESTADO' && group.etiqueta && !group.sinValor) {
      filter.estado = group.etiqueta;
    }
    if (group.codigoTipificacion) {
      filter.codigoTipificacion = group.codigoTipificacion;
    }
    if (group.codigoSubtipificacion) {
      filter.codigoSubtipificacion = group.codigoSubtipificacion;
    }
    return filter;
  }

  private samePlatformGroup(left: LeadGtrGroupItemResponse, right: LeadGtrGroupItemResponse): boolean {
    return Boolean(left.sinValor) === Boolean(right.sinValor)
      && (left.idGrupo ?? null) === (right.idGrupo ?? null)
      && (left.codigoTipificacion ?? null) === (right.codigoTipificacion ?? null)
      && (left.codigoSubtipificacion ?? null) === (right.codigoSubtipificacion ?? null)
      && (left.etiqueta ?? null) === (right.etiqueta ?? null);
  }

  private getMasivoFilters(): MasivoLeadFilters {
    return {
      ...this.getMasivoBaseFilters(),
      ...this.historicosGroupFilter()
    };
  }

  private getMasivoBaseFilters(): MasivoLeadFilters {
    const raw = this.masivoFiltersForm.getRawValue();
    return {
      idProveedor: raw.idProveedor || undefined,
      etapa: raw.etapa || undefined,
      tipificaciones: raw.tipificaciones.length ? raw.tipificaciones : undefined,
      subtipificaciones: raw.subtipificaciones.length ? raw.subtipificaciones : undefined,
      fechaDesde: raw.fechaDesde || undefined,
      fechaHasta: raw.fechaHasta || undefined
    };
  }

  private historicosGroupFilter(): MasivoLeadFilters {
    const mode = this.historicosGroupingMode();
    const group = this.historicosSelectedGroup();
    if (mode === 'SIN_AGRUPAR' || !group) {
      return {};
    }

    const filter: MasivoLeadFilters = {
      tipoGrupo: mode as LeadGtrGroupType,
      sinValor: group.sinValor
    };
    if (mode === 'ESTADO' && group.etiqueta && !group.sinValor) {
      filter.estado = group.etiqueta;
    }
    if (mode === 'ULTIMA_TIPIFICACION') {
      if (group.codigoTipificacion) {
        filter.codigoTipificacion = group.codigoTipificacion;
      }
      if (group.codigoSubtipificacion) {
        filter.codigoSubtipificacion = group.codigoSubtipificacion;
      }
    }
    if (mode === 'INGRESO' && group.valor && !group.sinValor) {
      filter.fechaIngreso = group.valor;
    }
    return filter;
  }

  private currentHistoricosFiltersFormValue(): GtrHistoricosFiltersFormValue {
    const raw = this.masivoFiltersForm.getRawValue();
    return {
      idProveedor: raw.idProveedor,
      etapa: raw.etapa,
      tipificaciones: [...raw.tipificaciones],
      subtipificaciones: [...raw.subtipificaciones],
      fechaDesde: raw.fechaDesde,
      fechaHasta: raw.fechaHasta
    };
  }

  private restoreHistoricosState(): void {
    const state = this.historicosStateService.get();
    if (!state) {
      return;
    }

    this.masivoFiltersForm.reset(state.filters);
    this.selectedMasivoTipificacionIds.set(new Set(state.filters.tipificaciones));
    this.subtipificacionFilter.set('');
    this.masivoRows.set(state.rows);
    this.masivoTotalElements.set(state.totalElements);
    this.masivoTotalPages.set(state.totalPages);
    this.masivoPageNumber.set(state.pageNumber);
    this.masivoSearched.set(state.searched);
    if (this.section() === 'historicos') {
      this.selectedIds.set(new Set(state.selectedIds));
    }
    this.lastMasivoSearchFiltersKey = state.searched ? this.historicosFiltersKey(state.filters) : null;
  }

  private saveHistoricosState(): void {
    const filters = this.currentHistoricosFiltersFormValue();
    const filtersMatchLastSearch =
      this.masivoSearched() && this.historicosFiltersKey(filters) === this.lastMasivoSearchFiltersKey;
    const previousState = this.historicosStateService.get();
    const selectedIds = this.section() === 'historicos'
      ? [...this.selectedIds()]
      : previousState?.selectedIds ?? [];

    this.historicosStateService.set({
      filters,
      rows: filtersMatchLastSearch ? this.masivoRows() : [],
      totalElements: filtersMatchLastSearch ? this.masivoTotalElements() : 0,
      totalPages: filtersMatchLastSearch ? this.masivoTotalPages() : 0,
      pageNumber: filtersMatchLastSearch ? this.masivoPageNumber() : 0,
      searched: filtersMatchLastSearch,
      selectedIds
    });
  }

  private getStoredHistoricosSelectedIds(): Set<number> {
    return new Set(this.historicosStateService.get()?.selectedIds ?? []);
  }

  private historicosFiltersKey(filters: GtrHistoricosFiltersFormValue): string {
    return JSON.stringify({
      ...filters,
      tipificaciones: [...filters.tipificaciones].sort((left, right) => left - right),
      subtipificaciones: [...filters.subtipificaciones].sort((left, right) => left - right)
    });
  }

  private mergeVisualRows(
    previous: VisualLeadGtr[],
    incoming: LeadGtrResponse[],
    animateNew: boolean
  ): VisualLeadGtr[] {
    const previousById = new Map(previous.map((row) => [row.id, row]));
    const newIds: number[] = [];
    const rows = incoming.map((row) => {
      const previousRow = previousById.get(row.id);
      const isNew = animateNew && !previousRow;
      if (isNew) {
        newIds.push(row.id);
      }
      return { ...row, isNew: isNew || previousRow?.isNew };
    });
    this.scheduleNewRowReset(newIds);
    return rows;
  }

  private mergeVisualAgendados(
    previous: VisualLeadAgendadoGtr[],
    incoming: LeadAgendadoGtrResponse[],
    animateNew: boolean
  ): VisualLeadAgendadoGtr[] {
    const previousById = new Map(previous.map((row) => [row.id, row]));
    return incoming.map((row) => {
      const previousRow = previousById.get(row.id);
      return { ...row, isNew: animateNew && !previousRow };
    });
  }

  private mapAgendadoToLead(row: LeadAgendadoGtrResponse): LeadGtrResponse {
    return {
      id: row.id,
      createdAt: row.createdAt,
      prefijo: row.prefijo,
      lead: row.lead,
      nombreCampana: row.nombreCampana,
      nombreProveedorCampana: row.nombreProveedorCampana,
      nombreProveedorEquipo: row.nombreProveedorEquipo,
      base: row.base,
      nombreTitular: row.nombreTitular,
      codigoTipificacion: row.codigoTipificacion,
      codigoSubtipificacion: row.codigoSubtipificacion,
      nombreAsesorAsignado: row.nombreAsesorAsignado,
      estadoSeguimiento: row.estadoSeguimiento,
      totalAsignaciones: row.totalAsignaciones,
      tieneAlertaRegistrosDia: false,
      tieneMultiplesRegistrosDia: false,
      tieneRegistrosMismaCampanaDia: false
    };
  }

  private agendadoSortValue(row: LeadAgendadoGtrResponse, field: AgendadosSortField): number {
    if (field === 'agendado') {
      const ts = row.fechaAgendamiento ? new Date(row.fechaAgendamiento).getTime() : NaN;
      return isNaN(ts) ? Number.MAX_SAFE_INTEGER : ts;
    }
    return this.getScheduledDate(row)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  }

  /** Fecha y hora en que el asesor tipifico AGENDADO (Evento.createdAt), con año. */
  agendadoTipificadoLabel(row: LeadAgendadoGtrResponse): string {
    if (!row.fechaAgendamiento) {
      return '-';
    }
    const d = new Date(row.fechaAgendamiento);
    return isNaN(d.getTime()) ? '-' : this.formatDateTimeLabel(d);
  }

  /** Fecha y hora de la cita: mismo día de la tipificación + la hora elegida, con año. */
  agendadoProgramadoLabel(row: LeadAgendadoGtrResponse): string {
    const scheduled = this.getScheduledDate(row);
    return scheduled ? this.formatDateTimeLabel(scheduled) : 'Sin hora';
  }

  private formatDateTimeLabel(date: Date): string {
    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = date.getFullYear();
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  private getScheduledDate(row: LeadAgendadoGtrResponse): Date | null {
    if (!row.horaProgramada) {
      return null;
    }
    // fechaAgendamiento es un Instant ISO (p.ej. "2026-05-29T18:02:38.782953Z"):
    // extraer solo la parte de fecha local antes de combinar con horaProgramada.
    let dateStr = this.today;
    if (row.fechaAgendamiento) {
      const d = new Date(row.fechaAgendamiento);
      if (!isNaN(d.getTime())) {
        dateStr = this.formatLocalDate(d);
      }
    }
    // Normalizar hora a "HH:mm:ss" (recortar nanosegundos si los hubiera)
    const timeStr = String(row.horaProgramada).substring(0, 8);
    const scheduled = new Date(`${dateStr}T${timeStr}`);
    return isNaN(scheduled.getTime()) ? null : scheduled;
  }

  private scheduleNewRowReset(ids: number[]): void {
    for (const id of ids) {
      const existingTimer = this.newRowTimers.get(id);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }
      const timerId = window.setTimeout(() => {
        this.rows.update((rows) => rows.map((row) => (row.id === id ? { ...row, isNew: false } : row)));
        this.newRowTimers.delete(id);
      }, 3500);
      this.newRowTimers.set(id, timerId);
    }
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  private resetIntakeForm(): void {
    this.intakeForm.reset({
      prefijo: PERU_PHONE_PREFIX,
      lead: '',
      idCampana: null,
      base: 'SIN_IDENTIFICAR'
    });
    this.selectedIntakeCampaignId.set(null);
    this.updateIntakeLeadValidation(this.intakeForm.controls.prefijo.value);
    this.retroactiveHourControl.reset(this.createTimeValue(19, 0));
    this.retroactiveHourControl.markAsPristine();
    this.retroactiveHourControl.markAsUntouched();
    this.intakeForm.markAsPristine();
    this.intakeForm.markAsUntouched();
  }

  private syncIntakeOriginWithCampaign(): void {
    const allowedValues = new Set(this.intakeBaseOptions().map((option) => option.value));
    const current = this.intakeForm.controls.base.value as BaseLead | null;
    if (current && allowedValues.has(current)) {
      return;
    }
    this.intakeForm.controls.base.setValue(this.selectedIntakeCampaignId() ? 'WHATSAPP' : 'SIN_IDENTIFICAR');
  }

  private updateIntakeLeadValidation(prefijo: string): void {
    const leadControl = this.intakeForm.controls.lead;
    const isPeruPrefix = prefijo === PERU_PHONE_PREFIX;

    this.intakeNumberMaxLength.set(isPeruPrefix ? 9 : 15);
    leadControl.setValidators([
      Validators.required,
      Validators.pattern(isPeruPrefix ? PERU_LEAD_PATTERN : INTERNATIONAL_LEAD_PATTERN)
    ]);
    leadControl.updateValueAndValidity({ emitEvent: false });
  }

  private async runInitialLoad(
    label: string,
    load: () => Promise<void>,
    errors: LoadError[]
  ): Promise<void> {
    try {
      await load();
    } catch (error) {
      errors.push({
        label,
        message: this.getErrorMessage(error, 'error')
      });
    }
  }

  private startedInitialLoad(): boolean {
    return this.operationalGate.hasActivatedOperationalData() || this.initializeInFlight;
  }

  private ensureCanMutate(): boolean {
    if (this.canMutateOperationalData()) {
      return true;
    }

    this.errorMessage.set('Marca ONLINE para realizar esta accion.');
    return false;
  }

  private clearOperationalData(): void {
    this.operationalGate.clearActivation();
    this.initializeInFlight = false;
    this.isLoading.set(false);
    this.isReconciling.set(false);
    this.isSaving.set(false);
    this.isSavingSnapshot.set(false);
    this.isLoadingAgendados.set(false);
    this.isLoadingMasivos.set(false);
    this.isLoadingEvents.set(false);
    this.isLoadingTipificationHistory.set(false);
    this.rows.set([]);
    this.agendadosRows.set([]);
    this.masivoRows.set([]);
    this.eventRows.set([]);
    this.metrics.set({
      nuevos: 0,
      sinGestionar: 0,
      gestionados: 0,
      preventas: 0,
      ingresos: 0
    });
    this.totalElements.set(0);
    this.totalPages.set(0);
    this.pageNumber.set(0);
    this.agendadosTotalElements.set(0);
    this.agendadosTotalPages.set(0);
    this.agendadosPageNumber.set(0);
    this.masivoTotalElements.set(0);
    this.masivoTotalPages.set(0);
    this.masivoPageNumber.set(0);
    this.masivoSearched.set(false);
    this.lastMasivoSearchFiltersKey = null;
    this.selectedMasivoTipificacionIds.set(new Set());
    this.subtipificacionFilter.set('');
    this.historicosStateService.clear();
    this.selectedIds.set(new Set());
    this.activeDialog.set(null);
    this.activeAssignmentLead.set(null);
    this.activeEventsLead.set(null);
    this.pendingReassignment.set(null);
    this.pendingTakeover.set(null);
    this.eventRows.set([]);
    this.tipificationHistoryRows.set([]);
    this.tipificationHistoryLoaded.set(false);
    this.selectedEventAnomalyFilter.set(null);
    this.leadHistoryMode.set('eventos-dia');
    this.selectedTipificationHistoryFilter.set(null);
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const responseError = error.error as { message?: string; error?: string } | null;
      const detail = responseError?.message ?? responseError?.error ?? error.statusText;
      return `HTTP ${error.status}${detail ? `: ${detail}` : ''}`;
    }

    if (error instanceof Error) {
      return error.message || fallback;
    }

    if (typeof error === 'object' && error !== null && 'error' in error) {
      const responseError = (error as { error?: { message?: string; error?: string } }).error;
      return responseError?.message ?? responseError?.error ?? fallback;
    }
    return fallback;
  }

  private getTipificationOpenError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const responseError = error.error as { message?: string; error?: string } | null;
      const detail = responseError?.message ?? responseError?.error;
      if (error.status === 404) {
        return 'El lead ya no esta disponible para tu equipo.';
      }
      if (error.status === 403) {
        return 'No tienes permiso para tomar este lead.';
      }
      return detail || 'No se pudo preparar el lead para tipificar.';
    }
    return this.getErrorMessage(error, 'No se pudo preparar el lead para tipificar.');
  }

  private whatsAppUrl(prefijo?: string | null, lead?: string | null): string | null {
    return buildWhatsAppUrl(prefijo, lead);
  }

  private telUrl(prefijo?: string | null, lead?: string | null): string | null {
    return buildTelUrl(prefijo, lead);
  }

  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatReadableDate(date: Date): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    const months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre'
    ];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  private startRetroactiveWindowClock(): void {
    this.currentOperationalClock.set(new Date());
    if (this.retroactiveWindowTimerId !== null) {
      return;
    }
    this.retroactiveWindowTimerId = window.setInterval(() => {
      this.currentOperationalClock.set(new Date());
    }, 60_000);
  }

  private stopRetroactiveWindowClock(): void {
    if (this.retroactiveWindowTimerId === null) {
      return;
    }
    window.clearInterval(this.retroactiveWindowTimerId);
    this.retroactiveWindowTimerId = null;
  }

  private createTimeValue(hours: number, minutes: number): Date {
    const value = new Date();
    value.setHours(hours, minutes, 0, 0);
    return value;
  }

  private getLimaDateParts(date: Date): {
    year: number;
    month: number;
    day: number;
    hour: number;
  } {
    const values = new Map(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hourCycle: 'h23'
      })
        .formatToParts(date)
        .map((part) => [part.type, part.value])
    );
    return {
      year: Number(values.get('year')),
      month: Number(values.get('month')),
      day: Number(values.get('day')),
      hour: Number(values.get('hour'))
    };
  }

  private formatPreviousLimaDate(date: Date): string {
    const current = this.getLimaDateParts(date);
    const previousDate = new Date(Date.UTC(current.year, current.month - 1, current.day - 1, 12));
    const label = new Intl.DateTimeFormat('es-PE', {
      timeZone: 'UTC',
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(previousDate);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  private applyPresenceRealtimeEvent(event: PresenceRealtimeEvent): void {
    this.advisors.update((advisors) => {
      if (!advisors.some((advisor) => advisor.empleadoId === event.empleadoId)) {
        return advisors;
      }

      const updated = advisors.map((advisor) => {
        if (advisor.empleadoId !== event.empleadoId) {
          return advisor;
        }

        if (event.tipo === 'PRESENCE_OFFLINE' || event.tipo === 'PRESENCE_EXPIRED') {
          return {
            ...advisor,
            connected: false,
            operativo: false,
            disponibilidad: 'SIN_PRESENCIA',
            estadoSchedule: 'OFFLINE',
            lastSeen: event.lastSeen ?? event.occurredAt ?? advisor.lastSeen ?? null
          };
        }

        return {
          ...advisor,
          nombreCompleto: event.nombreCompleto || advisor.nombreCompleto,
          connected: event.online,
          disponibilidad: event.disponibilidad ?? advisor.disponibilidad ?? null,
          lastSeen: event.lastSeen ?? event.occurredAt ?? advisor.lastSeen ?? null
        };
      });

      return [...updated].sort(
        (left, right) =>
          Number(right.operativo) - Number(left.operativo) ||
          Number(right.connected) - Number(left.connected) ||
          left.nombreCompleto.localeCompare(right.nombreCompleto)
      );
    });
  }
}
