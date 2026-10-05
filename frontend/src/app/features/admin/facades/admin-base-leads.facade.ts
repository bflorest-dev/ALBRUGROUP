import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MetricsPeriodo } from '../../../shared/components/period-selector/period-selector.component';
import { MetricsRango, localToday, monthStart, resolveMetricsRange } from '../../../shared/utils/metrics-period';
import { CampoTipificacion, Etapa, SubtipificacionResponse, TipificacionResponse } from '../../../shared/models/preventa/preventa.models';
import { AdminEquipoService, ProveedorLite } from '../services/admin-equipo.service';
import { AdminTipificacionService } from '../services/admin-tipificacion.service';
import {
  BaseLeadPreviewResponse,
  AnclaFechaBaseLeads,
  BaseLeadsExportFilter,
  BaseLeadsService,
  OrigenResponse,
  VistaBaseLeads
} from '../services/base-leads.service';

export type ModoExport = 'ALB' | 'EXCEL';

@Injectable({ providedIn: 'root' })
export class AdminBaseLeadsFacade {
  private readonly service = inject(BaseLeadsService);
  private readonly equipoService = inject(AdminEquipoService);
  private readonly tipificacionService = inject(AdminTipificacionService);

  readonly vista = signal<VistaBaseLeads>('BASE');
  readonly etapa = signal<Etapa>('PREVENTA');
  readonly desde = signal<Date>(this.defaultDesde());
  readonly hasta = signal<Date>(new Date());
  readonly periodoInstalados = signal<MetricsPeriodo>('mes');
  readonly diaInstalados = signal<string | null>(monthStart());
  readonly hastaInstalados = signal<string | null>(localToday());
  readonly campoTipificacion = signal<CampoTipificacion>('ULTIMA');
  readonly anclaFecha = signal<AnclaFechaBaseLeads>('TIPIFICACION');
  readonly idProveedorOrigen = signal<number | null>(null);
  readonly idProveedor = signal<number | null>(null);
  readonly codigosTipificacion = signal<string[]>([]);
  readonly codigosSubtipificacion = signal<string[]>([]);

