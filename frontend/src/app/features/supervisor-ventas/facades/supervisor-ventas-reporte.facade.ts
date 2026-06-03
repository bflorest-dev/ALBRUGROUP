import { Injectable, computed, signal } from '@angular/core';
import {
  SupervisorVentasReporteAsesorResponse,
  SupervisorVentasReporteProveedorCantidadResponse,
  SupervisorVentasReporteResponse
} from '../../../shared/models/preventa/preventa.models';

type ReportPreset = 'current-month' | 'previous-month' | 'custom';

type ProviderColumn = {
  idProveedor: number;
  nombreProveedor: string;
  shortLabel: string;
  headerClass: string;
};

type ReportMetricCellView = {
  idProveedor: number;
  nombreProveedor: string;
  shortLabel: string;
  preventas: number;
  ventas: number;
  conversion: number;
  preventasLabel: string;
  ventasLabel: string;
  conversionLabel: string;
};

export type SupervisorVentasReporteRowView = {
  idAsesor: number;
  nombreAsesor: string;
  metricas: ReportMetricCellView[];
  preventasTotales: number;
  ventasTotales: number;
  conversionTotal: number;
  conversionTotalLabel: string;
};

export type SupervisorVentasReporteResumenProveedorView = {
  idProveedor: number;
  nombreProveedor: string;
  shortLabel: string;
  preventas: number;
  ventas: number;
  conversion: number;
  conversionLabel: string;
  headerClass: string;
};

type ReportSeed = {
  idAsesor: number;
  nombreAsesor: string;
  providers: Array<{
    idProveedor: number;
    nombreProveedor: string;
    preventasMesBase: number;
    conversionBase: number;
  }>;
};

const PROVIDER_META: Record<number, { shortLabel: string; headerClass: string }> = {
  1: { shortLabel: 'WIN', headerClass: 'provider-win' },
  2: { shortLabel: 'PERU FIBRA', headerClass: 'provider-peru-fibra' },
  3: { shortLabel: 'MIFIBRA', headerClass: 'provider-mifibra' }
};

