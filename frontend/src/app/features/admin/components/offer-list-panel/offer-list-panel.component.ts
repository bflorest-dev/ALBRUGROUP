import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OfertaLaboralResponse } from '../../../../shared/models/recruitment/oferta-laboral-response';
import { formatLabel } from '../../../../shared/utils/display-label';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

type StatusDraftChange = {
  offerId: number;
  estado: string;
};

type SelectOption = {
  label: string;
  value: string;
};

type StringArrayCache = { source: readonly string[]; items: SelectOption[] };

@Component({
  selector: 'app-offer-list-panel',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    InputTextModule,
    MessageModule,
    ProgressSpinnerModule,
    SelectModule,
    TableModule,
    TagModule
  ],
  templateUrl: './offer-list-panel.component.html',
  styleUrl: './offer-list-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfferListPanelComponent {
  @Input({ required: true }) offers: OfertaLaboralResponse[] = [];
  @Input({ required: true }) estadoOptions: string[] = [];
  @Input({ required: true }) expansionForm!: FormGroup;
  @Input({ required: true }) currentPage = 0;
  @Input({ required: true }) totalPages = 1;
  @Input({ required: true }) isLoadingOffers = false;
  @Input({ required: true }) listErrorMessage = '';
  @Input({ required: true }) expandedOfferId: number | null = null;
  @Input({ required: true }) draftEstadoByOfferId: Record<number, string> = {};
  @Input({ required: true }) expansionErrorByOfferId: Record<number, string> = {};
  @Input({ required: true }) expansionLoadingByOfferId: Record<number, boolean> = {};
  @Input({ required: true }) statusErrorByOfferId: Record<number, string> = {};
  @Input({ required: true }) statusLoadingByOfferId: Record<number, boolean> = {};

  @Output() readonly estadoFilter = new EventEmitter<string>();
  @Output() readonly reload = new EventEmitter<void>();
  @Output() readonly pageChange = new EventEmitter<number>();
  @Output() readonly toggleExpansion = new EventEmitter<number>();
  @Output() readonly submitExpansion = new EventEmitter<number>();
  @Output() readonly statusDraftChange = new EventEmitter<StatusDraftChange>();
  @Output() readonly updateEstado = new EventEmitter<number>();

  private readonly optionItemsCache = new WeakMap<readonly string[], SelectOption[]>();
  private estadoFilterItemsCache: StringArrayCache | null = null;

  protected getDraftEstado(offer: OfertaLaboralResponse): string {
    return this.draftEstadoByOfferId[offer.id] ?? offer.estado ?? 'ACTIVO';
  }

  protected estadoFilterItems(): SelectOption[] {
    if (this.estadoFilterItemsCache?.source === this.estadoOptions) {
      return this.estadoFilterItemsCache.items;
    }
    const items: SelectOption[] = [{ label: 'Todos los estados', value: '' }, ...this.optionItems(this.estadoOptions)];
    this.estadoFilterItemsCache = { source: this.estadoOptions, items };
    return items;
  }

  protected optionItems(options: string[]): SelectOption[] {
    let cached = this.optionItemsCache.get(options);
    if (!cached) {
      cached = options.map((option) => ({ label: formatLabel(option), value: option }));
      this.optionItemsCache.set(options, cached);
    }
    return cached;
  }

  protected isExpansionLoading(offerId: number): boolean {
    return !!this.expansionLoadingByOfferId[offerId];
  }

  protected getExpansionError(offerId: number): string {
    return this.expansionErrorByOfferId[offerId] ?? '';
  }

  protected isStatusLoading(offerId: number): boolean {
    return !!this.statusLoadingByOfferId[offerId];
  }

  protected getStatusError(offerId: number): string {
    return this.statusErrorByOfferId[offerId] ?? '';
  }

  protected isExpansionOpen(offerId: number): boolean {
    return this.expandedOfferId === offerId;
  }

  protected emitStatusDraftChange(offerId: number, event: Event): void {
    const estado = (event.target as HTMLSelectElement).value;
    this.statusDraftChange.emit({ offerId, estado });
  }

  protected emitStatusDraftValue(offerId: number, estado: string): void {
    this.statusDraftChange.emit({ offerId, estado });
  }

  protected emitEstadoFilter(event: Event): void {
    this.estadoFilter.emit((event.target as HTMLSelectElement).value);
  }

  protected emitEstadoFilterValue(estado: string): void {
    this.estadoFilter.emit(estado);
  }

  protected toLabel(value: string | null | undefined): string {
    return formatLabel(value);
  }

  protected formatDate(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      return value;
    }

    return `${match[3]}/${match[2]}/${match[1]}`;
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
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (match) {
      parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
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
