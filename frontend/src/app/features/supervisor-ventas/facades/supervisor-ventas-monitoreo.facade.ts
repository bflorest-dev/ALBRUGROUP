import { Injectable, computed, inject, signal } from '@angular/core';
import { Subscription, firstValueFrom } from 'rxjs';
import {
  AsesorSupervisorResponse,
  EmpleadoEsperadoResponse,
  PresenceService
} from '../../../core/services/presence.service';
import { PresenceRealtimeService } from '../../../core/services/presence-realtime.service';
import { AttendanceRealtimeService } from '../../../core/services/attendance-realtime.service';
import { LeadRealtimeService } from '../../preventa/services/lead-realtime.service';
import { PreventaLeadService } from '../../preventa/services/preventa-lead.service';
import {
  AsesorLeadsPendientesResponse,
  AsesorSinLeadsResponse,
  SupervisorVentasResumenResponse
} from '../../../shared/models/preventa/preventa.models';

/** Asesor en vivo combinando monitoreo (presencia + horario + servicios) + resumen + leads + contadores. */
export type AsesorMonitorView = AsesorSupervisorResponse & {
  leadsPendientes: number;
  asignadosActuales: number;
  gestionadosHoy: number;
  preventasHoy: number;
  preventasMes: number;
  /** epoch ms desde que está en disponibilidad DISPONIBLE (null si no lo está). */
  disponibleDesdeMs: number | null;
  /** epoch ms desde que no tiene leads para gestionar (null si tiene leads). */
  sinLeadsDesdeMs: number | null;
};

@Injectable()
export class SupervisorVentasMonitoreoFacade {
  private readonly presenceService = inject(PresenceService);
  private readonly preventaService = inject(PreventaLeadService);
  private readonly presenceRealtime = inject(PresenceRealtimeService);
  private readonly attendanceRealtime = inject(AttendanceRealtimeService);
  private readonly leadRealtime = inject(LeadRealtimeService);

  private readonly subscriptions = new Subscription();
  private monitorTimer: ReturnType<typeof setTimeout> | null = null;
  private leadsTimer: ReturnType<typeof setTimeout> | null = null;
  private fallbackTimer: ReturnType<typeof setInterval> | null = null;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private readonly debounceMs = 500;
  private readonly fallbackMs = 90000;

  readonly asesores = signal<AsesorSupervisorResponse[]>([]);
  readonly esperados = signal<EmpleadoEsperadoResponse[]>([]);
  readonly resumen = signal<SupervisorVentasResumenResponse[]>([]);
  readonly pendientes = signal<AsesorLeadsPendientesResponse[]>([]);
  readonly sinLeadsPorAsesor = signal<AsesorSinLeadsResponse[]>([]);
  /** Reloj que avanza cada segundo para los contadores en vivo. */
  readonly now = signal(Date.now());
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /**
   * Fila rica por asesor (join por empleadoId). Ordenada poniendo arriba a los asesores con mayor
   * tiempo "ocioso" = (tiempo en DISPONIBLE + tiempo sin leads). Quien gestiona o tiene leads suma 0.
   * Se calcula con la hora actual al momento del refresco (no por tick) para evitar saltos por segundo.
   * Computed = referencia estable (anti-loop).
   */
  readonly asesoresView = computed<AsesorMonitorView[]>(() => {
    const ahora = Date.now();
    const resumenById = new Map(this.resumen().map((item) => [item.idAsesor, item]));
    const pendientesById = new Map(this.pendientes().map((item) => [item.idAsesor, item.total]));
    const sinLeadsById = new Map(
      this.sinLeadsPorAsesor().map((item) => [
        item.idAsesor,
        item.sinLeadsDesde ? Date.parse(item.sinLeadsDesde) : null
      ])
    );
    return this.asesores()
      .map((asesor) => {
        const resumen = resumenById.get(asesor.empleadoId);
        return {
          ...asesor,
          leadsPendientes: pendientesById.get(asesor.empleadoId) ?? 0,
          asignadosActuales: resumen?.asignadosActuales ?? 0,
          gestionadosHoy: resumen?.gestionadosHoy ?? 0,
          preventasHoy: resumen?.preventasHoy ?? 0,
          preventasMes: resumen?.preventasMes ?? 0,
          disponibleDesdeMs:
            asesor.disponibilidad === 'DISPONIBLE' && asesor.disponibilidadDesde
              ? Date.parse(asesor.disponibilidadDesde)
              : null,
          sinLeadsDesdeMs: sinLeadsById.get(asesor.empleadoId) ?? null
        };
      })
      .sort((left, right) => this.idleScore(right, ahora) - this.idleScore(left, ahora)
        || left.nombreCompleto.localeCompare(right.nombreCompleto));
  });

