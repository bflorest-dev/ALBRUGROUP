import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { PrivateLayoutComponent } from './core/layouts/private-layout/private-layout.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/access'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES)
  },
  {
    path: 'app',
    component: PrivateLayoutComponent,
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/platform/platform.routes').then((m) => m.PLATFORM_ROUTES)
  },
  {
    path: '**',
    redirectTo: 'auth/access'
  }
];
