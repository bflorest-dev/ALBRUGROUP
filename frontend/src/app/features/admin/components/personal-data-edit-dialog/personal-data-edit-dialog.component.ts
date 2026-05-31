import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-personal-data-edit-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    ProgressSpinnerModule,
    SelectModule
  ],
  templateUrl: './personal-data-edit-dialog.component.html',
  styleUrl: './personal-data-edit-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalDataEditDialogComponent {
  @Input({ required: true }) visible = false;
  @Input({ required: true }) form!: FormGroup;
  @Input({ required: true }) isLoading = false;
  @Input({ required: true }) isSubmitting = false;
  @Input({ required: true }) errorMessage = '';
  @Input({ required: true }) documentoOptions: string[] = [];
  @Input({ required: true }) nacionalidadOptions: string[] = [];
  @Input({ required: true }) estadoCivilOptions: string[] = [];
  @Input({ required: true }) tieneHijosOptions: { label: string; value: string }[] = [];

  @Output() readonly visibleChange = new EventEmitter<boolean>();
  @Output() readonly submit = new EventEmitter<void>();

  /** Elimina caracteres no numéricos y limita la longitud del control. */
  protected setNumericDigits(control: AbstractControl | null, value: string, maxLength: number): void {
    if (!control) return;
    const normalized = value.replace(/\D/g, '').slice(0, maxLength);
    if (control.value !== normalized) {
      control.setValue(normalized);
    }
  }
}
