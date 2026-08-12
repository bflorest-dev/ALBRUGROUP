import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-dashboard-venta-stage',
  imports: [PageHeaderComponent],
  templateUrl: './dashboard-venta-stage.component.html',
  styleUrl: './dashboard-venta-stage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardVentaStageComponent {}
