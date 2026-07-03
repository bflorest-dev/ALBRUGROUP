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
import { STORAGE_KEYS } from '../../constants/storage.constants';
import { GtrAgendadosAlertFacade } from '../../../features/gtr/facades/gtr-agendados-alert.facade';
import { EquiposNavService } from '../../services/equipos-nav.service';

type SidebarItem = {
  label: string;
  route?: string;
  icon: string;
  badge?: string | number;
  alertActive?: boolean;
  alertLabel?: string;
  exact?: boolean;
  /** Sub-items de un grupo expandible (p. ej. COLABORADORES). */
  children?: SidebarItem[];
  /** Marca el primer hijo de un bloque distinto (dibuja un divisor arriba). */
  startsGroup?: boolean;
};

const ROLE_THEME_CLASS: Record<string, string> = {
  ADMINISTRADOR: 'theme-admin',
  RRHH: 'theme-rrhh',
  RECLUTADOR: 'theme-recruiter',
  CAPACITADOR: 'theme-trainer',
  ASESOR_GTR: 'theme-gtr',
  SUPERVISOR_GTR: 'theme-gtr',
  ASESOR_VENTAS: 'theme-sales',
  OJT: 'theme-sales',
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
  private readonly gtrAgendadosAlertFacade = inject(GtrAgendadosAlertFacade);
  private readonly equiposNav = inject(EquiposNavService);
  protected readonly profileMenuOpen = signal(false);
  protected readonly mobileMenuOpen = signal(false);
  // Grupos expandibles del sidebar (clave = label del padre). Colaboradores
  // arranca abierto para que sus categorias esten a la vista.
  protected readonly expandedGroups = signal<Record<string, boolean>>({ Colaboradores: true });
  protected readonly adminDeleteLeadsVisible = signal(this.readAdminDeleteLeadsVisible());
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
      const colaboradoresChildren: SidebarItem[] = [
        ...this.equiposNav.activeTeams().map((team) => ({
          label: team.nombre,
          route: `/app/admin/colaboradores/equipo-${team.id}`,
          icon: 'pi pi-users',
          exact: true
        })),
        { label: 'Sin equipo', route: '/app/admin/colaboradores/sin-equipo', icon: 'pi pi-user', exact: true, startsGroup: true },
        { label: 'Inactivos', route: '/app/admin/colaboradores/inactivos', icon: 'pi pi-user-minus', exact: true }
      ];

      const items: SidebarItem[] = [
        { label: 'Dashboard', route: '/app/admin/dashboard', icon: 'pi pi-chart-pie', exact: true },
        { label: 'Colaboradores', icon: 'pi pi-users', children: colaboradoresChildren },
        { label: 'Personal', route: '/app/admin/personal', icon: 'pi pi-id-card', exact: true },
        { label: 'Empleabilidad', route: '/app/admin/empleabilidad', icon: 'pi pi-briefcase' },
        { label: 'Tipificaciones', route: '/app/admin/tipificaciones', icon: 'pi pi-sitemap', exact: true },
        { label: 'Equipos', route: '/app/admin/equipos', icon: 'pi pi-th-large', exact: true },
        { label: 'Mantenimiento', route: '/app/admin/mantenimiento', icon: 'pi pi-database', exact: true },
        { label: 'Leads del día', route: '/app/admin/leads-del-dia', icon: 'pi pi-user-plus', exact: true },
        { label: 'Finanzas', route: '/app/admin/finanzas', icon: 'pi pi-wallet', exact: true },
        { label: 'Ranking', route: '/app/admin/ranking', icon: 'pi pi-chart-bar', exact: true }
      ];

      if (this.adminDeleteLeadsVisible()) {
        items.push({ label: 'Eliminar Leads', route: '/app/admin/eliminar-leads', icon: 'pi pi-trash', exact: true });
      }

      return items;
    }

    if (session.primaryRole === 'RRHH') {
      return [
        { label: 'Asistencia', route: '/app/rrhh/asistencia', icon: 'pi pi-clock', exact: true },
        { label: 'Personal', route: '/app/rrhh/personal', icon: 'pi pi-users', exact: true }
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
        { label: 'Leads del día', route: '/app/community/leads-del-dia', icon: 'pi pi-user-plus', exact: true },
        { label: 'Finanzas', route: '/app/community/finanzas', icon: 'pi pi-wallet', exact: true },
        { label: 'Metricas', route: '/app/community/metricas', icon: 'pi pi-chart-line', exact: true }
      ];
    }

    if (session.primaryRole === 'ASESOR_VENTAS' || session.primaryRole === 'OJT') {
      return [
        { label: 'Plataforma', route: '/app/asesor-ventas/plataforma', icon: 'pi pi-desktop', exact: true },
        { label: 'Mis Preventas', route: '/app/asesor-ventas/mis-preventas', icon: 'pi pi-check-square', exact: true },
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
        {
          label: 'Agendados',
          route: '/app/gtr/agendados',
          icon: 'pi pi-calendar',
          badge: this.gtrAgendadosAlertFacade.totalActivos(),
          alertActive: this.gtrAgendadosAlertFacade.hasCurrentHourWarning(),
          alertLabel: this.gtrAgendadosAlertFacade.accessibleLabel(),
          exact: true
        },
        { label: 'Historicos', route: '/app/gtr/historicos', icon: 'pi pi-history', exact: true },
        { label: 'Leads del día', route: '/app/gtr/leads-del-dia', icon: 'pi pi-user-plus', exact: true },
        { label: 'Ranking', route: '/app/gtr/ranking', icon: 'pi pi-chart-bar', exact: true }
      ];
    }

    if (session.primaryRole === 'ASESOR_BACKOFFICE' || session.primaryRole === 'SUPERVISOR_BACKOFFICE') {
      return [
        { label: 'Plataforma', route: '/app/backoffice/plataforma', icon: 'pi pi-desktop', exact: true },
        { label: 'Gestion', route: '/app/backoffice/gestion', icon: 'pi pi-briefcase', exact: true },
        { label: 'Programados', route: '/app/backoffice/programados', icon: 'pi pi-calendar-clock', exact: true }
      ];
    }

    return [{ label: 'Inicio', route: session.homeRoute, icon: 'pi pi-home', exact: true }];
  });

  protected isGroupExpanded(label: string): boolean {
    return this.expandedGroups()[label] ?? false;
  }

  protected toggleGroup(label: string): void {
    this.expandedGroups.update((current) => ({ ...current, [label]: !(current[label] ?? false) }));
  }

  constructor() {
    // El submenu de COLABORADORES se arma con los equipos activos; se cargan una
    // sola vez cuando la sesion es de ADMINISTRADOR.
    effect(() => {
      if (this.session()?.primaryRole === 'ADMINISTRADOR') {
        this.equiposNav.ensureLoaded();
      }
    });

    effect(() => {
      const session = this.session();

      if (session?.primaryRole === 'ASESOR_GTR' || session?.primaryRole === 'SUPERVISOR_GTR') {
        this.gtrAgendadosAlertFacade.start();
      } else {
        this.gtrAgendadosAlertFacade.stop();
      }

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

        this.attendanceRealtimeService
          .watchTopic(`/topic/asistencia/empleado/${session.empleadoId}`)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (event) => {
              if (
                event.tipo === 'EXCEPCION_HORARIO_AFECTADA' &&
                event.fecha === this.getToday()
              ) {
                this.attendanceFacade.reload();
              }
            }
          });
      }
    });
  }

  private getToday(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  protected submitAttendanceAction(actionId: AttendanceActionId): void {
    this.attendanceErrorMessage.set('');
    if (
      actionId === 'REGISTRAR_SALIDA' &&
      (this.session()?.primaryRole === 'ASESOR_VENTAS' || this.session()?.primaryRole === 'OJT') &&
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

  protected toggleAdminDeleteLeadsVisible(): void {
    this.adminDeleteLeadsVisible.update((value) => {
      const nextValue = !value;
      localStorage.setItem(STORAGE_KEYS.adminDeleteLeadsVisible, String(nextValue));
      return nextValue;
    });
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

  private readAdminDeleteLeadsVisible(): boolean {
    return localStorage.getItem(STORAGE_KEYS.adminDeleteLeadsVisible) === 'true';
  }
}
