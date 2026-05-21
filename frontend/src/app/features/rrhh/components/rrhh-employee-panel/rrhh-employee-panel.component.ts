import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { StepsModule } from 'primeng/steps';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { EmpleadoResponse } from '../../../../shared/models/rrhh/empleado-response';
import { EmpresaContratistaResponse } from '../../../../shared/models/rrhh/empresa-contratista-response';
import { PostulacionResponse } from '../../../../shared/models/recruitment/postulacion-response';
import { formatLabel } from '../../../../shared/utils/display-label';

@Component({
  selector: 'app-rrhh-employee-panel',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DrawerModule,
    InputTextModule,
    MessageModule,
    PaginatorModule,
    SelectModule,
    StepsModule,
    TableModule,
    TagModule
  ],
  templateUrl: './rrhh-employee-panel.component.html',
  styleUrl: './rrhh-employee-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RrhhEmployeePanelComponent {
  protected readonly employeeSteps = [
    { label: 'Personal' },
    { label: 'Contacto' },
    { label: 'Finanzas' },
    { label: 'Corporativo' }
  ];

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
  @Output() readonly closeEmployeeDetail = new EventEmitter<void>();
  @Output() readonly openEmployeeEvents = new EventEmitter<EmpleadoResponse>();
  @Output() readonly submitPersonalUpdate = new EventEmitter<void>();
  @Output() readonly submitContactUpdate = new EventEmitter<void>();
  @Output() readonly submitFinancialUpdate = new EventEmitter<void>();
  @Output() readonly submitCorporateUpdate = new EventEmitter<void>();
  @Output() readonly markBlacklist = new EventEmitter<void>();

  protected toLabel(value: string | null | undefined): string {
    return formatLabel(value);
  }

  protected isOwnAccount(form: FormGroup): boolean {
    return form.get('cuentaPropia')?.value === 'true';
  }
}
