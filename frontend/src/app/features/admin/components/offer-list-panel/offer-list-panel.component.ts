import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { OfertaLaboralResponse } from '../../../../shared/models/recruitment/oferta-laboral-response';

type StatusDraftChange = {
  offerId: number;
  estado: string;
};

@Component({
  selector: 'app-offer-list-panel',
  imports: [ReactiveFormsModule, DateFieldComponent],
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

  protected getDraftEstado(offer: OfertaLaboralResponse): string {
    return this.draftEstadoByOfferId[offer.id] ?? offer.estado ?? 'ACTIVO';
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

  protected emitEstadoFilter(event: Event): void {
    this.estadoFilter.emit((event.target as HTMLSelectElement).value);
  }

  protected toLabel(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
