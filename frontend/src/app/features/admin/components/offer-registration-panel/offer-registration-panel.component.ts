import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { formatLabel } from '../../../../shared/utils/display-label';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';

type SelectOption = {
  label: string;
  value: string;
};

@Component({
  selector: 'app-offer-registration-panel',
  imports: [ReactiveFormsModule, FormsModule, ButtonModule, DatePickerModule, InputTextModule, MessageModule, SelectModule],
  templateUrl: './offer-registration-panel.component.html',
  styleUrl: './offer-registration-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfferRegistrationPanelComponent {
  @Input({ required: true }) createOfferForm!: FormGroup;
  @Input({ required: true }) negocioOptions: string[] = [];
  @Input({ required: true }) puestoObjetivoOptions: string[] = [];
  @Input({ required: true }) modalidadOptions: string[] = [];
  @Input({ required: true }) horarioOptions: string[] = [];
  @Input({ required: true }) createErrorMessage = '';
  @Input({ required: true }) isCreatingOffer = false;

  @Output() readonly cancel = new EventEmitter<void>();
  @Output() readonly save = new EventEmitter<void>();

  private readonly optionItemsCache = new WeakMap<readonly string[], SelectOption[]>();

  protected optionItems(options: string[]): SelectOption[] {
    let cached = this.optionItemsCache.get(options);
    if (!cached) {
      cached = options.map((option) => ({ label: formatLabel(option), value: option }));
      this.optionItemsCache.set(options, cached);
    }
    return cached;
  }

  protected toLabel(value: string | null | undefined): string {
    return formatLabel(value);
  }

  private readonly pickerDateCache = new Map<string, Date | null>();

  protected toPickerDate(value: unknown): Date | null {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value !== 'string' || !value) {
      return null;
    }

    const cached = this.pickerDateCache.get(value);
    if (cached !== undefined) {
      return cached;
    }

    let parsed: Date | null = null;
    const backendMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (backendMatch) {
      parsed = new Date(Number(backendMatch[1]), Number(backendMatch[2]) - 1, Number(backendMatch[3]));
    }

    this.pickerDateCache.set(value, parsed);
    return parsed;
  }

  protected setDateControl(form: FormGroup, controlName: string, value: Date | string | null): void {
    const control = form.get(controlName);
    control?.setValue(this.toBackendDate(value));
    control?.markAsDirty();
    control?.markAsTouched();
  }

  private toBackendDate(value: Date | string | null): string {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const month = `${value.getMonth() + 1}`.padStart(2, '0');
      const day = `${value.getDate()}`.padStart(2, '0');

      return `${value.getFullYear()}-${month}-${day}`;
    }

    return typeof value === 'string' ? value : '';
  }
}
