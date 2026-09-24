import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { NormalizeTextDirective } from '../../../../shared/directives/normalize-text.directive';
import { EmpresaContratistaResponse } from '../../../../shared/models/rrhh/empresa-contratista-response';
import { PersonalIdentityCreationResult } from '../../../admin/facades/admin-personal.facade';
import { formatLabel } from '../../../../shared/utils/display-label';

type SelectOption = { label: string; value: string };

@Component({
  selector: 'app-personal-employee-identity-form',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DatePickerModule,
    InputTextModule,
    NormalizeTextDirective,
    SelectModule
  ],
  templateUrl: './personal-employee-identity-form.component.html',
  styleUrl: './personal-employee-identity-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalEmployeeIdentityFormComponent {
  @Input({ required: true }) empleadoForm!: FormGroup;
  @Input({ required: true }) isSubmitting = false;
  @Input({ required: true }) errorMessage = '';
  @Input() result: PersonalIdentityCreationResult | null = null;
  @Input() empresasContratistas: EmpresaContratistaResponse[] = [];
  @Input() documentoOptions: string[] = [];
  @Input() nacionalidadOptions: string[] = [];
  @Input() estadoCivilOptions: string[] = [];
  @Input() origenOptions: string[] = [];
  @Input() distritoOptions: string[] = [];
  @Input() bancoOptions: string[] = [];
  @Input() parentescoOptions: string[] = [];

  @Output() readonly submitted = new EventEmitter<void>();
  @Output() readonly closed = new EventEmitter<void>();

  protected readonly yesNoOptions: SelectOption[] = [
    { label: 'Sí', value: 'true' },
    { label: 'No', value: 'false' }
  ];
  protected readonly noYesOptions: SelectOption[] = [
    { label: 'No', value: 'false' },
    { label: 'Sí', value: 'true' }
  ];

  private readonly optionItemsCache = new WeakMap<readonly string[], SelectOption[]>();
  private readonly optionalOptionItemsCache = new WeakMap<readonly string[], SelectOption[]>();
  private empresaItemsCache: { source: readonly EmpresaContratistaResponse[]; items: SelectOption[] } | null = null;
  private readonly pickerDateCache = new Map<string, Date | null>();

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
      ...this.empresasContratistas.map((empresa) => ({ label: empresa.nombre, value: String(empresa.id) }))
    ];
    this.empresaItemsCache = { source: this.empresasContratistas, items };
    return items;
  }

  protected isInvalid(controlName: string): boolean {
    const control = this.empleadoForm.get(controlName);
    return Boolean(control?.invalid && (control.touched || control.dirty));
  }

  protected isOwnAccount(): boolean {
    return this.empleadoForm.get('cuentaPropia')?.value === 'true';
  }

  protected toPickerDate(value: unknown): Date | null {
    if (value instanceof Date) return value;
    if (typeof value !== 'string' || !value) return null;

    const cached = this.pickerDateCache.get(value);
    if (cached !== undefined) return cached;

    const backendMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const displayMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    const parsed = backendMatch
      ? new Date(Number(backendMatch[1]), Number(backendMatch[2]) - 1, Number(backendMatch[3]))
      : displayMatch
        ? new Date(Number(displayMatch[3]), Number(displayMatch[2]) - 1, Number(displayMatch[1]))
        : null;

    this.pickerDateCache.set(value, parsed);
    return parsed;
  }

  protected setDateControl(value: Date | string | null): void {
    this.empleadoForm.get('fechaNacimiento')?.setValue(this.toBackendDate(value));
    this.empleadoForm.get('fechaNacimiento')?.markAsTouched();
  }

  protected setNumericDigits(controlName: string, value: string, maxLength: number): void {
    this.empleadoForm.get(controlName)?.setValue(value.replace(/\D/g, '').slice(0, maxLength));
  }

  protected toLabel(value: string | null | undefined): string {
    if (value === 'BCP' || value === 'BBVA' || value === 'DNI' || value === 'CE' || value === 'SIS' || value === 'ESSALUD') {
      return value;
    }
    return formatLabel(value);
  }

  private toBackendDate(value: Date | string | null): string {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    }
    if (typeof value !== 'string' || !value) return '';

    const displayMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    return displayMatch ? `${displayMatch[3]}-${displayMatch[2]}-${displayMatch[1]}` : value;
  }
}
