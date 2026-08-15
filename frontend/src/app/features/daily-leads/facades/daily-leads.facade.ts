import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom, Subscription } from 'rxjs';
import type { TipificationPaletteByCode } from '../../../shared/components/tipification-stack/tipification-stack.component';
import { UsuarioResponse } from '../../../shared/models/auth/usuario-response';
import {
  EventoResponse,
  LeadGtrResponse
} from '../../../shared/models/preventa/preventa.models';
import { formatLabel } from '../../../shared/utils/display-label';
import { SessionService } from '../../../core/services/session.service';
import { OperationalGateService } from '../../../core/services/operational-gate.service';
import {
  AsesorGtrPresenceResponse,
  ConnectedUserResponse,
  PresenceService
} from '../../../core/services/presence.service';
import { buildWhatsAppUrl, formatLeadIdentity, normalizeUsermeta } from '../../../shared/utils/phone-link';
import { LeadRealtimeService } from '../../preventa/services/lead-realtime.service';
import { PreventaLeadService } from '../../preventa/services/preventa-lead.service';
import { DailyLeadsService } from '../services/daily-leads.service';
import {
  DailyLeadGroupFilter,
  DailyLeadGroupItem,
  DailyLeadGroupMode,
  DailyLeadGroupsResponse,
  DailyLeadRegistroView,
  DailyLeadRowView,
  DailyLeadSortDirection,
  DailyLeadSortField,
  DailyLeadsMetricsView,
  LeadDiarioResponse,
  LeadsDiariosMetricas,
  LeadsDiariosMetricasEquipo,
  RegistroDiarioLeadResponse
} from '../models/daily-lead.model';

type DailyLeadsDialog = 'assign' | 'snapshot' | 'reassign-confirm' | 'takeover-confirm' | null;

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
  row: LeadGtrResponse;
  currentAdvisorName: string;
  requiresInManagement: boolean;
  requiresReassignment: boolean;
  requiresPreviousManagement: boolean;
  previousManagementAt?: string | null;
};

type AssignmentConflictDetails = {
  tipo?: string | null;
  nombreAsesorActual?: string | null;
  ultimaGestionAt?: string | null;
  requiereConfirmarLeadEnGestion?: boolean | null;
  requiereConfirmarReasignacion?: boolean | null;
  requiereConfirmarGestionPrevia?: boolean | null;
};

const PERU_PHONE_PREFIX = '+51';
const PERU_LEAD_PATTERN = /^\d{9}$/;
const INTERNATIONAL_LEAD_PATTERN = /^\d{6,15}$/;

@Injectable()
export class DailyLeadsFacade {
  private readonly service = inject(DailyLeadsService);
  private readonly preventaService = inject(PreventaLeadService);
  private readonly presenceService = inject(PresenceService);
  private readonly session = inject(SessionService);
  private readonly fb = inject(FormBuilder);
  private readonly document = inject(DOCUMENT);
  private readonly realtimeService = inject(LeadRealtimeService);
  private readonly operationalGateService = inject(OperationalGateService);
  private readonly operationalGate = this.operationalGateService.createGate('daily-leads');
  private readonly realtimeSubscription = new Subscription();
  private realtimeStarted = false;

  /**
   * Roles con visibilidad global de equipos (backend: VER_TODOS_LOS_EQUIPOS) que llegan a esta
   * vista. Solo ellos agrupan por equipo; el GTR está acotado por backend a su único equipo.
   */
  private static readonly ROLES_VISIBILIDAD_GLOBAL = new Set(['ADMINISTRADOR', 'COMMUNITY', 'MONITOR']);
  readonly canGroupByTeam = computed(() => {
    const role = this.session.primaryRole();
    return !!role && DailyLeadsFacade.ROLES_VISIBILIDAD_GLOBAL.has(role);
  });
  readonly canDisplayOperationalData = this.operationalGate.canDisplayOperationalData;
  readonly canMutateOperationalData = this.operationalGate.canMutateOperationalData;

  private readonly timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  readonly pageSize = signal(10);

  readonly rows = signal<DailyLeadRowView[]>([]);
  readonly tableRows = computed<DailyLeadRowView[]>(() => {
    const rows = this.rows();
    if (rows.length === 0) {
      return rows;
    }

    const missingRows = Math.max(0, this.pageSize() - rows.length);
    if (missingRows === 0) {
      return rows;
    }

    return [
      ...rows,
      ...Array.from({ length: missingRows }, (_, index) => this.placeholderRow(index))
    ];
  });
  readonly metricas = signal<LeadsDiariosMetricas | null>(null);
  readonly metricasPorEquipo = signal<LeadsDiariosMetricasEquipo[]>([]);
  readonly metricasView = computed<DailyLeadsMetricsView | null>(() => {
    const m = this.currentMetricas();
    if (!m) {
      return null;
    }
    return {
      registros: m.registros,
      leadsUnicos: m.leadsUnicos,
      repetidos: Math.max(0, m.registros - m.leadsUnicos),
      porcentajeValidos: m.registros > 0 ? (m.leadsUnicos / m.registros) * 100 : 0,
      leadsRepetidos: m.leadsRepetidos,
      leadsTipificados: m.leadsTipificados,
      bloque1: m.bloqueOrden1,
      bloque2: m.bloqueOrden2,
      bloque3: m.bloqueOrden3,
      ventaCerrada: m.leadsVentaCerrada
    };
  });
  readonly totalElements = signal(0);
  readonly visibleTotalElements = signal(0);
  /** Total de eventos REGISTRO del día (incluye repeticiones), para "N leads · M registros". */
  readonly totalRegistros = signal(0);
  /** Filas expandidas (clave = idLead) y sus registros repetidos ya cargados. */
  readonly expandedRowKeys = signal<Record<number, boolean>>({});
  readonly registrosByLead = signal<Record<number, DailyLeadRegistroView[]>>({});
  readonly loadingRegistrosLeadId = signal<number | null>(null);
  readonly pageNumber = signal(0);
  readonly isLoading = signal(false);
  readonly isLoadingGroups = signal(false);
  readonly isLoadingEvents = signal(false);
  readonly isLoadingAdvisors = signal(false);
  readonly isSaving = signal(false);
  readonly isSavingSnapshot = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal<string | null>(null);
  readonly tipificationPaletteByCode = signal<TipificationPaletteByCode>({});
  readonly eventRows = signal<EventoResponse[]>([]);
  readonly activeHistoryLead = signal<DailyLeadRowView | null>(null);
  readonly activeDialog = signal<DailyLeadsDialog>(null);
  readonly activeAssignmentLead = signal<LeadGtrResponse | null>(null);
  readonly activeSnapshotLead = signal<LeadGtrResponse | null>(null);
  readonly advisors = signal<AdvisorOption[]>([]);
  readonly selectedAssignmentAdvisorId = signal(0);
  readonly pendingReassignment = signal<PendingReassignment | null>(null);
  readonly pendingTakeover = signal<PendingTakeover | null>(null);
  readonly snapshotPhoneEditorOpen = signal(false);
  readonly snapshotNumberMaxLength = signal(9);
  /** Fecha operativa seleccionada (YYYY-MM-DD). Vacío = hoy (lo resuelve el backend en America/Lima). */
  readonly fecha = signal('');
  readonly leadSearchDraft = signal('');
  readonly leadSearch = signal('');
  readonly groupingMode = signal<DailyLeadGroupMode>('SIN_AGRUPAR');
  readonly selectedGroup = signal<DailyLeadGroupItem | null>(null);
  readonly sortField = signal<DailyLeadSortField>('createdAt');
  readonly sortDirection = signal<DailyLeadSortDirection>('desc');
  readonly groups = signal<DailyLeadGroupsResponse>({
    asesores: [],
    campanas: [],
    equipos: [],
    primerasTipificaciones: [],
    mayoresTipificaciones: [],
    ultimasTipificaciones: []
  });
  /** Nombre de equipo por id, para mostrar los chips de la agrupación "Equipo". */
  readonly equipoNombreById = signal<Map<number, string>>(new Map());
  readonly assignmentForm = this.fb.group({
    idAsesorAsignado: [0, [Validators.required, Validators.min(1)]]
  });
  readonly snapshotForm = this.fb.group({
    idLead: [0, [Validators.required, Validators.min(1)]],
    prefijo: [PERU_PHONE_PREFIX, [Validators.pattern(/^\+\d{1,3}$/)]],
    lead: ['', [Validators.pattern(PERU_LEAD_PATTERN)]],
    usermeta: [''],
    numeroDocumentoTitularServicio: [''],
    direccion: ['']
  });