const REPORT_SEEDS: ReportSeed[] = [
  {
    idAsesor: 101,
    nombreAsesor: 'Jessica',
    providers: [
      { idProveedor: 1, nombreProveedor: 'WIN', preventasMesBase: 54, conversionBase: 0.69 },
      { idProveedor: 2, nombreProveedor: 'Peru Fibra', preventasMesBase: 9, conversionBase: 0.48 },
      { idProveedor: 3, nombreProveedor: 'MiFibra', preventasMesBase: 1, conversionBase: 0.0 }
    ]
  },
  {
    idAsesor: 102,
    nombreAsesor: 'Yaritza',
    providers: [
      { idProveedor: 1, nombreProveedor: 'WIN', preventasMesBase: 50, conversionBase: 0.74 },
      { idProveedor: 2, nombreProveedor: 'Peru Fibra', preventasMesBase: 4, conversionBase: 0.25 },
      { idProveedor: 3, nombreProveedor: 'MiFibra', preventasMesBase: 0, conversionBase: 0.0 }
    ]
  },
  {
    idAsesor: 103,
    nombreAsesor: 'Lucia',
    providers: [
      { idProveedor: 1, nombreProveedor: 'WIN', preventasMesBase: 31, conversionBase: 0.61 },
      { idProveedor: 2, nombreProveedor: 'Peru Fibra', preventasMesBase: 2, conversionBase: 0.0 },
      { idProveedor: 3, nombreProveedor: 'MiFibra', preventasMesBase: 0, conversionBase: 0.0 }
    ]
  },
  {
    idAsesor: 104,
    nombreAsesor: 'Oscar',
    providers: [
      { idProveedor: 1, nombreProveedor: 'WIN', preventasMesBase: 28, conversionBase: 0.75 },
      { idProveedor: 2, nombreProveedor: 'Peru Fibra', preventasMesBase: 3, conversionBase: 0.33 },
      { idProveedor: 3, nombreProveedor: 'MiFibra', preventasMesBase: 0, conversionBase: 0.0 }
    ]
  },
  {
    idAsesor: 105,
    nombreAsesor: 'Xiomara',
    providers: [
      { idProveedor: 1, nombreProveedor: 'WIN', preventasMesBase: 27, conversionBase: 0.78 },
      { idProveedor: 2, nombreProveedor: 'Peru Fibra', preventasMesBase: 1, conversionBase: 0.0 },
      { idProveedor: 3, nombreProveedor: 'MiFibra', preventasMesBase: 0, conversionBase: 0.0 }
    ]
  },
  {
    idAsesor: 106,
    nombreAsesor: 'Juan',
    providers: [
      { idProveedor: 1, nombreProveedor: 'WIN', preventasMesBase: 25, conversionBase: 0.72 },
      { idProveedor: 2, nombreProveedor: 'Peru Fibra', preventasMesBase: 2, conversionBase: 0.5 },
      { idProveedor: 3, nombreProveedor: 'MiFibra', preventasMesBase: 0, conversionBase: 0.0 }
    ]
  },
  {
    idAsesor: 107,
    nombreAsesor: 'Gabriel',
    providers: [
      { idProveedor: 1, nombreProveedor: 'WIN', preventasMesBase: 22, conversionBase: 0.55 },
      { idProveedor: 2, nombreProveedor: 'Peru Fibra', preventasMesBase: 1, conversionBase: 1.0 },
      { idProveedor: 3, nombreProveedor: 'MiFibra', preventasMesBase: 0, conversionBase: 0.0 }
    ]
  },
  {
    idAsesor: 108,
    nombreAsesor: 'Nicole',
    providers: [
      { idProveedor: 1, nombreProveedor: 'WIN', preventasMesBase: 7, conversionBase: 0.71 },
      { idProveedor: 2, nombreProveedor: 'Peru Fibra', preventasMesBase: 1, conversionBase: 1.0 },
      { idProveedor: 3, nombreProveedor: 'MiFibra', preventasMesBase: 0, conversionBase: 0.0 }
    ]
  }
];

@Injectable()
export class SupervisorVentasReporteFacade {
  private readonly isPreview = signal(true);
  readonly isLoading = signal(false);
  readonly preset = signal<ReportPreset>('current-month');
  readonly fechaDesde = signal(this.firstDayOfCurrentMonth());
  readonly fechaHasta = signal(this.todayIso());

  readonly hasInvalidRange = computed(() => {
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();
    return !desde || !hasta || desde > hasta;
  });

  readonly report = computed<SupervisorVentasReporteResponse | null>(() => {
    if (this.hasInvalidRange()) {
      return null;
    }

    return this.buildPreviewReport(this.fechaDesde(), this.fechaHasta());
  });

  readonly providerColumns = computed<ProviderColumn[]>(() => {
    const report = this.report();
    if (!report) {
      return [];
    }

    const map = new Map<number, ProviderColumn>();
    for (const asesor of report.asesores) {
      for (const provider of asesor.preventasPorProveedor) {
        const meta = this.providerMeta(provider.idProveedor, provider.nombreProveedor);
        if (!map.has(provider.idProveedor)) {
          map.set(provider.idProveedor, {
            idProveedor: provider.idProveedor,
            nombreProveedor: provider.nombreProveedor,
            shortLabel: meta.shortLabel,
            headerClass: meta.headerClass
          });
        }
      }
    }

    return Array.from(map.values()).sort((left, right) => left.idProveedor - right.idProveedor);
  });

  readonly rows = computed<SupervisorVentasReporteRowView[]>(() => {
    const report = this.report();
    const providers = this.providerColumns();
    if (!report) {
      return [];
    }

    return report.asesores
      .map((asesor) => this.toRowView(asesor, providers))
      .sort((left, right) => right.preventasTotales - left.preventasTotales || left.nombreAsesor.localeCompare(right.nombreAsesor));
  });

