import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, Subscription } from 'rxjs';
import type { TipificationPaletteByCode } from '../../../shared/components/tipification-stack/tipification-stack.component';
import { EventoResponse } from '../../../shared/models/preventa/preventa.models';
import { formatLabel } from '../../../shared/utils/display-label';
import { SessionService } from '../../../core/services/session.service';
import { LeadRealtimeService } from '../../preventa/services/lead-realtime.service';
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
  RegistroDiarioLeadResponse
} from '../models/daily-lead.model';

@Injectable()
export class DailyLeadsFacade {
  private readonly service = inject(DailyLeadsService);
  private readonly session = inject(SessionService);
  private readonly realtimeService = inject(LeadRealtimeService);
  private readonly realtimeSubscription = new Subscription();

  /**
   * Roles con visibilidad global de equipos (backend: VER_TODOS_LOS_EQUIPOS) que llegan a esta
   * vista. Solo ellos agrupan por equipo; el GTR está acotado por backend a su único equipo.
   */
  private static readonly ROLES_VISIBILIDAD_GLOBAL = new Set(['ADMINISTRADOR', 'COMMUNITY', 'MONITOR']);
  readonly canGroupByTeam = computed(() => {
    const role = this.session.primaryRole();
    return !!role && DailyLeadsFacade.ROLES_VISIBILIDAD_GLOBAL.has(role);
  });

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
  readonly metricasView = computed<DailyLeadsMetricsView | null>(() => {
    const m = this.metricas();
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
  readonly errorMessage = signal('');
  readonly tipificationPaletteByCode = signal<TipificationPaletteByCode>({});
  readonly eventRows = signal<EventoResponse[]>([]);
  readonly activeHistoryLead = signal<DailyLeadRowView | null>(null);
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
    ultimasTipificaciones: []
  });
  /** Nombre de equipo por id, para mostrar los chips de la agrupación "Equipo". */
  readonly equipoNombreById = signal<Map<number, string>>(new Map());

