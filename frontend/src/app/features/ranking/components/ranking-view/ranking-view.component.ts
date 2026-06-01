import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { RankingFacade, RankingPeriod } from '../../facades/ranking.facade';

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
    MessageModule,
    ProgressBarModule,
    ProgressSpinnerModule,
    SelectButtonModule,
    TableModule,
    TagModule,
    DateFieldComponent
  ],
  templateUrl: './ranking-view.component.html',
  styleUrl: './ranking-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RankingViewComponent implements OnInit {
  @Input() periodMode: RankingPeriodMode = 'fixed-day';

  protected readonly facade = inject(RankingFacade);

  ngOnInit(): void {
    this.facade.start({ lockedToDay: this.periodMode === 'fixed-day' });
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
}
