import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PaginatorModule } from 'primeng/paginator';
import { PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';
import { GtrLeadSelectControlComponent } from '../gtr-lead-select-control/gtr-lead-select-control.component';

@Component({
  selector: 'app-gtr-leads-board',
  imports: [
    DatePipe,
    UpperCasePipe,
    FormsModule,
    ButtonModule,
    CardModule,
    PaginatorModule,
    PopoverModule,
    SelectModule,
    TableModule,
    TagModule,
    GtrLeadSelectControlComponent
  ],
  templateUrl: './gtr-leads-board.component.html',
  styleUrl: './gtr-leads-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrLeadsBoardComponent {
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

  protected onGroupingModeChange(
    value: Parameters<GtrWorkspaceFacade['setPlatformGroupingMode']>[0]
  ): void {
    void this.facade.setPlatformGroupingMode(value);
  }

  protected onGroupChange(value: unknown): void {
    void this.facade.selectPlatformGroup(value as Parameters<GtrWorkspaceFacade['selectPlatformGroup']>[0]);
  }

  protected onSortFieldChange(
    value: Parameters<GtrWorkspaceFacade['setPlatformSortField']>[0]
  ): void {
    void this.facade.setPlatformSortField(value);
  }

  protected onSortDirectionChange(
    value: Parameters<GtrWorkspaceFacade['setPlatformSortDirection']>[0]
  ): void {
    void this.facade.setPlatformSortDirection(value);
  }

  protected onClearOrganization(): void {
    void this.facade.clearPlatformOrganization();
  }
}
