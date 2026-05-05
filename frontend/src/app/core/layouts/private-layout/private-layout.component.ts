import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { UserSession } from '../../../shared/models/auth/user-session';

@Component({
  selector: 'app-private-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.scss'
})
export class PrivateLayoutComponent {
  protected readonly session: UserSession | null;

  constructor(
    private readonly sessionService: SessionService,
    private readonly router: Router
  ) {
    this.session = this.sessionService.getSession();
  }

  protected logout(): void {
    this.sessionService.clearSession();
    void this.router.navigate(['/auth/access']);
  }
}
