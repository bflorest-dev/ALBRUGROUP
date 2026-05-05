import { HttpErrorResponse } from '@angular/common/http';
import { Component, NgZone, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, switchMap, timeout } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { AdminRrhhService } from '../../services/admin-rrhh.service';
import { ApiErrorResponse } from '../../../../shared/models/api/api-error-response';
import { UsuarioResponse } from '../../../../shared/models/auth/usuario-response';
import { PageResponse } from '../../../../shared/models/common/page-response';
import { EmpleadoResponse } from '../../../../shared/models/rrhh/empleado-response';
import { EmpresaContratistaResponse } from '../../../../shared/models/rrhh/empresa-contratista-response';
import { RegistrarContratoRequest } from '../../../../shared/models/rrhh/registrar-contrato-request';
import { RegistrarEmpleadoRequest } from '../../../../shared/models/rrhh/registrar-empleado-request';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss'
})
export class AdminDashboardPageComponent implements OnInit {
  private readonly requestTimeoutMs = 15000;
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminRrhhService = inject(AdminRrhhService);
  private readonly authService = inject(AuthService);
  private readonly ngZone = inject(NgZone);

  protected readonly documentoOptions = ['DNI', 'CE'];
  protected readonly nacionalidadOptions = ['PERUANO', 'EXTRANJERO'];
  protected readonly estadoCivilOptions = ['SOLTERO', 'CASADO', 'VIUDO', 'DIVORCIADO'];
  protected readonly origenOptions = [
    'COMPUTRABAJO',
    'INDEED',
    'TIKTOK',
    'FACEBOOK',
    'LINKEDIN',
    'REFERIDO'
  ];
  protected readonly distritoOptions = [
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
  protected readonly bancoOptions = [
    'BCP',
    'BBVA',
    'INTERBANK',
    'SCOTIABANK',
    'BANCO_DE_LA_NACION'
  ];
  protected readonly parentescoOptions = [
    'PADRE',
    'MADRE',
    'TIO',
    'ESPOSO',
    'HERMANO',
    'ABUELO',
    'PAREJA',
    'OTRO'
  ];
  protected readonly puestoTrabajoOptions = [
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
  protected readonly regimenOptions = ['RECIBO_POR_HONORARIOS', 'PLANILLA'];
  protected readonly modalidadOptions = ['PART_TIME', 'FULL_TIME', 'SEMI_FULL', 'SUPER_FULL'];
  protected readonly seguroSaludOptions = ['SIS', 'ESSALUD'];
  protected readonly sistemaPensionesOptions = [
    'ONP',
    'AFP_INTEGRA',
    'AFP_PROFUTURO',
    'AFP_HABITAT',
    'PRIMA_AFP'
  ];

  protected readonly empleadoForm = this.formBuilder.nonNullable.group({
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

  protected readonly contratoForm = this.formBuilder.nonNullable.group({
    puestoTrabajo: ['RECLUTADOR', [Validators.required]],
    regimen: ['PLANILLA', [Validators.required]],
    modalidad: ['FULL_TIME', [Validators.required]],
    seguroSalud: ['ESSALUD'],
    sistemaPensiones: ['ONP'],
    sueldoBase: [1130, [Validators.required, Validators.min(0.01)]],
    fechaInicio: [this.getToday(), [Validators.required]],
    fechaFin: ['']
  });

  protected currentStep = 1;
  protected isSubmitting = false;
  protected isLoadingEmployees = false;
  protected submitErrorMessage = '';
  protected employeeListErrorMessage = '';
  protected creationResult: UsuarioResponse | null = null;
  protected createdEmployee: EmpleadoResponse | null = null;
  protected employeesPage: PageResponse<EmpleadoResponse> | null = null;
  protected empresasContratistas: EmpresaContratistaResponse[] = [];
  protected readonly accessByEmployeeId: Record<number, UsuarioResponse | null> = {};
  protected readonly accessErrorByEmployeeId: Record<number, string> = {};
  protected readonly accessLoadingByEmployeeId: Record<number, boolean> = {};

  ngOnInit(): void {
    this.loadEmpresasContratistas();
    this.loadEmployees();
  }

  protected continueToContract(): void {
    if (this.empleadoForm.invalid) {
      this.empleadoForm.markAllAsTouched();
      return;
    }

    this.currentStep = 2;
  }

  protected backToEmployee(): void {
    this.currentStep = 1;
  }

  protected submitPersonalFlow(): void {
    if (this.empleadoForm.invalid) {
      this.currentStep = 1;
      this.empleadoForm.markAllAsTouched();
      return;
    }

    if (this.contratoForm.invalid) {
      this.contratoForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitErrorMessage = '';
    this.creationResult = null;
    this.createdEmployee = null;

    const empleadoRequest = this.buildEmpleadoRequest();
    const contratoRequest = this.buildContratoRequest();

    this.adminRrhhService
      .registrarEmpleado(empleadoRequest)
      .pipe(
        timeout(this.requestTimeoutMs),
        switchMap((empleado) => {
          this.createdEmployee = empleado;

          return this.adminRrhhService
            .registrarContrato(empleado.id, contratoRequest)
            .pipe(
              timeout(this.requestTimeoutMs),
              switchMap(() =>
                this.authService.getUsuarioPorEmpleadoId(empleado.id).pipe(timeout(this.requestTimeoutMs))
              )
            );
        }),
        finalize(() => (this.isSubmitting = false))
      )
      .subscribe({
        next: (usuario) => {
          this.ngZone.run(() => {
            this.creationResult = usuario;
            this.currentStep = 3;
            this.loadEmployees();
          });
        },
        error: (error: HttpErrorResponse) => {
          this.ngZone.run(() => {
            this.submitErrorMessage = this.getErrorMessage(
              error,
              'No se pudo completar el alta de empleado y contrato.'
            );
          });
        }
      });
  }

  protected resetFlow(): void {
    this.currentStep = 1;
    this.creationResult = null;
    this.createdEmployee = null;
    this.submitErrorMessage = '';
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

  protected loadEmployees(pageNumber = 0): void {
    this.isLoadingEmployees = true;
    this.employeeListErrorMessage = '';

    this.adminRrhhService
      .getEmpleados(pageNumber)
      .pipe(timeout(this.requestTimeoutMs))
      .pipe(finalize(() => this.ngZone.run(() => (this.isLoadingEmployees = false))))
      .subscribe({
        next: (page) => {
          this.ngZone.run(() => {
            this.employeesPage = page;
          });
        },
        error: (error: HttpErrorResponse) => {
          this.ngZone.run(() => {
            this.employeeListErrorMessage = this.getErrorMessage(
              error,
              'No fue posible cargar el listado de empleados.'
            );
          });
        }
      });
  }

  protected loadEmpresasContratistas(): void {
    this.adminRrhhService
      .listarEmpresasContratistas()
      .pipe(timeout(this.requestTimeoutMs))
      .subscribe({
        next: (empresas) => {
          this.ngZone.run(() => {
            this.empresasContratistas = empresas;
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.empresasContratistas = [];
          });
        }
      });
  }

  protected loadUserAccess(empleadoId: number): void {
    this.accessLoadingByEmployeeId[empleadoId] = true;
    this.accessErrorByEmployeeId[empleadoId] = '';

    this.authService
      .getUsuarioPorEmpleadoId(empleadoId)
      .pipe(timeout(this.requestTimeoutMs))
      .pipe(finalize(() => this.ngZone.run(() => (this.accessLoadingByEmployeeId[empleadoId] = false))))
      .subscribe({
        next: (usuario) => {
          this.ngZone.run(() => {
            this.accessByEmployeeId[empleadoId] = usuario;
          });
        },
        error: (error: HttpErrorResponse) => {
          this.ngZone.run(() => {
            this.accessByEmployeeId[empleadoId] = null;
            this.accessErrorByEmployeeId[empleadoId] = this.getErrorMessage(
              error,
              'No se pudo consultar el acceso del empleado.'
            );
          });
        }
      });
  }

  protected getHasAccessLoaded(empleadoId: number): boolean {
    return empleadoId in this.accessByEmployeeId || !!this.accessErrorByEmployeeId[empleadoId];
  }

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
}
