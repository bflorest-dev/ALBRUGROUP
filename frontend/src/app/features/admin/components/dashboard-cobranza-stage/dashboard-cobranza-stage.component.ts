import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-dashboard-cobranza-stage',
  imports: [PageHeaderComponent],
  templateUrl: './dashboard-cobranza-stage.component.html',
  styleUrl: './dashboard-cobranza-stage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardCobranzaStageComponent {}
