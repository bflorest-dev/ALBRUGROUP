import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PaginatorModule } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AsesorVentasWorkspaceFacade } from '../../facades/asesor-ventas-workspace.facade';

@Component({
  selector: 'app-asesor-board',
  imports: [DatePipe, ButtonModule, CardModule, PaginatorModule, SkeletonModule, TableModule, TagModule],
  templateUrl: './asesor-board.component.html',
  styleUrl: './asesor-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsesorBoardComponent {
  protected readonly facade = inject(AsesorVentasWorkspaceFacade);
}
