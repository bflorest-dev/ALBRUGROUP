import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { UsuarioResponse } from '../../../../shared/models/auth/usuario-response';
import { EmpleadoResponse } from '../../../../shared/models/rrhh/empleado-response';

@Component({
  selector: 'app-employee-access-panel',
  templateUrl: './employee-access-panel.component.html',
  styleUrl: './employee-access-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeAccessPanelComponent {
  @Input({ required: true }) employees: EmpleadoResponse[] = [];
  @Input({ required: true }) currentPage = 0;
  @Input({ required: true }) totalPages = 1;
  @Input({ required: true }) isLoading = false;
  @Input({ required: true }) errorMessage = '';
  @Input({ required: true }) accessByEmployeeId: Record<number, UsuarioResponse | null> = {};
  @Input({ required: true }) accessErrorByEmployeeId: Record<number, string> = {};
  @Input({ required: true }) accessLoadingByEmployeeId: Record<number, boolean> = {};

  @Output() readonly reload = new EventEmitter<void>();
  @Output() readonly pageChange = new EventEmitter<number>();
  @Output() readonly toggleAccess = new EventEmitter<number>();

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
    if (!value) {
      return '-';
    }

    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
