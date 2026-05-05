import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiErrorResponse } from '../../../../shared/models/api/api-error-response';
import { CredencialesResponse } from '../../../../shared/models/auth/credenciales-response';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password-page',
  imports: [ReactiveFormsModule],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './forgot-password-page.component.scss'
})
export class ForgotPasswordPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly forgotPasswordForm = this.formBuilder.nonNullable.group({
    username: [{ value: '', disabled: true }, [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    dni: ['', [Validators.required]]
  });

  protected isSubmitting = false;
  protected errorMessage = '';
  protected generatedCredentials: CredencialesResponse | null = null;

  constructor() {
    const username = this.route.snapshot.queryParamMap.get('username')?.trim() ?? '';

    if (!username) {
      void this.router.navigate(['/auth/access']);
      return;
    }

    this.forgotPasswordForm.controls.username.setValue(username);
  }

  protected submit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.generatedCredentials = null;

    this.authService
      .forgotPassword({
        username: this.forgotPasswordForm.controls.username.getRawValue(),
        email: this.forgotPasswordForm.controls.email.getRawValue(),
        dni: this.forgotPasswordForm.controls.dni.getRawValue()
      })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (response) => {
          this.generatedCredentials = response;
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.getErrorMessage(
            error,
            'No fue posible generar una nueva password.'
          );
        }
      });
  }

  protected continueToLogin(): void {
    const username = this.forgotPasswordForm.controls.username.getRawValue();
    void this.router.navigate(['/auth/login'], { queryParams: { username } });
  }

  private getErrorMessage(error: HttpErrorResponse, fallbackMessage: string): string {
    const apiError = error.error as ApiErrorResponse | null;
    return apiError?.message ?? fallbackMessage;
  }
}
