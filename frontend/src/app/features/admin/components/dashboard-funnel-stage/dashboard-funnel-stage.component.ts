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

  protected pctOf(n: number, total: number): number {
    return total > 0 ? n / total : 0;
  }

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
  private formatearFecha(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
}
