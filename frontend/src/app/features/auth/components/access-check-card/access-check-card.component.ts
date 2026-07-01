import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  viewChild
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-access-check-card',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    MessageModule
  ],
  templateUrl: './access-check-card.component.html',
  styleUrl: './access-check-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccessCheckCardComponent implements AfterViewInit {
  @Input({ required: true }) accessForm!: FormGroup;
  @Input() errorMessage = '';
  @Input() isSubmitting = false;

  @Output() formSubmit = new EventEmitter<void>();

  protected readonly usernameInput = viewChild<ElementRef<HTMLInputElement>>('usernameInput');

  ngAfterViewInit(): void {
    this.usernameInput()?.nativeElement.focus();
  }
}
