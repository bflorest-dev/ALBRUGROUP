import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PaginatorModule } from 'primeng/paginator';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';
import { GtrLeadSelectControlComponent } from '../gtr-lead-select-control/gtr-lead-select-control.component';

@Component({
  selector: 'app-gtr-leads-board',
  imports: [
    DatePipe,
    UpperCasePipe,
    FormsModule,
    ButtonModule,
    CardModule,
    PaginatorModule,
    SelectButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    GtrLeadSelectControlComponent
  ],
  templateUrl: './gtr-leads-board.component.html',
  styleUrl: './gtr-leads-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrLeadsBoardComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);
}
