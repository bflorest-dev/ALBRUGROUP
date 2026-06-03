import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { formatLabel } from '../../../../shared/utils/display-label';
import { SupervisorVentasMonitoreoFacade } from '../../facades/supervisor-ventas-monitoreo.facade';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

@Component({
  selector: 'app-supervisor-ventas-monitoreo-page',
  standalone: true,
  imports: [CardModule, MessageModule, SkeletonModule, TableModule, TagModule],
  providers: [SupervisorVentasMonitoreoFacade],
  templateUrl: './supervisor-ventas-monitoreo-page.component.html',
  styleUrl: './supervisor-ventas-monitoreo-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupervisorVentasMonitoreoPageComponent implements OnInit, OnDestroy {
  protected readonly facade = inject(SupervisorVentasMonitoreoFacade);

  ngOnInit(): void {
    this.facade.start();
  }

  ngOnDestroy(): void {
    this.facade.stop();
  }

  protected display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return formatLabel(String(value));
  }

  protected scheduleSeverity(value: string | null | undefined): Severity {
    switch (value?.toUpperCase()) {
      case 'ONLINE': return 'success';
      case 'ALMUERZO': return 'warn';
      case 'SERVICIOS': return 'info';
      case 'CAPACITACION': return 'warn';
      default: return 'secondary';
    }
  }

  protected disponibilidadSeverity(value: string | null | undefined): Severity {
    switch (value?.toUpperCase()) {
      case 'DISPONIBLE': return 'success';
      case 'GESTIONANDO': return 'info';
      case 'OCUPADO': return 'warn';
      case 'SATURADO': return 'danger';
      default: return 'secondary';
    }
  }

  protected dotClass(operativo: boolean, estadoSchedule: string | null | undefined): string {
    if (operativo) return 'live-dot live-dot--online';
    switch (estadoSchedule?.toUpperCase()) {
      case 'ALMUERZO': return 'live-dot live-dot--almuerzo';
      case 'SERVICIOS': return 'live-dot live-dot--servicios';
      case 'CAPACITACION': return 'live-dot live-dot--capacitacion';
      default: return 'live-dot live-dot--offline';
    }
  }

  protected servicios(enCurso: number | null | undefined, acumulados: number | null | undefined): string {
    const total = acumulados ?? 0;
    const curso = enCurso ?? 0;
    return curso > 0 ? `${total}m (+${curso}m en curso)` : `${total}m`;
  }

  /** Tiempo transcurrido desde un epoch ms hasta ahora, formateado de forma breve. */
  protected formatElapsed(sinceMs: number | null | undefined): string {
    if (!sinceMs) {
      return '-';
    }
    const seconds = Math.max(0, Math.floor((this.facade.now() - sinceMs) / 1000));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }

  /** Marca en rojo cuando el asesor lleva demasiado tiempo sin leads (> 10 min). */
  protected sinLeadsAlerta(sinceMs: number | null | undefined): boolean {
    return !!sinceMs && this.facade.now() - sinceMs > 10 * 60 * 1000;
  }
}
