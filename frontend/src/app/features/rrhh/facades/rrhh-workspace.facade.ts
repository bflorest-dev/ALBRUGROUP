import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { Observable, catchError, firstValueFrom, of, timeout } from 'rxjs';
import { ApiErrorResponse } from '../../../shared/models/api/api-error-response';
import { PageResponse } from '../../../shared/models/common/page-response';
import { EventoResponse } from '../../../shared/models/recruitment/evento-response';
import { OfertaLaboralResponse } from '../../../shared/models/recruitment/oferta-laboral-response';
import { PostulacionRequest } from '../../../shared/models/recruitment/postulacion-request';
import { PostulacionResponse } from '../../../shared/models/recruitment/postulacion-response';
import { CerrarContratoRequest } from '../../../shared/models/rrhh/cerrar-contrato-request';
import { ContratoResponse } from '../../../shared/models/rrhh/contrato-response';
import { DatosContactoCorporativoRequest } from '../../../shared/models/rrhh/datos-contacto-corporativo-request';
import { DatosContactoUbicacionRequest } from '../../../shared/models/rrhh/datos-contacto-ubicacion-request';
import { DatosFinancierosRequest } from '../../../shared/models/rrhh/datos-financieros-request';
import { DatosPersonalesRequest } from '../../../shared/models/rrhh/datos-personales-request';
import { EmpleadoResponse } from '../../../shared/models/rrhh/empleado-response';
import { EmpresaContratistaResponse } from '../../../shared/models/rrhh/empresa-contratista-response';
import { EventoEmpleadoResponse } from '../../../shared/models/rrhh/evento-empleado-response';
import { PagoResponse } from '../../../shared/models/rrhh/pago-response';
import { RegistrarContratoRequest } from '../../../shared/models/rrhh/registrar-contrato-request';
import { RegistrarEmpleadoRequest } from '../../../shared/models/rrhh/registrar-empleado-request';
import { RegistrarPagoRequest } from '../../../shared/models/rrhh/registrar-pago-request';
import {
  CumplimientoDetalleResponse,
  CumplimientoResumenResponse,
  EstadoMonitorResponse
} from '../../../shared/models/schedule/cumplimiento-response';
import { HorarioResponse } from '../../../shared/models/schedule/horario-response';
import { RegistrarHorarioRequest } from '../../../shared/models/schedule/registrar-horario-request';
import { RrhhOperationsService } from '../services/rrhh-operations.service';
import { PostulacionFilters, RrhhRecruitmentService } from '../services/rrhh-recruitment.service';

export type RrhhSection =
  | 'contratacion'
  | 'empleados'
  | 'contratos'
  | 'horarios'
  | 'pagos'
  | 'cumplimiento'
  | 'eventos';

@Injectable()
export class RrhhWorkspaceFacade {
  private readonly requestTimeoutMs = 15000;
  private readonly formBuilder = inject(FormBuilder);
  private readonly recruitmentService = inject(RrhhRecruitmentService);
  private readonly rrhhService = inject(RrhhOperationsService);

  readonly section = signal<RrhhSection>('contratacion');

  readonly documentoOptions = ['DNI', 'CE'];
  readonly nacionalidadOptions = ['PERUANO', 'EXTRANJERO'];
  readonly estadoCivilOptions = ['SOLTERO', 'CASADO', 'VIUDO', 'DIVORCIADO'];
  readonly origenOptions = ['COMPUTRABAJO', 'INDEED', 'TIKTOK', 'FACEBOOK', 'LINKEDIN', 'REFERIDO'];
  readonly etapaOptions = ['RECLUTAMIENTO', 'CAPACITACION', 'CONTRATACION'];
  readonly estadoOptions = ['EN_PROCESO', 'CERRADA', 'FINALIZADA'];
  readonly estadoBandejaOptions = ['POSTULANTE', 'SIN_CONTACTO', 'NO_INTERESADO', 'EN_GESTION', 'RECHAZADO'];
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
  readonly estadoOperativoOptions = ['ACTIVO', 'INACTIVO'];
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

  readonly postulanteForm = this.formBuilder.nonNullable.group({
    idOfertaLaboral: [0, [Validators.required, Validators.min(1)]],
    origen: ['COMPUTRABAJO', [Validators.required]],
    nombres: ['', [Validators.required]],
    apellidos: ['', [Validators.required]],
    tipoDocumento: ['DNI', [Validators.required]],
    documento: ['', [Validators.required]],
    celular: ['', [Validators.required]],
    fechaNacimiento: ['', [Validators.required]]
  });

  readonly filterForm = this.formBuilder.nonNullable.group({
    etapa: [''],
    estado: [''],
    estadoBandeja: ['']
  });

