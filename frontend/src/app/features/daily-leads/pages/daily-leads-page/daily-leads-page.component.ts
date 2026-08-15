import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit, effect, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { PhoneActionButtonComponent } from '../../../../shared/components/phone-action-button/phone-action-button.component';
import { PhoneNumberFieldComponent } from '../../../../shared/components/phone-number-field/phone-number-field.component';
import { TipificationStackComponent } from '../../../../shared/components/tipification-stack/tipification-stack.component';
import { DailyLeadsMetricsBarComponent } from '../../components/daily-leads-metrics-bar/daily-leads-metrics-bar.component';
import { DailyLeadsFacade } from '../../facades/daily-leads.facade';

@Component({
  selector: 'app-daily-leads-page',
  standalone: true,
  imports: [
    DatePipe,
    UpperCasePipe,
    FormsModule,
    ReactiveFormsModule,
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
    PhoneActionButtonComponent,
    PhoneNumberFieldComponent,
    TipificationStackComponent,
    DailyLeadsMetricsBarComponent
  ],
  providers: [DailyLeadsFacade],
  templateUrl: './daily-leads-page.component.html',
  styleUrl: './daily-leads-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailyLeadsPageComponent implements OnInit, OnDestroy {
  protected readonly facade = inject(DailyLeadsFacade);
  protected readonly visibleTipificationColumnOptions: { label: string; value: 'primera' | 'mayor' | 'ultima' }[] = [
    { label: 'Ultima', value: 'ultima' },
    { label: 'Mayor', value: 'mayor' },
    { label: 'Primera', value: 'primera' }
  ];
  protected visibleTipificationColumn: 'primera' | 'mayor' | 'ultima' = 'ultima';
  private organizeCloseTimeout: ReturnType<typeof setTimeout> | null = null;
  private pageSizeResizeTimeout: ReturnType<typeof setTimeout> | null = null;
  private initializedAfterGate = false;

  constructor() {
    effect(() => {
      if (!this.facade.canDisplayOperationalData()) {
        this.initializedAfterGate = false;
        return;
      }
      if (this.initializedAfterGate) {
        return;
      }
      this.initializedAfterGate = true;
      void this.facade.initialize();
    });
  }

  ngOnInit(): void {
    void this.updateAdaptivePageSize(false);
  }

  ngOnDestroy(): void {
    this.facade.stopRealtime();
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

  protected onGroupingModeChange(value: Parameters<DailyLeadsFacade['setGroupingMode']>[0]): void {
    void this.facade.setGroupingMode(value);
  }

  protected onGroupChange(value: unknown): void {
    if (value) {
      void this.facade.selectGroup(value as Parameters<DailyLeadsFacade['selectGroup']>[0]);
    } else {
      void this.facade.clearSelectedGroup();
    }
  }

  protected onSortFieldChange(value: Parameters<DailyLeadsFacade['setSortField']>[0]): void {
    void this.facade.setSortField(value);
  }

  protected onSortDirectionChange(value: Parameters<DailyLeadsFacade['setSortDirection']>[0]): void {
    void this.facade.setSortDirection(value);
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

  protected setVisibleTipificationColumn(value: 'primera' | 'mayor' | 'ultima'): void {
    this.visibleTipificationColumn = value;
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