  readonly first = computed(() => this.pageNumber() * this.pageSize());
  readonly isToday = computed(() => this.fecha() === '');
  readonly canUseGtrActions = computed(() => {
    const role = this.session.primaryRole();
    return (role === 'ASESOR_GTR' || role === 'SUPERVISOR_GTR') && this.canMutateOperationalData();
  });
  readonly assignmentTargetEquipoId = computed(() => this.activeAssignmentLead()?.idEquipo ?? null);
  readonly availableAssignmentAdvisors = computed(() => {
    const idEquipo = this.assignmentTargetEquipoId();
    const availabilityOrder = new Map<string, number>([
      ['DISPONIBLE', 0],
      ['CON_LEADS', 1],
      ['GESTIONANDO', 2],
      ['SIN_GESTIONAR', 3],
      ['OCUPADO', 4],
      ['SATURADO', 5]
    ]);

    if (idEquipo === null || idEquipo === undefined) {
      return [];
    }

    return this.advisors()
      .filter((advisor) => advisor.equipoIds.includes(idEquipo))
      .filter((advisor) => availabilityOrder.has(advisor.disponibilidad ?? ''))
      .sort((left, right) => {
        const leftOrder = availabilityOrder.get(left.disponibilidad ?? '') ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = availabilityOrder.get(right.disponibilidad ?? '') ?? Number.MAX_SAFE_INTEGER;
        return leftOrder - rightOrder || left.nombreCompleto.localeCompare(right.nombreCompleto);
      });
  });
  readonly selectedAdvisor = computed(() => {
    const advisorId = this.selectedAssignmentAdvisorId();
    return this.availableAssignmentAdvisors().find((advisor) => advisor.empleadoId === advisorId) ?? null;
  });
  readonly selectedSnapshotLead = computed(() => this.activeSnapshotLead());
  readonly isLeadSearchActive = computed(() => this.leadSearch().trim().length > 0);
  readonly headerTotalElements = computed(() =>
    this.selectedGroup() ? this.visibleTotalElements() : this.totalElements()
  );
  /** Texto de la cabecera: "N leads" y, si hay repeticiones y sin grupo, "· M registros". */
  readonly headerCountLabel = computed(() => {
    const leads = this.headerTotalElements();
    const leadsLabel = `${leads} ${leads === 1 ? 'lead' : 'leads'}`;
    if (this.selectedGroup()) {
      return leadsLabel;
    }
    const registros = this.totalRegistros();
    if (registros <= leads) {
      return leadsLabel;
    }
    return `${leadsLabel} · ${registros} ${registros === 1 ? 'registro' : 'registros'}`;
  });
  readonly groupingModeOptions = computed<Array<{ label: string; value: DailyLeadGroupMode }>>(() => {
    const options: Array<{ label: string; value: DailyLeadGroupMode }> = [
      { label: 'Sin agrupar', value: 'SIN_AGRUPAR' },
      { label: 'GTR', value: 'ASESOR' },
      { label: 'Campaña', value: 'CAMPANA' }
    ];
    // "Equipo" solo para roles con visibilidad global (ADMIN/COMMUNITY). El GTR está acotado
    // por backend a su único equipo, así que no se le ofrece la agrupación.
    if (this.canGroupByTeam()) {
      options.push({ label: 'Equipo', value: 'EQUIPO' });
    }
    options.push(
      { label: 'Primera tipificación', value: 'PRIMERA_TIPIFICACION' },
      { label: 'Mayor tipificación', value: 'MAYOR_TIPIFICACION' },
      { label: 'Última tipificación', value: 'ULTIMA_TIPIFICACION' }
    );
    return options;
  });
  readonly sortOptions: Array<{ label: string; value: DailyLeadSortField }> = [
    { label: 'Hora de registro', value: 'createdAt' },
    { label: 'Asignaciones hoy', value: 'totalAsignacionesHoyPreventa' },
    { label: 'Primera tipificación', value: 'primeraTipificacion' },
    { label: 'Mayor tipificación', value: 'mayorTipificacion' },
    { label: 'Última tipificación', value: 'ultimaTipificacion' }
  ];
  readonly sortDirectionOptions = computed<Array<{ label: string; value: DailyLeadSortDirection }>>(() => {
    if (this.sortField() === 'createdAt') {
      return [
        { label: 'Más antiguos', value: 'asc' },
        { label: 'Más recientes', value: 'desc' }
      ];
    }
    if (this.sortField() === 'totalAsignacionesHoyPreventa') {
      return [
        { label: 'Menos asignaciones', value: 'asc' },
        { label: 'Más asignaciones', value: 'desc' }
      ];
    }
    return [
      { label: 'Orden natural', value: 'asc' },
      { label: 'Orden inverso', value: 'desc' }
    ];
  });
  readonly organizationSummary = computed(() => {
    const grouping = this.groupingModeOptions().find((option) => option.value === this.groupingMode())?.label;
    const sorting = this.sortOptions.find((option) => option.value === this.sortField())?.label;
    const direction = this.sortDirectionOptions().find(
      (option) => option.value === this.sortDirection()
    )?.label;
    return `${grouping ?? 'Sin agrupar'} · ${sorting ?? 'Hora de registro'} (${direction})`;
  });
  readonly activeGroupOptions = computed<DailyLeadGroupItem[]>(() => {
    const groups = this.groups();
    switch (this.groupingMode()) {
      case 'ASESOR':
        return groups.asesores;
      case 'CAMPANA':
        return groups.campanas;
      case 'EQUIPO': {
        const nombres = this.equipoNombreById();
        return groups.equipos.map((group) =>
          group.idGrupo !== null && group.idGrupo !== undefined
            ? { ...group, etiqueta: nombres.get(group.idGrupo) ?? group.etiqueta }
            : group
        );
      }
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
  readonly maxDate = this.localToday();

  async initialize(): Promise<void> {
    this.startRealtime();
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    await Promise.all([
      this.loadTipificationPalette(),
      this.loadEquipoCatalogo(),
      this.loadGroups(),
      this.loadMetricas(),
      this.load(0)
    ]);
  }

  async setPageSize(pageSize: number, reload = true): Promise<void> {
    const normalized = Math.max(8, Math.min(18, Math.trunc(pageSize)));
    if (normalized === this.pageSize()) {
      return;
    }

    this.pageSize.set(normalized);
    if (reload) {
      await this.load(0);
    }
  }

  private async loadEquipoCatalogo(): Promise<void> {
    try {
      const equipos = await firstValueFrom(this.service.listarCatalogoEquipos());
      this.equipoNombreById.set(new Map(equipos.map((equipo) => [equipo.id, equipo.nombre])));
    } catch {
      // Catálogo opcional: si falla, se mantienen las etiquetas por defecto del backend.
    }
  }

  async setFecha(value: string): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    const normalized = value || '';
    if (normalized === this.fecha()) {
      return;
    }
    this.fecha.set(normalized);
    await Promise.all([this.loadGroups(), this.loadMetricas(), this.load(0)]);
  }

  async showToday(): Promise<void> {
    await this.setFecha('');
  }

  async changePage(pageNumber: number): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    if (pageNumber === this.pageNumber()) {
      return;
    }
    await this.load(pageNumber);
  }

  async refresh(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    await Promise.all([this.loadGroups(), this.loadMetricas(), this.load(this.pageNumber())]);
  }

  stopRealtime(): void {
    this.realtimeSubscription.unsubscribe();
  }

  setLeadSearchDraft(value: string): void {
    this.leadSearchDraft.set(value);
  }

  async applyLeadSearch(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    const normalized = this.normalizeLeadSearch(this.leadSearchDraft());
    if (normalized === this.leadSearch()) {
      return;
    }
    this.leadSearch.set(normalized);
    this.leadSearchDraft.set(normalized);
    await Promise.all([this.loadGroups(), this.load(0)]);
  }

  async clearLeadSearch(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    if (!this.leadSearch() && !this.leadSearchDraft()) {
      return;
    }
    this.leadSearch.set('');
    this.leadSearchDraft.set('');
    await Promise.all([this.loadGroups(), this.load(0)]);
  }

  async setGroupingMode(mode: DailyLeadGroupMode | null | undefined): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    if (!mode || mode === this.groupingMode()) {
      return;
    }
    this.groupingMode.set(mode);
    this.selectedGroup.set(null);
    await this.load(0);
  }

