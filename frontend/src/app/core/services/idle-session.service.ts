import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { STORAGE_KEYS } from '../constants/storage.constants';
import { AttendanceFacade } from '../facades/attendance.facade';
import { PresenceService } from './presence.service';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class IdleSessionService {
  private static readonly idleTimeoutMs = 90 * 60 * 1000;
  private readonly checkIntervalMs = 60 * 1000;
  private checkTimerId: number | null = null;
  private initialized = false;
  private expiring = false;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly ngZone: NgZone,
    private readonly presenceService: PresenceService,
    private readonly router: Router,
    private readonly sessionService: SessionService,
    private readonly attendanceFacade: AttendanceFacade
  ) {}

  initialize(): void {
    if (this.initialized || !this.isBrowser()) {
      return;
    }

    this.initialized = true;
    this.registerActivityListeners();
    this.startIdleCheck();
  }

  markActivity(): void {
    if (!this.sessionService.isAuthenticated() || !this.isBrowser()) {
      return;
    }

    localStorage.setItem(STORAGE_KEYS.lastActivityAt, String(Date.now()));
  }

  hasExpired(): boolean {
    if (!this.sessionService.isAuthenticated() || !this.isBrowser()) {
      return false;
    }

    return IdleSessionService.isStoredSessionExpired();
  }

  static isStoredSessionExpired(): boolean {
    if (typeof localStorage === 'undefined') {
      return false;
    }

    const rawValue = localStorage.getItem(STORAGE_KEYS.lastActivityAt);
    if (!rawValue) {
      return true;
    }

    const lastActivityAt = Number(rawValue);
    return !Number.isFinite(lastActivityAt) || Date.now() - lastActivityAt >= IdleSessionService.idleTimeoutMs;
  }

  expireSession(): void {
    if (this.expiring) {
      return;
    }

    this.expiring = true;
    void this.closeShiftIfNeeded().finally(() => {
      void this.presenceService.offline().finally(() => {
        localStorage.removeItem(STORAGE_KEYS.lastActivityAt);
        this.sessionService.clearSession();
        void this.router.navigate(['/auth/access']);
        this.expiring = false;
      });
    });
  }

  /**
   * Si el empleado queda inactivo con su turno ya terminado pero sin marcar OFFLINE, cerramos su
   * jornada antes del logout para que igual quede su marca (el backend la estampa en su salida).
   * Si la inactividad ocurre dentro de su horario, NO cerramos: solo se cierra sesion y podra
   * reanudar al volver a entrar.
   */
  private async closeShiftIfNeeded(): Promise<void> {
    if (this.attendanceFacade.currentStatus() === 'ONLINE' && this.attendanceFacade.isPastSalida()) {
      await this.attendanceFacade.closeShiftSilently();
    }
  }

  private registerActivityListeners(): void {
    const windowRef = this.document.defaultView;
    if (!windowRef) {
      return;
    }

    const activityEvents: Array<keyof WindowEventMap> = ['click', 'keydown', 'pointerdown', 'touchstart'];
    this.ngZone.runOutsideAngular(() => {
      activityEvents.forEach((eventName) => {
        windowRef.addEventListener(eventName, this.handleUserActivity, { passive: true });
      });
    });
  }

  private readonly handleUserActivity = (): void => {
    this.markActivity();
  };

  private startIdleCheck(): void {
    const windowRef = this.document.defaultView;
    if (!windowRef || this.checkTimerId !== null) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.checkTimerId = windowRef.setInterval(() => {
        if (this.hasExpired()) {
          this.ngZone.run(() => this.expireSession());
        }
      }, this.checkIntervalMs);
    });
  }

  private isBrowser(): boolean {
    return !!this.document.defaultView;
  }
}
