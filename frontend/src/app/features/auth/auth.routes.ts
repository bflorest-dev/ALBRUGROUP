import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/guest.guard';
import { AccessCheckPageComponent } from './pages/access-check-page/access-check-page.component';
import { ForgotPasswordPageComponent } from './pages/forgot-password-page/forgot-password-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'access'
  },
  {
    path: 'access',
    canActivate: [guestGuard],
    component: AccessCheckPageComponent
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    component: LoginPageComponent
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    component: ForgotPasswordPageComponent
  }
];
