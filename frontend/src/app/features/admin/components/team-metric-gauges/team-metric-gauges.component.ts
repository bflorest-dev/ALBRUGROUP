import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DashboardGaugeCard } from '../../models/dashboard-gauge.model';
import { SemicircleGaugeComponent } from '../semicircle-gauge/semicircle-gauge.component';

/** Grilla de tarjetas del DASHBOARD: una por equipo, con dos medidores (calidad y gestión). */
@Component({
  selector: 'app-team-metric-gauges',
  imports: [SemicircleGaugeComponent],
  templateUrl: './team-metric-gauges.component.html',
  styleUrl: './team-metric-gauges.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamMetricGaugesComponent {
  readonly cards = input<DashboardGaugeCard[]>([]);
}
