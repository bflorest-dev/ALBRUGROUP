import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { OfertaLaboralResponse } from '../../../../shared/models/recruitment/oferta-laboral-response';

@Component({
  selector: 'app-postulante-form-panel',
  imports: [ReactiveFormsModule, ButtonModule, CardModule, InputTextModule, MessageModule, SelectModule],
  templateUrl: './postulante-form-panel.component.html',
  styleUrl: './postulante-form-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostulanteFormPanelComponent {
  @Input({ required: true }) postulanteForm!: FormGroup;
  @Input({ required: true }) activeOffers: OfertaLaboralResponse[] = [];
  @Input({ required: true }) documentoOptions: string[] = [];
  @Input({ required: true }) origenOptions: string[] = [];
  @Input({ required: true }) isLoadingActiveOffers = false;
  @Input({ required: true }) activeOffersErrorMessage = '';
  @Input({ required: true }) isSaving = false;
  @Input({ required: true }) isEditing = false;
  @Input({ required: true }) saveErrorMessage = '';
  @Input({ required: true }) saveSuccessMessage = '';

  @Output() readonly save = new EventEmitter<void>();
  @Output() readonly cancelEdit = new EventEmitter<void>();

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
