import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { LeadPlanSummaryComponent } from '../../../../shared/components/lead-plan-summary/lead-plan-summary.component';
import { AsesorVentasMisPreventasFacade } from '../../facades/asesor-ventas-mis-preventas.facade';

@Component({
  selector: 'app-mis-preventas-board',
  imports: [
    DatePipe,
    FormsModule,
    CardModule,
    DatePickerModule,
    PaginatorModule,
    TableModule,
    TagModule,
    LeadPlanSummaryComponent
  ],
  templateUrl: './mis-preventas-board.component.html',
  styleUrl: './mis-preventas-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MisPreventasBoardComponent {
  protected readonly facade = inject(AsesorVentasMisPreventasFacade);
}
