import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import {
  MetricsPeriodo,
  PeriodSelectorComponent
} from '../../../../shared/components/period-selector/period-selector.component';
import { MetricsRango, formatLocalDate, monthStart } from '../../../../shared/utils/metrics-period';
import {
  DashboardFinancieroService,
  FinancieroProveedorRef,
  ResumenFinancieroDia
} from '../../services/dashboard-financiero.service';

const PROVEEDOR_ACCENT: Record<string, string> = { CLARO: '#c8384b', WIN: '#e8752b' };
const PROVEEDOR_ACCENT_DEFAULT = '#3a3f8f';

const DAY_NAMES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

interface TableRow {
  label: string;
  monthTotal: number;
  values: number[];
  format: 'integer' | 'currency' | 'percentage';
  isTotal: boolean;
  isSection: boolean;
  block: 'ing' | 'inst' | 'redes' | 'cf' | 'roi';
}

@Component({
  selector: 'app-dashboard-financiero-stage',
  imports: [
    DecimalPipe,
    PercentPipe,
    FormsModule,
    ButtonModule,
    MessageModule,
    SelectButtonModule,
    TooltipModule,
    PeriodSelectorComponent
  ],
  templateUrl: './dashboard-financiero-stage.component.html',
  styleUrl: './dashboard-financiero-stage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardFinancieroStageComponent implements OnInit {
  private readonly service = inject(DashboardFinancieroService);

  protected readonly proveedores = signal<FinancieroProveedorRef[]>([]);
  protected readonly proveedorId = signal<number | null>(null);
  protected readonly periodo = signal<MetricsPeriodo>('mes');
  protected readonly dia = signal<string | null>(null);
  protected readonly hasta = signal<string | null>(null);
  protected readonly periodos: MetricsPeriodo[] = ['mes', 'dia'];

  protected readonly isLoading = signal(false);
  protected readonly isRecalculating = signal(false);
  protected readonly errorMessage = signal('');
  private readonly data = signal<ResumenFinancieroDia[]>([]);

  protected readonly proveedorOptions = computed(() =>
    this.proveedores().map(p => ({ label: p.nombre, value: p.id }))
  );
  protected readonly proveedorNombre = computed(
    () => this.proveedores().find(p => p.id === this.proveedorId())?.nombre ?? ''
  );
  protected readonly providerAccent = computed(
    () => PROVEEDOR_ACCENT[this.proveedorNombre().toUpperCase()] ?? PROVEEDOR_ACCENT_DEFAULT
  );
  protected readonly hayDatos = computed(() => this.data().length > 0);

  protected readonly dayHeaders = computed(() =>
    this.data().map(d => {
      const [y, m, dd] = d.fecha.split('-').map(Number);
      const date = new Date(y, m - 1, dd);
      return {
        dayName: DAY_NAMES[date.getDay()],
        label: `${String(dd).padStart(2, '0')}/${String(m).padStart(2, '0')}`,
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      };
    })
  );

  private readonly zonaNames = computed(() => {
    const map = new Map<number, string>();
    for (const dia of this.data()) {
      for (const z of dia.zonas) {
        map.set(z.idZona, z.nombreZona);
      }
    }
    return [...map.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, nombre]) => ({ id, nombre }));
  });

  protected readonly tableRows = computed<TableRow[]>(() => {
    const dias = this.data();
    const zonas = this.zonaNames();
    if (!dias.length) return [];

    const rows: TableRow[] = [];
    const zoneVal = (diaIdx: number, zonaId: number, field: 'ingresadas' | 'instaladas' | 'cfInstaladas') => {
      const z = dias[diaIdx]?.zonas.find(z => z.idZona === zonaId);
      return z ? z[field] : 0;
    };
    const sumZones = (diaIdx: number, field: 'ingresadas' | 'instaladas' | 'cfInstaladas') =>
      dias[diaIdx]?.zonas.reduce((s, z) => s + z[field], 0) ?? 0;
    const sumRow = (values: number[]) => values.reduce((s, v) => s + v, 0);

    // INGRESADAS
    rows.push({ label: 'INGRESADAS', monthTotal: 0, values: [], format: 'integer', isTotal: false, isSection: true, block: 'ing' });
    for (const zona of zonas) {
      const values = dias.map((_, i) => zoneVal(i, zona.id, 'ingresadas'));
      rows.push({ label: `Ingresadas ${zona.nombre}`, monthTotal: sumRow(values), values, format: 'integer', isTotal: false, isSection: false, block: 'ing' });
    }
    {
      const values = dias.map((_, i) => sumZones(i, 'ingresadas'));
      rows.push({ label: 'Total ingresadas', monthTotal: sumRow(values), values, format: 'integer', isTotal: true, isSection: false, block: 'ing' });
    }

    // INSTALADAS
    rows.push({ label: 'INSTALADAS', monthTotal: 0, values: [], format: 'integer', isTotal: false, isSection: true, block: 'inst' });
    for (const zona of zonas) {
      const values = dias.map((_, i) => zoneVal(i, zona.id, 'instaladas'));
      rows.push({ label: `Instaladas ${zona.nombre}`, monthTotal: sumRow(values), values, format: 'integer', isTotal: false, isSection: false, block: 'inst' });
    }
    {
      const values = dias.map((_, i) => sumZones(i, 'instaladas'));
      rows.push({ label: 'Total instaladas', monthTotal: sumRow(values), values, format: 'integer', isTotal: true, isSection: false, block: 'inst' });
    }

    // REDES
    rows.push({ label: 'REDES', monthTotal: 0, values: [], format: 'currency', isTotal: false, isSection: true, block: 'redes' });
    {
      const values = dias.map(d => d.ctaBancaria);
      rows.push({ label: 'CTA bancaria', monthTotal: sumRow(values), values, format: 'currency', isTotal: false, isSection: false, block: 'redes' });
    }
    {
      const values = dias.map(d => d.ctaPublicitaria);
      rows.push({ label: 'CTA publicitaria', monthTotal: sumRow(values), values, format: 'currency', isTotal: false, isSection: false, block: 'redes' });
    }

    // CARGO FIJO
    rows.push({ label: 'CARGO FIJO', monthTotal: 0, values: [], format: 'currency', isTotal: false, isSection: true, block: 'cf' });
    for (const zona of zonas) {
      const values = dias.map((_, i) => zoneVal(i, zona.id, 'cfInstaladas'));
      rows.push({ label: `CF instaladas ${zona.nombre}`, monthTotal: sumRow(values), values, format: 'currency', isTotal: false, isSection: false, block: 'cf' });
    }
    {
      const values = dias.map((_, i) => sumZones(i, 'cfInstaladas'));
      rows.push({ label: 'Total CF', monthTotal: sumRow(values), values, format: 'currency', isTotal: true, isSection: false, block: 'cf' });
    }

    // ROI
    rows.push({ label: 'ROI', monthTotal: 0, values: [], format: 'percentage', isTotal: false, isSection: true, block: 'roi' });
    {
      const totalCfValues = dias.map((_, i) => sumZones(i, 'cfInstaladas'));
      const ctaBancariaValues = dias.map(d => d.ctaBancaria);
      const values = totalCfValues.map((cf, i) => {
        const cta = ctaBancariaValues[i];
        return cta > 0 ? (cf - cta) / cta : 0;
      });
      const totalCfMes = totalCfValues.reduce((s, v) => s + v, 0);
      const totalCtaMes = ctaBancariaValues.reduce((s, v) => s + v, 0);
      const monthTotal = totalCtaMes > 0 ? (totalCfMes - totalCtaMes) / totalCtaMes : 0;
      rows.push({ label: 'ROI instaladas', monthTotal, values, format: 'percentage', isTotal: true, isSection: false, block: 'roi' });
    }

    return rows;
  });

  protected readonly factorConversion = computed(() => {
    const dias = this.data();
    const totalIng = dias.reduce((s, d) => s + d.zonas.reduce((zs, z) => zs + z.ingresadas, 0), 0);
    const totalInst = dias.reduce((s, d) => s + d.zonas.reduce((zs, z) => zs + z.instaladas, 0), 0);
    return totalIng > 0 ? totalInst / totalIng : 0;
  });

  protected readonly roiMensual = computed(() => {
    const dias = this.data();
    const totalCf = dias.reduce((s, d) => s + d.zonas.reduce((zs, z) => zs + z.cfInstaladas, 0), 0);
    const totalCta = dias.reduce((s, d) => s + d.ctaBancaria, 0);
    return totalCta > 0 ? (totalCf - totalCta) / totalCta : 0;
  });

  protected readonly periodoLabel = computed(() => {
    const dias = this.data();
    if (!dias.length) return '';
    const first = dias[0].fecha;
    const last = dias[dias.length - 1].fecha;
    const f = (iso: string) => { const [, m, d] = iso.split('-'); return `${d}/${m}`; };
    return first === last ? f(first) : `${f(first)} – ${f(last)}`;
  });

  async ngOnInit(): Promise<void> {
    try {
      const proveedores = await firstValueFrom(this.service.obtenerProveedores());
      this.proveedores.set(proveedores ?? []);
      if (proveedores.length) {
        this.proveedorId.set(proveedores[0].id);
        await this.cargar();
      } else {
        this.errorMessage.set('No hay proveedores disponibles para tu usuario.');
      }
    } catch {
      this.errorMessage.set('No se pudieron cargar los proveedores.');
    }
  }

  protected onProveedorChange(id: number): void {
    if (id === this.proveedorId()) return;
    this.proveedorId.set(id);
    void this.cargar();
  }

  protected onPeriodoChange(p: MetricsPeriodo): void {
    if (p === this.periodo()) return;
    this.periodo.set(p);
    if (p === 'mes') {
      this.dia.set(null);
      this.hasta.set(null);
    }
    void this.cargar();
  }

  protected onRangoChange(rango: MetricsRango): void {
    this.periodo.set('dia');
    this.dia.set(rango.desde);
    this.hasta.set(rango.hasta);
    void this.cargar();
  }

  protected async recalcular(): Promise<void> {
    const idProveedor = this.proveedorId();
    if (idProveedor === null) return;
    const range = this.resolveRange();
    this.isRecalculating.set(true);
    this.errorMessage.set('');
    try {
      const result = await firstValueFrom(
        this.service.recalcular(idProveedor, range.desde, range.hasta)
      );
      this.data.set(result);
    } catch {
      this.errorMessage.set('Error al recalcular. Intenta nuevamente.');
    } finally {
      this.isRecalculating.set(false);
    }
  }

  protected async cargar(): Promise<void> {
    const idProveedor = this.proveedorId();
    if (idProveedor === null) return;
    const range = this.resolveRange();
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const result = await firstValueFrom(
        this.service.consultar(idProveedor, range.desde, range.hasta)
      );
      this.data.set(result);
    } catch {
      this.errorMessage.set('No se pudieron cargar los datos financieros.');
      this.data.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private resolveRange(): { desde: string; hasta: string } {
    if (this.periodo() === 'dia' && this.dia()) {
      return { desde: this.dia()!, hasta: this.hasta() || this.dia()! };
    }
    const start = monthStart();
    const [y, m] = start.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const hasta = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { desde: start, hasta };
  }
}
