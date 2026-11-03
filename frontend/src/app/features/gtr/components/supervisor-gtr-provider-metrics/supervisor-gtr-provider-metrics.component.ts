import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { LeadGtrMetricasProveedorResponse } from '../../../../shared/models/preventa/preventa.models';

@Component({
  selector: 'app-supervisor-gtr-provider-metrics',
  imports: [ProgressSpinnerModule, TableModule],
  templateUrl: './supervisor-gtr-provider-metrics.component.html',
  styleUrl: './supervisor-gtr-provider-metrics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupervisorGtrProviderMetricsComponent {
  readonly metricas = input<LeadGtrMetricasProveedorResponse[]>([]);
  readonly cargando = input(false);
}
