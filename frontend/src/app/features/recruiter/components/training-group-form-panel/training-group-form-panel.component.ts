import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UsuarioResponse } from '../../../../shared/models/auth/usuario-response';

@Component({
  selector: 'app-training-group-form-panel',
  imports: [ReactiveFormsModule],
  templateUrl: './training-group-form-panel.component.html',
  styleUrl: './training-group-form-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrainingGroupFormPanelComponent {
  @Input({ required: true }) groupForm!: FormGroup;
  @Input({ required: true }) capacitadores: UsuarioResponse[] = [];
  @Input({ required: true }) turnoOptions: string[] = [];
  @Input({ required: true }) salaOptions: string[] = [];
  @Input({ required: true }) isLoadingCapacitadores = false;
  @Input({ required: true }) capacitadoresErrorMessage = '';
  @Input({ required: true }) isCreatingGroup = false;
  @Input({ required: true }) createErrorMessage = '';
  @Input({ required: true }) createSuccessMessage = '';

  @Output() readonly save = new EventEmitter<void>();
  @Output() readonly resetForm = new EventEmitter<void>();

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
