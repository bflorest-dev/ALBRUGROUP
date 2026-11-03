import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
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
import { STORAGE_KEYS } from '../../../core/constants/storage.constants';
import { CurrentUserTeamScopeService } from '../../../core/services/current-user-team-scope.service';

/** Asesor en vivo combinando monitoreo (presencia + horario + servicios) + resumen + leads + contadores. */
export type AsesorMonitorView = AsesorSupervisorResponse & {
  conectado: boolean;
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
  private readonly document = inject(DOCUMENT);
  private readonly presenceService = inject(PresenceService);
  private readonly teamScope = inject(CurrentUserTeamScopeService);
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
  private started = false;
  private scopeReady = false;
  private activeTeamId: number | null = null;

  constructor() {
    effect(() => {
      const selectedTeamId = this.teamScope.activeId();
      if (!this.started || !this.scopeReady || selectedTeamId === this.activeTeamId) {
        return;
      }

      this.activeTeamId = selectedTeamId;
      this.clearScopeData();
      if (selectedTeamId !== null) {
        void this.refreshAll(true);
      }
    });
  }

  readonly asesores = signal<AsesorSupervisorResponse[]>([]);
  readonly esperados = signal<EmpleadoEsperadoResponse[]>([]);
  readonly seenAdvisorSnapshots = signal<Record<number, AsesorSupervisorResponse>>(this.readSeenAdvisorSnapshots());
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
    const connectedById = new Map(this.asesores().map((item) => [item.empleadoId, item]));
    const expectedById = new Map(this.esperados().map((item) => [item.empleadoId, item]));
    const snapshots = this.seenAdvisorSnapshots();
    const sinLeadsById = new Map(
      this.sinLeadsPorAsesor().map((item) => [
        item.idAsesor,
        item.sinLeadsDesde ? Date.parse(item.sinLeadsDesde) : null
      ])
    );
    return this.visibleAdvisorIds()
      .map((idAsesor) => {
        const connected = connectedById.get(idAsesor);
        const snapshot = snapshots[idAsesor];
        const esperado = expectedById.get(idAsesor);
        const asesor = connected ?? this.buildOfflineAdvisor(idAsesor, snapshot, esperado);
        if (!asesor) {
          return null;
        }
        const resumen = resumenById.get(asesor.empleadoId);
        const leadsPendientes = pendientesById.get(asesor.empleadoId) ?? 0;
        const asignadosActuales = resumen?.asignadosActuales ?? 0;
        return {
          ...asesor,
          conectado: !!connected,
          leadsPendientes,
          asignadosActuales,
          gestionadosHoy: resumen?.gestionadosHoy ?? 0,
          preventasHoy: resumen?.preventasHoy ?? 0,
          preventasMes: resumen?.preventasMes ?? 0,
          disponibleDesdeMs:
            asesor.disponibilidad === 'DISPONIBLE' && asesor.disponibilidadDesde
              ? Date.parse(asesor.disponibilidadDesde)
              : null,
          sinLeadsDesdeMs:
            sinLeadsById.get(asesor.empleadoId) ??
            this.resolveSinLeadsDesdeConexion(asesor, !!connected, leadsPendientes, asignadosActuales)
        } satisfies AsesorMonitorView;
      })
      .filter((asesor): asesor is AsesorMonitorView => asesor !== null)
      .sort((left, right) => this.idleScore(right, ahora) - this.idleScore(left, ahora)
        || left.nombreCompleto.localeCompare(right.nombreCompleto));
  });

  readonly esperadosVisibles = computed(() => {
    const visibleIds = new Set(this.visibleAdvisorIds());
    return this.esperados().filter((empleado) => visibleIds.has(empleado.empleadoId));
  });

  /** Suma de tiempo en DISPONIBLE + tiempo sin leads (ms). Gestionando/con leads => 0. */
  private idleScore(asesor: AsesorMonitorView, ahora: number): number {
    const disponible = asesor.disponibleDesdeMs ? ahora - asesor.disponibleDesdeMs : 0;
    const sinLeads = asesor.sinLeadsDesdeMs ? ahora - asesor.sinLeadsDesdeMs : 0;
    return disponible + sinLeads;
  }

  /** KPIs del equipo para la tira superior. */
  readonly kpis = computed(() => {
    const asesores = this.asesoresView();
    const visibleIds = new Set(this.visibleAdvisorIds());
    const resumenVisible = this.resumen().filter((item) => visibleIds.has(item.idAsesor));
    const enPausa = asesores.filter(
      (asesor) => !asesor.operativo && (asesor.estadoSchedule === 'ALMUERZO' || asesor.estadoSchedule === 'SERVICIOS')
    ).length;
    return {
      conectados: asesores.filter((asesor) => asesor.conectado).length,
      operativos: asesores.filter((asesor) => asesor.conectado && asesor.operativo).length,
      enPausa,
      ausentes: this.esperadosVisibles().length,
      preventasHoy: resumenVisible.reduce((total, item) => total + (item.preventasHoy ?? 0), 0),
      preventasMes: resumenVisible.reduce((total, item) => total + (item.preventasMes ?? 0), 0)
    };
  });

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    void this.initializeScopeAndRefresh();

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
    this.started = false;
    this.scopeReady = false;
    this.subscriptions.unsubscribe();
    if (this.monitorTimer !== null) clearTimeout(this.monitorTimer);
    if (this.leadsTimer !== null) clearTimeout(this.leadsTimer);
    if (this.fallbackTimer !== null) clearInterval(this.fallbackTimer);
    if (this.tickTimer !== null) clearInterval(this.tickTimer);
    this.clearScopeData();
  }

  private async initializeScopeAndRefresh(): Promise<void> {
    try {
      await this.teamScope.load();
      this.activeTeamId = this.teamScope.activeId();
      this.scopeReady = true;
      this.clearScopeData();
      if (this.activeTeamId !== null) {
        await this.refreshAll(true);
      }
    } catch {
      this.errorMessage.set('No se pudo cargar el equipo activo.');
    }
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
    const idEquipo = this.teamScope.activeId();
    if (!this.scopeReady || idEquipo === null) {
      this.clearScopeData();
      return;
    }
    try {
      const [asesores, esperados] = await Promise.all([
        firstValueFrom(this.presenceService.listarAsesoresSupervisor(idEquipo)),
        firstValueFrom(this.presenceService.listarEsperadosNoConectados(idEquipo))
      ]);
      if (!this.isCurrentScope(idEquipo)) {
        return;
      }
      this.asesores.set(asesores);
      this.esperados.set(esperados);
      this.rememberConnectedAdvisors(asesores, esperados);
    } catch {
      this.errorMessage.set('No se pudo actualizar el monitoreo de asesores.');
    }
  }

  private async refreshLeads(): Promise<void> {
    const idEquipo = this.teamScope.activeId();
    if (!this.scopeReady || idEquipo === null) {
      this.resumen.set([]);
      this.pendientes.set([]);
      return;
    }
    try {
      const [resumen, pendientes] = await Promise.all([
        firstValueFrom(this.preventaService.obtenerResumenSupervisor(idEquipo)),
        firstValueFrom(this.preventaService.listarLeadsPendientesPorAsesor(idEquipo))
      ]);
      if (!this.isCurrentScope(idEquipo)) {
        return;
      }
      this.resumen.set(resumen);
      this.pendientes.set(pendientes);
    } catch {
      this.errorMessage.set('No se pudo actualizar el resumen de leads.');
    }
  }

  private async refreshSinLeads(): Promise<void> {
    const idEquipo = this.teamScope.activeId();
    const ids = this.visibleAdvisorIds();
    if (!this.scopeReady || idEquipo === null || !ids.length) {
      this.sinLeadsPorAsesor.set([]);
      return;
    }
    try {
      const data = await firstValueFrom(this.preventaService.listarSinLeadsDesde(ids, idEquipo));
      if (!this.isCurrentScope(idEquipo)) {
        return;
      }
      this.sinLeadsPorAsesor.set(data);
    } catch {
      // No crítico para el monitoreo.
    }
  }

  private visibleAdvisorIds(): number[] {
    const ids = new Set<number>([
      ...this.asesores().map((asesor) => asesor.empleadoId),
      ...this.esperados().map((empleado) => empleado.empleadoId)
    ]);
    for (const id of Object.keys(this.seenAdvisorSnapshots()).map(Number)) {
      if (Number.isFinite(id)) {
        ids.add(id);
      }
    }
    return [...ids];
  }

  private rememberConnectedAdvisors(
    asesores: AsesorSupervisorResponse[],
    esperados: EmpleadoEsperadoResponse[]
  ): void {
    const autorizados = new Set([
      ...asesores.map((asesor) => asesor.empleadoId),
      ...esperados.map((empleado) => empleado.empleadoId)
    ]);
    this.seenAdvisorSnapshots.update((current) => {
      const next: Record<number, AsesorSupervisorResponse> = {};
      for (const [id, snapshot] of Object.entries(current)) {
        if (autorizados.has(Number(id))) {
          next[Number(id)] = snapshot;
        }
      }
      for (const asesor of asesores) {
        next[asesor.empleadoId] = asesor;
      }
      this.saveSeenAdvisorSnapshots(next);
      return next;
    });
  }

  private clearScopeData(): void {
    this.asesores.set([]);
    this.esperados.set([]);
    this.resumen.set([]);
    this.pendientes.set([]);
    this.sinLeadsPorAsesor.set([]);
    this.errorMessage.set(null);
    this.seenAdvisorSnapshots.set({});
    this.saveSeenAdvisorSnapshots({});
  }

  private isCurrentScope(idEquipo: number): boolean {
    return this.started && this.teamScope.activeId() === idEquipo;
  }

  private buildOfflineAdvisor(
    idAsesor: number,
    snapshot: AsesorSupervisorResponse | undefined,
    esperado: EmpleadoEsperadoResponse | undefined
  ): AsesorSupervisorResponse | null {
    if (!snapshot && !esperado) {
      return null;
    }

    return {
      empleadoId: idAsesor,
      nombreCompleto: snapshot?.nombreCompleto ?? esperado?.nombreCompleto ?? 'Asesor ventas',
      roles: snapshot?.roles ?? esperado?.roles ?? [],
      equipoActivoId: snapshot?.equipoActivoId ?? null,
      disponibilidad: snapshot?.disponibilidad ?? null,
      disponibilidadDesde: snapshot?.disponibilidadDesde ?? null,
      lastSeen: snapshot?.lastSeen ?? null,
      estadoSchedule: esperado?.estadoSchedule ?? snapshot?.estadoSchedule ?? 'OFFLINE',
      desde: snapshot?.desde ?? null,
      entradaProgramada: esperado?.entradaProgramada ?? snapshot?.entradaProgramada ?? null,
      esperadoHoy: esperado?.esperadoHoy ?? snapshot?.esperadoHoy ?? false,
      tieneRegistroHoy: esperado?.tieneRegistroHoy ?? snapshot?.tieneRegistroHoy ?? false,
      operativo: false,
      minutosServiciosEnCurso: 0,
      minutosServiciosAcumulados: snapshot?.minutosServiciosAcumulados ?? 0,
      minutosServiciosPermitidos: snapshot?.minutosServiciosPermitidos ?? 0,
      excedioServicios: snapshot?.excedioServicios ?? false
    };
  }

  private resolveSinLeadsDesdeConexion(
    asesor: AsesorSupervisorResponse,
    conectado: boolean,
    leadsPendientes: number,
    asignadosActuales: number
  ): number | null {
    if (!conectado || leadsPendientes > 0 || asignadosActuales > 0 || !asesor.disponibilidadDesde) {
      return null;
    }

    return Date.parse(asesor.disponibilidadDesde);
  }

  private readSeenAdvisorSnapshots(): Record<number, AsesorSupervisorResponse> {
    const storage = this.document.defaultView?.localStorage;
    if (!storage) {
      return {};
    }

    const rawValue = storage.getItem(STORAGE_KEYS.supervisorVentasSeenAdvisors);
    if (!rawValue) {
      return {};
    }

    try {
      return JSON.parse(rawValue) as Record<number, AsesorSupervisorResponse>;
    } catch {
      storage.removeItem(STORAGE_KEYS.supervisorVentasSeenAdvisors);
      return {};
    }
  }

  private saveSeenAdvisorSnapshots(value: Record<number, AsesorSupervisorResponse>): void {
    const storage = this.document.defaultView?.localStorage;
    if (!storage) {
      return;
    }

    storage.setItem(STORAGE_KEYS.supervisorVentasSeenAdvisors, JSON.stringify(value));
  }

}
