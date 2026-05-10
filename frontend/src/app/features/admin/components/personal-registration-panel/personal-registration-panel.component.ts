import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { UsuarioResponse } from '../../../../shared/models/auth/usuario-response';
import { EmpresaContratistaResponse } from '../../../../shared/models/rrhh/empresa-contratista-response';

@Component({
  selector: 'app-personal-registration-panel',
  imports: [ReactiveFormsModule, DateFieldComponent],
  templateUrl: './personal-registration-panel.component.html',
  styleUrl: './personal-registration-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalRegistrationPanelComponent {
  @Input({ required: true }) empleadoForm!: FormGroup;
  @Input({ required: true }) contratoForm!: FormGroup;
  @Input({ required: true }) currentStep = 1;
  @Input({ required: true }) isSubmitting = false;
  @Input({ required: true }) submitErrorMessage = '';
  @Input({ required: true }) creationResult: UsuarioResponse | null = null;
  @Input({ required: true }) empresasContratistas: EmpresaContratistaResponse[] = [];
  @Input({ required: true }) documentoOptions: string[] = [];
  @Input({ required: true }) nacionalidadOptions: string[] = [];
  @Input({ required: true }) estadoCivilOptions: string[] = [];
  @Input({ required: true }) origenOptions: string[] = [];
  @Input({ required: true }) distritoOptions: string[] = [];
  @Input({ required: true }) bancoOptions: string[] = [];
  @Input({ required: true }) parentescoOptions: string[] = [];
  @Input({ required: true }) puestoTrabajoOptions: string[] = [];
  @Input({ required: true }) regimenOptions: string[] = [];
  @Input({ required: true }) modalidadOptions: string[] = [];
  @Input({ required: true }) seguroSaludOptions: string[] = [];
  @Input({ required: true }) sistemaPensionesOptions: string[] = [];

  @Output() readonly continueToContract = new EventEmitter<void>();
  @Output() readonly backToEmployee = new EventEmitter<void>();
  @Output() readonly submitPersonalFlow = new EventEmitter<void>();
  @Output() readonly resetFlow = new EventEmitter<void>();

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
