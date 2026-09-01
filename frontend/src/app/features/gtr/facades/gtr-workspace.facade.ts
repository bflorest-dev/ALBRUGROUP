import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import {
  AsesorGtrPresenceResponse,
  ConnectedUserResponse,
  PresenceService
} from '../../../core/services/presence.service';
import { BrowserSessionService } from '../../../core/services/browser-session.service';
import { CurrentUserTeamScopeService } from '../../../core/services/current-user-team-scope.service';
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
  CampoTipificacion,
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
  NumeroLlamadaResponse,
  LeadOfertaComercialRequest,
  MasivoLeadFilters,
  PageQuery,
  PlanResponse,
  PromocionComercialResponse,
  UbigeoItem
} from '../../../shared/models/preventa/preventa.models';
import { LeadCommercialDataTab } from '../../../shared/components/lead-commercial-data-tabs/lead-commercial-data-tabs.component';
import { buildTelUrl, buildWhatsAppUrl, formatLeadIdentity, normalizeUsermeta } from '../../../shared/utils/phone-link';
import { PRIORITY_CAMPAIGN_LABEL, isPriorityCampaignName } from '../../../shared/utils/priority-campaign';
import { providerLogo as resolveProviderLogo } from '../../../shared/utils/provider-logo';
import {
  AjusteJornadaRequest,
  JornadaEfectivaResponse
} from '../../../shared/models/schedule/jornada-efectiva-response';
import { ScheduleAdjustmentService } from '../../../core/services/schedule-adjustment.service';
import { LeadRealtimeService } from '../../preventa/services/lead-realtime.service';
import { EquipoOperativoResponse, PreventaLeadService } from '../../preventa/services/preventa-lead.service';
import {
  GtrHistoricosFiltersFormValue,
  GtrHistoricosStateService
} from '../services/gtr-historicos-state.service';

type VisualLeadGtr = LeadGtrResponse & { isNew?: boolean };

/** Tipo minimo aceptado por openEventHistory — compatible con LeadGtrResponse, LeadAgendadoGtrResponse y LeadVentaResponse. */
export interface EventHistoryTarget {
  id: number;
  prefijo?: string | null;
  lead?: string | null;
  usermeta?: string | null;
  tieneMultiplesRegistrosDia?: boolean | null;
  tieneRegistrosMismaCampanaDia?: boolean | null;
}
type VisualLeadAgendadoGtr = LeadAgendadoGtrResponse & { isNew?: boolean };
export type GtrSection = 'plataforma' | 'agendados' | 'historicos' | 'ranking';

type SelectOption<T> = {
  label: string;
  value: T;
};

type TipificacionSelectOption = SelectOption<string> & {
  codigo: string;
  descripcion: string;
};

