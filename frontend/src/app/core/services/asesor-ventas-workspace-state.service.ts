import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AsesorVentasWorkspaceStateService {
  private readonly assignedLeadCountState = signal(0);

  readonly assignedLeadCount = this.assignedLeadCountState.asReadonly();

  setAssignedLeadCount(count: number): void {
    this.assignedLeadCountState.set(Math.max(count, 0));
  }

  clear(): void {
    this.assignedLeadCountState.set(0);
  }
}
