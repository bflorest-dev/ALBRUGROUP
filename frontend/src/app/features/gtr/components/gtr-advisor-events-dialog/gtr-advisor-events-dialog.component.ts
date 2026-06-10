import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { GtrEventCommentPopoverComponent } from '../gtr-event-comment-popover/gtr-event-comment-popover.component';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';

@Component({
  selector: 'app-gtr-advisor-events-dialog',
  imports: [
    DatePipe,
    UpperCasePipe,
    DialogModule,
    SkeletonModule,
    TableModule,
    TagModule,
    GtrEventCommentPopoverComponent
  ],
  templateUrl: './gtr-advisor-events-dialog.component.html',
  styleUrl: './gtr-advisor-events-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrAdvisorEventsDialogComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);
}
