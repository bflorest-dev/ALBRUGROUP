import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FinanceWorkspaceComponent } from '../../../finance/finance-workspace.component';

@Component({
  selector: 'app-admin-finance-page',
  imports: [FinanceWorkspaceComponent],
  templateUrl: './admin-finance-page.component.html',
  styleUrl: './admin-finance-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminFinancePageComponent {}
