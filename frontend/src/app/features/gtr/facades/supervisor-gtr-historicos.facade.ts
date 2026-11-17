import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder } from '@angular/forms';
import { debounceTime, firstValueFrom } from 'rxjs';
import {
  CampoTipificacion,
  CatalogoProveedorResponse,
  LeadGtrGroupItemResponse,
  LeadGtrGroupMode,
  LeadGtrGroupType,
  LeadGtrGroupsResponse,
  LeadGtrResponse,
  MasivoLeadFilters,
  MasivoFechaMode,
  SupervisorHistoricosEquipoMasivoResponse,
  SupervisorHistoricosEquipoResultadoResponse
} from '../../../shared/models/preventa/preventa.models';
import { MetricsRango } from '../../../shared/utils/metrics-period';
import { providerLogo as resolveProviderLogo } from '../../../shared/utils/provider-logo';
import { CurrentUserProviderScopeService } from '../../../core/services/current-user-provider-scope.service';
import { LeadRealtimeService } from '../../preventa/services/lead-realtime.service';
import {
  EquipoOperativoResponse,
  PreventaLeadService
} from '../../preventa/services/preventa-lead.service';
import { GtrTeamCampaignService } from '../services/gtr-team-campaign.service';

const CLARO_HIDDEN_TEAM_ID = 5;
const CLARO_PROVIDER_NAME = 'CLARO';
type SortField = 'lastEntryAt' | 'createdAt' | 'nombreAsesorAsignado' | 'estado' | 'codigoTipificacion';
type SortDirection = 'asc' | 'desc';

type TipificacionSelectOption = {
  label: string;
  value: string;
  codigo: string;
  descripcion: string;
  orden: number;
};

type TipificacionVisualMeta = { paletteIndex: number };

type SubtipificacionSelectOption = TipificacionSelectOption & { codigoTipificacion: string };

interface HistoricosFilterFormValue {
  campoTipificacion: CampoTipificacion;
  modoFecha: MasivoFechaMode;
  tipificaciones: string[];
  subtipificaciones: string[];
  fechaDesde: string | null;
  fechaHasta: string | null;
  idEquipo: number | null;
}

const EMPTY_GROUPS: LeadGtrGroupsResponse = {
  asesores: [],
  campanas: [],
  estados: [],
  primerasTipificaciones: [],
  mayoresTipificaciones: [],
  ultimasTipificaciones: [],
  ingresos: []
};

