import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { AdminDashboardPageComponent } from '../admin/pages/admin-dashboard-page/admin-dashboard-page.component';
import { AdminEmployabilityPageComponent } from '../admin/pages/admin-employability-page/admin-employability-page.component';
import { AdminFinancePageComponent } from '../admin/pages/admin-finance-page/admin-finance-page.component';
import { AdminRankingPageComponent } from '../admin/pages/admin-ranking-page/admin-ranking-page.component';
import { AsesorVentasWorkspacePageComponent } from '../asesor-ventas/pages/asesor-ventas-workspace-page/asesor-ventas-workspace-page.component';
import { SupervisorVentasMonitoreoPageComponent } from '../supervisor-ventas/pages/supervisor-ventas-monitoreo-page/supervisor-ventas-monitoreo-page.component';
import { SupervisorVentasReportePageComponent } from '../supervisor-ventas/pages/supervisor-ventas-reporte-page/supervisor-ventas-reporte-page.component';
import { AsesorVentasHorarioPageComponent } from '../asesor-ventas/pages/asesor-ventas-horario-page/asesor-ventas-horario-page.component';
import { AsesorVentasMetricasPageComponent } from '../asesor-ventas/pages/asesor-ventas-metricas-page/asesor-ventas-metricas-page.component';
import { BackofficeWorkspacePageComponent } from '../backoffice/pages/backoffice-workspace-page/backoffice-workspace-page.component';
import { CommunityWorkspacePageComponent } from '../community/pages/community-workspace-page/community-workspace-page.component';
import { GtrWorkspacePageComponent } from '../gtr/pages/gtr-workspace-page/gtr-workspace-page.component';
import { PostulantesBoardPageComponent } from '../recruiter/pages/postulantes-board-page/postulantes-board-page.component';
import { TrainingGroupsPageComponent } from '../recruiter/pages/training-groups-page/training-groups-page.component';
import { RrhhPostulantesPageComponent } from '../rrhh/pages/rrhh-postulantes-page/rrhh-postulantes-page.component';
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
    redirectTo: 'admin/inicio'
  },
  {
    path: 'admin/inicio',
    component: AdminDashboardPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR'],
      mode: 'inicio'
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
    path: 'admin/ranking',
    component: AdminRankingPageComponent,
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
    path: 'rrhh',
    pathMatch: 'full',
    redirectTo: 'rrhh/asistencia'
  },
  {
    path: 'rrhh/asistencia',
    component: RrhhPostulantesPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['RRHH'],
      section: 'asistencia'
    }
  },
  {
    path: 'rrhh/empleabilidad',
    component: RrhhPostulantesPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['RRHH'],
      section: 'empleabilidad'
    }
  },
  {
    path: 'rrhh/contrataciones',
    component: RrhhPostulantesPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['RRHH'],
      section: 'contrataciones'
    }
  },
  {
    path: 'rrhh/pagos',
    component: RrhhPostulantesPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['RRHH'],
      section: 'pagos'
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
    path: 'gtr/ranking',
    component: GtrWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ASESOR_GTR', 'SUPERVISOR_GTR'],
      section: 'ranking'
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
    data: { roles: ['ASESOR_VENTAS'] }
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
    data: { roles: ['ASESOR_VENTAS'] }
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
    component: BackofficeWorkspacePageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ASESOR_BACKOFFICE', 'SUPERVISOR_BACKOFFICE'],
      section: 'gestion'
    }
  },
  {
    path: 'postventa',
    component: RolePlatformPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ASESOR_POSTVENTA', 'SUPERVISOR_POSTVENTA'],
      title: 'POSTVENTA Platform'
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
    path: 'supervisor-ventas/reporte',
    component: SupervisorVentasReportePageComponent,
    canActivate: [roleGuard],
    data: { roles: ['SUPERVISOR_VENTAS'] }
  }
];
