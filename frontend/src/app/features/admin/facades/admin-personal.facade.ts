import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { catchError, filter, map, of, startWith, switchMap, timeout } from 'rxjs';
import { ApiErrorResponse } from '../../../shared/models/api/api-error-response';
import { UsuarioResponse } from '../../../shared/models/auth/usuario-response';
import { PageResponse } from '../../../shared/models/common/page-response';
import { EmpleadoResponse } from '../../../shared/models/rrhh/empleado-response';
import { EmpresaContratistaResponse } from '../../../shared/models/rrhh/empresa-contratista-response';
import { RegistrarContratoRequest } from '../../../shared/models/rrhh/registrar-contrato-request';
import { RegistrarEmpleadoRequest } from '../../../shared/models/rrhh/registrar-empleado-request';
import { upsertById } from '../../../shared/utils/collection.utils';
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

@Injectable()
export class AdminPersonalFacade {
  private readonly requestTimeoutMs = 15000;
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminRrhhService = inject(AdminRrhhService);
  private readonly authService = inject(AuthService);
  private nextRequestId = 1;

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
          ),
          startWith<CreateFlowState>({ status: 'loading', requestId: request.requestId }),
          catchError((error: HttpErrorResponse) =>
            of<CreateFlowState>({
              status: 'error',
              requestId: request.requestId,
              message: this.getErrorMessage(
                error,
                'No se pudo completar el alta de empleado y contrato.'
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

  readonly empleadoForm = this.formBuilder.nonNullable.group({
    nombres: ['', [Validators.required]],
    apellidos: ['', [Validators.required]],
    tipoDocumento: ['DNI', [Validators.required]],
    numeroDocumento: ['', [Validators.required]],
    nacionalidad: ['PERUANO', [Validators.required]],
    fechaNacimiento: ['', [Validators.required]],
    estadoCivil: ['SOLTERO', [Validators.required]],
    tieneHijos: ['false', [Validators.required]],
    celularPersonal: ['', [Validators.required]],
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
    idEmpresaContratista: ['']
  });

  readonly contratoForm = this.formBuilder.nonNullable.group({
    puestoTrabajo: ['RECLUTADOR', [Validators.required]],
    regimen: ['PLANILLA', [Validators.required]],
    modalidad: ['FULL_TIME', [Validators.required]],
    seguroSalud: ['ESSALUD'],
    sistemaPensiones: ['ONP'],
    sueldoBase: [1130, [Validators.required, Validators.min(0.01)]],
    fechaInicio: [this.getToday(), [Validators.required]],
    fechaFin: ['']
  });

  readonly currentStep = signal(1);
  readonly submitErrorMessage = signal('');
  readonly creationResult = signal<UsuarioResponse | null>(null);
  readonly employeesPage = signal<PageResponse<EmpleadoResponse> | null>(null);
  readonly isLoadingEmployees = signal(false);
  readonly employeeListErrorMessage = signal('');
  readonly accessByEmployeeId = signal<Record<number, UsuarioResponse | null>>({});
  readonly accessErrorByEmployeeId = signal<Record<number, string>>({});
  readonly accessLoadingByEmployeeId = signal<Record<number, boolean>>({});

  readonly empresasContratistas = toSignal(
    this.adminRrhhService.listarEmpresasContratistas().pipe(
      timeout(this.requestTimeoutMs),
      catchError(() => of<EmpresaContratistaResponse[]>([]))
    ),
    { initialValue: [] as EmpresaContratistaResponse[] }
  );

  readonly isSubmitting = computed(() => this.createFlowState().status === 'loading');
  readonly employeeRows = computed(() => this.employeesPage()?.content ?? []);
  readonly currentPage = computed(() => this.employeesPage()?.page ?? 0);
  readonly totalPages = computed(() => this.employeesPage()?.totalPages ?? 1);

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
        this.creationResult.set(state.usuario);
        this.currentStep.set(3);
        this.insertEmployeeIntoList(state.usuario, state.empleado);
        this.loadEmployees(0, true);
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

  submitPersonalFlow(): void {
    if (this.empleadoForm.invalid) {
      this.currentStep.set(1);
      this.empleadoForm.markAllAsTouched();
      return;
    }

    if (this.contratoForm.invalid) {
      this.contratoForm.markAllAsTouched();
      return;
    }

    this.submitErrorMessage.set('');
    this.creationResult.set(null);
    this.createFlowRequest.set({
      requestId: this.nextRequestId++,
      empleadoRequest: this.buildEmpleadoRequest(),
      contratoRequest: this.buildContratoRequest()
    });
  }

  resetFlow(): void {
    this.currentStep.set(1);
    this.creationResult.set(null);
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
      fechaFin: ''
    });
  }

  loadEmployees(pageNumber = 0, silent = false): void {
    this.employeeListRequest.set({
      requestId: this.nextRequestId++,
      pageNumber,
      silent
    });
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
      parentesco: raw.parentesco ? raw.parentesco : null,
      celularTransferencia: raw.celularTransferencia ? raw.celularTransferencia.trim() : null,
      idEmpresaContratista: raw.idEmpresaContratista ? Number(raw.idEmpresaContratista) : null
    };
  }

  private buildContratoRequest(): RegistrarContratoRequest {
    const raw = this.contratoForm.getRawValue();

    return {
      puestoTrabajo: raw.puestoTrabajo,
      regimen: raw.regimen,
      modalidad: raw.modalidad,
      seguroSalud: raw.seguroSalud ? raw.seguroSalud : null,
      sistemaPensiones: raw.sistemaPensiones ? raw.sistemaPensiones : null,
      sueldoBase: Number(raw.sueldoBase),
      fechaInicio: raw.fechaInicio,
      fechaFin: raw.fechaFin ? raw.fechaFin : null
    };
  }

  private getErrorMessage(error: HttpErrorResponse, fallbackMessage: string): string {
    const apiError = error.error as ApiErrorResponse | null;

    if (apiError?.details?.length) {
      return `${apiError.message}: ${apiError.details.join(', ')}`;
    }

    return apiError?.message ?? fallbackMessage;
  }

  private getToday(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private insertEmployeeIntoList(usuario: UsuarioResponse, empleado: EmpleadoResponse): void {
    const currentPage = this.employeesPage();

    if (!currentPage) {
      return;
    }

    const insertedEmployee: EmpleadoResponse = {
      ...empleado,
      id: usuario.empleadoId,
      estadoOperativo: 'ACTIVO'
    };

    const alreadyExists = currentPage.content.some((item) => item.id === insertedEmployee.id);
    const updatedContent = upsertById(currentPage.content, insertedEmployee, {
      prependIfNew: true
    }).slice(0, currentPage.size);

    this.employeesPage.set({
      ...currentPage,
      totalElements: currentPage.totalElements + (alreadyExists ? 0 : 1),
      content: updatedContent
    });
  }
}
