import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AttendanceFacade } from '../../../../core/facades/attendance.facade';
import { AsesorVentasHorarioFacade } from '../../facades/asesor-ventas-horario.facade';

@Component({
  selector: 'app-asesor-ventas-horario-page',
  standalone: true,
  imports: [ButtonModule, CardModule, SkeletonModule, TableModule, TagModule],
  templateUrl: './asesor-ventas-horario-page.component.html',
  styleUrl: './asesor-ventas-horario-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsesorVentasHorarioPageComponent {
  protected readonly attendanceFacade = inject(AttendanceFacade);
  protected readonly facade = inject(AsesorVentasHorarioFacade);

  // Cached KPIs de hoy — no method calls in template that return new refs
  protected readonly todayStatusStyle = computed(() => {
    const meta = this.attendanceFacade.currentStatusMeta();
    return { background: meta.color, color: '#fff', borderColor: meta.color };
  });

  protected readonly todayHorasTrabajadas = computed(() =>
    this.facade.fmtHoras(this.attendanceFacade.attendanceDetail()?.minutosTrabajados ?? 0)
  );

  protected readonly todayObjetivo = computed(() =>
    this.facade.fmtHoras(this.attendanceFacade.attendanceDetail()?.minutosObjetivoDia ?? 0)
  );

  protected readonly todayBalance = computed(() => {
    const min = this.attendanceFacade.attendanceDetail()?.minutosBalance ?? null;
    return min !== null ? this.facade.fmtBalance(min) : '---';
  });

  protected readonly todayBalancePositivo = computed(() =>
    (this.attendanceFacade.attendanceDetail()?.minutosBalance ?? 0) >= 0
  );

  protected readonly cumplimientoSeverity = computed(() => {
    const pct = this.facade.porcentajeCumplimiento();
    if (pct === null) return 'secondary';
    if (pct >= 90) return 'success';
    if (pct >= 75) return 'warn';
    return 'danger';
  });
}
