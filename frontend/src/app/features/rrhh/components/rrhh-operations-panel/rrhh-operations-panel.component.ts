import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { PagoResponse } from '../../../../shared/models/rrhh/pago-response';
import {
  CumplimientoDetalleResponse,
  CumplimientoResumenResponse,
  EstadoMonitorResponse
} from '../../../../shared/models/schedule/cumplimiento-response';
import { HorarioResponse } from '../../../../shared/models/schedule/horario-response';
import { formatLabel } from '../../../../shared/utils/display-label';

@Component({
  selector: 'app-rrhh-operations-panel',
  imports: [ReactiveFormsModule, DateFieldComponent, JsonPipe],
  templateUrl: './rrhh-operations-panel.component.html',
  styleUrl: './rrhh-operations-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RrhhOperationsPanelComponent {
  @Input({ required: true }) mode!: 'asistencia' | 'pagos';
  @Input({ required: true }) horarioForm!: FormGroup;
  @Input({ required: true }) finalizeScheduleForm!: FormGroup;
  @Input({ required: true }) exceptionForm!: FormGroup;
  @Input({ required: true }) paymentForm!: FormGroup;
  @Input({ required: true }) paymentFilterForm!: FormGroup;
  @Input({ required: true }) complianceForm!: FormGroup;
  @Input({ required: true }) currentSchedule: HorarioResponse | null = null;
  @Input({ required: true }) scheduleHistory: HorarioResponse[] = [];
  @Input({ required: true }) payments: PagoResponse[] = [];
  @Input({ required: true }) complianceResumen: CumplimientoResumenResponse | null = null;
  @Input({ required: true }) complianceDetalle: CumplimientoDetalleResponse | null = null;
  @Input({ required: true }) monitorEstados: EstadoMonitorResponse[] = [];
  @Input({ required: true }) diasSemanaOptions: string[] = [];
  @Input({ required: true }) isLoadingSchedules = false;
  @Input({ required: true }) isUpdatingSchedule = false;
  @Input({ required: true }) isSavingException = false;
  @Input({ required: true }) isDeletingException = false;
  @Input({ required: true }) isRegisteringPayment = false;
  @Input({ required: true }) isLoadingPayments = false;
  @Input({ required: true }) isLoadingCompliance = false;
  @Input({ required: true }) scheduleErrorMessage = '';
  @Input({ required: true }) scheduleSuccessMessage = '';
  @Input({ required: true }) paymentErrorMessage = '';
  @Input({ required: true }) paymentSuccessMessage = '';
  @Input({ required: true }) complianceErrorMessage = '';
  @Input({ required: true }) currentScheduleHistoryPage = 0;
  @Input({ required: true }) totalScheduleHistoryPages = 1;
  @Input({ required: true }) currentPaymentsPage = 0;
  @Input({ required: true }) totalPaymentsPages = 1;

  @Output() readonly reloadCurrentSchedule = new EventEmitter<void>();
  @Output() readonly reloadScheduleHistory = new EventEmitter<number>();
  @Output() readonly replaceCurrentSchedule = new EventEmitter<void>();
  @Output() readonly finalizeCurrentSchedule = new EventEmitter<void>();
  @Output() readonly saveException = new EventEmitter<void>();
  @Output() readonly editException = new EventEmitter<Record<string, unknown>>();
  @Output() readonly deleteException = new EventEmitter<number>();
  @Output() readonly resetExceptionForm = new EventEmitter<void>();
  @Output() readonly registerPayment = new EventEmitter<void>();
  @Output() readonly loadPayments = new EventEmitter<number>();
  @Output() readonly queryCompliance = new EventEmitter<void>();

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

  protected getScheduleRows() {
    return (this.horarioForm.get('detalles') as import('@angular/forms').FormArray).controls;
  }

  protected asRecord(value: unknown): Record<string, unknown> {
    return (value ?? {}) as Record<string, unknown>;
  }
}
