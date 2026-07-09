import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DailyLeadsMetricsView } from '../../models/daily-lead.model';

/** Barra de indicadores del día para LEADS DEL DIA. Presentacional: solo recibe el view model. */
@Component({
  selector: 'app-daily-leads-metrics-bar',
  imports: [DecimalPipe],
  templateUrl: './daily-leads-metrics-bar.component.html',
  styleUrl: './daily-leads-metrics-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailyLeadsMetricsBarComponent {
  readonly metrics = input.required<DailyLeadsMetricsView>();
}