  readonly first = computed(() => this.pageNumber() * this.pageSize());
  readonly isToday = computed(() => this.fecha() === '');
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
      { label: 'Última tipificación', value: 'ULTIMA_TIPIFICACION' }
    );
    return options;
  });
  readonly sortOptions: Array<{ label: string; value: DailyLeadSortField }> = [
    { label: 'Hora de registro', value: 'createdAt' },
    { label: 'GTR', value: 'nombreActor' },
    { label: 'Campaña', value: 'campana' },
    { label: 'Lead', value: 'lead' },
    { label: 'Primera tipificación', value: 'primeraTipificacion' },
    { label: 'Última tipificación', value: 'ultimaTipificacion' }
  ];
  readonly sortDirectionOptions = computed<Array<{ label: string; value: DailyLeadSortDirection }>>(() =>
    this.sortField() === 'createdAt'
      ? [
          { label: 'Más antiguos', value: 'asc' },
          { label: 'Más recientes', value: 'desc' }
        ]
      : [
          { label: 'A–Z', value: 'asc' },
          { label: 'Z–A', value: 'desc' }
        ]
  );
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
      case 'ULTIMA_TIPIFICACION':
        return groups.ultimasTipificaciones;
      default:
        return [];
    }
  });
  readonly maxDate = this.localToday();

  async initialize(): Promise<void> {
    this.startRealtime();
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
    if (pageNumber === this.pageNumber()) {
      return;
    }
    await this.load(pageNumber);
  }

  async refresh(): Promise<void> {
    await Promise.all([this.loadGroups(), this.loadMetricas(), this.load(this.pageNumber())]);
  }

  stopRealtime(): void {
    this.realtimeSubscription.unsubscribe();
  }

  setLeadSearchDraft(value: string): void {
    this.leadSearchDraft.set(value);
  }

  async applyLeadSearch(): Promise<void> {
    const normalized = this.normalizeLeadSearch(this.leadSearchDraft());
    if (normalized === this.leadSearch()) {
      return;
    }
    this.leadSearch.set(normalized);
    this.leadSearchDraft.set(normalized);
    await Promise.all([this.loadGroups(), this.load(0)]);
  }

  async clearLeadSearch(): Promise<void> {
    if (!this.leadSearch() && !this.leadSearchDraft()) {
      return;
    }
    this.leadSearch.set('');
    this.leadSearchDraft.set('');
    await Promise.all([this.loadGroups(), this.load(0)]);
  }

  async setGroupingMode(mode: DailyLeadGroupMode | null | undefined): Promise<void> {
    if (!mode || mode === this.groupingMode()) {
      return;
    }
    this.groupingMode.set(mode);
    this.selectedGroup.set(null);
    await this.load(0);
  }

  private startRealtime(): void {
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
    if (!group || this.isGroupSelected(group)) {
      return;
    }
    this.selectedGroup.set(group);
    await this.load(0);
  }

  async clearSelectedGroup(): Promise<void> {
    if (!this.selectedGroup()) {
      return;
    }
    this.selectedGroup.set(null);
    await this.load(0);
  }

  async setSortField(field: DailyLeadSortField | null | undefined): Promise<void> {
    if (!field || field === this.sortField()) {
      return;
    }
    this.sortField.set(field);
    await this.load(0);
  }

  async setSortDirection(direction: DailyLeadSortDirection | null | undefined): Promise<void> {
    if (!direction || direction === this.sortDirection()) {
      return;
    }
    this.sortDirection.set(direction);
    await this.load(0);
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

  private async load(pageNumber: number): Promise<void> {
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
    try {
      const metricas = await firstValueFrom(this.service.obtenerMetricas(this.fecha() || undefined));
      this.metricas.set(metricas);
    } catch {
      // Métricas opcionales: si fallan, la barra se oculta y la tabla sigue funcionando.
      this.metricas.set(null);
    }
  }

  private async loadGroups(): Promise<void> {
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
    const ultimoAsesor = item.ultimoNombreAsesorAsignado?.trim() || 'Sin asignación';
    return {
      idLead: item.idLead,
      prefijo: item.prefijo,
      lead: item.lead,
      leadDisplay: this.formatLead(item.prefijo, item.lead),
      asesor,
      asesorDisplay: this.firstWords(asesor, 2),
      rolLabel: formatLabel(item.rolActor),
      accionLabel: formatLabel(item.accion),
      hora: this.formatTime(item.createdAt),
      campana: item.nombreCampana?.trim() || 'Sin campaña',
      ultimoAsesor,
      ultimoAsesorDisplay: this.firstWords(ultimoAsesor, 2),
      totalAsignacionesDia: item.totalAsignacionesDia ?? 0,
      totalRegistrosDia: item.totalRegistrosDia ?? 1,
      primeraCodigoTipificacion: item.primeraCodigoTipificacion,
      primeraCodigoSubtipificacion: item.primeraCodigoSubtipificacion,
      codigoTipificacion: item.codigoTipificacion,
      codigoSubtipificacion: item.codigoSubtipificacion
    };
  }

  private formatLead(_prefijo: string | null, lead: string | null): string {
    const numero = lead?.trim() ?? '';
    if (!numero) {
      return '-';
    }
    return numero;
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
      prefijo: null,
      lead: null,
      leadDisplay: '',
      asesor: '',
      asesorDisplay: '',
      rolLabel: '',
      accionLabel: '',
      hora: '',
      campana: '',
      ultimoAsesor: '',
      ultimoAsesorDisplay: '',
      totalAsignacionesDia: 0,
      totalRegistrosDia: 1,
      isPlaceholder: true
    };
  }

  private normalizeLeadSearch(value: string): string {
    return value.replace(/\s+/g, '').trim();
  }

  private async loadTipificationPalette(): Promise<void> {
    try {
      const catalogResults = await Promise.allSettled([
        firstValueFrom(this.service.getCatalogoTipificaciones('PREVENTA')),
        firstValueFrom(this.service.getCatalogoTipificaciones('VENTA')),
        firstValueFrom(this.service.getCatalogoTipificaciones('POSTVENTA'))
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
