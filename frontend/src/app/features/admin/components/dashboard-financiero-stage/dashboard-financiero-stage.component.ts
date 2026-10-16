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
  block: 'ing' | 'inst' | 'redes' | 'cashback' | 'cf' | 'roi';
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
  protected readonly isDraggingTable = signal(false);
  private readonly data = signal<ResumenFinancieroDia[]>([]);
  private dragStartX = 0;
  private dragStartScrollLeft = 0;
  private activePointerId: number | null = null;

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

    // CASHBACK PROMOCIONAL
    rows.push({ label: 'CASHBACK PROMOCIONAL', monthTotal: 0, values: [], format: 'currency', isTotal: false, isSection: true, block: 'cashback' });
    {
      const values = dias.map(d => d.cashbackPreventa ?? 0);
      rows.push({ label: 'Preventa', monthTotal: sumRow(values), values, format: 'currency', isTotal: false, isSection: false, block: 'cashback' });
    }
    {
      const values = dias.map(d => d.cashbackPostventa ?? 0);
      rows.push({ label: 'Postventa', monthTotal: sumRow(values), values, format: 'currency', isTotal: false, isSection: false, block: 'cashback' });
    }
    {
      const values = dias.map(d => (d.cashbackPreventa ?? 0) + (d.cashbackPostventa ?? 0));
      rows.push({ label: 'Total cashback', monthTotal: sumRow(values), values, format: 'currency', isTotal: true, isSection: false, block: 'cashback' });
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
      const cashbackValues = dias.map(d => (d.cashbackPreventa ?? 0) + (d.cashbackPostventa ?? 0));
      const values = totalCfValues.map((cf, i) => {
        const costoTotal = ctaBancariaValues[i] + cashbackValues[i];
        return costoTotal > 0 ? (cf - costoTotal) / costoTotal : 0;
      });
      const totalCfMes = totalCfValues.reduce((s, v) => s + v, 0);
      const totalCtaMes = ctaBancariaValues.reduce((s, v) => s + v, 0);
      const totalCashbackMes = cashbackValues.reduce((s, v) => s + v, 0);
      const costoTotalMes = totalCtaMes + totalCashbackMes;
      const monthTotal = costoTotalMes > 0 ? (totalCfMes - costoTotalMes) / costoTotalMes : 0;
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

  protected readonly totalInstaladas = computed(() =>
    this.data().reduce(
      (total, dia) => total + dia.zonas.reduce((subtotal, zona) => subtotal + zona.instaladas, 0),
      0
    )
  );

  protected readonly isMonthlyView = computed(() =>
    this.periodo() === 'mes' || this.isFullMonthRange(this.dia(), this.hasta())
  );

  protected readonly projectedInstaladas = computed(() => {
    const instaladas = this.totalInstaladas();
    const { transcurridos, restantes } = this.operationalDaysForMonthlyRange();

    if (transcurridos === 0 || restantes === 0) return instaladas;

    return Math.round(instaladas + (instaladas / transcurridos) * restantes);
  });

  protected readonly roiMensual = computed(() => {
    const dias = this.data();
    const totalCf = dias.reduce((s, d) => s + d.zonas.reduce((zs, z) => zs + z.cfInstaladas, 0), 0);
    const totalCta = dias.reduce((s, d) => s + d.ctaBancaria, 0);
    const totalCashback = dias.reduce((s, d) => s + (d.cashbackPreventa ?? 0) + (d.cashbackPostventa ?? 0), 0);
    const costoTotal = totalCta + totalCashback;
    return costoTotal > 0 ? (totalCf - costoTotal) / costoTotal : 0;
  });

  protected readonly periodoLabel = computed(() => {
    const dias = this.data();
    if (!dias.length) return '';
    const first = dias[0].fecha;
    const last = dias[dias.length - 1].fecha;
    const f = (iso: string) => { const [, m, d] = iso.split('-'); return `${d}/${m}`; };
    return first === last ? f(first) : `${f(first)} – ${f(last)}`;
  });

  protected onTablePointerDown(event: PointerEvent): void {
    const scroller = event.currentTarget as HTMLElement;
    if (scroller.scrollWidth <= scroller.clientWidth) return;

    this.dragStartX = event.clientX;
    this.dragStartScrollLeft = scroller.scrollLeft;
    this.activePointerId = event.pointerId;
    scroller.setPointerCapture(event.pointerId);
    this.isDraggingTable.set(true);
  }

  protected onTablePointerMove(event: PointerEvent): void {
    if (this.activePointerId !== event.pointerId) return;

    const scroller = event.currentTarget as HTMLElement;
    scroller.scrollLeft = this.dragStartScrollLeft - (event.clientX - this.dragStartX);
  }

  protected onTablePointerUp(event: PointerEvent): void {
    if (this.activePointerId !== event.pointerId) return;

    const scroller = event.currentTarget as HTMLElement;
    if (scroller.hasPointerCapture(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
    }
    this.activePointerId = null;
    this.isDraggingTable.set(false);
  }

  protected onTableWheel(event: WheelEvent): void {
    const scroller = event.currentTarget as HTMLElement;
    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
    if (maxScrollLeft <= 0) return;

    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (delta === 0) return;

    const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, scroller.scrollLeft + delta));
    if (nextScrollLeft === scroller.scrollLeft) return;

    scroller.scrollLeft = nextScrollLeft;
    event.preventDefault();
  }

  protected onTableKeydown(event: KeyboardEvent): void {
    const scroller = event.currentTarget as HTMLElement;
    const step = Math.max(180, scroller.clientWidth * 0.35);
    let nextScrollLeft: number | null = null;

    if (event.key === 'ArrowLeft') nextScrollLeft = scroller.scrollLeft - step;
    if (event.key === 'ArrowRight') nextScrollLeft = scroller.scrollLeft + step;
    if (event.key === 'Home') nextScrollLeft = 0;
    if (event.key === 'End') nextScrollLeft = scroller.scrollWidth;

    if (nextScrollLeft === null) return;

    event.preventDefault();
    scroller.scrollTo({ left: nextScrollLeft, behavior: 'smooth' });
  }

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

  private operationalDaysForMonthlyRange(): { transcurridos: number; restantes: number } {
    const selectedStart = this.dia();
    const selectedEnd = this.hasta();

    if (this.isFullMonthRange(selectedStart, selectedEnd)) {
      const start = this.parseIsoDate(selectedStart!);
      const end = this.parseIsoDate(selectedEnd!);
      const today = new Date();
      const isCurrentMonth = start.getFullYear() === today.getFullYear()
        && start.getMonth() === today.getMonth();

      if (!isCurrentMonth) {
        return {
          transcurridos: this.countDaysWithoutSunday(start, end),
          restantes: 0
        };
      }
    }

    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrow = new Date(currentDay);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      transcurridos: this.countDaysWithoutSunday(start, currentDay),
      restantes: this.countDaysWithoutSunday(tomorrow, end)
    };
  }

  private isFullMonthRange(desde: string | null, hasta: string | null): boolean {
    if (!desde || !hasta) return false;

    const start = this.parseIsoDateParts(desde);
    const end = this.parseIsoDateParts(hasta);

    return start.year === end.year
      && start.month === end.month
      && start.day === 1
      && end.day === new Date(start.year, start.month, 0).getDate();
  }

  private parseIsoDate(value: string): Date {
    const { year, month, day } = this.parseIsoDateParts(value);
    return new Date(year, month - 1, day);
  }

  private parseIsoDateParts(value: string): { year: number; month: number; day: number } {
    const [year, month, day] = value.split('-').map(Number);
    return { year, month, day };
  }

  private countDaysWithoutSunday(from: Date, to: Date): number {
    if (from > to) return 0;

    let count = 0;
    const date = new Date(from);
    while (date <= to) {
      if (date.getDay() !== 0) count += 1;
      date.setDate(date.getDate() + 1);
    }
    return count;
  }
}