  readonly employeeCreateForm = this.formBuilder.nonNullable.group({
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

  readonly employeeFilterForm = this.formBuilder.nonNullable.group({
    q: [''],
    dni: [''],
    celular: [''],
    distrito: [''],
    banco: [''],
    origen: [''],
    estado: [''],
    idEmpresaContratista: [''],
    universalSearch: [''],
    documentoExacto: ['']
  });

  readonly personalForm = this.formBuilder.nonNullable.group({
    nombres: ['', [Validators.required]],
    apellidos: ['', [Validators.required]],
    tipoDocumento: ['DNI', [Validators.required]],
    numeroDocumento: ['', [Validators.required]],
    nacionalidad: ['PERUANO', [Validators.required]],
    fechaNacimiento: ['', [Validators.required]],
    estadoCivil: ['SOLTERO', [Validators.required]],
    tieneHijos: ['false', [Validators.required]]
  });

  readonly contactForm = this.formBuilder.nonNullable.group({
    celularPersonal: ['', [Validators.required]],
    correoPersonal: ['', [Validators.required, Validators.email]],
    distrito: ['SAN_MIGUEL', [Validators.required]],
    direccion: ['', [Validators.required]]
  });

  readonly financialForm = this.formBuilder.nonNullable.group({
    banco: ['BCP', [Validators.required]],
    cuentaBancaria: ['', [Validators.required]],
    cuentaInterbancaria: ['', [Validators.required]],
    cuentaPropia: ['true', [Validators.required]],
    parentesco: [''],
    celularTransferencia: [''],
    idEmpresaContratista: ['']
  });

  readonly corporateForm = this.formBuilder.nonNullable.group({
    celularCorporativo: ['', [Validators.required]],
    correoCorporativo: ['', [Validators.required, Validators.email]]
  });

  readonly contractForm = this.formBuilder.nonNullable.group({
    puestoTrabajo: ['RECLUTADOR', [Validators.required]],
    regimen: ['PLANILLA', [Validators.required]],
    modalidad: ['FULL_TIME', [Validators.required]],
    seguroSalud: ['ESSALUD'],
    sistemaPensiones: ['ONP'],
    sueldoBase: [1130, [Validators.required, Validators.min(0.01)]],
    fechaInicio: [this.getToday(), [Validators.required]],
    fechaFin: ['']
  });

  readonly closeContractForm = this.formBuilder.nonNullable.group({
    fechaFin: [this.getToday(), [Validators.required]]
  });

  readonly horarioForm = this.formBuilder.nonNullable.group({
    fechaInicio: [this.getToday(), [Validators.required]],
    compensable: ['true', [Validators.required]],
    detalles: this.formBuilder.nonNullable.array(this.buildDefaultScheduleRows())
  });

  readonly finalizeScheduleForm = this.formBuilder.nonNullable.group({
    fechaFin: [this.getToday(), [Validators.required]]
  });

  readonly exceptionForm = this.formBuilder.nonNullable.group({
    idExcepcion: [''],
    fecha: [this.getToday(), [Validators.required]],
    tipo: ['CAMBIO_TURNO', [Validators.required]],
    horaEntrada: ['09:00'],
    horaSalida: ['18:00'],
    inicioAlmuerzo: ['13:00'],
    finAlmuerzo: ['14:00'],
    laborable: ['true', [Validators.required]],
    motivo: ['', [Validators.required]]
  });

  readonly paymentForm = this.formBuilder.nonNullable.group({
    fechaInicio: [''],
    fechaFin: [''],
    asignacionFamiliar: [1, [Validators.required, Validators.min(0.01)]],
    bonoPuntualidad: [''],
    comisionSemanal: [''],
    comisionMensual: [''],
    bonoExtra: ['']
  });

  readonly paymentFilterForm = this.formBuilder.nonNullable.group({
    contrato: [''],
    empleado: [''],
    desde: [''],
    hasta: ['']
  });

  readonly complianceForm = this.formBuilder.nonNullable.group({
    empleadoIds: [''],
    desde: [this.getToday(), [Validators.required]],
    hasta: [this.getToday(), [Validators.required]],
    fechaMonitor: [this.getToday()]
  });

  readonly activeOffersState = toSignal(
    this.recruitmentService.listarOfertasActivas().pipe(
      timeout(this.requestTimeoutMs),
      catchError(() => of<OfertaLaboralResponse[]>([]))
    ),
    { initialValue: [] as OfertaLaboralResponse[] }
  );

  readonly empresasContratistasState = toSignal(
    this.rrhhService.listarEmpresasContratistas().pipe(
      timeout(this.requestTimeoutMs),
      catchError(() => of<EmpresaContratistaResponse[]>([]))
    ),
    { initialValue: [] as EmpresaContratistaResponse[] }
  );

  readonly postulacionesPage = signal(this.emptyPage<PostulacionResponse>());
  readonly hiringReadyPage = signal(this.emptyPage<PostulacionResponse>());
  readonly hiringEventsPage = signal(this.emptyPage<EventoResponse>());
  readonly employeesPage = signal(this.emptyPage<EmpleadoResponse>());
  readonly contractHistoryPage = signal(this.emptyPage<ContratoResponse>());
  readonly employeeEventsPage = signal(this.emptyPage<EventoEmpleadoResponse>());
  readonly scheduleHistoryPage = signal(this.emptyPage<HorarioResponse>());
  readonly paymentsPage = signal(this.emptyPage<PagoResponse>());

  readonly selectedHiringCase = signal<PostulacionResponse | null>(null);
  readonly selectedEmployee = signal<EmpleadoResponse | null>(null);
  readonly currentContract = signal<ContratoResponse | null>(null);
  readonly linkedPostulacionId = signal<number | null>(null);

  readonly isLoadingPostulaciones = signal(false);
  readonly isSavingPostulacion = signal(false);
  readonly isLoadingHiringReady = signal(false);
  readonly isLoadingHiringEvents = signal(false);
  readonly isLoadingEmployees = signal(false);
  readonly isCreatingEmployee = signal(false);
  readonly isUpdatingEmployee = signal(false);
  readonly isLoadingContracts = signal(false);
  readonly isRegisteringContract = signal(false);
  readonly isClosingContract = signal(false);
  readonly isRegisteringSchedule = signal(false);
  readonly isLoadingSchedules = signal(false);
  readonly isUpdatingSchedule = signal(false);
  readonly isSavingException = signal(false);
  readonly isDeletingException = signal(false);
  readonly isRegisteringPayment = signal(false);
  readonly isLoadingPayments = signal(false);
  readonly isLoadingCompliance = signal(false);
  readonly isLoadingEmployeeEvents = signal(false);

  readonly editingPostulacionId = signal<number | null>(null);

  readonly listErrorMessage = signal('');
  readonly saveErrorMessage = signal('');
  readonly saveSuccessMessage = signal('');
  readonly hiringReadyErrorMessage = signal('');
  readonly hiringEventsErrorMessage = signal('');
  readonly employeeListErrorMessage = signal('');
  readonly employeeActionErrorMessage = signal('');
  readonly employeeActionSuccessMessage = signal('');
  readonly contractErrorMessage = signal('');
  readonly contractSuccessMessage = signal('');
  readonly scheduleErrorMessage = signal('');
  readonly scheduleSuccessMessage = signal('');
  readonly paymentErrorMessage = signal('');
  readonly paymentSuccessMessage = signal('');
  readonly complianceErrorMessage = signal('');
  readonly employeeEventsErrorMessage = signal('');
  readonly registeredSchedule = signal<HorarioResponse | null>(null);
  readonly currentSchedule = signal<HorarioResponse | null>(null);
  readonly complianceResumen = signal<CumplimientoResumenResponse | null>(null);
  readonly complianceDetalle = signal<CumplimientoDetalleResponse | null>(null);
  readonly monitorEstados = signal<EstadoMonitorResponse[]>([]);

  readonly activeOffers = computed(() => this.activeOffersState());
  readonly empresasContratistas = computed(() => this.empresasContratistasState());
  readonly postulaciones = computed(() => this.postulacionesPage().content);
  readonly currentPostulacionesPage = computed(() => this.postulacionesPage().page);
  readonly totalPostulacionesPages = computed(() => this.postulacionesPage().totalPages);
  readonly hiringReadyCases = computed(() => this.hiringReadyPage().content);
  readonly currentHiringReadyPage = computed(() => this.hiringReadyPage().page);
  readonly totalHiringReadyPages = computed(() => this.hiringReadyPage().totalPages);
  readonly hiringEvents = computed(() => this.hiringEventsPage().content);
  readonly employees = computed(() => this.employeesPage().content);
  readonly currentEmployeesPage = computed(() => this.employeesPage().page);
  readonly totalEmployeesPages = computed(() => this.employeesPage().totalPages);
  readonly contractHistory = computed(() => this.contractHistoryPage().content);
  readonly currentContractHistoryPage = computed(() => this.contractHistoryPage().page);
  readonly totalContractHistoryPages = computed(() => this.contractHistoryPage().totalPages);
  readonly employeeEvents = computed(() => this.employeeEventsPage().content);
  readonly currentEmployeeEventsPage = computed(() => this.employeeEventsPage().page);
  readonly totalEmployeeEventsPages = computed(() => this.employeeEventsPage().totalPages);
  readonly scheduleHistory = computed(() => this.scheduleHistoryPage().content);
  readonly currentScheduleHistoryPage = computed(() => this.scheduleHistoryPage().page);
  readonly totalScheduleHistoryPages = computed(() => this.scheduleHistoryPage().totalPages);
  readonly payments = computed(() => this.paymentsPage().content);
  readonly currentPaymentsPage = computed(() => this.paymentsPage().page);
  readonly totalPaymentsPages = computed(() => this.paymentsPage().totalPages);
  readonly isEditing = computed(() => this.editingPostulacionId() !== null);

  async initialize(): Promise<void> {
    await Promise.all([
      this.loadPostulaciones(),
      this.loadHiringReadyCases(),
      this.loadEmployees()
    ]);
  }

  setSection(section: RrhhSection): void {
    this.section.set(section);
  }

  async loadPostulaciones(pageNumber = 0): Promise<void> {
    this.isLoadingPostulaciones.set(true);
    this.listErrorMessage.set('');

    try {
      const page = await this.withTimeout(
        this.recruitmentService.listarPostulaciones(this.buildPostulacionFilters(), pageNumber)
      );
      this.postulacionesPage.set(page);
    } catch (error) {
      this.listErrorMessage.set(
        this.getErrorMessage(error, 'No fue posible cargar postulaciones.')
      );
    } finally {
      this.isLoadingPostulaciones.set(false);
    }
  }

  applyFilters(): void {
    void this.loadPostulaciones(0);
  }

  clearFilters(): void {
    this.filterForm.reset({
      etapa: '',
      estado: '',
      estadoBandeja: ''
    });
    void this.loadPostulaciones(0);
  }

  async submitPostulacion(): Promise<void> {
    if (this.postulanteForm.invalid) {
      this.postulanteForm.markAllAsTouched();
      return;
    }

    this.isSavingPostulacion.set(true);
    this.saveErrorMessage.set('');
    this.saveSuccessMessage.set('');

    try {
      const request = this.buildPostulacionRequest();
      const postulacion = this.editingPostulacionId()
        ? await this.withTimeout(
            this.recruitmentService.editarPostulacion(this.editingPostulacionId() as number, request)
          )
        : await this.withTimeout(this.recruitmentService.registrarPostulacion(request));

      this.saveSuccessMessage.set(
        this.editingPostulacionId() ? 'Postulacion actualizada.' : 'Postulacion registrada.'
      );
      this.resetPostulacionForm();
      await Promise.all([this.loadPostulaciones(0), this.loadHiringReadyCases(0)]);
      if (this.selectedHiringCase()?.id === postulacion.id) {
        this.selectHiringCase(postulacion);
      }
    } catch (error) {
      this.saveErrorMessage.set(
        this.getErrorMessage(error, 'No se pudo guardar la postulacion.')
      );
    } finally {
      this.isSavingPostulacion.set(false);
    }
  }

  editPostulacion(postulacion: PostulacionResponse): void {
    this.editingPostulacionId.set(postulacion.id);
    this.saveErrorMessage.set('');
    this.saveSuccessMessage.set('');
    this.postulanteForm.reset({
      idOfertaLaboral: postulacion.ofertaLaboral.id,
      origen: postulacion.origen,
      nombres: postulacion.postulante.nombres,
      apellidos: postulacion.postulante.apellidos,
      tipoDocumento: postulacion.postulante.tipoDocumento,
      documento: postulacion.postulante.documento,
      celular: postulacion.postulante.celular,
      fechaNacimiento: postulacion.postulante.fechaNacimiento
    });
  }

  resetPostulacionForm(): void {
    this.editingPostulacionId.set(null);
    this.postulanteForm.reset({
      idOfertaLaboral: 0,
      origen: 'COMPUTRABAJO',
      nombres: '',
      apellidos: '',
      tipoDocumento: 'DNI',
      documento: '',
      celular: '',
      fechaNacimiento: ''
    });
  }

  async loadHiringReadyCases(pageNumber = 0): Promise<void> {
    this.isLoadingHiringReady.set(true);
    this.hiringReadyErrorMessage.set('');

    try {
      const page = await this.withTimeout(
        this.recruitmentService.listarBandejaContratacion(pageNumber)
      );
      this.hiringReadyPage.set(page);
    } catch (error) {
      this.hiringReadyErrorMessage.set(
        this.getErrorMessage(error, 'No fue posible cargar la bandeja de contratación.')
      );
    } finally {
      this.isLoadingHiringReady.set(false);
    }
  }

  async selectHiringCase(postulacion: PostulacionResponse): Promise<void> {
    this.selectedHiringCase.set(postulacion);
    this.linkedPostulacionId.set(postulacion.id);
    this.prefillEmployeeFromHiringCase(postulacion);
    this.prefillContractFromHiringCase(postulacion);
    await this.loadHiringEvents(0);
  }

  async loadHiringEvents(pageNumber = 0): Promise<void> {
    const hiringCase = this.selectedHiringCase();

    if (!hiringCase) {
      this.hiringEventsPage.set(this.emptyPage<EventoResponse>());
      return;
    }

    this.isLoadingHiringEvents.set(true);
    this.hiringEventsErrorMessage.set('');

    try {
      const page = await this.withTimeout(
        this.recruitmentService.listarEventosPostulacion(hiringCase.id, pageNumber)
      );
      this.hiringEventsPage.set(page);
    } catch (error) {
      this.hiringEventsErrorMessage.set(
        this.getErrorMessage(error, 'No se pudieron cargar los eventos de la postulación.')
      );
    } finally {
      this.isLoadingHiringEvents.set(false);
    }
  }

  openEmployeeRegistrationFromHiring(): void {
    this.section.set('empleados');
  }

  prepareBlankEmployee(): void {
    this.linkedPostulacionId.set(null);
    this.selectedHiringCase.set(null);
    this.hiringEventsPage.set(this.emptyPage<EventoResponse>());
    this.resetEmployeeCreateForm();
    this.contractForm.controls.puestoTrabajo.setValue('RECLUTADOR');
  }

  async loadEmployees(pageNumber = 0): Promise<void> {
    this.isLoadingEmployees.set(true);
    this.employeeListErrorMessage.set('');

    try {
      const page = await this.withTimeout(
        this.rrhhService.listarEmpleados(this.buildEmployeeFilters(), pageNumber)
      );
      this.employeesPage.set(page);
    } catch (error) {
      this.employeeListErrorMessage.set(
        this.getErrorMessage(error, 'No fue posible cargar empleados.')
      );
    } finally {
      this.isLoadingEmployees.set(false);
    }
  }

  applyEmployeeFilters(): void {
    void this.loadEmployees(0);
  }

  clearEmployeeFilters(): void {
    this.employeeFilterForm.patchValue({
      q: '',
      dni: '',
      celular: '',
      distrito: '',
      banco: '',
      origen: '',
      estado: '',
      idEmpresaContratista: '',
      universalSearch: '',
      documentoExacto: ''
    });
    void this.loadEmployees(0);
  }

  async searchEmployeeUniversal(): Promise<void> {
    const value = this.employeeFilterForm.controls.universalSearch.getRawValue().trim();

    if (!value) {
      void this.loadEmployees(0);
      return;
    }

    this.isLoadingEmployees.set(true);
    this.employeeListErrorMessage.set('');

    try {
      const page = await this.withTimeout(this.rrhhService.buscarEmpleadoUniversal(value));
      this.employeesPage.set(page);
    } catch (error) {
      this.employeeListErrorMessage.set(
        this.getErrorMessage(error, 'No fue posible ejecutar la búsqueda universal.')
      );
    } finally {
      this.isLoadingEmployees.set(false);
    }
  }

  async searchEmployeeByDocument(): Promise<void> {
    const value = this.employeeFilterForm.controls.documentoExacto.getRawValue().trim();

    if (!value) {
      return;
    }

    this.isLoadingEmployees.set(true);
    this.employeeListErrorMessage.set('');

    try {
      const employee = await this.withTimeout(this.rrhhService.buscarEmpleadoPorDocumento(value));
      this.employeesPage.set({
        content: [employee],
        page: 0,
        size: 1,
        totalElements: 1,
        totalPages: 1
      });
      await this.selectEmployee(employee);
    } catch (error) {
      this.employeeListErrorMessage.set(
        this.getErrorMessage(error, 'No se encontró empleado con ese documento.')
      );
    } finally {
      this.isLoadingEmployees.set(false);
    }
  }

  async registerEmployee(): Promise<void> {
    if (this.employeeCreateForm.invalid) {
      this.employeeCreateForm.markAllAsTouched();
      return;
    }

    this.isCreatingEmployee.set(true);
    this.employeeActionErrorMessage.set('');
    this.employeeActionSuccessMessage.set('');

    try {
      const employee = await this.withTimeout(
        this.rrhhService.registrarEmpleado(this.buildEmployeeCreateRequest())
      );
      this.employeeActionSuccessMessage.set('Empleado registrado. Continúa con el contrato.');
      await Promise.all([this.loadEmployees(0), this.selectEmployee(employee)]);
      this.section.set('contratos');
    } catch (error) {
      this.employeeActionErrorMessage.set(
        this.getErrorMessage(error, 'No se pudo registrar el empleado.')
      );
    } finally {
      this.isCreatingEmployee.set(false);
    }
  }

  async selectEmployee(employee: EmpleadoResponse): Promise<void> {
    this.selectedEmployee.set(employee);
    this.syncEmployeeForms(employee);
    await Promise.all([
      this.loadCurrentContract(),
      this.loadContractHistory(0),
      this.loadEmployeeEvents(0),
      this.loadCurrentSchedule(),
      this.loadScheduleHistory(0)
    ]);
  }

  async submitPersonalUpdate(): Promise<void> {
    const employee = this.selectedEmployee();

    if (!employee) {
      return;
    }

    if (this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      return;
    }

    await this.runEmployeeUpdate(
      this.rrhhService.actualizarDatosPersonales(employee.id, this.buildPersonalRequest()),
      'Datos personales actualizados.'
    );
  }

  async submitContactUpdate(): Promise<void> {
    const employee = this.selectedEmployee();

    if (!employee) {
      return;
    }

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    await this.runEmployeeUpdate(
      this.rrhhService.actualizarDatosContactoUbicacion(employee.id, this.buildContactRequest()),
      'Contacto y ubicación actualizados.'
    );
  }

  async submitFinancialUpdate(): Promise<void> {
    const employee = this.selectedEmployee();

    if (!employee) {
      return;
    }

    if (this.financialForm.invalid) {
      this.financialForm.markAllAsTouched();
      return;
    }

    await this.runEmployeeUpdate(
      this.rrhhService.actualizarDatosFinancieros(employee.id, this.buildFinancialRequest()),
      'Datos financieros actualizados.'
    );
  }

  async submitCorporateUpdate(): Promise<void> {
    const employee = this.selectedEmployee();

    if (!employee) {
      return;
    }

    if (this.corporateForm.invalid) {
      this.corporateForm.markAllAsTouched();
      return;
    }

    await this.runEmployeeUpdate(
      this.rrhhService.actualizarDatosCorporativos(employee.id, this.buildCorporateRequest()),
      'Datos corporativos actualizados.'
    );
  }

  async markSelectedEmployeeAsBlacklist(): Promise<void> {
    const employee = this.selectedEmployee();

    if (!employee) {
      return;
    }

    this.isUpdatingEmployee.set(true);
    this.employeeActionErrorMessage.set('');
    this.employeeActionSuccessMessage.set('');

    try {
      const updated = await this.withTimeout(this.rrhhService.marcarListaNegra(employee.id));
      this.selectedEmployee.set(updated);
      this.syncEmployeeForms(updated);
      this.employeeActionSuccessMessage.set('Empleado marcado en lista negra.');
      await this.loadEmployees(this.currentEmployeesPage());
    } catch (error) {
      this.employeeActionErrorMessage.set(
        this.getErrorMessage(error, 'No fue posible marcar lista negra.')
      );
    } finally {
      this.isUpdatingEmployee.set(false);
    }
  }

  async registerContract(): Promise<void> {
    const employee = this.selectedEmployee();

    if (!employee) {
      this.contractErrorMessage.set('Selecciona un empleado antes de registrar el contrato.');
      return;
    }

    if (this.contractForm.invalid) {
      this.contractForm.markAllAsTouched();
      return;
    }

    this.isRegisteringContract.set(true);
    this.contractErrorMessage.set('');
    this.contractSuccessMessage.set('');

    try {
      await this.withTimeout(
        this.rrhhService.registrarContrato(employee.id, this.buildContractRequest())
      );
      this.contractSuccessMessage.set('Contrato registrado correctamente.');
      await Promise.all([
        this.refreshSelectedEmployee(),
        this.loadCurrentContract(),
        this.loadContractHistory(0),
        this.loadEmployeeEvents(0),
        this.loadHiringReadyCases(0)
      ]);
    } catch (error) {
      this.contractErrorMessage.set(
        this.getErrorMessage(error, 'No se pudo registrar el contrato.')
      );
    } finally {
      this.isRegisteringContract.set(false);
    }
  }

  async loadCurrentContract(): Promise<void> {
    const employee = this.selectedEmployee();

    if (!employee) {
      this.currentContract.set(null);
      return;
    }

    this.isLoadingContracts.set(true);
    this.contractErrorMessage.set('');

    try {
      const contract = await this.withTimeout(this.rrhhService.obtenerContratoVigente(employee.id));
      this.currentContract.set(contract);
      this.closeContractForm.controls.fechaFin.setValue(contract.fechaFin ?? this.getToday());
      this.horarioForm.controls.fechaInicio.setValue(contract.fechaInicio);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.currentContract.set(null);
      } else {
        this.contractErrorMessage.set(
          this.getErrorMessage(error, 'No se pudo cargar el contrato vigente.')
        );
      }
    } finally {
      this.isLoadingContracts.set(false);
    }
  }

  async loadContractHistory(pageNumber = 0): Promise<void> {
    const employee = this.selectedEmployee();

    if (!employee) {
      this.contractHistoryPage.set(this.emptyPage<ContratoResponse>());
      return;
    }

    this.isLoadingContracts.set(true);

    try {
      const page = await this.withTimeout(
        this.rrhhService.listarHistoricoContratos(employee.id, pageNumber)
      );
      this.contractHistoryPage.set(page);
    } catch (error) {
      this.contractErrorMessage.set(
        this.getErrorMessage(error, 'No se pudo cargar el histórico de contratos.')
      );
    } finally {
      this.isLoadingContracts.set(false);
    }
  }

  async closeCurrentContract(): Promise<void> {
    const employee = this.selectedEmployee();

    if (!employee) {
      return;
    }

    if (this.closeContractForm.invalid) {
      this.closeContractForm.markAllAsTouched();
      return;
    }

    this.isClosingContract.set(true);
    this.contractErrorMessage.set('');
    this.contractSuccessMessage.set('');

    try {
      await this.withTimeout(
        this.rrhhService.finalizarContrato(employee.id, this.buildCloseContractRequest())
      );
      this.contractSuccessMessage.set('Contrato finalizado correctamente.');
      await Promise.all([
        this.refreshSelectedEmployee(),
        this.loadCurrentContract(),
        this.loadContractHistory(0),
        this.loadEmployeeEvents(0)
      ]);
    } catch (error) {
      this.contractErrorMessage.set(
        this.getErrorMessage(error, 'No se pudo finalizar el contrato.')
      );
    } finally {
      this.isClosingContract.set(false);
    }
  }

  async registerSchedule(): Promise<void> {
    const employee = this.selectedEmployee();
    const contract = this.currentContract();

    if (!employee || !contract) {
      this.scheduleErrorMessage.set(
        'Necesitas un empleado con contrato vigente antes de registrar horario.'
      );
      return;
    }

    if (this.horarioForm.invalid) {
      this.horarioForm.markAllAsTouched();
      return;
    }

    this.isRegisteringSchedule.set(true);
    this.scheduleErrorMessage.set('');
    this.scheduleSuccessMessage.set('');

    try {
      const schedule = await this.withTimeout(
        this.rrhhService.registrarHorario(
          this.buildScheduleRequest(employee.id, contract.id, contract.modalidad)
        )
      );
      this.registeredSchedule.set(schedule);
      this.currentSchedule.set(schedule);
      this.scheduleSuccessMessage.set('Horario registrado correctamente.');
      this.section.set('eventos');
    } catch (error) {
      this.scheduleErrorMessage.set(
        this.getErrorMessage(error, 'No se pudo registrar el horario.')
      );
    } finally {
      this.isRegisteringSchedule.set(false);
    }
  }

  async loadEmployeeEvents(pageNumber = 0): Promise<void> {
    const employee = this.selectedEmployee();

    if (!employee) {
      this.employeeEventsPage.set(this.emptyPage<EventoEmpleadoResponse>());
      return;
    }

    this.isLoadingEmployeeEvents.set(true);
    this.employeeEventsErrorMessage.set('');

    try {
      const page = await this.withTimeout(
        this.rrhhService.listarEventosEmpleado(employee.id, pageNumber)
      );
      this.employeeEventsPage.set(page);
    } catch (error) {
      this.employeeEventsErrorMessage.set(
        this.getErrorMessage(error, 'No se pudieron cargar los eventos del empleado.')
      );
    } finally {
      this.isLoadingEmployeeEvents.set(false);
    }
  }

  async loadCurrentSchedule(): Promise<void> {
    const employee = this.selectedEmployee();

    if (!employee) {
      this.currentSchedule.set(null);
      return;
    }

    this.isLoadingSchedules.set(true);
    this.scheduleErrorMessage.set('');

    try {
      const schedule = await this.withTimeout(this.rrhhService.obtenerHorarioVigente(employee.id));
      this.currentSchedule.set(schedule);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.currentSchedule.set(null);
      } else {
        this.scheduleErrorMessage.set(
          this.getErrorMessage(error, 'No se pudo cargar el horario vigente.')
        );
      }
    } finally {
      this.isLoadingSchedules.set(false);
    }
  }

