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
import { Router } from '@angular/router';
import { catchError, filter, map, of, startWith, switchMap } from 'rxjs';
import { ApiErrorResponse } from '../../../../shared/models/api/api-error-response';
import { EstadoAccesoResponse } from '../../../../shared/models/auth/estado-acceso-response';
import { AccessCheckCardComponent } from '../../components/access-check-card/access-check-card.component';
import { AuthService } from '../../services/auth.service';

type AccessCheckRequest = {
  requestId: number;
  username: string;
};

type AccessCheckState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'error'; requestId: number; message: string }
  | { status: 'blocked'; requestId: number; message: string }
  | { status: 'redirect'; requestId: number; username: string; targetRoute: string };

@Component({
  selector: 'app-access-check-page',
  imports: [AccessCheckCardComponent],
  templateUrl: './access-check-page.component.html',
  styleUrl: './access-check-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccessCheckPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private nextRequestId = 1;
  private readonly submittedRequest = signal<AccessCheckRequest | null>(null);
  private readonly handledRequestId = signal<number | null>(null);

  private readonly accessState = toSignal(
    toObservable(this.submittedRequest).pipe(
      filter((request): request is AccessCheckRequest => request !== null),
      switchMap((request) =>
        this.authService.getEstadoAcceso(request.username).pipe(
          map((response) => this.mapEstadoAccesoResponse(request, response)),
          startWith<AccessCheckState>({ status: 'loading', requestId: request.requestId }),
          catchError((error: HttpErrorResponse) =>
            of<AccessCheckState>({
              status: 'error',
              requestId: request.requestId,
              message: this.getErrorMessage(error, 'No se pudo validar el usuario ingresado.')
            })
          )
        )
      )
    ),
    { initialValue: { status: 'idle' } }
  );

  protected readonly accessForm = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]]
  });

  protected readonly isSubmitting = computed(() => this.accessState().status === 'loading');
  protected readonly errorMessage = computed(() => {
    const state = this.accessState();
    return state.status === 'error' || state.status === 'blocked' ? state.message : '';
  });

  constructor() {
    effect(() => {
      const state = this.accessState();

      if (state.status !== 'redirect' || this.handledRequestId() === state.requestId) {
        return;
      }

      this.handledRequestId.set(state.requestId);
      void this.router.navigate([state.targetRoute], { queryParams: { username: state.username } });
    });
  }

  protected submit(): void {
    if (this.accessForm.invalid) {
      this.accessForm.markAllAsTouched();
      return;
    }

    this.submittedRequest.set({
      requestId: this.nextRequestId++,
      username: this.accessForm.controls.username.getRawValue().trim()
    });
  }

  private mapEstadoAccesoResponse(
    request: AccessCheckRequest,
    response: EstadoAccesoResponse
  ): AccessCheckState {
    if (!response.activo) {
      return {
        status: 'blocked',
        requestId: request.requestId,
        message: 'Usuario invalido o sin acceso activo.'
      };
    }

    return {
      status: 'redirect',
      requestId: request.requestId,
      username: request.username,
      targetRoute: response.passwordInicializada ? '/auth/login' : '/auth/forgot-password'
    };
  }

  private getErrorMessage(error: HttpErrorResponse, fallbackMessage: string): string {
    const apiError = error.error as ApiErrorResponse | null;
    return apiError?.message ?? fallbackMessage;
  }
}
