import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionService } from '../../services/session.service';

type SidebarItem = {
  label: string;
  route: string;
  exact?: boolean;
};

@Component({
  selector: 'app-private-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivateLayoutComponent {
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  protected readonly session = this.sessionService.session;
  protected readonly menuItems = computed<SidebarItem[]>(() => {
    const session = this.session();

    if (!session) {
      return [];
    }

    if (session.primaryRole === 'ADMINISTRADOR') {
      return [
        { label: 'Personal', route: '/app/admin/personal' },
        { label: 'Empleabilidad', route: '/app/admin/empleabilidad' }
      ];
    }

    if (session.primaryRole === 'RRHH') {
      return [{ label: 'Postulantes', route: '/app/rrhh/postulantes' }];
    }

    if (session.primaryRole === 'RECLUTADOR') {
      return [
        { label: 'Grupos de capacitacion', route: '/app/reclutador/grupos-capacitacion' },
        { label: 'Postulantes', route: '/app/reclutador/postulantes' }
      ];
    }

    return [{ label: 'Inicio', route: session.homeRoute, exact: true }];
  });

  protected logout(): void {
    this.sessionService.clearSession();
    void this.router.navigate(['/auth/access']);
  }
}
