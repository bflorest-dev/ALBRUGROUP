import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PostulacionResponse } from '../../../../shared/models/recruitment/postulacion-response';

@Component({
  selector: 'app-postulantes-list-panel',
  imports: [ReactiveFormsModule],
  templateUrl: './postulantes-list-panel.component.html',
  styleUrl: './postulantes-list-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostulantesListPanelComponent {
  @Input({ required: true }) filterForm!: FormGroup;
  @Input({ required: true }) postulaciones: PostulacionResponse[] = [];
  @Input({ required: true }) etapaOptions: string[] = [];
  @Input({ required: true }) estadoOptions: string[] = [];
  @Input({ required: true }) estadoBandejaOptions: string[] = [];
  @Input({ required: true }) currentPage = 0;
  @Input({ required: true }) totalPages = 1;
  @Input({ required: true }) isLoading = false;
  @Input({ required: true }) errorMessage = '';

  @Output() readonly applyFilters = new EventEmitter<void>();
  @Output() readonly clearFilters = new EventEmitter<void>();
  @Output() readonly reload = new EventEmitter<void>();
  @Output() readonly pageChange = new EventEmitter<number>();
  @Output() readonly edit = new EventEmitter<PostulacionResponse>();

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
