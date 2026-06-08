import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, input, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ConnectedUserResponse } from '../../../../core/services/presence.service';
import { UsuarioResponse } from '../../../../shared/models/auth/usuario-response';
import { EstadoMonitorResponse } from '../../../../shared/models/schedule/cumplimiento-response';
import { HorarioResponse } from '../../../../shared/models/schedule/horario-response';
import { EmpleadoResponse } from '../../../../shared/models/rrhh/empleado-response';
import { EmpleadoRolResponse } from '../../../../shared/models/rrhh/empleado-rol-response';
import { formatLabel } from '../../../../shared/utils/display-label';

export type ActiveEmployeeGroup = {
  role: string;
  employees: EmpleadoRolResponse[];
};

export type EmployeeRow = EmpleadoRolResponse & { role: string };

@Component({
  selector: 'app-employee-access-panel',
  imports: [ButtonModule, DialogModule, MessageModule, ProgressSpinnerModule, SkeletonModule, TableModule, TagModule],
  templateUrl: './employee-access-panel.component.html',
  styleUrl: './employee-access-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeAccessPanelComponent {
  @Input({ required: true }) employees: EmpleadoResponse[] = [];
  readonly activeGroups = input<ActiveEmployeeGroup[]>([]);
  @Input({ required: true }) currentPage = 0;
  @Input({ required: true }) totalPages = 1;
  @Input({ required: true }) isLoading = false;
  @Input({ required: true }) errorMessage = '';
  @Input({ required: true }) contractUpdateSuccessMessage = '';
  @Input({ required: true }) accessByEmployeeId: Record<number, UsuarioResponse | null> = {};
  @Input({ required: true }) accessErrorByEmployeeId: Record<number, string> = {};
  @Input({ required: true }) accessLoadingByEmployeeId: Record<number, boolean> = {};
  @Input({ required: true }) scheduleByEmployeeId: Record<number, HorarioResponse | null> = {};
  @Input({ required: true }) scheduleErrorByEmployeeId: Record<number, string> = {};
  @Input({ required: true }) scheduleLoadingByEmployeeId: Record<number, boolean> = {};
  readonly employeeStateById = input<Record<number, EstadoMonitorResponse>>({});
  readonly connectedUserById = input<Record<number, ConnectedUserResponse>>({});
  @Input() isLoadingStates = false;

  @Input() isDismissingEmployeeId: number | null = null;

  @Output() readonly reload = new EventEmitter<void>();
  @Output() readonly pageChange = new EventEmitter<number>();
  @Output() readonly toggleAccess = new EventEmitter<number>();
  @Output() readonly renewContract = new EventEmitter<EmpleadoRolResponse>();
  @Output() readonly changeSchedule = new EventEmitter<EmpleadoRolResponse>();
  @Output() readonly editEmployee = new EventEmitter<EmpleadoRolResponse>();
  @Output() readonly refreshStates = new EventEmitter<void>();
  @Output() readonly darDeBaja = new EventEmitter<EmpleadoRolResponse>();

  protected readonly selectedRole = signal('');
  protected readonly bajaTarget = signal<EmpleadoRolResponse | null>(null);
  protected readonly bajaStep = signal<0 | 1 | 2>(0);
  protected readonly detailTarget = signal<EmployeeRow | null>(null);

  /**
   * Filas planas de empleados filtradas por el rol seleccionado. Es un computed
   * (referencia estable por ciclo de deteccion de cambios) para evitar el loop de
   * PrimeNG + OnPush al enlazarlo en [value] de la p-table. Ver primeng-loop-fix.md.
   */
  protected readonly filteredRows = computed<EmployeeRow[]>(() => {
    const role = this.selectedRole();
    const groups = role
      ? this.activeGroups().filter((group) => group.role === role)
      : this.activeGroups().filter((group) => group.role !== 'OJT');
    return groups
      .flatMap((group) => group.employees.map((employee) => ({ ...employee, role: group.role })))
      .sort((left, right) => this.compareEmployeeRows(left, right));
  });

  protected openDetail(employee: EmployeeRow): void {
    this.detailTarget.set(employee);
    // Carga perezosa solo si aun no esta en cache; al reabrir no se vuelve a pedir.
    if (!this.hasAccessLoaded(employee.idEmpleado)) {
      this.toggleAccess.emit(employee.idEmpleado);
    }
  }

  protected closeDetail(): void {
    this.detailTarget.set(null);
  }

  protected openBajaDialog(employee: EmpleadoRolResponse): void {
    this.bajaTarget.set(employee);
    this.bajaStep.set(1);
  }

  protected avanzarBajaStep2(): void {
    this.bajaStep.set(2);
  }

  protected cerrarBajaDialog(): void {
    this.bajaStep.set(0);
    this.bajaTarget.set(null);
  }

  protected confirmarBaja(): void {
    const employee = this.bajaTarget();
    if (!employee) return;
    this.bajaStep.set(0);
    this.bajaTarget.set(null);
    this.darDeBaja.emit(employee);
  }

  protected isDismissing(empleadoId: number): boolean {
    return this.isDismissingEmployeeId === empleadoId;
  }

  protected selectRole(role: string): void {
    this.selectedRole.set(role);
  }

  protected hasAccessLoaded(empleadoId: number): boolean {
    return empleadoId in this.accessByEmployeeId || !!this.accessErrorByEmployeeId[empleadoId];
  }

  protected getAccess(empleadoId: number): UsuarioResponse | null {
    return this.accessByEmployeeId[empleadoId] ?? null;
  }

  protected getAccessError(empleadoId: number): string {
    return this.accessErrorByEmployeeId[empleadoId] ?? '';
  }

  protected isAccessLoading(empleadoId: number): boolean {
    return !!this.accessLoadingByEmployeeId[empleadoId] || !!this.scheduleLoadingByEmployeeId[empleadoId];
  }

  protected getSchedule(empleadoId: number): HorarioResponse | null {
    return this.scheduleByEmployeeId[empleadoId] ?? null;
  }

  protected getScheduleError(empleadoId: number): string {
    return this.scheduleErrorByEmployeeId[empleadoId] ?? '';
  }

  protected scheduleSummary(horario: HorarioResponse | null): string {
    if (!horario?.detalles?.length) {
      return 'No disponible';
    }

    const laborables = horario.detalles.filter((detalle) => detalle.laborable);
    if (!laborables.length) {
      return 'Sin jornada laborable';
    }

    const descanso = horario.detalles.find((detalle) => !detalle.laborable)?.dia;
    const rangos = [...new Set(laborables.map((detalle) => `${detalle.horaEntrada}-${detalle.horaSalida}`))];

    if (rangos.length !== 1) {
      return `Variable${descanso ? ` (${this.shortDay(descanso)})` : ''}`;
    }

    const [entrada, salida] = rangos[0].split('-');
    return `${this.formatTime(entrada)} - ${this.formatTime(salida)}${descanso ? ` (${this.shortDay(descanso)})` : ''}`;
  }

  protected toLabel(value: string | null | undefined): string {
    return formatLabel(value);
  }

  protected getAttendanceState(empleadoId: number): string | null {
    return this.employeeStateById()[empleadoId]?.estadoActual ?? null;
  }

  protected getDisponibilidad(empleadoId: number): string | null {
    return this.connectedUserById()[empleadoId]?.disponibilidad ?? null;
  }

  protected dotClass(empleadoId: number): string {
    return this.connectedUserById()[empleadoId] ? 'employee-dot dot--online' : 'employee-dot dot--offline';
  }

  protected stateSeverity(value: string | null | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (value?.toUpperCase()) {
      case 'ONLINE':       return 'success';
      case 'DISPONIBLE':   return 'success';
      case 'ALMUERZO':     return 'warn';
      case 'SERVICIOS':    return 'info';
      case 'CAPACITACION': return 'warn';
      case 'GESTIONANDO':  return 'info';
      case 'OCUPADO':      return 'warn';
      case 'SATURADO':     return 'danger';
      default:             return 'secondary';
    }
  }

  private formatTime(value: string | null | undefined): string {
    if (!value) {
      return '--';
    }

    const [hoursRaw, minutesRaw] = value.split(':');
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return value;
    }

    const period = hours >= 12 ? 'PM' : 'AM';
    const normalizedHours = hours % 12 || 12;
    return `${normalizedHours}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  private compareEmployeeRows(left: EmployeeRow, right: EmployeeRow): number {
    const priorityDiff = this.getOperationalPriority(left.idEmpleado) - this.getOperationalPriority(right.idEmpleado);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    const roleDiff = left.role.localeCompare(right.role);
    if (roleDiff !== 0) {
      return roleDiff;
    }

    return this.employeeFullName(left).localeCompare(this.employeeFullName(right));
  }

  private getOperationalPriority(empleadoId: number): number {
    const attendanceState = this.getAttendanceState(empleadoId)?.toUpperCase();
    const connectedUser = this.connectedUserById()[empleadoId];
    const presenceStatus = connectedUser?.status?.toUpperCase() ?? (connectedUser ? 'ONLINE' : '');
    const disponibilidad = connectedUser?.disponibilidad?.toUpperCase();

    if (presenceStatus === 'ONLINE' && disponibilidad === 'DISPONIBLE') {
      return 0;
    }

    if (attendanceState === 'ONLINE') {
      return 1;
    }

    return 2;
  }

  private employeeFullName(employee: EmpleadoRolResponse): string {
    return `${employee.nombres} ${employee.apellidos}`;
  }

  private shortDay(value: string): string {
    switch (value) {
      case 'LUNES': return 'LUN';
      case 'MARTES': return 'MAR';
      case 'MIERCOLES': return 'MIE';
      case 'JUEVES': return 'JUE';
      case 'VIERNES': return 'VIE';
      case 'SABADO': return 'SAB';
      case 'DOMINGO': return 'DOM';
      default: return value;
    }
  }
}
