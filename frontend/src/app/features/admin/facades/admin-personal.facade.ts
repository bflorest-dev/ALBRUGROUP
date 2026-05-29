import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { catchError, filter, firstValueFrom, map, of, startWith, switchMap, timeout } from 'rxjs';
import { ApiErrorResponse } from '../../../shared/models/api/api-error-response';
import { UsuarioResponse } from '../../../shared/models/auth/usuario-response';
import { PageResponse } from '../../../shared/models/common/page-response';
import { ContratoResponse } from '../../../shared/models/rrhh/contrato-response';
import { EmpleadoResponse } from '../../../shared/models/rrhh/empleado-response';
import { EmpleadoRolResponse } from '../../../shared/models/rrhh/empleado-rol-response';
import { EmpresaContratistaResponse } from '../../../shared/models/rrhh/empresa-contratista-response';
import { RegistrarContratoRequest } from '../../../shared/models/rrhh/registrar-contrato-request';
import { RegistrarEmpleadoRequest } from '../../../shared/models/rrhh/registrar-empleado-request';
import { RegistrarHorarioRequest } from '../../../shared/models/schedule/registrar-horario-request';
import { AuthService } from '../../auth/services/auth.service';
import { AdminRrhhService } from '../services/admin-rrhh.service';

type EmployeeListRequest = {
  requestId: number;
  pageNumber: number;
  silent: boolean;
};

type EmployeeListState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'refreshing'; requestId: number }
  | { status: 'success'; requestId: number; page: PageResponse<EmpleadoResponse> }
  | { status: 'error'; requestId: number; message: string };

type CreateFlowRequest = {
  requestId: number;
  empleadoRequest: RegistrarEmpleadoRequest;
  contratoRequest: RegistrarContratoRequest;
  horarioRequest: Omit<RegistrarHorarioRequest, 'idEmpleado' | 'idContrato'>;
};

type CreateFlowState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | {
      status: 'success';
      requestId: number;
      usuario: UsuarioResponse;
      empleado: EmpleadoResponse;
    }
  | { status: 'error'; requestId: number; message: string };

type AccessLookupRequest = {
  requestId: number;
  empleadoId: number;
};

type AccessLookupState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number; empleadoId: number }
  | { status: 'success'; requestId: number; empleadoId: number; usuario: UsuarioResponse }
  | { status: 'error'; requestId: number; empleadoId: number; message: string };

export type PersonalReviewSummary = {
  nombreCompleto: string;
  numeroDocumento: string;
  correoPersonal: string;
  rolAsignado: string;
};

@Injectable()
export class AdminPersonalFacade {
  private readonly requestTimeoutMs = 15000;
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminRrhhService = inject(AdminRrhhService);
  private readonly authService = inject(AuthService);
  private readonly modalidadesSinAlmuerzo = new Set(['PART_TIME', 'SEMI_FULL']);
  private nextRequestId = 1;
  private handledCreateFlowRequestId = 0;

  private readonly employeeListRequest = signal<EmployeeListRequest | null>(null);
  private readonly createFlowRequest = signal<CreateFlowRequest | null>(null);
  private readonly accessLookupRequest = signal<AccessLookupRequest | null>(null);

