import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { UsuarioResponse } from '../../../../shared/models/auth/usuario-response';
import { EmpleadoResponse } from '../../../../shared/models/rrhh/empleado-response';
import { EmpleadoRolResponse } from '../../../../shared/models/rrhh/empleado-rol-response';
import { formatLabel } from '../../../../shared/utils/display-label';

export type ActiveEmployeeGroup = {
  role: string;
  employees: EmpleadoRolResponse[];
};

@Component({
  selector: 'app-employee-access-panel',
  imports: [ButtonModule, MessageModule, ProgressSpinnerModule, TableModule, TagModule],
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

  @Output() readonly reload = new EventEmitter<void>();
  @Output() readonly pageChange = new EventEmitter<number>();
  @Output() readonly toggleAccess = new EventEmitter<number>();
  @Output() readonly renewContract = new EventEmitter<EmpleadoRolResponse>();

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
}
