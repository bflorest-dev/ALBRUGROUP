import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AttendanceRoleGroupComponent } from '../attendance-role-group/attendance-role-group.component';
import type { AttendanceGroupedRows, CumplimientoRow } from '../../facades/rrhh-asistencia.facade';

/**
 * Bandeja agrupada del reporte: rótulos "Personal operativo" / "Personal estructural" y, dentro de
 * cada uno, las sub-secciones por rol. Presentacional; reemite el click de fila hacia la página.
 */
@Component({
  selector: 'app-attendance-tray',
  standalone: true,
  imports: [AttendanceRoleGroupComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './attendance-tray.component.html',
  styleUrl: './attendance-tray.component.scss'
})
export class AttendanceTrayComponent {
  readonly grouped = input.required<AttendanceGroupedRows>();
  readonly loading = input<boolean>(false);
  readonly rowClick = output<CumplimientoRow>();

  protected readonly operativoTotal = computed(() =>
    this.grouped().operativo.reduce((total, group) => total + group.empleados.length, 0)
  );
  protected readonly estructuralTotal = computed(() =>
    this.grouped().estructural.reduce((total, group) => total + group.empleados.length, 0)
  );
  protected readonly isEmpty = computed(() => this.operativoTotal() === 0 && this.estructuralTotal() === 0);
}