  async loadScheduleHistory(pageNumber = 0): Promise<void> {
    const employee = this.selectedEmployee();

    if (!employee) {
      this.scheduleHistoryPage.set(this.emptyPage<HorarioResponse>());
      return;
    }

    this.isLoadingSchedules.set(true);

    try {
      const page = await this.withTimeout(this.rrhhService.listarHistoricoHorarios(employee.id, pageNumber));
      this.scheduleHistoryPage.set(page);
    } catch (error) {
      this.scheduleErrorMessage.set(
        this.getErrorMessage(error, 'No se pudo cargar el historico de horarios.')
      );
    } finally {
      this.isLoadingSchedules.set(false);
    }
  }

  async replaceCurrentSchedule(): Promise<void> {
    const schedule = this.currentSchedule();

    if (!schedule) {
      this.scheduleErrorMessage.set('Selecciona un horario vigente antes de reemplazarlo.');
      return;
    }

    if (this.horarioForm.invalid) {
      this.horarioForm.markAllAsTouched();
      return;
    }

    this.isUpdatingSchedule.set(true);
    this.scheduleErrorMessage.set('');
    this.scheduleSuccessMessage.set('');

    try {
      const updated = await this.withTimeout(
        this.rrhhService.reemplazarHorario(schedule.id, {
          modalidad: schedule.modalidad,
          fechaInicio: this.horarioForm.controls.fechaInicio.getRawValue(),
          compensable: this.horarioForm.controls.compensable.getRawValue() === 'true',
          detalles: this.horarioForm.getRawValue().detalles.map((detalle) => ({
            dia: detalle.dia,
            horaEntrada: detalle.horaEntrada,
            horaSalida: detalle.horaSalida,
            inicioAlmuerzo: detalle.inicioAlmuerzo,
            finAlmuerzo: detalle.finAlmuerzo,
            laborable: detalle.laborable === 'true'
          }))
        })
      );
      this.currentSchedule.set(updated);
      this.scheduleSuccessMessage.set('Horario reemplazado correctamente.');
      await this.loadScheduleHistory(0);
    } catch (error) {
      this.scheduleErrorMessage.set(
        this.getErrorMessage(error, 'No se pudo reemplazar el horario.')
      );
    } finally {
      this.isUpdatingSchedule.set(false);
    }
  }

