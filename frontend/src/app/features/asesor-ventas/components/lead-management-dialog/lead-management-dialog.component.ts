import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { LeadCommercialDataTabsComponent } from '../../../../shared/components/lead-commercial-data-tabs/lead-commercial-data-tabs.component';
import { AsesorVentasWorkspaceFacade } from '../../facades/asesor-ventas-workspace.facade';

@Component({
  selector: 'app-lead-management-dialog',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    DialogModule,
    MessageModule,
    SelectModule,
    SkeletonModule,
    TagModule,
    TextareaModule,
    LeadCommercialDataTabsComponent
  ],
  templateUrl: './lead-management-dialog.component.html',
  styleUrl: './lead-management-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeadManagementDialogComponent {
  protected readonly facade = inject(AsesorVentasWorkspaceFacade);
}
