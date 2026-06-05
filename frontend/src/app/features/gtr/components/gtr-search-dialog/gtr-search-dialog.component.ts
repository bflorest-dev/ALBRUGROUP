import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';

@Component({
  selector: 'app-gtr-search-dialog',
  imports: [
    DatePipe,
    UpperCasePipe,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    PaginatorModule,
    TableModule,
    TagModule
  ],
  templateUrl: './gtr-search-dialog.component.html',
  styleUrl: './gtr-search-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrSearchDialogComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);
}
