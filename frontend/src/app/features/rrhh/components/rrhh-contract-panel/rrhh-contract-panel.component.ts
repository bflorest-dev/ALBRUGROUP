import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PostulacionResponse } from '../../../../shared/models/recruitment/postulacion-response';
import { ContratoResponse } from '../../../../shared/models/rrhh/contrato-response';
import { EmpleadoResponse } from '../../../../shared/models/rrhh/empleado-response';
import { formatLabel } from '../../../../shared/utils/display-label';

@Component({
  selector: 'app-rrhh-contract-panel',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    InputTextModule,
    MessageModule,
    PaginatorModule,
    SelectModule,
    TableModule,
    TagModule
  ],
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
    return formatLabel(value);
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

  protected hasContractEndDate(): boolean {
    return this.contractForm.get('fechaFinHabilitada')?.value === 'true';
  }

  protected setContractEndDate(enabled: boolean): void {
    this.contractForm.get('fechaFinHabilitada')?.setValue(String(enabled));
    if (!enabled) {
      this.contractForm.get('fechaFin')?.setValue('');
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
