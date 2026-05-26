import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import {
  AsesorGtrPresenceResponse,
  ConnectedUserResponse,
  PresenceService
} from '../../../core/services/presence.service';
import { AttendanceRealtimeService } from '../../../core/services/attendance-realtime.service';
import { PresenceRealtimeService } from '../../../core/services/presence-realtime.service';
import { UsuarioResponse } from '../../../shared/models/auth/usuario-response';
import { PresenceRealtimeEvent } from '../../../shared/models/gateway/presence-realtime-event';
import {
  CampanaResponse,
  Etapa,
  EventoResponse,
  LeadAgendadoGtrResponse,
  LeadGtrResponse,
  LeadGtrMetricasResponse,
  MasivoLeadFilters,
  PageQuery
} from '../../../shared/models/preventa/preventa.models';
import { LeadRealtimeService } from '../../preventa/services/lead-realtime.service';
import { PreventaLeadService } from '../../preventa/services/preventa-lead.service';

type VisualLeadGtr = LeadGtrResponse & { isNew?: boolean };
type VisualLeadAgendadoGtr = LeadAgendadoGtrResponse & { isNew?: boolean };
export type GtrSection = 'plataforma' | 'agendados' | 'historicos';

type SelectOption<T> = {
  label: string;
  value: T;
};

type SubtipificacionSelectOption = SelectOption<number> & {
  idTipificacion: number;
};

type TipificacionVisualMeta = {
  orden: number;
  paletteIndex: number;
};

type AgendadoGroup = {
  key: string;
  label: string;
  rows: VisualLeadAgendadoGtr[];
};

type AdvisorOption = {
  empleadoId: number;
  nombreCompleto: string;
  connected: boolean;
  operativo: boolean;
  disponibilidad?: string | null;
  estadoSchedule?: string | null;
  esperadoHoy?: boolean;
  lastSeen?: string | null;
};

type GtrDialog = 'lead' | 'snapshot' | 'assign' | 'events' | null;
type EventAnomalyFilter = 'multiple-records' | 'same-campaign' | null;

type LoadError = {
  label: string;
  message: string;
};

@Injectable()
export class GtrWorkspaceFacade {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly preventaService = inject(PreventaLeadService);
  private readonly realtimeService = inject(LeadRealtimeService);
  private readonly attendanceRealtimeService = inject(AttendanceRealtimeService);
  private readonly presenceService = inject(PresenceService);
  private readonly presenceRealtimeService = inject(PresenceRealtimeService);
  private readonly realtimeSubscription = new Subscription();
  private readonly newRowTimers = new Map<number, number>();
  private attendanceRefreshId: number | null = null;
  private started = false;

  readonly pageSize = 12;
  readonly today = this.formatLocalDate(new Date());
  readonly todayLabel = this.formatReadableDate(new Date());
  readonly section = signal<GtrSection>('plataforma');
  readonly isLoading = signal(false);
  readonly isReconciling = signal(false);
  readonly isSaving = signal(false);
  readonly isSavingSnapshot = signal(false);
  readonly isLoadingAgendados = signal(false);
  readonly isLoadingMasivos = signal(false);
  readonly isLoadingEvents = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly rows = signal<VisualLeadGtr[]>([]);
  readonly agendadosRows = signal<VisualLeadAgendadoGtr[]>([]);
  readonly masivoRows = signal<VisualLeadGtr[]>([]);
  readonly eventRows = signal<EventoResponse[]>([]);
  readonly selectedEventAnomalyFilter = signal<EventAnomalyFilter>(null);
  readonly metrics = signal<LeadGtrMetricasResponse>({
    nuevos: 0,
    sinGestionar: 0,
    gestionados: 0,
    preventas: 0
  });
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly pageNumber = signal(0);
  readonly agendadosTotalElements = signal(0);
  readonly agendadosTotalPages = signal(0);
  readonly agendadosPageNumber = signal(0);
  readonly masivoTotalElements = signal(0);
  readonly masivoTotalPages = signal(0);
  readonly masivoPageNumber = signal(0);
  readonly masivoSearched = signal(false);
  readonly selectedIds = signal<Set<number>>(new Set());
  readonly advisors = signal<AdvisorOption[]>([]);
  readonly campanas = signal<CampanaResponse[]>([]);
  readonly catalogoTipificaciones = signal<SelectOption<number>[]>([]);
  readonly catalogoSubtipificaciones = signal<SubtipificacionSelectOption[]>([]);
  readonly activeDialog = signal<GtrDialog>(null);
  readonly activeAssignmentLead = signal<LeadGtrResponse | null>(null);
  readonly activeEventsLead = signal<LeadGtrResponse | null>(null);
  readonly advisorsPanelOpen = signal(false);
  readonly baseOptions = ['WHATSAPP', 'MESSENGER', 'RECONTACTO', 'PREDICTIVO', 'REFERIDO', 'MASIVO'];

