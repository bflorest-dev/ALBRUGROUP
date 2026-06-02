import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { CampaignFinanceDashboardPanelComponent } from '../../../../shared/components/campaign-finance-dashboard-panel/campaign-finance-dashboard-panel.component';
import { AdminFinanceFacade } from '../../facades/admin-finance.facade';

@Component({
  selector: 'app-admin-finance-page',
  imports: [TagModule, MessageModule, CampaignFinanceDashboardPanelComponent],
  providers: [AdminFinanceFacade],
  templateUrl: './admin-finance-page.component.html',
  styleUrl: './admin-finance-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminFinancePageComponent implements OnInit {
  protected readonly facade = inject(AdminFinanceFacade);

  ngOnInit(): void {
    void this.facade.initialize();
  }
}