  async finalizeCurrentSchedule(): Promise<void> {
    const schedule = this.currentSchedule();

    if (!schedule) {
      return;
    }

    if (this.finalizeScheduleForm.invalid) {
      this.finalizeScheduleForm.markAllAsTouched();
      return;
    }

    this.isUpdatingSchedule.set(true);
    this.scheduleErrorMessage.set('');
    this.scheduleSuccessMessage.set('');

    try {
      const updated = await this.withTimeout(
        this.rrhhService.finalizarHorario(schedule.id, this.finalizeScheduleForm.getRawValue())
      );
      this.currentSchedule.set(updated);
      this.scheduleSuccessMessage.set('Horario finalizado correctamente.');
      await this.loadScheduleHistory(0);
    } catch (error) {
      this.scheduleErrorMessage.set(
        this.getErrorMessage(error, 'No se pudo finalizar el horario.')
      );
    } finally {
      this.isUpdatingSchedule.set(false);
    }
  }

  async saveException(): Promise<void> {
    const schedule = this.currentSchedule();

    if (!schedule) {
      return;
    }

    if (this.exceptionForm.invalid) {
      this.exceptionForm.markAllAsTouched();
      return;
    }

    this.isSavingException.set(true);
    this.scheduleErrorMessage.set('');
    this.scheduleSuccessMessage.set('');

    try {
      const raw = this.exceptionForm.getRawValue();
      const request = {
        fecha: raw.fecha,
        tipo: raw.tipo,
        horaEntrada: raw.horaEntrada || null,
        horaSalida: raw.horaSalida || null,
        inicioAlmuerzo: raw.inicioAlmuerzo || null,
        finAlmuerzo: raw.finAlmuerzo || null,
        laborable: raw.laborable === 'true',
        motivo: raw.motivo.trim()
      };

      if (raw.idExcepcion) {
        await this.withTimeout(
          this.rrhhService.actualizarExcepcion(schedule.id, Number(raw.idExcepcion), request)
        );
        this.scheduleSuccessMessage.set('Excepcion actualizada correctamente.');
      } else {
        await this.withTimeout(this.rrhhService.registrarExcepcion(schedule.id, request));
        this.scheduleSuccessMessage.set('Excepcion registrada correctamente.');
      }

      this.resetExceptionForm();
      await this.loadCurrentSchedule();
    } catch (error) {
      this.scheduleErrorMessage.set(
        this.getErrorMessage(error, 'No se pudo guardar la excepcion.')
      );
    } finally {
      this.isSavingException.set(false);
    }
  }

