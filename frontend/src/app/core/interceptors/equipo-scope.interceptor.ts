import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CurrentUserTeamScopeService } from '../services/current-user-team-scope.service';

/**
 * Adjunta el equipo activo a las requests a /leads para acotar usuarios multiequipo.
 */
export const equipoScopeInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/leads')) {
    return next(req);
  }
  const teamScope = inject(CurrentUserTeamScopeService);
  const activeId = teamScope.activeId();
  if (activeId === null || !teamScope.isTeamScoped()) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: {
        'X-Equipo-Id': String(activeId)
      }
    })
  );
};
