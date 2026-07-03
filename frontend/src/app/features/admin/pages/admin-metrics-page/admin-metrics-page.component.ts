import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-admin-metrics-page',
  imports: [TagModule],
  templateUrl: './admin-metrics-page.component.html',
  styleUrl: './admin-metrics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminMetricsPageComponent {}
