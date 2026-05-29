import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { EmpleadoRolResponse } from '../../../../shared/models/rrhh/empleado-rol-response';
import { formatLabel } from '../../../../shared/utils/display-label';

type SelectOption = {
  label: string;
  value: string;
};

@Component({
  selector: 'app-contract-renewal-dialog',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    DatePickerModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    TagModule,
    ToggleButtonModule
  ],
  templateUrl: './contract-renewal-dialog.component.html',
  styleUrl: './contract-renewal-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractRenewalDialogComponent {
  @Input({ required: true }) visible = false;
  @Input({ required: true }) employee: EmpleadoRolResponse | null = null;
  @Input({ required: true }) contractForm!: FormGroup;
  @Input({ required: true }) puestoTrabajoOptions: string[] = [];
  @Input({ required: true }) regimenOptions: string[] = [];
  @Input({ required: true }) modalidadOptions: string[] = [];
  @Input({ required: true }) seguroSaludOptions: string[] = [];
  @Input({ required: true }) sistemaPensionesOptions: string[] = [];
  @Input({ required: true }) isLoadingCurrentContract = false;
  @Input({ required: true }) isSubmitting = false;
  @Input({ required: true }) errorMessage = '';
  @Input({ required: true }) successMessage = '';

  @Output() readonly visibleChange = new EventEmitter<boolean>();
  @Output() readonly submit = new EventEmitter<void>();

  private readonly optionItemsCache = new WeakMap<readonly string[], SelectOption[]>();
  private readonly pickerDateCache = new Map<string, Date | null>();

  protected optionItems(options: string[]): SelectOption[] {
    let cached = this.optionItemsCache.get(options);
    if (!cached) {
      cached = options.map((option) => ({ label: this.toLabel(option), value: option }));
      this.optionItemsCache.set(options, cached);
    }

    return cached;
  }

  protected toLabel(value: string | null | undefined): string {
    if (value === 'SIS' || value === 'ESSALUD') {
      return value;
    }

    return formatLabel(value);
  }

  protected isInvalid(controlName: string): boolean {
    const control = this.contractForm.get(controlName);
    return Boolean(control?.invalid && (control.touched || control.dirty));
  }

  protected toPickerDate(value: unknown): Date | null {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value !== 'string' || !value) {
      return null;
    }

    const cached = this.pickerDateCache.get(value);
    if (cached !== undefined) {
      return cached;
    }

    let parsed: Date | null = null;
    const backendMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (backendMatch) {
      parsed = new Date(Number(backendMatch[1]), Number(backendMatch[2]) - 1, Number(backendMatch[3]));
    } else {
      const displayMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
      if (displayMatch) {
        parsed = new Date(Number(displayMatch[3]), Number(displayMatch[2]) - 1, Number(displayMatch[1]));
      }
    }

    this.pickerDateCache.set(value, parsed);
    return parsed;
  }

  protected setDateControl(controlName: string, value: Date | string | null): void {
    const control = this.contractForm.get(controlName);
    control?.setValue(this.toBackendDate(value));
    control?.markAsDirty();
    control?.markAsTouched();
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

  protected isPlanilla(): boolean {
    return this.contractForm.get('regimen')?.value === 'PLANILLA';
  }

  protected setRegimen(regimen: string): void {
    this.contractForm.get('regimen')?.setValue(regimen);

    if (regimen !== 'PLANILLA') {
      this.contractForm.patchValue({
        seguroSalud: '',
        sistemaPensiones: ''
      });
      return;
    }

    if (!this.contractForm.get('seguroSalud')?.value) {
      this.contractForm.get('seguroSalud')?.setValue('SIS');
    }

    if (!this.contractForm.get('sistemaPensiones')?.value) {
      this.contractForm.get('sistemaPensiones')?.setValue('ONP');
    }
  }

  private toBackendDate(value: Date | string | null): string {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const month = `${value.getMonth() + 1}`.padStart(2, '0');
      const day = `${value.getDate()}`.padStart(2, '0');

      return `${value.getFullYear()}-${month}-${day}`;
    }

    if (typeof value !== 'string' || !value) {
      return '';
    }

    const displayMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (displayMatch) {
      return `${displayMatch[3]}-${displayMatch[2]}-${displayMatch[1]}`;
    }

    return value;
  }
}
