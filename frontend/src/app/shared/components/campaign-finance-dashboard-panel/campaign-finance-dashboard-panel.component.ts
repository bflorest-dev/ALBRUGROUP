import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CampanaResponse } from '../../../features/community/services/community-lead.service';
import {
  FinanceMetricCard,
  FinanceRow,
  SnapshotFinanceRow,
  financeDeltaBadge,
  formatFinanceDateTime,
  formatFinanceDisplay,
  formatFinanceMoney
} from '../../utils/campaign-finance.utils';

@Component({
  selector: 'app-campaign-finance-dashboard-panel',
  imports: [ReactiveFormsModule, ButtonModule, CardModule, DialogModule, DrawerModule, InputTextModule, SelectModule, TableModule, TagModule],
  templateUrl: './campaign-finance-dashboard-panel.component.html',
  styleUrl: './campaign-finance-dashboard-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampaignFinanceDashboardPanelComponent {
  readonly panelTitle = input('Finanzas de campanas');
  readonly subtitle = input<string>('');
  readonly financeDate = input.required<string>();
  readonly financeMonth = input.required<string>();
  readonly isLoading = input(false);
  readonly isLoadingSnapshots = input(false);
  readonly dailyCards = input<FinanceMetricCard[]>([]);
  readonly monthlyCards = input<FinanceMetricCard[]>([]);
  readonly dailyRows = input<FinanceRow[]>([]);
  readonly snapshotRows = input<SnapshotFinanceRow[]>([]);
  readonly selectedCampaign = input<Pick<FinanceRow, 'nombreCampana'> | null>(null);
  readonly snapshotsVisible = input(false);
  readonly allowExpenseRegistration = input(false);
  readonly expenseDialogVisible = input(false);
  readonly expenseForm = input<any | null>(null);
  readonly campaignOptions = input<CampanaResponse[]>([]);
  readonly isSavingExpense = input(false);

  readonly financeDateChanged = output<string>();
  readonly financeMonthChanged = output<string>();
  readonly reload = output<void>();
  readonly openExpenseDialog = output<void>();
  readonly closeExpenseDialog = output<void>();
  readonly submitExpense = output<void>();
  readonly openSnapshots = output<FinanceRow>();
  readonly closeSnapshots = output<void>();

  protected readonly display = formatFinanceDisplay;
  protected readonly money = formatFinanceMoney;
  protected readonly dateTime = formatFinanceDateTime;
  protected readonly deltaBadge = financeDeltaBadge;
}
