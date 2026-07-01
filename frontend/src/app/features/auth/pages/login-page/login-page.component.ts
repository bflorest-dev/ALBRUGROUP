import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, filter, map, of, startWith, switchMap } from 'rxjs';
import { ROLE_HOME_ROUTES } from '../../../../core/constants/role.constants';
import { IdleSessionService } from '../../../../core/services/idle-session.service';
import { SessionService } from '../../../../core/services/session.service';
import { TokenService } from '../../../../core/services/token.service';
import { ApiErrorResponse } from '../../../../shared/models/api/api-error-response';
import { LoginRequest } from '../../../../shared/models/auth/login-request';
import { LoginResponse } from '../../../../shared/models/auth/login-response';
import { LoginCardComponent } from '../../components/login-card/login-card.component';
import { AuthService } from '../../services/auth.service';

type LoginSubmission = {
  requestId: number;
  payload: LoginRequest;
};

type LoginState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'error'; requestId: number; message: string }
  | { status: 'success'; requestId: number; response: LoginResponse };

@Component({
  selector: 'app-login-page',
  imports: [LoginCardComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly idleSessionService = inject(IdleSessionService);
  private readonly tokenService = inject(TokenService);
  private readonly sessionService = inject(SessionService);
  private nextRequestId = 1;
  private readonly submittedLogin = signal<LoginSubmission | null>(null);
  private readonly handledRequestId = signal<number | null>(null);

  private readonly loginState = toSignal(
    toObservable(this.submittedLogin).pipe(
      filter((submission): submission is LoginSubmission => submission !== null),
      switchMap((submission) =>
        this.authService.login(submission.payload).pipe(
          map(
            (response): LoginState => ({
              status: 'success',
              requestId: submission.requestId,
              response
            })
          ),
          startWith<LoginState>({ status: 'loading', requestId: submission.requestId }),
          catchError((error: HttpErrorResponse) =>
            of<LoginState>({
              status: 'error',
              requestId: submission.requestId,
              message: this.getErrorMessage(error, 'No se pudo iniciar sesion.')
            })
          )
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    username: [{ value: '', disabled: true }, [Validators.required]],
    password: ['', [Validators.required]]
  });

  protected readonly isSubmitting = computed(() => this.loginState().status === 'loading');
  protected readonly errorMessage = computed(() => {
    const state = this.loginState();
    return state.status === 'error' ? state.message : '';
  });

  constructor() {
    const username = this.route.snapshot.queryParamMap.get('username')?.trim() ?? '';

    if (!username) {
      void this.router.navigate(['/auth/access']);
      return;
    }

    this.loginForm.controls.username.setValue(username);

    effect(() => {
      const state = this.loginState();

      if (state.status !== 'success' || this.handledRequestId() === state.requestId) {
        return;
      }

      this.handledRequestId.set(state.requestId);
      this.handleLoginSuccess(state.response);
    });
  }

  protected submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.submittedLogin.set({
      requestId: this.nextRequestId++,
      payload: {
        username: this.loginForm.controls.username.getRawValue(),
        password: this.loginForm.controls.password.getRawValue()
      }
    });
  }

  protected goToForgotPassword(): void {
    const username = this.loginForm.controls.username.getRawValue().trim();
    void this.router.navigate(['/auth/forgot-password'], { queryParams: { username } });
  }

  private handleLoginSuccess(response: LoginResponse): void {
    const primaryRole = response.roles[0] ?? null;
    const homeRoute = primaryRole ? ROLE_HOME_ROUTES[primaryRole] ?? '/app/admin' : '/app/admin';

    this.tokenService.setTokens(response.token, response.refreshToken);
    this.sessionService.setSession({
      username: response.username,
      empleadoId: response.empleadoId,
      nombreCompleto: response.nombreCompleto,
      roles: response.roles,
      primaryRole,
      homeRoute
    });
    this.idleSessionService.markActivity();

    void this.router.navigate([homeRoute]);
  }

  private getErrorMessage(error: HttpErrorResponse, fallbackMessage: string): string {
    const apiError = error.error as ApiErrorResponse | null;
    return apiError?.message ?? fallbackMessage;
  }
}
