import { Injectable } from '@angular/core';
import { STORAGE_KEYS } from '../constants/storage.constants';
import { ROLE_HOME_ROUTES } from '../constants/role.constants';
import { UserSession } from '../../shared/models/auth/user-session';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  constructor(private readonly tokenService: TokenService) {}

  isAuthenticated(): boolean {
    return !!this.tokenService.getToken();
  }

  getSession(): UserSession | null {
    const session = localStorage.getItem(STORAGE_KEYS.session);

    if (!session) {
      return null;
    }

    try {
      return JSON.parse(session) as UserSession;
    } catch {
      this.clearSession();
      return null;
    }
  }

  setSession(session: UserSession): void {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  }

  getPrimaryRole(): string | null {
    return this.getSession()?.primaryRole ?? null;
  }

  getHomeRoute(): string {
    const primaryRole = this.getPrimaryRole();

    if (!primaryRole) {
      return '/auth/access';
    }

    return ROLE_HOME_ROUTES[primaryRole] ?? '/app/admin';
  }

  clearSession(): void {
    this.tokenService.clearToken();
    localStorage.removeItem(STORAGE_KEYS.session);
  }
}
