import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  finalize,
  firstValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  throwError
} from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';
import { PresenceService } from './presence.service';
import { TokenService } from './token.service';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class AuthSessionService {
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly sessionService = inject(SessionService);
  private readonly presenceService = inject(PresenceService);
  private readonly router = inject(Router);
  private refreshInFlight$: Observable<string> | null = null;

  refreshAccessToken(): Observable<string> {
    const refreshToken = this.tokenService.getRefreshToken();

    if (!refreshToken) {
      this.clearSessionAndRedirect();
      return throwError(() => new Error('Missing refresh token.'));
    }

    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const refresh$ = this.authService.refresh({ refreshToken }).pipe(
      map((response) => {
        this.tokenService.setTokens(response.token, response.refreshToken);
        return response.token;
      }),
      catchError((error: HttpErrorResponse) => {
        this.clearSessionAndRedirect();
        return throwError(() => error);
      }),
      finalize(() => {
        this.refreshInFlight$ = null;
      }),
      shareReplay(1)
    );

    this.refreshInFlight$ = refresh$;
    return refresh$;
  }

  async logout(): Promise<void> {
    const refreshToken = this.tokenService.getRefreshToken();

    try {
      await this.presenceService.offline();

      if (refreshToken) {
        await firstValueFrom(
          this.authService.logout({ refreshToken }).pipe(
            catchError(() => of(void 0))
          )
        );
      }
    } finally {
      this.clearSessionAndRedirect();
    }
  }

  expireIdleSession(): void {
    void this.presenceService.offline().finally(() => this.clearSessionAndRedirect());
  }

  clearSessionAndRedirect(): void {
    this.sessionService.clearSession();
    void this.router.navigate(['/auth/access']);
  }
}
