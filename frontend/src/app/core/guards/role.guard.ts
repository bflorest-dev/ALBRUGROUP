import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { IdleSessionService } from '../services/idle-session.service';
import { SessionService } from '../services/session.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const idleSessionService = inject(IdleSessionService);
  const sessionService = inject(SessionService);
  const allowedRoles = route.data['roles'] as string[] | undefined;
  const primaryRole = sessionService.getPrimaryRole();

  if (idleSessionService.hasExpired()) {
    idleSessionService.expireSession();
    return router.createUrlTree(['/auth/access']);
  }

  if (!primaryRole) {
    return router.createUrlTree(['/auth/access']);
  }

  if (!allowedRoles?.includes(primaryRole)) {
    const homeRoute = sessionService.getHomeRoute();
    return router.createUrlTree([homeRoute]);
  }

  return true;
};
