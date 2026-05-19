import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { formatLabel } from '../../../../shared/utils/display-label';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';

@Component({
  selector: 'app-offer-registration-panel',
  imports: [ReactiveFormsModule, DateFieldComponent],
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

  protected toLabel(value: string | null | undefined): string {
    return formatLabel(value);
  }
}
