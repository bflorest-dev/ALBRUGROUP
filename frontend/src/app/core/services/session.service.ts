import { Injectable, computed, effect, signal } from '@angular/core';
import { STORAGE_KEYS } from '../constants/storage.constants';
import { ROLE_HOME_ROUTES } from '../constants/role.constants';
import { UserSession } from '../../shared/models/auth/user-session';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly sessionState = signal<UserSession | null>(this.readStoredSession());
  readonly session = this.sessionState.asReadonly();
  readonly primaryRole = computed(() => this.sessionState()?.primaryRole ?? null);
  readonly homeRoute = computed(() => {
    const primaryRole = this.primaryRole();
    return primaryRole ? ROLE_HOME_ROUTES[primaryRole] ?? '/app/admin' : '/auth/access';
  });

  constructor(private readonly tokenService: TokenService) {
    effect(() => {
      const session = this.sessionState();

      if (session) {
        localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
        return;
      }

      localStorage.removeItem(STORAGE_KEYS.session);
    });
  }

  isAuthenticated(): boolean {
    return !!this.tokenService.getAccessToken();
  }

  getSession(): UserSession | null {
    return this.sessionState();
  }

  setSession(session: UserSession): void {
    this.sessionState.set(session);
  }

  getPrimaryRole(): string | null {
    return this.primaryRole();
  }

  getHomeRoute(): string {
    return this.homeRoute();
  }

  clearSession(): void {
    this.tokenService.clearTokens();
    this.sessionState.set(null);
    localStorage.removeItem(STORAGE_KEYS.lastActivityAt);
  }

  private readStoredSession(): UserSession | null {
    const session = localStorage.getItem(STORAGE_KEYS.session);

    if (!session) {
      return null;
    }

    try {
      return JSON.parse(session) as UserSession;
    } catch {
      localStorage.removeItem(STORAGE_KEYS.session);
      return null;
    }
  }
}
