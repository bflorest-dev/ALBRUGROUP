import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { UsuarioResponse } from '../../../../shared/models/auth/usuario-response';
import { EmpresaContratistaResponse } from '../../../../shared/models/rrhh/empresa-contratista-response';
import { formatLabel } from '../../../../shared/utils/display-label';

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
  @Input({ required: true }) horarioForm!: FormGroup;
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
  @Input({ required: true }) diasSemanaOptions: string[] = [];

  @Output() readonly continueToContract = new EventEmitter<void>();
  @Output() readonly continueToSchedule = new EventEmitter<void>();
  @Output() readonly backToEmployee = new EventEmitter<void>();
  @Output() readonly backToContract = new EventEmitter<void>();
  @Output() readonly submitPersonalFlow = new EventEmitter<void>();
  @Output() readonly resetFlow = new EventEmitter<void>();

  protected toLabel(value: string | null | undefined): string {
    return formatLabel(value);
  }

  protected getScheduleRows(): AbstractControl[] {
    return (this.horarioForm.get('detalles') as FormArray).controls;
  }

  protected isOwnAccount(): boolean {
    return this.empleadoForm.get('cuentaPropia')?.value === 'true';
  }

  protected hasContractEndDate(): boolean {
    return this.contratoForm.get('fechaFinHabilitada')?.value === 'true';
  }

  protected setContractEndDate(enabled: boolean): void {
    this.contratoForm.get('fechaFinHabilitada')?.setValue(String(enabled));
    if (!enabled) {
      this.contratoForm.get('fechaFin')?.setValue('');
    }
  }

  protected isAdvancedSchedule(): boolean {
    return this.horarioForm.get('modoAvanzado')?.value === 'true';
  }

  protected setAdvancedSchedule(enabled: boolean): void {
    this.horarioForm.get('modoAvanzado')?.setValue(String(enabled));
    if (!enabled) {
      this.applySimpleSchedule();
    }
  }

  protected selectRestDay(day: string): void {
    this.horarioForm.get('diaDescanso')?.setValue(day);
    this.applySimpleSchedule();
  }

  protected applySimpleSchedule(): void {
    const restDay = this.horarioForm.get('diaDescanso')?.value ?? 'DOMINGO';
    const horaEntrada = this.horarioForm.get('horaEntrada')?.value ?? '09:00';
    const horaSalida = this.horarioForm.get('horaSalida')?.value ?? '18:00';
    const inicioAlmuerzo = this.horarioForm.get('inicioAlmuerzo')?.value ?? '13:00';
    const finAlmuerzo = this.horarioForm.get('finAlmuerzo')?.value ?? '14:00';

    for (const row of this.getScheduleRows()) {
      row.patchValue({
        horaEntrada,
        horaSalida,
        inicioAlmuerzo,
        finAlmuerzo,
        laborable: row.get('dia')?.value === restDay ? 'false' : 'true'
      });
    }
  }

  protected isRestDay(day: string): boolean {
    return this.horarioForm.get('diaDescanso')?.value === day;
  }
}
