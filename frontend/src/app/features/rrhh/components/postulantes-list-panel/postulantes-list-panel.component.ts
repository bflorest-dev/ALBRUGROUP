import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PostulacionResponse } from '../../../../shared/models/recruitment/postulacion-response';
import { formatLabel } from '../../../../shared/utils/display-label';

@Component({
  selector: 'app-postulantes-list-panel',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    MessageModule,
    PaginatorModule,
    SelectModule,
    TableModule,
    TagModule
  ],
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
    return formatLabel(value);
  }
}
