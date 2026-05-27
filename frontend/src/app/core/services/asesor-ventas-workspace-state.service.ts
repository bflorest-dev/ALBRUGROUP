import { Injectable, effect, signal } from '@angular/core';
import { STORAGE_KEYS } from '../constants/storage.constants';

type AsesorVentasWorkspaceSnapshot = {
  assignedLeadCount: number;
  activeLeadId: number | null;
  isManagingLead: boolean;
  lastSyncedAt: string | null;
};

@Injectable({ providedIn: 'root' })
export class AsesorVentasWorkspaceStateService {
  private readonly state = signal<AsesorVentasWorkspaceSnapshot>(this.readStoredState());
  private readonly assignedLeadCountState = signal(this.state().assignedLeadCount);

  readonly assignedLeadCount = this.assignedLeadCountState.asReadonly();

  constructor() {
    effect(() => {
      const state = this.state();
      localStorage.setItem(STORAGE_KEYS.asesorVentasWorkspace, JSON.stringify(state));
    });

    effect(() => {
      this.assignedLeadCountState.set(this.state().assignedLeadCount);
    });
  }
  setAssignedLeadCount(count: number): void {
    this.state.update((current) => ({
      ...current,
      assignedLeadCount: Math.max(count, 0),
      lastSyncedAt: new Date().toISOString()
    }));
  }

  setManagingLeadState(activeLeadId: number): void {
    this.state.update((current) => ({
      ...current,
      activeLeadId,
      isManagingLead: true,
      lastSyncedAt: new Date().toISOString()
    }));
  }

  clearManagingLeadState(): void {
    this.state.update((current) => ({
      ...current,
      activeLeadId: null,
      isManagingLead: false,
      lastSyncedAt: new Date().toISOString()
    }));
  }

  snapshot(): AsesorVentasWorkspaceSnapshot {
    return this.state();
  }

  clear(): void {
    this.state.set({
      assignedLeadCount: 0,
      activeLeadId: null,
      isManagingLead: false,
      lastSyncedAt: null
    });
    localStorage.removeItem(STORAGE_KEYS.asesorVentasWorkspace);
  }

  private readStoredState(): AsesorVentasWorkspaceSnapshot {
    const stored = localStorage.getItem(STORAGE_KEYS.asesorVentasWorkspace);

    if (!stored) {
      return {
        assignedLeadCount: 0,
        activeLeadId: null,
        isManagingLead: false,
        lastSyncedAt: null
      };
    }

    try {
      const parsed = JSON.parse(stored) as Partial<AsesorVentasWorkspaceSnapshot>;
      return {
        assignedLeadCount: Math.max(0, Number(parsed.assignedLeadCount ?? 0)),
        activeLeadId: parsed.activeLeadId && parsed.activeLeadId > 0 ? parsed.activeLeadId : null,
        isManagingLead: Boolean(parsed.isManagingLead),
        lastSyncedAt: typeof parsed.lastSyncedAt === 'string' ? parsed.lastSyncedAt : null
      };
    } catch {
      localStorage.removeItem(STORAGE_KEYS.asesorVentasWorkspace);
      return {
        assignedLeadCount: 0,
        activeLeadId: null,
        isManagingLead: false,
        lastSyncedAt: null
      };
    }
  }
}
