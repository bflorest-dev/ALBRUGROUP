import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { LeadCommercialDataTabsComponent } from '../../../../shared/components/lead-commercial-data-tabs/lead-commercial-data-tabs.component';
import { PhoneActionButtonComponent } from '../../../../shared/components/phone-action-button/phone-action-button.component';
import { PhoneNumberFieldComponent } from '../../../../shared/components/phone-number-field/phone-number-field.component';
import { AsesorVentasWorkspaceFacade } from '../../facades/asesor-ventas-workspace.facade';

@Component({
  selector: 'app-lead-management-dialog',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    DrawerModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    SkeletonModule,
    TagModule,
    PhoneActionButtonComponent,
    PhoneNumberFieldComponent,
    LeadCommercialDataTabsComponent
  ],
  templateUrl: './lead-management-dialog.component.html',
  styleUrl: './lead-management-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeadManagementDialogComponent {
  protected readonly facade = inject(AsesorVentasWorkspaceFacade);

  protected completionSegments(): boolean[] {
    return this.facade.preventaCompletaChecklist().map((item) => item.completo);
  }

  protected completionCount(): number {
    return this.facade.preventaCompletaChecklist().filter((item) => item.completo).length;
  }

  protected completionTotal(): number {
    return this.facade.preventaCompletaChecklist().length;
  }

  protected pendingCompletionLabels(): string[] {
    return this.facade.preventaCompletaChecklist().filter((item) => !item.completo).map((item) => item.campo);
  }
}
