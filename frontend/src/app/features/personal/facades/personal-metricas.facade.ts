import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PersonalMetricasService, MetricaDia } from '../services/personal-metricas.service';
import { formatApiErrorMessage } from '../../../shared/utils/api-error.utils';
import { HttpErrorResponse } from '@angular/common/http';

export interface MetricaDiaRow {
  day: number;
  preventas: number;
  instaladas: number;
  celdas: ('instalada' | 'preventa')[];
}

@Injectable()
export class PersonalMetricasFacade {
  private readonly service = inject(PersonalMetricasService);

  private employeeId = 0;

  readonly selectedMonth = signal(this.currentMonthValue());
  readonly dias = signal<MetricaDia[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal('');

  readonly hasData = computed(() => this.dias().length > 0);

  readonly rows = computed<MetricaDiaRow[]>(() => {
    return this.dias().map(d => {
      const day = Number(d.fecha.split('-')[2]);
      const celdas: ('instalada' | 'preventa')[] = [];
      const total = Math.min(d.preventas, 12);
      const inst = Math.min(d.instaladas, total);
      for (let i = 0; i < inst; i++) celdas.push('instalada');
      for (let i = inst; i < total; i++) celdas.push('preventa');
      return { day, preventas: d.preventas, instaladas: d.instaladas, celdas };
    });
  });

  readonly totalPreventas = computed(() => this.dias().reduce((sum, d) => sum + d.preventas, 0));
  readonly totalInstaladas = computed(() => this.dias().reduce((sum, d) => sum + d.instaladas, 0));

  initialize(employeeId: number): void {
    this.employeeId = employeeId;
    void this.load();
  }

  reset(): void {
    this.employeeId = 0;
    this.dias.set([]);
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
      this.dias.set(response.dias);
    } catch (e) {
      this.dias.set([]);
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
