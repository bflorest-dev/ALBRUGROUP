import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { LeadCommercialDataTabsComponent } from '../../../../shared/components/lead-commercial-data-tabs/lead-commercial-data-tabs.component';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';

@Component({
  selector: 'app-gtr-tipification-dialog',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    DrawerModule,
    MessageModule,
    SelectModule,
    SkeletonModule,
    TagModule,
    TextareaModule,
    LeadCommercialDataTabsComponent
  ],
  templateUrl: './gtr-tipification-dialog.component.html',
  styleUrl: './gtr-tipification-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrTipificationDialogComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);

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