  readonly resumenPorProveedor = computed<SupervisorVentasReporteResumenProveedorView[]>(() => {
    const providers = this.providerColumns();
    const rows = this.rows();

    return providers.map((provider) => {
      const preventas = rows.reduce((total, row) => total + (row.metricas.find((metric) => metric.idProveedor === provider.idProveedor)?.preventas ?? 0), 0);
      const ventas = rows.reduce((total, row) => total + (row.metricas.find((metric) => metric.idProveedor === provider.idProveedor)?.ventas ?? 0), 0);
      const conversion = preventas > 0 ? ventas / preventas : 0;

      return {
        idProveedor: provider.idProveedor,
        nombreProveedor: provider.nombreProveedor,
        shortLabel: provider.shortLabel,
        preventas,
        ventas,
        conversion,
        conversionLabel: this.formatPercent(conversion),
        headerClass: provider.headerClass
      };
    });
  });

  readonly kpis = computed(() => {
    const rows = this.rows();
    const preventas = rows.reduce((total, row) => total + row.preventasTotales, 0);
    const ventas = rows.reduce((total, row) => total + row.ventasTotales, 0);
    const conversion = preventas > 0 ? ventas / preventas : 0;

    return {
      preventas,
      ventas,
      conversion,
      conversionLabel: this.formatPercent(conversion),
      asesoresActivos: rows.filter((row) => row.preventasTotales > 0).length
    };
  });

  readonly periodoLabel = computed(() => {
    if (this.hasInvalidRange()) {
      return 'Rango pendiente de corrección';
    }

    return `${this.formatHumanDate(this.fechaDesde())} al ${this.formatHumanDate(this.fechaHasta())}`;
  });

  readonly statusMessage = computed(() =>
    this.hasInvalidRange() ? 'La fecha inicial no puede ser posterior a la fecha final.' : ''
  );

  setPreset(preset: ReportPreset): void {
    this.preset.set(preset);

    if (preset === 'current-month') {
      this.fechaDesde.set(this.firstDayOfCurrentMonth());
      this.fechaHasta.set(this.todayIso());
      return;
    }

    if (preset === 'previous-month') {
      const previous = this.previousMonthRange();
      this.fechaDesde.set(previous.fechaDesde);
      this.fechaHasta.set(previous.fechaHasta);
    }
  }

  setFechaDesde(value: string): void {
    this.preset.set('custom');
    this.fechaDesde.set(value);
  }

  setFechaHasta(value: string): void {
    this.preset.set('custom');
    this.fechaHasta.set(value);
  }

  private toRowView(
    asesor: SupervisorVentasReporteAsesorResponse,
    providers: ProviderColumn[]
  ): SupervisorVentasReporteRowView {
    const preventasByProvider = new Map(asesor.preventasPorProveedor.map((item) => [item.idProveedor, item.cantidad]));
    const ventasByProvider = new Map(asesor.ventasInstaladasPorProveedor.map((item) => [item.idProveedor, item.cantidad]));

    const metricas = providers.map((provider) => {
      const preventas = preventasByProvider.get(provider.idProveedor) ?? 0;
      const ventas = ventasByProvider.get(provider.idProveedor) ?? 0;
      const conversion = preventas > 0 ? ventas / preventas : 0;

      return {
        idProveedor: provider.idProveedor,
        nombreProveedor: provider.nombreProveedor,
        shortLabel: provider.shortLabel,
        preventas,
        ventas,
        conversion,
        preventasLabel: this.formatInteger(preventas),
        ventasLabel: this.formatInteger(ventas),
        conversionLabel: this.formatPercent(conversion)
      };
    });

    const preventasTotales = metricas.reduce((total, metric) => total + metric.preventas, 0);
    const ventasTotales = metricas.reduce((total, metric) => total + metric.ventas, 0);
    const conversionTotal = preventasTotales > 0 ? ventasTotales / preventasTotales : 0;

    return {
      idAsesor: asesor.idAsesor,
      nombreAsesor: asesor.nombreAsesor,
      metricas,
      preventasTotales,
      ventasTotales,
      conversionTotal,
      conversionTotalLabel: this.formatPercent(conversionTotal)
    };
  }

