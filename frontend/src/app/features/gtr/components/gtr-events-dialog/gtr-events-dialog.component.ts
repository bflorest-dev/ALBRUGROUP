import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { PopoverModule } from 'primeng/popover';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';

@Component({
  selector: 'app-gtr-events-dialog',
  imports: [DatePipe, UpperCasePipe, ButtonModule, DialogModule, PopoverModule, SkeletonModule, TableModule, TagModule],
  templateUrl: './gtr-events-dialog.component.html',
  styleUrl: './gtr-events-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrEventsDialogComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);
}
