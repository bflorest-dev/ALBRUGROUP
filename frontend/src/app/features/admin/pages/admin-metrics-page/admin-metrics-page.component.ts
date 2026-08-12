import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DashboardPreventaStageComponent } from '../../components/dashboard-preventa-stage/dashboard-preventa-stage.component';

@Component({
  selector: 'app-admin-metrics-page',
  imports: [DashboardPreventaStageComponent],
  templateUrl: './admin-metrics-page.component.html',
  styleUrl: './admin-metrics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminMetricsPageComponent {}
