import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { IdleSessionService } from '../services/idle-session.service';
import { SessionService } from '../services/session.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const idleSessionService = inject(IdleSessionService);
  const sessionService = inject(SessionService);
  const allowedRoles = route.data['roles'] as string[] | undefined;
  const activeRole = sessionService.getActiveRole();

  if (idleSessionService.hasExpired()) {
    idleSessionService.expireSession();
    return router.createUrlTree(['/auth/access']);
  }

  if (!activeRole) {
    return router.createUrlTree(['/auth/access']);
  }

  if (!allowedRoles?.includes(activeRole)) {
    const matchingRole = allowedRoles?.find((role) => sessionService.hasRole(role));
    if (matchingRole && sessionService.setActiveRole(matchingRole)) {
      return true;
    }
    const homeRoute = sessionService.getHomeRoute();
    return router.createUrlTree([homeRoute]);
  }

  return true;
};