  readonly intakeForm = this.fb.group({
    prefijo: ['+51', [Validators.required, Validators.pattern(/^\+\d{2,3}$/)]],
    lead: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
    idCampana: [0, [Validators.required, Validators.min(1)]],
    base: ['WHATSAPP', [Validators.required]]
  });

  readonly assignmentForm = this.fb.group({
    idAsesorAsignado: [0, [Validators.required, Validators.min(1)]]
  });

  readonly snapshotForm = this.fb.group({
    idLead: [0, [Validators.required, Validators.min(1)]],
    numeroDocumentoTitularServicio: [''],
    direccion: ['']
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

  readonly agendadoGroups = computed<AgendadoGroup[]>(() => this.groupAgendados(this.agendadosRows()));
  readonly availableSubtipificaciones = computed(() => {
    const selected = new Set(this.masivoFiltersForm.controls.tipificaciones.value);
    if (!selected.size) {
      return this.catalogoSubtipificaciones();
    }
    return this.catalogoSubtipificaciones().filter((option) => selected.has(option.idTipificacion));
  });

  readonly sectionTitle = computed(() => {
    switch (this.section()) {
      case 'agendados':
        return 'Leads Agendados';
      case 'historicos':
        return 'Historicos';
      default:
        return 'Gestion de Leads';
    }
  });

  readonly sectionSubtitle = computed(() => {
    switch (this.section()) {
      case 'agendados':
        return 'Ordenados por hora programada';
      case 'historicos':
        return 'Busqueda de leads masivos';
      default:
        return this.todayLabel;
    }
  });

  readonly metricCards = computed(() => {
    const metrics = this.metrics();
    return [
      { label: 'Nuevos', value: metrics.nuevos, tone: 'blue' },
      { label: 'Sin Gestionar', value: metrics.sinGestionar, tone: 'amber' },
      { label: 'Gestionados', value: metrics.gestionados, tone: 'green' },
      { label: 'Preventas', value: metrics.preventas, tone: 'violet' }
    ];
  });

  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly selectedAdvisor = computed(() => {
    const advisorId = this.assignmentForm.controls.idAsesorAsignado.value;
    return this.advisors().find((advisor) => advisor.empleadoId === advisorId) ?? null;
  });
  readonly selectedSnapshotLead = computed(() => {
    const idLead = this.snapshotForm.controls.idLead.value;
    return this.rows().find((row) => row.id === idLead) ?? null;
  });

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  setSection(section: GtrSection): void {
    if (this.section() === section) {
      return;
    }
    this.section.set(section);
    this.selectedIds.set(new Set());
    if (this.started) {
      void this.initialize();
    }
  }

  start(): void {
    this.started = true;
    void this.initialize();
    this.startRealtime();
    this.document.defaultView?.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  stop(): void {
    this.started = false;
    this.realtimeSubscription.unsubscribe();
    this.stopAttendanceRefresh();
    this.document.defaultView?.removeEventListener('visibilitychange', this.handleVisibilityChange);

    for (const timerId of this.newRowTimers.values()) {
      window.clearTimeout(timerId);
    }
    this.newRowTimers.clear();
  }

  async initialize(): Promise<void> {
    this.isLoading.set(true);
    this.clearMessages();
    const errors: LoadError[] = [];
    const section = this.section();
    const sectionLoads: Array<[string, () => Promise<void>]> = [];

    if (section === 'plataforma') {
      sectionLoads.push(['bandeja diaria', () => this.refreshPage(false)]);
      sectionLoads.push(['metricas', () => this.refreshMetrics()]);
    }

    if (section === 'agendados') {
      sectionLoads.push(['agendados', () => this.refreshAgendados(false)]);
    }

    sectionLoads.push(['catalogo de tipificaciones', () => this.refreshCatalogoTipificaciones()]);

    try {
      await Promise.all([
        this.runInitialLoad('asesores', () => this.refreshAdvisors(), errors),
        this.runInitialLoad('campanas', () => this.refreshCampanas(), errors),
        ...sectionLoads.map(([label, load]) => this.runInitialLoad(label, load, errors))
      ]);

      if (errors.length) {
        this.errorMessage.set(
          `No se pudo cargar: ${errors.map((error) => `${error.label} (${error.message})`).join(', ')}.`
        );
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async submitIntake(): Promise<void> {
    if (this.intakeForm.invalid) {
      this.errorMessage.set('Completa prefijo, numero de 9 digitos, campana y base.');
      return;
    }

    this.isSaving.set(true);
    this.clearMessages();
    try {
      await firstValueFrom(this.preventaService.registrarIngresoLead(this.intakeForm.getRawValue()));
      this.intakeForm.controls.lead.reset('');
      this.successMessage.set('Lead ingresado. Completa snapshot desde la fila cuando aplique.');
      this.activeDialog.set(null);
      await this.reconcile();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo ingresar el lead.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  beginSnapshot(row: LeadGtrResponse): void {
    this.snapshotForm.reset({
      idLead: row.id,
      numeroDocumentoTitularServicio: row.numeroDocumentoTitularServicio ?? '',
      direccion: row.direccionSnapshot ?? ''
    });
  }

  openNewLead(): void {
    this.activeDialog.set('lead');
  }

  normalizeLeadNumber(value: string): void {
    const normalized = value.replace(/\D/g, '').slice(0, 9);
    if (this.intakeForm.controls.lead.value !== normalized) {
      this.intakeForm.controls.lead.setValue(normalized);
    }
  }

  openSnapshot(row: LeadGtrResponse): void {
    this.beginSnapshot(row);
    this.activeDialog.set('snapshot');
  }

  openWhatsAppChat(row: Pick<LeadGtrResponse, 'prefijo' | 'lead'>): void {
    const url = this.whatsAppUrl(row.prefijo, row.lead);
    if (!url) {
      this.errorMessage.set('El lead no tiene un numero valido para abrir WhatsApp.');
      return;
    }

    this.document.defaultView?.open(url, '_blank', 'noopener,noreferrer');
  }

  openAssignment(row?: LeadGtrResponse): void {
    this.activeAssignmentLead.set(row ?? null);
    this.activeDialog.set('assign');
  }

  async openEventHistory(row: LeadGtrResponse): Promise<void> {
    this.activeEventsLead.set(row);
    this.eventRows.set([]);
    this.selectedEventAnomalyFilter.set(null);
    this.activeDialog.set('events');
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

  openAgendadoAssignment(row: LeadAgendadoGtrResponse): void {
    this.openAssignment(this.mapAgendadoToLead(row));
  }

  closeDialog(): void {
    this.activeDialog.set(null);
    this.activeAssignmentLead.set(null);
    this.activeEventsLead.set(null);
    this.eventRows.set([]);
    this.selectedEventAnomalyFilter.set(null);
  }

  toggleAdvisorsPanel(): void {
    this.advisorsPanelOpen.update((isOpen) => !isOpen);
  }

  closeAdvisorsPanel(): void {
    this.advisorsPanelOpen.set(false);
  }

  cancelSnapshot(): void {
    this.snapshotForm.reset({
      idLead: 0,
      numeroDocumentoTitularServicio: '',
      direccion: ''
    });
  }

  async saveSnapshot(): Promise<void> {
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

  async assignOne(row: LeadGtrResponse): Promise<void> {
    const advisor = this.selectedAdvisor();
    if (!advisor) {
      this.errorMessage.set('Selecciona un asesor.');
      return;
    }

    if (!(await this.ensureAdvisorConnected(advisor))) {
      return;
    }

    this.isSaving.set(true);
    this.clearMessages();
    try {
      await firstValueFrom(
        this.preventaService.asignarLead(row.id, {
          idAsesorAsignado: advisor.empleadoId,
          nombreAsesorAsignado: advisor.nombreCompleto
        })
      );
      this.successMessage.set(`Lead ${row.lead} asignado a ${advisor.nombreCompleto}.`);
      this.closeDialog();
      await this.reconcile();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo asignar el lead.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async assignSelected(): Promise<void> {
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

  async refreshAdvisors(): Promise<void> {
    let activeUsers: UsuarioResponse[] = [];
    try {
      activeUsers = await firstValueFrom(this.preventaService.listarUsuariosActivosPorRol('ASESOR_VENTAS'));
    } catch (error) {
      this.advisors.set([]);
      throw new Error(this.getErrorMessage(error, 'catalogo de asesores activos'));
    }

    let connectedUsers: ConnectedUserResponse[] = [];
    try {
      connectedUsers = await firstValueFrom(this.presenceService.listarUsuariosConectados('ASESOR_VENTAS'));
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

  async nextPage(): Promise<void> {
    if (this.pageNumber() + 1 >= this.totalPages()) {
      return;
    }
    this.pageNumber.update((value) => value + 1);
    await this.refreshPage(false);
  }

  async previousPage(): Promise<void> {
    if (this.pageNumber() === 0) {
      return;
    }
    this.pageNumber.update((value) => value - 1);
    await this.refreshPage(false);
  }

  async changePage(pageNumber: number): Promise<void> {
    if (pageNumber === this.pageNumber()) {
      return;
    }
    this.pageNumber.set(pageNumber);
    await this.refreshPage(false);
  }

  async changeAgendadosPage(pageNumber: number): Promise<void> {
    if (pageNumber === this.agendadosPageNumber()) {
      return;
    }
    this.agendadosPageNumber.set(pageNumber);
    await this.refreshAgendados(false);
  }

  async buscarMasivos(): Promise<void> {
    this.clearMessages();
    this.masivoSearched.set(true);
    this.masivoPageNumber.set(0);
    await this.refreshMasivos();
  }

  async changeMasivoPage(pageNumber: number): Promise<void> {
    if (pageNumber === this.masivoPageNumber()) {
      return;
    }
    this.masivoPageNumber.set(pageNumber);
    await this.refreshMasivos();
  }

  clearMasivoFilters(): void {
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
  }

  onMasivoTipificacionesChange(): void {
    const selected = new Set(this.masivoFiltersForm.controls.tipificaciones.value);
    if (!selected.size) {
      return;
    }

    const validIds = new Set(
      this.catalogoSubtipificaciones().filter((option) => selected.has(option.idTipificacion)).map((option) => option.value)
    );
    this.masivoFiltersForm.controls.subtipificaciones.setValue(
      this.masivoFiltersForm.controls.subtipificaciones.value.filter((id) => validIds.has(id))
    );
  }

  toggleSelection(idLead: number, checked: boolean): void {
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

  display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
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

  eventSummary(evento: EventoResponse): string {
    const parts = [
      evento.tipificacion,
      evento.subtipificacion,
      evento.comentario,
      this.eventCampaignLabel(evento)
    ].filter(Boolean);
    return parts.length ? parts.join(' / ') : '-';
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
    const normalized = this.display(nombreProveedor).toUpperCase();
    if (normalized === 'WIN') {
      return '/provider-logos/WIN.png';
    }
    return null;
  }

  advisorDotClass(advisor: AdvisorOption): string {
    switch (advisor.disponibilidad) {
      case 'DISPONIBLE':
        return 'dot--available';
      case 'GESTIONANDO':
        return 'dot--working';
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

  private startRealtime(): void {
    this.realtimeSubscription.add(
      this.realtimeService.watchTopic('/topic/leads/etapa/PREVENTA').subscribe({
        next: (event) => {
          if (
            [
              'REGISTRO',
              'ASIGNACION',
              'CONTACTO',
              'SNAPSHOTS_ACTUALIZADOS',
              'DATOS_PREVENTA_ACTUALIZADOS',
              'DIRECCION_ACTUALIZADA',
              'TIPIFICACION'
            ].includes(event.tipo)
          ) {
            void this.reconcile();
          }
        },
        error: () => {
          this.errorMessage.set('Realtime no disponible. La bandeja sigue operando por REST.');
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
    if (this.document.visibilityState === 'visible') {
      void this.refreshAdvisors().catch(() => undefined);
    }
  };

  private scheduleAttendanceRefresh(): void {
    if (this.document.visibilityState === 'hidden') {
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
    if (this.isReconciling()) {
      return;
    }

    this.isReconciling.set(true);
    try {
      const section = this.section();
      await Promise.all([
        section === 'plataforma' ? this.refreshPage(true) : Promise.resolve(),
        section === 'plataforma' ? this.refreshMetrics() : Promise.resolve(),
        section === 'agendados' ? this.refreshAgendados(true) : Promise.resolve(),
        section === 'historicos' && this.masivoSearched() ? this.refreshMasivos() : Promise.resolve(),
        this.refreshAdvisors()
      ]);
    } finally {
      this.isReconciling.set(false);
    }
  }

  private async refreshPage(silent: boolean): Promise<void> {
    const previous = this.rows();
    const page = await firstValueFrom(this.preventaService.listarBandejaGtr(this.today, this.currentQuery(12)));
    this.totalElements.set(page.totalElements);
    this.totalPages.set(page.totalPages);
    this.rows.set(this.mergeVisualRows(previous, page.content, silent));
  }

  private async refreshAgendados(silent: boolean): Promise<void> {
    this.isLoadingAgendados.set(!silent);
    try {
      const previous = this.agendadosRows();
      const page = await firstValueFrom(
        this.preventaService.listarAgendadosGtr({
          pageNumber: this.agendadosPageNumber(),
          pageSize: this.pageSize,
          sortBy: 'horaProgramada',
          direction: 'asc'
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
    this.isLoadingMasivos.set(true);
    try {
      const page = await firstValueFrom(
        this.preventaService.listarLeadsMasivo(this.getMasivoFilters(), {
          pageNumber: this.masivoPageNumber(),
          pageSize: this.pageSize,
          sortBy: 'lastEntryAt',
          direction: 'desc'
        })
      );
      this.masivoTotalElements.set(page.totalElements);
      this.masivoTotalPages.set(page.totalPages);
      this.masivoRows.set(page.content);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo listar leads masivos.'));
    } finally {
      this.isLoadingMasivos.set(false);
    }
  }

  private async refreshMetrics(): Promise<void> {
    this.metrics.set(await firstValueFrom(this.preventaService.obtenerMetricasGtr(this.today)));
  }

  private async refreshCampanas(): Promise<void> {
    this.campanas.set(await firstValueFrom(this.preventaService.listarCampanasActivas()));
  }

  private async refreshCatalogoTipificaciones(): Promise<void> {
    const catalogo = await firstValueFrom(this.preventaService.getCatalogoTipificaciones('PREVENTA'));
    this.catalogoTipificaciones.set(
      catalogo.tipificaciones
        .map((tipificacion) => ({
          codigo: tipificacion.codigo,
          label: `${tipificacion.codigo} - ${tipificacion.descripcion}`,
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
            idTipificacion: tipificacion.id,
            label: `${tipificacion.codigo}: ${subtipificacion.codigo} - ${subtipificacion.descripcion}`,
            orden: subtipificacion.orden,
            value: subtipificacion.id
          }))
        )
        .sort((left, right) => left.label.localeCompare(right.label))
    );
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
      sortBy: 'lastEntryAt',
      direction: 'desc'
    };
  }

  private getMasivoFilters(): MasivoLeadFilters {
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

  private groupAgendados(rows: VisualLeadAgendadoGtr[]): AgendadoGroup[] {
    const now = new Date();
    const groups = new Map<string, { label: string; sort: number; rows: VisualLeadAgendadoGtr[] }>();

    for (const row of [...rows].sort((left, right) => this.agendadoSortValue(left) - this.agendadoSortValue(right))) {
      const bucket = this.getAgendadoBucket(row, now);
      const existing = groups.get(bucket.key);
      if (existing) {
        existing.rows.push(row);
      } else {
        groups.set(bucket.key, { label: bucket.label, sort: bucket.sort, rows: [row] });
      }
    }

    return [...groups.entries()]
      .sort((left, right) => left[1].sort - right[1].sort)
      .map(([key, group]) => ({ key, label: group.label, rows: group.rows }));
  }

  private getAgendadoBucket(row: LeadAgendadoGtrResponse, now: Date): { key: string; label: string; sort: number } {
    const scheduled = this.getScheduledDate(row);
    if (!scheduled) {
      return { key: 'sin-hora', label: 'Sin hora programada', sort: Number.MAX_SAFE_INTEGER };
    }

    const sameDay =
      scheduled.getFullYear() === now.getFullYear() &&
      scheduled.getMonth() === now.getMonth() &&
      scheduled.getDate() === now.getDate();
    const currentHour = sameDay && scheduled.getHours() <= now.getHours();

    if (scheduled < now || currentHour) {
      return { key: 'actual', label: 'Hora actual y vencidos', sort: 0 };
    }

    const hour = scheduled.getHours();
    const dateLabel = this.formatReadableShortDate(scheduled);
    return {
      key: `${this.formatLocalDate(scheduled)}-${hour}`,
      label: `${dateLabel} ${`${hour}`.padStart(2, '0')}:00 - ${`${hour}`.padStart(2, '0')}:59`,
      sort: scheduled.getTime()
    };
  }

  private agendadoSortValue(row: LeadAgendadoGtrResponse): number {
    return this.getScheduledDate(row)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  }

  private getScheduledDate(row: LeadAgendadoGtrResponse): Date | null {
    if (!row.horaProgramada) {
      return null;
    }
    const date = row.fechaAgendamiento || this.today;
    return new Date(`${date}T${row.horaProgramada}`);
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

  private whatsAppUrl(prefijo?: string | null, lead?: string | null): string | null {
    const phone = this.normalizePhoneNumber(prefijo, lead);
    return phone ? `https://wa.me/${phone}` : null;
  }

  private normalizePhoneNumber(prefijo?: string | null, lead?: string | null): string {
    const prefixDigits = (prefijo ?? '').replace(/\D/g, '');
    const leadDigits = (lead ?? '').replace(/\D/g, '');
    return `${prefixDigits}${leadDigits}`.trim();
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

  private formatReadableShortDate(date: Date): string {
    if (this.formatLocalDate(date) === this.today) {
      return 'Hoy';
    }
    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${day}/${month}`;
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
