import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { PostulacionResponse } from '../../../../shared/models/recruitment/postulacion-response';
import { ContratoResponse } from '../../../../shared/models/rrhh/contrato-response';
import { EmpleadoResponse } from '../../../../shared/models/rrhh/empleado-response';

@Component({
  selector: 'app-rrhh-contract-panel',
  imports: [ReactiveFormsModule, DateFieldComponent],
  templateUrl: './rrhh-contract-panel.component.html',
  styleUrl: './rrhh-contract-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RrhhContractPanelComponent {
  @Input({ required: true }) contractForm!: FormGroup;
  @Input({ required: true }) closeContractForm!: FormGroup;
  @Input({ required: true }) horarioForm!: FormGroup;
  @Input({ required: true }) selectedEmployee: EmpleadoResponse | null = null;
  @Input({ required: true }) selectedHiringCase: PostulacionResponse | null = null;
  @Input({ required: true }) currentContract: ContratoResponse | null = null;
  @Input({ required: true }) contractHistory: ContratoResponse[] = [];
  @Input({ required: true }) puestoTrabajoOptions: string[] = [];
  @Input({ required: true }) regimenOptions: string[] = [];
  @Input({ required: true }) modalidadOptions: string[] = [];
  @Input({ required: true }) seguroSaludOptions: string[] = [];
  @Input({ required: true }) sistemaPensionesOptions: string[] = [];
  @Input({ required: true }) diasSemanaOptions: string[] = [];
  @Input({ required: true }) isLoadingContracts = false;
  @Input({ required: true }) isRegisteringContract = false;
  @Input({ required: true }) isClosingContract = false;
  @Input({ required: true }) isRegisteringSchedule = false;
  @Input({ required: true }) contractErrorMessage = '';
  @Input({ required: true }) contractSuccessMessage = '';
  @Input({ required: true }) scheduleErrorMessage = '';
  @Input({ required: true }) scheduleSuccessMessage = '';
  @Input({ required: true }) currentHistoryPage = 0;
  @Input({ required: true }) totalHistoryPages = 1;

  @Output() readonly registerContract = new EventEmitter<void>();
  @Output() readonly closeCurrentContract = new EventEmitter<void>();
  @Output() readonly registerSchedule = new EventEmitter<void>();
  @Output() readonly reloadCurrentContract = new EventEmitter<void>();
  @Output() readonly historyPageChange = new EventEmitter<number>();

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

  protected toMoney(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '-';
    }

    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(value);
  }

  protected getScheduleRows(): AbstractControl[] {
    return (this.horarioForm.get('detalles') as FormArray).controls;
  }
}
