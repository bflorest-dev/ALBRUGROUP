import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ScheduleAdjustmentDialogComponent } from '../../../../shared/components/schedule-adjustment-dialog/schedule-adjustment-dialog.component';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';

@Component({
  selector: 'app-gtr-schedule-extension-dialog',
  imports: [ScheduleAdjustmentDialogComponent],
  templateUrl: './gtr-schedule-extension-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrScheduleExtensionDialogComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);
}
