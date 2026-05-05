import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { AdminDashboardPageComponent } from '../admin/pages/admin-dashboard-page/admin-dashboard-page.component';
import { RoleHomeRedirectComponent } from './pages/role-home-redirect/role-home-redirect.component';
import { RolePlatformPageComponent } from './pages/role-platform-page/role-platform-page.component';

export const PLATFORM_ROUTES: Routes = [
  {
    path: '',
    component: RoleHomeRedirectComponent
  },
  {
    path: 'admin',
    component: AdminDashboardPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRADOR']
    }
  },
  {
    path: 'rrhh',
    component: RolePlatformPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['RRHH'],
      title: 'RRHH Platform'
    }
  },
  {
    path: 'reclutador',
    component: RolePlatformPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['RECLUTADOR'],
      title: 'RECLUTADOR Platform'
    }
  },
  {
    path: 'capacitador',
    component: RolePlatformPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['CAPACITADOR'],
      title: 'CAPACITADOR Platform'
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
    component: RolePlatformPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['COMMUNITY'],
      title: 'COMMUNITY Platform'
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
