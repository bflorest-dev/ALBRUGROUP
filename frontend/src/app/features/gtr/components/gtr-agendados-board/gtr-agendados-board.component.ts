import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';

@Component({
  selector: 'app-gtr-agendados-board',
  imports: [UpperCasePipe, ButtonModule, CardModule, PaginatorModule, ProgressSpinnerModule, TableModule, TagModule, TooltipModule],
  templateUrl: './gtr-agendados-board.component.html',
  styleUrl: './gtr-agendados-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrAgendadosBoardComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);
}