@Injectable()
export class SupervisorGtrHistoricosFacade {
  private readonly preventaService = inject(PreventaLeadService);
  private readonly teamService = inject(GtrTeamCampaignService);
  private readonly providerScope = inject(CurrentUserProviderScopeService);
  private readonly realtimeService = inject(LeadRealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly filtersForm = this.fb.group({
    campoTipificacion: new FormControl<CampoTipificacion>('ULTIMA', { nonNullable: true }),
    modoFecha: new FormControl<MasivoFechaMode>('GESTIONADOS', { nonNullable: true }),
    tipificaciones: this.fb.control<string[]>([]),
    subtipificaciones: this.fb.control<string[]>([]),
    fechaDesde: new FormControl<string | null>(this.today(), { nonNullable: false }),
    fechaHasta: new FormControl<string | null>(this.today(), { nonNullable: false }),
    idEquipo: new FormControl<number | null>(null, { nonNullable: false })
  });

  readonly rows = signal<LeadGtrResponse[]>([]);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly pageNumber = signal(0);
  readonly pageSize = signal(20);
  readonly pageSizeOptions = [20, 50, 100];
  readonly groups = signal<LeadGtrGroupsResponse>(EMPTY_GROUPS);
  readonly searched = signal(false);
  readonly loading = signal(false);
  readonly assigning = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly selectedIds = signal<Set<number>>(new Set());
  readonly activeProvider = this.providerScope.proveedorActivo;
  readonly equipos = signal<EquipoOperativoResponse[]>([]);
  readonly catalogo = signal<CatalogoProveedorResponse | null>(null);
  readonly selectedTeamId = signal<number | null>(null);
  readonly assignmentDialogVisible = signal(false);
  readonly assignmentResults = signal<SupervisorHistoricosEquipoMasivoResponse | null>(null);
  readonly sortField = signal<SortField>('lastEntryAt');
  readonly sortDirection = signal<SortDirection>('desc');
  readonly groupingMode = signal<LeadGtrGroupMode>('SIN_AGRUPAR');
  readonly selectedGroup = signal<LeadGtrGroupItemResponse | null>(null);
  readonly subtipificacionFilter = signal('');

  private started = false;
  private lastProviderId: number | null = null;
  private realtimeStarted = false;
  private successTimer: ReturnType<typeof setTimeout> | null = null;

  readonly providerId = this.providerScope.activeId;
  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly visibleTeams = computed(() => this.filterTeams(this.equipos()));
  readonly allVisibleSelected = computed(() => {
    const visible = this.rows();
    if (!visible.length) return false;
    const selected = this.selectedIds();
    return visible.every(row => selected.has(row.id));
  });
  readonly someVisibleSelected = computed(() => {
    const selected = this.selectedIds();
    return this.rows().some(row => selected.has(row.id)) && !this.allVisibleSelected();
  });
  readonly tipificaciones = computed<TipificacionSelectOption[]>(() =>
    [...(this.catalogo()?.tipificaciones ?? [])]
      .sort((left, right) => left.orden - right.orden)
      .map(item => ({
        label: item.codigo,
        value: item.codigo,
        codigo: item.codigo,
        descripcion: item.descripcion,
        orden: item.orden
      }))
  );
  readonly subtipificaciones = computed<SubtipificacionSelectOption[]>(() => {
    const selected = new Set(this.filtersForm.controls.tipificaciones.value);
    const search = this.subtipificacionFilter().toLowerCase();
    return (this.catalogo()?.tipificaciones ?? [])
      .filter(item => !selected.size || selected.has(item.codigo))
      .flatMap(item => item.subtipificaciones ?? [])
      .filter(item => !search || `${item.codigo} ${item.descripcion}`.toLowerCase().includes(search))
      .sort((left, right) => left.orden - right.orden)
      .map(item => ({
        label: item.codigo,
        value: item.codigo,
        codigo: item.codigo,
        descripcion: item.descripcion,
        orden: item.orden,
        codigoTipificacion: (this.catalogo()?.tipificaciones ?? [])
          .find(tip => tip.subtipificaciones?.some(sub => sub.codigo === item.codigo))?.codigo ?? ''
      }));
  });
  readonly tipificacionVisualMetaByCode = computed(() => {
    const meta = new Map<string, TipificacionVisualMeta>();
    for (const option of this.catalogo()?.tipificaciones ?? []) {
      const codigo = String(option.codigo).toUpperCase();
      meta.set(codigo, { paletteIndex: this.tipificacionPaletteIndex(Number(option.orden)) });
    }
    return meta;
  });
  readonly teamOptions = computed(() => [
    { label: 'Todos', value: null },
    ...this.visibleTeams().map(team => ({ label: team.nombre, value: team.id }))
  ]);
  readonly campoTipificacionOptions = [
    { label: 'Mayor', value: 'MAYOR' as CampoTipificacion },
    { label: 'Última', value: 'ULTIMA' as CampoTipificacion },
    { label: 'Primera', value: 'PRIMERA' as CampoTipificacion }
  ];
  readonly modoFechaOptions = [
    { label: 'Gestionados', value: 'GESTIONADOS' as MasivoFechaMode },
    { label: 'Registrados', value: 'REGISTRADOS' as MasivoFechaMode }
  ];
  readonly groupingModeOptions = computed(() => [
    { label: 'Sin agrupar', value: 'SIN_AGRUPAR' as LeadGtrGroupMode },
    { label: this.tipificacionColumnLabel(), value: this.tipificacionGroupMode() },
    { label: 'Estado', value: 'ESTADO' as LeadGtrGroupType },
    { label: 'Ingreso', value: 'INGRESO' as LeadGtrGroupType }
  ]);
  readonly activeGroupOptions = computed(() => {
    switch (this.groupingMode()) {
      case 'ESTADO': return this.groups().estados;
      case 'INGRESO': return this.groups().ingresos ?? [];
      case 'PRIMERA_TIPIFICACION': return this.groups().primerasTipificaciones;
      case 'MAYOR_TIPIFICACION': return this.groups().mayoresTipificaciones;
      case 'ULTIMA_TIPIFICACION': return this.groups().ultimasTipificaciones;
      default: return [];
    }
  });
  readonly sortOptions = computed(() => [
    { label: 'Última actividad', value: 'lastEntryAt' as SortField },
    { label: this.tipificacionColumnLabel(), value: 'codigoTipificacion' as SortField },
    { label: 'Estado', value: 'estado' as SortField },
    { label: 'Asesor', value: 'nombreAsesorAsignado' as SortField }
  ]);
  readonly sortDirectionOptions = computed(() => this.sortField() === 'lastEntryAt'
    ? [{ label: 'Más antiguos', value: 'asc' as SortDirection }, { label: 'Más recientes', value: 'desc' as SortDirection }]
    : [{ label: 'Orden natural', value: 'asc' as SortDirection }, { label: 'Orden inverso', value: 'desc' as SortDirection }]);
  readonly dateHelper = computed(() => this.filtersForm.controls.modoFecha.value === 'REGISTRADOS'
    ? 'Cada lead aparece una sola vez, aunque tenga varios registros en el período.'
    : null);

  constructor() {
    this.filtersForm.valueChanges.pipe(debounceTime(250), takeUntilDestroyed()).subscribe(() => {
      this.selectedIds.set(new Set());
      if (this.started && this.providerId() != null) void this.search();
    });
    effect(() => {
      const idProveedor = this.providerScope.activeId();
      if (!this.started || idProveedor == null || idProveedor === this.lastProviderId) return;
      void this.loadProvider(idProveedor);
    });
    this.destroyRef.onDestroy(() => {
      this.clearSuccessTimer();
    });
  }

  async start(): Promise<void> {
    this.started = true;
    this.error.set('');
    this.loading.set(true);
    try {
      // La ruta puede abrirse directamente antes de que el layout haya sincronizado el scope.
      // Forzamos una lectura fresca para no confundir un scope todavía vacío con un usuario sin proveedor.
      this.providerScope.resetForOperationalScopeChange();
      if (!(await this.providerScope.load())) {
        throw new Error('No se pudo consultar el scope de proveedores.');
      }
      const idProveedor = this.providerScope.activeId();
      if (idProveedor == null) {
        throw new Error('Selecciona un proveedor activo para consultar historicos.');
      }
      await this.loadProvider(idProveedor);
      this.startRealtime();
    } catch (error) {
      this.error.set(this.errorMessage(error, 'No se pudo cargar el histórico.'));
    } finally {
      this.loading.set(false);
    }
  }

  stop(): void {
    this.started = false;
    this.realtimeStarted = false;
  }

  async loadProvider(idProveedor: number): Promise<void> {
    if (!this.started && this.lastProviderId !== null) return;
    this.lastProviderId = idProveedor;
    this.selectedIds.set(new Set());
    this.selectedGroup.set(null);
    this.groupingMode.set('SIN_AGRUPAR');
    this.assignmentResults.set(null);
    this.filtersForm.controls.idEquipo.setValue(null, { emitEvent: false });
    try {
      const [equipos, catalogos] = await Promise.all([
        firstValueFrom(this.teamService.listarEquiposPorProveedor(idProveedor)),
        firstValueFrom(this.preventaService.getCatalogoPorProveedor('PREVENTA', idProveedor))
      ]);
      this.equipos.set(this.filterTeams(equipos ?? []));
      this.catalogo.set((catalogos ?? [])[0] ?? null);
      this.clearSearchState();
      if (this.started) await this.search();
    } catch (error) {
      this.error.set(this.errorMessage(error, 'No se pudo cargar el proveedor activo.'));
    }
  }

  async search(): Promise<void> {
    this.clearSuccess();
    if (this.providerId() == null) {
      this.error.set('Selecciona un proveedor activo antes de buscar.');
      return;
    }
    this.pageNumber.set(0);
    this.selectedIds.set(new Set());
    this.selectedGroup.set(null);
    await this.loadResults();
  }

  async loadPage(page: number, size = this.pageSize()): Promise<void> {
    this.pageSize.set(size);
    this.pageNumber.set(page);
    await this.loadResults();
  }

  async setGroupingMode(mode: LeadGtrGroupMode): Promise<void> {
    this.groupingMode.set(mode);
    this.selectedGroup.set(null);
    this.selectedIds.set(new Set());
    if (this.searched()) await this.loadResults();
  }

  async selectGroup(group: LeadGtrGroupItemResponse | null): Promise<void> {
    this.selectedGroup.set(group);
    this.pageNumber.set(0);
    if (this.searched()) await this.loadResults();
  }

  async setSortField(value: SortField): Promise<void> {
    this.sortField.set(value);
    this.sortDirection.set(value === 'lastEntryAt' ? 'desc' : 'asc');
    this.selectedIds.set(new Set());
    if (this.searched()) await this.loadResults();
  }

  async setSortDirection(value: SortDirection): Promise<void> {
    this.sortDirection.set(value);
    this.selectedIds.set(new Set());
    if (this.searched()) await this.loadResults();
  }

  onTipificacionesChange(): void {
    const selected = new Set(this.filtersForm.controls.tipificaciones.value);
    this.filtersForm.controls.subtipificaciones.setValue(
      this.filtersForm.controls.subtipificaciones.value.filter(code =>
        this.subtipificaciones().some(option => option.value === code && selected.has(option.codigoTipificacion))
      )
    );
  }

  onSubtipificacionesChange(): void {
    const selected = new Set(this.filtersForm.controls.tipificaciones.value);
    for (const code of this.filtersForm.controls.subtipificaciones.value) {
      const parent = this.subtipificaciones().find(item => item.value === code)?.codigoTipificacion;
      if (parent) selected.add(parent);
    }
    this.filtersForm.controls.tipificaciones.setValue([...selected]);
  }

  onRangeChange(range: MetricsRango): void {
    this.filtersForm.patchValue({ fechaDesde: range.desde, fechaHasta: range.hasta });
  }

  onModoFechaChange(value: MasivoFechaMode): void {
    this.filtersForm.controls.modoFecha.setValue(value);
  }

  onCampoTipificacionChange(value: CampoTipificacion): void {
    this.filtersForm.controls.campoTipificacion.setValue(value);
    const mode = this.groupingMode();
    if (mode === 'PRIMERA_TIPIFICACION' || mode === 'MAYOR_TIPIFICACION' || mode === 'ULTIMA_TIPIFICACION') {
      this.groupingMode.set(this.tipificacionGroupMode());
    }
  }

  toggleSelection(id: number, checked: boolean): void {
    const selected = new Set(this.selectedIds());
    checked ? selected.add(id) : selected.delete(id);
    this.selectedIds.set(selected);
  }

  toggleSelectAllVisible(checked: boolean): void {
    const selected = new Set(this.selectedIds());
    for (const row of this.rows()) checked ? selected.add(row.id) : selected.delete(row.id);
    this.selectedIds.set(selected);
  }

  isSelected(id: number): boolean { return this.selectedIds().has(id); }

  openAssignment(): void {
    if (!this.selectedCount()) {
      this.error.set('Selecciona al menos un lead para mover.');
      return;
    }
    this.selectedTeamId.set(null);
    this.assignmentResults.set(null);
    this.assignmentDialogVisible.set(true);
  }

  closeAssignment(): void {
    if (this.assigning()) return;
    this.assignmentDialogVisible.set(false);
    this.assignmentResults.set(null);
  }

  async assignSelected(): Promise<void> {
    const idEquipo = this.selectedTeamId();
    const idsLead = [...this.selectedIds()];
    if (!idEquipo || !idsLead.length) return;
    this.assigning.set(true);
    this.error.set('');
    try {
      const response = await firstValueFrom(this.preventaService.moverLeadsHistoricosSupervisor({ idsLead, idEquipo }));
      this.assignmentResults.set(response);
      this.selectedIds.set(new Set());
      await this.loadResults();
      if (response.totalMovidos > 0) {
        this.showSuccess(`${response.totalMovidos} lead(s) asignado(s) correctamente.`);
      }
      if (response.totalFallidos > 0) {
        this.error.set(`${response.totalFallidos} lead(s) no pudieron asignarse. Revisa el resultado del diálogo.`);
      }
      if (response.totalMovidos === 0 && response.totalFallidos === 0) {
        this.showSuccess('No hubo cambios en los leads seleccionados.');
      }
    } catch (error) {
      this.error.set(this.errorMessage(error, 'No se pudo mover la selección.'));
    } finally {
      this.assigning.set(false);
    }
  }

  teamName(id?: number | null): string {
    return this.equipos().find(team => team.id === id)?.nombre ?? 'Sin equipo';
  }

  display(value?: unknown): string { return value === null || value === undefined || String(value).trim() === '' ? '-' : String(value); }

  providerLogo(name?: string | null): string | null { return resolveProviderLogo(name); }

  estadoSeverity(value?: string | null): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    if (value === 'NUEVO') return 'info';
    if (value === 'ASIGNADO') return 'warn';
    if (value === 'GESTIONADO') return 'success';
    if (value === 'EN_GESTION' || value === 'AGENDADO') return 'secondary';
    return 'secondary';
  }

