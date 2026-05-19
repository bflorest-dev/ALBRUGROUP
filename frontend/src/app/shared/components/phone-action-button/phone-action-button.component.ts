import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-phone-action-button',
  templateUrl: './phone-action-button.component.html',
  styleUrl: './phone-action-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhoneActionButtonComponent {
  @Input({ required: true }) phoneNumber: string | null | undefined = '';
  @Input() label = 'Llamar';
  @Input() scheme = 'tef';
  @Input() compact = false;

  protected get href(): string | null {
    const phone = this.normalizedPhone;
    return phone ? `${this.scheme}:${phone}` : null;
  }

  protected get normalizedPhone(): string {
    return (this.phoneNumber ?? '').replace(/\s+/g, '').trim();
  }
}
