import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { STORAGE_KEYS } from '../constants/storage.constants';
import { AuthSessionService } from './auth-session.service';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class IdleSessionService {
  private static readonly idleTimeoutMs = 90 * 60 * 1000;
  private readonly checkIntervalMs = 60 * 1000;
  private checkTimerId: number | null = null;
  private initialized = false;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly sessionService: SessionService,
    private readonly authSessionService: AuthSessionService
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

  /**
   * Expiracion por inactividad. Delega en el teardown unico y guardado de AuthSessionService, el mismo
   * que usa el interceptor, para que timer, guards e interceptor sigan un solo camino idempotente.
   */
  expireSession(): void {
    this.authSessionService.expireIdleSession();
  }

  private registerActivityListeners(): void {
    const windowRef = this.document.defaultView;
    if (!windowRef) {
      return;
    }

    const activityEvents: Array<keyof WindowEventMap> = ['click', 'keydown', 'pointerdown', 'touchstart'];
    activityEvents.forEach((eventName) => {
      windowRef.addEventListener(eventName, this.handleUserActivity, { passive: true });
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

    this.checkTimerId = windowRef.setInterval(() => {
      if (this.hasExpired()) {
        this.expireSession();
      }
    }, this.checkIntervalMs);
  }

  private isBrowser(): boolean {
    return !!this.document.defaultView;
  }
}
