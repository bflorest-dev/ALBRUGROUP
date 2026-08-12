import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DashboardPostventaStageComponent } from '../../components/dashboard-postventa-stage/dashboard-postventa-stage.component';

@Component({
  selector: 'app-admin-dashboard-postventa-page',
  imports: [DashboardPostventaStageComponent],
  templateUrl: './admin-dashboard-postventa-page.component.html',
  styleUrl: './admin-dashboard-postventa-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardPostventaPageComponent {}
