import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ConnectedUserResponse } from '../../../../core/services/presence.service';
import { UsuarioResponse } from '../../../../shared/models/auth/usuario-response';
import { EstadoMonitorResponse } from '../../../../shared/models/schedule/cumplimiento-response';
import { EmpleadoResponse } from '../../../../shared/models/rrhh/empleado-response';
import { EmpleadoRolResponse } from '../../../../shared/models/rrhh/empleado-rol-response';
import { formatLabel } from '../../../../shared/utils/display-label';

export type ActiveEmployeeGroup = {
  role: string;
  employees: EmpleadoRolResponse[];
};

@Component({
  selector: 'app-employee-access-panel',
  imports: [ButtonModule, MessageModule, ProgressSpinnerModule, SkeletonModule, TableModule, TagModule],
  templateUrl: './employee-access-panel.component.html',
  styleUrl: './employee-access-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeAccessPanelComponent {
  @Input({ required: true }) employees: EmpleadoResponse[] = [];
  @Input() activeGroups: ActiveEmployeeGroup[] = [];
  @Input({ required: true }) currentPage = 0;
  @Input({ required: true }) totalPages = 1;
  @Input({ required: true }) isLoading = false;
  @Input({ required: true }) errorMessage = '';
  @Input({ required: true }) contractUpdateSuccessMessage = '';
  @Input({ required: true }) accessByEmployeeId: Record<number, UsuarioResponse | null> = {};
  @Input({ required: true }) accessErrorByEmployeeId: Record<number, string> = {};
  @Input({ required: true }) accessLoadingByEmployeeId: Record<number, boolean> = {};
  @Input() employeeStateById: Record<number, EstadoMonitorResponse> = {};
  @Input() connectedUserById: Record<number, ConnectedUserResponse> = {};
  @Input() isLoadingStates = false;

  @Output() readonly reload = new EventEmitter<void>();
  @Output() readonly pageChange = new EventEmitter<number>();
  @Output() readonly toggleAccess = new EventEmitter<number>();
  @Output() readonly renewContract = new EventEmitter<EmpleadoRolResponse>();
  @Output() readonly editEmployee = new EventEmitter<EmpleadoRolResponse>();
  @Output() readonly refreshStates = new EventEmitter<void>();

  protected readonly selectedRole = signal('');

  protected filteredGroups(): ActiveEmployeeGroup[] {
    const role = this.selectedRole();
    return role ? this.activeGroups.filter((group) => group.role === role) : this.activeGroups;
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
    return !!this.accessLoadingByEmployeeId[empleadoId];
  }

  protected toLabel(value: string | null | undefined): string {
    return formatLabel(value);
  }

  protected getAttendanceState(empleadoId: number): string | null {
    return this.employeeStateById[empleadoId]?.estadoActual ?? null;
  }

  protected getDisponibilidad(empleadoId: number): string | null {
    return this.connectedUserById[empleadoId]?.disponibilidad ?? null;
  }

  protected dotClass(empleadoId: number): string {
    const state = this.getAttendanceState(empleadoId)?.toUpperCase();
    switch (state) {
      case 'ONLINE':       return 'employee-dot dot--online';
      case 'ALMUERZO':     return 'employee-dot dot--almuerzo';
      case 'SERVICIOS':    return 'employee-dot dot--servicios';
      case 'CAPACITACION': return 'employee-dot dot--capacitacion';
      default:             return 'employee-dot dot--offline';
    }
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
}
