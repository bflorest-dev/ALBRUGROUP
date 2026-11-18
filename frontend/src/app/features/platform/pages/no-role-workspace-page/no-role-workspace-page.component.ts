import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { homeRouteForRole, ROLE_HOME_ROUTES } from '../../../../core/constants/role.constants';
import { SessionService } from '../../../../core/services/session.service';
import { formatLabel } from '../../../../shared/utils/display-label';

@Component({
  selector: 'app-no-role-workspace-page',
  imports: [RouterLink],
  templateUrl: './no-role-workspace-page.component.html',
  styleUrl: './no-role-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoRoleWorkspacePageComponent {
  private readonly sessionService = inject(SessionService);

  protected readonly session = this.sessionService.session;
  protected readonly activeRole = this.sessionService.activeRole;
  protected readonly hasAssignedRole = computed(() => Boolean(this.activeRole()));
  protected readonly roleLabel = computed(() => formatLabel(this.activeRole()));
  protected readonly roleIsSupported = computed(() => {
    const role = this.activeRole();
    return Boolean(role && ROLE_HOME_ROUTES[role]);
  });
  protected readonly title = computed(() =>
    this.hasAssignedRole() && !this.roleIsSupported()
      ? 'Estamos preparando tu espacio'
      : 'Tu espacio todavía no está configurado'
  );
  protected readonly description = computed(() => {
    if (!this.hasAssignedRole()) {
      return 'Tu cuenta está activa, pero aún no tiene un rol operativo asignado.';
    }

    return `Tu cuenta tiene el rol ${this.roleLabel()}, pero todavía no existe un módulo operativo para este rol.`;
  });
  protected readonly accountName = computed(() =>
    this.session()?.nombreCompleto || this.session()?.username || 'Tu cuenta'
  );
  protected readonly homeRoute = homeRouteForRole(null);
}
