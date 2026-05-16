import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { AdminDashboardPageComponent } from '../admin/pages/admin-dashboard-page/admin-dashboard-page.component';
import { AdminEmployabilityPageComponent } from '../admin/pages/admin-employability-page/admin-employability-page.component';
import { CommunityWorkspacePageComponent } from '../community/pages/community-workspace-page/community-workspace-page.component';
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
    redirectTo: 'admin/personal'
  },
  {
    path: 'admin/personal',
    component: AdminDashboardPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR']
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
    path: 'rrhh',
    pathMatch: 'full',
    redirectTo: 'rrhh/postulantes'
  },
  {
    path: 'rrhh/postulantes',
    component: RrhhPostulantesPageComponent,
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
    component: RolePlatformPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ASESOR_GTR', 'SUPERVISOR_GTR'],
      title: 'GTR Platform'
    }
  },
  {
    path: 'asesor-ventas',
    component: RolePlatformPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ASESOR_VENTAS'],
      title: 'ASESOR VENTAS Platform'
    }
  },
  {
    path: 'backoffice',
    component: RolePlatformPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ASESOR_BACKOFFICE', 'SUPERVISOR_BACKOFFICE'],
      title: 'BACKOFFICE Platform'
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
    component: CommunityWorkspacePageComponent,
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
    component: RolePlatformPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['SUPERVISOR_VENTAS'],
      title: 'SUPERVISOR VENTAS Platform'
    }
  }
];
