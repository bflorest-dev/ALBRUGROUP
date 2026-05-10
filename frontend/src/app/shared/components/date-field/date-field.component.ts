import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  forwardRef,
  computed,
  signal
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

type CalendarDay = {
  iso: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
};

@Component({
  selector: 'app-date-field',
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
export class DateFieldComponent implements ControlValueAccessor {
  @Input({ required: true }) label = '';
  @Input() placeholder = 'dd/mm/aaaa';
  @Input() min: string | null = null;
  @Input() max: string | null = null;

  protected readonly weekdays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  protected readonly isOpen = signal(false);
  protected readonly selectedValue = signal('');
  protected readonly dateText = signal('');
  protected readonly isDisabled = signal(false);
  protected readonly activeMonth = signal(this.getStartOfMonth(new Date()));

  protected readonly activeMonthLabel = computed(() =>
    new Intl.DateTimeFormat('es-PE', {
      month: 'long',
      year: 'numeric'
    }).format(this.activeMonth())
  );

  protected readonly calendarDays = computed(() => {
    const month = this.activeMonth();
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - mondayOffset);

    return Array.from({ length: 42 }, (_, index): CalendarDay => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);

      const iso = this.toIsoDate(date);

      return {
        iso,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === month.getMonth(),
        isToday: iso === this.toIsoDate(new Date()),
        isSelected: iso === this.selectedValue(),
        isDisabled: this.isDateDisabled(iso)
      };
    });
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  @HostListener('document:click', ['$event.target'])
  protected closeFromOutsideClick(target: EventTarget | null): void {
    if (!target || this.elementRef.nativeElement.contains(target as Node)) {
      return;
    }

    this.closeCalendar();
  }

  @HostListener('keydown.escape')
  protected closeFromEscape(): void {
    this.closeCalendar();
  }

  writeValue(value: string | null): void {
    const nextValue = value ?? '';
    this.selectedValue.set(nextValue);

    const parsedDate = this.parseIsoDate(nextValue);
    this.dateText.set(parsedDate ? this.formatDisplayDate(parsedDate) : '');

    if (parsedDate) {
      this.activeMonth.set(this.getStartOfMonth(parsedDate));
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);

    if (isDisabled) {
      this.closeCalendar();
    }
  }

  protected toggleCalendar(): void {
    if (this.isDisabled()) {
      return;
    }

    this.isOpen.update((isOpen) => !isOpen);
    this.onTouched();
  }

  protected openCalendar(): void {
    if (this.isDisabled()) {
      return;
    }

    this.isOpen.set(true);
    this.onTouched();
  }

  protected closeCalendar(): void {
    this.isOpen.set(false);
  }

  protected moveMonth(monthOffset: number): void {
    const currentMonth = this.activeMonth();
    this.activeMonth.set(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1)
    );
  }

  protected moveYear(yearOffset: number): void {
    const currentMonth = this.activeMonth();
    this.activeMonth.set(
      new Date(currentMonth.getFullYear() + yearOffset, currentMonth.getMonth(), 1)
    );
  }

  protected selectDate(day: CalendarDay): void {
    if (day.isDisabled) {
      return;
    }

    this.selectedValue.set(day.iso);
    this.dateText.set(this.formatDisplayDate(this.parseIsoDate(day.iso) ?? new Date()));
    this.onChange(day.iso);
    this.onTouched();
    this.closeCalendar();
  }

  protected onDateTextInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const normalizedValue = this.normalizeDateText(input.value);
    input.value = normalizedValue;
    this.dateText.set(normalizedValue);

    if (!normalizedValue) {
      this.selectedValue.set('');
      this.onChange('');
      return;
    }

    const parsedDate = this.parseDisplayDate(normalizedValue);

    if (!parsedDate) {
      return;
    }

    const iso = this.toIsoDate(parsedDate);

    if (this.isDateDisabled(iso)) {
      return;
    }

    this.selectedValue.set(iso);
    this.activeMonth.set(this.getStartOfMonth(parsedDate));
    this.onChange(iso);
  }

  protected onDateTextBlur(): void {
    const parsedDate = this.parseDisplayDate(this.dateText());

    if (parsedDate && !this.isDateDisabled(this.toIsoDate(parsedDate))) {
      this.dateText.set(this.formatDisplayDate(parsedDate));
      this.onTouched();
      return;
    }

    const selectedDate = this.parseIsoDate(this.selectedValue());
    this.dateText.set(selectedDate ? this.formatDisplayDate(selectedDate) : '');
    this.onTouched();
  }

  protected clearDate(event: MouseEvent): void {
    event.stopPropagation();

    if (this.isDisabled()) {
      return;
    }

    this.selectedValue.set('');
    this.dateText.set('');
    this.onChange('');
    this.onTouched();
  }

  private getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private parseIsoDate(value: string): Date | null {
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

  private parseDisplayDate(value: string): Date | null {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      return null;
    }

    const [day, month, year] = value.split('/').map(Number);
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

  private normalizeDateText(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 8);

    return [day, month, year].filter(Boolean).join('/');
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

  private isDateDisabled(iso: string): boolean {
    if (this.min && iso < this.min) {
      return true;
    }

    return !!this.max && iso > this.max;
  }
}
