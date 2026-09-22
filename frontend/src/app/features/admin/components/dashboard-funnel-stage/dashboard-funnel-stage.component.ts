import { DecimalPipe, PercentPipe } from '@angular/common';
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
import { MetricsRango, localToday, resolveMetricsRange } from '../../../../shared/utils/metrics-period';
import {
  DashboardFunnelResponse,
  DashboardFunnelService,
  ProveedorRef
} from '../../services/dashboard-funnel.service';

interface FunnelRow {
  key: string;
  label: string;
  value: number;
  pct: number;
  width: number;
  color: string;
  isMoney?: boolean;
  isSubtotal?: boolean;
}

const PROVEEDOR_ACCENT: Record<string, string> = { CLARO: '#c8384b', WIN: '#e8752b' };
const PROVEEDOR_ACCENT_DEFAULT = '#3a3f8f';

@Component({
  selector: 'app-dashboard-funnel-stage',
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
  templateUrl: './dashboard-funnel-stage.component.html',
  styleUrl: './dashboard-funnel-stage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardFunnelStageComponent implements OnInit {
  private readonly service = inject(DashboardFunnelService);

  protected readonly proveedores = signal<ProveedorRef[]>([]);
  protected readonly proveedorId = signal<number | null>(null);
  protected readonly periodo = signal<MetricsPeriodo>('mes');
  protected readonly dia = signal<string | null>(null);
  protected readonly hasta = signal<string | null>(null);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  private readonly data = signal<DashboardFunnelResponse | null>(null);

  protected readonly proveedorOptions = computed(() =>
    this.proveedores().map((p) => ({ label: p.nombre, value: p.id }))
  );

  protected readonly hayDatos = computed(() => this.data() !== null);

  protected readonly proveedorNombre = computed(
    () => this.proveedores().find((p) => p.id === this.proveedorId())?.nombre ?? ''
  );
  protected readonly providerAccent = computed(
    () => PROVEEDOR_ACCENT[this.proveedorNombre().toUpperCase()] ?? PROVEEDOR_ACCENT_DEFAULT
  );
  protected readonly periodoLabel = computed(() => {
    const p = this.data()?.periodo;
    if (p?.desde && p.hasta) {
      const desde = this.formatearFecha(p.desde);
      const hasta = this.formatearFecha(p.hasta);
      return p.desde === p.hasta ? desde : `${desde} – ${hasta}`;
    }
    return '';
  });

  // ── Métricas derivadas ─────────────────────────────────────────────────
  protected readonly c = computed(() => this.data()?.contadores ?? null);

  protected readonly leadsBrutos = computed(() => this.c()?.leadsBrutos ?? 0);
  protected readonly sinContacto = computed(() => this.c()?.sinContacto ?? 0);
  protected readonly leadsNetos = computed(() => this.leadsBrutos() - this.sinContacto());

  protected readonly noCalifica = computed(() => this.c()?.noCalifica ?? 0);
  protected readonly sinCobertura = computed(() => this.c()?.sinCobertura ?? 0);
  protected readonly noDesea = computed(() => this.c()?.noDesea ?? 0);
  protected readonly servicioActivo = computed(() => this.c()?.servicioActivo ?? 0);
  protected readonly noVenta = computed(() =>
    this.noCalifica() + this.sinCobertura() + this.noDesea() + this.servicioActivo()
  );

  protected readonly preventa = computed(() => this.c()?.preventa ?? 0);
  protected readonly instaladas = computed(() => this.c()?.instaladas ?? 0);
  protected readonly inversion = computed(() => this.c()?.inversion ?? 0);
  protected readonly costoPorLead = computed(() => {
    const inst = this.instaladas();
    return inst > 0 ? this.inversion() / inst : 0;
  });

  protected readonly funnelRows = computed<FunnelRow[]>(() => {
    const brutos = this.leadsBrutos();
    const netos = this.leadsNetos();
    if (!brutos) return [];
    const max = brutos;
    return [
      { key: 'brutos', label: 'Leads brutos', value: brutos, pct: 1, width: 100, color: 'primary' },
      { key: 'sinContacto', label: 'Sin contacto', value: this.sinContacto(), pct: this.pct(this.sinContacto(), brutos), width: this.w(this.sinContacto(), max), color: 'faint' },
      { key: 'netos', label: 'Leads netos', value: netos, pct: this.pct(netos, brutos), width: this.w(netos, max), color: 'info', isSubtotal: true },
      { key: 'noCalifica', label: 'No califica', value: this.noCalifica(), pct: this.pct(this.noCalifica(), netos), width: this.w(this.noCalifica(), max), color: 'warning' },
      { key: 'sinCobertura', label: 'Sin cobertura', value: this.sinCobertura(), pct: this.pct(this.sinCobertura(), netos), width: this.w(this.sinCobertura(), max), color: 'warning' },
      { key: 'noDesea', label: 'No desea', value: this.noDesea(), pct: this.pct(this.noDesea(), netos), width: this.w(this.noDesea(), max), color: 'danger' },
      { key: 'servicioActivo', label: 'Servicio activo', value: this.servicioActivo(), pct: this.pct(this.servicioActivo(), netos), width: this.w(this.servicioActivo(), max), color: 'teal' },
      { key: 'noVenta', label: 'No venta', value: this.noVenta(), pct: this.pct(this.noVenta(), netos), width: this.w(this.noVenta(), max), color: 'danger', isSubtotal: true },
      { key: 'preventa', label: 'Preventa', value: this.preventa(), pct: this.pct(this.preventa(), netos), width: this.w(this.preventa(), max), color: 'success' },
      { key: 'instaladas', label: 'Instaladas', value: this.instaladas(), pct: this.pct(this.instaladas(), netos), width: this.w(this.instaladas(), max), color: 'success' },
    ];
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────
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
    if (p !== 'dia') {
      this.dia.set(null);
      this.hasta.set(null);
    } else {
      this.dia.set(localToday());
      this.hasta.set(null);
    }
    void this.cargar();
  }

  protected onRangoChange(rango: MetricsRango): void {
    if (this.dia() === rango.desde && this.hasta() === rango.hasta && this.periodo() === 'dia') return;
    this.periodo.set('dia');
    this.dia.set(rango.desde);
    this.hasta.set(rango.hasta);
    void this.cargar();
  }

  protected async recargar(): Promise<void> {
    await this.cargar();
  }

  private async cargar(): Promise<void> {
    const idProveedor = this.proveedorId();
    if (idProveedor === null) return;
    this.isLoading.set(true);
    this.errorMessage.set('');
    const range = resolveMetricsRange(this.periodo(), this.dia(), this.hasta());
    try {
      const dashboard = await firstValueFrom(
        this.service.obtenerDashboard(idProveedor, range.desde, range.hasta)
      );
      this.data.set(dashboard);
    } catch {
      this.errorMessage.set('No se pudieron cargar las métricas del funnel.');
      this.data.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  private pct(n: number, total: number): number {
    return total > 0 ? n / total : 0;
  }
  private w(n: number, max: number): number {
    return max > 0 ? Math.max(2, Math.round((n / max) * 100)) : 2;
  }
  private formatearFecha(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
}
