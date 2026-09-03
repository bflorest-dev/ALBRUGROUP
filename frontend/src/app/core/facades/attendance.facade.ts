import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, filter, map, of, startWith, switchMap, timeout } from 'rxjs';
import { ApiErrorResponse } from '../../shared/models/api/api-error-response';
import {
  DetalleDiaResponse,
  TramoDiaResponse,
  TramoDiaVm
} from '../../shared/models/schedule/detalle-dia-response';
import {
  ATTENDANCE_STATUS_META,
  AttendanceActionId,
  AttendanceActionOption,
  EstadoAsistencia
} from '../../shared/models/schedule/estado-asistencia';
import { AttendanceService } from '../services/attendance.service';
import { DisponibilidadOperativa, PresenceService } from '../services/presence.service';
import { SessionService } from '../services/session.service';
import { AttendanceStatusState } from '../state/attendance-status.state';
import { ALWAYS_OPERATIONAL_ROLES } from '../constants/operational-roles.constants';

type LoadRequest = {
  requestId: number;
};

type LoadState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'success'; requestId: number; detail: DetalleDiaResponse | null }
  | { status: 'error'; requestId: number; message: string };

type ActionRequest = {
  requestId: number;
  actionId: AttendanceActionId;
};

type ActionState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number; actionId: AttendanceActionId }
  | { status: 'success'; requestId: number; actionId: AttendanceActionId; detail: DetalleDiaResponse }
  | { status: 'error'; requestId: number; message: string };

@Injectable({
  providedIn: 'root'
})
export class AttendanceFacade {
  private readonly requestTimeoutMs = 15000;
  private readonly attendanceService = inject(AttendanceService);
  private readonly presenceService = inject(PresenceService);
  private readonly sessionService = inject(SessionService);
  private readonly attendanceStatusState = inject(AttendanceStatusState);
  private readonly document = inject(DOCUMENT);
  private nextRequestId = 1;
  private initialized = false;
  private pollTimerId: ReturnType<typeof setInterval> | null = null;
  private tickTimerId: ReturnType<typeof setInterval> | null = null;
  private autoCheckInArmed = false;
  private autoCheckInRequestId: number | null = null;
  private autoCheckInRetried = false;
  private pausaAutoReturned = false;
  private bandejaReported = false;
  private readonly maxLoadRetries = 3;
  private readonly loadRetryDelayMs = 3000;
  private loadRetryCount = 0;
  private loadRetryTimerId: ReturnType<typeof setTimeout> | null = null;

  private readonly loadRequest = signal<LoadRequest | null>(null);
  private readonly actionRequest = signal<ActionRequest | null>(null);
  // Latido de 1 s para los cronometros (elapsed = ahora - ancla del backend). Solo lo leen los timers.
  private readonly nowTick = signal(Date.now());
  // Cantidad de leads en bandeja (la reporta el layout/workspace); decide bandejaVacia al iniciar almuerzo.
  private readonly assignedLeadCount = signal(0);

