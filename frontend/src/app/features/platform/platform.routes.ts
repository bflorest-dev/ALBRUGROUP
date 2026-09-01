import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { AdminDashboardPageComponent } from '../admin/pages/admin-dashboard-page/admin-dashboard-page.component';
import { AdminDeleteLeadsPageComponent } from '../admin/pages/admin-delete-leads-page/admin-delete-leads-page.component';
import { AdminEmployabilityPageComponent } from '../admin/pages/admin-employability-page/admin-employability-page.component';
import { AdminEquiposPageComponent } from '../admin/pages/admin-equipos-page/admin-equipos-page.component';
import { AdminProveedoresPageComponent } from '../admin/pages/admin-proveedores-page/admin-proveedores-page.component';
import { AdminFinancePageComponent } from '../admin/pages/admin-finance-page/admin-finance-page.component';
import { AdminMaintenancePageComponent } from '../admin/pages/admin-maintenance-page/admin-maintenance-page.component';
import { AdminMetricsPageComponent } from '../admin/pages/admin-metrics-page/admin-metrics-page.component';
import { AdminDashboardPostventaPageComponent } from '../admin/pages/admin-dashboard-postventa-page/admin-dashboard-postventa-page.component';
import { DashboardCobranzaStageComponent } from '../admin/components/dashboard-cobranza-stage/dashboard-cobranza-stage.component';
import { DashboardPostventaStageComponent } from '../admin/components/dashboard-postventa-stage/dashboard-postventa-stage.component';
import { DashboardPreventaStageComponent } from '../admin/components/dashboard-preventa-stage/dashboard-preventa-stage.component';
import { DashboardVentaStageComponent } from '../admin/components/dashboard-venta-stage/dashboard-venta-stage.component';
import { AdminDataOpsPageComponent } from '../admin/pages/admin-data-ops-page/admin-data-ops-page.component';
import {
  AdminTipificacionesPageComponent,
  canDeactivateAdminTipificaciones
} from '../admin/pages/admin-tipificaciones-page/admin-tipificaciones-page.component';
import { BitacoraPageComponent } from '../bitacora/pages/bitacora-page/bitacora-page.component';
import { AsesorVentasWorkspacePageComponent } from '../asesor-ventas/pages/asesor-ventas-workspace-page/asesor-ventas-workspace-page.component';
import { SupervisorVentasMonitoreoPageComponent } from '../supervisor-ventas/pages/supervisor-ventas-monitoreo-page/supervisor-ventas-monitoreo-page.component';
import { AsesorVentasHorarioPageComponent } from '../asesor-ventas/pages/asesor-ventas-horario-page/asesor-ventas-horario-page.component';
import { AsesorVentasMisPreventasPageComponent } from '../asesor-ventas/pages/asesor-ventas-mis-preventas-page/asesor-ventas-mis-preventas-page.component';
import { AsesorVentasMetricasPageComponent } from '../asesor-ventas/pages/asesor-ventas-metricas-page/asesor-ventas-metricas-page.component';
import { BackofficeWorkspacePageComponent } from '../backoffice/pages/backoffice-workspace-page/backoffice-workspace-page.component';
import { CommunityCampaignCorrectionPageComponent } from '../community/pages/community-campaign-correction-page/community-campaign-correction-page.component';
import { CommunityWorkspacePageComponent } from '../community/pages/community-workspace-page/community-workspace-page.component';
import { DailyLeadsPageComponent } from '../daily-leads/pages/daily-leads-page/daily-leads-page.component';
import { GtrWorkspacePageComponent } from '../gtr/pages/gtr-workspace-page/gtr-workspace-page.component';
import { PostventaWorkspacePageComponent } from '../postventa/pages/postventa-workspace-page/postventa-workspace-page.component';
import { PostulantesBoardPageComponent } from '../recruiter/pages/postulantes-board-page/postulantes-board-page.component';
import { TrainingGroupsPageComponent } from '../recruiter/pages/training-groups-page/training-groups-page.component';
import { RrhhAsistenciaPageComponent } from '../rrhh/asistencia/pages/rrhh-asistencia-page/rrhh-asistencia-page.component';
import { RrhhPersonalPageComponent } from '../rrhh/pages/rrhh-personal-page/rrhh-personal-page.component';
import { TrainerWorkspacePageComponent } from '../trainer/pages/trainer-workspace-page/trainer-workspace-page.component';
import { RoleHomeRedirectComponent } from './pages/role-home-redirect/role-home-redirect.component';
import { RolePlatformPageComponent } from './pages/role-platform-page/role-platform-page.component';

