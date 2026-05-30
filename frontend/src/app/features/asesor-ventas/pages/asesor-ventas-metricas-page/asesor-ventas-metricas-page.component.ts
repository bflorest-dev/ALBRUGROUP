import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-asesor-ventas-metricas-page',
  standalone: true,
  imports: [CardModule],
  templateUrl: './asesor-ventas-metricas-page.component.html',
  styleUrl: './asesor-ventas-metricas-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsesorVentasMetricasPageComponent {}
