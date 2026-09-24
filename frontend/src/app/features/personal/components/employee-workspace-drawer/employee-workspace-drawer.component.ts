import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ContratoResponse } from '../../../../shared/models/rrhh/contrato-response';
import { EmpleadoResponse } from '../../../../shared/models/rrhh/empleado-response';
import { HorarioResponse } from '../../../../shared/models/schedule/horario-response';
import { AjusteJornadaRequest, RegistrarAjusteV2Request, RazonAjuste } from '../../../../shared/models/schedule/jornada-efectiva-response';
import { TipoDiaNoLaborable } from '../../../../shared/models/schedule/dia-no-laborable-request';
import { formatApiErrorMessage } from '../../../../shared/utils/api-error.utils';
import { formatLabel } from '../../../../shared/utils/display-label';
import { esRolDeEquipo, puedeMultiEquipo, PROVIDER_SCOPED_ROLES } from '../../../../shared/constants/multi-team-roles';
import { AdminRrhhService } from '../../../admin/services/admin-rrhh.service';
import { AdminEquipoService, EquipoResponse, ProveedorLite } from '../../../admin/services/admin-equipo.service';
import { PersonalDirectoryRow } from '../../facades/personal-workspace.facade';
import { PersonalScheduleFacade } from '../../facades/personal-schedule.facade';
import { ScheduleWeekEditorComponent } from '../../../../shared/components/schedule-week-editor/schedule-week-editor.component';
import { ScheduleExtensionTimelineComponent } from '../../../../shared/components/schedule-extension-timeline/schedule-extension-timeline.component';
import { ScheduleShiftEditorComponent } from '../../../../shared/components/schedule-shift-editor/schedule-shift-editor.component';
import { LunchDayEditorComponent } from '../../../../shared/components/lunch-day-editor/lunch-day-editor.component';
import { SessionService } from '../../../../core/services/session.service';
import { PersonalAttendancePanelComponent } from '../personal-attendance-panel/personal-attendance-panel.component';
import { PersonalAttendanceFacade } from '../../facades/personal-attendance.facade';
import {
  PersonalAccessService,
  RoleAuditEntry,
  RoleCatalogItem,
  UserRoles
} from '../../services/personal-access.service';

type DrawerSection = 'resumen' | 'contrato' | 'roles' | 'horario' | 'asistencia';
type DrawerSubview = 'none' | 'editar-datos' | 'confirmar-baja' | 'contrato-form' | 'cerrar-contrato' | 'gestionar-equipo' | 'gestionar-proveedores' | 'historial-roles' | 'editar-horario' | 'ajuste-extra' | 'ajuste-compensacion' | 'ajuste-corrimiento' | 'ajuste-jornada-extra' | 'ajuste-compensar-falta' | 'ajuste-almuerzo' | 'ajuste-dia-libre';
type DayAdjustmentSubview = Exclude<DrawerSubview, 'none' | 'editar-datos' | 'confirmar-baja' | 'contrato-form' | 'cerrar-contrato' | 'gestionar-equipo' | 'gestionar-proveedores' | 'historial-roles' | 'editar-horario'>;

export interface DrawerScopeCapabilities {
  team: boolean;
  provider: boolean;
}

export function scopeCapabilitiesForRoles(roles: string[]): DrawerScopeCapabilities {
  return {
    team: roles.some((role) => esRolDeEquipo(role)),
    provider: roles.some((role) => Boolean(PROVIDER_SCOPED_ROLES[role]))
  };
}