  tipificacionColumnLabel(): string {
    switch (this.filtersForm.controls.campoTipificacion.value) {
      case 'PRIMERA': return 'Primera tipificación';
      case 'MAYOR': return 'Mayor tipificación';
      default: return 'Última tipificación';
    }
  }

  tipificacionGroupMode(): LeadGtrGroupType {
    switch (this.filtersForm.controls.campoTipificacion.value) {
      case 'PRIMERA': return 'PRIMERA_TIPIFICACION';
      case 'MAYOR': return 'MAYOR_TIPIFICACION';
      default: return 'ULTIMA_TIPIFICACION';
    }
  }

  historicosTipificacionParts(row: LeadGtrResponse): {
    tipificacion: string;
    subtipificacion: string;
    codigoTipificacion: string | null | undefined;
    codigoSubtipificacion: string | null | undefined;
  } {
    if (this.filtersForm.controls.campoTipificacion.value === 'PRIMERA') {
      return {
        tipificacion: this.display(row.primeraCodigoTipificacion),
        subtipificacion: this.display(row.primeraCodigoSubtipificacion),
        codigoTipificacion: row.primeraCodigoTipificacion,
        codigoSubtipificacion: row.primeraCodigoSubtipificacion
      };
    }
    if (this.filtersForm.controls.campoTipificacion.value === 'MAYOR') {
      return {
        tipificacion: this.display(row.mayorRangoCodigoTipificacion),
        subtipificacion: this.display(row.mayorRangoCodigoSubtipificacion),
        codigoTipificacion: row.mayorRangoCodigoTipificacion,
        codigoSubtipificacion: row.mayorRangoCodigoSubtipificacion
      };
    }
    return {
      tipificacion: this.display(row.codigoTipificacion),
      subtipificacion: this.display(row.codigoSubtipificacion),
      codigoTipificacion: row.codigoTipificacion,
      codigoSubtipificacion: row.codigoSubtipificacion
    };
  }

