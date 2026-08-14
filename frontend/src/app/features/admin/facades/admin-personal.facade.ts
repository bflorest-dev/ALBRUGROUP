import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Subscription, catchError, filter, firstValueFrom, map, of, startWith, switchMap, timeout } from 'rxjs';
import { AttendanceRealtimeService } from '../../../core/services/attendance-realtime.service';
import { UsuarioResponse } from '../../../shared/models/auth/usuario-response';
import { PageResponse } from '../../../shared/models/common/page-response';
import { PresenceRealtimeEvent } from '../../../shared/models/gateway/presence-realtime-event';
import { ContratoResponse } from '../../../shared/models/rrhh/contrato-response';
import { EmpleadoResponse } from '../../../shared/models/rrhh/empleado-response';
import { EmpleadoRolResponse } from '../../../shared/models/rrhh/empleado-rol-response';
import { EmpresaContratistaResponse } from '../../../shared/models/rrhh/empresa-contratista-response';
import { RegistrarContratoRequest } from '../../../shared/models/rrhh/registrar-contrato-request';
import { RegistrarEmpleadoRequest } from '../../../shared/models/rrhh/registrar-empleado-request';
import { AttendanceRealtimeEvent } from '../../../shared/models/schedule/attendance-realtime-event';
import { HorarioResponse } from '../../../shared/models/schedule/horario-response';
import { RegistrarHorarioRequest } from '../../../shared/models/schedule/registrar-horario-request';
import { ReemplazarHorarioRequest } from '../../../shared/models/schedule/reemplazar-horario-request';
import { CorregirHorarioRequest } from '../../../shared/models/schedule/corregir-horario-request';
import { RegistrarExcepcionHorarioRequest } from '../../../shared/models/schedule/registrar-excepcion-horario-request';
import { ConnectedUserResponse, PresenceService } from '../../../core/services/presence.service';
import { PresenceRealtimeService } from '../../../core/services/presence-realtime.service';
import { EstadoMonitorResponse } from '../../../shared/models/schedule/cumplimiento-response';
import { AsesorLeadsPendientesResponse } from '../../../shared/models/preventa/preventa.models';
import { formatApiErrorMessage } from '../../../shared/utils/api-error.utils';
import { AuthService } from '../../auth/services/auth.service';
import { LeadRealtimeService } from '../../preventa/services/lead-realtime.service';
import { PreventaLeadService } from '../../preventa/services/preventa-lead.service';
import { AdminEquipoService, EquipoMiembroResponse, EquipoResponse } from '../services/admin-equipo.service';
import { puedeMultiEquipo } from '../../../shared/constants/multi-team-roles';
import { AdminRrhhService } from '../services/admin-rrhh.service';
import { ScheduleAdjustmentService } from '../../../core/services/schedule-adjustment.service';
import {
  AjusteJornadaRequest,
  AjusteJornadaResponse,
  JornadaEfectivaResponse,
  PreviewAjusteJornadaResponse
} from '../../../shared/models/schedule/jornada-efectiva-response';

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

type ScheduleLookupRequest = {
  requestId: number;
  empleadoId: number;
};

type ScheduleLookupState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number; empleadoId: number }
  | { status: 'success'; requestId: number; empleadoId: number; horario: HorarioResponse }
  | { status: 'error'; requestId: number; empleadoId: number; message: string };

type ScheduleRule = {
  totalMinutes: number;
  lunchMinutes: number;
  requiresLunch: boolean;
  defaultStart: string;
  defaultEnd: string;
  defaultLunchStart: string;
  defaultLunchEnd: string;
  durationLabel: string;
};

type ScheduleRuleError = {
  message: string;
  simpleFields?: string[];
  rowErrors?: Array<{ index: number; fields: string[] }>;
};

export type PersonalReviewSummary = {
  nombreCompleto: string;
  numeroDocumento: string;
  correoPersonal: string;
  rolAsignado: string;
};

@Injectable()
export class AdminPersonalFacade implements OnDestroy {
  private readonly requestTimeoutMs = 15000;
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminRrhhService = inject(AdminRrhhService);
  private readonly adminEquipoService = inject(AdminEquipoService);
  private readonly scheduleAdjustmentService = inject(ScheduleAdjustmentService);
  private readonly authService = inject(AuthService);
  private readonly presenceService = inject(PresenceService);
  private readonly attendanceRealtimeService = inject(AttendanceRealtimeService);
  private readonly presenceRealtimeService = inject(PresenceRealtimeService);
  private readonly leadRealtimeService = inject(LeadRealtimeService);
  private readonly preventaLeadService = inject(PreventaLeadService);
  private readonly realtimeSubscription = new Subscription();
  private realtimeStarted = false;
  private readonly modalidadesSinAlmuerzo = new Set(['PART_TIME', 'SEMI_FULL']);
  private readonly scheduleRules: Record<string, ScheduleRule> = {
    PART_TIME: {
      totalMinutes: 240,
      lunchMinutes: 0,
      requiresLunch: false,
      defaultStart: '09:00',
      defaultEnd: '13:00',
      defaultLunchStart: '',
      defaultLunchEnd: '',
      durationLabel: '4 horas'
    },
    SEMI_FULL: {
      totalMinutes: 360,
      lunchMinutes: 0,
      requiresLunch: false,
      defaultStart: '09:00',
      defaultEnd: '15:00',
      defaultLunchStart: '',
      defaultLunchEnd: '',
      durationLabel: '6 horas'
    },
    FULL_TIME: {
      totalMinutes: 540,
      lunchMinutes: 60,
      requiresLunch: true,
      defaultStart: '09:00',
      defaultEnd: '18:00',
      defaultLunchStart: '13:00',
      defaultLunchEnd: '14:00',
      durationLabel: '9 horas'
    },
    SUPER_FULL: {
      totalMinutes: 600,
      lunchMinutes: 60,
      requiresLunch: true,
      defaultStart: '09:00',
      defaultEnd: '19:00',
      defaultLunchStart: '13:00',
      defaultLunchEnd: '14:00',
      durationLabel: '10 horas'
    }
  };
  private nextRequestId = 1;
  private handledCreateFlowRequestId = 0;

  private readonly employeeListRequest = signal<EmployeeListRequest | null>(null);
  private readonly createFlowRequest = signal<CreateFlowRequest | null>(null);
  private readonly accessLookupRequest = signal<AccessLookupRequest | null>(null);
  private readonly scheduleLookupRequest = signal<ScheduleLookupRequest | null>(null);

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

