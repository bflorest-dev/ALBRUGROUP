import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CampoTipificacion, Etapa, SubtipificacionResponse, TipificacionResponse } from '../../../shared/models/preventa/preventa.models';
import { AdminEquipoService, ProveedorLite } from '../services/admin-equipo.service';
import { AdminTipificacionService } from '../services/admin-tipificacion.service';
import {
  BaseLeadPreviewResponse,
  BaseLeadsExportFilter,
  BaseLeadsService,
  OrigenResponse
} from '../services/base-leads.service';

@Injectable({ providedIn: 'root' })
export class AdminBaseLeadsFacade {
  private readonly service = inject(BaseLeadsService);
  private readonly equipoService = inject(AdminEquipoService);
  private readonly tipificacionService = inject(AdminTipificacionService);

  readonly etapa = signal<Etapa>('PREVENTA');
  readonly desde = signal<Date>(this.defaultDesde());
  readonly hasta = signal<Date>(new Date());
  readonly campoTipificacion = signal<CampoTipificacion>('ULTIMA');
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
  readonly origenCodigo = signal('PREDICTIVO');
  readonly maxLeadsPorArchivo = signal(1000);

  readonly proveedores = signal<ProveedorLite[]>([]);
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

  readonly campoOptions: { label: string; value: CampoTipificacion }[] = [
    { label: 'Primera', value: 'PRIMERA' },
    { label: 'Última', value: 'ULTIMA' },
    { label: 'Mayor', value: 'MAYOR' }
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

  readonly hasResults = computed(() => this.totalForExport() > 0);
  readonly archivosEstimados = computed(() => Math.ceil(this.totalForExport() / this.maxLeadsPorArchivo()));

  async init(): Promise<void> {
    this.isLoadingCatalog.set(true);
    this.catalogError.set(null);

    const [proveedoresResult, origenesResult] = await Promise.allSettled([
      firstValueFrom(this.equipoService.listarProveedores()),
      firstValueFrom(this.service.listarOrigenes())
    ]);

    const errors: string[] = [];

    if (proveedoresResult.status === 'fulfilled') {
      this.proveedores.set(proveedoresResult.value);
    } else {
      this.proveedores.set([]);
      errors.push('proveedores');
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
    const idProveedor = this.idProveedor();
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
    this.isExporting.set(true);
    try {
      const blob = await firstValueFrom(
        this.service.exportZip({
          filter: this.buildFilter(),
          origenCodigo: this.origenCodigo(),
          maxLeadsPorArchivo: this.maxLeadsPorArchivo()
        })
      );
      this.downloadBlob(blob, this.suggestedName() + '.zip');
    } finally {
      this.isExporting.set(false);
    }
  }

  private buildFilter(): BaseLeadsExportFilter {
    const filter: BaseLeadsExportFilter = {
      etapa: this.etapa(),
      desde: this.formatDate(this.desde()),
      hasta: this.formatDate(this.hasta()),
      campoTipificacion: this.campoTipificacion()
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
