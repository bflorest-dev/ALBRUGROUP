import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { AsesorVentasMisPreventasFacade } from '../../facades/asesor-ventas-mis-preventas.facade';

@Component({
  selector: 'app-mis-preventas-board',
  imports: [DatePipe, FormsModule, DatePickerModule, PaginatorModule, TooltipModule],
  templateUrl: './mis-preventas-board.component.html',
  styleUrl: './mis-preventas-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MisPreventasBoardComponent {
  protected readonly facade = inject(AsesorVentasMisPreventasFacade);
}
