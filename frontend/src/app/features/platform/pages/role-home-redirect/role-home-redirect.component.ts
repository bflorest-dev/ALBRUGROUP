import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../../../../core/services/session.service';

@Component({
  selector: 'app-role-home-redirect',
  template: ''
})
export class RoleHomeRedirectComponent {
  private readonly router = inject(Router);
  private readonly sessionService = inject(SessionService);

  constructor() {
    void this.router.navigate([this.sessionService.getHomeRoute()]);
  }
}
