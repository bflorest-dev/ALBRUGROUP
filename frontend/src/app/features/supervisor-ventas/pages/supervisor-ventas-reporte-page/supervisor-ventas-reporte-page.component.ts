import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-supervisor-ventas-reporte-page',
  standalone: true,
  imports: [CardModule, MessageModule],
  templateUrl: './supervisor-ventas-reporte-page.component.html',
  styleUrl: './supervisor-ventas-reporte-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupervisorVentasReportePageComponent {}
