import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';
import { GtrLeadSelectControlComponent } from '../gtr-lead-select-control/gtr-lead-select-control.component';

@Component({
  selector: 'app-gtr-historicos-board',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    UpperCasePipe,
    ButtonModule,
    CardModule,
    MultiSelectModule,
    PaginatorModule,
    SelectModule,
    TableModule,
    TagModule,
    DateFieldComponent,
    GtrLeadSelectControlComponent
  ],
  templateUrl: './gtr-historicos-board.component.html',
  styleUrl: './gtr-historicos-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrHistoricosBoardComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);
}
