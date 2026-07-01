import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-access-check-card',
  imports: [ReactiveFormsModule, ButtonModule, CardModule, InputTextModule, MessageModule],
  templateUrl: './access-check-card.component.html',
  styleUrl: './access-check-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccessCheckCardComponent {
  @Input({ required: true }) accessForm!: FormGroup;
  @Input() errorMessage = '';
  @Input() isSubmitting = false;

  @Output() formSubmit = new EventEmitter<void>();
}
