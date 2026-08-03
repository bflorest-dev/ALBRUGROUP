import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { MetricFilter } from '../../facades/rrhh-asistencia.facade';

export interface AttendanceKpis {
  empleados: number;
  faltas: number;
  tardanzas: number;
  conIncidencias: number;
}

export interface AttendanceKpiDeltas {
  faltas: number | null;
  tardanzas: number | null;
  conIncidencias: number | null;
}

/**
 * Cards de métricas de asistencia. Presentacional puro: recibe totales + deltas y emite el filtro
 * elegido. Al hacer click en una card se recorta la bandeja a esos casos (lo resuelve el facade).
 */
@Component({
  selector: 'app-attendance-metric-cards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './attendance-metric-cards.component.html',
  styleUrl: './attendance-metric-cards.component.scss'
})
export class AttendanceMetricCardsComponent {
  readonly kpis = input.required<AttendanceKpis>();
  readonly deltas = input<AttendanceKpiDeltas | null>(null);
  readonly active = input<MetricFilter>('all');
  readonly filterChange = output<MetricFilter>();

  protected readonly faltasDelta = computed(() => this.deltas()?.faltas ?? null);
  protected readonly tardanzasDelta = computed(() => this.deltas()?.tardanzas ?? null);
  protected readonly incidenciasDelta = computed(() => this.deltas()?.conIncidencias ?? null);

  protected select(filter: MetricFilter): void {
    this.filterChange.emit(filter);
  }

  /** Etiqueta del delta, p. ej. "+5%" o "-12%". */
  protected deltaLabel(pct: number | null): string {
    if (pct === null) return '';
    return `${pct > 0 ? '+' : ''}${pct}%`;
  }

  /**
   * Tono del delta. Para faltas/tardanzas/incidencias, bajar es bueno (verde) y subir es malo (rojo):
   * la métrica mide algo indeseable, así que la semántica del color va invertida al signo.
   */
  protected deltaTone(pct: number | null): 'good' | 'bad' | 'neutral' {
    if (pct === null || pct === 0) return 'neutral';
    return pct < 0 ? 'good' : 'bad';
  }
}