export const PLATFORM_ROUTES: Routes = [
  {
    path: '',
    component: RoleHomeRedirectComponent
  },
  {
    path: 'admin',
    pathMatch: 'full',
    redirectTo: 'admin/dashboard/preventa'
  },
  {
    path: 'admin/inicio',
    pathMatch: 'full',
    redirectTo: 'admin/dashboard/preventa'
  },
  {
    path: 'admin/dashboard',
    pathMatch: 'full',
    redirectTo: 'admin/dashboard/preventa'
  },
  {
    path: 'admin/dashboard/preventa',
    component: AdminMetricsPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR']
    }
  },
  {
    path: 'admin/dashboard/postventa',
    component: AdminDashboardPostventaPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR']
    }
  },
  {
    path: 'admin/dashboard/venta',
    component: DashboardVentaStageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR'],
    }
  },
  {
    path: 'admin/dashboard/cobranza',
    component: DashboardCobranzaStageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR'],
    }
  },
  {
    path: 'admin/bitacora',
    component: BitacoraPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR']
    }
  },
  {
    path: 'admin/colaboradores',
    component: AdminDashboardPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR'],
      mode: 'colaboradores'
    }
  },
  {
    path: 'admin/colaboradores/:categoria',
    component: AdminDashboardPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR'],
      mode: 'colaboradores'
    }
  },
  {
    path: 'admin/personal',
    component: AdminDashboardPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR'],
      mode: 'personal'
    }
  },
  {
    path: 'admin/empleabilidad',
    component: AdminEmployabilityPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR']
    }
  },
  {
    path: 'admin/asistencia',
    component: RrhhAsistenciaPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR']
    }
  },
  {
    path: 'admin/finanzas',
    component: AdminFinancePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR']
    }
  },
  {
    path: 'admin/tipificaciones',
    component: AdminTipificacionesPageComponent,
    canActivate: [roleGuard],
    canDeactivate: [canDeactivateAdminTipificaciones],
    data: {
      roles: ['ADMINISTRADOR']
    }
  },
  {
    path: 'admin/equipos',
    component: AdminEquiposPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR']
    }
  },
  {
    path: 'admin/proveedores',
    component: AdminProveedoresPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR']
    }
  },
  {
    path: 'admin/mantenimiento',
    component: AdminMaintenancePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR']
    }
  },
  {
    path: 'admin/leads-del-dia',
    component: DailyLeadsPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR']
    }
  },
  {
    path: 'admin/correccion-campana',
    component: CommunityCampaignCorrectionPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR']
    }
  },
  {
    path: 'admin/eliminar-leads',
    component: AdminDeleteLeadsPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR']
    }
  },
  {
    path: 'admin/operaciones',
    component: AdminDataOpsPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR']
    }
  },
  {
    path: 'admin/plataformas',
    pathMatch: 'full',
    redirectTo: 'admin/plataformas/postventa'
  },
  {
    path: 'admin/plataformas/postventa',
    component: PostventaWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR']
    }
  },
  {
    path: 'admin/plataformas/equipos/:idEquipo/gtr/plataforma',
    component: GtrWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR'],
      section: 'plataforma'
    }
  },
  {
    path: 'admin/plataformas/equipos/:idEquipo/gtr/agendados',
    component: GtrWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR'],
      section: 'agendados'
    }
  },
  {
    path: 'admin/plataformas/equipos/:idEquipo/gtr/historicos',
    component: GtrWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR'],
      section: 'historicos'
    }
  },
  {
    path: 'admin/plataformas/equipos/:idEquipo/backoffice/plataforma',
    component: BackofficeWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR'],
      section: 'plataforma'
    }
  },
  {
    path: 'admin/plataformas/equipos/:idEquipo/backoffice/programados',
    component: BackofficeWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR'],
      section: 'programados'
    }
  },
  {
    path: 'admin/plataformas/equipos/:idEquipo/backoffice/subsanables',
    component: BackofficeWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR'],
      section: 'subsanables'
    }
  },
  {
    path: 'admin/plataformas/equipos/:idEquipo/backoffice/rechazados',
    component: BackofficeWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR'],
      section: 'rechazados'
    }
  },
  {
    path: 'admin/plataformas/equipos/:idEquipo/backoffice/instalados',
    component: BackofficeWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR'],
      section: 'instalados'
    }
  },
  {
    path: 'rrhh',
    pathMatch: 'full',
    redirectTo: 'rrhh/asistencia'
  },
  {
    path: 'rrhh/asistencia',
    component: RrhhAsistenciaPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['RRHH']
    }
  },
  {
    path: 'rrhh/personal',
    component: RrhhPersonalPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['RRHH']
    }
  },
  {
    path: 'reclutador',
    pathMatch: 'full',
    redirectTo: 'reclutador/grupos-capacitacion'
  },
  {
    path: 'reclutador/grupos-capacitacion',
    component: TrainingGroupsPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['RECLUTADOR']
    }
  },
  {
    path: 'reclutador/postulantes',
    component: PostulantesBoardPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['RECLUTADOR']
    }
  },
  {
    path: 'reclutador/inicio',
    component: RolePlatformPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['RECLUTADOR'],
      title: 'RECLUTADOR Platform'
    }
  },
  {
    path: 'capacitador',
    component: TrainerWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['CAPACITADOR']
    }
  },
  {
    path: 'gtr',
    pathMatch: 'full',
    redirectTo: 'gtr/plataforma'
  },
  {
    path: 'gtr/plataforma',
    component: GtrWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ASESOR_GTR', 'SUPERVISOR_GTR'],
      section: 'plataforma'
    }
  },
  {
    path: 'gtr/agendados',
    component: GtrWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ASESOR_GTR', 'SUPERVISOR_GTR'],
      section: 'agendados'
    }
  },
  {
    path: 'gtr/historicos',
    component: GtrWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ASESOR_GTR', 'SUPERVISOR_GTR'],
      section: 'historicos'
    }
  },
  {
    path: 'gtr/leads-del-dia',
    component: DailyLeadsPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ASESOR_GTR', 'SUPERVISOR_GTR']
    }
  },
  {
    path: 'gtr/dashboard',
    component: DashboardPreventaStageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ASESOR_GTR', 'SUPERVISOR_GTR']
    }
  },
  {
    path: 'asesor-ventas',
    pathMatch: 'full',
    redirectTo: 'asesor-ventas/plataforma'
  },
  {
    path: 'asesor-ventas/plataforma',
    component: AsesorVentasWorkspacePageComponent,
    canActivate: [roleGuard],
    data: { roles: ['ASESOR_VENTAS', 'OJT'] }
  },
  {
    path: 'asesor-ventas/mis-preventas',
    component: AsesorVentasMisPreventasPageComponent,
    canActivate: [roleGuard],
    data: { roles: ['ASESOR_VENTAS', 'OJT'] }
  },
  {
    path: 'asesor-ventas/horario',
    component: AsesorVentasHorarioPageComponent,
    canActivate: [roleGuard],
    data: { roles: ['ASESOR_VENTAS'] }
  },
  {
    path: 'asesor-ventas/metricas',
    component: AsesorVentasMetricasPageComponent,
    canActivate: [roleGuard],
    data: { roles: ['ASESOR_VENTAS', 'OJT'] }
  },
  {
    path: 'backoffice',
    pathMatch: 'full',
    redirectTo: 'backoffice/plataforma'
  },
  {
    path: 'backoffice/plataforma',
    component: BackofficeWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ASESOR_BACKOFFICE', 'SUPERVISOR_BACKOFFICE'],
      section: 'plataforma'
    }
  },
  {
    path: 'backoffice/gestion',
    pathMatch: 'full',
    redirectTo: 'backoffice/plataforma'
  },
  {
    path: 'backoffice/programados',
    component: BackofficeWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ASESOR_BACKOFFICE', 'SUPERVISOR_BACKOFFICE'],
      section: 'programados'
    }
  },
  {
    path: 'backoffice/subsanables',
    component: BackofficeWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ASESOR_BACKOFFICE', 'SUPERVISOR_BACKOFFICE'],
      section: 'subsanables'
    }
  },
  {
    path: 'backoffice/rechazados',
    component: BackofficeWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ASESOR_BACKOFFICE', 'SUPERVISOR_BACKOFFICE'],
      section: 'rechazados'
    }
  },
  {
    path: 'backoffice/instalados',
    component: BackofficeWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ASESOR_BACKOFFICE', 'SUPERVISOR_BACKOFFICE'],
      section: 'instalados'
    }
  },
  {
    path: 'backoffice/dashboard',
    component: DashboardVentaStageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ASESOR_BACKOFFICE', 'SUPERVISOR_BACKOFFICE']
    }
  },
  {
    path: 'postventa/dashboard',
    component: DashboardPostventaStageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ASESOR_POSTVENTA', 'SUPERVISOR_POSTVENTA']
    }
  },
  {
    path: 'postventa',
    component: PostventaWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR', 'ASESOR_POSTVENTA', 'SUPERVISOR_POSTVENTA']
    }
  },
  {
    path: 'community',
    pathMatch: 'full',
    redirectTo: 'community/mantenimiento'
  },
  {
    path: 'community/mantenimiento',
    component: CommunityWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['COMMUNITY'],
      section: 'mantenimiento'
    }
  },
  {
    path: 'community/metricas',
    component: CommunityWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['COMMUNITY'],
      section: 'metricas'
    }
  },
  {
    path: 'community/finanzas',
    component: CommunityWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['COMMUNITY'],
      section: 'finanzas'
    }
  },
  {
    path: 'community/leads-del-dia',
    component: DailyLeadsPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['COMMUNITY']
    }
  },
  {
    path: 'community/correccion-campana',
    component: CommunityCampaignCorrectionPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['COMMUNITY']
    }
  },
  {
    path: 'community/dashboard',
    component: DashboardPreventaStageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['COMMUNITY']
    }
  },
  {
    path: 'monitor',
    component: RolePlatformPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['MONITOR'],
      title: 'MONITOR Platform'
    }
  },
  {
    path: 'supervisor-ventas',
    pathMatch: 'full',
    redirectTo: 'supervisor-ventas/monitoreo'
  },
  {
    path: 'supervisor-ventas/monitoreo',
    component: SupervisorVentasMonitoreoPageComponent,
    canActivate: [roleGuard],
    data: { roles: ['SUPERVISOR_VENTAS'] }
  },
  {
    path: 'supervisor-ventas/gestion',
    component: AsesorVentasWorkspacePageComponent,
    canActivate: [roleGuard],
    data: { roles: ['SUPERVISOR_VENTAS'] }
  },
  {
    path: 'supervisor-ventas/dashboard',
    component: DashboardVentaStageComponent,
    canActivate: [roleGuard],
    data: { roles: ['SUPERVISOR_VENTAS'] }
  }
];
