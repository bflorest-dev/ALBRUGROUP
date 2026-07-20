import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
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
  private readonly router = inject(Router);
  protected readonly profileMenuOpen = signal(false);
  protected readonly mobileMenuOpen = signal(false);
  // Grupos expandibles del sidebar (clave = label del padre).
  protected readonly expandedGroups = signal<Record<string, boolean>>({});
  private readonly currentUrl = signal(this.router.url);
  protected readonly adminDeleteLeadsVisible = signal(this.readAdminDeleteLeadsVisible());
  protected readonly attendanceErrorMessage = signal('');
  private attendanceInitialized = false;
  // Ultimo tick de salida ya procesado: al marcar OFFLINE (REGISTRAR_SALIDA) cerramos la sesion, y
  // este contador evita re-disparar el logout en un layout recreado tras un re-login.
  private handledSalidaTick = this.attendanceFacade.salidaSuccessTick();
  protected readonly session = this.sessionService.session;
  protected readonly isAdmin = computed(() => this.session()?.primaryRole === 'ADMINISTRADOR');
  protected readonly isAlwaysOnlineRole = computed(() => {
    const primaryRole = this.session()?.primaryRole;
    return primaryRole === 'ADMINISTRADOR' || primaryRole === 'COMMUNITY';
  });
  protected readonly attendanceStatusLabel = computed(() => {
    if (this.isAlwaysOnlineRole()) return 'ONLINE';
    // Sin confirmacion del backend mostramos un estado neutro "Verificando", nunca un OFFLINE por
    // defecto (que ademas dispararia el vaciado de la bandeja). Solo pintamos el estado real una vez
    // confirmado.
    if (!this.attendanceFacade.statusConfirmed()) return 'Verificando';
    return this.attendanceFacade.currentStatusMeta().label;
  });
  protected readonly attendanceStatusColor = computed(() => {
    if (this.isAlwaysOnlineRole()) return '#37c676';
    // Gris neutro mientras no haya confirmacion (coherente con "Verificando").
    if (!this.attendanceFacade.statusConfirmed()) return '#8f96ad';
    return this.attendanceFacade.currentStatusMeta().color;
  });
  protected readonly attendanceActions = computed(() =>
    this.isAlwaysOnlineRole() ? [] : this.attendanceFacade.availableActions()
  );
  protected readonly isAttendanceLoading = computed(() => {
    if (this.isAlwaysOnlineRole()) return false;
    return this.attendanceFacade.isLoading() || this.attendanceFacade.isInitializing();
  });
  protected readonly isAttendancePickerDisabled = computed(() => this.isAlwaysOnlineRole());
  protected readonly attendanceHint = computed(() =>
    this.isAlwaysOnlineRole() ? '' : this.attendanceFacade.scheduleHint()
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
        { label: 'CorrecciÃ³n de campaÃ±a', route: '/app/admin/correccion-campana', icon: 'pi pi-sync', exact: true },
        { label: 'Finanzas', route: '/app/admin/finanzas', icon: 'pi pi-wallet', exact: true },
        { label: 'Ranking', route: '/app/admin/ranking', icon: 'pi pi-chart-bar', exact: true },
        { label: 'Operaciones', route: '/app/admin/operaciones', icon: 'pi pi-wrench', exact: true }
      ];

      if (this.adminDeleteLeadsVisible()) {
        items.push({ label: 'Eliminar Leads', route: '/app/admin/eliminar-leads', icon: 'pi pi-trash', exact: true });
      }

      this.sortAdminMenu(items);
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
        { label: 'Corrección de campaña', route: '/app/community/correccion-campana', icon: 'pi pi-sync', exact: true },
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
          badge: this.gtrAgendadosAlertFacade.totalProgramadosHoy(),
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
        { label: 'Programados', route: '/app/backoffice/programados', icon: 'pi pi-calendar-clock', exact: true }
      ];
    }

    return [{ label: 'Inicio', route: session.homeRoute, icon: 'pi pi-home', exact: true }];
  });

  private sortAdminMenu(items: SidebarItem[]): void {
    for (const item of items) {
      if (item.route === '/app/admin/leads-del-dia') {
        item.label = 'Leads del Dia';
      }
      if (item.route === '/app/admin/correccion-campana') {
        item.label = 'Correccion de Campana';
      }
    }
    const order = new Map<string, number>([
      ['/app/admin/dashboard', 1],
      ['/app/admin/finanzas', 2],
      ['/app/admin/leads-del-dia', 3],
      ['Colaboradores', 4],
      ['/app/admin/ranking', 5],
      ['/app/admin/correccion-campana', 6],
      ['/app/admin/mantenimiento', 7],
      ['/app/admin/tipificaciones', 8],
      ['/app/admin/equipos', 9],
      ['/app/admin/operaciones', 10],
      ['/app/admin/personal', 11],
      ['/app/admin/empleabilidad', 12]
    ]);
    items.sort((left, right) => {
      const leftKey = left.route ?? left.label;
      const rightKey = right.route ?? right.label;
      return (order.get(leftKey) ?? 99) - (order.get(rightKey) ?? 99);
    });
  }

  protected isGroupExpanded(label: string): boolean {
    return this.expandedGroups()[label] ?? false;
  }

  protected toggleGroup(label: string): void {
    this.expandedGroups.update((current) => ({ ...current, [label]: !(current[label] ?? false) }));
  }

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));

    // El submenu de COLABORADORES se arma con los equipos activos; se cargan una
    // sola vez cuando la sesion es de ADMINISTRADOR.
    effect(() => {
      if (this.session()?.primaryRole === 'ADMINISTRADOR') {
        this.equiposNav.ensureLoaded();
      }
    });

    // Marcar OFFLINE = terminar la jornada: al registrarse la salida con exito, cerramos la sesion
    // (logout completo, limpia token y envia al login) para que la marcacion sea coherente.
    effect(() => {
      const tick = this.attendanceFacade.salidaSuccessTick();
      if (tick === this.handledSalidaTick) {
        return;
      }
      this.handledSalidaTick = tick;
      untracked(() => void this.authSessionService.logout());
    });

    effect(() => {
      const session = this.session();

      if (session?.primaryRole === 'ASESOR_GTR' || session?.primaryRole === 'SUPERVISOR_GTR') {
        this.gtrAgendadosAlertFacade.start();
      } else {
        this.gtrAgendadosAlertFacade.stop();
      }

      if (!session || session.primaryRole === 'ADMINISTRADOR' || session.primaryRole === 'COMMUNITY' || this.attendanceInitialized) {
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

    effect(() => {
      const isAdminColaboradores = this.currentUrl().startsWith('/app/admin/colaboradores');
      this.expandedGroups.update((current) => {
        if ((current['Colaboradores'] ?? false) === isAdminColaboradores) {
          return current;
        }
        return { ...current, Colaboradores: isAdminColaboradores };
      });
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
    if (this.isAlwaysOnlineRole()) {
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