  private readonly employeeListState = toSignal(
    toObservable(this.employeeListRequest).pipe(
      filter((request): request is EmployeeListRequest => request !== null),
      switchMap((request) =>
        this.adminRrhhService.getEmpleados(request.pageNumber).pipe(
          timeout(this.requestTimeoutMs),
          map(
            (page): EmployeeListState => ({
              status: 'success',
              requestId: request.requestId,
              page
            })
          ),
          startWith<EmployeeListState>({
            status: request.silent ? 'refreshing' : 'loading',
            requestId: request.requestId
          }),
          catchError((error: HttpErrorResponse) =>
            of<EmployeeListState>({
              status: 'error',
              requestId: request.requestId,
              message: this.getErrorMessage(error, 'No fue posible cargar el listado de empleados.')
            })
          )
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  private readonly createFlowState = toSignal(
    toObservable(this.createFlowRequest).pipe(
      filter((request): request is CreateFlowRequest => request !== null),
      switchMap((request) =>
        this.adminRrhhService.registrarEmpleado(request.empleadoRequest).pipe(
          timeout(this.requestTimeoutMs),
          switchMap((empleado) =>
            this.adminRrhhService.registrarContrato(empleado.id, request.contratoRequest).pipe(
              timeout(this.requestTimeoutMs),
              switchMap((contrato) =>
                this.adminRrhhService
                  .registrarHorario({
                    idEmpleado: empleado.id,
                    idContrato: contrato.id,
                    ...request.horarioRequest
                  })
                  .pipe(
                    timeout(this.requestTimeoutMs),
                    switchMap(() =>
                      this.authService.getUsuarioPorEmpleadoId(empleado.id).pipe(
                        timeout(this.requestTimeoutMs),
                        map(
                          (usuario): CreateFlowState => ({
                            status: 'success',
                            requestId: request.requestId,
                            usuario,
                            empleado
                          })
                        )
                      )
                    )
                  )
              )
            )
          ),
          startWith<CreateFlowState>({ status: 'loading', requestId: request.requestId }),
          catchError((error: HttpErrorResponse) =>
            of<CreateFlowState>({
              status: 'error',
              requestId: request.requestId,
              message: this.getErrorMessage(
                error,
                'No se pudo completar el alta de empleado, contrato y horario.'
              )
            })
          )
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  private readonly accessLookupState = toSignal(
    toObservable(this.accessLookupRequest).pipe(
      filter((request): request is AccessLookupRequest => request !== null),
      switchMap((request) =>
        this.authService.getUsuarioPorEmpleadoId(request.empleadoId).pipe(
          timeout(this.requestTimeoutMs),
          map(
            (usuario): AccessLookupState => ({
              status: 'success',
              requestId: request.requestId,
              empleadoId: request.empleadoId,
              usuario
            })
          ),
          startWith<AccessLookupState>({
            status: 'loading',
            requestId: request.requestId,
            empleadoId: request.empleadoId
          }),
          catchError((error: HttpErrorResponse) =>
            of<AccessLookupState>({
              status: 'error',
              requestId: request.requestId,
              empleadoId: request.empleadoId,
              message: this.getErrorMessage(error, 'No se pudo consultar el acceso del empleado.')
            })
          )
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  readonly documentoOptions = ['DNI', 'CE'];
  readonly nacionalidadOptions = ['PERUANO', 'EXTRANJERO'];
  readonly estadoCivilOptions = ['SOLTERO', 'CASADO', 'VIUDO', 'DIVORCIADO'];
  readonly origenOptions = ['COMPUTRABAJO', 'INDEED', 'TIKTOK', 'FACEBOOK', 'LINKEDIN', 'REFERIDO'];
  readonly distritoOptions = [
    'ANCON',
    'ATE',
    'BARRANCO',
    'BELLAVISTA',
    'BREÑA',
    'CALLAO',
    'CARABAYLLO',
    'CARMEN_DE_LA_LEGUA',
    'CERCADO_DE_LIMA',
    'CHACLACAYO',
    'CHORRILLOS',
    'CIENEGUILLA',
    'COMAS',
    'EL_AGUSTINO',
    'INDEPENDENCIA',
    'JESUS_MARIA',
    'LA_MOLINA',
    'LA_PUNTA',
    'LA_PERLA',
    'LA_VICTORIA',
    'LINCE',
    'LOS_OLIVOS',
    'LURIN',
    'LURIGANCHO',
    'MAGDALENA_DEL_MAR',
    'MIRAFLORES',
    'MI_PERU',
    'PACHACAMAC',
    'PUCUSANA',
    'PUEBLO_LIBRE',
    'PUENTE_PIEDRA',
    'PUNTA_HERMOSA',
    'PUNTA_NEGRA',
    'RIMAC',
    'SAN_BARTOLO',
    'SAN_BORJA',
    'SAN_ISIDRO',
    'SAN_JUAN_DE_LURIGANCHO',
    'SAN_JUAN_DE_MIRAFLORES',
    'SAN_LUIS',
    'SAN_MARTIN_DE_PORRES',
    'SAN_MIGUEL',
    'SANTA_ANITA',
    'SANTA_MARIA_DEL_MAR',
    'SANTA_ROSA',
    'SANTIAGO_DE_SURCO',
    'SURQUILLO',
    'VENTANILLA',
    'VILLA_EL_SALVADOR',
    'VILLA_MARIA_DEL_TRIUNFO'
  ];
  readonly bancoOptions = ['BCP', 'BBVA', 'INTERBANK', 'SCOTIABANK', 'BANCO_DE_LA_NACION'];
  readonly parentescoOptions = ['PADRE', 'MADRE', 'TIO', 'ESPOSO', 'HERMANO', 'ABUELO', 'PAREJA', 'OTRO'];
  readonly puestoTrabajoOptions = [
    'ADMINISTRADOR',
    'RRHH',
    'RECLUTADOR',
    'CAPACITADOR',
    'DESARROLLADOR',
    'CONTADOR',
    'COMMUNITY',
    'MONITOR',
    'SUPERVISOR_VENTAS',
    'ASESOR_VENTAS',
    'SUPERVISOR_BACKOFFICE',
    'ASESOR_BACKOFFICE',
    'SUPERVISOR_GTR',
    'ASESOR_GTR',
    'SUPERVISOR_POSTVENTA',
    'ASESOR_POSTVENTA'
  ];
  readonly regimenOptions = ['RECIBO_POR_HONORARIOS', 'PLANILLA'];
  readonly modalidadOptions = ['PART_TIME', 'FULL_TIME', 'SEMI_FULL', 'SUPER_FULL'];
  readonly seguroSaludOptions = ['SIS', 'ESSALUD'];
  readonly sistemaPensionesOptions = ['ONP', 'AFP_INTEGRA', 'AFP_PROFUTURO', 'AFP_HABITAT', 'PRIMA_AFP'];
  readonly diasSemanaOptions = [
    'LUNES',
    'MARTES',
    'MIERCOLES',
    'JUEVES',
    'VIERNES',
    'SABADO',
    'DOMINGO'
  ];

  readonly empleadoForm = this.formBuilder.nonNullable.group({
    nombres: ['', [Validators.required]],
    apellidos: ['', [Validators.required]],
    tipoDocumento: ['DNI', [Validators.required]],
    numeroDocumento: ['', [Validators.required]],
    nacionalidad: ['PERUANO', [Validators.required]],
    fechaNacimiento: ['', [Validators.required]],
    estadoCivil: ['SOLTERO', [Validators.required]],
    tieneHijos: ['false', [Validators.required]],
    celularPersonal: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
    correoPersonal: ['', [Validators.required, Validators.email]],
    origen: ['COMPUTRABAJO', [Validators.required]],
    distrito: ['SAN_MIGUEL', [Validators.required]],
    direccion: ['', [Validators.required]],
    banco: ['BCP', [Validators.required]],
    cuentaBancaria: ['', [Validators.required]],
    cuentaInterbancaria: ['', [Validators.required]],
    cuentaPropia: ['true', [Validators.required]],
    parentesco: [''],
    celularTransferencia: [''],
    idEmpresaContratista: ['', [Validators.required]]
  });

  readonly contratoForm = this.formBuilder.nonNullable.group({
    puestoTrabajo: ['RECLUTADOR', [Validators.required]],
    regimen: ['PLANILLA', [Validators.required]],
    modalidad: ['FULL_TIME', [Validators.required]],
    seguroSalud: ['ESSALUD'],
    sistemaPensiones: ['ONP'],
    sueldoBase: [1130, [Validators.required, Validators.min(0.01)]],
    fechaInicio: [this.getToday(), [Validators.required]],
    fechaFin: [''],
    fechaFinHabilitada: ['false']
  });

  readonly contractRenewalForm = this.formBuilder.nonNullable.group({
    puestoTrabajo: ['RECLUTADOR', [Validators.required]],
    regimen: ['PLANILLA', [Validators.required]],
    modalidad: ['FULL_TIME', [Validators.required]],
    seguroSalud: ['ESSALUD'],
    sistemaPensiones: ['ONP'],
    sueldoBase: [1130, [Validators.required, Validators.min(0.01)]],
    fechaInicio: [this.getToday(), [Validators.required]],
    fechaFin: [''],
    fechaFinHabilitada: ['false']
  });

  readonly horarioForm = this.formBuilder.nonNullable.group({
    fechaInicio: [this.getToday(), [Validators.required]],
    compensable: ['true', [Validators.required]],
    horaEntrada: ['09:00', [Validators.required]],
    horaSalida: ['18:00', [Validators.required]],
    inicioAlmuerzo: ['13:00', [Validators.required]],
    finAlmuerzo: ['14:00', [Validators.required]],
    diaDescanso: ['DOMINGO', [Validators.required]],
    modoAvanzado: ['false', [Validators.required]],
    detalles: this.formBuilder.nonNullable.array(this.buildDefaultScheduleRows())
  });

  readonly currentStep = signal(1);
  readonly submitErrorMessage = signal('');
  readonly creationResult = signal<UsuarioResponse | null>(null);
  readonly isPersonalReviewVisible = signal(false);
  readonly isContractRenewalVisible = signal(false);
  readonly employeesPage = signal<PageResponse<EmpleadoResponse> | null>(null);
  readonly isLoadingEmployees = signal(false);
  readonly employeeListErrorMessage = signal('');
  readonly activeEmployees = signal<EmpleadoRolResponse[]>([]);
  readonly isLoadingActiveEmployees = signal(false);
  readonly activeEmployeeListErrorMessage = signal('');
  readonly accessByEmployeeId = signal<Record<number, UsuarioResponse | null>>({});
  readonly accessErrorByEmployeeId = signal<Record<number, string>>({});
  readonly accessLoadingByEmployeeId = signal<Record<number, boolean>>({});
  readonly selectedEmployeeForContractRenewal = signal<EmpleadoRolResponse | null>(null);
  readonly currentContractForRenewal = signal<ContratoResponse | null>(null);
  readonly isLoadingContractRenewal = signal(false);
  readonly isSubmittingContractRenewal = signal(false);
  readonly contractRenewalErrorMessage = signal('');
  readonly contractRenewalSuccessMessage = signal('');

  readonly empresasContratistas = toSignal(
    this.adminRrhhService.listarEmpresasContratistas().pipe(
      timeout(this.requestTimeoutMs),
      catchError(() => of<EmpresaContratistaResponse[]>([]))
    ),
    { initialValue: [] as EmpresaContratistaResponse[] }
  );
  private readonly empleadoFormValue = toSignal(
    this.empleadoForm.valueChanges.pipe(startWith(this.empleadoForm.getRawValue())),
    { initialValue: this.empleadoForm.getRawValue() }
  );
  private readonly contratoFormValue = toSignal(
    this.contratoForm.valueChanges.pipe(startWith(this.contratoForm.getRawValue())),
    { initialValue: this.contratoForm.getRawValue() }
  );

  readonly isSubmitting = computed(() => this.createFlowState().status === 'loading');
  readonly personalReviewSummary = computed<PersonalReviewSummary>(() => {
    const empleado = this.empleadoFormValue();
    const contrato = this.contratoFormValue();

    return {
      nombreCompleto: `${(empleado.nombres ?? '').trim()} ${(empleado.apellidos ?? '').trim()}`.trim(),
      numeroDocumento: (empleado.numeroDocumento ?? '').trim(),
      correoPersonal: (empleado.correoPersonal ?? '').trim(),
      rolAsignado: contrato.puestoTrabajo ?? ''
    };
  });
  readonly employeeRows = computed(() => this.employeesPage()?.content ?? []);
  readonly currentPage = computed(() => this.employeesPage()?.page ?? 0);
  readonly totalPages = computed(() => this.employeesPage()?.totalPages ?? 1);
  readonly activeEmployeeGroups = computed(() => {
    const groups = new Map<string, EmpleadoRolResponse[]>();
    for (const employee of this.activeEmployees()) {
      const role = employee.puestoTrabajo || 'SIN_ROL';
      groups.set(role, [...(groups.get(role) ?? []), employee]);
    }

    return [...groups.entries()]
      .map(([role, employees]) => ({
        role,
        employees: employees.sort((left, right) =>
          `${left.nombres} ${left.apellidos}`.localeCompare(`${right.nombres} ${right.apellidos}`)
        )
      }))
      .sort((left, right) => left.role.localeCompare(right.role));
  });

  constructor() {
    effect(() => {
      const state = this.employeeListState();

      if (state.status === 'loading') {
        this.isLoadingEmployees.set(true);
        this.employeeListErrorMessage.set('');
        return;
      }

      if (state.status === 'refreshing') {
        this.employeeListErrorMessage.set('');
        return;
      }

      if (state.status === 'success') {
        this.employeesPage.set(state.page);
        this.isLoadingEmployees.set(false);
        this.employeeListErrorMessage.set('');
        return;
      }

      if (state.status === 'error') {
        this.isLoadingEmployees.set(false);
        this.employeeListErrorMessage.set(state.message);
      }
    });

    effect(() => {
      const state = this.createFlowState();

      if (state.status === 'success') {
        if (state.requestId === this.handledCreateFlowRequestId) {
          return;
        }

        this.handledCreateFlowRequestId = state.requestId;

        untracked(() => {
          this.isPersonalReviewVisible.set(false);
          this.creationResult.set(state.usuario);
          this.currentStep.set(4);
          this.loadEmployees(0, true);
        });
        return;
      }

      if (state.status === 'error') {
        this.submitErrorMessage.set(state.message);
      }
    });

    effect(() => {
      const state = this.accessLookupState();

      if (state.status === 'loading') {
        this.accessLoadingByEmployeeId.update((current) => ({
          ...current,
          [state.empleadoId]: true
        }));
        this.accessErrorByEmployeeId.update((current) => ({
          ...current,
          [state.empleadoId]: ''
        }));
        return;
      }

      if (state.status === 'success') {
        this.accessLoadingByEmployeeId.update((current) => ({
          ...current,
          [state.empleadoId]: false
        }));
        this.accessByEmployeeId.update((current) => ({
          ...current,
          [state.empleadoId]: state.usuario
        }));
        return;
      }

      if (state.status === 'error') {
        this.accessLoadingByEmployeeId.update((current) => ({
          ...current,
          [state.empleadoId]: false
        }));
        this.accessByEmployeeId.update((current) => ({
          ...current,
          [state.empleadoId]: null
        }));
        this.accessErrorByEmployeeId.update((current) => ({
          ...current,
          [state.empleadoId]: state.message
        }));
      }
    });
  }

  initialize(): void {
    this.loadEmployees();
    void this.loadActiveEmployees();
  }

  continueToContract(): void {
    if (this.empleadoForm.invalid) {
      this.empleadoForm.markAllAsTouched();
      return;
    }

    this.currentStep.set(2);
  }

  backToEmployee(): void {
    this.currentStep.set(1);
  }

  continueToSchedule(): void {
    if (this.contratoForm.invalid) {
      this.contratoForm.markAllAsTouched();
      return;
    }

    if (!this.horarioForm.controls.fechaInicio.getRawValue()) {
      this.horarioForm.controls.fechaInicio.setValue(this.getToday());
    }
    this.syncLunchBreakControls();
    this.currentStep.set(3);
  }

  backToContract(): void {
    this.currentStep.set(2);
  }

  submitPersonalFlow(): void {
    this.executePersonalFlow();
  }

  requestPersonalReview(): void {
    if (!this.validatePersonalForms()) {
      return;
    }

    this.submitErrorMessage.set('');
    this.isPersonalReviewVisible.set(true);
  }

  cancelPersonalReview(): void {
    this.isPersonalReviewVisible.set(false);
  }

  confirmPersonalReview(): void {
    this.isPersonalReviewVisible.set(false);
    this.executePersonalFlow();
  }

  private executePersonalFlow(): void {
    if (this.empleadoForm.invalid) {
      this.currentStep.set(1);
      this.empleadoForm.markAllAsTouched();
      return;
    }

    if (this.contratoForm.invalid) {
      this.currentStep.set(2);
      this.contratoForm.markAllAsTouched();
      return;
    }

    this.syncLunchBreakControls();

    if (this.horarioForm.invalid) {
      this.currentStep.set(3);
      this.horarioForm.markAllAsTouched();
      return;
    }

    this.submitErrorMessage.set('');
    this.creationResult.set(null);
    this.createFlowRequest.set({
      requestId: this.nextRequestId++,
      empleadoRequest: this.buildEmpleadoRequest(),
      contratoRequest: this.buildContratoRequest(),
      horarioRequest: this.buildHorarioRequest()
    });
  }

  private validatePersonalForms(): boolean {
    if (this.empleadoForm.invalid) {
      this.currentStep.set(1);
      this.empleadoForm.markAllAsTouched();
      return false;
    }

    if (this.contratoForm.invalid) {
      this.currentStep.set(2);
      this.contratoForm.markAllAsTouched();
      return false;
    }

    this.syncLunchBreakControls();

    if (this.horarioForm.invalid) {
      this.currentStep.set(3);
      this.horarioForm.markAllAsTouched();
      return false;
    }

    return true;
  }

  resetFlow(): void {
    this.currentStep.set(1);
    this.creationResult.set(null);
    this.isPersonalReviewVisible.set(false);
    this.submitErrorMessage.set('');
    this.empleadoForm.reset({
      nombres: '',
      apellidos: '',
      tipoDocumento: 'DNI',
      numeroDocumento: '',
      nacionalidad: 'PERUANO',
      fechaNacimiento: '',
      estadoCivil: 'SOLTERO',
      tieneHijos: 'false',
      celularPersonal: '',
      correoPersonal: '',
      origen: 'COMPUTRABAJO',
      distrito: 'SAN_MIGUEL',
      direccion: '',
      banco: 'BCP',
      cuentaBancaria: '',
      cuentaInterbancaria: '',
      cuentaPropia: 'true',
      parentesco: '',
      celularTransferencia: '',
      idEmpresaContratista: ''
    });
    this.contratoForm.reset({
      puestoTrabajo: 'RECLUTADOR',
      regimen: 'PLANILLA',
      modalidad: 'FULL_TIME',
      seguroSalud: 'ESSALUD',
      sistemaPensiones: 'ONP',
      sueldoBase: 1130,
      fechaInicio: this.getToday(),
      fechaFin: '',
      fechaFinHabilitada: 'false'
    });
    this.horarioForm.reset({
      fechaInicio: this.getToday(),
      compensable: 'true',
      horaEntrada: '09:00',
      horaSalida: '18:00',
      inicioAlmuerzo: '13:00',
      finAlmuerzo: '14:00',
      diaDescanso: 'DOMINGO',
      modoAvanzado: 'false'
    });
    this.resetScheduleRows();
  }

  loadEmployees(pageNumber = 0, silent = false): void {
    this.employeeListRequest.set({
      requestId: this.nextRequestId++,
      pageNumber,
      silent
    });
  }

  async loadActiveEmployees(): Promise<void> {
    this.isLoadingActiveEmployees.set(true);
    this.activeEmployeeListErrorMessage.set('');

    try {
      this.activeEmployees.set(
        await firstValueFrom(this.adminRrhhService.listarEmpleadosLight().pipe(timeout(this.requestTimeoutMs)))
      );
    } catch (error) {
      this.activeEmployeeListErrorMessage.set(
        this.getErrorMessage(error as HttpErrorResponse, 'No fue posible cargar empleados activos.')
      );
    } finally {
      this.isLoadingActiveEmployees.set(false);
    }
  }

  toggleUserAccess(empleadoId: number): void {
    if (this.hasAccessLoaded(empleadoId)) {
      this.accessByEmployeeId.update((current) => {
        const next = { ...current };
        delete next[empleadoId];
        return next;
      });
      this.accessErrorByEmployeeId.update((current) => {
        const next = { ...current };
        delete next[empleadoId];
        return next;
      });
      this.accessLoadingByEmployeeId.update((current) => {
        const next = { ...current };
        delete next[empleadoId];
        return next;
      });
      return;
    }

    this.accessLookupRequest.set({
      requestId: this.nextRequestId++,
      empleadoId
    });
  }

  async openContractRenewal(employee: EmpleadoRolResponse): Promise<void> {
    this.selectedEmployeeForContractRenewal.set(employee);
    this.currentContractForRenewal.set(null);
    this.contractRenewalErrorMessage.set('');
    this.contractRenewalSuccessMessage.set('');
    this.isContractRenewalVisible.set(true);
    this.isLoadingContractRenewal.set(true);
    this.resetContractRenewalForm();

    try {
      const contrato = await firstValueFrom(
        this.adminRrhhService.getContratoVigente(employee.idEmpleado).pipe(timeout(this.requestTimeoutMs))
      );
      this.currentContractForRenewal.set(contrato);
      this.populateContractRenewalForm(contrato);
    } catch (error) {
      this.contractRenewalErrorMessage.set(
        this.getErrorMessage(error as HttpErrorResponse, 'No fue posible cargar el contrato vigente.')
      );
    } finally {
      this.isLoadingContractRenewal.set(false);
    }
  }

  closeContractRenewal(): void {
    this.isContractRenewalVisible.set(false);
    this.isLoadingContractRenewal.set(false);
    this.isSubmittingContractRenewal.set(false);
    this.contractRenewalErrorMessage.set('');
    this.selectedEmployeeForContractRenewal.set(null);
    this.currentContractForRenewal.set(null);
    this.resetContractRenewalForm();
  }

  async submitContractRenewal(): Promise<void> {
    const employee = this.selectedEmployeeForContractRenewal();
    if (!employee) {
      return;
    }

    if (this.contractRenewalForm.invalid) {
      this.contractRenewalForm.markAllAsTouched();
      return;
    }

    this.contractRenewalErrorMessage.set('');
    this.contractRenewalSuccessMessage.set('');
    this.isSubmittingContractRenewal.set(true);

    try {
      const contrato = await firstValueFrom(
        this.adminRrhhService
          .registrarContrato(employee.idEmpleado, this.buildContratoRequestFromForm(this.contractRenewalForm))
          .pipe(timeout(this.requestTimeoutMs))
      );

      this.currentContractForRenewal.set(contrato);
      this.contractRenewalSuccessMessage.set('Nuevo contrato registrado. El acceso del usuario se sincronizo.');
      this.isContractRenewalVisible.set(false);
      void this.loadActiveEmployees();
      this.refreshUserAccess(employee.idEmpleado);
    } catch (error) {
      this.contractRenewalErrorMessage.set(
        this.getErrorMessage(error as HttpErrorResponse, 'No se pudo registrar el nuevo contrato.')
      );
    } finally {
      this.isSubmittingContractRenewal.set(false);
    }
  }

  private hasAccessLoaded(empleadoId: number): boolean {
    return empleadoId in this.accessByEmployeeId() || !!this.accessErrorByEmployeeId()[empleadoId];
  }

  private buildEmpleadoRequest(): RegistrarEmpleadoRequest {
    const raw = this.empleadoForm.getRawValue();

    return {
      nombres: raw.nombres.trim(),
      apellidos: raw.apellidos.trim(),
      tipoDocumento: raw.tipoDocumento,
      numeroDocumento: raw.numeroDocumento.trim(),
      nacionalidad: raw.nacionalidad,
      fechaNacimiento: raw.fechaNacimiento,
      estadoCivil: raw.estadoCivil,
      tieneHijos: raw.tieneHijos === 'true',
      celularPersonal: raw.celularPersonal.trim(),
      correoPersonal: raw.correoPersonal.trim(),
      origen: raw.origen,
      distrito: raw.distrito,
      direccion: raw.direccion.trim(),
      banco: raw.banco,
      cuentaBancaria: raw.cuentaBancaria.trim(),
      cuentaInterbancaria: raw.cuentaInterbancaria.trim(),
      cuentaPropia: raw.cuentaPropia === 'true',
      parentesco: raw.cuentaPropia === 'true' ? null : raw.parentesco ? raw.parentesco : null,
      celularTransferencia:
        raw.cuentaPropia === 'true' ? null : raw.celularTransferencia ? raw.celularTransferencia.trim() : null,
      idEmpresaContratista: raw.idEmpresaContratista ? Number(raw.idEmpresaContratista) : null
    };
  }

  private buildContratoRequest(): RegistrarContratoRequest {
    return this.buildContratoRequestFromForm(this.contratoForm);
  }

  private buildHorarioRequest(): Omit<RegistrarHorarioRequest, 'idEmpleado' | 'idContrato'> {
    this.syncLunchBreakControls();
    this.syncSimpleScheduleRows();
    const raw = this.horarioForm.getRawValue();
    const modalidad = this.contratoForm.controls.modalidad.getRawValue();
    const requiereAlmuerzo = this.requiresLunchBreak(modalidad);

    return {
      modalidad,
      fechaInicio: raw.fechaInicio,
      compensable: raw.compensable === 'true',
      detalles: raw.detalles.map((detalle) => ({
        dia: detalle.dia,
        horaEntrada: detalle.horaEntrada,
        horaSalida: detalle.horaSalida,
        inicioAlmuerzo: requiereAlmuerzo ? detalle.inicioAlmuerzo : null,
        finAlmuerzo: requiereAlmuerzo ? detalle.finAlmuerzo : null,
        laborable: detalle.laborable === 'true'
      }))
    };
  }

  private buildDefaultScheduleRows() {
    return this.diasSemanaOptions.map((dia) =>
      this.formBuilder.nonNullable.group({
        dia: [dia, [Validators.required]],
        horaEntrada: ['09:00', [Validators.required]],
        horaSalida: ['18:00', [Validators.required]],
        inicioAlmuerzo: ['13:00', [Validators.required]],
        finAlmuerzo: ['14:00', [Validators.required]],
        laborable: [dia === 'DOMINGO' ? 'false' : 'true', [Validators.required]]
      })
    );
  }

  private syncSimpleScheduleRows(): void {
    const raw = this.horarioForm.getRawValue();
    if (raw.modoAvanzado === 'true') {
      return;
    }

    const requiereAlmuerzo = this.requiresLunchBreak(this.contratoForm.controls.modalidad.getRawValue());
    for (const row of this.horarioForm.controls.detalles.controls) {
      row.patchValue({
        horaEntrada: raw.horaEntrada,
        horaSalida: raw.horaSalida,
        inicioAlmuerzo: requiereAlmuerzo ? raw.inicioAlmuerzo : '',
        finAlmuerzo: requiereAlmuerzo ? raw.finAlmuerzo : '',
        laborable: row.controls.dia.getRawValue() === raw.diaDescanso ? 'false' : 'true'
      });
    }
  }

  private syncLunchBreakControls(): void {
    const requiereAlmuerzo = this.requiresLunchBreak(this.contratoForm.controls.modalidad.getRawValue());
    const defaults = {
      inicioAlmuerzo: '13:00',
      finAlmuerzo: '14:00'
    };

    const controls = [
      this.horarioForm.controls.inicioAlmuerzo,
      this.horarioForm.controls.finAlmuerzo,
      ...this.horarioForm.controls.detalles.controls.flatMap((row) => [
        row.controls.inicioAlmuerzo,
        row.controls.finAlmuerzo
      ])
    ];

    for (const control of controls) {
      control.setValidators(requiereAlmuerzo ? [Validators.required] : []);
    }

    if (requiereAlmuerzo) {
      if (!this.horarioForm.controls.inicioAlmuerzo.getRawValue()) {
        this.horarioForm.controls.inicioAlmuerzo.setValue(defaults.inicioAlmuerzo);
      }

      if (!this.horarioForm.controls.finAlmuerzo.getRawValue()) {
        this.horarioForm.controls.finAlmuerzo.setValue(defaults.finAlmuerzo);
      }

      for (const row of this.horarioForm.controls.detalles.controls) {
        if (!row.controls.inicioAlmuerzo.getRawValue()) {
          row.controls.inicioAlmuerzo.setValue(defaults.inicioAlmuerzo);
        }

        if (!row.controls.finAlmuerzo.getRawValue()) {
          row.controls.finAlmuerzo.setValue(defaults.finAlmuerzo);
        }
      }
    } else {
      this.horarioForm.controls.inicioAlmuerzo.setValue('');
      this.horarioForm.controls.finAlmuerzo.setValue('');
      for (const row of this.horarioForm.controls.detalles.controls) {
        row.controls.inicioAlmuerzo.setValue('');
        row.controls.finAlmuerzo.setValue('');
      }
    }

    controls.forEach((control) => control.updateValueAndValidity({ emitEvent: false }));
  }

  private requiresLunchBreak(modalidad: string): boolean {
    return !this.modalidadesSinAlmuerzo.has(modalidad);
  }

  private buildContratoRequestFromForm(form: typeof this.contratoForm): RegistrarContratoRequest {
    const raw = form.getRawValue();

    return {
      puestoTrabajo: raw.puestoTrabajo,
      regimen: raw.regimen,
      modalidad: raw.modalidad,
      seguroSalud: raw.regimen === 'PLANILLA' && raw.seguroSalud ? raw.seguroSalud : null,
      sistemaPensiones: raw.regimen === 'PLANILLA' && raw.sistemaPensiones ? raw.sistemaPensiones : null,
      sueldoBase: Number(raw.sueldoBase),
      fechaInicio: raw.fechaInicio,
      fechaFin: raw.fechaFinHabilitada === 'true' && raw.fechaFin ? raw.fechaFin : null
    };
  }

  private populateContractRenewalForm(contrato: ContratoResponse): void {
    this.contractRenewalForm.reset({
      puestoTrabajo: contrato.puestoTrabajo,
      regimen: contrato.regimen,
      modalidad: contrato.modalidad,
      seguroSalud: contrato.seguroSalud ?? 'ESSALUD',
      sistemaPensiones: contrato.sistemaPensiones ?? 'ONP',
      sueldoBase: contrato.sueldoBase,
      fechaInicio: this.getToday(),
      fechaFin: '',
      fechaFinHabilitada: 'false'
    });
  }

  private resetContractRenewalForm(): void {
    this.contractRenewalForm.reset({
      puestoTrabajo: 'RECLUTADOR',
      regimen: 'PLANILLA',
      modalidad: 'FULL_TIME',
      seguroSalud: 'ESSALUD',
      sistemaPensiones: 'ONP',
      sueldoBase: 1130,
      fechaInicio: this.getToday(),
      fechaFin: '',
      fechaFinHabilitada: 'false'
    });
  }

  private refreshUserAccess(empleadoId: number): void {
    if (!(empleadoId in this.accessByEmployeeId()) && !this.accessErrorByEmployeeId()[empleadoId]) {
      return;
    }

    this.accessLookupRequest.set({
      requestId: this.nextRequestId++,
      empleadoId
    });
  }

  private resetScheduleRows(): void {
    const detalles = this.horarioForm.controls.detalles;
    detalles.clear();
    this.buildDefaultScheduleRows().forEach((group) => detalles.push(group));
  }

  private getErrorMessage(error: HttpErrorResponse, fallbackMessage: string): string {
    const apiError = error.error as ApiErrorResponse | null;

    if (apiError?.details?.length) {
      return `${apiError.message}: ${apiError.details.join(', ')}`;
    }

    return apiError?.message ?? fallbackMessage;
  }

  private getToday(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');

    return `${now.getFullYear()}-${month}-${day}`;
  }
}