  editException(excepcion: Record<string, unknown>): void {
    this.exceptionForm.reset({
      idExcepcion: String(excepcion['id'] ?? ''),
      fecha: String(excepcion['fecha'] ?? this.getToday()),
      tipo: String(excepcion['tipo'] ?? 'CAMBIO_TURNO'),
      horaEntrada: String(excepcion['horaEntrada'] ?? ''),
      horaSalida: String(excepcion['horaSalida'] ?? ''),
      inicioAlmuerzo: String(excepcion['inicioAlmuerzo'] ?? ''),
      finAlmuerzo: String(excepcion['finAlmuerzo'] ?? ''),
      laborable: String(excepcion['laborable'] ?? true),
      motivo: String(excepcion['motivo'] ?? '')
    });
  }

  async deleteException(idExcepcion: number): Promise<void> {
    const schedule = this.currentSchedule();

    if (!schedule) {
      return;
    }

    this.isDeletingException.set(true);
    this.scheduleErrorMessage.set('');
    this.scheduleSuccessMessage.set('');

    try {
      await this.withTimeout(this.rrhhService.eliminarExcepcion(schedule.id, idExcepcion));
      this.scheduleSuccessMessage.set('Excepcion eliminada correctamente.');
      await this.loadCurrentSchedule();
    } catch (error) {
      this.scheduleErrorMessage.set(
        this.getErrorMessage(error, 'No se pudo eliminar la excepcion.')
      );
    } finally {
      this.isDeletingException.set(false);
    }
  }

