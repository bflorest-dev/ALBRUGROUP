import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/guest.guard';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { AccessCheckPageComponent } from './pages/access-check-page/access-check-page.component';
import { ForgotPasswordPageComponent } from './pages/forgot-password-page/forgot-password-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    canActivate: [guestGuard],
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'access'
      },
      {
        path: 'access',
        component: AccessCheckPageComponent
      },
      {
        path: 'login',
        component: LoginPageComponent
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordPageComponent
      }
    ]
  }
];
