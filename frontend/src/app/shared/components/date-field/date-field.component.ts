import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-date-field',
  imports: [CommonModule, FormsModule, DatePickerModule],
  templateUrl: './date-field.component.html',
  styleUrl: './date-field.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateFieldComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateFieldComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  @Input({ required: true }) label = '';
  @Input() placeholder = this.formatDisplayDate(new Date());
  @Input() min: string | null = null;
  @Input() max: string | null = null;
  @Input() inputId?: string;
  @Input() readonly = false;
  @Input() panelStyleClass = 'date-field__panel';
  @Input() inputStyleClass = 'date-field__input';
  @Input() openOnHover = false;
  @Input() keepInvalid = false;
  @Input() baseZIndex = 0;
  /** Prefix opcional para fechas de negocio históricas (p. ej. `20` → 20xx). */
  @Input() fixedYearPrefix: string | null = null;

  protected selectedDate: Date | null = null;
  protected isDisabled = false;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private dateInput: HTMLInputElement | null = null;
  private readonly removeListeners: Array<() => void> = [];
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    this.dateInput = this.host.nativeElement.querySelector<HTMLInputElement>('input.p-datepicker-input');
    if (!this.dateInput) return;

    this.dateInput.maxLength = 10;
    this.dateInput.addEventListener('keydown', this.onDateKeydown, true);
    this.dateInput.addEventListener('input', this.onDateInput, true);
    this.removeListeners.push(
      () => this.dateInput?.removeEventListener('keydown', this.onDateKeydown, true),
      () => this.dateInput?.removeEventListener('input', this.onDateInput, true)
    );
  }

  ngOnDestroy(): void {
    this.removeListeners.splice(0).forEach((remove) => remove());
  }

  writeValue(value: string | null): void {
    this.selectedDate = this.parseIsoDate(value);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  protected onDateSelected(value: Date | string | null): void {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      this.onChange('');
      return;
    }
    this.selectedDate = value;
    this.onChange(value ? this.toIsoDate(value) : '');
    this.onTouched();
  }

  protected onMouseEnter(): void {
    if (!this.openOnHover || this.isDisabled || this.readonly) return;
    this.dateInput?.focus();
  }

  protected onInputBlur(): void {
    this.onTouched();
  }

  protected get parsedMinDate(): Date | null {
    return this.parseIsoDate(this.min);
  }

  protected get parsedMaxDate(): Date | null {
    return this.parseIsoDate(this.max);
  }

  private parseIsoDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatDisplayDate(date: Date): string {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  private readonly onDateKeydown = (event: KeyboardEvent): void => {
    if (this.isDisabled || this.readonly) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const navigationKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (navigationKeys.includes(event.key)) return;

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    const input = event.currentTarget as HTMLInputElement;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const candidate = `${input.value.slice(0, start)}${event.key}${input.value.slice(end)}`;
    const digitIndex = this.countDigits(input.value.slice(0, start));
    if (digitIndex >= 8 || !this.isAllowedDigit(event.key, digitIndex, candidate.replace(/\D/g, ''))) {
      event.preventDefault();
    }
  };

  private readonly onDateInput = (event: Event): void => {
    const input = event.currentTarget as HTMLInputElement;
    const caretBefore = this.countDigits(input.value.slice(0, input.selectionStart ?? input.value.length));
    const digits = this.sanitizeDigits(input.value);
    input.value = this.formatDigits(digits);
    const caretDigits = digits.length > caretBefore ? digits.length : Math.min(caretBefore, digits.length);
    const caret = this.positionAfterDigits(input.value, caretDigits);
    input.setSelectionRange(caret, caret);
  };

  private sanitizeDigits(value: string): string {
    const rawDigits = value.replace(/\D/g, '').slice(0, 8);
    let accepted = '';
    for (const digit of rawDigits) {
      const index = accepted.length;
      if (!this.isAllowedDigit(digit, index, accepted)) break;
      accepted += digit;
    }
    if (accepted.length >= 4 && accepted[2] >= '2' && accepted[2] <= '9') {
      return `${accepted.slice(0, 2)}0${accepted.slice(2)}`;
    }
    return accepted;
  }

  private isAllowedDigit(digit: string, index: number, accepted: string): boolean {
    if (index === 0) return digit >= '0' && digit <= '3';
    if (index === 2) return digit >= '0' && digit <= '9';

    // 2–9 is accepted as a one-digit month while the user is typing (`12/3`).
    // As soon as the year begins, it is normalized to `12/03/20xx`.
    const monthFirst = accepted[2];
    const oneDigitMonth = monthFirst >= '2' && monthFirst <= '9';
    if (oneDigitMonth && index === 3) return this.fixedYearPrefix ? digit === this.fixedYearPrefix[0] : digit >= '0' && digit <= '9';
    if (oneDigitMonth && index === 4) return this.fixedYearPrefix ? digit === this.fixedYearPrefix[1] : digit >= '0' && digit <= '9';
    if (oneDigitMonth) return digit >= '0' && digit <= '9';

    if (index === 3) return monthFirst === '1' ? digit >= '0' && digit <= '2' : digit >= '0' && digit <= '9';
    if (index === 4) return this.fixedYearPrefix ? digit === this.fixedYearPrefix[0] : digit >= '0' && digit <= '9';
    if (index === 5) return this.fixedYearPrefix ? digit === this.fixedYearPrefix[1] : digit >= '0' && digit <= '9';
    return digit >= '0' && digit <= '9';
  }

  private formatDigits(digits: string): string {
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  private countDigits(value: string): number {
    return (value.match(/\d/g) ?? []).length;
  }

  private positionAfterDigits(formatted: string, digitCount: number): number {
    if (!digitCount) return 0;
    let seen = 0;
    for (let index = 0; index < formatted.length; index++) {
      if (/\d/.test(formatted[index])) {
        seen++;
        if (seen === digitCount) return index + 1;
      }
    }
    return formatted.length;
  }
}