  resetExceptionForm(): void {
    this.exceptionForm.reset({
      idExcepcion: '',
      fecha: this.getToday(),
      tipo: 'CAMBIO_TURNO',
      horaEntrada: '09:00',
      horaSalida: '18:00',
      inicioAlmuerzo: '13:00',
      finAlmuerzo: '14:00',
      laborable: 'true',
      motivo: ''
    });
  }

  async registerPayment(): Promise<void> {
    const contract = this.currentContract();

    if (!contract) {
      this.paymentErrorMessage.set('Necesitas un contrato vigente para registrar pago.');
      return;
    }

    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isRegisteringPayment.set(true);
    this.paymentErrorMessage.set('');
    this.paymentSuccessMessage.set('');

    try {
      await this.withTimeout(this.rrhhService.registrarPago(contract.id, this.buildPaymentRequest()));
      this.paymentSuccessMessage.set('Pago registrado correctamente.');
      await this.loadPayments(0);
    } catch (error) {
      this.paymentErrorMessage.set(this.getErrorMessage(error, 'No se pudo registrar el pago.'));
    } finally {
      this.isRegisteringPayment.set(false);
    }
  }

  async loadPayments(pageNumber = 0): Promise<void> {
    this.isLoadingPayments.set(true);
    this.paymentErrorMessage.set('');

    try {
      const raw = this.paymentFilterForm.getRawValue();
      const page = await this.withTimeout(
        this.rrhhService.listarPagos(
          {
            contrato: raw.contrato ? Number(raw.contrato) : this.currentContract()?.id ?? null,
            empleado: raw.empleado ? Number(raw.empleado) : this.selectedEmployee()?.id ?? null,
            desde: raw.desde || null,
            hasta: raw.hasta || null
          },
          pageNumber
        )
      );
      this.paymentsPage.set(page);
    } catch (error) {
      this.paymentErrorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar pagos.'));
    } finally {
      this.isLoadingPayments.set(false);
    }
  }

