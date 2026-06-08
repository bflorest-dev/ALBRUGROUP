import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AsesorVentasMisPreventasFacade } from '../../facades/asesor-ventas-mis-preventas.facade';

@Component({
  selector: 'app-mis-preventas-board',
  imports: [DatePipe, ButtonModule, CardModule, PaginatorModule, TableModule, TagModule],
  templateUrl: './mis-preventas-board.component.html',
  styleUrl: './mis-preventas-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MisPreventasBoardComponent {
  protected readonly facade = inject(AsesorVentasMisPreventasFacade);
}
