import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-phone-number-field',
  imports: [ReactiveFormsModule],
  templateUrl: './phone-number-field.component.html',
  styleUrl: './phone-number-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhoneNumberFieldComponent {
  @ViewChild('numberInput') private numberInputRef!: ElementRef<HTMLInputElement>;

  @Input({ required: true }) label = '';
  @Input({ required: true }) prefixControl!: FormControl<string>;
  @Input({ required: true }) numberControl!: FormControl<string>;
  @Input() prefixMaxLength = 3;
  @Input() numberMaxLength = 9;
  @Input() prefixPlaceholder = '51';
  @Input() numberPlaceholder = 'Numero';

  focusNumber(): void {
    this.numberInputRef?.nativeElement.focus();
  }

  protected get prefixDigits(): string {
    return this.prefixControl.value.replace(/\D/g, '').slice(0, this.prefixMaxLength);
  }

  protected onPrefixInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, this.prefixMaxLength);
    input.value = digits;
    this.prefixControl.setValue(digits ? `+${digits}` : '');
    this.prefixControl.markAsTouched();
  }

  protected onNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, this.numberMaxLength);
    input.value = digits;
    this.numberControl.setValue(digits);
    this.numberControl.markAsTouched();
  }
}
