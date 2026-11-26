import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { GtrEventCommentPopoverComponent } from '../gtr-event-comment-popover/gtr-event-comment-popover.component';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';
import { LeadEventHistoryComponent } from '../../../../shared/components/lead-event-history/lead-event-history.component';
import { EventoResponse } from '../../../../shared/models/preventa/preventa.models';

@Component({
  selector: 'app-gtr-events-dialog',
  imports: [
    DatePipe,
    UpperCasePipe,
    ButtonModule,
    DialogModule,
    SkeletonModule,
    TableModule,
    TagModule,
    GtrEventCommentPopoverComponent,
    LeadEventHistoryComponent
  ],
  templateUrl: './gtr-events-dialog.component.html',
  styleUrl: './gtr-events-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrEventsDialogComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);

  protected readonly eventSummary = (e: EventoResponse) => this.facade.eventSummary(e);
}
