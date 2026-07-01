import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { CredencialesResponse } from '../../../../shared/models/auth/credenciales-response';

@Component({
  selector: 'app-forgot-password-card',
  imports: [ReactiveFormsModule, ButtonModule, CardModule, InputTextModule, MessageModule],
  templateUrl: './forgot-password-card.component.html',
  styleUrl: './forgot-password-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordCardComponent {
  @Input({ required: true }) forgotPasswordForm!: FormGroup;
  @Input() errorMessage = '';
  @Input() isSubmitting = false;
  @Input() generatedCredentials: CredencialesResponse | null = null;
  @Input() copyFeedbackMessage = '';
  @Input() copyFeedbackSeverity: 'success' | 'error' = 'success';

  @Output() formSubmit = new EventEmitter<void>();
  @Output() copyPassword = new EventEmitter<string>();
  @Output() continueToLogin = new EventEmitter<void>();
}
