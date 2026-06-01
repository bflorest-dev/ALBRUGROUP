import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { RankingFacade } from '../../../ranking/facades/ranking.facade';
import { RankingViewComponent } from '../../../ranking/components/ranking-view/ranking-view.component';

@Component({
  selector: 'app-admin-ranking-page',
  standalone: true,
  imports: [CardModule, RankingViewComponent],
  providers: [RankingFacade],
  templateUrl: './admin-ranking-page.component.html',
  styleUrl: './admin-ranking-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminRankingPageComponent {}
