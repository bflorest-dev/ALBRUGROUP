import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IdleSessionService } from '../services/idle-session.service';
import { SessionService } from '../services/session.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const idleSessionService = inject(IdleSessionService);
  const sessionService = inject(SessionService);

  if (idleSessionService.hasExpired()) {
    idleSessionService.expireSession();
    return router.createUrlTree(['/auth/access']);
  }

  if (sessionService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/access']);
};
