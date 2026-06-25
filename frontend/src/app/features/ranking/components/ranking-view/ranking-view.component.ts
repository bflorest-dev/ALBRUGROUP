import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { PopoverModule } from 'primeng/popover';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { RankingFacade, RankingPeriod, RankingSortDirection, RankingSortField } from '../../facades/ranking.facade';

export type RankingPeriodMode = 'fixed-day' | 'selector';

@Component({
  selector: 'app-ranking-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UpperCasePipe,
    ButtonModule,
    CardModule,
    DatePickerModule,
    DialogModule,
    MessageModule,
    PopoverModule,
    ProgressBarModule,
    ProgressSpinnerModule,
    SelectModule,
    SelectButtonModule,
    TableModule,
    TagModule
  ],
  templateUrl: './ranking-view.component.html',
  styleUrl: './ranking-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RankingViewComponent implements OnInit {
  @Input() periodMode: RankingPeriodMode = 'fixed-day';
  @Input() showTeamOrganization = false;

  protected readonly facade = inject(RankingFacade);
  private organizeCloseTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.facade.start({
      lockedToDay: this.periodMode === 'fixed-day',
      allowTeamOrganization: this.showTeamOrganization
    });
  }

  protected onPeriodChange(value: RankingPeriod | null | undefined): void {
    if (!value) {
      return;
    }
    this.facade.setPeriod(value);
  }

  protected onCustomDesdeChange(value: string): void {
    this.facade.setCustomDesde(value);
  }

  protected onCustomHastaChange(value: string): void {
    this.facade.setCustomHasta(value);
  }

  protected onCustomDesdeDateChange(value: Date | null): void {
    this.facade.setCustomDesdeDate(value);
  }

  protected onCustomHastaDateChange(value: Date | null): void {
    this.facade.setCustomHastaDate(value);
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

  protected onGroupingModeChange(value: Parameters<RankingFacade['setGroupingMode']>[0], popover: { hide: () => void }): void {
    this.facade.setGroupingMode(value);
    popover.hide();
  }

  protected onTeamChange(value: unknown, popover: { hide: () => void }): void {
    this.facade.setSelectedTeam(value as Parameters<RankingFacade['setSelectedTeam']>[0]);
    popover.hide();
  }

  protected onSortFieldChange(value: RankingSortField | null | undefined, popover: { hide: () => void }): void {
    this.facade.setSortField(value);
    popover.hide();
  }

  protected onSortDirectionChange(value: RankingSortDirection | null | undefined, popover: { hide: () => void }): void {
    this.facade.setSortDirection(value);
    popover.hide();
  }
}