@Component({
  selector: 'app-employee-workspace-drawer',
  imports: [DatePipe, FormsModule, ReactiveFormsModule, ScheduleWeekEditorComponent, ScheduleExtensionTimelineComponent, ScheduleShiftEditorComponent, LunchDayEditorComponent, PersonalAttendancePanelComponent],
  providers: [PersonalScheduleFacade, PersonalAttendanceFacade],
  templateUrl: './employee-workspace-drawer.component.html',
  styleUrl: './employee-workspace-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeWorkspaceDrawerComponent {
  private readonly rrhh = inject(AdminRrhhService);
  private readonly equipos = inject(AdminEquipoService);
  private readonly accessService = inject(PersonalAccessService);
  private readonly session = inject(SessionService);
  protected readonly scheduleFacade = inject(PersonalScheduleFacade);
  private readonly formBuilder = inject(FormBuilder);
  private activeEmployeeId: number | null = null;

  readonly row = input<PersonalDirectoryRow | null>(null);
  readonly visible = input(false);
  readonly theme = input<'light' | 'dark'>('light');
  readonly canManageRoles = input(false);
  readonly roleCatalog = input<RoleCatalogItem[]>([]);
  readonly teamOptions = input<EquipoResponse[]>([]);
  readonly providerOptions = input<ProveedorLite[]>([]);
  readonly providerLoadError = input('');

  readonly closed = output<void>();
  readonly employeeChanged = output<void>();
  readonly manageSchedule = output<PersonalDirectoryRow>();
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
  protected readonly schedule = this.scheduleFacade.schedule;
  protected readonly isLoadingEmployment = signal(false);
  protected readonly isLoadingEmployee = signal(false);
  protected readonly isSavingPersonal = signal(false);
  protected readonly isDismissing = signal(false);
  protected readonly isSavingContract = signal(false);
  protected readonly isClosingContract = signal(false);
  protected readonly isSavingTeam = signal(false);
  protected readonly isSavingProviders = signal(false);
  protected readonly actionError = signal('');
  protected readonly actionSuccess = signal('');
  protected readonly rolePrincipal = signal('');
  protected readonly secondaryRoles = signal<string[]>([]);
  private readonly persistedRolePrincipal = signal('');
  private readonly persistedSecondaryRoles = signal<string[]>([]);
  protected readonly roleAudit = signal<RoleAuditEntry[]>([]);
  protected readonly isSavingRoles = signal(false);
  protected readonly roleError = signal('');
  protected readonly roleSuccess = signal('');
  protected readonly teamSelectedId = signal(0);
  protected readonly teamSelectedIds = signal<number[]>([]);
  protected readonly teamError = signal('');
  protected readonly providerSelectedIds = signal<number[]>([]);
  protected readonly providerError = signal('');
  protected readonly adjustmentSubview = computed<DayAdjustmentSubview | null>(() => {
    const current = this.subview();
    return current.startsWith('ajuste-') ? current as DayAdjustmentSubview : null;
  });
  protected readonly adjustmentDate = this.scheduleFacade.adjustmentDate;
  protected readonly adjustmentJornada = this.scheduleFacade.adjustmentJornada;
  protected readonly adjustmentReport = this.scheduleFacade.adjustmentReport;
  protected readonly isLoadingAdjustment = this.scheduleFacade.isLoadingAdjustment;
  protected readonly isSavingAdjustment = this.scheduleFacade.isSavingAdjustment;
  protected readonly adjustmentError = this.scheduleFacade.adjustmentError;
  protected readonly adjustmentReportError = this.scheduleFacade.adjustmentReportError;
  protected readonly adjustmentSuccess = this.scheduleFacade.adjustmentSuccess;
  protected readonly adjustmentExtraEntrada = signal('09:00');
  protected readonly adjustmentExtraSalida = signal('18:00');
  protected readonly adjustmentExtraMotivo = signal('');
  protected readonly adjustmentLunchDate = signal(this.today());
  protected readonly adjustmentDayOffDate = signal(this.today());
  protected readonly adjustmentDayOffType = signal<TipoDiaNoLaborable>('FERIADO');
  protected readonly adjustmentDayOffGlobal = signal(false);
  protected readonly adjustmentDayOffReason = signal('');
  protected readonly tipoDiaNoLaborableOptions: { label: string; value: TipoDiaNoLaborable }[] = [
    { label: 'Feriado', value: 'FERIADO' },
    { label: 'Vacaciones', value: 'VACACIONES' },
    { label: 'Permiso', value: 'PERMISO' },
    { label: 'Descanso de equipo', value: 'DESCANSO_EQUIPO' }
  ];

  @ViewChild(ScheduleExtensionTimelineComponent) private extensionEditor?: ScheduleExtensionTimelineComponent;
  @ViewChild(ScheduleShiftEditorComponent) private shiftEditor?: ScheduleShiftEditorComponent;
  @ViewChild(LunchDayEditorComponent) private lunchEditor?: LunchDayEditorComponent;

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
      this.scheduleFacade.reset();
      this.rolePrincipal.set(row.access?.rolPrincipal ?? '');
      this.secondaryRoles.set([...(row.access?.rolesSecundarios ?? [])].sort());
      this.persistedRolePrincipal.set(row.access?.rolPrincipal ?? '');
      this.persistedSecondaryRoles.set([...(row.access?.rolesSecundarios ?? [])].sort());
      this.roleAudit.set([]);
      this.clearActionFeedback();
      this.roleError.set('');
      this.roleSuccess.set('');
      this.providerSelectedIds.set([...row.providerIds]);
      this.providerError.set('');
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
    if (section === 'roles' && this.canManageRoles() && !this.roleAudit().length) {
      const employeeId = this.row()?.employee.idEmpleado;
      if (employeeId) void this.loadAudit(employeeId);
    }
  }

  protected close(): void {
    if (this.isBusy()) return;
    this.closed.emit();
  }

  protected isBusy(): boolean {
    return this.isSavingPersonal() || this.isDismissing() || this.isSavingContract() || this.isClosingContract() || this.isSavingTeam() || this.isSavingProviders() || this.isSavingRoles() || this.scheduleFacade.isSaving() || this.scheduleFacade.isApplyingCorrection() || this.isSavingAdjustment();
  }

  protected canManageTeam(row?: PersonalDirectoryRow | null): boolean {
    if (!this.canManageRoles()) return false;
    const roles = row ? [row.primaryRole, ...row.secondaryRoles] : this.selectedRoles();
    return scopeCapabilitiesForRoles(roles).team;
  }

  protected canManageProviderScope(row?: PersonalDirectoryRow | null): boolean {
    if (!this.canManageRoles()) return false;
    const roles = row ? [row.primaryRole, ...row.secondaryRoles] : this.selectedRoles();
    return scopeCapabilitiesForRoles(roles).provider;
  }

  protected canSelectMultipleTeams(row?: PersonalDirectoryRow | null): boolean {
    const roles = row ? [row.primaryRole, ...row.secondaryRoles] : this.selectedRoles();
    const teamRoles = roles.filter((role) => esRolDeEquipo(role));
    return teamRoles.length > 0 && teamRoles.every((role) => puedeMultiEquipo(role));
  }

  protected rolesDirty(): boolean {
    return this.rolePrincipal() !== this.persistedRolePrincipal()
      || this.secondaryRoles().join('|') !== this.persistedSecondaryRoles().join('|');
  }

  protected selectedRoles(): string[] {
    return [this.rolePrincipal(), ...this.secondaryRoles()].filter(Boolean);
  }

  protected hasTeamScopeForSelectedRoles(): boolean {
    return this.canManageTeam();
  }

  protected hasProviderScopeForSelectedRoles(): boolean {
    return this.canManageProviderScope();
  }

  protected scopeActionsDisabled(): boolean {
    return this.rolesDirty() || this.isSavingRoles();
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
    if (!row || !this.hasTeamScopeForSelectedRoles() || this.scopeActionsDisabled()) return;
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
    if (!row || !this.hasTeamScopeForSelectedRoles() || this.scopeActionsDisabled()) return;
    const teamIds = this.canSelectMultipleTeams()
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

  protected openScheduleEditor(schedule: HorarioResponse | null = this.schedule()): void {
    if (!this.contract()) return;
    this.scheduleFacade.openEditor(schedule);
    this.clearActionFeedback();
    this.subview.set('editar-horario');
  }

  protected closeScheduleEditor(): void {
    this.scheduleFacade.closeEditor();
    this.subview.set('none');
  }

  protected selectScheduleHistory(schedule: HorarioResponse): void {
    this.openScheduleEditor(schedule);
  }

  protected async saveSchedule(): Promise<void> {
    const saved = await this.scheduleFacade.save();
    if (!saved) return;
    this.subview.set('none');
    this.actionSuccess.set(this.scheduleFacade.success());
    this.employeeChanged.emit();
  }

  protected cancelScheduleCorrection(): void {
    this.scheduleFacade.cancelCorrection();
  }

  protected async applyScheduleCorrection(action: 'today' | 'tomorrow' | 'today-and-tomorrow' | 'custom'): Promise<void> {
    const applied = await this.scheduleFacade.applyCorrection(action);
    if (!applied) return;
    this.subview.set('none');
    this.actionSuccess.set(this.scheduleFacade.success());
    this.employeeChanged.emit();
  }

  protected canCorrimientoCompensable(): boolean {
    return (this.session.session()?.roles ?? []).includes('ADMINISTRADOR');
  }

  protected canCorrimientoJustificada(): boolean {
    const roles = this.session.session()?.roles ?? [];
    return roles.includes('ADMINISTRADOR') || roles.includes('RRHH');
  }

  protected openDayAdjustment(view: DayAdjustmentSubview): void {
    if (!this.scheduleFacade.canMutateOperationalData()) return;
    const base = this.adjustmentBaseTimes();
    this.adjustmentExtraEntrada.set(base.entrada);
    this.adjustmentExtraSalida.set(base.salida);
    this.adjustmentExtraMotivo.set(view === 'ajuste-compensar-falta' ? 'Compensación de falta' : '');
    this.adjustmentLunchDate.set(this.adjustmentDate());
    this.adjustmentDayOffDate.set(this.adjustmentDate());
    this.adjustmentDayOffType.set('FERIADO');
    this.adjustmentDayOffGlobal.set(false);
    this.adjustmentDayOffReason.set('');
    this.clearActionFeedback();
    this.subview.set(view);
    void this.scheduleFacade.loadDayAdjustment(this.row()?.employee.idEmpleado, this.adjustmentDate());
  }

  protected closeDayAdjustment(): void {
    this.subview.set('none');
    this.scheduleFacade.adjustmentError.set('');
    this.scheduleFacade.adjustmentReportError.set('');
  }

  protected onAdjustmentDateChange(value: string): void {
    if (!value) return;
    void this.scheduleFacade.loadDayAdjustment(this.row()?.employee.idEmpleado, value);
  }

  protected adjustmentTitle(): string {
    switch (this.subview()) {
      case 'ajuste-extra': return 'Agregar horas extra';
      case 'ajuste-compensacion': return 'Compensar horas';
      case 'ajuste-corrimiento': return 'Correr horario';
      case 'ajuste-jornada-extra': return 'Habilitar jornada en día libre';
      case 'ajuste-compensar-falta': return 'Compensar falta con día libre';
      case 'ajuste-almuerzo': return 'Modificar almuerzo del día';
      case 'ajuste-dia-libre': return 'Declarar día libre';
      default: return 'Ajuste del día';
    }
  }

  protected adjustmentBaseTimes(): { entrada: string; salida: string } {
    const tramo = this.adjustmentJornada()?.tramos.find((item) => item.base);
    return {
      entrada: this.timeOnly(tramo?.inicio) || '09:00',
      salida: this.timeOnly(tramo?.fin) || '18:00'
    };
  }

  protected canCompensateHours(): boolean {
    return !this.scheduleFacade.isLoadingMonthlyBalance()
      && !this.scheduleFacade.monthlyBalanceError()
      && this.scheduleFacade.monthlyBalanceMinutes() !== null
      && this.scheduleFacade.monthlyDebtMinutes() > 0;
  }

  protected compensationDebtLabel(): string {
    const minutes = this.scheduleFacade.monthlyDebtMinutes();
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    const duration = hours === 0 ? `${rest} min` : rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
    return `Debe ${duration}`;
  }

  protected adjustmentLunchStart(): string | null {
    return this.timeOnly(this.adjustmentReport()?.inicioAlmuerzoProgramado);
  }

  protected adjustmentLunchEnd(): string | null {
    return this.timeOnly(this.adjustmentReport()?.finAlmuerzoProgramado);
  }

  private timeOnly(value: string | null | undefined): string | null {
    if (!value) return null;
    const match = /(?:T|\s)?(\d{2}:\d{2})/.exec(value);
    return match?.[1] ?? null;
  }

  protected async saveDayAdjustment(): Promise<void> {
    const view = this.subview();
    if (view === 'ajuste-extra') {
      this.extensionEditor?.submit();
    } else if (view === 'ajuste-compensacion') {
      this.extensionEditor?.submit();
    } else if (view === 'ajuste-corrimiento') {
      this.shiftEditor?.submit();
    } else if (view === 'ajuste-almuerzo') {
      this.lunchEditor?.submit();
    } else if (view === 'ajuste-jornada-extra' || view === 'ajuste-compensar-falta') {
      const fecha = this.adjustmentDate();
      const razon: RazonAjuste = view === 'ajuste-compensar-falta' ? 'COMPENSACION' : 'AMPLIACION_OPERATIVA';
      const saved = await this.scheduleFacade.submitJornadaExtraordinaria(
        fecha,
        this.adjustmentExtraEntrada(),
        this.adjustmentExtraSalida(),
        this.adjustmentExtraMotivo().trim() || (razon === 'COMPENSACION' ? 'Compensación de falta' : 'Jornada extraordinaria'),
        razon
      );
      if (saved) this.finishDayAdjustment();
    } else if (view === 'ajuste-dia-libre') {
      const saved = await this.scheduleFacade.submitDiaLibre(
        this.adjustmentDayOffDate(),
        this.adjustmentDayOffType(),
        this.adjustmentDayOffReason().trim() || 'Día libre declarado',
        this.adjustmentDayOffGlobal()
      );
      if (saved) this.finishDayAdjustment();
    }
  }

  protected async onSaveDayExtension(requests: AjusteJornadaRequest[]): Promise<void> {
    const reason: RazonAjuste = this.subview() === 'ajuste-compensacion' ? 'COMPENSACION' : 'AMPLIACION_OPERATIVA';
    const saved = await this.scheduleFacade.submitDayExtension(requests, reason);
    if (saved) this.finishDayAdjustment();
  }

  protected async onSaveDayShift(request: RegistrarAjusteV2Request): Promise<void> {
    const saved = await this.scheduleFacade.submitCorrimiento(request);
    if (saved) this.finishDayAdjustment();
  }

  protected async onSaveDayLunch(value: { inicio: string | null; fin: string | null }): Promise<void> {
    const saved = await this.scheduleFacade.submitLunchAdjustment(value.inicio, value.fin);
    if (saved) this.finishDayAdjustment();
  }

  private finishDayAdjustment(): void {
    this.subview.set('none');
    this.actionSuccess.set(this.scheduleFacade.adjustmentSuccess());
    this.employeeChanged.emit();
  }

  protected openProviderManagement(): void {
    const row = this.row();
    if (!row || !this.hasProviderScopeForSelectedRoles() || this.scopeActionsDisabled()) return;
    this.providerSelectedIds.set([...row.providerIds]);
    this.providerError.set('');
    this.clearActionFeedback();
    this.subview.set('gestionar-proveedores');
  }

  protected toggleProvider(providerId: number, selected: boolean): void {
    const current = new Set(this.providerSelectedIds());
    if (selected) current.add(providerId); else current.delete(providerId);
    this.providerSelectedIds.set([...current].sort((left, right) => left - right));
  }

  protected isProviderSelected(providerId: number): boolean {
    return this.providerSelectedIds().includes(providerId);
  }

  protected closeProviderManagement(): void {
    this.providerError.set('');
    this.subview.set('none');
  }

  protected async saveProviderManagement(): Promise<void> {
    const row = this.row();
    if (!row || !this.hasProviderScopeForSelectedRoles() || this.scopeActionsDisabled()) return;
    this.isSavingProviders.set(true);
    this.providerError.set('');
    this.clearActionFeedback();
    try {
      await firstValueFrom(this.equipos.asignarScopeProveedor(row.employee.idEmpleado, this.providerSelectedIds()));
      this.subview.set('none');
      this.actionSuccess.set(this.providerSelectedIds().length ? 'Proveedores actualizados.' : 'El empleado quedó sin proveedor.');
      this.employeeChanged.emit();
    } catch (error) {
      this.providerError.set(formatApiErrorMessage(error as HttpErrorResponse, 'No se pudieron actualizar los proveedores.'));
    } finally {
      this.isSavingProviders.set(false);
    }
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
      this.persistedRolePrincipal.set(updated.rolPrincipal ?? '');
      this.persistedSecondaryRoles.set([...updated.rolesSecundarios].sort());
      this.employeeChanged.emit();
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
    return ranges.length === 1 ? ranges[0] : `${workingDays.length} días configurados`;
  }

  protected restDayLabel(schedule: HorarioResponse | null): string {
    const restDay = schedule?.detalles.find((detail) => !detail.laborable)?.dia;
    return restDay ? this.label(restDay) : 'No definido';
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
    this.scheduleFacade.initialize(
      employeeId,
      contract.status === 'fulfilled' ? contract.value : null,
      schedule.status === 'fulfilled' ? schedule.value : null
    );
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
