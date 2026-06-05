import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';

@Component({
  selector: 'app-gtr-leads-board',
  imports: [DatePipe, UpperCasePipe, ButtonModule, CardModule, PaginatorModule, TableModule, TagModule],
  templateUrl: './gtr-leads-board.component.html',
  styleUrl: './gtr-leads-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrLeadsBoardComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);
}
