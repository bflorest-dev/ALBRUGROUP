import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-login-card',
  imports: [ReactiveFormsModule, ButtonModule, CardModule, InputTextModule, MessageModule, PasswordModule],
  templateUrl: './login-card.component.html',
  styleUrl: './login-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginCardComponent {
  @Input({ required: true }) loginForm!: FormGroup;
  @Input() errorMessage = '';
  @Input() isSubmitting = false;

  @Output() formSubmit = new EventEmitter<void>();
  @Output() forgotPassword = new EventEmitter<void>();
}
