import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
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
import { MetricsRango } from '../../../../shared/utils/metrics-period';
import { providerLogo as resolveProviderLogo } from '../../../../shared/utils/provider-logo';
import {
  CampoFechaListadoVenta,
  LeadBandejaVentaResponse,
  OrigenFilaBandejaVenta,
  TipificacionResponse
} from '../../../../shared/models/preventa/preventa.models';
import { BackofficeLeadService } from '../../services/backoffice-lead.service';

type SortField = 'fechaIngresoEtapa' | 'fechaRelevante' | 'lead' | 'estado' | 'tipificacion';
type SortDirection = 'asc' | 'desc';
type GroupMode = 'SIN_AGRUPAR' | 'ESTADO' | 'PLAN' | 'TIPIFICACION' | 'ULTIMO_GESTOR';
type Option<T extends string = string> = { label: string; value: T };

@Component({
  selector: 'app-backoffice-general-board-page',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    DatePickerModule,
    InputTextModule,
    MultiSelectModule,
    PaginatorModule,
    PopoverModule,
    SelectModule,
    SkeletonModule,
    TableModule,
    TagModule,
    TooltipModule,
    PeriodSelectorComponent,
    TipificationStackComponent
  ],
  templateUrl: './backoffice-general-board-page.component.html',
  styleUrl: './backoffice-general-board-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackofficeGeneralBoardPageComponent implements OnInit {
  private readonly leadService = inject(BackofficeLeadService);
  private readonly route = inject(ActivatedRoute);
  private readonly providerScope = inject(CurrentUserProviderScopeService);
  private lastProviderId: number | null | undefined = undefined;

  protected readonly pageSize = 15;
  protected readonly rows = signal<LeadBandejaVentaResponse[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(0);
  protected readonly loading = signal(false);
  protected readonly catalogLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly catalogo = signal<TipificacionResponse[]>([]);
  protected readonly searchInput = signal('');
  protected readonly searchActive = signal('');
  protected readonly selectedTipificaciones = signal<string[]>([]);
  protected readonly periodo = signal<MetricsPeriodo>('dia');
  protected readonly dia = signal<string | null>(this.today());
  protected readonly hasta = signal<string | null>(this.today());
  protected readonly origen = signal<OrigenFilaBandejaVenta>('ESTADO_ACTUAL');
  protected readonly groupBy = signal<GroupMode>('SIN_AGRUPAR');
  protected readonly sortBy = signal<SortField>('fechaIngresoEtapa');
  protected readonly direction = signal<SortDirection>('desc');

  protected readonly skeletonRows = Array.from({ length: 8 });
  protected readonly showSecSotColumn = computed(() =>
    this.rows().some((row) => Boolean(row.sec?.trim()) || Boolean(row.sot?.trim()) || row.requiereSecSotVenta === true)
  );

  protected readonly tipificationPaletteByCode = computed<TipificationPaletteByCode>(() => {
    const palette: TipificationPaletteByCode = {};
    const totalPalettes = 8;
    for (const tipificacion of this.catalogo()) {
      const orden = tipificacion.orden;
      palette[tipificacion.codigo.toUpperCase()] = Number.isFinite(orden) && orden > 0 ? (orden - 1) % totalPalettes : 0;
    }
    return palette;
  });

  protected readonly tipificacionOptions = computed(() =>
    this.catalogo().map((tipificacion) => ({
      label: tipificacion.codigo,
      value: tipificacion.codigo,
      descripcion: tipificacion.descripcion,
      orden: tipificacion.orden
    }))
  );

  protected readonly activeFilterCount = computed(() => {
    let count = this.selectedTipificaciones().length;
    if (this.searchActive()) count += 1;
    if (this.origen() !== 'ESTADO_ACTUAL') count += 1;
    if (this.groupBy() !== 'SIN_AGRUPAR') count += 1;
    return count;
  });

  protected readonly origenOptions: Option<OrigenFilaBandejaVenta>[] = [
    { label: 'Estado actual', value: 'ESTADO_ACTUAL' },
    { label: 'Último evento', value: 'EVENTO_TIPIFICACION' }
  ];

  protected readonly groupOptions: Option<GroupMode>[] = [
    { label: 'Sin agrupar', value: 'SIN_AGRUPAR' },
    { label: 'Estado', value: 'ESTADO' },
    { label: 'Plan', value: 'PLAN' },
    { label: 'Tipificación', value: 'TIPIFICACION' },
    { label: 'Último gestor', value: 'ULTIMO_GESTOR' }
  ];

  protected readonly sortOptions: Option<SortField>[] = [
    { label: 'Fecha ingreso', value: 'fechaIngresoEtapa' },
    { label: 'Fecha relevante', value: 'fechaRelevante' },
    { label: 'Lead', value: 'lead' },
    { label: 'Estado', value: 'estado' },
    { label: 'Tipificación', value: 'tipificacion' }
  ];

  protected readonly directionOptions: Option<SortDirection>[] = [
    { label: 'Descendente', value: 'desc' },
    { label: 'Ascendente', value: 'asc' }
  ];

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
      untracked(() => {
        this.rows.set([]);
        this.total.set(0);
        this.page.set(0);
        void this.loadRows();
      });
    });
  }

  async ngOnInit(): Promise<void> {
    await this.providerScope.load();
    await Promise.all([this.loadCatalogo(), this.loadRows()]);
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

  protected async setTipificaciones(values: string[]): Promise<void> {
    this.selectedTipificaciones.set(values ?? []);
    this.page.set(0);
    await this.loadRows();
  }

  protected async onPeriodoChange(periodo: MetricsPeriodo): Promise<void> {
    this.periodo.set(periodo);
  }

  protected async onRangoChange(rango: MetricsRango): Promise<void> {
    this.dia.set(rango.desde);
    this.hasta.set(rango.hasta);
    this.page.set(0);
    await this.loadRows();
  }

  protected async setOrigen(value: OrigenFilaBandejaVenta): Promise<void> {
    this.origen.set(value);
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
    this.page.set(0);
    await this.loadRows();
  }

  protected async setDirection(value: SortDirection): Promise<void> {
    this.direction.set(value);
    this.page.set(0);
    await this.loadRows();
  }

  protected async sort(field: SortField): Promise<void> {
    if (this.sortBy() === field) {
      this.direction.set(this.direction() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.direction.set(field === 'fechaRelevante' || field === 'fechaIngresoEtapa' ? 'desc' : 'asc');
    }
    this.page.set(0);
    await this.loadRows();
  }

  protected async onPage(event: { page?: number }): Promise<void> {
    this.page.set(event.page ?? 0);
    await this.loadRows();
  }

  protected async clearFilters(): Promise<void> {
    this.selectedTipificaciones.set([]);
    this.searchInput.set('');
    this.searchActive.set('');
    this.origen.set('ESTADO_ACTUAL');
    this.groupBy.set('SIN_AGRUPAR');
    this.sortBy.set('fechaIngresoEtapa');
    this.direction.set('desc');
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
      case 'ULTIMO_GESTOR':
        return this.display(row.nombreAsesorUltimaGestion ?? row.nombreAsesorEvento, 'Sin gestor');
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

  private async loadCatalogo(): Promise<void> {
    this.catalogLoading.set(true);
    try {
      const catalogo = await firstValueFrom(this.leadService.getCatalogoAgregado('VENTA'));
      this.catalogo.set([...(catalogo.tipificaciones ?? [])].sort((a, b) => a.orden - b.orden));
    } finally {
      this.catalogLoading.set(false);
    }
  }

  private async loadRows(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(this.leadService.listarBandejaVentaNormalizada({
        pageNumber: this.page(),
        pageSize: this.pageSize,
        sortBy: this.sortBy(),
        direction: this.direction(),
        lead: this.searchActive() || null,
        codigosTipificacion: this.selectedTipificaciones(),
        origen: this.origen(),
        idEquipo: this.adminEquipoId(),
        fechaDesde: this.dia(),
        fechaHasta: this.hasta(),
        campoFecha: 'INGRESO' satisfies CampoFechaListadoVenta,
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

  private adminEquipoId(): number | null {
    const raw = this.route.snapshot.paramMap.get('idEquipo');
    const id = raw ? Number(raw) : NaN;
    return Number.isFinite(id) ? id : null;
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