type SubtipificacionSelectOption = SelectOption<string> & {
  codigo: string;
  descripcion: string;
  codigoTipificacion: string;
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

type AgendadosSortField = 'programado' | 'agendado' | 'tipificacion' | 'estado';
type GtrPlatformSortField =
  | 'lastEntryAt'
  | 'createdAt'
  | 'primeraTipificacion'
  | 'mayorTipificacion'
  | 'ultimaTipificacion'
  | 'totalAsignacionesPreventa'
  | 'totalAsignacionesHoyPreventa'
  | 'estado';
type GtrHistoricosSortField = 'lastEntryAt' | 'codigoTipificacion' | 'estado' | 'nombreAsesorAsignado';
type GtrPlatformSortDirection = 'asc' | 'desc';
type GtrHistoricosGroupMode = 'SIN_AGRUPAR' | 'PRIMERA_TIPIFICACION' | 'MAYOR_TIPIFICACION' | 'ULTIMA_TIPIFICACION' | 'ESTADO' | 'INGRESO';
type AdvisorEventGroupMode = 'SIN_AGRUPAR' | 'LEAD' | 'EVENTO' | 'DETALLE';
type AdvisorEventSortField = 'createdAt' | 'accion' | 'lead' | 'detalle';
type AdvisorEventSortDirection = 'asc' | 'desc' | null;
type AdvisorEventDisplayRow =
  | { kind: 'group'; key: string; label: string; count: number }
  | { kind: 'event'; event: EventoResponse };

type AdvisorOption = {
  empleadoId: number;
  nombreCompleto: string;
  roles: string[];
  equipoIds: number[];
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
const USERMETA_PATTERN = /^@?[A-Za-z0-9._-]+$/;
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
  private readonly currentUserTeamScopeService = inject(CurrentUserTeamScopeService);

  private static intakeIdentityValidator(control: AbstractControl): { identityRequired?: true; phoneIncomplete?: true } | null {
    const group = control as FormGroup;
    const prefijo = String(group.get('prefijo')?.value ?? '').trim();
    const lead = String(group.get('lead')?.value ?? '').trim();
    const usermeta = normalizeUsermeta(group.get('usermeta')?.value);
    const hasPhone = !!prefijo && !!lead;
    const hasPartialPhone = (!!prefijo && !lead) || (!prefijo && !!lead);

    if (hasPartialPhone && !usermeta) {
      return { phoneIncomplete: true };
    }

    return hasPhone || !!usermeta ? null : { identityRequired: true };
  }

  private static optionalIdentityValidator(control: AbstractControl): { phoneIncomplete?: true } | null {
    const group = control as FormGroup;
    const prefijoControl = group.get('prefijo');
    const leadControl = group.get('lead');
    const prefijo = String(prefijoControl?.value ?? '').trim();
    const lead = String(leadControl?.value ?? '').trim();
    const hasNumber = !!lead;
    const hasCustomPrefixOnly = !!prefijo && !lead && !!prefijoControl?.dirty && prefijo !== PERU_PHONE_PREFIX;
    if ((!prefijo && hasNumber) || hasCustomPrefixOnly) {
      return { phoneIncomplete: true };
    }
    return null;
  }
  private readonly presenceService = inject(PresenceService);
  private readonly presenceRealtimeService = inject(PresenceRealtimeService);
  private readonly historicosStateService = inject(GtrHistoricosStateService);
  private readonly realtimeSubscription = new Subscription();
  private readonly newRowTimers = new Map<number, number>();
  private attendanceRefreshId: number | null = null;
  private leadDataRefreshId: number | null = null;
  private platformRequestSeq = 0;
  private agendadosRequestSeq = 0;
  private masivosRequestSeq = 0;
  private retroactiveWindowTimerId: number | null = null;
  private started = false;
  private realtimeStarted = false;
  private initializeInFlight = false;
  private lastAttendanceStatus: EstadoAsistencia | null = null;
  private lastMasivoSearchFiltersKey: string | null = null;
  private readonly formSubscription = new Subscription();
  private readonly operationalGate = this.operationalGateService.createGate('gtr-workspace');

  readonly pageSize = 12;
  readonly historicosPageSizeOptions = [10, 20, 50];
  readonly historicosPageSize = signal(20);
  readonly today = this.formatLocalDate(new Date());
  readonly todayLabel = this.formatReadableDate(new Date());
  readonly section = signal<GtrSection>('plataforma');
  private readonly adminEquipoId = signal<number | null>(null);
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
  readonly isLoadingNumerosLlamada = signal(false);
  readonly isSavingNumeroParaLlamar = signal(false);
  readonly numerosLlamadaLoadFailed = signal(false);
  readonly isLoadingTipificationHistory = signal(false);
  readonly intakeNumberMaxLength = signal(9);
  readonly snapshotNumberMaxLength = signal(9);
  readonly snapshotPhoneEditorOpen = signal(false);
  private readonly selectedIntakeCampaignId = signal<number | null>(null);
  readonly masivoExcelResultsDialogOpen = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly intakeError = signal<string | null>(null);
  readonly rows = signal<VisualLeadGtr[]>([]);
  readonly agendadosRows = signal<VisualLeadAgendadoGtr[]>([]);
  readonly masivoRows = signal<VisualLeadGtr[]>([]);
  readonly equipos = signal<EquipoOperativoResponse[]>([]);
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
  readonly numerosLlamada = signal<NumeroLlamadaResponse[]>([]);
  readonly selectedNumeroLlamada = signal<NumeroLlamadaResponse | null>(null);
  readonly editingNumeroParaLlamar = signal(false);
  readonly numeroParaLlamarDraft = signal('');
  readonly platformGroupingMode = signal<LeadGtrGroupMode>('SIN_AGRUPAR');
  readonly platformSelectedGroup = signal<LeadGtrGroupItemResponse | null>(null);
  readonly platformSortField = signal<GtrPlatformSortField>('lastEntryAt');
  readonly platformSortDirection = signal<GtrPlatformSortDirection>('desc');
  readonly platformGroups = signal<LeadGtrGroupsResponse>({
    asesores: [],
    campanas: [],
    estados: [],
    primerasTipificaciones: [],
    mayoresTipificaciones: [],
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
    mayoresTipificaciones: [],
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
  readonly agendadosSortDirection = signal<'asc' | 'desc'>('desc');
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
  readonly selectedSubtipificacionCode = signal('');
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
  readonly selectedMasivoTipificacionCodes = signal<Set<string>>(new Set());
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
  readonly advisorEventsSearch = signal('');
  readonly advisorEventsGroupMode = signal<AdvisorEventGroupMode>('SIN_AGRUPAR');
  readonly advisorEventsSortField = signal<AdvisorEventSortField | null>(null);
  readonly advisorEventsSortDirection = signal<AdvisorEventSortDirection>(null);
  readonly isLoadingAdvisorEvents = signal(false);
  readonly pendingReassignment = signal<PendingReassignment | null>(null);
  readonly pendingTakeover = signal<PendingTakeover | null>(null);
  readonly advisorsPanelOpen = signal(false);
  // --- Ampliacion de horario (modal sobre una card de asesor) ---
  readonly extensionTarget = signal<AdvisorOption | null>(null);
  readonly extensionJornada = signal<JornadaEfectivaResponse | null>(null);
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
  readonly advisorEventsGroupOptions: Array<{ label: string; value: AdvisorEventGroupMode }> = [
    { label: 'Sin agrupar', value: 'SIN_AGRUPAR' },
    { label: 'Lead', value: 'LEAD' },
    { label: 'Evento', value: 'EVENTO' },
    { label: 'Detalle', value: 'DETALLE' }
  ];
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
  /** Lista visible del panel GTR: oculta OJT salvo que este operativo conectado o tenga leads abandonados. */
  readonly advisorsPanelView = computed<AdvisorView[]>(() =>
    this.advisorsView().filter((advisor) =>
      !this.isOjtAdvisor(advisor) || (advisor.connected && advisor.operativo) || advisor.esAbandonador
    )
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
    prefijo: [PERU_PHONE_PREFIX, [Validators.pattern(/^\+\d{1,3}$/)]],
    lead: ['', [Validators.pattern(PERU_LEAD_PATTERN)]],
    usermeta: ['', [Validators.pattern(USERMETA_PATTERN)]],
    idCampana: [null as number | null],
    base: [null as BaseLead | null, [Validators.required]]
  }, { validators: GtrWorkspaceFacade.intakeIdentityValidator });
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
    prefijo: [PERU_PHONE_PREFIX, [Validators.pattern(/^\+\d{1,3}$/)]],
    lead: ['', [Validators.pattern(PERU_LEAD_PATTERN)]],
    usermeta: ['', [Validators.pattern(USERMETA_PATTERN)]],
    numeroDocumentoTitularServicio: ['', [Validators.maxLength(11)]],
    direccion: ['']
  }, { validators: GtrWorkspaceFacade.optionalIdentityValidator });

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
    latitud: [null as number | string | null, [Validators.required]],
    longitud: [null as number | string | null, [Validators.required]],
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
    idEquipo: [0],
    campoTipificacion: ['ULTIMA' as CampoTipificacion],
    tipificaciones: [[] as string[]],
    subtipificaciones: [[] as string[]],
    fechaDesde: [''],
    fechaHasta: ['']
  });

  readonly etapaOptions: SelectOption<Etapa | ''>[] = [
    { label: 'Todas las etapas', value: '' },
    { label: 'Preventa', value: 'PREVENTA' },
    { label: 'Venta', value: 'VENTA' },
    { label: 'Postventa', value: 'POSTVENTA' }
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
  readonly subtipificacionesGestionGtr = computed(() =>
    this.subtipificaciones().map((subtipificacion) => ({
      ...subtipificacion,
      disabled: this.isRetornoVentaPreventaManualBlock(this.selectedTipificacionCode(), subtipificacion.codigo)
    }))
  );
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
  readonly selectedSubtipificacion = computed(() =>
    this.subtipificaciones().find((sub) => sub.codigo === this.selectedSubtipificacionCode()) ?? null
  );
  readonly requiresScheduledTime = computed(
    () => this.selectedSubtipificacion()?.comportamientos?.includes('REQUIERE_HORA_PROGRAMADA') ?? false
  );
  readonly requiresVentaCompleta = computed(
    () => this.selectedSubtipificacion()?.comportamientos?.includes('ES_CIERRE_PREVENTA') ?? false
  );
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
  readonly advisorEventDisplayRows = computed<AdvisorEventDisplayRow[]>(() => {
    const query = this.normalizeAdvisorEventText(this.advisorEventsSearch());
    const sortField = this.advisorEventsSortField();
    const sortDirection = this.advisorEventsSortDirection();
    const groupMode = this.advisorEventsGroupMode();

    let rows = this.advisorEventRows().filter((evento) => {
      if (!query) {
        return true;
      }
      return this.advisorEventSearchText(evento).includes(query);
    });

    if (sortField && sortDirection) {
      const factor = sortDirection === 'asc' ? 1 : -1;
      rows = [...rows].sort((left, right) => this.compareAdvisorEventRows(left, right, sortField) * factor);
    }

    if (groupMode === 'SIN_AGRUPAR') {
      return rows.map((event) => ({ kind: 'event', event }));
    }

    const grouped = new Map<string, { label: string; rows: EventoResponse[] }>();
    for (const evento of rows) {
      const label = this.advisorEventGroupLabel(evento, groupMode);
      const key = this.normalizeAdvisorEventText(label);
      const group = grouped.get(key) ?? { label, rows: [] };
      group.rows.push(evento);
      grouped.set(key, group);
    }

    return [...grouped.entries()].flatMap(([key, group]) => [
      { kind: 'group' as const, key, label: group.label, count: group.rows.length },
      ...group.rows.map((event) => ({ kind: 'event' as const, event }))
    ]);
  });
  readonly advisorEventResultCount = computed(() =>
    this.advisorEventDisplayRows().filter((row) => row.kind === 'event').length
  );
  readonly isAdvisorEventsOrganizationDefault = computed(() =>
    !this.advisorEventsSearch().trim() &&
    this.advisorEventsGroupMode() === 'SIN_AGRUPAR' &&
    this.advisorEventsSortField() === null &&
    this.advisorEventsSortDirection() === null
  );
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
  intakeIdentityMessage(): string | null {
    if (!this.intakeForm.touched && !this.intakeForm.dirty) {
      return null;
    }
    const errors = this.intakeForm.errors;
    if (errors?.['phoneIncomplete']) {
      return 'Completa prefijo y numero, o registra el usuario WhatsApp.';
    }
    if (errors?.['identityRequired']) {
      return 'Ingresa un telefono completo o un usuario WhatsApp.';
    }
    if (this.intakeForm.controls.usermeta.invalid) {
      return 'El usuario WhatsApp solo puede usar letras, numeros, punto, guion y guion bajo.';
    }
    return null;
  }
  readonly intakeCampaignPlaceholder = computed(() => {
    const selectedId = this.selectedIntakeCampaignId();
    if (selectedId === null) {
      return 'Sin campaña';
    }

    return this.campanas().find((campana) => Number(campana.id) === selectedId)?.nombre ?? 'Campaña seleccionada';
  });

  // El backend es la única fuente del orden: ordena y pagina por el criterio activo (agendado o
  // fecha-hora de la cita). No se reordena en cliente para no descuadrar la paginación entre páginas.
  readonly agendadosView = computed<VisualLeadAgendadoGtr[]>(() => this.agendadosRows());
  readonly availableSubtipificaciones = computed(() => {
    const hasActiveFilter = this.subtipificacionFilter().trim().length > 0;
    if (hasActiveFilter) {
      return this.catalogoSubtipificaciones();
    }

    const selected = this.selectedMasivoTipificacionCodes();
    if (!selected.size) {
      return [];
    }
    return this.catalogoSubtipificaciones().filter((option) => selected.has(option.codigoTipificacion));
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
    { label: 'Campaña', value: 'CAMPANA' },
    { label: 'Primera tipificación', value: 'PRIMERA_TIPIFICACION' },
    { label: 'Mayor tipificación', value: 'MAYOR_TIPIFICACION' },
    { label: 'Última tipificación', value: 'ULTIMA_TIPIFICACION' },
    { label: 'Estado', value: 'ESTADO' },
    { label: 'Asesor', value: 'ASESOR' }
  ];
  readonly platformSortOptions: Array<{ label: string; value: GtrPlatformSortField }> = [
    { label: 'Última gestión', value: 'lastEntryAt' },
    { label: 'Ingreso', value: 'createdAt' },
    { label: 'Primera tipificación', value: 'primeraTipificacion' },
    { label: 'Mayor tipificación', value: 'mayorTipificacion' },
    { label: 'Última tipificación', value: 'ultimaTipificacion' },
    { label: 'Asignaciones hoy', value: 'totalAsignacionesHoyPreventa' },
    { label: 'Estado', value: 'estado' }
  ];
  readonly platformSortDirectionOptions = computed<Array<{ label: string; value: GtrPlatformSortDirection }>>(() =>
    this.platformSortField() === 'lastEntryAt' || this.platformSortField() === 'createdAt'
      ? [
          { label: 'Más antiguos', value: 'asc' },
          { label: 'Más recientes', value: 'desc' }
        ]
      : this.platformSortField() === 'totalAsignacionesHoyPreventa'
        ? [
            { label: 'Menos asignaciones', value: 'asc' },
            { label: 'Más asignaciones', value: 'desc' }
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
      case 'MAYOR_TIPIFICACION':
        return groups.mayoresTipificaciones;
      case 'ULTIMA_TIPIFICACION':
        return groups.ultimasTipificaciones;
      default:
        return [];
    }
  });
  readonly isPlatformTipificationGrouping = computed(() =>
    this.isPlatformTipificationGroupMode(this.platformGroupingMode())
  );
  readonly platformTipificationGroupOptions = computed<LeadGtrGroupItemResponse[]>(() => {
    if (!this.isPlatformTipificationGrouping()) {
      return [];
    }

    const quantities = new Map<string, number>();
    const labels = new Map<string, string>();
    let sinTipificar = 0;
    for (const group of this.platformActiveGroupOptions()) {
      if (group.sinValor) {
        sinTipificar += group.cantidad;
        continue;
      }
      const codigo = group.codigoTipificacion?.trim();
      if (!codigo) {
        continue;
      }
      quantities.set(codigo, (quantities.get(codigo) ?? 0) + group.cantidad);
      labels.set(codigo, codigo);
    }

    const options: LeadGtrGroupItemResponse[] = [...quantities.entries()].map(([codigo, cantidad]) => ({
      idGrupo: null,
      codigoTipificacion: codigo,
      codigoSubtipificacion: null,
      etiqueta: labels.get(codigo) ?? codigo,
      cantidad,
      sinValor: false
    }));
    if (sinTipificar > 0) {
      options.push({
        idGrupo: null,
        codigoTipificacion: null,
        codigoSubtipificacion: null,
        etiqueta: 'Sin tipificar',
        cantidad: sinTipificar,
        sinValor: true
      });
    }
    return this.sortPlatformGroupOptions(options);
  });
  readonly platformSelectedTipificationGroup = computed<LeadGtrGroupItemResponse | null>(() => {
    const selected = this.platformSelectedGroup();
    if (!selected || !this.isPlatformTipificationGrouping()) {
      return null;
    }
    return this.platformTipificationGroupOptions().find((option) =>
      Boolean(option.sinValor) === Boolean(selected.sinValor)
      && (option.codigoTipificacion ?? null) === (selected.codigoTipificacion ?? null)
    ) ?? null;
  });
  readonly platformSubtipificationGroupOptions = computed<LeadGtrGroupItemResponse[]>(() => {
    const selected = this.platformSelectedTipificationGroup();
    if (!selected || selected.sinValor || !selected.codigoTipificacion) {
      return [];
    }
    return this.sortPlatformGroupOptions(
      this.platformActiveGroupOptions().filter((group) =>
        !group.sinValor
        && group.codigoTipificacion === selected.codigoTipificacion
        && !!group.codigoSubtipificacion
      )
    );
  });
  readonly platformSelectedSubtipificationGroup = computed<LeadGtrGroupItemResponse | null>(() => {
    const selected = this.platformSelectedGroup();
    if (!selected?.codigoSubtipificacion || !this.isPlatformTipificationGrouping()) {
      return null;
    }
    return this.platformSubtipificationGroupOptions().find((option) =>
      option.codigoTipificacion === selected.codigoTipificacion
      && option.codigoSubtipificacion === selected.codigoSubtipificacion
    ) ?? null;
  });
  readonly isPlatformOrganizationDefault = computed(() =>
    this.platformGroupingMode() === 'SIN_AGRUPAR' &&
    this.platformSelectedGroup() === null &&
    this.platformSortField() === 'lastEntryAt' &&
    this.platformSortDirection() === 'desc'
  );
  readonly historicosGroupingModeOptions = computed<Array<{ label: string; value: GtrHistoricosGroupMode }>>(() => [
    { label: 'Sin agrupar', value: 'SIN_AGRUPAR' },
    { label: this.historicosTipificacionColumnLabel(), value: this.historicosTipificacionGroupMode() },
    { label: 'Estado', value: 'ESTADO' },
    { label: 'Ingreso', value: 'INGRESO' }
  ]);
  readonly historicosCampoTipificacionOptions: SelectOption<CampoTipificacion>[] = [
    { label: 'Mayor', value: 'MAYOR' },
    { label: 'Última', value: 'ULTIMA' },
    { label: 'Primera', value: 'PRIMERA' }
  ];
  readonly historicosEquipoOptions = computed<SelectOption<number>[]>(() =>
    this.equipos()
      .filter((equipo) => equipo.activo)
      .filter((equipo) => this.adminEquipoId() === null || equipo.id === this.adminEquipoId())
      .map((equipo) => ({ label: equipo.nombre, value: equipo.id }))
  );
  readonly showHistoricosEquipoSelector = computed(() => this.adminEquipoId() === null && this.historicosEquipoOptions().length > 1);
  readonly historicosSortOptions = computed<Array<{ label: string; value: GtrHistoricosSortField }>>(() => [
    { label: 'Ingreso', value: 'lastEntryAt' },
    { label: this.historicosTipificacionColumnLabel(), value: 'codigoTipificacion' },
    { label: 'Estado', value: 'estado' },
    { label: 'Asesor', value: 'nombreAsesorAsignado' }
  ]);
  readonly historicosSortDirectionOptions = computed<Array<{ label: string; value: GtrPlatformSortDirection }>>(() => {
    if (this.historicosSortField() === 'lastEntryAt') {
      return [
        { label: 'Más antiguos', value: 'asc' },
        { label: 'Más recientes', value: 'desc' }
      ];
    }
    if (this.historicosSortField() === 'nombreAsesorAsignado') {
      return [
        { label: 'A-Z', value: 'asc' },
        { label: 'Z-A', value: 'desc' }
      ];
    }
    return [
      { label: 'Orden natural', value: 'asc' },
      { label: 'Orden inverso', value: 'desc' }
    ];
  });
  readonly historicosActiveGroupOptions = computed<LeadGtrGroupItemResponse[]>(() => {
    const groups = this.historicosGroups();
    switch (this.historicosGroupingMode()) {
      case 'ESTADO':
        return groups.estados;
      case 'INGRESO':
        return groups.ingresos ?? [];
      case 'PRIMERA_TIPIFICACION':
        return groups.primerasTipificaciones;
      case 'MAYOR_TIPIFICACION':
        return groups.mayoresTipificaciones;
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
  readonly assignmentTargetEquipoId = computed(() => {
    const lead = this.activeAssignmentLead();
    if (lead) {
      return this.resolveLeadEquipoId(lead);
    }
    const equipos = new Set(this.selectedRowsForCurrentSection().map((row) => this.resolveLeadEquipoId(row)));
    return equipos.size === 1 ? [...equipos][0] : null;
  });
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
      .filter((advisor) => {
        const idEquipo = this.assignmentTargetEquipoId();
        return idEquipo !== null && advisor.equipoIds.includes(idEquipo);
      })
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
    return this.availableAssignmentAdvisors().find((advisor) => advisor.empleadoId === advisorId) ?? null;
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
  readonly currentNumeroLlamada = computed(() =>
    this.selectedNumeroLlamada() ?? this.numerosLlamada()[0] ?? null
  );

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    this.restoreHistoricosState();
    this.updateIntakeLeadValidation(this.intakeForm.controls.prefijo.value);
    this.formSubscription.add(
      this.intakeForm.controls.prefijo.valueChanges.subscribe((prefijo) => {
        this.updateIntakeLeadValidation(prefijo);
      })
    );
    this.formSubscription.add(
      this.snapshotForm.controls.prefijo.valueChanges.subscribe((prefijo) => {
        this.updateSnapshotLeadValidation(prefijo);
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
      })
    );
    this.formSubscription.add(
      this.tipificacionForm.controls.codigoSubtipificacion.valueChanges.subscribe((codigo) => {
        this.selectedSubtipificacionCode.set(codigo ?? '');
        if (!this.requiresScheduledTime()) {
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

      // Solo limpiamos con un OFFLINE CONFIRMADO por el backend; un OFFLINE "no confirmado" (estado
      // aun sin cargar / re-login) es "verificando" y no debe vaciar la vista.
      if (this.operationalGateService.isConfirmedOffline()) {
        this.clearOperationalData();
        this.lastAttendanceStatus = status;
        return;
      }

      // startRealtime()/initialize()/reconcile() leen Y escriben signals. Si se invocan dentro del
      // tracking del effect, este pasa a depender de esas signals y su propia escritura lo re-dispara:
      // bucle de change detection (NG0103) que satura la vista. Golpea sobre todo al ADMIN, cuyo estado
      // de asistencia nunca es 'ONLINE' (rol ALWAYS_OPERATIONAL), asi que la rama de reconcile siempre
      // se cumple. Con untracked el effect solo reacciona a los cambios de estado de asistencia.
      // (Ver frontend/primeng-loop-fix.md, Caso 2.)
      if (this.canDisplayOperationalData()) {
        untracked(() => this.startRealtime());
      }

      if (this.operationalGate.canActivateOperationalData() && !this.startedInitialLoad()) {
        untracked(() => void this.initialize());
      } else if (this.operationalGate.canActivateOperationalData() && this.lastAttendanceStatus !== 'ONLINE') {
        untracked(() => void this.reconcile());
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

  setAdminEquipoId(idEquipo: number | null): void {
    if (this.adminEquipoId() === idEquipo) {
      return;
    }
    if (this.section() === 'historicos') {
      this.saveHistoricosState();
    }
    this.adminEquipoId.set(idEquipo);
    if (idEquipo !== null) {
      this.masivoFiltersForm.controls.idEquipo.setValue(idEquipo);
    }
    this.selectedIds.set(new Set());
    this.platformSelectedGroup.set(null);
    this.historicosSelectedGroup.set(null);
    if (this.started) {
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
    this.stopLeadDataRefresh();
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
      await this.runInitialLoad('equipos', () => this.refreshEquipos(), errors);
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
    const leadNumber = (formValue.lead ?? '').trim();
    const usermeta = normalizeUsermeta(formValue.usermeta);
    const hasPhone = !!leadNumber;
    const request: LeadIntakeRequest = {
      prefijo: hasPhone ? formValue.prefijo : null,
      lead: hasPhone ? leadNumber : null,
      usermeta: usermeta || null,
      idCampana: formValue.idCampana || null,
      base: formValue.base as BaseLead
    };
    const adminEquipoId = this.adminEquipoId();
    if (!skipLookupConfirmation) {
      this.clearMessages();
      this.intakeError.set(null);
      try {
        const lookupValue = request.lead || request.usermeta || '';
        const lookup = await firstValueFrom(this.preventaService.buscarContextoLeadGtr(lookupValue, adminEquipoId));
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
        if (adminEquipoId !== null) {
          await firstValueFrom(this.preventaService.registrarIngresoLeadAdminRetroactivo(adminEquipoId, retroactiveRequest));
        } else {
          await firstValueFrom(this.preventaService.registrarIngresoLeadRetroactivo(retroactiveRequest));
        }
      } else {
        if (adminEquipoId !== null) {
          await firstValueFrom(this.preventaService.registrarIngresoLeadAdmin(adminEquipoId, request));
        } else {
          await firstValueFrom(this.preventaService.registrarIngresoLead(request));
        }
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
        this.masivoSearched() && this.section() !== 'historicos' ? this.refreshMasivos() : Promise.resolve()
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
    this.resetNumerosLlamadaState();
    this.snapshotPhoneEditorOpen.set(false);
    this.snapshotForm.reset({
      idLead: row.id,
      prefijo: row.prefijo ?? PERU_PHONE_PREFIX,
      lead: row.lead ?? '',
      usermeta: row.usermeta ?? '',
      numeroDocumentoTitularServicio: row.numeroDocumentoTitularServicio ?? '',
      direccion: row.direccionSnapshot ?? ''
    });
    this.applySnapshotIdentityDisabledState(row);
    void this.loadNumerosLlamada(row.id);
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
    const normalized = this.normalizePhoneInput(value);
    if (this.intakeForm.controls.lead.value !== normalized) {
      this.intakeForm.controls.lead.setValue(normalized);
    }
  }

  normalizeIntakeUsermeta(value: string): void {
    const normalized = normalizeUsermeta(value);
    if (this.intakeForm.controls.usermeta.value !== normalized) {
      this.intakeForm.controls.usermeta.setValue(normalized);
    }
  }

  normalizeSnapshotLeadNumber(value: string): void {
    const normalized = this.normalizePhoneInput(value);
    if (this.snapshotForm.controls.lead.value !== normalized) {
      this.snapshotForm.controls.lead.setValue(normalized);
    }
  }

  normalizeSnapshotUsermeta(value: string): void {
    const normalized = normalizeUsermeta(value);
    if (this.snapshotForm.controls.usermeta.value !== normalized) {
      this.snapshotForm.controls.usermeta.setValue(normalized);
    }
  }

  normalizeSnapshotDocumentNumber(value: string): void {
    const normalized = value.replace(/\D/g, '').slice(0, 11);
    if (this.snapshotForm.controls.numeroDocumentoTitularServicio.value !== normalized) {
      this.snapshotForm.controls.numeroDocumentoTitularServicio.setValue(normalized);
    }
  }

  intakeUsermetaLabel(value?: string | null): string {
    const meta = normalizeUsermeta(value);
    return meta ? `@${meta}` : '-';
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
      await this.ensureTypifyCatalogs(idLead);
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
    if (this.isRetornoVentaPreventaManualBlock(raw.codigoTipificacion, raw.codigoSubtipificacion)) {
      this.errorMessage.set('Esta opcion se marca automaticamente cuando Venta devuelve el lead.');
      return;
    }
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

  openWhatsAppChat(row: Pick<LeadGtrResponse, 'prefijo' | 'lead' | 'usermeta'>): void {
    const url = this.whatsAppUrl(row.prefijo, row.lead, row.usermeta);
    if (!url) {
      this.errorMessage.set('El lead no tiene telefono ni usermeta para abrir WhatsApp.');
      return;
    }

    this.document.defaultView?.open(url, '_blank', 'noopener,noreferrer');
  }

  openDialer(row: Pick<LeadGtrResponse, 'prefijo' | 'lead'>): void {
    if (!this.ensureCanMutate()) {
      return;
    }

    const numeroElegido = this.currentNumeroLlamada()?.numero ?? row.lead;
    const url = this.telUrl(row.prefijo, numeroElegido);
    if (!url) {
      this.errorMessage.set('El lead no tiene un numero valido para iniciar la llamada.');
      return;
    }

    this.browserSessionService.allowExternalNavigation();
    this.document.defaultView?.location.assign(url);
  }

  openDialerWithNumero(row: Pick<LeadGtrResponse, 'prefijo' | 'lead'>, numero: NumeroLlamadaResponse): void {
    this.selectedNumeroLlamada.set(numero);
    this.openDialer(row);
  }

  showCallError(message: string): void {
    this.errorMessage.set(message);
  }

  canEditNumeroLlamada(numero: NumeroLlamadaResponse): boolean {
    return numero.tipo === 'NUMERO_PARA_LLAMAR';
  }

  hasNumeroParaLlamarOption(): boolean {
    return this.numerosLlamada().some((numero) => numero.tipo === 'NUMERO_PARA_LLAMAR');
  }

  startNumeroParaLlamarEdit(numero: NumeroLlamadaResponse): void {
    if (!this.canEditNumeroLlamada(numero)) {
      return;
    }
    this.numeroParaLlamarDraft.set(numero.numero);
    this.editingNumeroParaLlamar.set(true);
  }

  startEmptyNumeroParaLlamarEdit(): void {
    this.numeroParaLlamarDraft.set('');
    this.editingNumeroParaLlamar.set(true);
  }

  normalizeNumeroParaLlamarDraft(value: string): void {
    this.numeroParaLlamarDraft.set(this.normalizePhoneInput(value));
  }

  cancelNumeroParaLlamarEdit(): void {
    this.editingNumeroParaLlamar.set(false);
    this.numeroParaLlamarDraft.set('');
  }

  async saveNumeroParaLlamar(): Promise<void> {
    const lead = this.selectedSnapshotLead();
    if (!lead) {
      this.errorMessage.set('Selecciona un lead antes de editar el numero para llamar.');
      return;
    }
    const numeroParaLlamar = this.normalizePhoneInput(this.numeroParaLlamarDraft());
    if (!/^9\d{8}$/.test(numeroParaLlamar)) {
      this.errorMessage.set('El numero para llamar debe tener 9 digitos y empezar en 9.');
      return;
    }

    this.isSavingNumeroParaLlamar.set(true);
    this.clearMessages();
    try {
      await firstValueFrom(this.preventaService.actualizarNumeroParaLlamar(lead.id, { numeroParaLlamar }));
      await this.loadNumerosLlamada(lead.id, numeroParaLlamar);
      this.editingNumeroParaLlamar.set(false);
      this.numeroParaLlamarDraft.set('');
      this.successMessage.set('Numero para llamar actualizado.');
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo actualizar el numero para llamar.'));
    } finally {
      this.isSavingNumeroParaLlamar.set(false);
    }
  }

  private async loadNumerosLlamada(idLead: number, preferNumero?: string): Promise<void> {
    this.isLoadingNumerosLlamada.set(true);
    this.numerosLlamadaLoadFailed.set(false);
    try {
      const numeros = await firstValueFrom(this.preventaService.listarNumerosLlamada(idLead));
      this.numerosLlamada.set(numeros);
      const selected = preferNumero
        ? numeros.find((numero) => numero.numero === preferNumero)
        : null;
      this.selectedNumeroLlamada.set(selected ?? numeros[0] ?? null);
    } catch (error) {
      this.numerosLlamada.set([]);
      this.selectedNumeroLlamada.set(null);
      this.numerosLlamadaLoadFailed.set(true);
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar los numeros de llamada.'));
    } finally {
      this.isLoadingNumerosLlamada.set(false);
    }
  }

  private resetNumerosLlamadaState(): void {
    this.numerosLlamada.set([]);
    this.selectedNumeroLlamada.set(null);
    this.editingNumeroParaLlamar.set(false);
    this.numeroParaLlamarDraft.set('');
    this.numerosLlamadaLoadFailed.set(false);
    this.isLoadingNumerosLlamada.set(false);
    this.isSavingNumeroParaLlamar.set(false);
  }

  openAssignment(row?: LeadGtrResponse): void {
    if (!this.ensureCanMutate()) {
      return;
    }
    if (!row && !this.ensureSingleTeamSelection()) {
      return;
    }
    if (row && !this.resolveLeadEquipoId(row)) {
      this.errorMessage.set('No se pudo identificar el equipo del lead.');
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
    this.resetAdvisorEventsOrganization();
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
    this.resetAdvisorEventsOrganization();
    this.activeDialog.set(null);
  }

  setAdvisorEventsSearch(value: string): void {
    this.advisorEventsSearch.set(value ?? '');
  }

  setAdvisorEventsGroupMode(value: AdvisorEventGroupMode): void {
    this.advisorEventsGroupMode.set(value);
  }

  toggleAdvisorEventsSort(field: AdvisorEventSortField): void {
    const currentField = this.advisorEventsSortField();
    const currentDirection = this.advisorEventsSortDirection();

    if (currentField !== field || currentDirection === null) {
      this.advisorEventsSortField.set(field);
      this.advisorEventsSortDirection.set('asc');
      return;
    }

    if (currentDirection === 'asc') {
      this.advisorEventsSortDirection.set('desc');
      return;
    }

    this.advisorEventsSortField.set(null);
    this.advisorEventsSortDirection.set(null);
  }

  advisorEventsSortIcon(field: AdvisorEventSortField): string {
    if (this.advisorEventsSortField() !== field || this.advisorEventsSortDirection() === null) {
      return 'pi pi-sort-alt';
    }
    return this.advisorEventsSortDirection() === 'asc' ? 'pi pi-sort-amount-up-alt' : 'pi pi-sort-amount-down';
  }

  clearAdvisorEventsOrganization(): void {
    this.resetAdvisorEventsOrganization();
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
      this.errorMessage.set('Ingresa el telefono o usermeta del lead a buscar.');
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
      const idEquipo = await this.resolveSearchEquipoId();
      const page = await firstValueFrom(
        this.preventaService.buscarLeadGtr(value, {
          pageNumber: this.searchPageNumber(),
          pageSize: this.pageSize,
          sortBy: 'lastEntryAt',
          direction: 'desc'
        }, idEquipo)
      );
      this.searchResults.set(page.content);
      this.searchTotalElements.set(page.totalElements);
      this.searchTotalPages.set(page.totalPages);
      this.searchExecuted.set(true);
      if (page.content.length === 0 && this.searchPageNumber() === 0) {
        const lookup = await firstValueFrom(this.preventaService.buscarContextoLeadGtr(value, idEquipo));
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

  private async resolveSearchEquipoId(): Promise<number | null> {
    const adminEquipoId = this.adminEquipoId();
    if (adminEquipoId !== null) {
      return adminEquipoId;
    }
    return this.currentUserTeamScopeService.getPrimaryEquipoId();
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
    this.resetNumerosLlamadaState();
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
    this.snapshotPhoneEditorOpen.set(false);
    this.enableSnapshotIdentityControls();
    this.snapshotForm.reset({
      idLead: 0,
      prefijo: PERU_PHONE_PREFIX,
      lead: '',
      usermeta: '',
      numeroDocumentoTitularServicio: '',
      direccion: ''
    });
  }

  async saveSnapshot(): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }
    this.snapshotForm.updateValueAndValidity();
    if (this.snapshotForm.invalid) {
      this.snapshotForm.markAllAsTouched();
      this.errorMessage.set(this.snapshotIdentityErrorMessage() ?? 'Revisa los datos antes de guardar.');
      return;
    }

    const raw = this.snapshotForm.getRawValue();
    const numeroDocumentoTitularServicio = raw.numeroDocumentoTitularServicio.trim();
    const direccion = raw.direccion.trim();
    const identidadRequest = this.buildSnapshotIdentityRequest();
    const snapshotRequest = numeroDocumentoTitularServicio || direccion
      ? {
          numeroDocumentoTitularServicio: numeroDocumentoTitularServicio || null,
          direccion: direccion || null
        }
      : null;

    if (!raw.idLead || (!identidadRequest && !snapshotRequest)) {
      this.errorMessage.set('Selecciona un lead y completa identidad, documento o direccion.');
      return;
    }

    this.isSavingSnapshot.set(true);
    this.clearMessages();
    try {
      if (identidadRequest) {
        await firstValueFrom(this.preventaService.completarIdentidadLead(raw.idLead, identidadRequest));
      }
      if (snapshotRequest) {
        await firstValueFrom(this.preventaService.actualizarSnapshotsLead(raw.idLead, snapshotRequest));
      }
      this.successMessage.set(this.snapshotSuccessMessage(!!identidadRequest, !!snapshotRequest));
      this.cancelSnapshot();
      this.closeDialog();
      await this.reconcile();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo guardar la informacion del lead.'));
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
      this.successMessage.set(`Lead ${this.leadIdentity(row)} asignado a ${advisor.nombreCompleto}.`);
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

    if (!this.ensureSingleTeamSelection()) {
      return;
    }

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
    this.extensionError.set(null);
    this.activeDialog.set(null);
  }

  /**
   * Guarda las horas extra como AMPLIACION_OPERATIVA. Cada tramo (ingresar antes / quedarse mas / periodo
   * aparte) es un ajuste aditivo, asi que se envian como N llamadas secuenciales; si una falla se informa
   * cuantas se guardaron y se recarga el contexto para reflejar las que si entraron.
   */
  async submitScheduleExtension(requests: AjusteJornadaRequest[]): Promise<void> {
    if (!this.ensureCanMutate()) return;
    const advisor = this.extensionTarget();
    if (!advisor || requests.length === 0) return;
    this.isSavingExtension.set(true);
    this.extensionError.set(null);
    let guardados = 0;
    try {
      for (const request of requests) {
        await firstValueFrom(this.scheduleAdjustmentService.registrarGtr(advisor.empleadoId, request));
        guardados++;
      }
      const detalle = guardados === 1 ? '1 tramo' : `${guardados} tramos`;
      this.successMessage.set(`Jornada de ${advisor.nombreCompleto} actualizada (${detalle}).`);
      this.closeScheduleExtension();
      await this.refreshAdvisors();
    } catch (error) {
      const base = this.getErrorMessage(error, 'No se pudo guardar el ajuste de jornada.');
      this.extensionError.set(
        guardados > 0 ? `Se registraron ${guardados} de ${requests.length} tramos. ${base}` : base
      );
      // Recargar para reflejar los tramos que si se guardaron antes del error.
      await this.loadExtensionContext(advisor.empleadoId);
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

  async refreshEquipos(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const equipos = await firstValueFrom(this.preventaService.listarMisEquipos());
    this.equipos.set(equipos.filter((equipo) => equipo.activo));
    const options = this.historicosEquipoOptions();
    const current = Number(this.masivoFiltersForm.controls.idEquipo.value);
    const adminEquipoId = this.adminEquipoId();
    if (adminEquipoId !== null && current !== adminEquipoId) {
      this.masivoFiltersForm.controls.idEquipo.setValue(adminEquipoId);
      return;
    }
    if (options.length === 1 && current !== options[0].value) {
      this.masivoFiltersForm.controls.idEquipo.setValue(options[0].value);
    }
    if (options.length > 1 && current > 0 && !options.some((option) => option.value === current)) {
      this.masivoFiltersForm.controls.idEquipo.setValue(0);
    }
  }

  async refreshAdvisors(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    if (!this.historicosEquipoOptions().length) {
      await this.refreshEquipos();
    }

    let activeUsers: UsuarioResponse[] = [];
    try {
      activeUsers = this.mergeUsersWithTeams(
        await Promise.all(
          this.historicosEquipoOptions().map((equipo) =>
            firstValueFrom(this.preventaService.listarAsesoresPreventaPorEquipo(equipo.value))
          )
        )
      );
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

  private mergeUsersWithTeams(lists: UsuarioResponse[][]): UsuarioResponse[] {
    const porId = new Map<number, UsuarioResponse>();
    for (const user of lists.flat()) {
      const current = porId.get(user.empleadoId);
      if (!current) {
        porId.set(user.empleadoId, { ...user, equipoIds: [...(user.equipoIds ?? [])] });
        continue;
      }
      porId.set(user.empleadoId, {
        ...current,
        roles: [...new Set([...(current.roles ?? []), ...(user.roles ?? [])])],
        equipoIds: [...new Set([...(current.equipoIds ?? []), ...(user.equipoIds ?? [])])]
      });
    }
    return [...porId.values()];
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
          equipoIds: user.equipoIds ?? [],
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

  async selectPlatformTipificationGroup(group: LeadGtrGroupItemResponse | null | undefined): Promise<void> {
    this.platformSelectedGroup.set(group ? { ...group, codigoSubtipificacion: null } : null);
    this.pageNumber.set(0);
    await this.refreshPage(false);
  }

  async selectPlatformSubtipificationGroup(group: LeadGtrGroupItemResponse | null | undefined): Promise<void> {
    if (group) {
      this.platformSelectedGroup.set(group);
    } else {
      const selected = this.platformSelectedTipificationGroup();
      this.platformSelectedGroup.set(selected ? { ...selected, codigoSubtipificacion: null } : null);
    }
    this.pageNumber.set(0);
    await this.refreshPage(false);
  }

  async setPlatformSortField(field: GtrPlatformSortField): Promise<void> {
    if (!field || field === this.platformSortField()) {
      return;
    }
    this.platformSortField.set(field);
    this.platformSortDirection.set(this.defaultPlatformSortDirection(field));
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

  async changePlatformColumnSort(field: GtrPlatformSortField): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }

    const defaultDirection = this.defaultPlatformSortDirection(field);

    if (this.platformSortField() !== field) {
      this.platformSortField.set(field);
      this.platformSortDirection.set(defaultDirection);
    } else if (this.platformSortDirection() === defaultDirection) {
      this.platformSortDirection.set(defaultDirection === 'asc' ? 'desc' : 'asc');
    } else {
      this.platformSortField.set('lastEntryAt');
      this.platformSortDirection.set('desc');
    }

    this.pageNumber.set(0);
    await this.refreshPage(false);
  }

  platformSortActive(field: GtrPlatformSortField): boolean {
    return this.platformSortField() === field;
  }

  platformSortIcon(field: GtrPlatformSortField): string {
    if (this.platformSortField() !== field) {
      return 'pi pi-sort-alt';
    }
    return this.platformSortDirection() === 'asc' ? 'pi pi-sort-amount-up-alt' : 'pi pi-sort-amount-down';
  }

  platformSortLabel(field: GtrPlatformSortField, label: string): string {
    if (this.platformSortField() !== field) {
      return `Ordenar por ${label}`;
    }
    if (this.platformSortDirection() === this.defaultPlatformSortDirection(field)) {
      return `Orden activo por ${label}. Presiona para invertir.`;
    }
    return `Orden activo por ${label}. Presiona para volver al orden inicial.`;
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

  syncHistoricosCampoTipificacion(): void {
    const mode = this.historicosGroupingMode();
    if (
      mode !== 'PRIMERA_TIPIFICACION' &&
      mode !== 'MAYOR_TIPIFICACION' &&
      mode !== 'ULTIMA_TIPIFICACION'
    ) {
      return;
    }
    this.historicosGroupingMode.set(this.historicosTipificacionGroupMode());
    this.historicosSelectedGroup.set(null);
  }

  canSearchHistoricos(): boolean {
    return this.canDisplayOperationalData()
      && (!this.showHistoricosEquipoSelector() || Number(this.masivoFiltersForm.controls.idEquipo.value) > 0);
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
    this.historicosSortDirection.set(this.defaultHistoricosSortDirection(field));
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

  async changeHistoricosColumnSort(field: GtrHistoricosSortField): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }

    const defaultDirection = this.defaultHistoricosSortDirection(field);

    if (this.historicosSortField() !== field) {
      this.historicosSortField.set(field);
      this.historicosSortDirection.set(defaultDirection);
    } else if (this.historicosSortDirection() === defaultDirection) {
      this.historicosSortDirection.set(defaultDirection === 'asc' ? 'desc' : 'asc');
    } else {
      this.historicosSortField.set('lastEntryAt');
      this.historicosSortDirection.set('desc');
    }

    this.masivoPageNumber.set(0);
    if (this.masivoSearched()) {
      await this.refreshMasivos();
    }
  }

  historicosSortActive(field: GtrHistoricosSortField): boolean {
    return this.historicosSortField() === field;
  }

  historicosSortIcon(field: GtrHistoricosSortField): string {
    if (this.historicosSortField() !== field) {
      return 'pi pi-sort-alt';
    }
    return this.historicosSortDirection() === 'asc' ? 'pi pi-sort-amount-up-alt' : 'pi pi-sort-amount-down';
  }

  historicosSortLabel(field: GtrHistoricosSortField, label: string): string {
    if (this.historicosSortField() !== field) {
      return `Ordenar por ${label}`;
    }
    if (this.historicosSortDirection() === this.defaultHistoricosSortDirection(field)) {
      return `Orden activo por ${label}. Presiona para invertir.`;
    }
    return `Orden activo por ${label}. Presiona para volver al orden inicial.`;
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
    const defaultDirection = this.defaultAgendadosSortDirection(field);
    if (this.agendadosSortField() !== field) {
      this.agendadosSortField.set(field);
      this.agendadosSortDirection.set(defaultDirection);
    } else if (this.agendadosSortDirection() === defaultDirection) {
      this.agendadosSortDirection.set(defaultDirection === 'asc' ? 'desc' : 'asc');
    } else {
      this.agendadosSortField.set('programado');
      this.agendadosSortDirection.set('desc');
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

  agendadoSortLabel(field: AgendadosSortField, label: string): string {
    if (this.agendadosSortField() !== field) {
      return `Ordenar por ${label}`;
    }
    if (this.agendadosSortDirection() === this.defaultAgendadosSortDirection(field)) {
      return `Orden activo por ${label}. Presiona para invertir.`;
    }
    return `Orden activo por ${label}. Presiona para volver al orden inicial.`;
  }

  async buscarMasivos(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.errorMessage.set('Marca ONLINE para activar esta bandeja.');
      return;
    }
    if (!this.canSearchHistoricos()) {
      this.errorMessage.set('Selecciona un equipo para buscar historicos.');
      return;
    }
    this.clearMessages();
    this.masivoSearched.set(true);
    this.masivoPageNumber.set(0);
    this.selectedIds.set(new Set());
    await this.refreshHistoricosGroups();
    await this.refreshMasivos();
  }

  async changeMasivoPage(pageNumber: number, pageSize = this.historicosPageSize()): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const safePageSize = this.normalizeHistoricosPageSize(pageSize);
    const pageSizeChanged = safePageSize !== this.historicosPageSize();
    const nextPageNumber = pageSizeChanged ? 0 : pageNumber;
    if (nextPageNumber === this.masivoPageNumber() && !pageSizeChanged) {
      return;
    }
    this.historicosPageSize.set(safePageSize);
    this.masivoPageNumber.set(nextPageNumber);
    await this.refreshMasivos();
  }

  clearMasivoFilters(): void {
    if (!this.canMutateOperationalData()) {
      this.errorMessage.set('Marca ONLINE para modificar filtros operativos.');
      return;
    }
    this.masivoFiltersForm.reset({
      idEquipo: this.defaultHistoricosEquipoId(),
      campoTipificacion: 'ULTIMA',
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
      mayoresTipificaciones: [],
      ultimasTipificaciones: [],
      ingresos: []
    });
    this.selectedMasivoTipificacionCodes.set(new Set());
    this.subtipificacionFilter.set('');
    this.historicosStateService.clear();
  }

  onMasivoTipificacionesChange(): void {
    const selected = new Set(this.masivoFiltersForm.controls.tipificaciones.value);
    this.selectedMasivoTipificacionCodes.set(selected);
    if (!selected.size) {
      this.masivoFiltersForm.controls.subtipificaciones.setValue([]);
      return;
    }

    const validIds = new Set(
      this.catalogoSubtipificaciones().filter((option) => selected.has(option.codigoTipificacion)).map((option) => option.value)
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
        selectedTipificaciones.add(subtipificacion.codigoTipificacion);
      }
    }

    const nextTipificaciones = [...selectedTipificaciones];
    this.masivoFiltersForm.controls.tipificaciones.setValue(nextTipificaciones);
    this.selectedMasivoTipificacionCodes.set(new Set(nextTipificaciones));
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

  private selectedRowsForCurrentSection(): LeadGtrResponse[] {
    const selected = this.selectedIds();
    const source = this.section() === 'historicos' ? this.masivoRows() : this.rows();
    return source.filter((row) => selected.has(row.id));
  }

  private ensureSingleTeamSelection(): boolean {
    const rows = this.selectedRowsForCurrentSection();
    if (!rows.length) {
      this.errorMessage.set('Selecciona al menos un lead.');
      return false;
    }
    const equipos = new Set(rows.map((row) => this.resolveLeadEquipoId(row)));
    if (equipos.size !== 1 || equipos.has(null)) {
      this.errorMessage.set('Selecciona leads del mismo equipo para asignarlos juntos.');
      return false;
    }
    return true;
  }

  private resolveLeadEquipoId(row: Pick<LeadGtrResponse, 'idEquipo'>): number | null {
    return row.idEquipo ?? (this.defaultHistoricosEquipoId() || null);
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

  advisorShortName(value: unknown): string {
    const displayValue = this.display(value);
    if (displayValue === '-') {
      return displayValue;
    }
    return displayValue.trim().split(/\s+/).slice(0, 2).join(' ');
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

  private resetAdvisorEventsOrganization(): void {
    this.advisorEventsSearch.set('');
    this.advisorEventsGroupMode.set('SIN_AGRUPAR');
    this.advisorEventsSortField.set(null);
    this.advisorEventsSortDirection.set(null);
  }

  private advisorEventSearchText(evento: EventoResponse): string {
    return this.normalizeAdvisorEventText([
      evento.lead,
      evento.accion,
      evento.tipificacion,
      evento.subtipificacion,
      evento.comentario,
      this.eventSummary(evento)
    ].filter(Boolean).join(' '));
  }

  private advisorEventGroupLabel(evento: EventoResponse, mode: AdvisorEventGroupMode): string {
    if (mode === 'LEAD') {
      return this.display(evento.lead);
    }
    if (mode === 'EVENTO') {
      return this.display(evento.accion);
    }
    if (mode === 'DETALLE') {
      return this.eventSummary(evento);
    }
    return 'Sin agrupar';
  }

  private compareAdvisorEventRows(left: EventoResponse, right: EventoResponse, field: AdvisorEventSortField): number {
    if (field === 'createdAt') {
      return this.eventTimestamp(left) - this.eventTimestamp(right);
    }

    const leftValue = this.advisorEventSortValue(left, field);
    const rightValue = this.advisorEventSortValue(right, field);
    return leftValue.localeCompare(rightValue, 'es', { numeric: true, sensitivity: 'base' });
  }

  private advisorEventSortValue(evento: EventoResponse, field: AdvisorEventSortField): string {
    if (field === 'accion') {
      return this.display(evento.accion);
    }
    if (field === 'lead') {
      return this.display(evento.lead);
    }
    if (field === 'detalle') {
      return this.eventSummary(evento);
    }
    return '';
  }

  private normalizeAdvisorEventText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
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

  historicosTipificacionGroupMode(): Extract<GtrHistoricosGroupMode, 'PRIMERA_TIPIFICACION' | 'MAYOR_TIPIFICACION' | 'ULTIMA_TIPIFICACION'> {
    switch (this.masivoFiltersForm.controls.campoTipificacion.value) {
      case 'PRIMERA':
        return 'PRIMERA_TIPIFICACION';
      case 'MAYOR':
        return 'MAYOR_TIPIFICACION';
      default:
        return 'ULTIMA_TIPIFICACION';
    }
  }

  historicosTipificacionColumnLabel(): string {
    switch (this.masivoFiltersForm.controls.campoTipificacion.value) {
      case 'PRIMERA':
        return 'Primera tipificación';
      case 'MAYOR':
        return 'Mayor tipificación';
      default:
        return 'Última tipificación';
    }
  }

  historicosTipificacionParts(row: LeadGtrResponse): { tipificacion: string; subtipificacion: string } {
    switch (this.masivoFiltersForm.controls.campoTipificacion.value) {
      case 'PRIMERA':
        return this.tipificacionParts(row.primeraCodigoTipificacion, row.primeraCodigoSubtipificacion);
      case 'MAYOR':
        return this.tipificacionParts(row.mayorRangoCodigoTipificacion, row.mayorRangoCodigoSubtipificacion);
      default:
        return this.tipificacionParts(row.codigoTipificacion, row.codigoSubtipificacion);
    }
  }

  tipificacionParts(codigo?: string | null, subcodigo?: string | null): { tipificacion: string; subtipificacion: string } {
    return {
      tipificacion: this.display(codigo),
      subtipificacion: this.display(subcodigo)
    };
  }

  tipificacionTagClass(
    codigo?: string | null,
    kind: 'tipificacion' | 'subtipificacion' = 'tipificacion',
    subcodigo?: string | null
  ): string {
    const normalized = this.display(codigo).toUpperCase();
    const base = 'gtr-tip-tag';
    if (this.isPreventaDesaprobada(normalized, subcodigo)) {
      return `${base} ${base}--danger ${base}--${kind}`;
    }
    const meta = this.tipificacionVisualMetaByCode().get(normalized);
    const tone = meta ? `palette-${meta.paletteIndex}` : 'neutral';
    return `${base} ${base}--${tone} ${base}--${kind}`;
  }

  private isPreventaDesaprobada(codigo: string, subcodigo?: string | null): boolean {
    const subtipificacion = this.display(subcodigo).toUpperCase();
    return (codigo === 'PREVENTA' && (subtipificacion === 'DESAPROBADA' || subtipificacion === 'DESAPROBADO'))
      || (codigo === 'NO DESEA' && subtipificacion === 'PREVENTA DESAPROBADA');
  }

  isRetornoVentaPreventaManualBlock(codigo?: string | null, subcodigo?: string | null): boolean {
    return this.display(codigo).toUpperCase() === 'NO DESEA'
      && this.display(subcodigo).toUpperCase() === 'PREVENTA DESAPROBADA';
  }

  leadPrefixLabel(prefijo?: string | null): string {
    if (prefijo === '+51') {
      return '🇵🇪';
    }
    return this.display(prefijo);
  }

  leadIdentity(row: { prefijo?: string | null; lead?: string | null; usermeta?: string | null }): string {
    return formatLeadIdentity(row);
  }

  hasLeadPhone(row: { prefijo?: string | null; lead?: string | null }): boolean {
    return !!this.telUrl(row.prefijo, row.lead);
  }

  canDialLead(row: { prefijo?: string | null; lead?: string | null }): boolean {
    return !!this.telUrl(row.prefijo, this.currentNumeroLlamada()?.numero ?? row.lead);
  }

  currentNumeroLlamadaLabel(): string {
    return this.currentNumeroLlamada()?.label ?? 'Llamar';
  }

  isCurrentNumeroLlamada(numero: NumeroLlamadaResponse): boolean {
    return this.currentNumeroLlamada()?.numero === numero.numero;
  }

  hasLeadChat(row: { prefijo?: string | null; lead?: string | null; usermeta?: string | null }): boolean {
    return !!this.whatsAppUrl(row.prefijo, row.lead, row.usermeta);
  }

  canShowSnapshotPhoneCompletion(row: { prefijo?: string | null; lead?: string | null }): boolean {
    return !this.hasLeadPhone(row);
  }

  openSnapshotPhoneEditor(): void {
    const lead = this.selectedSnapshotLead();
    if (!lead || this.hasLeadPhone(lead)) {
      return;
    }
    this.snapshotPhoneEditorOpen.set(true);
    this.snapshotForm.controls.prefijo.enable({ emitEvent: false });
    this.snapshotForm.controls.lead.enable({ emitEvent: false });
    this.snapshotForm.controls.prefijo.setValue(this.snapshotForm.controls.prefijo.value || PERU_PHONE_PREFIX);
    this.snapshotForm.controls.prefijo.markAsPristine();
    this.snapshotForm.controls.lead.markAsPristine();
  }

  snapshotIdentityErrorMessage(): string | null {
    if (this.snapshotForm.errors?.['phoneIncomplete']) {
      return 'Completa prefijo y numero para guardar el telefono del lead.';
    }
    if (this.snapshotForm.controls.prefijo.invalid) {
      return 'El prefijo debe tener formato +1, +51 o similar.';
    }
    if (this.snapshotForm.controls.lead.invalid) {
      return this.intakeNumberInvalidMessage();
    }
    if (this.snapshotForm.controls.usermeta.invalid) {
      return 'El usuario WhatsApp solo puede usar letras, numeros, punto, guion y guion bajo.';
    }
    return null;
  }

  providerLogo(nombreProveedor?: string | null): string | null {
    return resolveProviderLogo(nombreProveedor);
  }

  priorityCampaignLabel(): string {
    return PRIORITY_CAMPAIGN_LABEL;
  }

  isPriorityCampaign(row: { nombreCampana?: string | null }): boolean {
    return isPriorityCampaignName(row.nombreCampana);
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
      return this.leadIdentity(row);
    }
    return `Lead ${idLead}`;
  }

  private sameAdvisorName(currentAdvisorName: string, targetAdvisorName: string): boolean {
    return this.normalizeLookup(currentAdvisorName) === this.normalizeLookup(targetAdvisorName);
  }

  private normalizeLookup(value?: string | null): string {
    return (value ?? '').trim().toUpperCase();
  }

  private normalizePhoneInput(value?: string | null): string {
    const digits = (value ?? '').replace(/\D/g, '');
    if (!digits) {
      return '';
    }
    return digits.length > 9 ? digits.slice(-9) : digits;
  }

  private normalizeLeadSearchInput(value?: string | null): string {
    const input = (value ?? '').trim();
    if (!input) {
      return '';
    }
    if (/^\+?[\d\s().-]+$/.test(input)) {
      return this.normalizePhoneInput(input);
    }
    return input.replace(/\s+/g, '');
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
          // Eventos estructurales: cambian conteos, asignaciones, estado o filas de la bandeja del
          // GTR. Ameritan el reconcile completo (bandeja + metricas + grupos + asesores + pendientes).
          if (
            [
              'REGISTRO',
              'REGISTRO_MASIVO',
              'ASIGNACION',
              'CONTACTO',
              'GESTION_INICIADA',
              'TIPIFICACION',
              'ATENCION_CERRADA',
              'CAMPANA_CORREGIDA',
              'ELIMINACION'
            ].includes(event.tipo)
          ) {
            void this.reconcile();
            return;
          }
          // Ediciones de datos del lead por el asesor (documento/direccion/datos preventa). Llegan en
          // rafagas mientras tipea y guarda, y solo afectan la columna Documento de la bandeja: NO los
          // conteos, asesores ni pendientes. Refrescamos solo la lista, silencioso y con debounce,
          // para no recargar toda la vista del GTR en cada guardado del asesor.
          if (
            [
              'SNAPSHOTS_ACTUALIZADOS',
              'DATOS_PREVENTA_ACTUALIZADOS',
              'DIRECCION_ACTUALIZADA'
            ].includes(event.tipo)
          ) {
            this.scheduleLeadDataRefresh();
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

  // Refresco liviano y con debounce de SOLO la bandeja ante ediciones de datos del asesor. Colapsa las
  // rafagas de guardado en un unico refresco silencioso; no toca metricas, asesores ni pendientes.
  private scheduleLeadDataRefresh(): void {
    if (this.section() !== 'plataforma' || !this.canDisplayOperationalData()) {
      return;
    }
    if (this.leadDataRefreshId !== null) {
      return;
    }
    this.leadDataRefreshId = window.setTimeout(() => {
      this.leadDataRefreshId = null;
      void this.refreshPage(true).catch(() => undefined);
    }, 1500);
  }

  private stopLeadDataRefresh(): void {
    if (this.leadDataRefreshId !== null) {
      window.clearTimeout(this.leadDataRefreshId);
      this.leadDataRefreshId = null;
    }
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
        section === 'historicos' && this.masivoSearched() ? this.refreshMasivos(true) : Promise.resolve(),
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
    const requestSeq = ++this.platformRequestSeq;
    const requestKey = this.platformRequestKey();
    const previous = this.rows();
    const query = this.currentQuery(this.pageSize);
    const groupFilter = this.platformGroupFilter();
    const adminEquipoId = this.adminEquipoId();
    const page = await firstValueFrom(
      this.preventaService.listarBandejaGtr(
        this.today,
        query,
        groupFilter,
        adminEquipoId
      )
    );
    if (requestSeq !== this.platformRequestSeq || requestKey !== this.platformRequestKey()) {
      return;
    }
    this.totalElements.set(page.totalElements);
    this.totalPages.set(page.totalPages);
    this.rows.set(this.mergeVisualRows(previous, page.content, this.shouldAnimatePlatformRefresh(silent, previous)));
  }

  private async refreshAgendados(silent: boolean): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const requestSeq = ++this.agendadosRequestSeq;
    const requestKey = this.agendadosRequestKey();
    this.isLoadingAgendados.set(!silent);
    try {
      const previous = this.agendadosRows();
      const query = {
        pageNumber: this.agendadosPageNumber(),
        pageSize: this.pageSize,
        sortBy: this.agendadosSortField(),
        direction: this.agendadosSortDirection()
      };
      const adminEquipoId = this.adminEquipoId();
      const page = await firstValueFrom(
        this.preventaService.listarAgendadosGtr(query, adminEquipoId)
      );
      if (requestSeq !== this.agendadosRequestSeq || requestKey !== this.agendadosRequestKey()) {
        return;
      }
      this.agendadosTotalElements.set(page.totalElements);
      this.agendadosTotalPages.set(page.totalPages);
      this.agendadosRows.set(this.mergeVisualAgendados(previous, page.content, this.shouldAnimateAgendadosRefresh(silent, previous)));
    } finally {
      if (requestSeq === this.agendadosRequestSeq) {
        this.isLoadingAgendados.set(false);
      }
    }
  }

  private async refreshMasivos(silent = false): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const requestSeq = ++this.masivosRequestSeq;
    const requestKey = this.masivosRequestKey();
    if (!silent) {
      this.isLoadingMasivos.set(true);
    }
    try {
      const filters = this.getMasivoFilters();
      const query = {
        pageNumber: this.masivoPageNumber(),
        pageSize: this.historicosPageSize(),
        sortBy: this.historicosSortField(),
        direction: this.historicosSortDirection()
      };
      const page = await firstValueFrom(
        this.preventaService.listarLeadsMasivo(filters, query)
      );
      if (requestSeq !== this.masivosRequestSeq || requestKey !== this.masivosRequestKey()) {
        return;
      }
      this.masivoTotalElements.set(page.totalElements);
      this.masivoTotalPages.set(page.totalPages);
      if (this.masivoRowsSignature(this.masivoRows()) !== this.masivoRowsSignature(page.content)) {
        this.masivoRows.set(page.content);
      }
      this.lastMasivoSearchFiltersKey = this.historicosFiltersKey(this.currentHistoricosFiltersFormValue());
      this.saveHistoricosState();
    } catch (error) {
      if (requestSeq === this.masivosRequestSeq) {
        this.errorMessage.set(this.getErrorMessage(error, 'No se pudo listar leads masivos.'));
      }
    } finally {
      if (!silent && requestSeq === this.masivosRequestSeq) {
        this.isLoadingMasivos.set(false);
      }
    }
  }

  private async refreshMetrics(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    this.metrics.set(await firstValueFrom(this.preventaService.obtenerMetricasGtr(this.today, this.adminEquipoId())));
  }

  private async refreshPlatformGroups(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    const groups = await firstValueFrom(this.preventaService.listarAgrupacionesBandejaGtr(this.today, this.adminEquipoId()));
    this.platformGroups.set({
      asesores: groups.asesores ?? [],
      campanas: groups.campanas ?? [],
      estados: groups.estados ?? [],
      primerasTipificaciones: groups.primerasTipificaciones ?? [],
      mayoresTipificaciones: groups.mayoresTipificaciones ?? [],
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
      primerasTipificaciones: groups.primerasTipificaciones ?? [],
      mayoresTipificaciones: groups.mayoresTipificaciones ?? [],
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

  // Catálogo del modal de tipificación: del equipo del lead (lo resuelve el backend desde el lead). Se
  // re-trae por lead porque distintos leads pueden ser de equipos con matrices distintas; planes y
  // departamentos sí se cachean.
  private async ensureTypifyCatalogs(idLead: number): Promise<void> {
    const [catalogo, planes, departamentos] = await Promise.all([
      firstValueFrom(this.preventaService.getCatalogoTipificaciones(idLead, 'PREVENTA')),
      this.planes().length ? Promise.resolve(this.planes()) : firstValueFrom(this.preventaService.listarPlanes(undefined, true)),
      this.departamentos().length ? Promise.resolve(this.departamentos()) : firstValueFrom(this.preventaService.listarDepartamentos())
    ]);
    this.typifyCatalogo.set(catalogo);
    this.planes.set(planes);
    this.departamentos.set(departamentos);
  }

  // Dropdowns de filtro del histórico (cross-equipo): salen del catálogo AGREGADO por código. NO tocan el
  // typifyCatalogo (ese es por lead). NOTA: el filtro masivo por tipificación aún usa ids representativos;
  // migrarlo a filtrado por equipo es una tarea aparte (masivos por equipo).
  private async refreshCatalogoTipificaciones(): Promise<void> {
    const catalogo = await firstValueFrom(this.preventaService.getCatalogoAgregado('PREVENTA'));
    this.catalogoTipificaciones.set(
      catalogo.tipificaciones
        .map((tipificacion) => ({
          codigo: tipificacion.codigo,
          descripcion: tipificacion.descripcion,
          label: `${tipificacion.codigo} || ${tipificacion.descripcion}`,
          orden: tipificacion.orden,
          value: tipificacion.codigo
        }))
        .sort((left, right) => left.label.localeCompare(right.label))
    );
    this.catalogoSubtipificaciones.set(
      catalogo.tipificaciones
        .flatMap((tipificacion) =>
          tipificacion.subtipificaciones.map((subtipificacion) => ({
            codigo: subtipificacion.codigo,
            descripcion: subtipificacion.descripcion,
            codigoTipificacion: tipificacion.codigo,
            label: `${subtipificacion.codigo} || ${subtipificacion.descripcion}`,
            orden: subtipificacion.orden,
            value: subtipificacion.codigo
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
      latitud: this.toCoordinateValue(detail.latitud),
      longitud: this.toCoordinateValue(detail.longitud),
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
      latitud: this.toCoordinateValue(raw.latitud),
      longitud: this.toCoordinateValue(raw.longitud),
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

  private toCoordinateValue(value: number | string | null | undefined): string {
    return this.stripTrailingCoordinateZeros(String(value ?? '').replace(',', '.').trim());
  }

  private stripTrailingCoordinateZeros(value: string): string {
    if (!value.includes('.')) {
      return value;
    }
    return value.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
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

  private defaultPlatformSortDirection(field: GtrPlatformSortField): GtrPlatformSortDirection {
    return field === 'lastEntryAt' || field === 'createdAt' || field === 'totalAsignacionesHoyPreventa' ? 'desc' : 'asc';
  }

  private defaultAgendadosSortDirection(field: AgendadosSortField): GtrPlatformSortDirection {
    return field === 'programado' || field === 'agendado' ? 'desc' : 'asc';
  }

  private defaultHistoricosSortDirection(field: GtrHistoricosSortField): GtrPlatformSortDirection {
    return field === 'lastEntryAt' ? 'desc' : 'asc';
  }

  private platformRequestKey(): string {
    return JSON.stringify({
      section: this.section(),
      equipo: this.adminEquipoId(),
      query: this.currentQuery(this.pageSize),
      group: this.platformGroupFilter()
    });
  }

  private agendadosRequestKey(): string {
    return JSON.stringify({
      section: this.section(),
      equipo: this.adminEquipoId(),
      pageNumber: this.agendadosPageNumber(),
      pageSize: this.pageSize,
      sortBy: this.agendadosSortField(),
      direction: this.agendadosSortDirection()
    });
  }

  private masivosRequestKey(): string {
    return JSON.stringify({
      section: this.section(),
      searched: this.masivoSearched(),
      filters: this.getMasivoFilters(),
      pageNumber: this.masivoPageNumber(),
      pageSize: this.historicosPageSize(),
      sortBy: this.historicosSortField(),
      direction: this.historicosSortDirection()
    });
  }

  private masivoRowsSignature(rows: LeadGtrResponse[]): string {
    return rows
      .map((row) => [
        row.id,
        row.estadoSeguimiento ?? '',
        row.codigoTipificacion ?? '',
        row.codigoSubtipificacion ?? '',
        row.nombreAsesorAsignado ?? '',
        row.totalAsignacionesPreventa ?? row.totalAsignaciones ?? '',
        row.totalAsignacionesHoyPreventa ?? '',
        row.numeroDocumentoTitularServicio ?? '',
        row.lastEntryAt ?? '',
        row.createdAt ?? ''
      ].join(':'))
      .join('|');
  }

  private shouldAnimatePlatformRefresh(silent: boolean, previous: VisualLeadGtr[]): boolean {
    return silent && this.pageNumber() === 0 && previous.length > 0;
  }

  private shouldAnimateAgendadosRefresh(silent: boolean, previous: VisualLeadAgendadoGtr[]): boolean {
    return silent && this.agendadosPageNumber() === 0 && previous.length > 0;
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

  private isPlatformTipificationGroupMode(mode: LeadGtrGroupMode): boolean {
    return mode === 'PRIMERA_TIPIFICACION'
      || mode === 'MAYOR_TIPIFICACION'
      || mode === 'ULTIMA_TIPIFICACION';
  }

  private sortPlatformGroupOptions(groups: LeadGtrGroupItemResponse[]): LeadGtrGroupItemResponse[] {
    return [...groups].sort((left, right) =>
      right.cantidad - left.cantidad
      || left.etiqueta.localeCompare(right.etiqueta, undefined, { sensitivity: 'base' })
    );
  }

  private samePlatformGroup(left: LeadGtrGroupItemResponse, right: LeadGtrGroupItemResponse): boolean {
    if (this.isPlatformTipificationGroupMode(this.platformGroupingMode())
        && right.codigoTipificacion
        && !right.codigoSubtipificacion) {
      return !left.sinValor && left.codigoTipificacion === right.codigoTipificacion;
    }
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
    const adminEquipoId = this.adminEquipoId();
    return {
      idEquipo: adminEquipoId ?? (raw.idEquipo > 0 ? raw.idEquipo : undefined),
      codigosTipificacion: raw.tipificaciones.length ? raw.tipificaciones : undefined,
      codigosSubtipificacion: raw.subtipificaciones.length ? raw.subtipificaciones : undefined,
      campoTipificacion: raw.campoTipificacion,
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
    if (mode === this.historicosTipificacionGroupMode()) {
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
      idEquipo: raw.idEquipo,
      campoTipificacion: raw.campoTipificacion,
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

    this.masivoFiltersForm.reset({
      idEquipo: state.filters.idEquipo ?? this.defaultHistoricosEquipoId(),
      campoTipificacion: state.filters.campoTipificacion ?? 'ULTIMA',
      tipificaciones: state.filters.tipificaciones,
      subtipificaciones: state.filters.subtipificaciones,
      fechaDesde: state.filters.fechaDesde,
      fechaHasta: state.filters.fechaHasta
    });
    this.selectedMasivoTipificacionCodes.set(new Set(state.filters.tipificaciones));
    this.subtipificacionFilter.set('');
    this.masivoRows.set(state.rows);
    this.masivoTotalElements.set(state.totalElements);
    this.masivoTotalPages.set(state.totalPages);
    this.masivoPageNumber.set(state.pageNumber);
    this.historicosPageSize.set(this.normalizeHistoricosPageSize(state.pageSize));
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
      pageSize: this.historicosPageSize(),
      searched: filtersMatchLastSearch,
      selectedIds
    });
  }

  private normalizeHistoricosPageSize(pageSize: number | null | undefined): number {
    return this.historicosPageSizeOptions.includes(Number(pageSize)) ? Number(pageSize) : 20;
  }

  private defaultHistoricosEquipoId(): number {
    const options = this.historicosEquipoOptions();
    return options.length === 1 ? options[0].value : 0;
  }

  private getStoredHistoricosSelectedIds(): Set<number> {
    return new Set(this.historicosStateService.get()?.selectedIds ?? []);
  }

  private historicosFiltersKey(filters: GtrHistoricosFiltersFormValue): string {
    return JSON.stringify({
      ...filters,
      tipificaciones: [...filters.tipificaciones].sort((left, right) => left.localeCompare(right)),
      subtipificaciones: [...filters.subtipificaciones].sort((left, right) => left.localeCompare(right))
    });
  }

  private mergeVisualRows(
    previous: VisualLeadGtr[],
    incoming: LeadGtrResponse[],
    animateNew: boolean
  ): VisualLeadGtr[] {
    const previousById = new Map(previous.map((row) => [row.id, row]));
    const newIds = animateNew ? incoming.filter((row) => !previousById.has(row.id)).map((row) => row.id) : [];
    const animatedIds = newIds.length <= 3 ? new Set(newIds) : new Set<number>();
    const rows = incoming.map((row) => ({ ...row, isNew: animatedIds.has(row.id) }));
    this.scheduleNewRowReset([...animatedIds]);
    return rows;
  }

  private mergeVisualAgendados(
    previous: VisualLeadAgendadoGtr[],
    incoming: LeadAgendadoGtrResponse[],
    animateNew: boolean
  ): VisualLeadAgendadoGtr[] {
    const previousById = new Map(previous.map((row) => [row.id, row]));
    const newIds = animateNew ? incoming.filter((row) => !previousById.has(row.id)).map((row) => row.id) : [];
    const animatedIds = newIds.length <= 3 ? new Set(newIds) : new Set<number>();
    this.scheduleNewRowReset([...animatedIds]);
    return incoming.map((row) => ({ ...row, isNew: animatedIds.has(row.id) }));
  }

  private mapAgendadoToLead(row: LeadAgendadoGtrResponse): LeadGtrResponse {
    return {
      id: row.id,
      idEquipo: row.idEquipo,
      createdAt: row.createdAt,
      prefijo: row.prefijo,
      lead: row.lead,
      usermeta: row.usermeta,
      nombreCampana: row.nombreCampana,
      nombreProveedorCampana: row.nombreProveedorCampana,
      nombreProveedorEquipo: row.nombreProveedorEquipo,
      base: row.base,
      nombreTitular: row.nombreTitular,
      codigoTipificacion: row.codigoTipificacion,
      codigoSubtipificacion: row.codigoSubtipificacion,
      nombreAsesorAsignado: row.nombreAsesorAsignado,
      estadoSeguimiento: row.estadoSeguimiento,
      totalAsignaciones: row.totalAsignacionesPreventa ?? row.totalAsignaciones,
      totalAsignacionesPreventa: row.totalAsignacionesPreventa ?? row.totalAsignaciones,
      totalAsignacionesHoyPreventa: row.totalAsignacionesHoyPreventa ?? 0,
      tieneAlertaRegistrosDia: false,
      tieneMultiplesRegistrosDia: false,
      tieneRegistrosMismaCampanaDia: false
    };
  }

  /** Fecha y hora en que el asesor tipifico AGENDADO (Evento.createdAt), con año. */
  agendadoTipificadoLabel(row: LeadAgendadoGtrResponse): string {
    if (!row.fechaAgendamiento) {
      return '-';
    }
    const d = new Date(row.fechaAgendamiento);
    return isNaN(d.getTime()) ? '-' : this.formatDateTimeLabel(d);
  }

  /** Fecha y hora de la cita, con año. La fecha la resuelve el backend (fechaProgramacion). */
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
    // La fecha de la cita la persiste el backend en fechaProgramacion (YYYY-MM-DD) aplicando la regla
    // hora-anterior => día siguiente. Fallback defensivo a la fecha del agendamiento si no viniera.
    let dateStr = row.fechaProgramacion ?? null;
    if (!dateStr) {
      if (row.fechaAgendamiento) {
        const d = new Date(row.fechaAgendamiento);
        if (!isNaN(d.getTime())) {
          dateStr = this.formatLocalDate(d);
        }
      }
      dateStr = dateStr ?? this.today;
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
        this.agendadosRows.update((rows) => rows.map((row) => (row.id === id ? { ...row, isNew: false } : row)));
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
      usermeta: '',
      idCampana: null,
      base: null
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
    this.intakeForm.controls.base.setValue(this.selectedIntakeCampaignId() ? 'WHATSAPP' : null);
  }

  private applySnapshotIdentityDisabledState(row: { prefijo?: string | null; lead?: string | null; usermeta?: string | null }): void {
    const hasPhone = !!row.prefijo && !!row.lead;
    const hasUsermeta = !!normalizeUsermeta(row.usermeta);
    const prefijoControl = this.snapshotForm.controls.prefijo;
    const leadControl = this.snapshotForm.controls.lead;
    const usermetaControl = this.snapshotForm.controls.usermeta;

    if (hasPhone) {
      prefijoControl.disable({ emitEvent: false });
      leadControl.disable({ emitEvent: false });
    } else {
      prefijoControl.disable({ emitEvent: false });
      leadControl.disable({ emitEvent: false });
    }

    if (hasUsermeta) {
      usermetaControl.disable({ emitEvent: false });
    } else {
      usermetaControl.enable({ emitEvent: false });
    }
    this.updateSnapshotLeadValidation(prefijoControl.value);
  }

  private enableSnapshotIdentityControls(): void {
    this.snapshotForm.controls.prefijo.enable({ emitEvent: false });
    this.snapshotForm.controls.lead.enable({ emitEvent: false });
    this.snapshotForm.controls.usermeta.enable({ emitEvent: false });
  }

  private buildSnapshotIdentityRequest(): { prefijo?: string | null; lead?: string | null; usermeta?: string | null } | null {
    const selected = this.selectedSnapshotLead();
    if (!selected) {
      return null;
    }
    const raw = this.snapshotForm.getRawValue();
    const prefijo = (raw.prefijo ?? '').trim();
    const numeroLead = (raw.lead ?? '').trim();
    const usermeta = normalizeUsermeta(raw.usermeta);
    const request: { prefijo?: string | null; lead?: string | null; usermeta?: string | null } = {};

    if (this.snapshotPhoneEditorOpen() && (!selected.prefijo || !selected.lead) && prefijo && numeroLead) {
      request.prefijo = prefijo;
      request.lead = numeroLead;
    }
    if (!normalizeUsermeta(selected.usermeta) && usermeta) {
      request.usermeta = usermeta;
    }

    return request.prefijo || request.usermeta ? request : null;
  }

  private snapshotSuccessMessage(updatedIdentity: boolean, updatedSnapshot: boolean): string {
    if (updatedIdentity && updatedSnapshot) {
      return 'Identidad y datos iniciales actualizados.';
    }
    if (updatedIdentity) {
      return 'Identidad del lead actualizada.';
    }
    return updatedSnapshot ? 'Snapshot inicial actualizado.' : 'Sin cambios para guardar.';
  }

  private updateIntakeLeadValidation(prefijo?: string | null): void {
    const leadControl = this.intakeForm.controls.lead;
    const isPeruPrefix = prefijo === PERU_PHONE_PREFIX;

    this.intakeNumberMaxLength.set(isPeruPrefix ? 9 : 15);
    leadControl.setValidators([
      Validators.pattern(isPeruPrefix ? PERU_LEAD_PATTERN : INTERNATIONAL_LEAD_PATTERN)
    ]);
    leadControl.updateValueAndValidity({ emitEvent: false });
    this.intakeForm.updateValueAndValidity({ emitEvent: false });
  }

  private updateSnapshotLeadValidation(prefijo?: string | null): void {
    const leadControl = this.snapshotForm.controls.lead;
    const isPeruPrefix = prefijo === PERU_PHONE_PREFIX;

    this.snapshotNumberMaxLength.set(isPeruPrefix ? 9 : 15);
    leadControl.setValidators([
      Validators.pattern(isPeruPrefix ? PERU_LEAD_PATTERN : INTERNATIONAL_LEAD_PATTERN)
    ]);
    leadControl.updateValueAndValidity({ emitEvent: false });
    this.snapshotForm.updateValueAndValidity({ emitEvent: false });
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
    this.selectedMasivoTipificacionCodes.set(new Set());
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

  private whatsAppUrl(prefijo?: string | null, lead?: string | null, usermeta?: string | null): string | null {
    return buildWhatsAppUrl(prefijo, lead, usermeta);
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
