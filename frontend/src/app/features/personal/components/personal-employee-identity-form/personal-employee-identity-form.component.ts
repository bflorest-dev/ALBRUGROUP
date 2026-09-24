import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NormalizeTextDirective } from '../../../../shared/directives/normalize-text.directive';
import { EmpresaContratistaResponse } from '../../../../shared/models/rrhh/empresa-contratista-response';
import { PersonalIdentityCreationResult } from '../../../admin/facades/admin-personal.facade';
import { formatLabel } from '../../../../shared/utils/display-label';

type SelectOption = { label: string; value: string };

@Component({
  selector: 'app-personal-employee-identity-form',
  imports: [
    ReactiveFormsModule,
    NormalizeTextDirective
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

  private empresaItemsCache: { source: readonly EmpresaContratistaResponse[]; items: SelectOption[] } | null = null;

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

  protected setNumericDigits(controlName: string, value: string, maxLength: number): void {
    this.empleadoForm.get(controlName)?.setValue(value.replace(/\D/g, '').slice(0, maxLength));
  }

  protected toLabel(value: string | null | undefined): string {
    if (value === 'BCP' || value === 'BBVA' || value === 'DNI' || value === 'CE' || value === 'SIS' || value === 'ESSALUD') {
      return value;
    }
    return formatLabel(value);
  }

}
