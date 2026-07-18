import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { PopoverModule } from 'primeng/popover';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import {
  RankingCampo,
  RankingFacade,
  RankingModo,
  RankingSortDirection,
  RankingSortField
} from '../../facades/ranking.facade';
import { RankingDonutComponent } from '../ranking-donut/ranking-donut.component';

@Component({
  selector: 'app-ranking-view',
  standalone: true,
  imports: [
    UpperCasePipe,
    FormsModule,
    ButtonModule,
    CardModule,
    DatePickerModule,
    MessageModule,
    PopoverModule,
    ProgressSpinnerModule,
    SelectModule,
    SelectButtonModule,
    TableModule,
    TagModule,
    RankingDonutComponent
  ],
  templateUrl: './ranking-view.component.html',
  styleUrl: './ranking-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RankingViewComponent implements OnInit {
  @Input() showTeamOrganization = false;

  protected readonly facade = inject(RankingFacade);
  private organizeCloseTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.facade.start({ allowTeamOrganization: this.showTeamOrganization });
  }

  protected onDayChange(value: Date | null): void {
    this.facade.setSelectedDay(value);
  }

  protected onModoChange(value: RankingModo | null | undefined): void {
    this.facade.setModo(value);
  }

  protected onCampoChange(value: RankingCampo | null | undefined): void {
    this.facade.setCampo(value);
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
  }
}
