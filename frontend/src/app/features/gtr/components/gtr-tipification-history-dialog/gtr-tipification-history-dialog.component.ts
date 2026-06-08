import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { GtrEventCommentPopoverComponent } from '../gtr-event-comment-popover/gtr-event-comment-popover.component';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';

@Component({
  selector: 'app-gtr-tipification-history-dialog',
  imports: [
    DatePipe,
    UpperCasePipe,
    ButtonModule,
    DialogModule,
    SkeletonModule,
    TableModule,
    TagModule,
    GtrEventCommentPopoverComponent
  ],
  templateUrl: './gtr-tipification-history-dialog.component.html',
  styleUrl: './gtr-tipification-history-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrTipificationHistoryDialogComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);
}
