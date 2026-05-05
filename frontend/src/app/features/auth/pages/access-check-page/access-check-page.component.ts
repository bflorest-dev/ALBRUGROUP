import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SessionService } from '../../../../core/services/session.service';
import { ApiErrorResponse } from '../../../../shared/models/api/api-error-response';
import { EstadoAccesoResponse } from '../../../../shared/models/auth/estado-acceso-response';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-access-check-page',
  imports: [ReactiveFormsModule],
  templateUrl: './access-check-page.component.html',
  styleUrl: './access-check-page.component.scss'
})
export class AccessCheckPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly sessionService = inject(SessionService);

  protected readonly accessForm = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]]
  });

  protected isSubmitting = false;
  protected errorMessage = '';

  protected submit(): void {
    if (this.accessForm.invalid) {
      this.accessForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const username = this.accessForm.controls.username.getRawValue().trim();

    this.authService
      .getEstadoAcceso(username)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (response) => this.handleEstadoAcceso(username, response),
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.getErrorMessage(error, 'No se pudo validar el usuario ingresado.');
        }
      });
  }

  private handleEstadoAcceso(username: string, response: EstadoAccesoResponse): void {
    if (!response.activo) {
      this.errorMessage = 'Usuario invalido o sin acceso activo.';
      return;
    }

    const targetRoute = response.passwordInicializada ? '/auth/login' : '/auth/forgot-password';
    void this.router.navigate([targetRoute], { queryParams: { username } });
  }

  private getErrorMessage(error: HttpErrorResponse, fallbackMessage: string): string {
    const apiError = error.error as ApiErrorResponse | null;
    return apiError?.message ?? fallbackMessage;
  }
}
