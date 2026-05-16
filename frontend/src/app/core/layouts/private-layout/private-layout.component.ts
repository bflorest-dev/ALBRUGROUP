import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AttendanceFacade } from '../../facades/attendance.facade';
import { AuthSessionService } from '../../services/auth-session.service';
import { SessionService } from '../../services/session.service';
import { AttendanceStatusPickerComponent } from '../../../shared/components/attendance-status-picker/attendance-status-picker.component';

type SidebarItem = {
  label: string;
  route: string;
  exact?: boolean;
};

const ROLE_THEME_CLASS: Record<string, string> = {
  ADMINISTRADOR: 'theme-admin',
  RRHH: 'theme-rrhh',
  RECLUTADOR: 'theme-recruiter',
  CAPACITADOR: 'theme-recruiter',
  ASESOR_GTR: 'theme-admin',
  SUPERVISOR_GTR: 'theme-admin',
  ASESOR_VENTAS: 'theme-admin',
  SUPERVISOR_VENTAS: 'theme-admin',
  ASESOR_BACKOFFICE: 'theme-admin',
  SUPERVISOR_BACKOFFICE: 'theme-admin',
  ASESOR_POSTVENTA: 'theme-admin',
  SUPERVISOR_POSTVENTA: 'theme-admin',
  COMMUNITY: 'theme-admin',
  MONITOR: 'theme-admin'
};

@Component({
  selector: 'app-private-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AttendanceStatusPickerComponent],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivateLayoutComponent {
  protected readonly attendanceFacade = inject(AttendanceFacade);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly sessionService = inject(SessionService);
  protected readonly session = this.sessionService.session;
  protected readonly themeClass = computed(() => {
    const primaryRole = this.session()?.primaryRole;
    return primaryRole ? ROLE_THEME_CLASS[primaryRole] ?? 'theme-admin' : 'theme-admin';
  });

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

  constructor() {
    this.attendanceFacade.initialize();
  }

  protected async logout(): Promise<void> {
    await this.authSessionService.logout();
  }
}
