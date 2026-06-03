import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BadgeModule } from 'primeng/badge';
import { AttendanceFacade } from '../../facades/attendance.facade';
import { AttendanceRealtimeService } from '../../services/attendance-realtime.service';
import { AuthSessionService } from '../../services/auth-session.service';
import { SessionService } from '../../services/session.service';
import { AttendanceStatusPickerComponent } from '../../../shared/components/attendance-status-picker/attendance-status-picker.component';
import { TopBannerComponent } from '../../../shared/components/top-banner/top-banner.component';
import { formatLabel } from '../../../shared/utils/display-label';
import { AttendanceActionId } from '../../../shared/models/schedule/estado-asistencia';
import { AsesorVentasWorkspaceStateService } from '../../services/asesor-ventas-workspace-state.service';

type SidebarItem = {
  label: string;
  route: string;
  icon: string;
  badge?: string | number;
  exact?: boolean;
};

const ROLE_THEME_CLASS: Record<string, string> = {
  ADMINISTRADOR: 'theme-admin',
  RRHH: 'theme-rrhh',
  RECLUTADOR: 'theme-recruiter',
  CAPACITADOR: 'theme-trainer',
  ASESOR_GTR: 'theme-gtr',
  SUPERVISOR_GTR: 'theme-gtr',
  ASESOR_VENTAS: 'theme-sales',
  SUPERVISOR_VENTAS: 'theme-sales',
  ASESOR_BACKOFFICE: 'theme-backoffice',
  SUPERVISOR_BACKOFFICE: 'theme-backoffice',
  ASESOR_POSTVENTA: 'theme-postventa',
  SUPERVISOR_POSTVENTA: 'theme-postventa',
  COMMUNITY: 'theme-community',
  MONITOR: 'theme-monitor'
};

