import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
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
import { InputTextModule } from 'primeng/inputtext';
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
    InputTextModule,
    DateFieldComponent,
    TipificationStackComponent
  ],
  providers: [DailyLeadsFacade],
  templateUrl: './daily-leads-page.component.html',
  styleUrl: './daily-leads-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailyLeadsPageComponent implements OnInit, OnDestroy {
  protected readonly facade = inject(DailyLeadsFacade);
  private organizeCloseTimeout: ReturnType<typeof setTimeout> | null = null;
  private pageSizeResizeTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    void this.updateAdaptivePageSize(false);
    void this.facade.initialize();
  }

  ngOnDestroy(): void {
    if (this.organizeCloseTimeout !== null) {
      clearTimeout(this.organizeCloseTimeout);
    }
    if (this.pageSizeResizeTimeout !== null) {
      clearTimeout(this.pageSizeResizeTimeout);
    }
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.scheduleAdaptivePageSizeUpdate();
  }

  @HostListener('window:orientationchange')
  protected onWindowOrientationChange(): void {
    this.scheduleAdaptivePageSizeUpdate();
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

  protected onLeadSearchChange(value: string): void {
    this.facade.setLeadSearchDraft(value);
  }

  protected onLeadSearchSubmit(popover: { hide: () => void }): void {
    void this.facade.applyLeadSearch();
    popover.hide();
  }

  protected onLeadSearchClear(popover: { hide: () => void }): void {
    void this.facade.clearLeadSearch();
    popover.hide();
  }

  private scheduleAdaptivePageSizeUpdate(): void {
    if (this.pageSizeResizeTimeout !== null) {
      clearTimeout(this.pageSizeResizeTimeout);
    }

    this.pageSizeResizeTimeout = setTimeout(() => {
      this.pageSizeResizeTimeout = null;
      void this.updateAdaptivePageSize(true);
    }, 160);
  }

  private async updateAdaptivePageSize(reload: boolean): Promise<void> {
    await this.facade.setPageSize(this.adaptivePageSize(), reload);
  }

  private adaptivePageSize(): number {
    if (typeof window === 'undefined') {
      return 10;
    }

    const viewport = window.visualViewport;
    const width = viewport?.width ?? window.innerWidth;
    const height = viewport?.height ?? window.innerHeight;
    const isTablet = window.matchMedia('(pointer: coarse) and (min-width: 700px) and (max-width: 1180px)').matches;

    if (!isTablet) {
      return 10;
    }

    const reservedHeight = width <= 900 ? 320 : 300;
    const rowHeight = 54;
    return Math.floor((height - reservedHeight) / rowHeight);
  }
}