  private startRealtime(): void {
    if (this.realtimeStarted) {
      return;
    }
    this.realtimeStarted = true;
    this.realtimeSubscription.add(
      this.realtimeService.watchTopic('/topic/leads').subscribe({
        next: (event) => {
          if (event.tipo === 'CAMPANA_CORREGIDA') {
            void this.refresh();
          }
        },
        error: () => undefined
      })
    );
  }

  async selectGroup(group: DailyLeadGroupItem | null | undefined): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    if (!group || this.isGroupSelected(group)) {
      return;
    }
    this.selectedGroup.set(group);
    await this.load(0);
  }

  async clearSelectedGroup(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    if (!this.selectedGroup()) {
      return;
    }
    this.selectedGroup.set(null);
    await this.load(0);
  }

  async setSortField(field: DailyLeadSortField | null | undefined): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    if (!field || field === this.sortField()) {
      return;
    }
    this.sortField.set(field);
    this.sortDirection.set(this.defaultSortDirection(field));
    await this.load(0);
  }

  async setSortDirection(direction: DailyLeadSortDirection | null | undefined): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    if (!direction || direction === this.sortDirection()) {
      return;
    }
    this.sortDirection.set(direction);
    await this.load(0);
  }

  async changeColumnSort(field: DailyLeadSortField): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    const defaultDirection = this.defaultSortDirection(field);
    if (this.sortField() !== field) {
      this.sortField.set(field);
      this.sortDirection.set(defaultDirection);
    } else if (this.sortDirection() === defaultDirection) {
      this.sortDirection.set(defaultDirection === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set('createdAt');
      this.sortDirection.set('desc');
    }
    await this.load(0);
  }

  sortActive(field: DailyLeadSortField): boolean {
    return this.sortField() === field;
  }

  sortIcon(field: DailyLeadSortField): string {
    if (this.sortField() !== field) {
      return 'pi pi-sort-alt';
    }
    return this.sortDirection() === 'asc' ? 'pi pi-sort-amount-up-alt' : 'pi pi-sort-amount-down';
  }

  sortLabel(field: DailyLeadSortField, label: string): string {
    if (this.sortField() !== field) {
      return `Ordenar por ${label}`;
    }
    if (this.sortDirection() === this.defaultSortDirection(field)) {
      return `Orden activo por ${label}. Presiona para invertir.`;
    }
    return `Orden activo por ${label}. Presiona para volver al orden inicial.`;
  }

  isGroupSelected(group: DailyLeadGroupItem): boolean {
    const selected = this.selectedGroup();
    return !!selected && this.groupKey(selected) === this.groupKey(group);
  }

  groupKey(group: DailyLeadGroupItem): string {
    if (group.sinValor) {
      return `${this.groupingMode()}:SIN_VALOR`;
    }
    if (group.idGrupo !== null && group.idGrupo !== undefined) {
      return `${this.groupingMode()}:ID:${group.idGrupo}`;
    }
    return `${this.groupingMode()}:TIP:${group.codigoTipificacion ?? ''}:SUB:${group.codigoSubtipificacion ?? ''}`;
  }

  async openEventHistory(row: DailyLeadRowView): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    this.activeHistoryLead.set(row);
    this.eventRows.set([]);
    this.isLoadingEvents.set(true);
    this.errorMessage.set('');
    try {
      const page = await firstValueFrom(
        this.service.listarEventosLead(row.idLead, this.selectedHistoryDate(), {
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

  canUseRowActions(row: DailyLeadRowView): boolean {
    if (
      !row ||
      row.isPlaceholder ||
      !this.canDisplayOperationalData() ||
      row.idEquipo === null ||
      row.idEquipo === undefined
    ) {
      return false;
    }
    const role = this.session.primaryRole();
    return (role === 'ASESOR_GTR' || role === 'SUPERVISOR_GTR') && this.canMutateOperationalData();
  }

  rowActionTooltip(row: DailyLeadRowView): string {
    if (row.isPlaceholder) {
      return '';
    }
    const role = this.session.primaryRole();
    if (role !== 'ASESOR_GTR' && role !== 'SUPERVISOR_GTR') {
      return 'Disponible solo para GTR.';
    }
    if (!this.canMutateOperationalData()) {
      return 'Marca ONLINE para gestionar.';
    }
    if (row.idEquipo === null || row.idEquipo === undefined) {
      return 'No se pudo identificar el equipo del lead.';
    }
    return '';
  }

  async openAssignment(row: DailyLeadRowView): Promise<void> {
    if (!this.canUseRowActions(row)) {
      return;
    }
    const lead = this.toGtrLead(row);
    if (lead.idEquipo === null || lead.idEquipo === undefined) {
      this.errorMessage.set('No se pudo identificar el equipo del lead.');
      return;
    }

    this.clearMessages();
    this.assignmentForm.reset({ idAsesorAsignado: 0 });
    this.selectedAssignmentAdvisorId.set(0);
    this.pendingReassignment.set(null);
    this.activeAssignmentLead.set(lead);
    this.activeDialog.set('assign');
    await this.refreshAdvisorsForTeam(lead.idEquipo);
  }

  openSnapshot(row: DailyLeadRowView): void {
    if (!this.canUseRowActions(row)) {
      return;
    }
    const lead = this.toGtrLead(row);
    this.clearMessages();
    this.activeSnapshotLead.set(lead);
    this.snapshotPhoneEditorOpen.set(false);
    this.snapshotForm.reset({
      idLead: lead.id,
      prefijo: lead.prefijo || PERU_PHONE_PREFIX,
      lead: lead.lead || '',
      usermeta: lead.usermeta || '',
      numeroDocumentoTitularServicio: lead.numeroDocumentoTitularServicio || '',
      direccion: lead.direccionSnapshot || ''
    });
    this.updateSnapshotLeadValidation(lead.prefijo || PERU_PHONE_PREFIX);
    this.activeDialog.set('snapshot');
  }

  changeAssignmentAdvisor(advisorId: number | null): void {
    this.selectedAssignmentAdvisorId.set(advisorId ?? 0);
    this.pendingReassignment.set(null);
    this.clearMessages();
  }

  closeDialog(): void {
    this.activeDialog.set(null);
    this.activeAssignmentLead.set(null);
    this.activeSnapshotLead.set(null);
    this.pendingReassignment.set(null);
    this.pendingTakeover.set(null);
    this.assignmentForm.reset({ idAsesorAsignado: 0 });
    this.selectedAssignmentAdvisorId.set(0);
    this.snapshotForm.reset({
      idLead: 0,
      prefijo: PERU_PHONE_PREFIX,
      lead: '',
      usermeta: '',
      numeroDocumentoTitularServicio: '',
      direccion: ''
    });
    this.snapshotPhoneEditorOpen.set(false);
  }

  async submitAssignment(): Promise<void> {
    const row = this.activeAssignmentLead();
    if (!row) {
      this.errorMessage.set('Selecciona un lead.');
      return;
    }
    await this.assignOne(row);
  }

  async assignOne(row: LeadGtrResponse, confirmarReasignacion = false, confirmarGestionPrevia = false): Promise<void> {
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
      await this.refresh();
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

  async saveSnapshot(): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }
    this.snapshotForm.updateValueAndValidity();
    if (this.snapshotForm.invalid) {
      this.snapshotForm.markAllAsTouched();
      this.errorMessage.set('Revisa los datos antes de guardar.');
      return;
    }

    const raw = this.snapshotForm.getRawValue();
    const idLead = Number(raw.idLead);
    const prefijo = (raw.prefijo ?? '').trim();
    const lead = (raw.lead ?? '').trim();
    const usermeta = (raw.usermeta ?? '').trim();
    const numeroDocumentoTitularServicio = (raw.numeroDocumentoTitularServicio ?? '').trim();
    const direccion = (raw.direccion ?? '').trim();
    const selected = this.selectedSnapshotLead();

    if (!idLead || !selected) {
      this.errorMessage.set('Selecciona un lead.');
      return;
    }

    const identityChanged =
      prefijo !== (selected.prefijo ?? '') ||
      lead !== (selected.lead ?? '') ||
      usermeta !== (selected.usermeta ?? '');
    const snapshotChanged =
      numeroDocumentoTitularServicio !== (selected.numeroDocumentoTitularServicio ?? '') ||
      direccion !== (selected.direccionSnapshot ?? '');

    if (!identityChanged && !snapshotChanged) {
      this.errorMessage.set('No hay cambios para guardar.');
      return;
    }

    this.isSavingSnapshot.set(true);
    this.clearMessages();
    try {
      if (identityChanged) {
        await firstValueFrom(
          this.preventaService.completarIdentidadLead(idLead, {
            prefijo: prefijo || null,
            lead: lead || null,
            usermeta: usermeta || null
          })
        );
      }
      if (snapshotChanged) {
        await firstValueFrom(
          this.preventaService.actualizarSnapshotsLead(idLead, {
            numeroDocumentoTitularServicio: numeroDocumentoTitularServicio || null,
            direccion: direccion || null
          })
        );
      }
      this.successMessage.set(this.snapshotSuccessMessage(identityChanged, snapshotChanged));
      this.closeDialog();
      await this.refresh();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo guardar la informacion del lead.'));
    } finally {
      this.isSavingSnapshot.set(false);
    }
  }

  async takeSnapshotLead(confirmarReasignacion = false, confirmarGestionPrevia = false): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }
    const row = this.selectedSnapshotLead();
    if (!row) {
      this.errorMessage.set('Selecciona un lead.');
      return;
    }

    this.isSaving.set(true);
    this.clearMessages();
    try {
      await firstValueFrom(
        this.preventaService.tomarGestionGtr(row.id, {
          confirmarReasignacion,
          confirmarGestionPrevia
        })
      );
      this.successMessage.set(`Gestion tomada para ${this.leadIdentity(row)}.`);
      this.closeDialog();
      await this.refresh();
    } catch (error) {
      if (this.openTakeoverConfirmation(error, row)) {
        return;
      }
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo tomar la gestion del lead.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async confirmTakeover(): Promise<void> {
    const pending = this.pendingTakeover();
    if (!pending) {
      return;
    }
    await this.takeSnapshotLead(pending.requiresReassignment, pending.requiresPreviousManagement);
  }

  cancelTakeover(): void {
    this.pendingTakeover.set(null);
    this.activeDialog.set('snapshot');
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
  }

  normalizeSnapshotLeadNumber(value: string | null | undefined): void {
    const normalized = this.normalizePhoneInput(value);
    if (this.snapshotForm.controls.lead.value !== normalized) {
      this.snapshotForm.controls.lead.setValue(normalized);
    }
  }

  normalizeSnapshotUsermeta(value: string | null | undefined): void {
    const normalized = normalizeUsermeta(value);
    if (this.snapshotForm.controls.usermeta.value !== normalized) {
      this.snapshotForm.controls.usermeta.setValue(normalized);
    }
  }

  normalizeSnapshotDocumentNumber(value: string | null | undefined): void {
    const normalized = (value ?? '').replace(/\D/g, '').slice(0, 11);
    if (this.snapshotForm.controls.numeroDocumentoTitularServicio.value !== normalized) {
      this.snapshotForm.controls.numeroDocumentoTitularServicio.setValue(normalized);
    }
  }

  snapshotIdentityErrorMessage(): string | null {
    const leadControl = this.snapshotForm.controls.lead;
    if (leadControl.invalid && (leadControl.touched || leadControl.dirty)) {
      return this.snapshotForm.controls.prefijo.value === PERU_PHONE_PREFIX
        ? 'El numero debe tener 9 digitos.'
        : 'El numero debe tener entre 6 y 15 digitos.';
    }
    return null;
  }

  hasLeadChat(row: { prefijo?: string | null; lead?: string | null; usermeta?: string | null }): boolean {
    return !!buildWhatsAppUrl(row.prefijo, row.lead, row.usermeta);
  }

  openWhatsAppChat(row: { prefijo?: string | null; lead?: string | null; usermeta?: string | null }): void {
    const url = buildWhatsAppUrl(row.prefijo, row.lead, row.usermeta);
    if (!url) {
      this.errorMessage.set('El lead no tiene telefono ni usermeta para abrir WhatsApp.');
      return;
    }
    this.document.defaultView?.open(url, '_blank', 'noopener,noreferrer');
  }

  showCallError(message: string): void {
    this.errorMessage.set(message);
  }

  closeEventHistory(): void {
    this.activeHistoryLead.set(null);
    this.eventRows.set([]);
    this.isLoadingEvents.set(false);
  }

  isRegistrosExpanded(idLead: number): boolean {
    return !!this.expandedRowKeys()[idLead];
  }

  /** Despliega/colapsa los registros repetidos del lead (los que no son el registro inicial del día). */
  async toggleRegistros(row: DailyLeadRowView): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    const id = row.idLead;
    const keys = { ...this.expandedRowKeys() };

    if (keys[id]) {
      delete keys[id];
      this.expandedRowKeys.set(keys);
      return;
    }

    keys[id] = true;
    this.expandedRowKeys.set(keys);

    if (this.registrosByLead()[id]) {
      return;
    }

    this.loadingRegistrosLeadId.set(id);
    try {
      const registros = await firstValueFrom(
        this.service.listarRegistrosDiariosDeLead(id, this.fecha() || undefined)
      );
      // El primer registro (más temprano) es la fila principal; el despliegue muestra los demás.
      const otros = registros.slice(1).map((registro) => this.toRegistroView(registro));
      this.registrosByLead.update((current) => ({ ...current, [id]: otros }));
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar los registros del lead.'));
      const revert = { ...this.expandedRowKeys() };
      delete revert[id];
      this.expandedRowKeys.set(revert);
    } finally {
      this.loadingRegistrosLeadId.set(null);
    }
  }

  private toRegistroView(registro: RegistroDiarioLeadResponse): DailyLeadRegistroView {
    return {
      hora: this.formatTime(registro.createdAt ?? ''),
      asesor: this.firstWords(registro.nombreActor?.trim() || '-', 2),
      campana: registro.nombreCampana?.trim() || 'Sin campaña'
    };
  }

  eventSummary(evento: EventoResponse): string {
    const accion = (evento.accion ?? '').toUpperCase();
    const tipificacion = evento.tipificacion?.trim() || null;
    const subtipificacion = evento.subtipificacion?.trim() || null;
    const tipParts = [tipificacion, subtipificacion].filter(Boolean);

    if (accion === 'TIPIFICACION') {
      return tipParts.length ? tipParts.join(' / ') : '-';
    }

    if (accion === 'ASIGNACION') {
      return evento.nombreAsesorAsignado?.trim() || 'Sin asesor asignado';
    }

    if (tipParts.length) {
      return tipParts.join(' / ');
    }

    if (accion === 'REGISTRO' || accion === 'REGISTRO_MASIVO') {
      return this.activeHistoryLead()?.campana ?? '-';
    }

    return '-';
  }

  display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  }

  isOjtAdvisor(advisor: Pick<AdvisorOption, 'roles'>): boolean {
    return advisor.roles?.includes('OJT') ?? false;
  }

  advisorSeverity(disponibilidad?: string | null): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (disponibilidad) {
      case 'DISPONIBLE':
        return 'success';
      case 'CON_LEADS':
      case 'GESTIONANDO':
        return 'info';
      case 'SIN_GESTIONAR':
      case 'OCUPADO':
        return 'warn';
      case 'SATURADO':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  private async load(pageNumber: number): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const page = await firstValueFrom(
        this.service.listarRegistrosDiarios({
          fecha: this.fecha() || undefined,
          lead: this.leadSearch() || undefined,
          pageNumber,
          pageSize: this.pageSize(),
          filters: this.currentGroupFilter(),
          sortBy: this.sortField(),
          direction: this.sortDirection()
        })
      );
      this.pageNumber.set(page.page);
      this.visibleTotalElements.set(page.totalElements);
      if (!this.selectedGroup()) {
        this.totalElements.set(page.totalElements);
      }
      // Al recargar la página/filtro, colapsamos y descartamos expansiones previas.
      this.expandedRowKeys.set({});
      this.registrosByLead.set({});
      this.loadingRegistrosLeadId.set(null);
      this.rows.set(page.content.map((item) => this.toRowView(item)));
    } catch (error) {
      this.errorMessage.set(
        this.getErrorMessage(error, 'No se pudieron cargar los leads del día.')
      );
      this.rows.set([]);
      this.visibleTotalElements.set(0);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadMetricas(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.metricas.set(null);
      this.metricasPorEquipo.set([]);
      return;
    }
    try {
      const [metricas, metricasPorEquipo] = await Promise.all([
        firstValueFrom(this.service.obtenerMetricas(this.fecha() || undefined)),
        firstValueFrom(this.service.obtenerMetricasPorEquipo(this.fecha() || undefined))
      ]);
      this.metricas.set(metricas);
      this.metricasPorEquipo.set(metricasPorEquipo);
    } catch {
      // Métricas opcionales: si fallan, la barra se oculta y la tabla sigue funcionando.
      this.metricas.set(null);
      this.metricasPorEquipo.set([]);
    }
  }

  private currentMetricas(): LeadsDiariosMetricas | null {
    const group = this.selectedGroup();
    if (this.groupingMode() !== 'EQUIPO' || !group) {
      return this.metricas();
    }
    if (group.sinValor) {
      return this.metricasPorEquipo().find((metricas) => metricas.idEquipo === null) ?? this.emptyMetricas();
    }
    if (group.idGrupo === null || group.idGrupo === undefined) {
      return this.emptyMetricas();
    }
    return this.metricasPorEquipo().find((metricas) => metricas.idEquipo === group.idGrupo) ?? this.emptyMetricas();
  }

  private emptyMetricas(): LeadsDiariosMetricas {
    return {
      registros: 0,
      leadsUnicos: 0,
      leadsRepetidos: 0,
      leadsTipificados: 0,
      bloqueOrden1: 0,
      bloqueOrden2: 0,
      bloqueOrden3: 0,
      leadsVentaCerrada: 0
    };
  }

  private emptyGroups(): DailyLeadGroupsResponse {
    return {
      asesores: [],
      campanas: [],
      equipos: [],
      primerasTipificaciones: [],
      mayoresTipificaciones: [],
      ultimasTipificaciones: []
    };
  }

  private clearOperationalData(): void {
    this.rows.set([]);
    this.metricas.set(null);
    this.metricasPorEquipo.set([]);
    this.totalElements.set(0);
    this.visibleTotalElements.set(0);
    this.totalRegistros.set(0);
    this.expandedRowKeys.set({});
    this.registrosByLead.set({});
    this.loadingRegistrosLeadId.set(null);
    this.eventRows.set([]);
    this.activeHistoryLead.set(null);
    this.groups.set(this.emptyGroups());
    this.isLoading.set(false);
    this.isLoadingGroups.set(false);
    this.isLoadingEvents.set(false);
    this.isLoadingAdvisors.set(false);
    this.isSaving.set(false);
    this.isSavingSnapshot.set(false);
    this.errorMessage.set('');
    this.successMessage.set(null);
    this.activeDialog.set(null);
    this.activeAssignmentLead.set(null);
    this.activeSnapshotLead.set(null);
    this.pendingReassignment.set(null);
    this.pendingTakeover.set(null);
    this.advisors.set([]);
  }

  private async loadGroups(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.groups.set(this.emptyGroups());
      this.totalElements.set(0);
      this.totalRegistros.set(0);
      return;
    }
    this.isLoadingGroups.set(true);
    try {
      const groups = await firstValueFrom(
        this.service.listarAgrupacionesRegistrosDiarios(this.fecha() || undefined, this.leadSearch() || undefined)
      );
      this.groups.set(groups);
      // Leads únicos del día = suma de la agrupación por asesor (un representante por lead).
      this.totalElements.set(groups.asesores.reduce((total, group) => total + group.cantidad, 0));
      this.totalRegistros.set(groups.totalRegistros ?? 0);
    } catch (error) {
      this.errorMessage.set(
        this.getErrorMessage(error, 'No se pudieron actualizar las agrupaciones.')
      );
    } finally {
      this.isLoadingGroups.set(false);
    }
  }

  private currentGroupFilter(): DailyLeadGroupFilter {
    const mode = this.groupingMode();
    const group = this.selectedGroup();
    if (mode === 'SIN_AGRUPAR' || !group) {
      return {};
    }

    const filter: DailyLeadGroupFilter = {
      tipoGrupo: mode,
      sinValor: group.sinValor
    };
    if (group.idGrupo !== null && group.idGrupo !== undefined) {
      filter.idGrupo = group.idGrupo;
    }
    if (group.codigoTipificacion) {
      filter.codigoTipificacion = group.codigoTipificacion;
    }
    if (group.codigoSubtipificacion) {
      filter.codigoSubtipificacion = group.codigoSubtipificacion;
    }
    return filter;
  }

  private toRowView(item: LeadDiarioResponse): DailyLeadRowView {
    const asesor = item.nombreActor?.trim() || '-';
    const ultimoAsesor = item.ultimoNombreAsesorAsignado?.trim() || 'Sin Gestion';
    const ultimaAsignacion = item.ultimoNombreAsesorAsignacion?.trim() || 'Sin asignacion';
    return {
      idLead: item.idLead,
      idEquipo: item.idEquipo,
      prefijo: item.prefijo,
      lead: item.lead,
      usermeta: item.usermeta,
      leadDisplay: this.formatLead(item),
      asesor,
      asesorDisplay: this.firstWords(asesor, 2),
      rolLabel: formatLabel(item.rolActor),
      accionLabel: formatLabel(item.accion),
      createdAt: item.createdAt,
      hora: this.formatTime(item.createdAt),
      campana: item.nombreCampana?.trim() || 'Sin campaña',
      ultimoAsesor,
      ultimoAsesorDisplay: this.firstWords(ultimoAsesor, 2),
      ultimaAsignacion,
      ultimaAsignacionDisplay: this.firstWords(ultimaAsignacion, 2),
      totalAsignacionesDia: item.totalAsignacionesHoyPreventa ?? item.totalAsignacionesDia ?? 0,
      totalAsignacionesPreventa: item.totalAsignacionesPreventa ?? item.totalAsignacionesDia ?? 0,
      totalAsignacionesHoyPreventa: item.totalAsignacionesHoyPreventa ?? item.totalAsignacionesDia ?? 0,
      totalRegistrosDia: item.totalRegistrosDia ?? 1,
      primeraCodigoTipificacion: item.primeraCodigoTipificacion,
      primeraCodigoSubtipificacion: item.primeraCodigoSubtipificacion,
      mayorRangoCodigoTipificacion: item.mayorRangoCodigoTipificacion,
      mayorRangoCodigoSubtipificacion: item.mayorRangoCodigoSubtipificacion,
      codigoTipificacion: item.codigoTipificacion,
      codigoSubtipificacion: item.codigoSubtipificacion
    };
  }

  private formatLead(item: Pick<LeadDiarioResponse, 'prefijo' | 'lead' | 'usermeta'>): string {
    return item.lead?.trim() || formatLeadIdentity(item);
  }

  private formatTime(value: string): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }
    return this.timeFormatter.format(date);
  }

  private firstWords(value: string, count: number): string {
    if (!value || value === '-') {
      return value || '-';
    }
    return value.split(/\s+/).filter(Boolean).slice(0, count).join(' ') || '-';
  }

  private placeholderRow(index: number): DailyLeadRowView {
    return {
      idLead: -(index + 1),
      idEquipo: null,
      prefijo: null,
      lead: null,
      usermeta: null,
      leadDisplay: '',
      asesor: '',
      asesorDisplay: '',
      rolLabel: '',
      accionLabel: '',
      createdAt: '',
      hora: '',
      campana: '',
      ultimoAsesor: '',
      ultimoAsesorDisplay: '',
      ultimaAsignacion: '',
      ultimaAsignacionDisplay: '',
      totalAsignacionesDia: 0,
      totalAsignacionesPreventa: 0,
      totalAsignacionesHoyPreventa: 0,
      totalRegistrosDia: 1,
      isPlaceholder: true
    };
  }

  private normalizeLeadSearch(value: string): string {
    return value.replace(/\s+/g, '').trim();
  }

  private toGtrLead(row: DailyLeadRowView): LeadGtrResponse {
    return {
      id: row.idLead,
      idEquipo: row.idEquipo,
      createdAt: row.createdAt,
      lastEntryAt: row.createdAt,
      prefijo: row.prefijo,
      lead: row.lead,
      usermeta: row.usermeta,
      nombreCampana: row.campana,
      nombreAsesorAsignado: row.ultimoAsesor && row.ultimoAsesor !== 'Sin Gestion' ? row.ultimoAsesor : null,
      primeraCodigoTipificacion: row.primeraCodigoTipificacion,
      primeraCodigoSubtipificacion: row.primeraCodigoSubtipificacion,
      mayorRangoCodigoTipificacion: row.mayorRangoCodigoTipificacion,
      mayorRangoCodigoSubtipificacion: row.mayorRangoCodigoSubtipificacion,
      codigoTipificacion: row.codigoTipificacion,
      codigoSubtipificacion: row.codigoSubtipificacion,
      totalAsignaciones: row.totalAsignacionesDia,
      totalAsignacionesPreventa: row.totalAsignacionesPreventa,
      totalAsignacionesHoyPreventa: row.totalAsignacionesHoyPreventa,
      etapa: 'PREVENTA'
    };
  }

  leadIdentity(row: Pick<LeadGtrResponse, 'prefijo' | 'lead' | 'usermeta' | 'id'>): string {
    const identity = formatLeadIdentity(row);
    return identity || `Lead ${row.id}`;
  }

  private async refreshAdvisorsForTeam(idEquipo: number): Promise<void> {
    this.isLoadingAdvisors.set(true);
    try {
      const activeUsers = await firstValueFrom(this.preventaService.listarAsesoresPreventaPorEquipo(idEquipo));
      let connectedUsers: ConnectedUserResponse[] = [];
      try {
        const [asesores, supervisores, ojt] = await Promise.all([
          firstValueFrom(this.presenceService.listarUsuariosConectados('ASESOR_VENTAS')),
          firstValueFrom(this.presenceService.listarUsuariosConectados('SUPERVISOR_VENTAS')),
          firstValueFrom(this.presenceService.listarUsuariosConectados('OJT'))
        ]);
        connectedUsers = this.mergePorEmpleado(asesores, supervisores, ojt);
      } catch {
        connectedUsers = [];
      }

      let monitorUsers: AsesorGtrPresenceResponse[] = [];
      try {
        monitorUsers = await firstValueFrom(this.presenceService.listarAsesoresConectadosGtr(this.localToday()));
      } catch {
        monitorUsers = [];
      }

      this.advisors.set(this.mapAdvisorOptions(activeUsers, connectedUsers, monitorUsers, idEquipo));
    } catch (error) {
      this.advisors.set([]);
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar la lista de asesores.'));
    } finally {
      this.isLoadingAdvisors.set(false);
    }
  }

  private mapAdvisorOptions(
    activeUsers: UsuarioResponse[],
    connectedUsers: ConnectedUserResponse[],
    monitorUsers: AsesorGtrPresenceResponse[],
    idEquipo: number
  ): AdvisorOption[] {
    const connectedById = new Map(connectedUsers.map((advisor) => [advisor.empleadoId, advisor]));
    const monitorById = new Map(monitorUsers.map((advisor) => [advisor.empleadoId, advisor]));
    return activeUsers
      .map((user) => {
        const presence = connectedById.get(user.empleadoId);
        const monitor = monitorById.get(user.empleadoId);
        const equipoIds = user.equipoIds?.length ? user.equipoIds : [idEquipo];
        return {
          empleadoId: user.empleadoId,
          nombreCompleto: user.nombreCompleto,
          roles: user.roles ?? presence?.roles ?? [],
          equipoIds,
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
          left.nombreCompleto.localeCompare(right.nombreCompleto)
      );
  }

  private mergePorEmpleado<T extends { empleadoId: number }>(...lists: T[][]): T[] {
    const porId = new Map<number, T>();
    for (const item of lists.flat()) {
      porId.set(item.empleadoId, item);
    }
    return [...porId.values()];
  }

  private async ensureAdvisorConnected(advisor: AdvisorOption): Promise<boolean> {
    try {
      const status = await firstValueFrom(this.presenceService.estaConectado(advisor.empleadoId));
      if (status.conectado) {
        return true;
      }
      this.markAdvisorDisconnected(advisor.empleadoId);
      this.errorMessage.set(`${advisor.nombreCompleto} ya no tiene presencia activa. Actualiza y selecciona otro asesor.`);
      return false;
    } catch (error) {
      this.markAdvisorDisconnected(advisor.empleadoId);
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo validar la presencia del asesor.'));
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
    if (this.normalizeLookup(currentAdvisorName) === this.normalizeLookup(advisor.nombreCompleto)) {
      this.errorMessage.set(`El Lead ya esta asignado a ${advisor.nombreCompleto}.`);
      return true;
    }
    return false;
  }

  private openReassignmentConfirmation(error: unknown, row: LeadGtrResponse, advisor: AdvisorOption): boolean {
    const details = this.getAssignmentConflictDetails(error);
    if (!details) {
      return false;
    }
    this.errorMessage.set('');
    this.pendingReassignment.set({
      row,
      advisor,
      currentAdvisorName: details.currentAdvisorName,
      requiresInManagement: details.requiresInManagement,
      requiresReassignment: details.requiresReassignment,
      requiresPreviousManagement: details.requiresPreviousManagement,
      previousManagementAt: details.previousManagementAt
    });
    this.activeDialog.set('reassign-confirm');
    return true;
  }

  private openTakeoverConfirmation(error: unknown, row: LeadGtrResponse): boolean {
    const details = this.getAssignmentConflictDetails(error);
    if (!details) {
      return false;
    }
    this.errorMessage.set('');
    this.pendingTakeover.set({
      row,
      currentAdvisorName: details.currentAdvisorName,
      requiresInManagement: details.requiresInManagement,
      requiresReassignment: details.requiresReassignment,
      requiresPreviousManagement: details.requiresPreviousManagement,
      previousManagementAt: details.previousManagementAt
    });
    this.activeDialog.set('takeover-confirm');
    return true;
  }

  private getAssignmentConflictDetails(error: unknown): {
    currentAdvisorName: string;
    requiresInManagement: boolean;
    requiresReassignment: boolean;
    requiresPreviousManagement: boolean;
    previousManagementAt?: string | null;
  } | null {
    if (!(error instanceof HttpErrorResponse) || error.status !== 409) {
      return null;
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
      return null;
    }

    return {
      currentAdvisorName: details?.nombreAsesorActual || 'otro asesor',
      requiresInManagement,
      requiresReassignment,
      requiresPreviousManagement,
      previousManagementAt: details?.ultimaGestionAt ?? null
    };
  }

  private updateSnapshotLeadValidation(prefijo?: string | null): void {
    const leadControl = this.snapshotForm.controls.lead;
    const isPeruPrefix = prefijo === PERU_PHONE_PREFIX;
    this.snapshotNumberMaxLength.set(isPeruPrefix ? 9 : 15);
    leadControl.setValidators([Validators.pattern(isPeruPrefix ? PERU_LEAD_PATTERN : INTERNATIONAL_LEAD_PATTERN)]);
    leadControl.updateValueAndValidity({ emitEvent: false });
    this.snapshotForm.updateValueAndValidity({ emitEvent: false });
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

  private ensureCanMutate(): boolean {
    if (this.canUseGtrActions()) {
      return true;
    }
    this.errorMessage.set('Marca ONLINE para realizar esta accion.');
    return false;
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set(null);
  }

  private normalizeLookup(value?: string | null): string {
    return (value ?? '').trim().toUpperCase();
  }

  private normalizePhoneInput(value?: string | null): string {
    return (value ?? '').replace(/\D/g, '');
  }

  private hasLeadPhone(row: { prefijo?: string | null; lead?: string | null }): boolean {
    return !!row.prefijo && !!row.lead;
  }

  private async loadTipificationPalette(): Promise<void> {
    try {
      const catalogResults = await Promise.allSettled([
        firstValueFrom(this.service.getCatalogoAgregado('PREVENTA')),
        firstValueFrom(this.service.getCatalogoAgregado('VENTA')),
        firstValueFrom(this.service.getCatalogoAgregado('POSTVENTA'))
      ]);
      const paletteByCode: TipificationPaletteByCode = {};

      for (const result of catalogResults) {
        if (result.status !== 'fulfilled') {
          continue;
        }

        const catalog = result.value;
        for (const tipificacion of catalog.tipificaciones ?? []) {
          paletteByCode[tipificacion.codigo.toUpperCase()] = this.tipificacionPaletteIndex(tipificacion.orden);
        }
      }

      this.tipificationPaletteByCode.set(paletteByCode);
    } catch {
      this.tipificationPaletteByCode.set({});
    }
  }

  private tipificacionPaletteIndex(orden: number): number {
    const totalPalettes = 8;
    if (!Number.isFinite(orden) || orden <= 0) {
      return 0;
    }
    return (orden - 1) % totalPalettes;
  }

  private defaultSortDirection(field: DailyLeadSortField): DailyLeadSortDirection {
    return field === 'createdAt' || field === 'totalAsignacionesHoyPreventa' ? 'desc' : 'asc';
  }

  private selectedHistoryDate(): string {
    return this.fecha() || this.localToday();
  }

  private localToday(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const message = (error.error as { message?: string } | null)?.message;
      if (message) {
        return message;
      }
      if (error.status === 403) {
        return 'No tienes acceso a esta información.';
      }
    }
    return fallback;
  }
}
