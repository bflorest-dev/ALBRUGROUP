import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { merge } from 'rxjs';
import { auditTime, finalize } from 'rxjs/operators';
import {
  MetricsPeriodo,
  PeriodSelectorComponent
} from '../../../../shared/components/period-selector/period-selector.component';
import { MetricsRango, localToday, resolveMetricsRange } from '../../../../shared/utils/metrics-period';
import { LeadRealtimeService } from '../../../preventa/services/lead-realtime.service';
import { FreelanceVentaDrawerComponent } from '../../components/freelance-venta-drawer/freelance-venta-drawer.component';
import {
  FreelanceOpciones,
  FreelanceSeguimiento,
  FreelanceSeguimientoDetalle
} from '../../models/freelance.models';
import { FreelanceService } from '../../services/freelance.service';
import { clearFreelanceDrawerDraft, readFreelanceDrawerDraft } from '../../utils/freelance-drawer-draft';

const EMPTY_DATA: FreelanceSeguimiento = {
  contadores: { registradas: 0, subidas: 0, instaladas: 0, retornadas: 0 },
  estados: [],
  proveedores: [],
  detalle: []
};

@Component({
  selector: 'app-freelance-page',
  standalone: true,
  imports: [CommonModule, FormsModule, PeriodSelectorComponent, FreelanceVentaDrawerComponent],
  templateUrl: './freelance-page.component.html',
  styleUrl: './freelance-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FreelancePageComponent {
  readonly Math = Math;
  private readonly service = inject(FreelanceService);
  private readonly realtime = inject(LeadRealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly data = signal<FreelanceSeguimiento>(EMPTY_DATA);
  readonly options = signal<FreelanceOpciones | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly teamError = signal<string | null>(null);
  readonly providerId = signal<number | null>(null);
  readonly period = signal<MetricsPeriodo>('mes');
  readonly day = signal<string | null>(null);
  readonly until = signal<string | null>(null);
  readonly search = signal('');
  readonly status = signal('TODOS');
  readonly drawerOpen = signal(false);
  readonly correctionLeadId = signal<number | null>(null);

  readonly canCreate = computed(() => {
    const providerCount = this.options()?.proveedores.length ?? 0;
    return providerCount === 1 && !this.teamError();
  });
  readonly providerSetupMessage = computed(() => {
    const options = this.options();
    if (!options || this.teamError() || options.proveedores.length === 1) return null;
    return 'Tu cuenta todavía no está configurada para registrar ventas. Solicita que te asignen un proveedor.';
  });
  readonly range = computed(() => {
    const range = resolveMetricsRange(this.period(), this.day(), this.until());
    return { desde: range.desde ?? localToday(), hasta: range.hasta ?? localToday() };
  });
  readonly filteredRows = computed(() => {
    const term = this.search().trim().toLocaleLowerCase();
    const status = this.status();
    return this.data().detalle.filter((row) => {
      const matchesStatus = status === 'TODOS' || row.clasificacion === status;
      const haystack = `${row.lead} ${row.numeroDocumento ?? ''} ${row.cliente ?? ''} ${row.proveedor ?? ''} ${row.plan ?? ''}`.toLocaleLowerCase();
      return matchesStatus && (!term || haystack.includes(term));
    });
  });
  readonly maxState = computed(() => Math.max(1, ...this.data().estados.map((item) => item.cantidad)));
  readonly conversionUploaded = computed(() => this.percent(this.data().contadores.subidas, this.data().contadores.registradas));
  readonly conversionInstalled = computed(() => this.percent(this.data().contadores.instaladas, this.data().contadores.subidas));

  constructor() {
    this.restoreDrawerDraft();
    this.loadOptions();
    this.reload();
    merge(
      this.realtime.watchTopic('/topic/leads/etapa/VENTA'),
      this.realtime.watchTopic('/topic/leads/etapa/PREVENTA'),
      this.realtime.watchTopic('/topic/leads/etapa/POSTVENTA')
    ).pipe(auditTime(700), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.reload(false));
  }

  onPeriodChange(period: MetricsPeriodo): void {
    this.period.set(period);
    if (period !== 'dia') {
      this.day.set(null);
      this.until.set(null);
    }
    this.reload();
  }

  onRangeChange(range: MetricsRango): void {
    this.period.set('dia');
    this.day.set(range.desde);
    this.until.set(range.hasta);
    this.reload();
  }

  onProviderChange(value: string): void {
    this.providerId.set(value ? Number(value) : null);
    this.reload();
  }

  openCreate(): void {
    if (!this.canCreate()) return;
    const draft = readFreelanceDrawerDraft();
    if (draft && (draft.mode !== 'crear' || draft.idLead !== null)) clearFreelanceDrawerDraft();
    this.correctionLeadId.set(null);
    this.drawerOpen.set(true);
  }

  openCorrection(row: FreelanceSeguimientoDetalle): void {
    if (!row.puedeCorregir) return;
    const draft = readFreelanceDrawerDraft();
    if (draft && (draft.mode !== 'corregir' || draft.idLead !== row.idLead)) clearFreelanceDrawerDraft();
    this.correctionLeadId.set(row.idLead);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    clearFreelanceDrawerDraft();
    this.drawerOpen.set(false);
  }

  saved(): void {
    clearFreelanceDrawerDraft();
    this.drawerOpen.set(false);
    this.loadOptions();
    this.reload();
  }

  stateLabel(key: string): string {
    const labels: Record<string, string> = {
      RETORNO: 'Retorno a preventa',
      SIN_GESTIONAR: 'Sin gestionar',
      INSTALADO: 'Instalado'
    };
    return labels[key] ?? this.humanize(key);
  }

  stateClass(key: string): string {
    if (key === 'RETORNO') return 'return';
    if (key === 'INSTALADO') return 'installed';
    if (key === 'SIN_GESTIONAR') return 'idle';
    return 'managed';
  }

  barWidth(count: number): number {
    return Math.max(count ? 4 : 0, (count / this.maxState()) * 100);
  }

  private loadOptions(): void {
    this.service.opciones().subscribe({
      next: (options) => {
        this.options.set(options);
        this.teamError.set(null);
      },
      error: (error) => {
        this.options.set(null);
        this.teamError.set(error?.error?.message ?? 'Debes pertenecer a un equipo operativo para registrar ventas.');
      }
    });
  }

  private restoreDrawerDraft(): void {
    const draft = readFreelanceDrawerDraft();
    if (!draft || (draft.mode === 'corregir' && draft.idLead === null)) {
      if (draft) clearFreelanceDrawerDraft();
      return;
    }
    this.correctionLeadId.set(draft.mode === 'corregir' ? draft.idLead : null);
    this.drawerOpen.set(true);
  }

  private reload(showLoading = true): void {
    const range = this.range();
    if (showLoading) this.loading.set(true);
    this.error.set(null);
    this.service.seguimiento(range.desde, range.hasta, this.providerId())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.data.set(data),
        error: (error) => this.error.set(error?.error?.message ?? 'No se pudo actualizar el seguimiento.')
      });
  }

  private percent(value: number, total: number): number {
    return total ? Math.round((value * 1000) / total) / 10 : 0;
  }

  private humanize(value: string): string {
    return value.replaceAll('_', ' ').toLocaleLowerCase().replace(/^./, (char) => char.toUpperCase());
  }
}