  async queryCompliance(): Promise<void> {
    if (this.complianceForm.invalid) {
      this.complianceForm.markAllAsTouched();
      return;
    }

    this.isLoadingCompliance.set(true);
    this.complianceErrorMessage.set('');

    try {
      const request = this.buildComplianceRequest();
      const [resumen, detalle, monitor] = await Promise.all([
        this.withTimeout(this.rrhhService.consultarCumplimientoResumen(request)),
        this.withTimeout(this.rrhhService.consultarCumplimientoDetalle(request)),
        this.withTimeout(
          this.rrhhService.consultarMonitorEstados({
            empleadoIds: request.empleadoIds,
            fecha: this.complianceForm.controls.fechaMonitor.getRawValue() || null
          })
        )
      ]);
      this.complianceResumen.set(resumen);
      this.complianceDetalle.set(detalle);
      this.monitorEstados.set(monitor);
    } catch (error) {
      this.complianceErrorMessage.set(
        this.getErrorMessage(error, 'No se pudo consultar cumplimiento.')
      );
    } finally {
      this.isLoadingCompliance.set(false);
    }
  }

  private async runEmployeeUpdate(
    request: Observable<EmpleadoResponse>,
    successMessage: string
  ): Promise<void> {
    this.isUpdatingEmployee.set(true);
    this.employeeActionErrorMessage.set('');
    this.employeeActionSuccessMessage.set('');

    try {
      const updated = await this.withTimeout(request);
      this.selectedEmployee.set(updated);
      this.syncEmployeeForms(updated);
      this.employeeActionSuccessMessage.set(successMessage);
      await this.loadEmployees(this.currentEmployeesPage());
    } catch (error) {
      this.employeeActionErrorMessage.set(
        this.getErrorMessage(error, 'No se pudo actualizar el empleado.')
      );
    } finally {
      this.isUpdatingEmployee.set(false);
    }
  }

  private async refreshSelectedEmployee(): Promise<void> {
    const employee = this.selectedEmployee();

    if (!employee) {
      return;
    }

    try {
      const refreshed = await this.withTimeout(
        this.rrhhService.buscarEmpleadoPorDocumento(employee.numeroDocumento)
      );
      this.selectedEmployee.set(refreshed);
      this.syncEmployeeForms(refreshed);
    } catch {
      // El listado principal se refresca por separado; si esta consulta falla no debe romper el flujo.
    }
  }

  private syncEmployeeForms(employee: EmpleadoResponse): void {
    this.personalForm.reset({
      nombres: employee.nombres,
      apellidos: employee.apellidos,
      tipoDocumento: employee.tipoDocumento,
      numeroDocumento: employee.numeroDocumento,
      nacionalidad: employee.nacionalidad,
      fechaNacimiento: employee.fechaNacimiento,
      estadoCivil: employee.estadoCivil,
      tieneHijos: String(employee.tieneHijos)
    });

    this.contactForm.reset({
      celularPersonal: employee.celularPersonal,
      correoPersonal: employee.correoPersonal,
      distrito: employee.distrito,
      direccion: employee.direccion
    });

    this.financialForm.reset({
      banco: employee.banco,
      cuentaBancaria: employee.cuentaBancaria,
      cuentaInterbancaria: employee.cuentaInterbancaria,
      cuentaPropia: String(employee.cuentaPropia),
      parentesco: employee.parentesco ?? '',
      celularTransferencia: employee.celularTransferencia ?? '',
      idEmpresaContratista: ''
    });

    this.corporateForm.reset({
      celularCorporativo: employee.celularCorporativo ?? '',
      correoCorporativo: employee.correoCorporativo ?? ''
    });

    this.contractForm.controls.puestoTrabajo.setValue('RECLUTADOR');
  }

  private prefillEmployeeFromHiringCase(postulacion: PostulacionResponse): void {
    this.employeeCreateForm.patchValue({
      nombres: postulacion.postulante.nombres,
      apellidos: postulacion.postulante.apellidos,
      tipoDocumento: postulacion.postulante.tipoDocumento,
      numeroDocumento: postulacion.postulante.documento,
      fechaNacimiento: postulacion.postulante.fechaNacimiento,
      celularPersonal: postulacion.postulante.celular,
      origen: postulacion.origen
    });
  }

  private prefillContractFromHiringCase(postulacion: PostulacionResponse): void {
    this.contractForm.patchValue({
      puestoTrabajo: postulacion.ofertaLaboral.puestoObjetivo
    });
  }

  private buildPostulacionFilters(): PostulacionFilters {
    const raw = this.filterForm.getRawValue();

    return {
      etapa: raw.etapa || null,
      estado: raw.estado || null,
      estadoBandeja: raw.estadoBandeja || null
    };
  }