  private buildPreviewReport(fechaDesde: string, fechaHasta: string): SupervisorVentasReporteResponse {
    const spanDays = this.daysBetweenInclusive(fechaDesde, fechaHasta);
    const factor = Math.max(spanDays, 1) / 31;

    return {
      fechaDesde,
      fechaHasta,
      asesores: REPORT_SEEDS.map((seed) => {
        const preventasPorProveedor = seed.providers.map((provider) => {
          const cantidad = this.scaleCount(provider.preventasMesBase, factor);
          return {
            idProveedor: provider.idProveedor,
            nombreProveedor: provider.nombreProveedor,
            cantidad
          };
        });

        const ventasInstaladasPorProveedor = seed.providers.map((provider, index) => {
          const preventas = preventasPorProveedor[index]?.cantidad ?? 0;
          const cantidad = Math.min(preventas, Math.round(preventas * provider.conversionBase));
          return {
            idProveedor: provider.idProveedor,
            nombreProveedor: provider.nombreProveedor,
            cantidad
          };
        });

        return {
          idAsesor: seed.idAsesor,
          nombreAsesor: seed.nombreAsesor,
          preventasCompletas: preventasPorProveedor.reduce((total, item) => total + item.cantidad, 0),
          ventasInstaladas: ventasInstaladasPorProveedor.reduce((total, item) => total + item.cantidad, 0),
          preventasPorProveedor,
          ventasInstaladasPorProveedor
        };
      })
    };
  }

  private providerMeta(idProveedor: number, nombreProveedor: string): { shortLabel: string; headerClass: string } {
    const predefined = PROVIDER_META[idProveedor];
    if (predefined) {
      return predefined;
    }

    const compact = nombreProveedor.toUpperCase();
    return {
      shortLabel: compact,
      headerClass: 'provider-generic'
    };
  }

  private scaleCount(base: number, factor: number): number {
    if (base <= 0) {
      return 0;
    }

    return Math.max(1, Math.round(base * factor));
  }

  private daysBetweenInclusive(fechaDesde: string, fechaHasta: string): number {
    const start = this.parseIsoDate(fechaDesde);
    const end = this.parseIsoDate(fechaHasta);
    if (!start || !end || end < start) {
      return 0;
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
  }

  private parseIsoDate(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }

    return date;
  }

  private formatPercent(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  private formatInteger(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      maximumFractionDigits: 0
    }).format(value);
  }

  private formatHumanDate(value: string): string {
    const parsed = this.parseIsoDate(value);
    if (!parsed) {
      return value;
    }

    return this.capitalizeFirst(
      new Intl.DateTimeFormat('es-PE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(parsed)
    );
  }

  private firstDayOfCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}-01`;
  }

  private todayIso(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  private previousMonthRange(): { fechaDesde: string; fechaHasta: string } {
    const now = new Date();
    const firstOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastOfPreviousMonth = new Date(firstOfCurrentMonth.getTime() - 24 * 60 * 60 * 1000);
    const firstOfPreviousMonth = new Date(lastOfPreviousMonth.getFullYear(), lastOfPreviousMonth.getMonth(), 1);

    return {
      fechaDesde: this.toIsoDate(firstOfPreviousMonth),
      fechaHasta: this.toIsoDate(lastOfPreviousMonth)
    };
  }

  private toIsoDate(date: Date): string {
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  private capitalizeFirst(value: string): string {
    if (!value) {
      return value;
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
