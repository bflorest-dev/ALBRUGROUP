import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { TipificationStackComponent } from '../../../../shared/components/tipification-stack/tipification-stack.component';
import { DailyLeadsFacade } from '../../facades/daily-leads.facade';

@Component({
  selector: 'app-daily-leads-page',
  standalone: true,
  imports: [
    DatePipe,
    UpperCasePipe,
    FormsModule,
    ButtonModule,
    CardModule,
    DialogModule,
    MessageModule,
    SkeletonModule,
    TableModule,
    TagModule,
    PaginatorModule,
    PopoverModule,
    SelectModule,
    DateFieldComponent,
    TipificationStackComponent
  ],
  providers: [DailyLeadsFacade],
  templateUrl: './daily-leads-page.component.html',
  styleUrl: './daily-leads-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailyLeadsPageComponent implements OnInit {
  protected readonly facade = inject(DailyLeadsFacade);
  private organizeCloseTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    void this.facade.initialize();
  }

  protected onFechaChange(value: string): void {
    void this.facade.setFecha(value);
  }

  protected onShowToday(): void {
    void this.facade.showToday();
  }

  protected onPageChange(page: number): void {
    void this.facade.changePage(page);
  }

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

  protected onGroupingModeChange(value: Parameters<DailyLeadsFacade['setGroupingMode']>[0], popover: { hide: () => void }): void {
    void this.facade.setGroupingMode(value);
    popover.hide();
  }

  protected onGroupChange(value: unknown, popover: { hide: () => void }): void {
    if (value) {
      void this.facade.selectGroup(value as Parameters<DailyLeadsFacade['selectGroup']>[0]);
    } else {
      void this.facade.clearSelectedGroup();
    }
    popover.hide();
  }

  protected onSortFieldChange(value: Parameters<DailyLeadsFacade['setSortField']>[0], popover: { hide: () => void }): void {
    void this.facade.setSortField(value);
    popover.hide();
  }

  protected onSortDirectionChange(value: Parameters<DailyLeadsFacade['setSortDirection']>[0], popover: { hide: () => void }): void {
    void this.facade.setSortDirection(value);
    popover.hide();
  }
}
