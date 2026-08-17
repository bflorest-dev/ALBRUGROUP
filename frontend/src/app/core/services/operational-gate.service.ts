import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { AttendanceFacade } from '../facades/attendance.facade';
import { SessionService } from './session.service';

/**
 * Roles que no participan del flujo de asistencia: su badge es ONLINE fijo en el layout
 * (isAlwaysOnlineRole) y el AttendanceFacade nunca los inicializa.
 */
const ALWAYS_OPERATIONAL_ROLES = new Set(['ADMINISTRADOR']);
const COMMUNITY_ROLE = 'COMMUNITY';

export interface OperationalGate {
  canActivateOperationalData: Signal<boolean>;
  hasActivatedOperationalData: Signal<boolean>;
  canDisplayOperationalData: Signal<boolean>;
  canMutateOperationalData: Signal<boolean>;
  canUseFinanceData: Signal<boolean>;
  blockedMessage: Signal<string>;
  isOffline: Signal<boolean>;
  isOnline: Signal<boolean>;
  markActivated: () => void;
  clearActivation: () => void;
}

@Injectable({ providedIn: 'root' })
export class OperationalGateService {
  private readonly attendanceFacade = inject(AttendanceFacade);
  private readonly sessionService = inject(SessionService);
  private readonly activatedFlows = signal<Record<string, boolean>>({});

  private readonly primaryRole = computed(() => this.sessionService.session()?.primaryRole ?? '');
  private readonly attendanceDetail = computed(() => this.attendanceFacade.attendanceDetail());
  private readonly isCommunityRole = computed(() => this.primaryRole() === COMMUNITY_ROLE);
  /** Rol siempre operativo (no marca asistencia): ver ALWAYS_OPERATIONAL_ROLES. */
  private readonly isAlwaysOperationalRole = computed(() =>
    ALWAYS_OPERATIONAL_ROLES.has(this.primaryRole())
  );
  private readonly communityHasScheduleToday = computed(
    () => this.isCommunityRole() && this.attendanceFacade.statusConfirmed() && this.attendanceDetail()?.tieneHorario === true
  );
  private readonly communityWithoutScheduleToday = computed(
    () => this.isCommunityRole() && this.attendanceFacade.statusConfirmed() && this.attendanceDetail()?.tieneHorario === false
  );
  private readonly communityCheckedInToday = computed(
    () => this.isCommunityRole() && this.communityHasScheduleToday() && this.attendanceDetail()?.fechaHoraIngreso !== null
  );

  readonly currentStatus = computed(() => this.attendanceFacade.currentStatus());
  readonly canActivateOperationalData = computed(() => {
    if (this.isAlwaysOperationalRole()) {
      return true;
    }
    if (this.isCommunityRole()) {
      return this.communityCheckedInToday();
    }
    return this.attendanceFacade.isOperational();
  });
  readonly canMutateOperationalData = this.canActivateOperationalData;
  readonly canUseFinanceData = computed(
    () => this.canActivateOperationalData() || this.communityWithoutScheduleToday()
  );
  readonly blockedMessage = computed(() => {
    if (this.isCommunityRole()) {
      if (this.communityWithoutScheduleToday()) {
        return 'Hoy no tienes horario asignado. Solo Finanzas está disponible.';
      }
      return 'Marca ONLINE para comenzar tu día.';
    }
    return 'Marca ONLINE para continuar.';
  });
  readonly shouldWarnBeforeUnload = computed(() => this.currentStatus() !== 'OFFLINE');
  /**
   * OFFLINE **confirmado por el backend**, no el OFFLINE por defecto de un estado aun sin cargar.
   * Las vistas deben limpiar/cerrar su bandeja solo con esto, nunca con un OFFLINE "no confirmado"
   * (que en realidad es "verificando"), para no vaciar la vista durante una ventana de carga/re-login.
   */
  readonly isConfirmedOffline = computed(
    () => this.attendanceFacade.statusConfirmed() && this.currentStatus() === 'OFFLINE'
  );

  createGate(flowKey: string): OperationalGate {
    const hasActivatedOperationalData = computed(() => this.activatedFlows()[flowKey] === true);

    return {
      canActivateOperationalData: this.canActivateOperationalData,
      hasActivatedOperationalData,
      canDisplayOperationalData: computed(() => this.canActivateOperationalData() || hasActivatedOperationalData()),
      canMutateOperationalData: this.canMutateOperationalData,
      canUseFinanceData: this.canUseFinanceData,
      blockedMessage: this.blockedMessage,
      isOffline: computed(() => this.currentStatus() === 'OFFLINE'),
      isOnline: computed(() => this.currentStatus() === 'ONLINE'),
      markActivated: () => this.markActivated(flowKey),
      clearActivation: () => this.clearActivation(flowKey)
    };
  }

  markActivated(flowKey: string): void {
    this.activatedFlows.update((flows) => ({ ...flows, [flowKey]: true }));
  }

  clearActivation(flowKey: string): void {
    this.activatedFlows.update((flows) => {
      if (!flows[flowKey]) {
        return flows;
      }

      const next = { ...flows };
      delete next[flowKey];
      return next;
    });
  }
}