  tipificacionTagClass(
    codigo?: string | null,
    kind: 'tipificacion' | 'subtipificacion' = 'tipificacion',
    subcodigo?: string | null
  ): string {
    const normalized = this.display(codigo).toUpperCase();
    const base = 'gtr-tip-tag';
    if (normalized === 'PREVENTA' && ['DESAPROBADA', 'DESAPROBADO'].includes(this.display(subcodigo).toUpperCase())) {
      return `${base} ${base}--danger ${base}--${kind}`;
    }
    const meta = this.tipificacionVisualMetaByCode().get(normalized);
    const tone = meta ? `palette-${meta.paletteIndex}` : 'neutral';
    return `${base} ${base}--${tone} ${base}--${kind}`;
  }

  private tipificacionPaletteIndex(orden: number): number {
    if (!Number.isFinite(orden) || orden <= 0) return 0;
    return (orden - 1) % 8;
  }

  sortIcon(field: SortField): string {
    if (this.sortField() !== field) return 'pi pi-sort-alt';
    return this.sortDirection() === 'asc' ? 'pi pi-sort-amount-up-alt' : 'pi pi-sort-amount-down';
  }

  isSortActive(field: SortField): boolean { return this.sortField() === field; }

  sortLabel(field: SortField, label: string): string {
    return this.sortField() === field ? `Orden activo por ${label}. Presiona para invertir.` : `Ordenar por ${label}`;
  }

