import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { AttendanceFacade } from '../facades/attendance.facade';
import { SessionService } from './session.service';

/**
 * Roles que no participan del flujo de asistencia: su badge es ONLINE fijo en el layout
 * (isAlwaysOnlineRole) y el AttendanceFacade nunca los inicializa. Al no tener detalle de
 * asistencia, isOperational() es siempre false para ellos; por eso la puerta operativa debe
 * considerarlos operativos por definicion (si no, verian la vista bloqueada por una marcacion
 * que nunca hacen).
 */
const ALWAYS_OPERATIONAL_ROLES = new Set(['ADMINISTRADOR']);

export interface OperationalGate {
  canActivateOperationalData: Signal<boolean>;
  hasActivatedOperationalData: Signal<boolean>;
  canDisplayOperationalData: Signal<boolean>;
  canMutateOperationalData: Signal<boolean>;
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

  /** Rol siempre operativo (no marca asistencia): ver ALWAYS_OPERATIONAL_ROLES. */
  private readonly isAlwaysOperationalRole = computed(() =>
    ALWAYS_OPERATIONAL_ROLES.has(this.sessionService.session()?.primaryRole ?? '')
  );

  readonly currentStatus = computed(() => this.attendanceFacade.currentStatus());
  readonly canActivateOperationalData = computed(
    () => this.isAlwaysOperationalRole() || this.attendanceFacade.isOperational()
  );
  readonly canMutateOperationalData = computed(
    () => this.isAlwaysOperationalRole() || this.attendanceFacade.isOperational()
  );
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