  readonly rows = signal<BaseLeadPreviewResponse[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly pageSize = signal(20);
  readonly isLoading = signal(false);

  readonly totalForExport = signal(0);
  readonly suggestedName = signal('');
  readonly isExporting = signal(false);
  readonly modoExport = signal<ModoExport>('ALB');
  readonly origenCodigo = signal('PREDICTIVO');
  readonly maxLeadsPorArchivo = signal(1000);

  readonly proveedores = signal<ProveedorLite[]>([]);
  readonly proveedoresOrigen = signal<ProveedorLite[]>([]);
  readonly tipificaciones = signal<TipificacionResponse[]>([]);
  readonly origenes = signal<OrigenResponse[]>([]);
  readonly catalogLoaded = signal(false);
  readonly isLoadingCatalog = signal(false);
  readonly isLoadingTipificaciones = signal(false);
  readonly catalogError = signal<string | null>(null);
  readonly tipificacionesError = signal<string | null>(null);

  private tipificacionesRequestId = 0;

  readonly etapaOptions: { label: string; value: Etapa }[] = [
    { label: 'Preventa', value: 'PREVENTA' },
    { label: 'Venta', value: 'VENTA' },
    { label: 'Postventa', value: 'POSTVENTA' },
    { label: 'Cobranza', value: 'COBRANZA' }
  ];

  readonly vistaOptions: { label: string; value: VistaBaseLeads }[] = [
    { label: 'Base', value: 'BASE' },
    { label: 'Instalados', value: 'INSTALADOS' }
  ];

  readonly campoOptions: { label: string; value: CampoTipificacion }[] = [
    { label: 'Primera', value: 'PRIMERA' },
    { label: 'Última', value: 'ULTIMA' },
    { label: 'Mayor', value: 'MAYOR' }
  ];

  readonly anclaFechaOptions: { label: string; value: AnclaFechaBaseLeads }[] = [
    { label: 'Fecha de tipificación', value: 'TIPIFICACION' },
    { label: 'Ingreso a etapa', value: 'INGRESO_ETAPA' }
  ];

  readonly subtipificacionesDisponibles = computed<SubtipificacionResponse[]>(() => {
    const tipis = this.tipificaciones();
    const seleccionadas = this.codigosTipificacion();
    if (!seleccionadas.length) {
      return tipis.flatMap(t => t.subtipificaciones ?? []);
    }
    return tipis
      .filter(t => seleccionadas.includes(t.codigo))
      .flatMap(t => t.subtipificaciones ?? []);
  });

  readonly maxLeadsValido = computed(() => {
    const v = this.maxLeadsPorArchivo();
    return Number.isFinite(v) && v >= 50 && v <= 5000;
  });

  readonly hasResults = computed(() => this.totalForExport() > 0);
  readonly isInstalados = computed(() => this.vista() === 'INSTALADOS');
  readonly archivosEstimados = computed(() =>
    Math.ceil(this.totalForExport() / this.clampMaxLeads())
  );

  async init(): Promise<void> {
    this.isLoadingCatalog.set(true);
    this.catalogError.set(null);

    const [proveedoresResult, proveedoresOrigenResult, origenesResult] = await Promise.allSettled([
      firstValueFrom(this.equipoService.listarProveedores()),
      firstValueFrom(this.equipoService.listarProveedoresIncluyendoInactivos()),
      firstValueFrom(this.service.listarOrigenes())
    ]);

    const errors: string[] = [];

    if (proveedoresResult.status === 'fulfilled') {
      this.proveedores.set(proveedoresResult.value);
    } else {
      this.proveedores.set([]);
      errors.push('proveedores');
    }

    if (proveedoresOrigenResult.status === 'fulfilled') {
      this.proveedoresOrigen.set(proveedoresOrigenResult.value);
    } else {
      this.proveedoresOrigen.set([]);
      errors.push('proveedores de origen');
    }

    if (origenesResult.status === 'fulfilled') {
      const origenes = origenesResult.value.filter(origen => !origen.esCampana);
      this.origenes.set(origenes);
      if (origenes.length && !origenes.some(origen => origen.codigo === this.origenCodigo())) {
        this.origenCodigo.set(origenes[0].codigo);
      }
    } else {
      this.origenes.set([]);
      errors.push('orígenes');
    }

    this.catalogError.set(
      errors.length ? `No se pudieron cargar: ${errors.join(' y ')}.` : null
    );
    this.catalogLoaded.set(true);
    this.isLoadingCatalog.set(false);
  }

  async loadTipificaciones(): Promise<void> {
    const etapa = this.etapa();
    const idProveedor = this.idProveedor() ?? this.idProveedorOrigen();
    const requestId = ++this.tipificacionesRequestId;

    this.tipificacionesError.set(null);
    if (!idProveedor) {
      this.tipificaciones.set([]);
      this.isLoadingTipificaciones.set(false);
      return;
    }

    this.isLoadingTipificaciones.set(true);
    try {
      const catalogo = await firstValueFrom(
        this.tipificacionService.getCatalogo(etapa, idProveedor, false)
      );
      if (requestId === this.tipificacionesRequestId) {
        this.tipificaciones.set(catalogo.tipificaciones ?? []);
      }
    } catch {
      if (requestId === this.tipificacionesRequestId) {
        this.tipificaciones.set([]);
        this.tipificacionesError.set(
          'No se pudo cargar la matriz para la etapa y proveedor seleccionados.'
        );
      }
    } finally {
      if (requestId === this.tipificacionesRequestId) {
        this.isLoadingTipificaciones.set(false);
      }
    }
  }

  async buscar(): Promise<void> {
    this.page.set(0);
    await Promise.all([this.loadPreview(), this.loadCount()]);
  }

  async setVista(vista: VistaBaseLeads): Promise<void> {
    if (this.vista() === vista) {
      return;
    }
    this.vista.set(vista);
    this.rows.set([]);
    this.totalElements.set(0);
    this.totalForExport.set(0);
    this.suggestedName.set('');
    this.page.set(0);
    if (vista === 'INSTALADOS') {
      this.codigosTipificacion.set([]);
      this.codigosSubtipificacion.set([]);
      this.modoExport.set('EXCEL');
    }
  }

  setPeriodoInstalados(periodo: MetricsPeriodo | null | undefined): void {
    if (!periodo) {
      return;
    }
    this.periodoInstalados.set(periodo);
    const range = resolveMetricsRange(periodo, this.diaInstalados(), this.hastaInstalados());
    this.applyInstaladosRange(range.desde, range.hasta);
  }

  setRangoInstalados(rango: MetricsRango): void {
    this.periodoInstalados.set('dia');
    this.applyInstaladosRange(rango.desde, rango.hasta);
  }

  async loadPreview(): Promise<void> {
    this.isLoading.set(true);
    try {
      const result = await firstValueFrom(
        this.service.preview(this.buildFilter(), this.page(), this.pageSize())
      );
      this.rows.set(result.content);
      this.totalElements.set(result.totalElements);
    } catch {
      this.rows.set([]);
      this.totalElements.set(0);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadCount(): Promise<void> {
    try {
      const result = await firstValueFrom(this.service.count(this.buildFilter()));
      this.totalForExport.set(result.totalLeads);
      this.suggestedName.set(result.suggestedName);
    } catch {
      this.totalForExport.set(0);
      this.suggestedName.set('');
    }
  }

  async changePage(newPage: number): Promise<void> {
    this.page.set(newPage);
    await this.loadPreview();
  }

  async exportar(): Promise<void> {
    const maxLeads = this.clampMaxLeads();
    if (maxLeads !== this.maxLeadsPorArchivo()) {
      this.maxLeadsPorArchivo.set(maxLeads);
    }
    this.isExporting.set(true);
    try {
      const blob = await firstValueFrom(
        this.service.exportZip({
          filter: this.buildFilter(),
          origenCodigo: this.origenCodigo(),
          maxLeadsPorArchivo: maxLeads
        })
      );
      this.downloadBlob(blob, this.suggestedName() + '.zip');
    } finally {
      this.isExporting.set(false);
    }
  }

  async exportarExcel(): Promise<void> {
    this.isExporting.set(true);
    try {
      const blob = await firstValueFrom(this.service.exportExcel(this.buildFilter()));
      this.downloadBlob(blob, this.suggestedName() + '.xlsx');
    } finally {
      this.isExporting.set(false);
    }
  }

  private clampMaxLeads(): number {
    const v = this.maxLeadsPorArchivo();
    if (!Number.isFinite(v)) return 1000;
    return Math.min(5000, Math.max(50, Math.round(v)));
  }

  private buildFilter(): BaseLeadsExportFilter {
    if (this.isInstalados()) {
      const range = resolveMetricsRange(this.periodoInstalados(), this.diaInstalados(), this.hastaInstalados());
      const filter: BaseLeadsExportFilter = {
        vista: 'INSTALADOS',
        etapa: 'VENTA',
        desde: range.desde ?? localToday(),
        hasta: range.hasta ?? range.desde ?? localToday()
      };
      const pv = this.idProveedor();
      if (pv != null) filter.idProveedor = pv;
      return filter;
    }

    const filter: BaseLeadsExportFilter = {
      vista: 'BASE',
      etapa: this.etapa(),
      desde: this.formatDate(this.desde()),
      hasta: this.formatDate(this.hasta()),
      campoTipificacion: this.campoTipificacion(),
      anclaFecha: this.anclaFecha()
    };
    const pvOrigen = this.idProveedorOrigen();
    if (pvOrigen != null) filter.idProveedorOrigen = pvOrigen;
    const pv = this.idProveedor();
    if (pv != null) filter.idProveedor = pv;
    const codigos = this.codigosTipificacion();
    if (codigos.length) filter.codigosTipificacion = codigos;
    const subCodigos = this.codigosSubtipificacion();
    if (subCodigos.length) filter.codigosSubtipificacion = subCodigos;
    return filter;
  }

  private applyInstaladosRange(desde?: string, hasta?: string): void {
    const fallback = localToday();
    const from = desde ?? fallback;
    this.diaInstalados.set(from);
    this.hastaInstalados.set(hasta ?? from);
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private defaultDesde(): Date {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }
}
