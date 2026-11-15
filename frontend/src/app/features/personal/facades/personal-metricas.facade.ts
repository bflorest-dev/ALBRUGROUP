import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PersonalMetricasService, MetricaDia, MetricaLead } from '../services/personal-metricas.service';
import { formatApiErrorMessage } from '../../../shared/utils/api-error.utils';
import { HttpErrorResponse } from '@angular/common/http';

export interface MetricaDiaRow {
  fecha: string;
  day: number;
  weekday: string;
  preventas: number;
  instaladas: number;
  leads: MetricaLead[];
}

@Injectable()
export class PersonalMetricasFacade {
  private readonly service = inject(PersonalMetricasService);

  private employeeId = 0;

  readonly selectedMonth = signal(this.currentMonthValue());
  readonly dias = signal<MetricaDia[]>([]);
  readonly hasLoaded = signal(false);
  readonly isLoading = signal(false);
  readonly error = signal('');

  readonly hasActivity = computed(() => this.rows().some(row => row.preventas > 0 || row.instaladas > 0));

  readonly rows = computed<MetricaDiaRow[]>(() => {
    const [year, month] = this.selectedMonth().split('-').map(Number);
    const byDate = new Map(this.dias().map(day => [day.fecha, day]));
    const daysInMonth = new Date(year, month, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const fecha = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const metric = byDate.get(fecha);
      const date = new Date(year, month - 1, day);
      const weekday = new Intl.DateTimeFormat('es-PE', { weekday: 'short' })
        .format(date)
        .replace('.', '');

      return {
        fecha,
        day,
        weekday,
        preventas: metric?.preventas ?? 0,
        instaladas: metric?.instaladas ?? 0,
        leads: metric?.leads ?? []
      };
    });
  });

  readonly totalPreventas = computed(() => this.dias().reduce((sum, d) => sum + d.preventas, 0));
  readonly totalInstaladas = computed(() => this.dias().reduce((sum, d) => sum + d.instaladas, 0));
  readonly activeDays = computed(() => this.rows().filter(row => row.preventas > 0 || row.instaladas > 0).length);
  readonly maxDailyValue = computed(() => Math.max(1, ...this.rows().flatMap(row => [row.preventas, row.instaladas])));

  initialize(employeeId: number): void {
    this.employeeId = employeeId;
    void this.load();
  }

  reset(): void {
    this.employeeId = 0;
    this.dias.set([]);
    this.hasLoaded.set(false);
    this.error.set('');
    this.isLoading.set(false);
    this.selectedMonth.set(this.currentMonthValue());
  }

  setMonth(value: string): void {
    this.selectedMonth.set(value);
    void this.load();
  }

  retry(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    if (!this.employeeId) return;

    const [year, month] = this.selectedMonth().split('-').map(Number);
    this.isLoading.set(true);
    this.error.set('');

    try {
      const response = await firstValueFrom(
        this.service.getMetricas(this.employeeId, year, month)
      );
      this.dias.set(response.dias ?? []);
      this.hasLoaded.set(true);
    } catch (e) {
      this.dias.set([]);
      this.hasLoaded.set(false);
      this.error.set(e instanceof HttpErrorResponse ? formatApiErrorMessage(e, 'Error al cargar métricas') : 'Error al cargar métricas');
    } finally {
      this.isLoading.set(false);
    }
  }

  private currentMonthValue(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
