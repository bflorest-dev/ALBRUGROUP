import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { EmpleadoResponse } from '../../../../shared/models/rrhh/empleado-response';
import { EmpresaContratistaResponse } from '../../../../shared/models/rrhh/empresa-contratista-response';
import { PostulacionResponse } from '../../../../shared/models/recruitment/postulacion-response';

@Component({
  selector: 'app-rrhh-employee-panel',
  imports: [ReactiveFormsModule, DateFieldComponent],
  templateUrl: './rrhh-employee-panel.component.html',
  styleUrl: './rrhh-employee-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RrhhEmployeePanelComponent {
  @Input({ required: true }) employeeCreateForm!: FormGroup;
  @Input({ required: true }) employeeFilterForm!: FormGroup;
  @Input({ required: true }) personalForm!: FormGroup;
  @Input({ required: true }) contactForm!: FormGroup;
  @Input({ required: true }) financialForm!: FormGroup;
  @Input({ required: true }) corporateForm!: FormGroup;
  @Input({ required: true }) selectedHiringCase: PostulacionResponse | null = null;
  @Input({ required: true }) selectedEmployee: EmpleadoResponse | null = null;
  @Input({ required: true }) employees: EmpleadoResponse[] = [];
  @Input({ required: true }) empresasContratistas: EmpresaContratistaResponse[] = [];
  @Input({ required: true }) documentoOptions: string[] = [];
  @Input({ required: true }) nacionalidadOptions: string[] = [];
  @Input({ required: true }) estadoCivilOptions: string[] = [];
  @Input({ required: true }) origenOptions: string[] = [];
  @Input({ required: true }) distritoOptions: string[] = [];
  @Input({ required: true }) bancoOptions: string[] = [];
  @Input({ required: true }) parentescoOptions: string[] = [];
  @Input({ required: true }) estadoOperativoOptions: string[] = [];
  @Input({ required: true }) isLoadingEmployees = false;
  @Input({ required: true }) isCreatingEmployee = false;
  @Input({ required: true }) isUpdatingEmployee = false;
  @Input({ required: true }) currentPage = 0;
  @Input({ required: true }) totalPages = 1;
  @Input({ required: true }) employeeListErrorMessage = '';
  @Input({ required: true }) employeeActionErrorMessage = '';
  @Input({ required: true }) employeeActionSuccessMessage = '';

  @Output() readonly prepareBlankEmployee = new EventEmitter<void>();
  @Output() readonly registerEmployee = new EventEmitter<void>();
  @Output() readonly applyEmployeeFilters = new EventEmitter<void>();
  @Output() readonly clearEmployeeFilters = new EventEmitter<void>();
  @Output() readonly searchEmployeeUniversal = new EventEmitter<void>();
  @Output() readonly searchEmployeeByDocument = new EventEmitter<void>();
  @Output() readonly reloadEmployees = new EventEmitter<void>();
  @Output() readonly employeesPageChange = new EventEmitter<number>();
  @Output() readonly selectEmployee = new EventEmitter<EmpleadoResponse>();
  @Output() readonly submitPersonalUpdate = new EventEmitter<void>();
  @Output() readonly submitContactUpdate = new EventEmitter<void>();
  @Output() readonly submitFinancialUpdate = new EventEmitter<void>();
  @Output() readonly submitCorporateUpdate = new EventEmitter<void>();
  @Output() readonly markBlacklist = new EventEmitter<void>();

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
