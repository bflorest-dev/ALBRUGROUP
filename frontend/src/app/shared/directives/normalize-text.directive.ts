import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { TextNormalizationMode, normalizeTextValue } from '../utils/text-normalizer';

@Directive({
  selector: 'input[appNormalizeText], textarea[appNormalizeText]',
  standalone: true
})
export class NormalizeTextDirective {
  private readonly elementRef = inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  @Input('appNormalizeText') normalizationMode: TextNormalizationMode = 'titleCase';

  @HostListener('blur')
  protected normalizeOnBlur(): void {
    const currentValue = this.readCurrentValue();
    if (!currentValue) {
      return;
    }

    const normalizedValue = normalizeTextValue(currentValue, this.normalizationMode);
    if (normalizedValue === currentValue) {
      return;
    }

    const control = this.ngControl?.control;
    if (control) {
      control.setValue(normalizedValue);
      control.markAsDirty();
      control.markAsTouched();
      return;
    }

    this.elementRef.nativeElement.value = normalizedValue;
  }

  private readCurrentValue(): string {
    const controlValue = this.ngControl?.control?.value;
    if (typeof controlValue === 'string') {
      return controlValue;
    }

    return this.elementRef.nativeElement.value ?? '';
  }
}
