import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthSessionService } from '../services/auth-session.service';
import { IdleSessionService } from '../services/idle-session.service';
import { TokenService } from '../services/token.service';

const HAS_REFRESH_RETRY = new HttpContextToken<boolean>(() => false);

function isPublicAuthRequest(url: string): boolean {
  return (
    url.includes('/auth/autorizacion/login') ||
    url.includes('/auth/autorizacion/forgot-password') ||
    url.includes('/auth/autorizacion/estado-acceso/') ||
    url.includes('/auth/autorizacion/refresh') ||
    url.includes('/auth/autorizacion/logout')
  );
}

function isSessionTeardownRequest(url: string): boolean {
  return url.includes('/presence/offline');
}

function withAuthorizationHeader<T extends { clone: (update: object) => T }>(request: T, token: string): T {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authSessionService = inject(AuthSessionService);
  const token = tokenService.getAccessToken();
  const isPublicRequest = isPublicAuthRequest(req.url);
  const isTeardownRequest = isSessionTeardownRequest(req.url);
  if (token && !isPublicRequest && !isTeardownRequest && IdleSessionService.isStoredSessionExpired()) {
    authSessionService.expireIdleSession();
    return throwError(() => new Error('Session expired due to inactivity.'));
  }

  const request = !token || isPublicRequest ? req : withAuthorizationHeader(req, token);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        isPublicRequest ||
        isTeardownRequest ||
        request.context.get(HAS_REFRESH_RETRY)
      ) {
        return throwError(() => error);
      }

      return authSessionService.refreshAccessToken().pipe(
        switchMap((refreshedToken) =>
          next(
            withAuthorizationHeader(
              request.clone({
                context: request.context.set(HAS_REFRESH_RETRY, true)
              }),
              refreshedToken
            )
          )
        ),
        catchError((refreshError: unknown) => throwError(() => refreshError))
      );
    })
  );
};
