import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SemicircleGaugeComponent } from '../../../admin/components/semicircle-gauge/semicircle-gauge.component';
import { DailyLeadsMetricsView } from '../../models/daily-lead.model';

/** Barra de indicadores del día para LEADS DEL DIA. Presentacional: solo recibe el view model. */
@Component({
  selector: 'app-daily-leads-metrics-bar',
  imports: [SemicircleGaugeComponent],
  templateUrl: './daily-leads-metrics-bar.component.html',
  styleUrl: './daily-leads-metrics-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailyLeadsMetricsBarComponent {
  readonly metrics = input.required<DailyLeadsMetricsView>();

  protected readonly gaugeFrom = '#93c5fd';
  protected readonly gaugeTo = '#2563eb';

  protected readonly pctGestion = computed(() => {
    const metrics = this.metrics();
    return metrics.leadsUnicos > 0 ? (metrics.leadsTipificados / metrics.leadsUnicos) * 100 : 0;
  });

  protected readonly pctConversion = computed(() => {
    const metrics = this.metrics();
    return metrics.leadsUnicos > 0 ? (metrics.ventaCerrada / metrics.leadsUnicos) * 100 : 0;
  });
}
