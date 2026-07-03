import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
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
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    PopoverModule,
    SelectModule,
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
  private organizeCloseTimeout: ReturnType<typeof setTimeout> | null = null;

  protected onOrganizeEnter(): void {
    if (this.organizeCloseTimeout !== null) {
      clearTimeout(this.organizeCloseTimeout);
      this.organizeCloseTimeout = null;
    }
  }

  protected onOrganizeLeave(popover: { hide: () => void }): void {
    this.onOrganizeEnter();
    this.organizeCloseTimeout = setTimeout(() => {
      popover.hide();
      this.organizeCloseTimeout = null;
    }, 180);
  }
}
