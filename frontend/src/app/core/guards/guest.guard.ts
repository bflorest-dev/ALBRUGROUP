import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IdleSessionService } from '../services/idle-session.service';
import { SessionService } from '../services/session.service';

export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  const idleSessionService = inject(IdleSessionService);
  const sessionService = inject(SessionService);

  if (idleSessionService.hasExpired()) {
    idleSessionService.expireSession();
    return true;
  }

  if (sessionService.isAuthenticated()) {
    const homeRoute = sessionService.getHomeRoute();
    if (homeRoute.startsWith('/auth')) {
      return true;
    }
    return router.createUrlTree([homeRoute]);
  }

  return true;
};
