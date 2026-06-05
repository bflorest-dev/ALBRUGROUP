import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UsuarioResponse } from '../../../../shared/models/auth/usuario-response';
import { EmpresaContratistaResponse } from '../../../../shared/models/rrhh/empresa-contratista-response';
import { NormalizeTextDirective } from '../../../../shared/directives/normalize-text.directive';
import { formatLabel } from '../../../../shared/utils/display-label';
import { PersonalReviewSummary } from '../../facades/admin-personal.facade';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { StepperModule } from 'primeng/stepper';
import { TagModule } from 'primeng/tag';
import { ToggleButtonModule } from 'primeng/togglebutton';

type SelectOption = {
  label: string;
  value: string;
};

type ScheduleRule = {
  durationLabel: string;
  lunchLabel: string | null;
};

@Component({
  selector: 'app-personal-registration-panel',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    DatePickerModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    NormalizeTextDirective,
    SelectModule,
    StepperModule,
    TagModule,
    ToggleButtonModule
  ],
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
  @Input({ required: true }) isPersonalReviewVisible = false;
  @Input({ required: true }) personalReviewSummary!: PersonalReviewSummary;
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
  @Output() readonly requestPersonalReview = new EventEmitter<void>();
  @Output() readonly cancelPersonalReview = new EventEmitter<void>();
  @Output() readonly confirmPersonalReview = new EventEmitter<void>();
  @Output() readonly resetFlow = new EventEmitter<void>();

  protected readonly yesNoOptions: SelectOption[] = [
    { label: 'Si', value: 'true' },
    { label: 'No', value: 'false' }
  ];
  protected readonly noYesOptions: SelectOption[] = [
    { label: 'No', value: 'false' },
    { label: 'Si', value: 'true' }
  ];

  private readonly optionItemsCache = new WeakMap<readonly string[], SelectOption[]>();
  private readonly optionalOptionItemsCache = new WeakMap<readonly string[], SelectOption[]>();
  private empresaItemsCache: { source: readonly EmpresaContratistaResponse[]; items: SelectOption[] } | null = null;
  private simpleTimeSnapshot: {
    horaEntrada: string;
    horaSalida: string;
    inicioAlmuerzo: string;
    finAlmuerzo: string;
  } | null = null;
  private readonly scheduleRules: Record<string, ScheduleRule> = {
    PART_TIME: { durationLabel: '4 horas', lunchLabel: null },
    SEMI_FULL: { durationLabel: '6 horas', lunchLabel: null },
    FULL_TIME: { durationLabel: '9 horas', lunchLabel: '60 minutos de almuerzo' },
    SUPER_FULL: { durationLabel: '10 horas', lunchLabel: '60 minutos de almuerzo' }
  };

  protected optionItems(options: string[]): SelectOption[] {
    let cached = this.optionItemsCache.get(options);
    if (!cached) {
      cached = options.map((option) => ({ label: this.toLabel(option), value: option }));
      this.optionItemsCache.set(options, cached);
    }
    return cached;
  }

  protected optionalOptionItems(options: string[]): SelectOption[] {
    let cached = this.optionalOptionItemsCache.get(options);
    if (!cached) {
      cached = [{ label: 'No aplica', value: '' }, ...this.optionItems(options)];
      this.optionalOptionItemsCache.set(options, cached);
    }
    return cached;
  }

  protected empresaItems(): SelectOption[] {
    if (this.empresaItemsCache?.source === this.empresasContratistas) {
      return this.empresaItemsCache.items;
    }

    const items: SelectOption[] = [
      { label: 'No aplica', value: '' },
      ...this.empresasContratistas.map((empresa) => ({
        label: empresa.nombre,
        value: String(empresa.id)
      }))
    ];
    this.empresaItemsCache = { source: this.empresasContratistas, items };
    return items;
  }

  protected toLabel(value: string | null | undefined): string {
    if (
      value === 'BCP' ||
      value === 'BBVA' ||
      value === 'DNI' ||
      value === 'CE' ||
      value === 'SIS' ||
      value === 'ESSALUD'
    ) {
      return value;
    }

    return formatLabel(value);
  }

  protected isInvalid(form: FormGroup, controlName: string): boolean {
    const control = form.get(controlName);
    return Boolean(control?.invalid && (control.touched || control.dirty));
  }

  private readonly pickerDateCache = new Map<string, Date | null>();

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

  protected setDateControl(form: FormGroup, controlName: string, value: Date | string | null): void {
    const control = form.get(controlName);
    control?.setValue(this.toBackendDate(value));
    control?.markAsDirty();
    control?.markAsTouched();
  }

  protected setNumericDigits(form: FormGroup, controlName: string, value: string, maxLength: number): void {
    const control = form.get(controlName);
    const normalized = value.replace(/\D/g, '').slice(0, maxLength);
    if (control?.value !== normalized) {
      control?.setValue(normalized);
    }
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

  protected isPlanilla(): boolean {
    return this.contratoForm.get('regimen')?.value === 'PLANILLA';
  }

  protected setRegimen(regimen: string): void {
    this.contratoForm.get('regimen')?.setValue(regimen);

    if (regimen !== 'PLANILLA') {
      this.contratoForm.patchValue({
        seguroSalud: '',
        sistemaPensiones: ''
      });
      return;
    }

    if (!this.contratoForm.get('seguroSalud')?.value) {
      this.contratoForm.get('seguroSalud')?.setValue('SIS');
    }

    if (!this.contratoForm.get('sistemaPensiones')?.value) {
      this.contratoForm.get('sistemaPensiones')?.setValue('ONP');
    }
  }

  protected setModalidad(modalidad: string): void {
    this.contratoForm.get('modalidad')?.setValue(modalidad);
    this.syncLunchBreakByModalidad();
    this.applySimpleSchedule();
  }

  protected usesLunchBreak(): boolean {
    return this.usesLunchBreakFor(this.contratoForm.get('modalidad')?.value);
  }

  protected isAdvancedSchedule(): boolean {
    return this.horarioForm.get('modoAvanzado')?.value === 'true';
  }

  protected isCompensable(): boolean {
    return this.horarioForm.get('compensable')?.value === 'true';
  }

  protected setCompensable(enabled: boolean): void {
    this.horarioForm.get('compensable')?.setValue(String(enabled));
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
    const inicioAlmuerzo = this.usesLunchBreak() ? this.horarioForm.get('inicioAlmuerzo')?.value || '13:00' : '';
    const finAlmuerzo = this.usesLunchBreak() ? this.horarioForm.get('finAlmuerzo')?.value || '14:00' : '';

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

  protected captureSimpleTimes(): void {
    this.simpleTimeSnapshot = {
      horaEntrada: this.horarioForm.get('horaEntrada')?.value ?? '',
      horaSalida: this.horarioForm.get('horaSalida')?.value ?? '',
      inicioAlmuerzo: this.horarioForm.get('inicioAlmuerzo')?.value ?? '',
      finAlmuerzo: this.horarioForm.get('finAlmuerzo')?.value ?? ''
    };
  }

  protected onEntryTimeChange(): void {
    const before = this.parseTimeToMinutes(this.simpleTimeSnapshot?.horaEntrada);
    const after = this.parseTimeToMinutes(this.horarioForm.get('horaEntrada')?.value);
    if (before !== null && after !== null && before !== after) {
      this.shiftControl('horaSalida', after - before);
      if (this.usesLunchBreak()) {
        this.shiftControl('inicioAlmuerzo', after - before);
        this.shiftControl('finAlmuerzo', after - before);
      }
    }
    this.captureSimpleTimes();
    this.applySimpleSchedule();
  }

  protected onLunchStartTimeChange(): void {
    const before = this.parseTimeToMinutes(this.simpleTimeSnapshot?.inicioAlmuerzo);
    const after = this.parseTimeToMinutes(this.horarioForm.get('inicioAlmuerzo')?.value);
    if (before !== null && after !== null && before !== after) {
      this.shiftControl('finAlmuerzo', after - before);
    }
    this.captureSimpleTimes();
    this.applySimpleSchedule();
  }

  protected onIndependentTimeChange(): void {
    this.captureSimpleTimes();
    this.applySimpleSchedule();
  }

  protected isRestDay(day: string): boolean {
    return this.horarioForm.get('diaDescanso')?.value === day;
  }

  protected scheduleRuleHint(): string {
    const modalidad = this.contratoForm.get('modalidad')?.value ?? 'FULL_TIME';
    const rule = this.scheduleRules[modalidad] ?? this.scheduleRules['FULL_TIME'];

    if (rule.lunchLabel) {
      return `Sugerencia ${this.toLabel(modalidad)}: ${rule.durationLabel} entre entrada y salida, con ${rule.lunchLabel}.`;
    }

    return `Sugerencia ${this.toLabel(modalidad)}: ${rule.durationLabel} entre entrada y salida, sin almuerzo.`;
  }

  protected scheduleValidationMessage(): string | null {
    const error = this.horarioForm.errors?.['scheduleRule'] as { message?: string } | undefined;
    if (!error?.message) {
      return null;
    }

    return this.horarioForm.touched || this.horarioForm.dirty ? error.message : null;
  }

  protected isSimpleScheduleFieldInvalid(controlName: string): boolean {
    if (this.isInvalid(this.horarioForm, controlName)) {
      return true;
    }

    if (this.isAdvancedSchedule()) {
      return false;
    }

    const error = this.horarioForm.errors?.['scheduleRule'] as { simpleFields?: string[] } | undefined;
    return Boolean(error?.simpleFields?.includes(controlName) && (this.horarioForm.touched || this.horarioForm.dirty));
  }

  protected isScheduleRowFieldInvalid(rowIndex: number, controlName: string): boolean {
    const row = this.getScheduleRows()[rowIndex] as FormGroup | undefined;
    if (row?.get(controlName)?.invalid && (row.get(controlName)?.touched || row.get(controlName)?.dirty)) {
      return true;
    }

    if (!this.isAdvancedSchedule()) {
      return false;
    }

    const error = this.horarioForm.errors?.['scheduleRule'] as
      | { rowErrors?: Array<{ index: number; fields: string[] }> }
      | undefined;
    const rowError = error?.rowErrors?.find((item) => item.index === rowIndex);
    return Boolean(rowError?.fields.includes(controlName) && (this.horarioForm.touched || this.horarioForm.dirty));
  }

  protected scheduleFieldTitle(controlName: string): string | null {
    return this.isSimpleScheduleFieldInvalid(controlName) ? this.scheduleValidationMessage() : null;
  }

  protected scheduleRowFieldTitle(rowIndex: number, controlName: string): string | null {
    return this.isScheduleRowFieldInvalid(rowIndex, controlName) ? this.scheduleValidationMessage() : null;
  }

  protected closePersonalReview(visible: boolean): void {
    if (!visible) {
      this.cancelPersonalReview.emit();
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

  private shiftControl(controlName: 'horaSalida' | 'inicioAlmuerzo' | 'finAlmuerzo', deltaMinutes: number): void {
    const control = this.horarioForm.get(controlName);
    const shifted = this.shiftTime(control?.value, deltaMinutes);
    if (shifted) {
      control?.setValue(shifted);
    }
  }

  private shiftTime(value: string | null | undefined, deltaMinutes: number): string | null {
    const minutes = this.parseTimeToMinutes(value);
    if (minutes === null) {
      return null;
    }
    const next = Math.max(0, Math.min(23 * 60 + 59, minutes + deltaMinutes));
    const hours = Math.floor(next / 60);
    const mins = next % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  private parseTimeToMinutes(value: string | null | undefined): number | null {
    if (!value) {
      return null;
    }
    const match = /^(\d{2}):(\d{2})/.exec(value);
    if (!match) {
      return null;
    }
    return Number(match[1]) * 60 + Number(match[2]);
  }

  private syncLunchBreakByModalidad(): void {
    if (!this.usesLunchBreak()) {
      this.horarioForm.patchValue({
        inicioAlmuerzo: '',
        finAlmuerzo: ''
      });
      return;
    }

    if (!this.horarioForm.get('inicioAlmuerzo')?.value) {
      this.horarioForm.get('inicioAlmuerzo')?.setValue('13:00');
    }

    if (!this.horarioForm.get('finAlmuerzo')?.value) {
      this.horarioForm.get('finAlmuerzo')?.setValue('14:00');
    }
  }

  private usesLunchBreakFor(modalidad: string | null | undefined): boolean {
    return modalidad !== 'PART_TIME' && modalidad !== 'SEMI_FULL';
  }
}
