import { LowerCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CurrentUserProviderScopeService } from '../../../../core/services/current-user-provider-scope.service';
import { MetricsPeriodo, PeriodSelectorComponent } from '../../../../shared/components/period-selector/period-selector.component';
import { TipificationPaletteByCode, TipificationStackComponent } from '../../../../shared/components/tipification-stack/tipification-stack.component';
import { TreeSelectComponent, TreeSelectGroup, TreeSelectSelection } from '../../../../shared/components/tree-select/tree-select.component';
import { MetricsRango } from '../../../../shared/utils/metrics-period';
import { providerLogo as resolveProviderLogo } from '../../../../shared/utils/provider-logo';
import {
  CampoFechaListadoVenta,
  EventoResponse,
  LeadBandejaVentaResponse,
  OrigenFilaBandejaVenta,
  TipificacionResponse,
  UbigeoItem
} from '../../../../shared/models/preventa/preventa.models';
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
    ButtonModule,
    DatePickerModule,
    DrawerModule,
    InputTextModule,
    PaginatorModule,
    PopoverModule,
    SelectModule,
    SkeletonModule,
    TableModule,
    TagModule,
    TooltipModule,
    PeriodSelectorComponent,
    TipificationStackComponent,
    TreeSelectComponent
  ],
  templateUrl: './backoffice-general-board-page.component.html',
  styleUrl: './backoffice-general-board-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackofficeGeneralBoardPageComponent implements OnInit {
  private readonly leadService = inject(BackofficeLeadService);
  private readonly providerScope = inject(CurrentUserProviderScopeService);
  private readonly router = inject(Router);
  private lastProviderId: number | null | undefined = undefined;

  private static readonly DEFAULT_SORT: SortField = 'fechaIngresoEtapa';
  private static readonly DEFAULT_DIRECTION: SortDirection = 'desc';

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

  // --- Detail drawer ---
  protected readonly drawerOpen = signal(false);
  protected readonly drawerRow = signal<LeadBandejaVentaResponse | null>(null);
  protected readonly drawerHistorial = signal<EventoResponse[]>([]);
  protected readonly drawerHistorialLoading = signal(false);
  protected readonly drawerIsConsulta = computed(() => this.drawerRow()?.origenFila === 'EVENTO_TIPIFICACION');

  protected readonly skeletonRows = Array.from({ length: 8 });
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
  }

  protected async refresh(): Promise<void> {
    await this.loadRows();
  }

  protected async buscar(): Promise<void> {
    const term = this.normalizeSearch(this.searchInput());
    this.searchInput.set(term);
    this.searchActive.set(term);
    this.page.set(0);
    await this.loadRows();
  }

  protected async limpiarBusqueda(): Promise<void> {
    this.searchInput.set('');
    this.searchActive.set('');
    this.page.set(0);
    await this.loadRows();
  }

  // --- Detail drawer ---

  protected async onRowClick(row: LeadBandejaVentaResponse): Promise<void> {
    this.drawerRow.set(row);
    this.drawerHistorial.set([]);
    this.drawerOpen.set(true);
    await this.loadDrawerHistorial(row.idLead);
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  protected goToGestion(): void {
    void this.router.navigate(['/backoffice'], { queryParams: { section: 'plataforma' } });
  }

  private async loadDrawerHistorial(idLead: number): Promise<void> {
    this.drawerHistorialLoading.set(true);
    try {
      const response = await firstValueFrom(this.leadService.listarHistorialBackofficeVenta(
        idLead,
        { pageNumber: 0, pageSize: 20, sortBy: 'createdAt', direction: 'desc' }
      ));
      if (this.drawerRow()?.idLead === idLead) {
        this.drawerHistorial.set(response.content ?? []);
      }
    } catch {
      this.drawerHistorial.set([]);
    } finally {
      this.drawerHistorialLoading.set(false);
    }
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
    const raw = row.fechaRelevanteAt ?? row.fechaRelevante;
    return raw ? this.formatDate(raw) : '';
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
      TIPIFICACION: 'Tipificación',
      INGRESO: 'Ingreso',
      ULTIMA_GESTION: 'Última gestión'
    };
    return labels[String(row.tipoFechaRelevante ?? '')] ?? 'Fecha';
  }

  protected formatIngreso(row: LeadBandejaVentaResponse): string {
    return row.fechaIngresoEtapa ? this.formatDate(row.fechaIngresoEtapa) : 'Sin ingreso';
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
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return `${this.formatDate(value)} ${this.formatInstantTime(value)}`;
  }

  protected commentText(row: LeadBandejaVentaResponse): string {
    return (row.comentarioLead ?? '').trim();
  }

  protected isConsulta(row: LeadBandejaVentaResponse): boolean {
    return row.origenFila === 'EVENTO_TIPIFICACION';
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

  private async loadRows(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
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
      this.rows.set(response.content ?? []);
      this.total.set(response.totalElements ?? 0);
    } catch (error) {
      console.error('Error al cargar bandeja general de venta', error);
      this.rows.set([]);
      this.total.set(0);
      this.error.set(this.resolveLoadError(error));
    } finally {
      this.loading.set(false);
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
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const hour24 = date.getHours();
    const suffix = hour24 < 12 ? 'AM' : 'PM';
    const hour12 = hour24 % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} ${suffix}`;
  }
}
