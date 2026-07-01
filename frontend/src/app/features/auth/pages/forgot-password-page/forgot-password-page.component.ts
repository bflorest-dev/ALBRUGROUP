import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, filter, map, of, startWith, switchMap } from 'rxjs';
import { ApiErrorResponse } from '../../../../shared/models/api/api-error-response';
import { CredencialesResponse } from '../../../../shared/models/auth/credenciales-response';
import { ForgotPasswordRequest } from '../../../../shared/models/auth/forgot-password-request';
import { ForgotPasswordCardComponent } from '../../components/forgot-password-card/forgot-password-card.component';
import { AuthService } from '../../services/auth.service';

type ForgotPasswordSubmission = {
  requestId: number;
  payload: ForgotPasswordRequest;
};

type ForgotPasswordState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'error'; requestId: number; message: string }
  | { status: 'success'; requestId: number; credentials: CredencialesResponse };

@Component({
  selector: 'app-forgot-password-page',
  imports: [ForgotPasswordCardComponent],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './forgot-password-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordPageComponent {
  private readonly document = inject(DOCUMENT);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private nextRequestId = 1;
  private readonly submittedRequest = signal<ForgotPasswordSubmission | null>(null);

  private readonly forgotPasswordState = toSignal(
    toObservable(this.submittedRequest).pipe(
      filter((submission): submission is ForgotPasswordSubmission => submission !== null),
      switchMap((submission) =>
        this.authService.forgotPassword(submission.payload).pipe(
          map(
            (credentials): ForgotPasswordState => ({
              status: 'success',
              requestId: submission.requestId,
              credentials
            })
          ),
          startWith<ForgotPasswordState>({ status: 'loading', requestId: submission.requestId }),
          catchError((error: HttpErrorResponse) =>
            of<ForgotPasswordState>({
              status: 'error',
              requestId: submission.requestId,
              message: this.getErrorMessage(error, 'No fue posible generar una nueva password.')
            })
          )
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  protected readonly forgotPasswordForm = this.formBuilder.nonNullable.group({
    username: [{ value: '', disabled: true }, [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    dni: ['', [Validators.required]]
  });

  protected readonly isSubmitting = computed(() => this.forgotPasswordState().status === 'loading');
  protected readonly errorMessage = computed(() => {
    const state = this.forgotPasswordState();
    return state.status === 'error' ? state.message : '';
  });
  protected readonly generatedCredentials = computed(() => {
    const state = this.forgotPasswordState();
    return state.status === 'success' ? state.credentials : null;
  });
  protected readonly copyFeedbackMessage = signal('');
  protected readonly copyFeedbackSeverity = signal<'success' | 'error'>('success');

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

    this.submittedRequest.set({
      requestId: this.nextRequestId++,
      payload: {
        username: this.forgotPasswordForm.controls.username.getRawValue(),
        email: this.forgotPasswordForm.controls.email.getRawValue(),
        dni: this.forgotPasswordForm.controls.dni.getRawValue()
      }
    });
  }

  protected continueToLogin(): void {
    const username = this.forgotPasswordForm.controls.username.getRawValue();
    void this.router.navigate(['/auth/login'], { queryParams: { username } });
  }

  protected async copyPassword(password: string): Promise<void> {
    try {
      const windowRef = this.document.defaultView;
      if (windowRef?.navigator?.clipboard && windowRef.isSecureContext) {
        await windowRef.navigator.clipboard.writeText(password);
      } else if (!this.copyTextLegacy(password)) {
        throw new Error('Clipboard API unavailable');
      }

      this.copyFeedbackSeverity.set('success');
      this.copyFeedbackMessage.set('Password copiada.');
    } catch {
      this.copyFeedbackSeverity.set('error');
      this.copyFeedbackMessage.set('No se pudo copiar automaticamente. Selecciona la clave y copiala manualmente.');
    }
  }

  private copyTextLegacy(value: string): boolean {
    const textarea = this.document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    this.document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, value.length);

    try {
      return this.document.execCommand('copy');
    } finally {
      this.document.body.removeChild(textarea);
    }
  }

  private getErrorMessage(error: HttpErrorResponse, fallbackMessage: string): string {
    const apiError = error.error as ApiErrorResponse | null;
    return apiError?.message ?? fallbackMessage;
  }
}
