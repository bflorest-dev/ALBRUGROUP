import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ContratoResponse } from '../../../../shared/models/rrhh/contrato-response';
import { EmpleadoResponse } from '../../../../shared/models/rrhh/empleado-response';
import { HorarioResponse } from '../../../../shared/models/schedule/horario-response';
import { formatApiErrorMessage } from '../../../../shared/utils/api-error.utils';
import { formatLabel } from '../../../../shared/utils/display-label';
import { esRolDeEquipo, puedeMultiEquipo } from '../../../../shared/constants/multi-team-roles';
import { AdminRrhhService } from '../../../admin/services/admin-rrhh.service';
import { AdminEquipoService, EquipoResponse } from '../../../admin/services/admin-equipo.service';
import { PersonalDirectoryRow } from '../../facades/personal-workspace.facade';
import {
  PersonalAccessService,
  RoleAuditEntry,
  RoleCatalogItem,
  UserRoles
} from '../../services/personal-access.service';

type DrawerSection = 'resumen' | 'contrato' | 'horario' | 'acceso' | 'asistencia';
type DrawerSubview = 'none' | 'editar-datos' | 'confirmar-baja' | 'contrato-form' | 'cerrar-contrato' | 'gestionar-equipo' | 'historial-roles';

@Component({
  selector: 'app-employee-workspace-drawer',
  imports: [DatePipe, FormsModule, ReactiveFormsModule],
  templateUrl: './employee-workspace-drawer.component.html',
  styleUrl: './employee-workspace-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeWorkspaceDrawerComponent {
  private readonly rrhh = inject(AdminRrhhService);
  private readonly equipos = inject(AdminEquipoService);
  private readonly accessService = inject(PersonalAccessService);
  private readonly formBuilder = inject(FormBuilder);
  private activeEmployeeId: number | null = null;

  readonly row = input<PersonalDirectoryRow | null>(null);
  readonly visible = input(false);
  readonly theme = input<'light' | 'dark'>('light');
  readonly canManageRoles = input(false);
  readonly roleCatalog = input<RoleCatalogItem[]>([]);
  readonly teamOptions = input<EquipoResponse[]>([]);

  readonly closed = output<void>();
  readonly employeeChanged = output<void>();
  readonly manageSchedule = output<PersonalDirectoryRow>();
  readonly manageScope = output<PersonalDirectoryRow>();
  readonly openAttendance = output<PersonalDirectoryRow>();
  readonly rolesUpdated = output<UserRoles>();

  protected readonly documentoOptions = ['DNI', 'CE'];
  protected readonly nacionalidadOptions = ['PERUANO', 'EXTRANJERO'];
  protected readonly estadoCivilOptions = ['SOLTERO', 'CASADO', 'VIUDO', 'DIVORCIADO'];
  protected readonly categoriaPersonalOptions = ['ESTRUCTURAL', 'OPERATIVO'];
  protected readonly regimenOptions = ['RECIBO_POR_HONORARIOS', 'PLANILLA'];
  protected readonly modalidadOptions = ['PART_TIME', 'FULL_TIME', 'SEMI_FULL', 'SUPER_FULL'];
  protected readonly seguroSaludOptions = ['SIS', 'ESSALUD'];
  protected readonly sistemaPensionesOptions = ['ONP', 'AFP_INTEGRA', 'AFP_PROFUTURO', 'AFP_HABITAT', 'PRIMA_AFP'];

  protected readonly section = signal<DrawerSection>('resumen');
  protected readonly subview = signal<DrawerSubview>('none');
  protected readonly employeeDetails = signal<EmpleadoResponse | null>(null);
  protected readonly contract = signal<ContratoResponse | null>(null);
  protected readonly contractHistory = signal<ContratoResponse[]>([]);
  protected readonly schedule = signal<HorarioResponse | null>(null);
  protected readonly isLoadingEmployment = signal(false);
  protected readonly isLoadingEmployee = signal(false);
  protected readonly isSavingPersonal = signal(false);
  protected readonly isDismissing = signal(false);
  protected readonly isSavingContract = signal(false);
  protected readonly isClosingContract = signal(false);
  protected readonly isSavingTeam = signal(false);
  protected readonly actionError = signal('');
  protected readonly actionSuccess = signal('');
  protected readonly rolePrincipal = signal('');
  protected readonly secondaryRoles = signal<string[]>([]);
  protected readonly roleAudit = signal<RoleAuditEntry[]>([]);
  protected readonly isSavingRoles = signal(false);
  protected readonly roleError = signal('');
  protected readonly roleSuccess = signal('');
  protected readonly teamSelectedId = signal(0);
  protected readonly teamSelectedIds = signal<number[]>([]);
  protected readonly teamError = signal('');

  protected readonly personalForm = this.formBuilder.nonNullable.group({
    nombres: ['', [Validators.required]],
    apellidos: ['', [Validators.required]],
    tipoDocumento: ['DNI', [Validators.required]],
    numeroDocumento: ['', [Validators.required]],
    nacionalidad: ['PERUANO', [Validators.required]],
    fechaNacimiento: ['', [Validators.required]],
    estadoCivil: ['SOLTERO', [Validators.required]],
    tieneHijos: [false, [Validators.required]]
  });

  protected readonly contractForm = this.formBuilder.nonNullable.group({
    categoriaPersonal: ['ESTRUCTURAL', [Validators.required]],
    regimen: ['PLANILLA', [Validators.required]],
    modalidad: ['FULL_TIME', [Validators.required]],
    seguroSalud: ['ESSALUD'],
    sistemaPensiones: ['ONP'],
    sueldoBase: [1130, [Validators.required, Validators.min(0.01)]],
    fechaInicio: [this.today(), [Validators.required]],
    fechaFinHabilitada: [false],
    fechaFin: ['']
  });

  protected readonly closeContractForm = this.formBuilder.nonNullable.group({
    fechaFin: [this.today(), [Validators.required]]
  });

  constructor() {
    effect(() => {
      const row = this.row();
      if (!row) {
        this.activeEmployeeId = null;
        return;
      }
      if (this.activeEmployeeId === row.employee.idEmpleado) return;

      this.activeEmployeeId = row.employee.idEmpleado;
      this.section.set('resumen');
      this.subview.set('none');
      this.employeeDetails.set(null);
      this.rolePrincipal.set(row.access?.rolPrincipal ?? '');
      this.secondaryRoles.set(row.access?.rolesSecundarios ?? []);
      this.roleAudit.set([]);
      this.clearActionFeedback();
      this.roleError.set('');
      this.roleSuccess.set('');
      void Promise.all([
        this.loadEmployeeDetails(row),
        this.loadEmployment(row.employee.idEmpleado),
        this.loadContractHistory(row.employee.idEmpleado)
      ]);
    });
  }

  protected setSection(section: DrawerSection): void {
    this.section.set(section);
    this.subview.set('none');
    this.clearActionFeedback();
    if (section === 'acceso' && this.canManageRoles() && !this.roleAudit().length) {
      const employeeId = this.row()?.employee.idEmpleado;
      if (employeeId) void this.loadAudit(employeeId);
    }
  }

  protected close(): void {
    if (this.isBusy()) return;
    this.closed.emit();
  }

  protected isBusy(): boolean {
    return this.isSavingPersonal() || this.isDismissing() || this.isSavingContract() || this.isClosingContract() || this.isSavingTeam() || this.isSavingRoles();
  }

  protected canManageTeam(row: PersonalDirectoryRow): boolean {
    if (!this.canManageRoles()) return false;
    return [row.primaryRole, ...row.secondaryRoles].some((role) => esRolDeEquipo(role));
  }

  protected canManageProviderScope(row: PersonalDirectoryRow): boolean {
    if (!this.canManageRoles()) return false;
    return [row.primaryRole, ...row.secondaryRoles].some((role) => [
      'ASESOR_BACKOFFICE', 'SUPERVISOR_BACKOFFICE', 'MONITOR',
      'ASESOR_POSTVENTA', 'SUPERVISOR_POSTVENTA'
    ].includes(role));
  }

  protected canSelectMultipleTeams(row: PersonalDirectoryRow): boolean {
    const teamRoles = [row.primaryRole, ...row.secondaryRoles].filter((role) => esRolDeEquipo(role));
    return teamRoles.length > 0 && teamRoles.every((role) => puedeMultiEquipo(role));
  }

  protected fullName(): string {
    const employee = this.row()?.employee;
    return employee ? `${employee.nombres} ${employee.apellidos}`.trim() : '';
  }

  protected label(value: string | null | undefined): string {
    return formatLabel(value);
  }

  protected labels(values: string[]): string {
    return values.map((value) => formatLabel(value)).join(', ');
  }

  protected formatMoney(value: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
  }

  protected openPersonalEdit(): void {
    const employee = this.employeeDetails();
    if (!employee) {
      this.actionError.set('Aún no se pudieron cargar los datos completos del empleado. Vuelve a intentarlo.');
      return;
    }
    this.personalForm.reset({
      nombres: employee.nombres,
      apellidos: employee.apellidos,
      tipoDocumento: employee.tipoDocumento,
      numeroDocumento: employee.numeroDocumento,
      nacionalidad: employee.nacionalidad,
      fechaNacimiento: employee.fechaNacimiento,
      estadoCivil: employee.estadoCivil,
      tieneHijos: employee.tieneHijos
    });
    this.clearActionFeedback();
    this.subview.set('editar-datos');
  }

  protected normalizeDocument(value: string): void {
    const normalized = value.replace(/\D/g, '').slice(0, 15);
    if (this.personalForm.controls.numeroDocumento.value !== normalized) {
      this.personalForm.controls.numeroDocumento.setValue(normalized);
    }
  }

  protected async submitPersonalEdit(): Promise<void> {
    const row = this.row();
    if (!row) return;
    if (this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      this.actionError.set('Completa los campos obligatorios antes de guardar.');
      return;
    }
    const raw = this.personalForm.getRawValue();
    this.isSavingPersonal.set(true);
    this.clearActionFeedback();
    try {
      const updated = await firstValueFrom(this.rrhh.actualizarDatosPersonales(row.employee.idEmpleado, {
        nombres: raw.nombres.trim(),
        apellidos: raw.apellidos.trim(),
        tipoDocumento: raw.tipoDocumento,
        numeroDocumento: raw.numeroDocumento.trim(),
        nacionalidad: raw.nacionalidad,
        fechaNacimiento: raw.fechaNacimiento,
        estadoCivil: raw.estadoCivil,
        tieneHijos: raw.tieneHijos
      }));
      this.employeeDetails.set(updated);
      this.subview.set('none');
      this.actionSuccess.set('Datos personales actualizados.');
      this.employeeChanged.emit();
    } catch (error) {
      this.actionError.set(formatApiErrorMessage(error as HttpErrorResponse, 'No se pudieron actualizar los datos personales.'));
    } finally {
      this.isSavingPersonal.set(false);
    }
  }

  protected openDismissConfirmation(): void {
    this.clearActionFeedback();
    this.subview.set('confirmar-baja');
  }

  protected async confirmDismiss(): Promise<void> {
    const row = this.row();
    if (!row || !this.canManageRoles()) return;
    this.isDismissing.set(true);
    this.clearActionFeedback();
    try {
      await firstValueFrom(this.rrhh.darDeBaja(row.employee.idEmpleado));
      this.employeeChanged.emit();
      this.closed.emit();
    } catch (error) {
      this.actionError.set(formatApiErrorMessage(error as HttpErrorResponse, 'No se pudo completar la baja. Intenta nuevamente.'));
    } finally {
      this.isDismissing.set(false);
    }
  }

  protected openContractForm(): void {
    const current = this.contract();
    this.contractForm.reset({
      categoriaPersonal: current?.categoriaPersonal ?? 'ESTRUCTURAL',
      regimen: current?.regimen ?? 'PLANILLA',
      modalidad: current?.modalidad ?? 'FULL_TIME',
      seguroSalud: current?.seguroSalud ?? 'ESSALUD',
      sistemaPensiones: current?.sistemaPensiones ?? 'ONP',
      sueldoBase: current?.sueldoBase ?? 1130,
      fechaInicio: this.today(),
      fechaFinHabilitada: false,
      fechaFin: ''
    });
    this.clearActionFeedback();
    this.subview.set('contrato-form');
  }

  protected openTeamManagement(): void {
    const row = this.row();
    if (!row || !this.canManageTeam(row)) return;
    this.teamSelectedId.set(row.teamIds[0] ?? 0);
    this.teamSelectedIds.set([...row.teamIds]);
    this.teamError.set('');
    this.clearActionFeedback();
    this.subview.set('gestionar-equipo');
  }

  protected closeTeamManagement(): void {
    this.teamError.set('');
    this.subview.set('none');
  }

  protected setTeamSelectedId(value: string | number | null): void {
    this.teamSelectedId.set(Number(value) || 0);
  }

  protected toggleTeam(teamId: number, selected: boolean): void {
    const current = new Set(this.teamSelectedIds());
    if (selected) current.add(teamId); else current.delete(teamId);
    this.teamSelectedIds.set([...current].sort((left, right) => left - right));
  }

  protected isTeamSelected(teamId: number): boolean {
    return this.teamSelectedIds().includes(teamId);
  }

  protected async saveTeamManagement(): Promise<void> {
    const row = this.row();
    if (!row || !this.canManageTeam(row)) return;
    const teamIds = this.canSelectMultipleTeams(row)
      ? [...new Set(this.teamSelectedIds())]
      : this.teamSelectedId() > 0 ? [this.teamSelectedId()] : [];
    this.isSavingTeam.set(true);
    this.teamError.set('');
    this.clearActionFeedback();
    try {
      await firstValueFrom(this.equipos.asignarEquiposAEmpleado(row.employee.idEmpleado, teamIds));
      this.subview.set('none');
      this.actionSuccess.set(teamIds.length ? 'Equipo actualizado.' : 'El empleado quedó sin equipo.');
      this.employeeChanged.emit();
    } catch (error) {
      this.teamError.set(formatApiErrorMessage(error as HttpErrorResponse, 'No se pudo actualizar el equipo. Revisa las reglas del rol.'));
    } finally {
      this.isSavingTeam.set(false);
    }
  }

  protected isPlanilla(): boolean {
    return this.contractForm.controls.regimen.value === 'PLANILLA';
  }

  protected hasContractEndDate(): boolean {
    return this.contractForm.controls.fechaFinHabilitada.value;
  }

  protected toggleContractEndDate(enabled: boolean): void {
    this.contractForm.controls.fechaFinHabilitada.setValue(enabled);
    if (!enabled) this.contractForm.controls.fechaFin.setValue('');
  }

  protected async submitContract(): Promise<void> {
    const row = this.row();
    if (!row) return;
    if (this.contractForm.invalid || (this.hasContractEndDate() && !this.contractForm.controls.fechaFin.value)) {
      this.contractForm.markAllAsTouched();
      this.actionError.set('Completa los datos obligatorios del contrato.');
      return;
    }
    const raw = this.contractForm.getRawValue();
    this.isSavingContract.set(true);
    this.clearActionFeedback();
    try {
      const created = await firstValueFrom(this.rrhh.registrarContrato(row.employee.idEmpleado, {
        categoriaPersonal: raw.categoriaPersonal as 'ESTRUCTURAL' | 'OPERATIVO',
        regimen: raw.regimen,
        modalidad: raw.modalidad,
        seguroSalud: raw.regimen === 'PLANILLA' ? raw.seguroSalud || null : null,
        sistemaPensiones: raw.regimen === 'PLANILLA' ? raw.sistemaPensiones || null : null,
        sueldoBase: Number(raw.sueldoBase),
        fechaInicio: raw.fechaInicio,
        fechaFin: raw.fechaFinHabilitada && raw.fechaFin ? raw.fechaFin : null
      }));
      this.contract.set(created);
      await this.loadContractHistory(row.employee.idEmpleado);
      this.subview.set('none');
      this.actionSuccess.set('Contrato registrado. El horario continúa siendo una gestión independiente.');
      this.employeeChanged.emit();
    } catch (error) {
      this.actionError.set(formatApiErrorMessage(error as HttpErrorResponse, 'No se pudo registrar el contrato.'));
    } finally {
      this.isSavingContract.set(false);
    }
  }

  protected openCloseContract(): void {
    this.closeContractForm.reset({ fechaFin: this.today() });
    this.clearActionFeedback();
    this.subview.set('cerrar-contrato');
  }

  protected async confirmCloseContract(): Promise<void> {
    const row = this.row();
    if (!row || this.closeContractForm.invalid) return;
    this.isClosingContract.set(true);
    this.clearActionFeedback();
    try {
      await firstValueFrom(this.rrhh.finalizarContrato(row.employee.idEmpleado, this.closeContractForm.getRawValue()));
      await this.loadContractHistory(row.employee.idEmpleado);
      this.employeeChanged.emit();
      this.closed.emit();
    } catch (error) {
      this.actionError.set(formatApiErrorMessage(error as HttpErrorResponse, 'No se pudo finalizar el contrato.'));
    } finally {
      this.isClosingContract.set(false);
    }
  }

  protected closeSubview(): void {
    this.subview.set('none');
    this.clearActionFeedback();
  }

  protected openRoleHistory(): void {
    this.subview.set('historial-roles');
  }

  protected toggleSecondaryRole(role: string, selected: boolean): void {
    const current = new Set(this.secondaryRoles());
    if (selected) current.add(role); else current.delete(role);
    current.delete(this.rolePrincipal());
    this.secondaryRoles.set([...current].sort());
  }

  protected changePrincipal(role: string): void {
    this.rolePrincipal.set(role);
    this.secondaryRoles.update((roles) => roles.filter((item) => item !== role));
  }

  protected isSecondarySelected(role: string): boolean {
    return this.secondaryRoles().includes(role);
  }

  protected async saveRoles(): Promise<void> {
    const row = this.row();
    const principal = this.rolePrincipal();
    if (!row || !principal) {
      this.roleError.set('Selecciona un rol principal.');
      return;
    }
    this.isSavingRoles.set(true);
    this.roleError.set('');
    this.roleSuccess.set('');
    try {
      const updated = await firstValueFrom(
        this.accessService.updateRoles(row.employee.idEmpleado, principal, this.secondaryRoles())
      );
      this.rolesUpdated.emit(updated);
      this.roleSuccess.set('Roles actualizados. Las sesiones anteriores fueron cerradas.');
      await this.loadAudit(row.employee.idEmpleado);
    } catch (error) {
      this.roleError.set(formatApiErrorMessage(error as HttpErrorResponse, 'No se pudieron actualizar los roles. Revisa las reglas de equipos.'));
    } finally {
      this.isSavingRoles.set(false);
    }
  }

  protected scheduleSummary(): string {
    const schedule = this.schedule();
    const workingDays = schedule?.detalles?.filter((detail) => detail.laborable) ?? [];
    if (!workingDays.length) return 'Pendiente de asignación';
    const ranges = [...new Set(workingDays.map((detail) => `${detail.horaEntrada}–${detail.horaSalida}`))];
    return ranges.length === 1 ? ranges[0] : 'Horario variable';
  }

  private async loadEmployeeDetails(row: PersonalDirectoryRow): Promise<void> {
    this.isLoadingEmployee.set(true);
    try {
      this.employeeDetails.set(await firstValueFrom(this.rrhh.getEmpleadoPorDocumento(row.employee.numeroDocumento)));
    } catch {
      this.employeeDetails.set(null);
    } finally {
      this.isLoadingEmployee.set(false);
    }
  }

  private async loadEmployment(employeeId: number): Promise<void> {
    this.isLoadingEmployment.set(true);
    const [contract, schedule] = await Promise.allSettled([
      firstValueFrom(this.rrhh.getContratoVigente(employeeId)),
      firstValueFrom(this.rrhh.getHorarioVigente(employeeId))
    ]);
    this.contract.set(contract.status === 'fulfilled' ? contract.value : null);
    this.schedule.set(schedule.status === 'fulfilled' ? schedule.value : null);
    this.isLoadingEmployment.set(false);
  }

  private async loadContractHistory(employeeId: number): Promise<void> {
    try {
      const page = await firstValueFrom(this.rrhh.listarContratos(employeeId));
      this.contractHistory.set(page.content);
    } catch {
      this.contractHistory.set([]);
    }
  }

  private async loadAudit(employeeId: number): Promise<void> {
    try {
      const page = await firstValueFrom(this.accessService.getRoleAudit(employeeId));
      this.roleAudit.set(page.content);
    } catch {
      this.roleAudit.set([]);
    }
  }

  private clearActionFeedback(): void {
    this.actionError.set('');
    this.actionSuccess.set('');
  }

  private today(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }
}