  private readonly loadState = toSignal(
    toObservable(this.loadRequest).pipe(
      filter((request): request is LoadRequest => request !== null),
      switchMap((request) =>
        this.attendanceService.getAsistenciaDia().pipe(
          timeout(this.requestTimeoutMs),
          map(
            (detail): LoadState => ({
              status: 'success',
              requestId: request.requestId,
              detail
            })
          ),
          startWith<LoadState>({ status: 'loading', requestId: request.requestId }),
          catchError((error: HttpErrorResponse) => {
            if (error.status === 404) {
              return of<LoadState>({
                status: 'success',
                requestId: request.requestId,
                detail: null
              });
            }

            return of<LoadState>({
              status: 'error',
              requestId: request.requestId,
              message: this.getErrorMessage(error, 'No fue posible cargar el estado de asistencia.')
            });
          })
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  private readonly actionState = toSignal(
    toObservable(this.actionRequest).pipe(
      filter((request): request is ActionRequest => request !== null),
      switchMap((request) =>
        this.executeAction(request.actionId).pipe(
          timeout(this.requestTimeoutMs),
          map(
            (detail): ActionState => ({
              status: 'success',
              requestId: request.requestId,
              actionId: request.actionId,
              detail
            })
          ),
          startWith<ActionState>({
            status: 'loading',
            requestId: request.requestId,
            actionId: request.actionId
          }),
          catchError((error: HttpErrorResponse) =>
            of<ActionState>({
              status: 'error',
              requestId: request.requestId,
              message: this.getErrorMessage(error, 'No fue posible actualizar la asistencia.')
            })
          )
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  readonly attendanceDetail = signal<DetalleDiaResponse | null>(null);
  /**
   * true SOLO cuando el backend ha confirmado el estado (load/accion exitosos). Mientras sea false
   * el cliente no debe pintar OFFLINE ni limpiar bandejas: es un estado "sin confirmar" (verificando),
   * no un OFFLINE real. Se reinicia a false al cambiar de sesion y antes de la primera carga, y NO se
   * degrada ante un error de refresco (para no parpadear un estado ya confirmado).
   */
  readonly statusConfirmed = signal(false);
  /**
   * Contador que incrementa cada vez que una SALIDA (marcar OFFLINE) se registra con exito. Lo observa
   * el layout para cerrar la sesion (logout) tras marcar OFFLINE: marcar OFFLINE = terminar tu jornada.
   */
  readonly salidaSuccessTick = signal(0);
  /**
   * Indica que el asesor esta gestionando un lead. Mientras sea true se conserva la presencia
   * aunque su horario haya terminado (gracia para terminar el lead en gestion antes de cerrar turno).
   */
  private readonly managingLeadActive = signal(false);
  readonly rawStatus = computed<EstadoAsistencia>(
    () => this.attendanceDetail()?.estadoActual ?? 'OFFLINE'
  );
  // ===================== Derivacion de la jornada con el reloj vivo (v3) =====================
  // El backend entrega los tramos + politica; el frontend calcula tramo vigente/proximo/hueco y las
  // compuertas cada tick (nowTick, 1s), asi nunca muestra un gate vencido. El backend re-valida al marcar.

  private readonly tramosOrdenados = computed<TramoDiaResponse[]>(() => {
    const t = this.attendanceDetail()?.tramos ?? [];
    return [...t].sort((a, b) => a.inicio.localeCompare(b.inicio));
  });

  /** Tramo cuya ventana contiene el instante actual (marcable/curso), o null en hueco/fuera. */
  readonly tramoVigente = computed<TramoDiaResponse | null>(() => {
    const now = this.nowTick();
    return this.tramosOrdenados().find(t => this.ms(t.inicio) <= now && now < this.ms(t.fin)) ?? null;
  });

  /** Proximo tramo que aun no comienza. */
  readonly proximoTramo = computed<TramoDiaResponse | null>(() => {
    const now = this.nowTick();
    return this.tramosOrdenados().find(t => this.ms(t.inicio) > now) ?? null;
  });

  /** true si estamos entre dos tramos programados (hueco), no dentro de ninguno. */
  readonly enHueco = computed<boolean>(() => {
    const now = this.nowTick();
    const ts = this.tramosOrdenados();
    if (!ts.length || this.tramoVigente()) return false;
    return ts.some(t => this.ms(t.fin) <= now) && ts.some(t => this.ms(t.inicio) > now);
  });

  readonly isWithinSchedule = computed(() => this.tramoVigente() !== null);
  readonly isOperational = computed(() => this.attendanceDetail()?.estadoActual === 'ONLINE');

  /** Tramos del dia para mostrarlos en el picker (rango + tipo + cuál es el vigente). */
  readonly tramosVm = computed<TramoDiaVm[]>(() => {
    const vig = this.tramoVigente();
    return this.tramosOrdenados().map(t => ({
      rango: `${this.hhmm(t.inicio)}–${this.hhmm(t.fin)}`,
      tipo: t.tipo,
      vigente: vig != null && vig.inicio === t.inicio && vig.fin === t.fin,
      estado: t.estado
    }));
  });

  /**
   * Jornada abierta (ONLINE) cuya jornada del dia ya termino (paso el fin del ultimo tramo). Lo usan
   * las vistas con cierre propio (ej. ASESOR_VENTAS) para saber que el turno termino aunque siga ONLINE.
   */
  readonly isPastSalida = computed(() => {
    const detail = this.attendanceDetail();
    if (!detail || detail.jornadaCerrada || detail.estadoActual === 'OFFLINE') {
      return false;
    }
    const ts = this.tramosOrdenados();
    if (!ts.length) return false;
    return this.nowTick() > this.ms(ts[ts.length - 1].fin);
  });

  // --- Compuertas derivadas (espejan las validaciones del backend, con el reloj del cliente) ---

  readonly puedeMarcarIngreso = computed<boolean>(() => {
    const d = this.attendanceDetail();
    if (!d || this.currentStatus() !== 'OFFLINE') return false;
    const now = this.nowTick();
    const tramos = d.tramos ?? [];
    if (tramos.length === 0) return Boolean(d.politica?.permiteIngresoDuranteTurno); // OJT sin horario
    return this.tramoMarcable(now) !== null;
  });

  readonly puedeMarcarSalida = computed<boolean>(() => this.isOnline());

  readonly puedeIniciarAlmuerzo = computed<boolean>(() => {
    const d = this.attendanceDetail();
    if (!d || !this.isOnline() || !this.tramoVigente()) return false;
    if (d.almuerzoRealFin) return false;
    return this.ventanaAlmuerzoAbierta(d);
  });

  readonly puedeIniciarServicios = computed<boolean>(() => {
    const d = this.attendanceDetail();
    if (!d || !this.isOnline() || !this.tramoVigente()) return false;
    return (d.minutosServiciosHoy ?? 0) < (d.minutosServiciosTope ?? 0);
  });

  readonly puedeIniciarPausaActiva = computed<boolean>(() => {
    const d = this.attendanceDetail();
    if (!d || !this.isOnline() || !this.tramoVigente()) return false;
    return (d.pausaActivaUsosHoy ?? 0) < (d.politica?.maxUsosPausaActivaDia ?? 0);
  });

  private isOnline(): boolean {
    const d = this.attendanceDetail();
    return !!d && d.estadoActual === 'ONLINE' && !!d.fechaHoraIngreso && !d.fechaHoraSalida;
  }

  /** Ventana de ingreso de un tramo: [inicio - margen, corte]; corte = base:inicio+bloqueo, extra:fin. */
  private ventanaIngresoAbierta(t: TramoDiaResponse, now: number): boolean {
    const p = this.attendanceDetail()?.politica;
    const margen = p?.margenAdelantoMin ?? 0;
    const bloqueo = p?.bloqueoTardanzaMin ?? Number.MAX_SAFE_INTEGER;
    const permite = Boolean(p?.permiteIngresoDuranteTurno);
    const inicio = this.ms(t.inicio);
    const fin = this.ms(t.fin);
    if (now > fin) return false;
    const desfaseMin = (now - inicio) / 60000;
    if (desfaseMin < 0) return -desfaseMin <= margen;
    return t.tipo !== 'BASE' || permite || desfaseMin < bloqueo;
  }

  /** Tramo donde se puede marcar ingreso ahora (vigente con ventana abierta, o proximo dentro del margen). */
  private tramoMarcable(now: number): TramoDiaResponse | null {
    const vig = this.tramoVigente();
    if (vig && this.ventanaIngresoAbierta(vig, now)) return vig;
    const prox = this.proximoTramo();
    if (prox && this.ventanaIngresoAbierta(prox, now)) return prox;
    return null;
  }

  private ventanaAlmuerzoAbierta(d: DetalleDiaResponse): boolean {
    const lunch = d.inicioAlmuerzoProgramado;
    if (!lunch) return true;
    const lunchMin = this.toMinutes(lunch);
    if (lunchMin === null) return true;
    const ventana = d.politica?.ventanaMarcaAlmuerzoMin ?? 15;
    return this.nowMinutes() >= lunchMin - ventana;
  }

  private ms(iso: string | null | undefined): number {
    if (!iso) return Number.NaN;
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? Number.NaN : t;
  }

  /** HH:MM de un ISO LocalDateTime (para copy). */
  private hhmm(iso: string | null | undefined): string {
    if (!iso) return '';
    const idx = iso.indexOf('T');
    return idx >= 0 ? iso.substring(idx + 1, idx + 6) : iso.substring(0, 5);
  }
  readonly currentStatus = computed<EstadoAsistencia>(
    () => {
      const raw = this.rawStatus();
      if (this.sessionService.session()?.primaryRole === 'COMMUNITY') {
        return raw;
      }
      return raw === 'ONLINE' && !this.isOperational() ? 'OFFLINE' : raw;
    }
  );
  readonly isLoading = signal(false);
  readonly isInitializing = computed(() => {
    const state = this.loadState();
    return state.status === 'idle' || state.status === 'loading';
  });
  readonly errorMessage = signal('');
  readonly currentStatusMeta = computed(() => ATTENDANCE_STATUS_META[this.currentStatus()]);
  readonly availableActions = computed<AttendanceActionOption[]>(() =>
    // Sin confirmacion del backend no ofrecemos acciones: el estado aun es "verificando", no un
    // OFFLINE real, y mostrar un boton aqui seria enganoso.
    this.statusConfirmed() ? this.resolveStateOptions() : []
  );

  /** Texto del cronometro (MM:SS) del estado cronometrado en curso, o null si no aplica. */
  readonly timerText = computed<string | null>(() => {
    const timer = this.activeTimer();
    return timer ? this.formatMmSs(timer.elapsed) : null;
  });
  /** true cuando el estado supero su tiempo estimado (el pill lo pinta en rojo parpadeante). */
  readonly timerOver = computed<boolean>(() => {
    const timer = this.activeTimer();
    return Boolean(timer && timer.threshold !== null && timer.elapsed >= timer.threshold);
  });
  /**
   * Entro a ALMUERZO pero el contador real aun no arranco (rol con bandeja y leads pendientes).
   * El layout muestra el modal "termina tu gestion" mientras sea true.
   */
  readonly lunchWait = computed<boolean>(() => {
    const detail = this.attendanceDetail();
    return Boolean(detail && detail.estadoActual === 'ALMUERZO' && !detail.almuerzoRealInicio);
  });
  readonly lunchDurationMinutes = computed<number | null>(
    () => this.attendanceDetail()?.minutosAlmuerzoProgramado ?? null
  );

  readonly scheduleHint = computed<string>(() => {
    if (this.availableActions().some((option) => option.enabled)) return '';
    if (this.currentStatus() === 'CAPACITACION') return '';

    const detail = this.attendanceDetail();
    if (!detail) return '';

    if (!detail.idHorario && !detail.tieneHorario && (detail.tramos?.length ?? 0) === 0) {
      return 'No tienes turno programado para hoy.';
    }

    const prox = this.proximoTramo();
    if (prox) {
      const mins = Math.round((this.ms(prox.inicio) - this.nowTick()) / 60000);
      return mins > 0 && mins <= 90
        ? `Tu turno comienza en ${mins} min (${this.hhmm(prox.inicio)}).`
        : `Tu turno comienza a las ${this.hhmm(prox.inicio)}.`;
    }
    const ts = this.tramosOrdenados();
    if (ts.length && this.nowTick() > this.ms(ts[ts.length - 1].fin)) {
      return detail.jornadaCerrada ? 'Tu jornada de hoy ya está cerrada.' : `Tu turno terminó a las ${this.hhmm(ts[ts.length - 1].fin)}.`;
    }
    if (this.enHueco()) return 'Estás entre turnos.';
    if (detail.jornadaCerrada) return 'Tu jornada de hoy ya está cerrada.';

    return 'Estás fuera de tu horario programado.';
  });

  constructor() {
    effect(() => {
      const state = this.loadState();

      if (state.status === 'loading') {
        this.isLoading.set(true);
        this.errorMessage.set('');
        return;
      }

      if (state.status === 'success') {
        this.attendanceDetail.set(state.detail);
        this.attendanceStatusState.update(state.detail?.estadoActual ?? 'OFFLINE');
        this.statusConfirmed.set(true);
        this.loadRetryCount = 0;
        this.clearLoadRetryTimer();
        this.isLoading.set(false);
        this.errorMessage.set('');
        void this.syncPresence(state.detail);
        this.evaluateAttendanceAutomation(state.detail);
        return;
      }

      if (state.status === 'error') {
        // No degradamos un estado ya confirmado: dejamos attendanceDetail/statusConfirmed intactos
        // (el badge sigue en "Verificando" si nunca se confirmo) y reintentamos con backoff, para que
        // un timeout puntual no deje el estado congelado hasta un F5.
        this.isLoading.set(false);
        this.errorMessage.set(state.message);
        this.clearPollTimer();
        this.scheduleLoadRetry();
      }
    });

    effect(() => {
      const state = this.actionState();

      if (state.status === 'loading') {
        this.isLoading.set(true);
        this.errorMessage.set('');
        return;
      }

      if (state.status === 'success') {
        this.attendanceDetail.set(state.detail);
        this.attendanceStatusState.update(state.detail.estadoActual);
        this.statusConfirmed.set(true);
        this.isLoading.set(false);
        this.errorMessage.set('');
        void this.syncPresence(state.detail);
        if (state.actionId === 'REGISTRAR_SALIDA') {
          this.salidaSuccessTick.update((n) => n + 1);
        }
        return;
      }

      if (state.status === 'error') {
        this.isLoading.set(false);
        this.errorMessage.set(state.message);
      }
    });

    // Auto check-in retry tracking
    effect(() => {
      const state = this.actionState();
      const trackId = this.autoCheckInRequestId;

      if (trackId === null) return;
      if (state.status !== 'success' && state.status !== 'error') return;
      if (state.requestId !== trackId) return;

      if (state.status === 'success') {
        this.autoCheckInRequestId = null;
        this.autoCheckInRetried = false;
        return;
      }

      // Error — retry once after 1 second
      if (!this.autoCheckInRetried) {
        this.autoCheckInRetried = true;
        setTimeout(() => {
          const detail = this.attendanceDetail();
          if (!detail || detail.estadoActual !== 'OFFLINE' || detail.fechaHoraIngreso !== null) {
            this.autoCheckInRequestId = null;
            this.autoCheckInRetried = false;
            return;
          }
          const retryId = this.nextRequestId;
          this.submitAction('REGISTRAR_INGRESO');
          this.autoCheckInRequestId = retryId;
        }, 1000);
      } else {
        // Both attempts failed — give up silently
        this.autoCheckInRequestId = null;
        this.autoCheckInRetried = false;
      }
    });

    // Auto-retorno de PAUSA_ACTIVA: cuando el cronometro pasa el tope (maxMinutosPausaActiva) volvemos a
    // ONLINE una sola vez. El backend tiene su propio safety-net por reconciliacion; esto lo hace inmediato.
    effect(() => {
      const detail = this.attendanceDetail();
      const over = this.timerOver();
      if (!detail || detail.estadoActual !== 'PAUSA_ACTIVA') {
        this.pausaAutoReturned = false;
        return;
      }
      if (over && !this.pausaAutoReturned) {
        this.pausaAutoReturned = true;
        untracked(() => this.submitAction('FINALIZAR_PAUSA_ACTIVA'));
      }
    });

    // Rearmar el reporte de bandeja vacia cuando ya no estamos esperando (salio de ALMUERZO o arranco el contador).
    effect(() => {
      if (!this.lunchWait()) {
        this.bandejaReported = false;
      }
    });

    // Reactividad a la sesion. AttendanceFacade es singleton providedIn:root y sobrevive al logout,
    // asi que si no lo reseteamos aqui, tras un logout/login SPA (sin recarga de pagina) el badge se
    // queda con el estado de la sesion anterior hasta un F5 (y filtra estado entre usuarios). Este
    // effect hace que el cambio de sesion se comporte como una recarga: limpia al cerrar y recarga
    // fresco al iniciar.
    effect(() => {
      const session = this.sessionService.session();

      if (!session) {
        untracked(() => this.resetForSession());
        return;
      }

      // Roles siempre operativos no marcan asistencia; su badge es fijo ONLINE en el layout
      // (isAlwaysOnlineRole). Coherente con el guard de initialize() en private-layout.
      if (Boolean(session.primaryRole && ALWAYS_OPERATIONAL_ROLES.has(session.primaryRole))) {
        return;
      }

      // Sesion operativa: asegurar una carga fresca una vez por sesion (initialize es idempotente).
      untracked(() => this.initialize());
    });

    if (this.isBrowser()) {
      // Al volver el foco a la pestana (p. ej. tras inactividad/backgrounding) re-consultamos el
      // estado real en vez de arrastrar uno viejo. Refresco por evento, no polling.
      this.document.addEventListener('visibilitychange', this.handleVisibilityChange);
      // Latido de 1 s para los cronometros en vivo.
      this.tickTimerId = setInterval(() => this.nowTick.set(Date.now()), 1000);
    }
  }

  private readonly handleVisibilityChange = (): void => {
    if (this.document.visibilityState !== 'visible') {
      return;
    }
    if (!this.sessionService.session() || !this.initialized) {
      return;
    }
    this.reload();
  };

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.reload();
  }

  reload(): void {
    this.clearLoadRetryTimer();
    this.loadRequest.set({ requestId: this.nextRequestId++ });
  }

  /**
   * Reset completo al cambiar de sesion: deja el facade como recien creado para que el proximo login
   * cargue estado fresco y no filtre el estado de la sesion anterior. Espejo del reset por sesion de
   * PresenceService.
   */
  private resetForSession(): void {
    this.clearPollTimer();
    this.clearLoadRetryTimer();
    this.loadRetryCount = 0;
    this.initialized = false;
    this.autoCheckInArmed = false;
    this.autoCheckInRequestId = null;
    this.autoCheckInRetried = false;
    this.pausaAutoReturned = false;
    this.bandejaReported = false;
    this.attendanceDetail.set(null);
    this.statusConfirmed.set(false);
    this.salidaSuccessTick.set(0);
    this.managingLeadActive.set(false);
    this.assignedLeadCount.set(0);
    this.isLoading.set(false);
    this.errorMessage.set('');
    this.attendanceStatusState.update('OFFLINE');
  }

  private scheduleLoadRetry(): void {
    if (this.loadRetryTimerId !== null) {
      return;
    }
    if (this.loadRetryCount >= this.maxLoadRetries || !this.sessionService.session()) {
      return;
    }
    this.loadRetryCount++;
    this.loadRetryTimerId = setTimeout(() => {
      this.loadRetryTimerId = null;
      if (this.sessionService.session()) {
        this.reload();
      }
    }, this.loadRetryDelayMs);
  }

  private clearLoadRetryTimer(): void {
    if (this.loadRetryTimerId !== null) {
      clearTimeout(this.loadRetryTimerId);
      this.loadRetryTimerId = null;
    }
  }

  private isBrowser(): boolean {
    return !!this.document.defaultView;
  }

  submitAction(actionId: AttendanceActionId): void {
    this.actionRequest.set({
      requestId: this.nextRequestId++,
      actionId
    });
  }

  private executeAction(actionId: AttendanceActionId) {
    switch (actionId) {
      case 'REGISTRAR_INGRESO':
        return this.attendanceService.registrarIngreso();
      case 'REGISTRAR_SALIDA':
        return this.attendanceService.registrarSalida();
      case 'INICIAR_ALMUERZO':
        return this.attendanceService.iniciarAlmuerzo(this.isBandejaVacia());
      case 'FINALIZAR_ALMUERZO':
        return this.attendanceService.finalizarAlmuerzo();
      case 'INICIAR_SERVICIOS':
        return this.attendanceService.iniciarServicios();
      case 'FINALIZAR_SERVICIOS':
        return this.attendanceService.finalizarServicios();
      case 'INICIAR_PAUSA_ACTIVA':
        return this.attendanceService.iniciarPausaActiva();
      case 'FINALIZAR_PAUSA_ACTIVA':
        return this.attendanceService.finalizarPausaActiva();
      case 'FINALIZAR_CAPACITACION':
        return this.attendanceService.finalizarCapacitacion();
    }
  }

  /**
   * bandejaVacia al iniciar ALMUERZO: para roles que gestionan leads en tiempo real depende de si su
   * bandeja esta vacia (si no, el contador espera a que se vacie). Para el resto arranca de inmediato.
   * SUPERVISOR_VENTAS tambien gestiona leads, pero su bandeja se cablea con su propio workspace (fase
   * posterior); aqui solo ASESOR_VENTAS/OJT tienen conteo confiable.
   */
  private isBandejaVacia(): boolean {
    const role = this.sessionService.getSession()?.primaryRole;
    const gestionaLeads = role === 'ASESOR_VENTAS' || role === 'OJT';
    if (!gestionaLeads) {
      return true;
    }
    return this.assignedLeadCount() === 0;
  }

  /** El layout reporta el tamano de la bandeja; decide bandejaVacia al iniciar almuerzo y dispara la senal. */
  setAssignedLeadCount(count: number): void {
    this.assignedLeadCount.set(count);
  }

  /**
   * Senal "bandeja vacia": si el asesor esta en ALMUERZO esperando (contador sin arrancar) y su bandeja
   * quedo vacia, avisa al backend para que arranque el contador real. Idempotente (guard + backend).
   */
  reportBandejaVaciaSiCorresponde(): void {
    const detail = this.attendanceDetail();
    if (!detail || detail.estadoActual !== 'ALMUERZO' || detail.almuerzoRealInicio) {
      return;
    }
    if (this.bandejaReported) {
      return;
    }
    this.bandejaReported = true;
    this.attendanceService.notificarBandejaVacia().subscribe({
      next: (updated) => {
        this.attendanceDetail.set(updated);
        this.statusConfirmed.set(true);
      },
      error: () => {
        this.bandejaReported = false;
      }
    });
  }

  private async syncPresence(detail: DetalleDiaResponse | null): Promise<void> {
    if (this.shouldHavePresence(detail)) {
      await this.presenceService.start();
      await this.syncSalesAdvisorDisponibilidad(detail?.estadoActual ?? 'OFFLINE');
      return;
    }

    await this.presenceService.offline();
  }

  private shouldHavePresence(detail: DetalleDiaResponse | null): boolean {
    // Mantener presencia tambien en pausas dentro de horario (almuerzo/servicios/pausa/capacitacion):
    // el asesor sigue conectado (disponibilidad OCUPADO) y debe seguir visible en el monitoreo.
    const enPausa =
      detail?.estadoActual === 'ALMUERZO' ||
      detail?.estadoActual === 'SERVICIOS' ||
      detail?.estadoActual === 'PAUSA_ACTIVA' ||
      detail?.estadoActual === 'CAPACITACION';
    return detail?.estadoActual === 'ONLINE' || this.managingLeadActive() || enPausa;
  }

  /**
   * El workspace del asesor informa si esta gestionando un lead. Si lo activa estando fuera de
   * horario, se reestablece la presencia para que pueda terminar; al desactivarlo se vuelve a
   * sincronizar (se va OFFLINE si su horario ya termino).
   */
  setManagingLeadActive(active: boolean): void {
    if (this.managingLeadActive() === active) {
      return;
    }
    this.managingLeadActive.set(active);
    void this.syncPresence(this.attendanceDetail());
  }

  private async syncSalesAdvisorDisponibilidad(status: EstadoAsistencia): Promise<void> {
    const primaryRole = this.sessionService.getSession()?.primaryRole;
    if (primaryRole !== 'ASESOR_VENTAS' && primaryRole !== 'OJT') {
      return;
    }

    // Mientras gestiona un lead, el workspace es la unica autoridad de la disponibilidad
    // (decide GESTIONANDO / SATURADO). No la tocamos aqui para no pisar el GESTIONANDO con
    // DISPONIBLE cuando setManagingLeadActive(true) dispara syncPresence al abrir el lead.
    if (this.managingLeadActive()) {
      return;
    }

    const disponibilidad = this.resolveDisponibilidadFromAttendance(status);
    if (!disponibilidad) {
      return;
    }

    try {
      await this.presenceService.actualizarDisponibilidad(disponibilidad);
    } catch {
      // La presencia puede expirar entre el cambio de asistencia y el PATCH; el proximo heartbeat la recupera.
    }
  }

  private resolveDisponibilidadFromAttendance(status: EstadoAsistencia): DisponibilidadOperativa | null {
    switch (status) {
      case 'ALMUERZO':
      case 'SERVICIOS':
      case 'PAUSA_ACTIVA':
      case 'CAPACITACION':
        return 'OCUPADO';
      default:
        // La bandeja comercial calcula DISPONIBLE, CON_LEADS, GESTIONANDO, SIN_GESTIONAR
        // y SATURADO a partir de los leads pendientes del asesor.
        return null;
    }
  }

  // ===================== Cronometros =====================

  private activeTimer(): { elapsed: number; threshold: number | null } | null {
    const detail = this.attendanceDetail();
    if (!detail) {
      return null;
    }
    const now = this.nowTick();

    if (detail.estadoActual === 'ALMUERZO') {
      const start = this.parseTs(detail.almuerzoRealInicio);
      if (start === null) {
        // Esperando bandeja vacia: aun no hay contador.
        return null;
      }
      const threshold = detail.minutosAlmuerzoProgramado != null ? detail.minutosAlmuerzoProgramado * 60 : null;
      return { elapsed: Math.max(Math.floor((now - start) / 1000), 0), threshold };
    }

    if (
      detail.estadoActual === 'SERVICIOS' ||
      detail.estadoActual === 'PAUSA_ACTIVA' ||
      detail.estadoActual === 'CAPACITACION'
    ) {
      const start = this.parseTs(detail.sesionActualInicio);
      if (start === null) {
        return null;
      }
      let threshold: number | null = null;
      if (detail.estadoActual === 'SERVICIOS') {
        threshold = detail.minutosServiciosTope != null ? detail.minutosServiciosTope * 60 : null;
      } else if (detail.estadoActual === 'PAUSA_ACTIVA') {
        threshold = detail.maxMinutosPausaActiva != null ? detail.maxMinutosPausaActiva * 60 : null;
      }
      // CAPACITACION: sin tope -> nunca en rojo.
      return { elapsed: Math.max(Math.floor((now - start) / 1000), 0), threshold };
    }

    return null;
  }

  private parseTs(value: string | null | undefined): number | null {
    if (!value) {
      return null;
    }
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  private formatMmSs(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  // ===================== Catalogo de acciones =====================

  private resolveStateOptions(): AttendanceActionOption[] {
    const detail = this.attendanceDetail();
    if (!detail) {
      return [];
    }

    switch (this.currentStatus()) {
      case 'OFFLINE': {
        const puede = this.puedeMarcarIngreso();
        return [
          {
            key: 'INGRESO',
            actionId: 'REGISTRAR_INGRESO',
            targetStatus: 'ONLINE',
            label: 'ONLINE',
            enabled: puede,
            disabledReason: puede ? undefined : this.ingresoDisabledReason(detail)
          }
        ];
      }
      case 'ONLINE':
        return [
          this.buildOption('ALMUERZO', 'INICIAR_ALMUERZO', 'ALMUERZO', 'Almuerzo',
            this.puedeIniciarAlmuerzo(), this.almuerzoDisabledReason(detail)),
          this.buildOption('SERVICIOS', 'INICIAR_SERVICIOS', 'SERVICIOS', 'Servicios',
            this.puedeIniciarServicios(), this.serviciosDisabledReason(detail)),
          this.buildOption('PAUSA_ACTIVA', 'INICIAR_PAUSA_ACTIVA', 'PAUSA_ACTIVA', 'Pausa activa',
            this.puedeIniciarPausaActiva(), this.pausaDisabledReason(detail)),
          {
            key: 'CAPACITACION',
            actionId: null,
            targetStatus: 'CAPACITACION',
            label: 'Capacitación',
            enabled: false,
            disabledReason: 'La activa tu supervisor'
          },
          this.buildOption('OFFLINE', 'REGISTRAR_SALIDA', 'OFFLINE', 'Offline',
            this.puedeMarcarSalida(), 'Vuelve a ONLINE para marcar salida')
        ];
      case 'ALMUERZO':
        return [this.returnOption('FINALIZAR_ALMUERZO')];
      case 'SERVICIOS':
        return [this.returnOption('FINALIZAR_SERVICIOS')];
      case 'PAUSA_ACTIVA':
        return [this.returnOption('FINALIZAR_PAUSA_ACTIVA')];
      case 'CAPACITACION':
        return [
          {
            key: 'ONLINE',
            actionId: 'FINALIZAR_CAPACITACION',
            targetStatus: 'ONLINE',
            label: 'Salir a ONLINE',
            enabled: true
          }
        ];
    }
  }

  private buildOption(
    key: string,
    actionId: AttendanceActionId,
    targetStatus: EstadoAsistencia,
    label: string,
    enabled: boolean,
    disabledReason: string
  ): AttendanceActionOption {
    return { key, actionId, targetStatus, label, enabled, disabledReason: enabled ? undefined : disabledReason };
  }

  private returnOption(actionId: AttendanceActionId): AttendanceActionOption {
    return { key: 'ONLINE', actionId, targetStatus: 'ONLINE', label: 'ONLINE', enabled: true };
  }

  private ingresoDisabledReason(detail: DetalleDiaResponse): string {
    if (!detail.idHorario && !detail.tieneHorario && (detail.tramos?.length ?? 0) === 0) {
      return 'No tienes turno programado para hoy.';
    }
    const prox = this.proximoTramo();
    if (prox) return `Podrás marcar poco antes de las ${this.hhmm(prox.inicio)}.`;
    if (this.enHueco()) return 'Estás entre turnos; espera tu próximo bloque.';
    const ts = this.tramosOrdenados();
    if (ts.length && this.nowTick() > this.ms(ts[ts.length - 1].fin)) {
      return `Tu turno terminó a las ${this.hhmm(ts[ts.length - 1].fin)}.`;
    }
    if (detail.jornadaCerrada) return 'Tu jornada de hoy ya está cerrada.';
    return 'Estás fuera de tu horario para marcar ingreso.';
  }

  private almuerzoDisabledReason(detail: DetalleDiaResponse): string {
    if (!this.tramoVigente()) return 'Disponible dentro de tu turno.';
    if (detail.almuerzoRealFin) return 'Ya tomaste tu almuerzo de hoy.';
    const inicio = detail.inicioAlmuerzoProgramado;
    if (inicio) {
      const ventana = detail.politica?.ventanaMarcaAlmuerzoMin ?? 15;
      const desde = this.minusMinutesHhMm(inicio, ventana);
      if (desde) return `Disponible desde las ${desde}.`;
    }
    return 'Disponible cerca de tu hora de almuerzo.';
  }

  private serviciosDisabledReason(detail: DetalleDiaResponse): string {
    if (!this.tramoVigente()) return 'Disponible dentro de tu turno.';
    return 'Alcanzaste tu límite de servicios de hoy.';
  }

  private pausaDisabledReason(detail: DetalleDiaResponse): string {
    if (!this.tramoVigente()) return 'Disponible dentro de tu turno.';
    return 'Ya usaste tu pausa activa de hoy.';
  }

  /**
   * Marcado automatico SOLO para el caso 1 (el empleado se conecta antes de su hora de entrada):
   * mientras falte para la entrada se "arma" y se sondea el backend; cuando el backend confirma que
   * ya esta dentro de horario, se marca ONLINE una sola vez. Si el empleado se conecta DESPUES de su
   * entrada sin marcar (caso 2A), NO se auto-marca: debe marcar ONLINE manualmente.
   */
  private evaluateAttendanceAutomation(detail: DetalleDiaResponse | null): void {
    this.clearPollTimer();

    const tramos = detail?.tramos
      ? [...detail.tramos].sort((a, b) => a.inicio.localeCompare(b.inicio))
      : [];
    if (
      !detail ||
      detail.estadoActual !== 'OFFLINE' ||
      detail.fechaHoraIngreso !== null ||
      tramos.length === 0 ||
      detail.jornadaCerrada
    ) {
      this.autoCheckInArmed = false;
      return;
    }

    const now = Date.now();
    const enTramo = tramos.some(t => this.ms(t.inicio) <= now && now < this.ms(t.fin));
    const antesDelPrimero = now < this.ms(tramos[0].inicio);
    const despuesDelUltimo = now > this.ms(tramos[tramos.length - 1].fin);

    if (enTramo) {
      // Ya dentro de un tramo y sin ingreso.
      if (this.autoCheckInArmed) {
        // Estabamos esperando que llegara su hora de entrada: marcar ONLINE automaticamente.
        this.autoCheckInArmed = false;
        this.autoCheckInRetried = false;
        const capturedId = this.nextRequestId;
        this.submitAction('REGISTRAR_INGRESO');
        this.autoCheckInRequestId = capturedId;
      }
      // Si no estaba armado, se conecto despues de su entrada: marcado manual, no hacemos nada.
      return;
    }

    // Fuera de tramo y sin ingreso: solo automatizar si aun no llega su primer tramo (nunca tras el ultimo).
    if ((antesDelPrimero || this.autoCheckInArmed) && !despuesDelUltimo) {
      this.autoCheckInArmed = true;
      this.startAttendancePoll();
    } else {
      this.autoCheckInArmed = false;
    }
  }

  private startAttendancePoll(): void {
    if (this.pollTimerId !== null) {
      return;
    }
    // Refresco periodico mientras se espera la hora de entrada (por si cambia el horario); la decision
    // de "ya es tu hora" la toma el frontend con su reloj sobre los tramos.
    this.pollTimerId = setInterval(() => this.reload(), 60000);
  }

  private clearPollTimer(): void {
    if (this.pollTimerId !== null) {
      clearInterval(this.pollTimerId);
      this.pollTimerId = null;
    }
  }

  private toMinutes(time: string | null | undefined): number | null {
    if (!time) {
      return null;
    }
    const [hours, minutes] = time.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }
    return hours * 60 + minutes;
  }

  private minusMinutesHhMm(time: string, minutes: number): string | null {
    const [hours, mins] = time.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(mins)) {
      return null;
    }
    let total = hours * 60 + mins - minutes;
    if (total < 0) {
      total += 24 * 60;
    }
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  private nowMinutes(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  private getErrorMessage(error: HttpErrorResponse, fallbackMessage: string): string {
    const apiError = error.error as ApiErrorResponse | null;

    if (apiError?.details?.length) {
      return `${apiError.message}: ${apiError.details.join(', ')}`;
    }

    return apiError?.message ?? fallbackMessage;
  }
}