  async changeSort(field: SortField): Promise<void> {
    if (this.sortField() === field) {
      await this.setSortDirection(this.sortDirection() === 'asc' ? 'desc' : 'asc');
      return;
    }
    await this.setSortField(field);
  }

  clearOrganization(): void {
    this.groupingMode.set('SIN_AGRUPAR');
    this.selectedGroup.set(null);
    this.sortField.set('lastEntryAt');
    this.sortDirection.set('desc');
    if (this.searched()) void this.loadResults();
  }

  isOrganizationDefault(): boolean {
    return this.groupingMode() === 'SIN_AGRUPAR' && this.selectedGroup() == null
      && this.sortField() === 'lastEntryAt' && this.sortDirection() === 'desc';
  }

  private async loadResults(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const filters = this.buildFilters();
      const query = {
        pageNumber: this.pageNumber(),
        pageSize: this.pageSize(),
        sortBy: this.sortField(),
        direction: this.sortDirection()
      };
      const [rows, groups] = await Promise.all([
        firstValueFrom(this.preventaService.listarLeadsHistoricosSupervisor(filters, query)),
        firstValueFrom(this.preventaService.listarAgrupacionesHistoricosSupervisor(filters))
      ]);
      this.rows.set(rows?.content ?? []);
      this.totalElements.set(rows?.totalElements ?? 0);
      this.totalPages.set(rows?.totalPages ?? 0);
      this.groups.set(groups ?? EMPTY_GROUPS);
      this.searched.set(true);
    } catch (error) {
      this.error.set(this.errorMessage(error, 'No se pudo consultar el histórico.'));
    } finally {
      this.loading.set(false);
    }
  }

  private buildFilters(): MasivoLeadFilters {
    const raw = this.filtersForm.getRawValue() as HistoricosFilterFormValue;
    const selectedGroup = this.selectedGroup();
    const filters: MasivoLeadFilters = {
      idEquipo: raw.idEquipo ?? undefined,
      codigosTipificacion: raw.tipificaciones.length ? raw.tipificaciones : undefined,
      codigosSubtipificacion: raw.subtipificaciones.length ? raw.subtipificaciones : undefined,
      campoTipificacion: raw.campoTipificacion,
      modoFecha: raw.modoFecha,
      fechaDesde: raw.fechaDesde || undefined,
      fechaHasta: raw.fechaHasta || undefined
    };
    if (this.groupingMode() !== 'SIN_AGRUPAR' && selectedGroup) {
      filters.tipoGrupo = this.groupingMode() as LeadGtrGroupType;
      filters.sinValor = selectedGroup.sinValor;
      if (this.groupingMode() === 'ESTADO' && !selectedGroup.sinValor) filters.estado = selectedGroup.etiqueta;
      if (this.groupingMode() === this.tipificacionGroupMode() && !selectedGroup.sinValor) {
        filters.codigoTipificacion = selectedGroup.codigoTipificacion ?? undefined;
        filters.codigoSubtipificacion = selectedGroup.codigoSubtipificacion ?? undefined;
      }
      if (this.groupingMode() === 'INGRESO' && !selectedGroup.sinValor) filters.fechaIngreso = selectedGroup.valor ?? undefined;
    }
    return filters;
  }

  private clearSearchState(): void {
    this.rows.set([]);
    this.groups.set(EMPTY_GROUPS);
    this.totalElements.set(0);
    this.totalPages.set(0);
    this.pageNumber.set(0);
    this.searched.set(false);
  }

  private showSuccess(message: string): void {
    this.clearSuccessTimer();
    this.success.set(message);
    this.successTimer = setTimeout(() => {
      this.success.set('');
      this.successTimer = null;
    }, 5000);
  }

  private clearSuccess(): void {
    this.clearSuccessTimer();
    this.success.set('');
  }

  private clearSuccessTimer(): void {
    if (this.successTimer === null) return;
    clearTimeout(this.successTimer);
    this.successTimer = null;
  }

  private filterTeams(equipos: EquipoOperativoResponse[]): EquipoOperativoResponse[] {
    const active = equipos.filter(team => team.activo).sort((a, b) => a.nombre.localeCompare(b.nombre));
    if (this.activeProvider()?.nombre?.trim().toUpperCase() !== CLARO_PROVIDER_NAME) return active;
    return active.filter(team => team.id !== CLARO_HIDDEN_TEAM_ID);
  }

  private startRealtime(): void {
    if (this.realtimeStarted) return;
    this.realtimeStarted = true;
    this.realtimeService.watchTopic('/topic/leads/etapa/PREVENTA')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (!this.started || !['ASIGNACION', 'REGISTRO', 'REGISTRO_MASIVO', 'TIPIFICACION', 'IDENTIDAD_ACTUALIZADA', 'SNAPSHOTS_ACTUALIZADOS', 'DATOS_PREVENTA_ACTUALIZADOS', 'DIRECCION_ACTUALIZADA', 'OFERTA_COMERCIAL_ACTUALIZADA'].includes(event.tipo)) return;
        if (this.searched()) void this.loadResults();
      });
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string; error?: string } | null;
      return body?.message ?? body?.error ?? error.statusText ?? fallback;
    }
    return error instanceof Error ? error.message : fallback;
  }

  private today(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}
