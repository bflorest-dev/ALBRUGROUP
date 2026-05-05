import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ROLE_HOME_ROUTES } from '../../../../core/constants/role.constants';
import { SessionService } from '../../../../core/services/session.service';
import { TokenService } from '../../../../core/services/token.service';
import { ApiErrorResponse } from '../../../../shared/models/api/api-error-response';
import { LoginResponse } from '../../../../shared/models/auth/login-response';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly sessionService = inject(SessionService);

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    username: [{ value: '', disabled: true }, [Validators.required]],
    password: ['', [Validators.required]]
  });

  protected isSubmitting = false;
  protected errorMessage = '';

  constructor() {
    const username = this.route.snapshot.queryParamMap.get('username')?.trim() ?? '';

    if (!username) {
      void this.router.navigate(['/auth/access']);
      return;
    }

    this.loginForm.controls.username.setValue(username);
  }

  protected submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService
      .login({
        username: this.loginForm.controls.username.getRawValue(),
        password: this.loginForm.controls.password.getRawValue()
      })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (response) => this.handleLoginSuccess(response),
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.getErrorMessage(error, 'No se pudo iniciar sesion.');
        }
      });
  }

  private handleLoginSuccess(response: LoginResponse): void {
    const primaryRole = response.roles[0] ?? null;
    const homeRoute = primaryRole ? ROLE_HOME_ROUTES[primaryRole] ?? '/app/admin' : '/app/admin';

    this.tokenService.setToken(response.token);
    this.sessionService.setSession({
      username: response.username,
      empleadoId: response.empleadoId,
      nombreCompleto: response.nombreCompleto,
      roles: response.roles,
      primaryRole,
      homeRoute
    });

    void this.router.navigate([homeRoute]);
  }

  private getErrorMessage(error: HttpErrorResponse, fallbackMessage: string): string {
    const apiError = error.error as ApiErrorResponse | null;
    return apiError?.message ?? fallbackMessage;
  }
}
