import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { AttendanceFacade } from '../facades/attendance.facade';

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
  private readonly activatedFlows = signal<Record<string, boolean>>({});

  readonly currentStatus = computed(() => this.attendanceFacade.currentStatus());
  readonly canActivateOperationalData = computed(() => this.attendanceFacade.isOperational());
  readonly canMutateOperationalData = computed(() => this.attendanceFacade.isOperational());
  readonly shouldWarnBeforeUnload = computed(() => this.currentStatus() !== 'OFFLINE');

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
