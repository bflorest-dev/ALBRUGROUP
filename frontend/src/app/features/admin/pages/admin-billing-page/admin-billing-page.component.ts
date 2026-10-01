import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BillingWorkspaceComponent } from '../../../billing/pages/billing-workspace/billing-workspace.component';

@Component({
  selector: 'app-admin-billing-page',
  imports: [BillingWorkspaceComponent],
  templateUrl: './admin-billing-page.component.html',
  styleUrl: './admin-billing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminBillingPageComponent {}