  private readonly scheduleLookupState = toSignal(
    toObservable(this.scheduleLookupRequest).pipe(
      filter((request): request is ScheduleLookupRequest => request !== null),
      switchMap((request) =>
        this.adminRrhhService.getHorarioVigente(request.empleadoId, this.getToday()).pipe(
          timeout(this.requestTimeoutMs),
          map(
            (horario): ScheduleLookupState => ({
              status: 'success',
              requestId: request.requestId,
              empleadoId: request.empleadoId,
              horario
            })
          ),
          startWith<ScheduleLookupState>({
            status: 'loading',
            requestId: request.requestId,
            empleadoId: request.empleadoId
          }),
          catchError((error: HttpErrorResponse) =>
            of<ScheduleLookupState>({
              status: 'error',
              requestId: request.requestId,
              empleadoId: request.empleadoId,
              message: this.getErrorMessage(error, 'No se pudo consultar el horario vigente del empleado.')
            })
          )
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  readonly tieneHijosOptions = [
    { label: 'No', value: 'false' },
    { label: 'Sí', value: 'true' }
  ];

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
    }
  );

  readonly editDatosPersonalesForm = this.formBuilder.nonNullable.group({
    nombres: ['', [Validators.required]],
    apellidos: ['', [Validators.required]],
    tipoDocumento: ['DNI', [Validators.required]],
    numeroDocumento: ['', [Validators.required]],
    nacionalidad: ['PERUANO', [Validators.required]],
    fechaNacimiento: ['', [Validators.required]],
    estadoCivil: ['SOLTERO', [Validators.required]],
    tieneHijos: ['false', [Validators.required]]
  });

  readonly editDialogVisible = signal(false);
  readonly editTargetEmpleadoId = signal<number | null>(null);
  readonly isLoadingEditData = signal(false);
  readonly isSubmittingEdit = signal(false);
  readonly editErrorMessage = signal('');
  readonly employeeStateById = signal<Record<number, EstadoMonitorResponse>>({});
  readonly connectedUserById = signal<Record<number, ConnectedUserResponse>>({});
  readonly assignedLeadCountByEmployeeId = signal<Record<number, number>>({});
  readonly isLoadingStates = signal(false);

  readonly currentStep = signal(1);
  readonly submitErrorMessage = signal('');
  readonly creationResult = signal<UsuarioResponse | null>(null);
  readonly isPersonalReviewVisible = signal(false);
  readonly isContractRenewalVisible = signal(false);
  readonly employeesPage = signal<PageResponse<EmpleadoResponse> | null>(null);
  readonly isLoadingEmployees = signal(false);
  readonly employeeListErrorMessage = signal('');
  readonly inactiveEmployeesPage = signal<PageResponse<EmpleadoResponse> | null>(null);
  readonly isLoadingInactiveEmployees = signal(false);
  readonly inactiveEmployeeListErrorMessage = signal('');
  readonly activeEmployees = signal<EmpleadoRolResponse[]>([]);
  readonly isLoadingActiveEmployees = signal(false);
  readonly activeEmployeeListErrorMessage = signal('');
  // Vista COLABORADORES: una sola categoria a la vez (equipo-{id} | sin-equipo | inactivos).
  readonly activeCategoriaKey = signal<string | null>(null);
  readonly activeCategoriaTitle = signal('');
  // Cache por categoria de empleados activos; volver a una ya vista es inmediato.
  private readonly categoryCache = new Map<string, EmpleadoRolResponse[]>();
  readonly operationalTeams = signal<EquipoResponse[]>([]);
  readonly teamNameByEmployeeId = signal<Record<number, string>>({});
  readonly teamIdByEmployeeId = signal<Record<number, number>>({});
  // Todos los equipos de cada empleado (para roles multi-equipo como ASESOR_VENTAS).
  readonly teamIdsByEmployeeId = signal<Record<number, number[]>>({});
  readonly isLoadingTeams = signal(false);
  readonly teamErrorMessage = signal('');
  readonly isTeamChangeVisible = signal(false);
  readonly selectedEmployeeForTeamChange = signal<EmpleadoRolResponse | null>(null);
  readonly teamChangeSelectedId = signal(0);
  // Selección multi-equipo (solo para roles que lo admiten); el caso común usa teamChangeSelectedId.
  readonly teamChangeSelectedIds = signal<number[]>([]);
  readonly isSavingTeamChange = signal(false);
  readonly teamChangeErrorMessage = signal('');
  readonly teamChangeSuccessMessage = signal('');
  readonly teamChangeOptions = computed(() => [
    { label: 'Sin equipo', value: 0 },
    ...this.operationalTeams().map((team) => ({ label: team.nombre, value: team.id }))
  ]);
  // Opciones para el multi-select (sin la opción "Sin equipo": vaciar la selección equivale a ninguno).
  readonly teamChangeMultiOptions = computed(() =>
    this.operationalTeams().map((team) => ({ label: team.nombre, value: team.id }))
  );
  // El empleado en edición puede pertenecer a varios equipos (gateado por su puesto).
  readonly canMultiTeam = computed(() => puedeMultiEquipo(this.selectedEmployeeForTeamChange()?.puestoTrabajo));
  readonly accessByEmployeeId = signal<Record<number, UsuarioResponse | null>>({});
  readonly accessErrorByEmployeeId = signal<Record<number, string>>({});
  readonly accessLoadingByEmployeeId = signal<Record<number, boolean>>({});
  readonly scheduleByEmployeeId = signal<Record<number, HorarioResponse | null>>({});
  readonly scheduleErrorByEmployeeId = signal<Record<number, string>>({});
  readonly scheduleLoadingByEmployeeId = signal<Record<number, boolean>>({});
  readonly selectedEmployeeForContractRenewal = signal<EmpleadoRolResponse | null>(null);
  readonly currentContractForRenewal = signal<ContratoResponse | null>(null);
  readonly isLoadingContractRenewal = signal(false);
  readonly isSubmittingContractRenewal = signal(false);
  readonly contractRenewalErrorMessage = signal('');
  readonly contractRenewalSuccessMessage = signal('');
  readonly isScheduleChangeVisible = signal(false);
  readonly selectedEmployeeForScheduleChange = signal<EmpleadoRolResponse | null>(null);
  readonly currentScheduleForChange = signal<HorarioResponse | null>(null);
  readonly currentContractForScheduleChange = signal<ContratoResponse | null>(null);
  readonly isLoadingScheduleChange = signal(false);
  readonly isSubmittingScheduleChange = signal(false);
  readonly scheduleChangeErrorMessage = signal('');
  readonly scheduleChangeSuccessMessage = signal('');
  readonly todayWorkdayEnabled = signal(false);
  readonly isAdjustmentDialogVisible = signal(false);
  readonly adjustmentDate = signal('');
  readonly adjustmentJornada = signal<JornadaEfectivaResponse | null>(null);
  readonly adjustmentPreview = signal<PreviewAjusteJornadaResponse | null>(null);
  readonly adjustmentHistory = signal<AjusteJornadaResponse[]>([]);
  readonly isLoadingAdjustment = signal(false);
  readonly isSavingAdjustment = signal(false);
  readonly adjustmentError = signal<string | null>(null);
  readonly adjustmentEmployeeName = computed(
    () => {
      const employee = this.selectedEmployeeForScheduleChange();
      return employee ? `${employee.nombres} ${employee.apellidos}`.trim() : '';
    }
  );
  readonly isTodayRestDay = computed(() => {
    if (this.todayWorkdayEnabled()) {
      return false;
    }

    const horario = this.currentScheduleForChange();
    const todayDay = this.getTodayScheduleDay();
    return horario?.detalles.some((detalle) => detalle.dia === todayDay && !detalle.laborable) ?? false;
  });
  /** Sub-dialogo que aparece cuando el horario ya tiene marcaciones reales y
   *  el PATCH devuelve 409. Pregunta al admin como aplicar el cambio. */
  readonly isCorrectionDecisionVisible = signal(false);
  readonly correctionDecisionMotivo = signal('Correccion administrativa');
  readonly correctionDecisionCustomDate = signal('');
  readonly isApplyingCorrectionDecision = signal(false);
  readonly isDismissingEmployeeId = signal<number | null>(null);
  readonly bajaErrorMessage = signal('');
  readonly bajaSuccessMessage = signal('');

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
  private readonly modalidadValue = toSignal(
    this.contratoForm.controls.modalidad.valueChanges.pipe(startWith(this.contratoForm.controls.modalidad.getRawValue())),
    { initialValue: this.contratoForm.controls.modalidad.getRawValue() }
  );
  private readonly contractRenewalModalidadValue = toSignal(
    this.contractRenewalForm.controls.modalidad.valueChanges.pipe(
      startWith(this.contractRenewalForm.controls.modalidad.getRawValue())
    ),
    { initialValue: this.contractRenewalForm.controls.modalidad.getRawValue() }
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
      const modalidad = this.modalidadValue();

      untracked(() => {
        this.applySchedulePresetForModalidad(modalidad);
        this.syncLunchBreakControls();
        this.horarioForm.updateValueAndValidity({ emitEvent: false });
      });
    });

    effect(() => {
      const modalidad = this.contractRenewalModalidadValue();

      if (!this.isContractRenewalVisible()) {
        return;
      }

      untracked(() => {
        this.applySchedulePresetForModalidad(modalidad);
        this.syncLunchBreakControls();
        this.horarioForm.updateValueAndValidity({ emitEvent: false });
      });
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

    effect(() => {
      const state = this.scheduleLookupState();

      if (state.status === 'loading') {
        this.scheduleLoadingByEmployeeId.update((current) => ({
          ...current,
          [state.empleadoId]: true
        }));
        this.scheduleErrorByEmployeeId.update((current) => ({
          ...current,
          [state.empleadoId]: ''
        }));
        return;
      }

      if (state.status === 'success') {
        this.scheduleLoadingByEmployeeId.update((current) => ({
          ...current,
          [state.empleadoId]: false
        }));
        this.scheduleByEmployeeId.update((current) => ({
          ...current,
          [state.empleadoId]: state.horario
        }));
        return;
      }

      if (state.status === 'error') {
        this.scheduleLoadingByEmployeeId.update((current) => ({
          ...current,
          [state.empleadoId]: false
        }));
        this.scheduleByEmployeeId.update((current) => ({
          ...current,
          [state.empleadoId]: null
        }));
        this.scheduleErrorByEmployeeId.update((current) => ({
          ...current,
          [state.empleadoId]: state.message
        }));
      }
    });
  }

  initialize(): void {
    this.loadEmployees();
    void this.loadActiveEmployees();
    void this.loadOperationalTeams();
    void this.loadInactiveEmployees();
    this.startRealtime();
  }

  ngOnDestroy(): void {
    this.realtimeSubscription.unsubscribe();
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
    this.applySchedulePresetForModalidad(this.contratoForm.controls.modalidad.getRawValue(), true);
    this.syncLunchBreakControls();
    this.horarioForm.updateValueAndValidity({ emitEvent: false });
  }

  async openEditDialog(employee: EmpleadoRolResponse): Promise<void> {
    this.editTargetEmpleadoId.set(employee.idEmpleado);
    this.editErrorMessage.set('');
    this.editDatosPersonalesForm.reset({
      nombres: '',
      apellidos: '',
      tipoDocumento: 'DNI',
      numeroDocumento: '',
      nacionalidad: 'PERUANO',
      fechaNacimiento: '',
      estadoCivil: 'SOLTERO',
      tieneHijos: 'false'
    });
    this.editDialogVisible.set(true);
    this.isLoadingEditData.set(true);

    try {
      const empleado = await firstValueFrom(
        this.adminRrhhService
          .getEmpleadoPorDocumento(employee.numeroDocumento)
          .pipe(timeout(this.requestTimeoutMs))
      );
      this.editDatosPersonalesForm.patchValue({
        nombres: empleado.nombres,
        apellidos: empleado.apellidos,
        tipoDocumento: empleado.tipoDocumento,
        numeroDocumento: empleado.numeroDocumento,
        nacionalidad: empleado.nacionalidad,
        fechaNacimiento: empleado.fechaNacimiento,
        estadoCivil: empleado.estadoCivil,
        tieneHijos: empleado.tieneHijos ? 'true' : 'false'
      });
    } catch (error) {
      this.editErrorMessage.set(
        this.getErrorMessage(error as HttpErrorResponse, 'No se pudo cargar los datos del empleado.')
      );
    } finally {
      this.isLoadingEditData.set(false);
    }
  }

  closeEditDialog(): void {
    this.editDialogVisible.set(false);
    this.editTargetEmpleadoId.set(null);
    this.editErrorMessage.set('');
    this.editDatosPersonalesForm.reset();
  }

  async submitDatosPersonales(): Promise<void> {
    const empleadoId = this.editTargetEmpleadoId();
    if (!empleadoId) return;

    if (this.editDatosPersonalesForm.invalid) {
      this.editDatosPersonalesForm.markAllAsTouched();
      return;
    }

    const raw = this.editDatosPersonalesForm.getRawValue();
    this.editErrorMessage.set('');
    this.isSubmittingEdit.set(true);

    try {
      await firstValueFrom(
        this.adminRrhhService
          .actualizarDatosPersonales(empleadoId, {
            nombres: raw.nombres.trim(),
            apellidos: raw.apellidos.trim(),
            tipoDocumento: raw.tipoDocumento,
            numeroDocumento: raw.numeroDocumento.trim(),
            nacionalidad: raw.nacionalidad,
            fechaNacimiento: raw.fechaNacimiento,
            estadoCivil: raw.estadoCivil,
            tieneHijos: raw.tieneHijos === 'true'
          })
          .pipe(timeout(this.requestTimeoutMs))
      );

      this.closeEditDialog();
      void this.reloadCurrentCategory();
      this.refreshUserAccess(empleadoId);
    } catch (error) {
      this.editErrorMessage.set(
        this.getErrorMessage(error as HttpErrorResponse, 'No se pudo actualizar los datos personales.')
      );
    } finally {
      this.isSubmittingEdit.set(false);
    }
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
      void this.loadEmployeeStates();
      void this.loadAssignedLeadCounts();
    } catch (error) {
      this.activeEmployeeListErrorMessage.set(
        this.getErrorMessage(error as HttpErrorResponse, 'No fue posible cargar empleados activos.')
      );
    } finally {
      this.isLoadingActiveEmployees.set(false);
    }
  }

  /**
   * Arranque de la vista COLABORADORES: solo realtime + catalogo ligero de
   * equipos (para resolver nombres). NO carga a todos los empleados: cada
   * categoria se pide bajo demanda con `selectCategoria`.
   */
  async initializeColaboradores(): Promise<void> {
    this.startRealtime();
    await this.ensureTeamsCatalog();
  }

  /** Lista ligera de equipos activos (id + nombre), sin miembros. Idempotente. */
  async ensureTeamsCatalog(): Promise<void> {
    if (this.operationalTeams().length) {
      return;
    }
    try {
      const teams = await firstValueFrom(
        this.adminEquipoService.listarEquipos().pipe(timeout(this.requestTimeoutMs))
      );
      this.operationalTeams.set(
        teams.filter((team) => team.activo).sort((left, right) => left.nombre.localeCompare(right.nombre))
      );
    } catch {
      // Silencioso: el submenu del sidebar tiene su propia fuente de equipos.
    }
  }

  /** Carga la categoria indicada (equipo-{id} | sin-equipo | inactivos). */
  async selectCategoria(rawKey: string | null): Promise<void> {
    this.activeCategoriaKey.set(rawKey);

    if (!rawKey) {
      return;
    }

    if (rawKey === 'inactivos') {
      this.activeCategoriaTitle.set('Inactivos');
      await this.loadInactiveEmployees();
      return;
    }

    if (rawKey === 'sin-equipo') {
      this.activeCategoriaTitle.set('Sin equipo');
      await this.loadSinEquipoCategory();
      return;
    }

    const match = /^equipo-(\d+)$/.exec(rawKey);
    if (match) {
      const teamId = Number(match[1]);
      await this.ensureTeamsCatalog();
      const teamName = this.operationalTeams().find((team) => team.id === teamId)?.nombre ?? 'Equipo';
      this.activeCategoriaTitle.set(teamName);
      await this.loadTeamCategory(teamId, teamName);
      return;
    }

    // Clave desconocida: vista vacia controlada.
    this.activeCategoriaTitle.set('');
    this.activeEmployees.set([]);
  }

  /** Recarga la categoria activa ignorando cache (tras una mutacion). */
  async reloadCurrentCategory(): Promise<void> {
    const key = this.activeCategoriaKey();
    if (!key) {
      return;
    }
    this.categoryCache.delete(key);
    await this.selectCategoria(key);
  }

  private invalidateCategoryCache(): void {
    this.categoryCache.clear();
  }

  private async loadTeamCategory(teamId: number, teamName: string): Promise<void> {
    const key = `equipo-${teamId}`;
    const cached = this.categoryCache.get(key);
    if (cached) {
      this.applyCategoryEmployees(cached, teamName, [teamId]);
      return;
    }

    this.isLoadingActiveEmployees.set(true);
    this.activeEmployeeListErrorMessage.set('');
    try {
      const miembros = await firstValueFrom(
        this.adminEquipoService.listarMiembros(teamId).pipe(timeout(this.requestTimeoutMs))
      );
      const ids = miembros.map((miembro) => miembro.empleadoId);
      const empleados = ids.length
        ? await firstValueFrom(
            this.adminRrhhService.listarEmpleadosLight(ids).pipe(timeout(this.requestTimeoutMs))
          )
        : [];
      this.categoryCache.set(key, empleados);
      this.applyCategoryEmployees(empleados, teamName, [teamId]);
    } catch (error) {
      this.activeEmployees.set([]);
      this.activeEmployeeListErrorMessage.set(
        this.getErrorMessage(error as HttpErrorResponse, 'No fue posible cargar el equipo.')
      );
    } finally {
      this.isLoadingActiveEmployees.set(false);
    }
  }

  private async loadSinEquipoCategory(): Promise<void> {
    const key = 'sin-equipo';
    const cached = this.categoryCache.get(key);
    if (cached) {
      this.applyCategoryEmployees(cached, 'Sin equipo asignado', []);
      return;
    }

    this.isLoadingActiveEmployees.set(true);
    this.activeEmployeeListErrorMessage.set('');
    try {
      await this.ensureTeamsCatalog();
      const teams = this.operationalTeams();
      const all = await firstValueFrom(
        this.adminRrhhService.listarEmpleadosLight().pipe(timeout(this.requestTimeoutMs))
      );
      const memberLists = await Promise.all(
        teams.map((team) =>
          firstValueFrom(
            this.adminEquipoService.listarMiembros(team.id).pipe(
              timeout(this.requestTimeoutMs),
              catchError(() => of<EquipoMiembroResponse[]>([]))
            )
          )
        )
      );
      const asignados = new Set<number>();
      for (const list of memberLists) {
        for (const miembro of list) {
          asignados.add(miembro.empleadoId);
        }
      }
      const sinEquipo = all.filter((empleado) => !asignados.has(empleado.idEmpleado));
      this.categoryCache.set(key, sinEquipo);
      this.applyCategoryEmployees(sinEquipo, 'Sin equipo asignado', []);
    } catch (error) {
      this.activeEmployees.set([]);
      this.activeEmployeeListErrorMessage.set(
        this.getErrorMessage(error as HttpErrorResponse, 'No fue posible cargar el personal sin equipo.')
      );
    } finally {
      this.isLoadingActiveEmployees.set(false);
    }
  }

  /** Aplica los empleados de una categoria a los signals que consume el panel. */
  private applyCategoryEmployees(
    empleados: EmpleadoRolResponse[],
    teamName: string,
    teamIds: number[]
  ): void {
    this.activeEmployees.set(empleados);

    const nameByEmployeeId: Record<number, string> = {};
    const idsByEmployeeId: Record<number, number[]> = {};
    const idByEmployeeId: Record<number, number> = {};
    for (const empleado of empleados) {
      nameByEmployeeId[empleado.idEmpleado] = teamName;
      idsByEmployeeId[empleado.idEmpleado] = [...teamIds];
      if (teamIds.length) {
        idByEmployeeId[empleado.idEmpleado] = teamIds[0];
      }
    }
    this.teamNameByEmployeeId.set(nameByEmployeeId);
    this.teamIdsByEmployeeId.set(idsByEmployeeId);
    this.teamIdByEmployeeId.set(idByEmployeeId);

    void this.loadEmployeeStates();
    void this.loadAssignedLeadCounts();
  }

  async loadOperationalTeams(): Promise<void> {
    this.isLoadingTeams.set(true);
    this.teamErrorMessage.set('');

    try {
      const teams = await firstValueFrom(
        this.adminEquipoService.listarEquipos().pipe(timeout(this.requestTimeoutMs))
      );
      const activeTeams = teams.filter((team) => team.activo);
      this.operationalTeams.set(activeTeams);
      const membersByTeam = await Promise.all(
        activeTeams.map(async (team) => ({
          team,
          members: await firstValueFrom(
            this.adminEquipoService.listarMiembros(team.id).pipe(
              timeout(this.requestTimeoutMs),
              catchError(() => of<EquipoMiembroResponse[]>([]))
            )
          )
        }))
      );

      // Un empleado puede estar en varios equipos: acumulamos todos sus equipos (no "último gana").
      const namesByEmployeeId: Record<number, string[]> = {};
      const teamIdsByEmployeeId: Record<number, number[]> = {};
      for (const item of membersByTeam) {
        for (const member of item.members) {
          (namesByEmployeeId[member.empleadoId] ??= []).push(item.team.nombre);
          (teamIdsByEmployeeId[member.empleadoId] ??= []).push(item.team.id);
        }
      }

      const teamNameByEmployeeId: Record<number, string> = {};
      const teamIdByEmployeeId: Record<number, number> = {};
      for (const [empId, names] of Object.entries(namesByEmployeeId)) {
        teamNameByEmployeeId[Number(empId)] = names.join(', ');
      }
      for (const [empId, ids] of Object.entries(teamIdsByEmployeeId)) {
        teamIdByEmployeeId[Number(empId)] = ids[0];
      }

      this.teamNameByEmployeeId.set(teamNameByEmployeeId);
      this.teamIdByEmployeeId.set(teamIdByEmployeeId);
      this.teamIdsByEmployeeId.set(teamIdsByEmployeeId);
    } catch {
      this.operationalTeams.set([]);
      this.teamNameByEmployeeId.set({});
      this.teamIdByEmployeeId.set({});
      this.teamIdsByEmployeeId.set({});
      this.teamErrorMessage.set('No se pudieron cargar los equipos. El personal se mostrara sin agrupar por ahora.');
    } finally {
      this.isLoadingTeams.set(false);
    }
  }

  openTeamChange(employee: EmpleadoRolResponse): void {
    this.selectedEmployeeForTeamChange.set(employee);
    const equiposActuales = this.teamIdsByEmployeeId()[employee.idEmpleado] ?? [];
    // Precarga: el caso común (un equipo) usa el select simple; el multi-equipo usa el multi-select.
    this.teamChangeSelectedId.set(equiposActuales[0] ?? 0);
    this.teamChangeSelectedIds.set([...equiposActuales]);
    this.teamChangeErrorMessage.set('');
    this.teamChangeSuccessMessage.set('');
    this.isTeamChangeVisible.set(true);

    if (!this.operationalTeams().length && !this.isLoadingTeams()) {
      void this.loadOperationalTeams();
    }
  }

  closeTeamChange(): void {
    if (this.isSavingTeamChange()) {
      return;
    }
    this.isTeamChangeVisible.set(false);
    this.selectedEmployeeForTeamChange.set(null);
    this.teamChangeSelectedId.set(0);
    this.teamChangeSelectedIds.set([]);
    this.teamChangeErrorMessage.set('');
  }

  setTeamChangeSelectedId(value: number | null): void {
    this.teamChangeSelectedId.set(value ?? 0);
  }

  setTeamChangeSelectedIds(value: number[] | null): void {
    this.teamChangeSelectedIds.set(value ?? []);
  }

  async saveTeamChange(): Promise<void> {
    const employee = this.selectedEmployeeForTeamChange();
    if (!employee) {
      return;
    }

    this.isSavingTeamChange.set(true);
    this.teamChangeErrorMessage.set('');
    this.teamChangeSuccessMessage.set('');

    // Multi-equipo (ASESOR_VENTAS): el set completo elegido. Caso común: 0 o 1 equipo.
    const selectedTeamId = this.teamChangeSelectedId();
    const nextTeamIds = this.canMultiTeam()
      ? [...new Set(this.teamChangeSelectedIds())]
      : selectedTeamId > 0
        ? [selectedTeamId]
        : [];

    try {
      await firstValueFrom(
        this.adminEquipoService
          .asignarEquiposAEmpleado(employee.idEmpleado, nextTeamIds)
          .pipe(timeout(this.requestTimeoutMs))
      );
      this.teamChangeSuccessMessage.set(
        'Equipo actualizado. Si el empleado ya estaba conectado, vera el cambio al renovar su sesion.'
      );
      this.isTeamChangeVisible.set(false);
      this.selectedEmployeeForTeamChange.set(null);
      // La membresia cambio: invalida todas las categorias y recarga la visible.
      this.invalidateCategoryCache();
      void this.reloadCurrentCategory();
    } catch (error) {
      this.teamChangeErrorMessage.set(
        this.getErrorMessage(error as HttpErrorResponse, 'No se pudo actualizar el equipo del empleado.')
      );
    } finally {
      this.isSavingTeamChange.set(false);
    }
  }

  async loadInactiveEmployees(): Promise<void> {
    this.isLoadingInactiveEmployees.set(true);
    this.inactiveEmployeeListErrorMessage.set('');

    try {
      const page = await firstValueFrom(
        this.adminRrhhService.getEmpleados(0, 8, 'INACTIVO').pipe(timeout(this.requestTimeoutMs))
      );
      this.inactiveEmployeesPage.set(page);
    } catch (error) {
      this.inactiveEmployeeListErrorMessage.set(
        this.getErrorMessage(error as HttpErrorResponse, 'No fue posible cargar empleados inactivos.')
      );
    } finally {
      this.isLoadingInactiveEmployees.set(false);
    }
  }

  async loadEmployeeStates(): Promise<void> {
    const employees = this.activeEmployees();
    if (!employees.length) return;

    const ids = employees.map((e) => e.idEmpleado);
    const today = this.getToday();

    this.isLoadingStates.set(true);
    try {
      const [estados, connected] = await Promise.all([
        firstValueFrom(
          this.adminRrhhService.getEstadosMonitorEmpleados(ids, today).pipe(timeout(this.requestTimeoutMs))
        ),
        firstValueFrom(
          this.presenceService
            .listarUsuariosConectados()
            .pipe(timeout(this.requestTimeoutMs), catchError(() => of([] as ConnectedUserResponse[])))
        )
      ]);

      const stateMap: Record<number, EstadoMonitorResponse> = {};
      for (const e of estados) stateMap[e.idEmpleado] = e;
      this.employeeStateById.set(stateMap);

      const connectedMap: Record<number, ConnectedUserResponse> = {};
      for (const c of connected) connectedMap[c.empleadoId] = c;
      this.connectedUserById.set(connectedMap);
    } catch {
      // falla silenciosa: los chips de estado aparecen como "Sin registro"
    } finally {
      this.isLoadingStates.set(false);
    }
  }

  async loadAssignedLeadCounts(): Promise<void> {
    try {
      const grupos = await firstValueFrom(
        this.preventaLeadService.listarLeadsPendientesPorAsesor().pipe(
          timeout(this.requestTimeoutMs),
          catchError(() => of([] as AsesorLeadsPendientesResponse[]))
        )
      );
      const counts: Record<number, number> = {};
      for (const grupo of grupos) {
        if (grupo.idAsesor && grupo.total > 0) {
          counts[grupo.idAsesor] = grupo.total;
        }
      }
      this.assignedLeadCountByEmployeeId.set(counts);
    } catch {
      // El contador es un apoyo visual: si falla, conservamos la vista principal sin bloquear Admin.
    }
  }

  private startRealtime(): void {
    if (this.realtimeStarted) {
      return;
    }

    this.realtimeStarted = true;
    this.realtimeSubscription.add(
      this.attendanceRealtimeService.watchTopic('/topic/asistencia/monitor').subscribe({
        next: (event) => this.applyAttendanceRealtimeEvent(event),
        error: () => undefined
      })
    );

    this.realtimeSubscription.add(
      this.presenceRealtimeService.watchAll().subscribe({
        next: (event) => this.applyPresenceRealtimeEvent(event),
        error: () => undefined
      })
    );

    this.realtimeSubscription.add(
      this.leadRealtimeService.watchTopic('/topic/leads/etapa/PREVENTA').subscribe({
        next: (event) => {
          if (
            [
              'REGISTRO',
              'REGISTRO_MASIVO',
              'ASIGNACION',
              'CONTACTO',
              'GESTION_INICIADA',
              'TIPIFICACION',
              'ATENCION_CERRADA',
              'ELIMINACION'
            ].includes(event.tipo)
          ) {
            void this.loadAssignedLeadCounts();
          }
        },
        error: () => undefined
      })
    );
  }

  private applyAttendanceRealtimeEvent(event: AttendanceRealtimeEvent): void {
    if (event.fecha !== this.getToday() || !this.isActiveEmployeeVisible(event.idEmpleado)) {
      return;
    }

    const nextState: EstadoMonitorResponse = {
      idEmpleado: event.idEmpleado,
      fecha: event.fecha,
      tieneHorarioVigente: event.tieneHorarioVigente ?? false,
      laborableHoy: event.laborableHoy ?? false,
      esperadoHoy: event.esperadoHoy ?? false,
      tieneRegistroHoy: event.estadoActual !== null && event.estadoActual !== undefined,
      estadoActual: event.estadoActual ?? null,
      operativo: event.operativo ?? false,
      desde: event.desde ?? null
    };

    this.employeeStateById.update((current) => ({
      ...current,
      [event.idEmpleado]: nextState
    }));
  }

  private applyPresenceRealtimeEvent(event: PresenceRealtimeEvent): void {
    if (!this.isActiveEmployeeVisible(event.empleadoId)) {
      return;
    }

    this.connectedUserById.update((current) => {
      if (event.tipo === 'PRESENCE_OFFLINE' || event.tipo === 'PRESENCE_EXPIRED') {
        const next = { ...current };
        delete next[event.empleadoId];
        return next;
      }

      const employee = this.activeEmployees().find((item) => item.idEmpleado === event.empleadoId);
      const existing = current[event.empleadoId];
      const nextUser: ConnectedUserResponse = {
        empleadoId: event.empleadoId,
        nombreCompleto: event.nombreCompleto || existing?.nombreCompleto || this.resolveEmployeeFullName(employee),
        roles: event.roles?.length ? event.roles : existing?.roles ?? (employee ? [employee.puestoTrabajo] : []),
        status: 'ONLINE',
        disponibilidad: event.disponibilidad ?? existing?.disponibilidad ?? null,
        lastSeen: event.lastSeen ?? event.occurredAt ?? existing?.lastSeen ?? null
      };

      return {
        ...current,
        [event.empleadoId]: nextUser
      };
    });
  }

  private isActiveEmployeeVisible(empleadoId: number): boolean {
    return this.activeEmployees().some((employee) => employee.idEmpleado === empleadoId);
  }

  private resolveEmployeeFullName(employee: EmpleadoRolResponse | undefined): string {
    if (!employee) {
      return '';
    }

    return `${employee.nombres ?? ''} ${employee.apellidos ?? ''}`.trim();
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
      this.scheduleByEmployeeId.update((current) => {
        const next = { ...current };
        delete next[empleadoId];
        return next;
      });
      this.scheduleErrorByEmployeeId.update((current) => {
        const next = { ...current };
        delete next[empleadoId];
        return next;
      });
      this.scheduleLoadingByEmployeeId.update((current) => {
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
    this.scheduleLookupRequest.set({
      requestId: this.nextRequestId++,
      empleadoId
    });
  }

  async darDeBajaEmpleado(employee: EmpleadoRolResponse): Promise<void> {
    this.isDismissingEmployeeId.set(employee.idEmpleado);
    this.bajaErrorMessage.set('');
    this.bajaSuccessMessage.set('');

    try {
      await firstValueFrom(
        this.adminRrhhService.darDeBaja(employee.idEmpleado).pipe(timeout(this.requestTimeoutMs))
      );
      this.bajaSuccessMessage.set(`${employee.nombres} ${employee.apellidos} ha sido dado de baja correctamente.`);
      this.loadEmployees(0, true);
      this.invalidateCategoryCache();
      void this.loadInactiveEmployees();
      void this.reloadCurrentCategory();
    } catch (error) {
      this.bajaErrorMessage.set(
        this.getErrorMessage(error as HttpErrorResponse, 'No se pudo completar la baja. Intenta de nuevo.')
      );
    } finally {
      this.isDismissingEmployeeId.set(null);
    }
  }

  async openContractRenewal(employee: EmpleadoRolResponse, loadCurrentContract = true): Promise<void> {
    this.selectedEmployeeForContractRenewal.set(employee);
    this.currentContractForRenewal.set(null);
    this.contractRenewalErrorMessage.set('');
    this.contractRenewalSuccessMessage.set('');
    this.isContractRenewalVisible.set(true);
    this.isLoadingContractRenewal.set(loadCurrentContract);
    this.resetContractRenewalForm();
    this.resetContractRenewalScheduleForm();

    if (!loadCurrentContract) {
      return;
    }

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

  async openContractRenewalFromInactive(employee: EmpleadoResponse): Promise<void> {
    await this.openContractRenewal(
      {
        idEmpleado: employee.id,
        nombres: employee.nombres,
        apellidos: employee.apellidos,
        numeroDocumento: employee.numeroDocumento,
        celularPersonal: employee.celularPersonal,
        correoPersonal: employee.correoPersonal,
        puestoTrabajo: 'SIN_CONTRATO'
      },
      false
    );
  }

  async openScheduleChange(employee: EmpleadoRolResponse): Promise<void> {
    this.selectedEmployeeForScheduleChange.set(employee);
    this.currentScheduleForChange.set(null);
    this.currentContractForScheduleChange.set(null);
    this.scheduleChangeErrorMessage.set('');
    this.scheduleChangeSuccessMessage.set('');
    this.isScheduleChangeVisible.set(true);
    this.isLoadingScheduleChange.set(true);

    try {
      const [horario, contrato] = await Promise.all([
        firstValueFrom(this.adminRrhhService.getHorarioVigente(employee.idEmpleado, this.getToday()).pipe(timeout(this.requestTimeoutMs))),
        firstValueFrom(this.adminRrhhService.getContratoVigente(employee.idEmpleado).pipe(timeout(this.requestTimeoutMs)))
      ]);

      this.currentScheduleForChange.set(horario);
      this.currentContractForScheduleChange.set(contrato);
      this.todayWorkdayEnabled.set(
        horario.excepciones?.some(
          (excepcion) => excepcion.fecha === this.getToday() && excepcion.laborable === true
        ) ?? false
      );
      this.populateScheduleChangeForm(horario, contrato.modalidad);
    } catch (error) {
      this.scheduleChangeErrorMessage.set(
        this.getErrorMessage(error as HttpErrorResponse, 'No fue posible cargar el horario vigente.')
      );
    } finally {
      this.isLoadingScheduleChange.set(false);
    }
  }

  closeScheduleChange(): void {
    this.isScheduleChangeVisible.set(false);
    this.selectedEmployeeForScheduleChange.set(null);
    this.currentScheduleForChange.set(null);
    this.currentContractForScheduleChange.set(null);
    this.isLoadingScheduleChange.set(false);
    this.isSubmittingScheduleChange.set(false);
    this.scheduleChangeErrorMessage.set('');
    this.todayWorkdayEnabled.set(false);
  }

  async enableTodayAsWorkday(): Promise<void> {
    const employee = this.selectedEmployeeForScheduleChange();
    const horario = this.currentScheduleForChange();
    const contrato = this.currentContractForScheduleChange();
    if (!employee || !horario || !contrato) {
      return;
    }

    this.syncLunchBreakControls();
    this.horarioForm.updateValueAndValidity({ emitEvent: false });
    if (this.horarioForm.invalid) {
      this.horarioForm.markAllAsTouched();
      return;
    }

    this.scheduleChangeErrorMessage.set('');
    this.scheduleChangeSuccessMessage.set('');
    this.isSubmittingScheduleChange.set(true);
    try {
      const baseRequest = this.buildHorarioRequestForModalidad(contrato.modalidad);
      const excepcion = await this.crearExcepcionDelDia(horario, this.getToday(), baseRequest);
      this.currentScheduleForChange.update((current) =>
        current
          ? {
              ...current,
              excepciones: [
                ...(current.excepciones ?? []).filter((item) => item.id !== excepcion.id),
                excepcion
              ]
            }
          : current
      );
      this.todayWorkdayEnabled.set(true);
      this.scheduleChangeSuccessMessage.set(
        'Jornada habilitada solo para hoy. El dia de descanso semanal no cambio.'
      );
      void this.loadEmployeeStates();
    } catch (error) {
      this.scheduleChangeErrorMessage.set(
        this.getErrorMessage(error as HttpErrorResponse, 'No se pudo habilitar la jornada de hoy.')
      );
    } finally {
      this.isSubmittingScheduleChange.set(false);
    }
  }

  openScheduleAdjustment(): void {
    if (!this.selectedEmployeeForScheduleChange()) return;
    this.adjustmentDate.set(this.getToday());
    this.adjustmentPreview.set(null);
    this.adjustmentError.set(null);
    this.isAdjustmentDialogVisible.set(true);
    void this.loadScheduleAdjustment();
  }

  closeScheduleAdjustment(): void {
    this.isAdjustmentDialogVisible.set(false);
    this.adjustmentJornada.set(null);
    this.adjustmentPreview.set(null);
    this.adjustmentHistory.set([]);
    this.adjustmentError.set(null);
  }

  changeScheduleAdjustmentDate(fecha: string): void {
    this.adjustmentDate.set(fecha);
    this.adjustmentPreview.set(null);
    void this.loadScheduleAdjustment();
  }

  async previewScheduleAdjustment(request: AjusteJornadaRequest): Promise<void> {
    const employee = this.selectedEmployeeForScheduleChange();
    if (!employee) return;
    this.isLoadingAdjustment.set(true);
    this.adjustmentError.set(null);
    try {
      this.adjustmentPreview.set(
        await firstValueFrom(
          this.scheduleAdjustmentService.preview(employee.idEmpleado, request)
            .pipe(timeout(this.requestTimeoutMs))
        )
      );
    } catch (error) {
      this.adjustmentError.set(
        this.getErrorMessage(error as HttpErrorResponse, 'No se pudo preparar la vista previa.')
      );
    } finally {
      this.isLoadingAdjustment.set(false);
    }
  }

  async saveScheduleAdjustment(request: AjusteJornadaRequest): Promise<void> {
    const employee = this.selectedEmployeeForScheduleChange();
    if (!employee) return;
    this.isSavingAdjustment.set(true);
    this.adjustmentError.set(null);
    try {
      await firstValueFrom(
        this.scheduleAdjustmentService.registrar(employee.idEmpleado, request)
          .pipe(timeout(this.requestTimeoutMs))
      );
      this.scheduleChangeSuccessMessage.set('La jornada puntual quedó actualizada.');
      this.todayWorkdayEnabled.set(true);
      await this.loadScheduleAdjustment();
      void this.loadEmployeeStates();
    } catch (error) {
      this.adjustmentError.set(
        this.getErrorMessage(error as HttpErrorResponse, 'No se pudo guardar el ajuste de jornada.')
      );
    } finally {
      this.isSavingAdjustment.set(false);
    }
  }

  async cancelScheduleAdjustment(idAjuste: number): Promise<void> {
    const employee = this.selectedEmployeeForScheduleChange();
    if (!employee) return;
    this.isSavingAdjustment.set(true);
    this.adjustmentError.set(null);
    try {
      await firstValueFrom(
        this.scheduleAdjustmentService.cancelar(employee.idEmpleado, idAjuste)
          .pipe(timeout(this.requestTimeoutMs))
      );
      await this.loadScheduleAdjustment();
    } catch (error) {
      this.adjustmentError.set(
        this.getErrorMessage(error as HttpErrorResponse, 'No se pudo cancelar el ajuste.')
      );
    } finally {
      this.isSavingAdjustment.set(false);
    }
  }

  private async loadScheduleAdjustment(): Promise<void> {
    const employee = this.selectedEmployeeForScheduleChange();
    const fecha = this.adjustmentDate();
    if (!employee || !fecha) return;
    this.isLoadingAdjustment.set(true);
    this.adjustmentError.set(null);
    try {
      const [jornada, history] = await Promise.all([
        firstValueFrom(
          this.scheduleAdjustmentService.getJornada(employee.idEmpleado, fecha)
            .pipe(timeout(this.requestTimeoutMs))
        ),
        firstValueFrom(
          this.scheduleAdjustmentService.listar(employee.idEmpleado, fecha)
            .pipe(timeout(this.requestTimeoutMs))
        )
      ]);
      this.adjustmentJornada.set(jornada);
      this.adjustmentHistory.set(history);
    } catch (error) {
      this.adjustmentError.set(
        this.getErrorMessage(error as HttpErrorResponse, 'No fue posible cargar la jornada.')
      );
    } finally {
      this.isLoadingAdjustment.set(false);
    }
  }

  async submitScheduleChange(): Promise<void> {
    const employee = this.selectedEmployeeForScheduleChange();
    const horario = this.currentScheduleForChange();
    const contrato = this.currentContractForScheduleChange();

    if (!employee || !horario || !contrato) {
      return;
    }

    this.syncLunchBreakControls();
    this.horarioForm.updateValueAndValidity({ emitEvent: false });
    if (this.horarioForm.invalid) {
      this.horarioForm.markAllAsTouched();
      return;
    }

    const formFechaInicio = this.horarioForm.controls.fechaInicio.getRawValue();
    if (formFechaInicio < horario.fechaInicio) {
      this.scheduleChangeErrorMessage.set(
        'La nueva fecha de inicio no puede ser anterior al inicio del horario actual.'
      );
      return;
    }

    this.scheduleChangeErrorMessage.set('');
    this.scheduleChangeSuccessMessage.set('');
    this.isSubmittingScheduleChange.set(true);

    try {
      const baseRequest = this.buildHorarioRequestForModalidad(contrato.modalidad);

      const horarioEnFecha = await firstValueFrom(
        this.adminRrhhService
          .getHorarioVigente(employee.idEmpleado, formFechaInicio)
          .pipe(timeout(this.requestTimeoutMs))
      );

      if (horarioEnFecha.fechaInicio === formFechaInicio) {
        // Misma vigencia → corregir in-situ (PATCH).
        await this.runCorregirHorario(employee.idEmpleado, horarioEnFecha.id, baseRequest);
      } else {
        // Fecha futura → reemplazar (PUT). Comportamiento original.
        await this.runReemplazarHorario(employee.idEmpleado, horarioEnFecha.id, baseRequest);
      }
    } finally {
      this.isSubmittingScheduleChange.set(false);
    }
  }

  private async runCorregirHorario(
    empleadoId: number,
    idHorario: number,
    baseRequest: Omit<RegistrarHorarioRequest, 'idEmpleado' | 'idContrato'>
  ): Promise<void> {
    const patchRequest: CorregirHorarioRequest = {
      modalidad: baseRequest.modalidad,
      compensable: baseRequest.compensable,
      detalles: baseRequest.detalles
    };

    try {
      const horario = await firstValueFrom(
        this.adminRrhhService.corregirHorario(idHorario, patchRequest).pipe(timeout(this.requestTimeoutMs))
      );

      this.scheduleChangeSuccessMessage.set('Horario corregido. Los cambios aplican desde la vigencia actual.');
      this.scheduleByEmployeeId.update((current) => ({ ...current, [empleadoId]: horario }));
      this.isScheduleChangeVisible.set(false);
      void this.loadEmployeeStates();
    } catch (error) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === 409) {
        // Backend detecto marcaciones reales; pedimos al admin como aplicarlo.
        this.correctionDecisionMotivo.set('Correccion administrativa');
        this.correctionDecisionCustomDate.set(this.addDays(this.getToday(), 1));
        this.isCorrectionDecisionVisible.set(true);
        return;
      }
      this.scheduleChangeErrorMessage.set(
        this.getErrorMessage(httpError, 'No se pudo corregir el horario.')
      );
    }
  }

  private async runReemplazarHorario(
    empleadoId: number,
    idHorario: number,
    baseRequest: Omit<RegistrarHorarioRequest, 'idEmpleado' | 'idContrato'>
  ): Promise<void> {
    const putRequest: ReemplazarHorarioRequest = {
      modalidad: baseRequest.modalidad,
      fechaInicio: baseRequest.fechaInicio,
      compensable: baseRequest.compensable,
      detalles: baseRequest.detalles
    };

    try {
      const horario = await firstValueFrom(
        this.adminRrhhService.reemplazarHorario(idHorario, putRequest).pipe(timeout(this.requestTimeoutMs))
      );

      this.scheduleChangeSuccessMessage.set('Horario actualizado. La nueva vigencia iniciara en la fecha seleccionada.');
      this.scheduleByEmployeeId.update((current) => ({ ...current, [empleadoId]: horario }));
      this.isScheduleChangeVisible.set(false);
      void this.loadEmployeeStates();
    } catch (error) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === 409) {
        // Backend rechazo: la fecha elegida ya tiene marcaciones. Ofrecemos las salidas seguras
        // (mismo dialogo que la correccion in-situ): la util aqui es "Desde manana".
        this.correctionDecisionMotivo.set('Correccion administrativa');
        this.correctionDecisionCustomDate.set(this.addDays(this.getToday(), 1));
        this.isCorrectionDecisionVisible.set(true);
        return;
      }
      this.scheduleChangeErrorMessage.set(
        this.getErrorMessage(httpError, 'No se pudo cambiar el horario.')
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Sub-dialogo de decision (caso 409: horario con marcaciones reales)
  // ─────────────────────────────────────────────────────────────────────

  closeCorrectionDecision(): void {
    this.isCorrectionDecisionVisible.set(false);
    this.isApplyingCorrectionDecision.set(false);
  }

  setCorrectionDecisionMotivo(value: string): void {
    this.correctionDecisionMotivo.set(value);
  }

  setCorrectionDecisionCustomDate(value: string): void {
    this.correctionDecisionCustomDate.set(value);
  }

  /** A. Solo para hoy: crea una ExcepcionHorario CAMBIO_COMPLETO para HOY. */
  async applyCorrectionOnlyToday(): Promise<void> {
    await this.runCorrectionDecision(async (empleadoId, horario, baseRequest) => {
      await this.crearExcepcionDelDia(horario, this.getToday(), baseRequest);
      this.scheduleChangeSuccessMessage.set('Excepcion registrada solo para hoy. El horario base se mantiene.');
      void this.refreshScheduleAfterDecision(empleadoId, horario.id);
    });
  }

  /** B. Desde manana en adelante: PUT reemplazar con fechaInicio = hoy+1. */
  async applyCorrectionFromTomorrow(): Promise<void> {
    await this.runCorrectionDecision(async (empleadoId, horario, baseRequest) => {
      const fechaInicio = this.addDays(this.getToday(), 1);
      await this.reemplazarConFecha(empleadoId, horario.id, baseRequest, fechaInicio);
      this.scheduleChangeSuccessMessage.set('Nuevo horario aplicado desde manana. El actual se cierra hoy.');
    });
  }

  /** C. Hoy + Desde manana: excepcion de hoy + reemplazo desde manana. */
  async applyCorrectionTodayAndTomorrow(): Promise<void> {
    await this.runCorrectionDecision(async (empleadoId, horario, baseRequest) => {
      await this.crearExcepcionDelDia(horario, this.getToday(), baseRequest);
      const fechaInicio = this.addDays(this.getToday(), 1);
      await this.reemplazarConFecha(empleadoId, horario.id, baseRequest, fechaInicio);
      this.scheduleChangeSuccessMessage.set('Excepcion creada para hoy y nuevo horario aplicado desde manana.');
    });
  }

  /** D. Desde una fecha especifica elegida por el admin. */
  async applyCorrectionFromCustomDate(): Promise<void> {
    const customDate = this.correctionDecisionCustomDate();
    const today = this.getToday();
    if (!customDate || customDate <= today) {
      this.scheduleChangeErrorMessage.set('La fecha debe ser posterior a hoy.');
      return;
    }
    await this.runCorrectionDecision(async (empleadoId, horario, baseRequest) => {
      await this.reemplazarConFecha(empleadoId, horario.id, baseRequest, customDate);
      this.scheduleChangeSuccessMessage.set(`Nuevo horario aplicado desde ${customDate}. El actual se cierra el dia anterior.`);
    });
  }

  private async runCorrectionDecision(
    action: (
      empleadoId: number,
      horario: HorarioResponse,
      baseRequest: Omit<RegistrarHorarioRequest, 'idEmpleado' | 'idContrato'>
    ) => Promise<void>
  ): Promise<void> {
    const employee = this.selectedEmployeeForScheduleChange();
    const horario = this.currentScheduleForChange();
    const contrato = this.currentContractForScheduleChange();
    if (!employee || !horario || !contrato) {
      return;
    }

    this.scheduleChangeErrorMessage.set('');
    this.isApplyingCorrectionDecision.set(true);
    try {
      const baseRequest = this.buildHorarioRequestForModalidad(contrato.modalidad);
      await action(employee.idEmpleado, horario, baseRequest);
      this.isCorrectionDecisionVisible.set(false);
      this.isScheduleChangeVisible.set(false);
      void this.loadEmployeeStates();
    } catch (error) {
      this.scheduleChangeErrorMessage.set(
        this.getErrorMessage(error as HttpErrorResponse, 'No se pudo aplicar la correccion.')
      );
    } finally {
      this.isApplyingCorrectionDecision.set(false);
    }
  }

  private async crearExcepcionDelDia(
    horario: HorarioResponse,
    fecha: string,
    baseRequest: Omit<RegistrarHorarioRequest, 'idEmpleado' | 'idContrato'>
  ) {
    // En "correcciones rapidas" el modal trabaja con horas globales (simple).
    // Para la excepcion del dia tomamos esas horas y forzamos laborable=true:
    // si el admin esta corrigiendo el horario, quiere que ese dia se aplique
    // lo que escribio, no que sea "dia libre" (eso es otro flujo).
    const raw = this.horarioForm.getRawValue();
    const requiereAlmuerzo = this.requiresLunchBreak(baseRequest.modalidad);
    const motivo = this.correctionDecisionMotivo().trim() || 'Correccion administrativa';

    const excepcionRequest: RegistrarExcepcionHorarioRequest = {
      fecha,
      tipo: 'CAMBIO_COMPLETO',
      horaEntrada: raw.horaEntrada,
      horaSalida: raw.horaSalida,
      inicioAlmuerzo: requiereAlmuerzo ? raw.inicioAlmuerzo : null,
      finAlmuerzo: requiereAlmuerzo ? raw.finAlmuerzo : null,
      laborable: true,
      motivo
    };

    const existente = horario.excepciones?.find((excepcion) => excepcion.fecha === fecha);
    return firstValueFrom(
      (existente
        ? this.adminRrhhService.actualizarExcepcionHorario(horario.id, existente.id, excepcionRequest)
        : this.adminRrhhService.registrarExcepcionHorario(horario.id, excepcionRequest)
      ).pipe(timeout(this.requestTimeoutMs))
    );
  }

  private getTodayScheduleDay(): string {
    const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    return days[new Date().getDay()];
  }

  private async reemplazarConFecha(
    empleadoId: number,
    idHorario: number,
    baseRequest: Omit<RegistrarHorarioRequest, 'idEmpleado' | 'idContrato'>,
    fechaInicio: string
  ): Promise<void> {
    const putRequest: ReemplazarHorarioRequest = {
      modalidad: baseRequest.modalidad,
      fechaInicio,
      compensable: baseRequest.compensable,
      detalles: baseRequest.detalles
    };
    const horario = await firstValueFrom(
      this.adminRrhhService.reemplazarHorario(idHorario, putRequest).pipe(timeout(this.requestTimeoutMs))
    );
    this.scheduleByEmployeeId.update((current) => ({ ...current, [empleadoId]: horario }));
  }

  private async refreshScheduleAfterDecision(empleadoId: number, idHorario: number): Promise<void> {
    try {
      const horario = await firstValueFrom(
        this.adminRrhhService.getHorarioVigente(empleadoId, this.getToday()).pipe(timeout(this.requestTimeoutMs))
      );
      this.scheduleByEmployeeId.update((current) => ({ ...current, [empleadoId]: horario }));
    } catch {
      // silencioso: la lista igualmente se refrescara en loadEmployeeStates
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
    this.resetContractRenewalScheduleForm();
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

    this.horarioForm.controls.fechaInicio.setValue(this.contractRenewalForm.controls.fechaInicio.getRawValue());
    this.syncLunchBreakControls();
    this.horarioForm.updateValueAndValidity({ emitEvent: false });
    if (this.horarioForm.invalid) {
      this.horarioForm.markAllAsTouched();
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
      const horarioRequest = this.buildHorarioRequestForModalidad(this.contractRenewalForm.controls.modalidad.getRawValue());
      await firstValueFrom(
        this.adminRrhhService
          .registrarHorario({
            idEmpleado: employee.idEmpleado,
            idContrato: contrato.id,
            ...horarioRequest
          })
          .pipe(timeout(this.requestTimeoutMs))
      );

      this.currentContractForRenewal.set(contrato);
      this.contractRenewalSuccessMessage.set('Nuevo contrato y horario registrados. El acceso del usuario se sincronizo.');
      this.isContractRenewalVisible.set(false);
      void this.loadActiveEmployees();
      void this.loadInactiveEmployees();
      this.refreshUserAccess(employee.idEmpleado);
    } catch (error) {
      this.contractRenewalErrorMessage.set(
        this.getErrorMessage(error as HttpErrorResponse, 'No se pudo registrar el nuevo contrato y horario.')
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
    return this.buildHorarioRequestForModalidad(this.contratoForm.controls.modalidad.getRawValue());
  }

  private buildHorarioRequestForModalidad(modalidad: string): Omit<RegistrarHorarioRequest, 'idEmpleado' | 'idContrato'> {
    this.syncLunchBreakControls();
    this.syncSimpleScheduleRows(modalidad);
    const raw = this.horarioForm.getRawValue();
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
    const rule = this.resolveScheduleRule('FULL_TIME');

    return this.diasSemanaOptions.map((dia) =>
      this.formBuilder.nonNullable.group({
        dia: [dia, [Validators.required]],
        horaEntrada: [rule.defaultStart, [Validators.required]],
        horaSalida: [rule.defaultEnd, [Validators.required]],
        inicioAlmuerzo: [rule.defaultLunchStart, [Validators.required]],
        finAlmuerzo: [rule.defaultLunchEnd, [Validators.required]],
        laborable: [dia === 'DOMINGO' ? 'false' : 'true', [Validators.required]]
      })
    );
  }

  private syncSimpleScheduleRows(modalidad = this.currentScheduleModalidad()): void {
    const raw = this.horarioForm.getRawValue();
    if (raw.modoAvanzado === 'true') {
      return;
    }

    const requiereAlmuerzo = this.requiresLunchBreak(modalidad);
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
    const rule = this.resolveScheduleRule(this.currentScheduleModalidad());
    const requiereAlmuerzo = rule.requiresLunch;
    const defaults = {
      inicioAlmuerzo: rule.defaultLunchStart,
      finAlmuerzo: rule.defaultLunchEnd
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
    this.horarioForm.updateValueAndValidity({ emitEvent: false });
  }

  private requiresLunchBreak(modalidad: string): boolean {
    return !this.modalidadesSinAlmuerzo.has(modalidad);
  }

  private createHorarioValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const raw = control.getRawValue() as {
        horaEntrada: string;
        horaSalida: string;
        inicioAlmuerzo: string;
        finAlmuerzo: string;
        modoAvanzado: string;
        detalles: Array<{
          horaEntrada: string;
          horaSalida: string;
          inicioAlmuerzo: string;
          finAlmuerzo: string;
          laborable: string;
        }>;
      };
      const modalidad = this.currentScheduleModalidad();
      const rule = this.resolveScheduleRule(modalidad);

      if (raw.modoAvanzado === 'true') {
        const rowErrors = raw.detalles
          .map((detalle, index) => {
            if (detalle.laborable !== 'true') {
              return null;
            }

            const fields = this.validateScheduleBlock(detalle, rule);
            return fields ? { index, fields } : null;
          })
          .filter((value): value is { index: number; fields: string[] } => value !== null);

        return rowErrors.length
          ? {
              scheduleRule: {
                message: this.buildScheduleRuleMessage(modalidad, rule),
                rowErrors
              } satisfies ScheduleRuleError
            }
          : null;
      }

      const simpleFields = this.validateScheduleBlock(raw, rule);
      return simpleFields
        ? {
            scheduleRule: {
              message: this.buildScheduleRuleMessage(modalidad, rule),
              simpleFields
            } satisfies ScheduleRuleError
          }
        : null;
    };
  }

  private validateScheduleBlock(
    block: {
      horaEntrada: string;
      horaSalida: string;
      inicioAlmuerzo: string;
      finAlmuerzo: string;
    },
    rule: ScheduleRule
  ): string[] | null {
    const entrada = this.parseTimeToMinutes(block.horaEntrada);
    const salida = this.parseTimeToMinutes(block.horaSalida);

    if (entrada === null || salida === null) {
      return null;
    }

    const fields = new Set<string>();

    if (salida <= entrada || salida - entrada !== rule.totalMinutes) {
      fields.add('horaEntrada');
      fields.add('horaSalida');
    }

    if (!rule.requiresLunch) {
      return fields.size ? [...fields] : null;
    }

    const inicioAlmuerzo = this.parseTimeToMinutes(block.inicioAlmuerzo);
    const finAlmuerzo = this.parseTimeToMinutes(block.finAlmuerzo);

    if (inicioAlmuerzo === null || finAlmuerzo === null) {
      return fields.size ? [...fields] : null;
    }

    if (
      finAlmuerzo <= inicioAlmuerzo ||
      inicioAlmuerzo <= entrada ||
      finAlmuerzo >= salida ||
      finAlmuerzo - inicioAlmuerzo !== rule.lunchMinutes
    ) {
      fields.add('inicioAlmuerzo');
      fields.add('finAlmuerzo');
    }

    return fields.size ? [...fields] : null;
  }

  private buildScheduleRuleMessage(modalidad: string, rule: ScheduleRule): string {
    if (rule.requiresLunch) {
      return `${modalidad} requiere ${rule.durationLabel} entre entrada y salida, con ${rule.lunchMinutes} minutos de almuerzo.`;
    }

    return `${modalidad} requiere ${rule.durationLabel} entre entrada y salida, sin almuerzo.`;
  }

  private parseTimeToMinutes(value: string | null | undefined): number | null {
    if (!value) {
      return null;
    }

    const match = /^(\d{2}):(\d{2})$/.exec(value);
    if (!match) {
      return null;
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    return hours * 60 + minutes;
  }

  private resolveScheduleRule(modalidad: string): ScheduleRule {
    return this.scheduleRules[modalidad] ?? this.scheduleRules['FULL_TIME'];
  }

  private currentScheduleModalidad(): string {
    const isScheduleChangeVisible =
      typeof this.isScheduleChangeVisible === 'function' && this.isScheduleChangeVisible();
    const isRenewalVisible =
      typeof this.isContractRenewalVisible === 'function' && this.isContractRenewalVisible();

    if (isScheduleChangeVisible) {
      return this.currentContractForScheduleChange()?.modalidad ?? 'FULL_TIME';
    }

    return isRenewalVisible
      ? this.contractRenewalForm.controls.modalidad.getRawValue()
      : this.contratoForm.controls.modalidad.getRawValue();
  }

  private applySchedulePresetForModalidad(modalidad: string, force = false): void {
    const rule = this.resolveScheduleRule(modalidad);
    const current = this.horarioForm.getRawValue();

    this.horarioForm.patchValue(
      {
        horaEntrada: rule.defaultStart,
        horaSalida: rule.defaultEnd
      },
      { emitEvent: false }
    );

    if (rule.requiresLunch) {
      this.horarioForm.patchValue(
        {
          inicioAlmuerzo: rule.defaultLunchStart,
          finAlmuerzo: rule.defaultLunchEnd
        },
        { emitEvent: false }
      );
    } else {
      this.horarioForm.patchValue(
        {
          inicioAlmuerzo: '',
          finAlmuerzo: ''
        },
        { emitEvent: false }
      );
    }

    if (current.modoAvanzado === 'true' || force) {
      for (const row of this.horarioForm.controls.detalles.controls) {
        row.patchValue(
          {
            horaEntrada: rule.defaultStart,
            horaSalida: rule.defaultEnd,
            inicioAlmuerzo: rule.defaultLunchStart,
            finAlmuerzo: rule.defaultLunchEnd
          },
          { emitEvent: false }
        );
      }
    }
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

  private resetContractRenewalScheduleForm(): void {
    this.horarioForm.reset({
      fechaInicio: this.contractRenewalForm.controls.fechaInicio.getRawValue() || this.getToday(),
      compensable: 'true',
      horaEntrada: '09:00',
      horaSalida: '18:00',
      inicioAlmuerzo: '13:00',
      finAlmuerzo: '14:00',
      diaDescanso: 'DOMINGO',
      modoAvanzado: 'false'
    });
    this.resetScheduleRows();
    this.applySchedulePresetForModalidad(this.contractRenewalForm.controls.modalidad.getRawValue(), true);
    this.syncLunchBreakControls();
    this.horarioForm.updateValueAndValidity({ emitEvent: false });
  }

  private populateScheduleChangeForm(horario: HorarioResponse, modalidad: string): void {
    const tomorrow = this.addDays(this.getToday(), 1);
    const laborables = horario.detalles.filter((detalle) => detalle.laborable);
    const descanso = horario.detalles.find((detalle) => !detalle.laborable)?.dia ?? 'DOMINGO';
    const firstLaborable = laborables[0] ?? horario.detalles[0];

    this.horarioForm.reset({
      fechaInicio: tomorrow,
      compensable: String(horario.compensable ?? true),
      horaEntrada: firstLaborable?.horaEntrada?.slice(0, 5) ?? '09:00',
      horaSalida: firstLaborable?.horaSalida?.slice(0, 5) ?? '18:00',
      inicioAlmuerzo: this.requiresLunchBreak(modalidad) ? firstLaborable?.inicioAlmuerzo?.slice(0, 5) ?? '13:00' : '',
      finAlmuerzo: this.requiresLunchBreak(modalidad) ? firstLaborable?.finAlmuerzo?.slice(0, 5) ?? '14:00' : '',
      diaDescanso: descanso,
      modoAvanzado: 'false'
    });

    this.resetScheduleRows();
    for (const row of this.horarioForm.controls.detalles.controls) {
      const detalle = horario.detalles.find((item) => item.dia === row.controls.dia.getRawValue());
      if (!detalle) {
        continue;
      }

      row.patchValue(
        {
          horaEntrada: detalle.horaEntrada?.slice(0, 5) ?? '09:00',
          horaSalida: detalle.horaSalida?.slice(0, 5) ?? '18:00',
          inicioAlmuerzo: detalle.inicioAlmuerzo?.slice(0, 5) ?? '',
          finAlmuerzo: detalle.finAlmuerzo?.slice(0, 5) ?? '',
          laborable: String(detalle.laborable)
        },
        { emitEvent: false }
      );
    }

    this.syncLunchBreakControls();
    this.horarioForm.updateValueAndValidity({ emitEvent: false });
  }

  private refreshUserAccess(empleadoId: number): void {
    if (!(empleadoId in this.accessByEmployeeId()) && !this.accessErrorByEmployeeId()[empleadoId]) {
      if (!(empleadoId in this.scheduleByEmployeeId()) && !this.scheduleErrorByEmployeeId()[empleadoId]) {
        return;
      }
    }

    if (empleadoId in this.accessByEmployeeId() || !!this.accessErrorByEmployeeId()[empleadoId]) {
      this.accessLookupRequest.set({
        requestId: this.nextRequestId++,
        empleadoId
      });
    }

    if (empleadoId in this.scheduleByEmployeeId() || !!this.scheduleErrorByEmployeeId()[empleadoId]) {
      this.scheduleLookupRequest.set({
        requestId: this.nextRequestId++,
        empleadoId
      });
    }
  }

  private resetScheduleRows(): void {
    const detalles = this.horarioForm.controls.detalles;
    detalles.clear();
    this.buildDefaultScheduleRows().forEach((group) => detalles.push(group));
  }

  private getErrorMessage(error: HttpErrorResponse, fallbackMessage: string): string {
    return formatApiErrorMessage(error.error, fallbackMessage);
  }

  private getToday(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');

    return `${now.getFullYear()}-${month}-${day}`;
  }

  private addDays(value: string, days: number): string {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);

    const nextMonth = `${date.getMonth() + 1}`.padStart(2, '0');
    const nextDay = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${nextMonth}-${nextDay}`;
  }
}