  /** Suma de tiempo en DISPONIBLE + tiempo sin leads (ms). Gestionando/con leads => 0. */
  private idleScore(asesor: AsesorMonitorView, ahora: number): number {
    const disponible = asesor.disponibleDesdeMs ? ahora - asesor.disponibleDesdeMs : 0;
    const sinLeads = asesor.sinLeadsDesdeMs ? ahora - asesor.sinLeadsDesdeMs : 0;
    return disponible + sinLeads;
  }

  /** KPIs del equipo para la tira superior. */
  readonly kpis = computed(() => {
    const asesores = this.asesores();
    const enPausa = asesores.filter(
      (asesor) => !asesor.operativo && (asesor.estadoSchedule === 'ALMUERZO' || asesor.estadoSchedule === 'SERVICIOS')
    ).length;
    return {
      conectados: asesores.length,
      operativos: asesores.filter((asesor) => asesor.operativo).length,
      enPausa,
      ausentes: this.esperados().length,
      preventasHoy: this.resumen().reduce((total, item) => total + (item.preventasHoy ?? 0), 0),
      preventasMes: this.resumen().reduce((total, item) => total + (item.preventasMes ?? 0), 0)
    };
  });

  start(): void {
    void this.refreshAll(true);

    // Realtime-first: cada stream del websocket dispara un refresh debounced del dato afectado.
    this.subscriptions.add(
      this.presenceRealtime.watchAll().subscribe({
        next: () => this.scheduleMonitorRefresh(),
        error: () => undefined
      })
    );
    this.subscriptions.add(
      this.attendanceRealtime.watchTopic('/topic/asistencia/monitor').subscribe({
        next: () => this.scheduleMonitorRefresh(),
        error: () => undefined
      })
    );
    this.subscriptions.add(
      this.leadRealtime.watchTopic('/topic/leads/etapa/PREVENTA').subscribe({
        next: (event) => {
          if (['ASIGNACION', 'GESTION_INICIADA', 'TIPIFICACION', 'CONTACTO'].includes(event.tipo)) {
            this.scheduleLeadsRefresh();
          }
        },
        error: () => undefined
      })
    );

    // Reloj de los contadores (DISPONIBLE / sin leads).
    this.tickTimer = setInterval(() => this.now.set(Date.now()), 1000);
    // Respaldo suave por si se pierde algún evento (no es el mecanismo principal).
    this.fallbackTimer = setInterval(() => void this.refreshAll(false), this.fallbackMs);
  }

  stop(): void {
    this.subscriptions.unsubscribe();
    if (this.monitorTimer !== null) clearTimeout(this.monitorTimer);
    if (this.leadsTimer !== null) clearTimeout(this.leadsTimer);
    if (this.fallbackTimer !== null) clearInterval(this.fallbackTimer);
    if (this.tickTimer !== null) clearInterval(this.tickTimer);
  }

  private scheduleMonitorRefresh(): void {
    if (this.monitorTimer !== null) clearTimeout(this.monitorTimer);
    this.monitorTimer = setTimeout(() => {
      this.monitorTimer = null;
      void this.refreshMonitor().then(() => this.refreshSinLeads());
    }, this.debounceMs);
  }

  private scheduleLeadsRefresh(): void {
    if (this.leadsTimer !== null) clearTimeout(this.leadsTimer);
    this.leadsTimer = setTimeout(() => {
      this.leadsTimer = null;
      void this.refreshLeads().then(() => this.refreshSinLeads());
    }, this.debounceMs);
  }

  private async refreshAll(withSpinner: boolean): Promise<void> {
    if (withSpinner) this.isLoading.set(true);
    try {
      await this.refreshMonitor();
      await Promise.all([this.refreshLeads(), this.refreshSinLeads()]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async refreshMonitor(): Promise<void> {
    try {
      const [asesores, esperados] = await Promise.all([
        firstValueFrom(this.presenceService.listarAsesoresSupervisor()),
        firstValueFrom(this.presenceService.listarEsperadosNoConectados())
      ]);
      this.asesores.set(asesores);
      this.esperados.set(esperados);
    } catch {
      this.errorMessage.set('No se pudo actualizar el monitoreo de asesores.');
    }
  }

  private async refreshLeads(): Promise<void> {
    try {
      const [resumen, pendientes] = await Promise.all([
        firstValueFrom(this.preventaService.obtenerResumenSupervisor()),
        firstValueFrom(this.preventaService.listarLeadsPendientesPorAsesor())
      ]);
      this.resumen.set(resumen);
      this.pendientes.set(pendientes);
    } catch {
      this.errorMessage.set('No se pudo actualizar el resumen de leads.');
    }
  }

  private async refreshSinLeads(): Promise<void> {
    const ids = this.asesores().map((asesor) => asesor.empleadoId);
    if (!ids.length) {
      this.sinLeadsPorAsesor.set([]);
      return;
    }
    try {
      const data = await firstValueFrom(this.preventaService.listarSinLeadsDesde(ids));
      this.sinLeadsPorAsesor.set(data);
    } catch {
      // No crítico para el monitoreo.
    }
  }

}