@Component({
  selector: 'app-private-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AttendanceStatusPickerComponent,
    TopBannerComponent,
    BadgeModule
  ],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivateLayoutComponent {
  protected readonly attendanceFacade = inject(AttendanceFacade);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly attendanceRealtimeService = inject(AttendanceRealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly asesorVentasState = inject(AsesorVentasWorkspaceStateService);
  private readonly sessionService = inject(SessionService);
  protected readonly profileMenuOpen = signal(false);
  protected readonly mobileMenuOpen = signal(false);
  protected readonly attendanceErrorMessage = signal('');
  private attendanceInitialized = false;
  protected readonly session = this.sessionService.session;
  protected readonly isAdmin = computed(() => this.session()?.primaryRole === 'ADMINISTRADOR');
  protected readonly attendanceStatusLabel = computed(() => {
    if (this.isAdmin()) return 'ONLINE';
    if (this.attendanceFacade.isInitializing()) return 'Verificando';
    return this.attendanceFacade.currentStatusMeta().label;
  });
  protected readonly attendanceStatusColor = computed(() =>
    this.isAdmin() ? '#37c676' : this.attendanceFacade.currentStatusMeta().color
  );
  protected readonly attendanceActions = computed(() =>
    this.isAdmin() ? [] : this.attendanceFacade.availableActions()
  );
  protected readonly isAttendanceLoading = computed(() => {
    if (this.isAdmin()) return false;
    return this.attendanceFacade.isLoading() || this.attendanceFacade.isInitializing();
  });
  protected readonly isAttendancePickerDisabled = computed(() => this.isAdmin());
  protected readonly attendanceHint = computed(() =>
    this.isAdmin() ? '' : this.attendanceFacade.scheduleHint()
  );
  protected readonly themeClass = computed(() => {
    const primaryRole = this.session()?.primaryRole;
    return primaryRole ? ROLE_THEME_CLASS[primaryRole] ?? 'theme-admin' : 'theme-admin';
  });
  protected readonly primaryRoleLabel = computed(() => formatLabel(this.session()?.primaryRole));
  protected readonly userDisplayName = computed(() => {
    const session = this.session();
    return session?.nombreCompleto || session?.username || 'Usuario';
  });

  protected readonly menuItems = computed<SidebarItem[]>(() => {
    const session = this.session();

    if (!session) {
      return [];
    }

    if (session.primaryRole === 'ADMINISTRADOR') {
      return [
        { label: 'Inicio', route: '/app/admin/inicio', icon: 'pi pi-home', exact: true },
        { label: 'Personal', route: '/app/admin/personal', icon: 'pi pi-users', exact: true },
        { label: 'Empleabilidad', route: '/app/admin/empleabilidad', icon: 'pi pi-briefcase' },
        { label: 'Finanzas', route: '/app/admin/finanzas', icon: 'pi pi-wallet', exact: true },
        { label: 'Ranking', route: '/app/admin/ranking', icon: 'pi pi-chart-bar', exact: true }
      ];
    }

    if (session.primaryRole === 'RRHH') {
      return [
        { label: 'Asistencia', route: '/app/rrhh/asistencia', icon: 'pi pi-clock', exact: true },
        { label: 'Empleabilidad', route: '/app/rrhh/empleabilidad', icon: 'pi pi-id-card', exact: true },
        { label: 'Contrataciones', route: '/app/rrhh/contrataciones', icon: 'pi pi-file-edit', exact: true },
        { label: 'Pagos', route: '/app/rrhh/pagos', icon: 'pi pi-wallet', exact: true }
      ];
    }

    if (session.primaryRole === 'RECLUTADOR') {
      return [
        { label: 'Grupos de capacitacion', route: '/app/reclutador/grupos-capacitacion', icon: 'pi pi-users' },
        { label: 'Postulantes', route: '/app/reclutador/postulantes', icon: 'pi pi-list-check' }
      ];
    }

    if (session.primaryRole === 'COMMUNITY') {
      return [
        { label: 'Mantenimiento', route: '/app/community/mantenimiento', icon: 'pi pi-database', exact: true },
        { label: 'Finanzas', route: '/app/community/finanzas', icon: 'pi pi-wallet', exact: true },
        { label: 'Metricas', route: '/app/community/metricas', icon: 'pi pi-chart-line', exact: true }
      ];
    }

    if (session.primaryRole === 'ASESOR_VENTAS') {
      return [
        { label: 'Plataforma', route: '/app/asesor-ventas/plataforma', icon: 'pi pi-desktop', exact: true },
        { label: 'Horario', route: '/app/asesor-ventas/horario', icon: 'pi pi-calendar', exact: true },
        { label: 'Metricas', route: '/app/asesor-ventas/metricas', icon: 'pi pi-chart-bar', exact: true }
      ];
    }

    if (session.primaryRole === 'SUPERVISOR_VENTAS') {
      return [
        { label: 'Monitoreo', route: '/app/supervisor-ventas/monitoreo', icon: 'pi pi-chart-line', exact: true },
        { label: 'Gestion', route: '/app/supervisor-ventas/gestion', icon: 'pi pi-desktop', exact: true },
        { label: 'Reporte de Ventas', route: '/app/supervisor-ventas/reporte', icon: 'pi pi-file', exact: true }
      ];
    }

    if (session.primaryRole === 'ASESOR_GTR' || session.primaryRole === 'SUPERVISOR_GTR') {
      return [
        { label: 'Plataforma', route: '/app/gtr/plataforma', icon: 'pi pi-desktop', exact: true },
        { label: 'Agendados', route: '/app/gtr/agendados', icon: 'pi pi-calendar', exact: true },
        { label: 'Historicos', route: '/app/gtr/historicos', icon: 'pi pi-history', exact: true },
        { label: 'Ranking', route: '/app/gtr/ranking', icon: 'pi pi-chart-bar', exact: true }
      ];
    }

    if (session.primaryRole === 'ASESOR_BACKOFFICE' || session.primaryRole === 'SUPERVISOR_BACKOFFICE') {
      return [
        { label: 'Plataforma', route: '/app/backoffice/plataforma', icon: 'pi pi-desktop', exact: true },
        { label: 'Gestion', route: '/app/backoffice/gestion', icon: 'pi pi-briefcase', exact: true }
      ];
    }

    return [{ label: 'Inicio', route: session.homeRoute, icon: 'pi pi-home', exact: true }];
  });

  constructor() {
    effect(() => {
      const session = this.session();

      if (!session || session.primaryRole === 'ADMINISTRADOR' || this.attendanceInitialized) {
        return;
      }

      this.attendanceInitialized = true;
      this.attendanceFacade.initialize();
      if (session.empleadoId) {
        this.attendanceRealtimeService
          .watchBajaEmpleado(session.empleadoId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({ next: () => void this.authSessionService.logout() });
      }
    });
  }

  protected submitAttendanceAction(actionId: AttendanceActionId): void {
    this.attendanceErrorMessage.set('');
    if (
      actionId === 'REGISTRAR_SALIDA' &&
      this.session()?.primaryRole === 'ASESOR_VENTAS' &&
      this.asesorVentasState.assignedLeadCount() > 0
    ) {
      this.attendanceErrorMessage.set('No puedes marcar OFFLINE mientras tengas Leads en tu bandeja.');
      return;
    }

    this.attendanceFacade.submitAction(actionId);
  }

  protected attendancePickerErrorMessage(): string {
    if (this.isAdmin()) {
      return '';
    }

    const blockedExitMessage = this.attendanceErrorMessage();
    if (blockedExitMessage && this.asesorVentasState.assignedLeadCount() > 0) {
      return blockedExitMessage;
    }

    return this.attendanceFacade.errorMessage();
  }

  protected toggleProfileMenu(): void {
    this.profileMenuOpen.update((value) => !value);
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((value) => !value);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  protected async logout(): Promise<void> {
    this.profileMenuOpen.set(false);
    this.mobileMenuOpen.set(false);
    await this.authSessionService.logout();
  }
}
