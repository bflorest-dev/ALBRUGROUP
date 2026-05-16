import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { GrupoCapacitacionDetalleResponse } from '../../../../shared/models/recruitment/grupo-capacitacion-detalle-response';
import { GrupoCapacitacionResponse } from '../../../../shared/models/recruitment/grupo-capacitacion-response';

@Component({
  selector: 'app-training-group-list-panel',
  imports: [ReactiveFormsModule],
  templateUrl: './training-group-list-panel.component.html',
  styleUrl: './training-group-list-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrainingGroupListPanelComponent {
  @Input({ required: true }) groups: GrupoCapacitacionResponse[] = [];
  @Input({ required: true }) selectedGroup: GrupoCapacitacionResponse | null = null;
  @Input({ required: true }) estadoOptions: string[] = [];
  @Input({ required: true }) selectedEstado: string | null = null;
  @Input({ required: true }) currentPage = 0;
  @Input({ required: true }) totalPages = 1;
  @Input({ required: true }) isLoadingGroups = false;
  @Input({ required: true }) isLoadingDetail = false;
  @Input({ required: true }) listErrorMessage = '';
  @Input({ required: true }) detailErrorMessage = '';
  @Input({ required: true }) detailForm!: FormGroup;
  @Input({ required: true }) selectedDetail: GrupoCapacitacionDetalleResponse | null = null;
  @Input({ required: true }) estadoCapacitacionOptions: string[] = [];
  @Input({ required: true }) isUpdatingDetail = false;
  @Input({ required: true }) updateDetailErrorMessage = '';
  @Input({ required: true }) updateDetailSuccessMessage = '';

  @Output() readonly estadoFilter = new EventEmitter<string>();
  @Output() readonly reload = new EventEmitter<void>();
  @Output() readonly pageChange = new EventEmitter<number>();
  @Output() readonly openDetail = new EventEmitter<number>();
  @Output() readonly closeDetail = new EventEmitter<void>();
  @Output() readonly editDetail = new EventEmitter<GrupoCapacitacionDetalleResponse>();
  @Output() readonly cancelDetailEdit = new EventEmitter<void>();
  @Output() readonly submitDetailUpdate = new EventEmitter<void>();

  protected emitEstadoFilter(event: Event): void {
    this.estadoFilter.emit((event.target as HTMLSelectElement).value);
  }

  protected toLabel(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
