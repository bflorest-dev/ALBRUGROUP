import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
  untracked
} from '@angular/core';
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
import { ATTENDANCE_STATUS_META, AttendanceActionId } from '../../../shared/models/schedule/estado-asistencia';
import { AsesorVentasWorkspaceStateService } from '../../services/asesor-ventas-workspace-state.service';
import { STORAGE_KEYS } from '../../constants/storage.constants';
import { ALWAYS_OPERATIONAL_ROLES } from '../../constants/operational-roles.constants';
import { GtrAgendadosAlertFacade } from '../../../features/gtr/facades/gtr-agendados-alert.facade';
import { EquiposNavService } from '../../services/equipos-nav.service';
import { CurrentUserProviderScopeService } from '../../services/current-user-provider-scope.service';
import { LeadMeritoCorreccionDrawerComponent } from '../../../shared/components/lead-merito-correccion-drawer/lead-merito-correccion-drawer.component';
import { AdminSidebarV2Component } from './admin-sidebar-v2.component';
import { SidebarDomainDefinition, SidebarItem } from './sidebar-item.model';
import { sidebarDomainsForRole, sidebarV2EnabledForRole } from './sidebar-v2.config';

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
    BadgeModule,
    LeadMeritoCorreccionDrawerComponent,
    AdminSidebarV2Component
  ],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivateLayoutComponent implements AfterViewInit {
  @ViewChild('sidebar') private sidebar?: ElementRef<HTMLElement>;
  @ViewChild('sidebarMenu') private sidebarMenu?: ElementRef<HTMLElement>;
  @ViewChild(LeadMeritoCorreccionDrawerComponent) private meritoDrawer?: LeadMeritoCorreccionDrawerComponent;
  protected readonly attendanceFacade = inject(AttendanceFacade);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly attendanceRealtimeService = inject(AttendanceRealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly asesorVentasState = inject(AsesorVentasWorkspaceStateService);
  private readonly sessionService = inject(SessionService);
  private readonly gtrAgendadosAlertFacade = inject(GtrAgendadosAlertFacade);
  private readonly equiposNav = inject(EquiposNavService);
  private readonly providerScope = inject(CurrentUserProviderScopeService);
  private readonly router = inject(Router);
  // Selector de proveedor (BACKOFFICE / POSTVENTA con más de un proveedor asignado).
  protected readonly proveedoresUsuario = this.providerScope.proveedores;
  protected readonly proveedorActivoId = this.providerScope.activeId;
  protected readonly mostrarSelectorProveedor = this.providerScope.mostrarSelector;
  protected readonly profileMenuOpen = signal(false);
  protected readonly mobileMenuOpen = signal(false);
  // Grupos expandibles del sidebar (clave estable del grupo).
  protected readonly expandedGroups = signal<Record<string, boolean>>({});
  protected readonly menuCanScrollUp = signal(false);
  protected readonly menuCanScrollDown = signal(false);
  private readonly currentUrl = signal(this.router.url);
  protected readonly adminDeleteLeadsVisible = signal(this.readAdminDeleteLeadsVisible());
  protected readonly attendanceErrorMessage = signal('');
  private attendanceInitialized = false;
  private menuScrollUpdateScheduled = false;
  // Ultimo tick de salida ya procesado: al marcar OFFLINE (REGISTRAR_SALIDA) cerramos la sesion, y
  // este contador evita re-disparar el logout en un layout recreado tras un re-login.
  private handledSalidaTick = this.attendanceFacade.salidaSuccessTick();
  protected readonly session = this.sessionService.session;
  protected readonly isAdmin = computed(() => this.session()?.primaryRole === 'ADMINISTRADOR');
  protected readonly usesSidebarV2 = computed(() => sidebarV2EnabledForRole(this.session()?.primaryRole));
  protected readonly sidebarDomainDefinitions = computed<SidebarDomainDefinition[]>(() =>
    sidebarDomainsForRole(this.session()?.primaryRole)
  );
  protected readonly canCorrectMerito = computed(() => {
    const primaryRole = this.session()?.primaryRole;
    return primaryRole === 'ADMINISTRADOR' || primaryRole === 'SUPERVISOR_VENTAS';
  });
  protected readonly isAlwaysOnlineRole = computed(() => {
    const primaryRole = this.session()?.primaryRole;
    return Boolean(primaryRole && ALWAYS_OPERATIONAL_ROLES.has(primaryRole));
  });
  protected readonly attendanceStatusLabel = computed(() => {
    if (this.isAlwaysOnlineRole()) return 'ONLINE';
    // Sin confirmacion del backend mostramos un estado neutro "Verificando", nunca un OFFLINE por
    // defecto (que ademas dispararia el vaciado de la bandeja). Solo pintamos el estado real una vez
    // confirmado.
    if (!this.attendanceFacade.statusConfirmed()) return 'Verificando';
    if (this.session()?.primaryRole === 'COMMUNITY') {
      return ATTENDANCE_STATUS_META[this.attendanceFacade.rawStatus()].label;
    }
    return this.attendanceFacade.currentStatusMeta().label;
  });
  protected readonly attendanceStatusColor = computed(() => {
    if (this.isAlwaysOnlineRole()) return '#37c676';
    // Gris neutro mientras no haya confirmacion (coherente con "Verificando").
    if (!this.attendanceFacade.statusConfirmed()) return '#8f96ad';
    if (this.session()?.primaryRole === 'COMMUNITY') {
      return ATTENDANCE_STATUS_META[this.attendanceFacade.rawStatus()].color;
    }
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
  protected readonly attendanceTramos = computed(() =>
    this.isAlwaysOnlineRole() ? [] : this.attendanceFacade.tramosVm()
  );
  protected readonly attendanceTimerText = computed(() =>
    this.isAlwaysOnlineRole() ? null : this.attendanceFacade.timerText()
  );
  protected readonly attendanceTimerOver = computed(() =>
    this.isAlwaysOnlineRole() ? false : this.attendanceFacade.timerOver()
  );
  protected readonly attendanceLunchWait = computed(() =>
    this.isAlwaysOnlineRole() ? false : this.attendanceFacade.lunchWait()
  );
  protected readonly attendanceLunchDuration = computed(() =>
    this.isAlwaysOnlineRole() ? null : this.attendanceFacade.lunchDurationMinutes()
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

      const dashboardChildren: SidebarItem[] = [
        { label: 'Preventa', route: '/app/admin/dashboard/preventa', icon: 'pi pi-users', exact: true },
        { label: 'Venta', route: '/app/admin/dashboard/venta', icon: 'pi pi-shopping-cart', exact: true },
        { label: 'Postventa', route: '/app/admin/dashboard/postventa', icon: 'pi pi-briefcase', exact: true },
        { label: 'Cobranza', route: '/app/admin/dashboard/cobranza', icon: 'pi pi-wallet', exact: true }
      ];

      const plataformasChildren: SidebarItem[] = [
        ...this.equiposNav.activeTeams().map((team) => ({
          key: `plataformas-equipo-${team.id}`,
          label: team.nombre,
          icon: 'pi pi-building',
          children: [
            {
              key: `plataformas-equipo-${team.id}-gtr`,
              label: 'GTR',
              icon: 'pi pi-headphones',
              children: [
                {
                  label: 'Plataforma',
                  route: `/app/admin/plataformas/equipos/${team.id}/gtr/plataforma`,
                  icon: 'pi pi-desktop',
                  exact: true
                },
                {
                  label: 'Agendados',
                  route: `/app/admin/plataformas/equipos/${team.id}/gtr/agendados`,
                  icon: 'pi pi-calendar',
                  exact: true
                },
                {
                  label: 'Historicos',
                  route: `/app/admin/plataformas/equipos/${team.id}/gtr/historicos`,
                  icon: 'pi pi-history',
                  exact: true
                },
              ]
            },
            {
              key: `plataformas-equipo-${team.id}-backoffice`,
              label: 'Backoffice',
              icon: 'pi pi-briefcase',
              children: [
                {
                  label: 'Plataforma',
                  route: `/app/admin/plataformas/equipos/${team.id}/backoffice/plataforma`,
                  icon: 'pi pi-desktop',
                  exact: true
                },
                {
                  label: 'Programados',
                  route: `/app/admin/plataformas/equipos/${team.id}/backoffice/programados`,
                  icon: 'pi pi-calendar-clock',
                  exact: true
                },
                {
                  label: 'Subsanables',
                  route: `/app/admin/plataformas/equipos/${team.id}/backoffice/subsanables`,
                  icon: 'pi pi-wrench',
                  exact: true
                },
                {
                  label: 'Rechazados',
                  route: `/app/admin/plataformas/equipos/${team.id}/backoffice/rechazados`,
                  icon: 'pi pi-exclamation-triangle',
                  exact: true
                },
                {
                  label: 'Instalados',
                  route: `/app/admin/plataformas/equipos/${team.id}/backoffice/instalados`,
                  icon: 'pi pi-check-circle',
                  exact: true
                },
              ]
            }
          ]
        })),
        {
          label: 'Postventa',
          route: '/app/admin/plataformas/postventa',
          icon: 'pi pi-briefcase',
          exact: true,
          startsGroup: true
        }
      ];

      const items: SidebarItem[] = [
        { domainId: 'overview', label: 'Dashboard', icon: 'pi pi-chart-pie', children: dashboardChildren },
        { domainId: 'overview', label: 'Bitácora', route: '/app/admin/bitacora', icon: 'pi pi-book', exact: true },
        { domainId: 'operation', key: 'Plataformas', label: 'Plataformas', icon: 'pi pi-th-large', children: plataformasChildren },
        { domainId: 'people', label: 'Colaboradores', icon: 'pi pi-users', children: colaboradoresChildren },
        { domainId: 'people', label: 'Personal', route: '/app/admin/personal', icon: 'pi pi-id-card', exact: true },
        { domainId: 'people', label: 'Asistencia', route: '/app/admin/asistencia', icon: 'pi pi-clock', exact: true },
        { domainId: 'people', label: 'Empleabilidad', route: '/app/admin/empleabilidad', icon: 'pi pi-briefcase' },
        { domainId: 'system', label: 'Tipificaciones', route: '/app/admin/tipificaciones', icon: 'pi pi-sitemap', exact: true },
        { domainId: 'system', label: 'Equipos', route: '/app/admin/equipos', icon: 'pi pi-th-large', exact: true },
        { domainId: 'system', label: 'Proveedores', route: '/app/admin/proveedores', icon: 'pi pi-building', exact: true },
        { domainId: 'operation', label: 'Mantenimiento', route: '/app/admin/mantenimiento', icon: 'pi pi-database', exact: true },
        { domainId: 'overview', label: 'Leads del día', route: '/app/admin/leads-del-dia', icon: 'pi pi-user-plus', exact: true },
        { domainId: 'operation', label: 'CorrecciÃ³n de campaÃ±a', route: '/app/admin/correccion-campana', icon: 'pi pi-sync', exact: true },
        { domainId: 'overview', label: 'Finanzas', route: '/app/admin/finanzas', icon: 'pi pi-wallet', exact: true },
        { domainId: 'operation', label: 'Operaciones', route: '/app/admin/operaciones', icon: 'pi pi-wrench', exact: true }
      ];

      if (this.adminDeleteLeadsVisible()) {
        items.push({ domainId: 'system', label: 'Eliminar Leads', route: '/app/admin/eliminar-leads', icon: 'pi pi-trash', exact: true });
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
        {
          domainId: 'workspace',
          label: 'Mantenimiento',
          route: '/app/community/mantenimiento',
          icon: 'pi pi-database',
          exact: true
        },
        {
          domainId: 'workspace',
          label: 'Leads del día',
          route: '/app/community/leads-del-dia',
          icon: 'pi pi-user-plus',
          exact: true
        },
        {
          domainId: 'workspace',
          label: 'Corrección de campaña',
          route: '/app/community/correccion-campana',
          icon: 'pi pi-sync',
          exact: true
        },
        { domainId: 'insights', label: 'Finanzas', route: '/app/community/finanzas', icon: 'pi pi-wallet', exact: true },
        { domainId: 'insights', label: 'Métricas', route: '/app/community/metricas', icon: 'pi pi-chart-line', exact: true },
        { domainId: 'insights', label: 'Dashboard', route: '/app/community/dashboard', icon: 'pi pi-chart-pie', exact: true }
      ];
    }

    if (session.primaryRole === 'ASESOR_VENTAS' || session.primaryRole === 'OJT') {
      const items = [
        {
          domainId: 'workspace',
          label: 'Plataforma',
          route: '/app/asesor-ventas/plataforma',
          icon: 'pi pi-desktop',
          exact: true
        },
        {
          domainId: 'workspace',
          label: 'Mis Preventas',
          route: '/app/asesor-ventas/mis-preventas',
          icon: 'pi pi-check-square',
          exact: true
        },
        {
          domainId: 'insights',
          label: 'Métricas',
          route: '/app/asesor-ventas/metricas',
          icon: 'pi pi-chart-bar',
          exact: true
        }
      ];
      if (session.primaryRole === 'ASESOR_VENTAS') {
        items.splice(2, 0, {
          domainId: 'workspace',
          label: 'Horario',
          route: '/app/asesor-ventas/horario',
          icon: 'pi pi-calendar',
          exact: true
        });
      }
      return items;
    }

    if (session.primaryRole === 'SUPERVISOR_VENTAS') {
      return [
        {
          domainId: 'workspace',
          label: 'Monitoreo',
          route: '/app/supervisor-ventas/monitoreo',
          icon: 'pi pi-chart-line',
          exact: true
        },
        {
          domainId: 'workspace',
          label: 'Gestión',
          route: '/app/supervisor-ventas/gestion',
          icon: 'pi pi-desktop',
          exact: true
        },
        { domainId: 'insights', label: 'Dashboard', route: '/app/supervisor-ventas/dashboard', icon: 'pi pi-chart-pie', exact: true }
      ];
    }

    if (session.primaryRole === 'ASESOR_GTR' || session.primaryRole === 'SUPERVISOR_GTR') {
      return [
        { domainId: 'workspace', label: 'Plataforma', route: '/app/gtr/plataforma', icon: 'pi pi-desktop', exact: true },
        {
          domainId: 'workspace',
          label: 'Agendados',
          route: '/app/gtr/agendados',
          icon: 'pi pi-calendar',
          badge: this.gtrAgendadosAlertFacade.totalProgramadosHoy(),
          alertActive: this.gtrAgendadosAlertFacade.hasCurrentHourWarning(),
          alertLabel: this.gtrAgendadosAlertFacade.accessibleLabel(),
          exact: true
        },
        { domainId: 'workspace', label: 'Historicos', route: '/app/gtr/historicos', icon: 'pi pi-history', exact: true },
        { domainId: 'insights', label: 'Leads del día', route: '/app/gtr/leads-del-dia', icon: 'pi pi-user-plus', exact: true },
        { domainId: 'insights', label: 'Dashboard', route: '/app/gtr/dashboard', icon: 'pi pi-chart-pie', exact: true }
      ];
    }

    if (session.primaryRole === 'ASESOR_BACKOFFICE' || session.primaryRole === 'SUPERVISOR_BACKOFFICE') {
      return [
        { domainId: 'workspace', label: 'Plataforma', route: '/app/backoffice/plataforma', icon: 'pi pi-desktop', exact: true },
        { domainId: 'workspace', label: 'Programados', route: '/app/backoffice/programados', icon: 'pi pi-calendar-clock', exact: true },
        { domainId: 'workspace', label: 'Subsanables', route: '/app/backoffice/subsanables', icon: 'pi pi-wrench', exact: true },
        { domainId: 'workspace', label: 'Rechazados', route: '/app/backoffice/rechazados', icon: 'pi pi-exclamation-triangle', exact: true },
        { domainId: 'workspace', label: 'Instalados', route: '/app/backoffice/instalados', icon: 'pi pi-check-circle', exact: true },
        { domainId: 'insights', label: 'Dashboard', route: '/app/backoffice/dashboard', icon: 'pi pi-chart-pie', exact: true }
      ];
    }

    if (session.primaryRole === 'ASESOR_POSTVENTA' || session.primaryRole === 'SUPERVISOR_POSTVENTA') {
      return [
        {
          domainId: 'workspace',
          label: 'Postventa',
          route: '/app/postventa',
          icon: 'pi pi-briefcase',
          exact: true
        },
        { domainId: 'insights', label: 'Dashboard', route: '/app/postventa/dashboard', icon: 'pi pi-chart-pie', exact: true }
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
      ['Dashboard', 1],
      ['/app/admin/bitacora', 1.5],
      ['/app/admin/finanzas', 2],
      ['/app/admin/leads-del-dia', 3],
      ['Plataformas', 3.5],
      ['Colaboradores', 4],
      ['/app/admin/asistencia', 4.5],
      ['/app/admin/correccion-campana', 6],
      ['/app/admin/mantenimiento', 8],
      ['/app/admin/tipificaciones', 9],
      ['/app/admin/equipos', 10],
      ['/app/admin/proveedores', 10.5],
      ['/app/admin/operaciones', 11],
      ['/app/admin/personal', 12],
      ['/app/admin/empleabilidad', 13]
    ]);
    items.sort((left, right) => {
      const leftKey = this.itemKey(left);
      const rightKey = this.itemKey(right);
      return (order.get(leftKey) ?? 99) - (order.get(rightKey) ?? 99);
    });
  }

  protected itemKey(item: SidebarItem): string {
    return item.key ?? item.route ?? item.label;
  }

  protected isGroupExpanded(item: SidebarItem): boolean {
    return this.expandedGroups()[this.itemKey(item)] ?? false;
  }

  protected toggleGroup(item: SidebarItem, ancestors: SidebarItem[] = []): void {
    const key = this.itemKey(item);
    const nextValue = !(this.expandedGroups()[key] ?? false);
    const nextGroups: Record<string, boolean> = {};
    for (const ancestor of ancestors) {
      nextGroups[this.itemKey(ancestor)] = true;
    }
    nextGroups[key] = nextValue;
    this.expandedGroups.set(nextGroups);
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

    // Marcar OFFLINE = terminar la jornada para roles operativos de bandeja: al registrarse la salida
    // con exito, cerramos la sesion. COMMUNITY conserva acceso despues de marcar salida.
    effect(() => {
      const tick = this.attendanceFacade.salidaSuccessTick();
      if (tick === this.handledSalidaTick) {
        return;
      }
      this.handledSalidaTick = tick;
      if (this.session()?.primaryRole === 'COMMUNITY') {
        return;
      }
      untracked(() => void this.authSessionService.logout());
    });

    // Contrato "bandeja vacia" (fase schedule): el frontend reporta el vaciado. Si el asesor entro a
    // ALMUERZO y su bandeja quedo vacia, avisamos para que arranque el contador real. El emisor pasara
    // a lead-service (WebSocket) en una fase posterior sin tocar schedule (mismo contrato).
    effect(() => {
      const count = this.asesorVentasState.assignedLeadCount();
      const waiting = this.attendanceFacade.lunchWait();
      this.attendanceFacade.setAssignedLeadCount(count);
      if (waiting && count === 0) {
        untracked(() => this.attendanceFacade.reportBandejaVaciaSiCorresponde());
      }
    });

    effect(() => {
      const session = this.session();

      if (session?.primaryRole === 'ASESOR_GTR' || session?.primaryRole === 'SUPERVISOR_GTR') {
        this.gtrAgendadosAlertFacade.start();
      } else {
        this.gtrAgendadosAlertFacade.stop();
      }

      if (
        !session ||
        Boolean(session.primaryRole && ALWAYS_OPERATIONAL_ROLES.has(session.primaryRole)) ||
        this.attendanceInitialized
      ) {
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
              if (event.fecha !== this.getToday()) {
                return;
              }
              // EXCEPCION_HORARIO_AFECTADA: le corrigieron el horario. ASISTENCIA_ESTADO_CAMBIADO: un rol
              // externo cambio su estado (p. ej. lo pusieron en CAPACITACION) -> refrescar el badge en vivo.
              if (
                event.tipo === 'EXCEPCION_HORARIO_AFECTADA' ||
                event.tipo === 'ASISTENCIA_ESTADO_CAMBIADO'
              ) {
                this.attendanceFacade.reload();
              }
            }
          });
      }
    });

    effect(() => {
      const url = this.currentUrl();
      const isAdminColaboradores = url.startsWith('/app/admin/colaboradores');
      const isAdminPlataformas = url.startsWith('/app/admin/plataformas');
      this.expandedGroups.update((current) => {
        if (isAdminPlataformas) {
          const nextGroups: Record<string, boolean> = { Plataformas: true };
          const match = /\/app\/admin\/plataformas\/equipos\/(\d+)\/([^/]+)/.exec(url);
          if (match) {
            nextGroups[`plataformas-equipo-${match[1]}`] = true;
            nextGroups[`plataformas-equipo-${match[1]}-${match[2]}`] = true;
          }
          return this.groupsEqual(current, nextGroups) ? current : nextGroups;
        }
        const nextGroups: Record<string, boolean> = isAdminColaboradores ? { Colaboradores: true } : {};
        return this.groupsEqual(current, nextGroups) ? current : nextGroups;
      });
    });

    effect(() => {
      this.menuItems();
      this.expandedGroups();
      this.scheduleMenuScrollStateUpdate();
    });
  }

  ngAfterViewInit(): void {
    this.scheduleMenuScrollStateUpdate();
    // Carga perezosa de los proveedores del usuario (no-op salvo BACKOFFICE / POSTVENTA).
    void this.providerScope.load();
  }

  protected seleccionarProveedor(idProveedor: number): void {
    this.providerScope.setActive(idProveedor);
    this.profileMenuOpen.set(false);
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.scheduleMenuScrollStateUpdate();
  }

  protected updateMenuScrollState(): void {
    const menu = this.sidebarMenu?.nativeElement;
    if (!menu) {
      this.menuCanScrollUp.set(false);
      this.menuCanScrollDown.set(false);
      return;
    }
    const maxScrollTop = Math.max(0, menu.scrollHeight - menu.clientHeight);
    this.menuCanScrollUp.set(menu.scrollTop > 2);
    this.menuCanScrollDown.set(menu.scrollTop < maxScrollTop - 2);
  }

  protected scrollMenu(direction: 'up' | 'down'): void {
    const menu = this.sidebarMenu?.nativeElement;
    if (!menu) return;
    menu.scrollBy({ top: direction === 'down' ? 180 : -180, behavior: 'smooth' });
    window.setTimeout(() => this.updateMenuScrollState(), 220);
  }

  private scheduleMenuScrollStateUpdate(): void {
    if (this.menuScrollUpdateScheduled) {
      return;
    }
    this.menuScrollUpdateScheduled = true;
    window.setTimeout(() => {
      this.menuScrollUpdateScheduled = false;
      this.updateMenuScrollState();
    });
  }

  private groupsEqual(left: Record<string, boolean>, right: Record<string, boolean>): boolean {
    const leftKeys = Object.keys(left).filter((key) => left[key]);
    const rightKeys = Object.keys(right).filter((key) => right[key]);
    return leftKeys.length === rightKeys.length && leftKeys.every((key) => right[key]);
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

  protected openMeritoCorrection(): void {
    this.profileMenuOpen.set(false);
    this.mobileMenuOpen.set(false);
    this.meritoDrawer?.open();
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((value) => !value);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  protected releaseSidebarPointerFocus(): void {
    const sidebar = this.sidebar?.nativeElement;
    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLElement) || !sidebar?.contains(activeElement)) {
      return;
    }
    activeElement.blur();
  }

  protected async logout(): Promise<void> {
    this.profileMenuOpen.set(false);
    this.mobileMenuOpen.set(false);
    this.providerScope.clear();
    await this.authSessionService.logout();
  }

  private readAdminDeleteLeadsVisible(): boolean {
    return localStorage.getItem(STORAGE_KEYS.adminDeleteLeadsVisible) === 'true';
  }
}
