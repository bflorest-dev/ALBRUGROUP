import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { STORAGE_KEYS } from '../constants/storage.constants';
import { ROLE_HOME_ROUTES, resolveDefaultActiveRole } from '../constants/role.constants';
import { UserSession } from '../../shared/models/auth/user-session';
import { TokenService } from './token.service';
import { AsesorVentasWorkspaceStateService } from './asesor-ventas-workspace-state.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly sessionState = signal<UserSession | null>(this.readStoredSession());
  private readonly asesorVentasWorkspaceState = inject(AsesorVentasWorkspaceStateService);
  readonly session = this.sessionState.asReadonly();
  readonly activeRole = computed(() => this.sessionState()?.activeRole ?? this.sessionState()?.primaryRole ?? null);
  readonly primaryRole = this.activeRole;
  readonly homeRoute = computed(() => {
    const activeRole = this.activeRole();
    return activeRole ? ROLE_HOME_ROUTES[activeRole] ?? '/app/admin' : '/auth/access';
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
    this.sessionState.set(this.normalizeSession(session));
  }

  getPrimaryRole(): string | null {
    return this.activeRole();
  }

  getActiveRole(): string | null {
    return this.activeRole();
  }

  hasRole(role: string): boolean {
    return this.sessionState()?.roles.includes(role) ?? false;
  }

  hasAnyRole(roles: readonly string[]): boolean {
    const sessionRoles = this.sessionState()?.roles ?? [];
    return roles.some((role) => sessionRoles.includes(role));
  }

  setActiveRole(role: string): boolean {
    const session = this.sessionState();
    if (!session?.roles.includes(role)) {
      return false;
    }
    this.sessionState.set({
      ...session,
      activeRole: role,
      homeRoute: ROLE_HOME_ROUTES[role] ?? session.homeRoute
    });
    return true;
  }

  getHomeRoute(): string {
    return this.homeRoute();
  }

  clearSession(): void {
    this.tokenService.clearTokens();
    this.sessionState.set(null);
    this.asesorVentasWorkspaceState.clear();
    localStorage.removeItem(STORAGE_KEYS.lastActivityAt);
  }

  private readStoredSession(): UserSession | null {
    const session = localStorage.getItem(STORAGE_KEYS.session);

    if (!session) {
      return null;
    }

    try {
      return this.normalizeSession(JSON.parse(session) as UserSession);
    } catch {
      localStorage.removeItem(STORAGE_KEYS.session);
      return null;
    }
  }

  private normalizeSession(session: UserSession): UserSession {
    const roles = session.roles ?? [];
    const primaryRole = session.primaryRole && roles.includes(session.primaryRole)
      ? session.primaryRole
      : roles[0] ?? null;
    const activeRole = session.activeRole && roles.includes(session.activeRole)
      ? session.activeRole
      : resolveDefaultActiveRole(roles);
    return {
      ...session,
      roles,
      primaryRole,
      activeRole,
      homeRoute: activeRole ? ROLE_HOME_ROUTES[activeRole] ?? session.homeRoute : session.homeRoute
    };
  }
}