  private buildPostulacionRequest(): PostulacionRequest {
    const raw = this.postulanteForm.getRawValue();

    return {
      idOfertaLaboral: Number(raw.idOfertaLaboral),
      origen: raw.origen,
      postulante: {
        nombres: raw.nombres.trim(),
        apellidos: raw.apellidos.trim(),
        tipoDocumento: raw.tipoDocumento,
        documento: raw.documento.trim(),
        celular: raw.celular.trim(),
        fechaNacimiento: raw.fechaNacimiento
      }
    };
  }

  private buildEmployeeFilters() {
    const raw = this.employeeFilterForm.getRawValue();

    return {
      q: raw.q ? raw.q.trim() : null,
      dni: raw.dni ? raw.dni.trim() : null,
      celular: raw.celular ? raw.celular.trim() : null,
      distrito: raw.distrito || null,
      banco: raw.banco || null,
      origen: raw.origen || null,
      estado: raw.estado || null,
      idEmpresaContratista: raw.idEmpresaContratista ? Number(raw.idEmpresaContratista) : null
    };
  }

  private buildEmployeeCreateRequest(): RegistrarEmpleadoRequest {
    const raw = this.employeeCreateForm.getRawValue();

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

  private buildPersonalRequest(): DatosPersonalesRequest {
    const raw = this.personalForm.getRawValue();

    return {
      nombres: raw.nombres.trim(),
      apellidos: raw.apellidos.trim(),
      tipoDocumento: raw.tipoDocumento,
      numeroDocumento: raw.numeroDocumento.trim(),
      nacionalidad: raw.nacionalidad,
      fechaNacimiento: raw.fechaNacimiento,
      estadoCivil: raw.estadoCivil,
      tieneHijos: raw.tieneHijos === 'true'
    };
  }

  private buildContactRequest(): DatosContactoUbicacionRequest {
    const raw = this.contactForm.getRawValue();

    return {
      celularPersonal: raw.celularPersonal.trim(),
      correoPersonal: raw.correoPersonal.trim(),
      distrito: raw.distrito,
      direccion: raw.direccion.trim()
    };
  }

  private buildFinancialRequest(): DatosFinancierosRequest {
    const raw = this.financialForm.getRawValue();

    return {
      banco: raw.banco,
      cuentaBancaria: raw.cuentaBancaria.trim(),
      cuentaInterbancaria: raw.cuentaInterbancaria.trim(),
      cuentaPropia: raw.cuentaPropia === 'true',
      parentesco: raw.parentesco ? raw.parentesco : null,
      celularTransferencia: raw.celularTransferencia ? raw.celularTransferencia.trim() : null,
      idEmpresaContratista: raw.idEmpresaContratista ? Number(raw.idEmpresaContratista) : null
    };
  }

  private buildCorporateRequest(): DatosContactoCorporativoRequest {
    const raw = this.corporateForm.getRawValue();

    return {
      celularCorporativo: raw.celularCorporativo.trim(),
      correoCorporativo: raw.correoCorporativo.trim()
    };
  }

  private buildContractRequest(): RegistrarContratoRequest {
    const raw = this.contractForm.getRawValue();

    return {
      idPostulacion: this.linkedPostulacionId(),
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

  private buildCloseContractRequest(): CerrarContratoRequest {
    return {
      fechaFin: this.closeContractForm.controls.fechaFin.getRawValue()
    };
  }

  private buildPaymentRequest(): RegistrarPagoRequest {
    const raw = this.paymentForm.getRawValue();

    return {
      fechaInicio: raw.fechaInicio || null,
      fechaFin: raw.fechaFin || null,
      asignacionFamiliar: Number(raw.asignacionFamiliar),
      bonoPuntualidad: raw.bonoPuntualidad ? Number(raw.bonoPuntualidad) : null,
      comisionSemanal: raw.comisionSemanal ? Number(raw.comisionSemanal) : null,
      comisionMensual: raw.comisionMensual ? Number(raw.comisionMensual) : null,
      bonoExtra: raw.bonoExtra ? Number(raw.bonoExtra) : null
    };
  }

  private buildComplianceRequest() {
    const raw = this.complianceForm.getRawValue();
    const employeeIds = raw.empleadoIds
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (!employeeIds.length && this.selectedEmployee()) {
      employeeIds.push(this.selectedEmployee()!.id);
    }

    return {
      empleadoIds: employeeIds,
      desde: raw.desde,
      hasta: raw.hasta
    };
  }

  private buildScheduleRequest(
    employeeId: number,
    contractId: number,
    modalidad: string
  ): RegistrarHorarioRequest {
    const raw = this.horarioForm.getRawValue();

    return {
      idEmpleado: employeeId,
      idContrato: contractId,
      modalidad,
      fechaInicio: raw.fechaInicio,
      compensable: raw.compensable === 'true',
      detalles: raw.detalles.map((detalle) => ({
        dia: detalle.dia,
        horaEntrada: detalle.horaEntrada,
        horaSalida: detalle.horaSalida,
        inicioAlmuerzo: detalle.inicioAlmuerzo,
        finAlmuerzo: detalle.finAlmuerzo,
        laborable: detalle.laborable === 'true'
      }))
    };
  }

  private resetEmployeeCreateForm(): void {
    this.employeeCreateForm.reset({
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
  }

  private buildDefaultScheduleRows() {
    return this.diasSemanaOptions.map((dia) =>
      this.formBuilder.nonNullable.group({
        dia: [dia, [Validators.required]],
        horaEntrada: ['09:00', [Validators.required]],
        horaSalida: ['18:00', [Validators.required]],
        inicioAlmuerzo: ['13:00', [Validators.required]],
        finAlmuerzo: ['14:00', [Validators.required]],
        laborable: [dia === 'SABADO' || dia === 'DOMINGO' ? 'false' : 'true', [Validators.required]]
      })
    );
  }

  private emptyPage<T>(): PageResponse<T> {
    return {
      content: [],
      page: 0,
      size: 8,
      totalElements: 0,
      totalPages: 1
    };
  }

  private async withTimeout<T>(observable: Observable<T>): Promise<T> {
    return await firstValueFrom(observable.pipe(timeout(this.requestTimeoutMs)));
  }

  private getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpErrorResponse) {
      const apiError = error.error as ApiErrorResponse | null;

      if (apiError?.details?.length) {
        return `${apiError.message}: ${apiError.details.join(', ')}`;
      }

      return apiError?.message ?? fallbackMessage;
    }

    return fallbackMessage;
  }

  private getToday(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
