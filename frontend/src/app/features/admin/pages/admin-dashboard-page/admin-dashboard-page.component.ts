import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ContractRenewalDialogComponent } from '../../components/contract-renewal-dialog/contract-renewal-dialog.component';
import { PersonalDataEditDialogComponent } from '../../components/personal-data-edit-dialog/personal-data-edit-dialog.component';
import { EmployeeAccessPanelComponent } from '../../components/employee-access-panel/employee-access-panel.component';
import { PersonalRegistrationPanelComponent } from '../../components/personal-registration-panel/personal-registration-panel.component';
import { AdminPersonalFacade } from '../../facades/admin-personal.facade';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [
    ButtonModule,
    MessageModule,
    TableModule,
    TagModule,
    PersonalRegistrationPanelComponent,
    EmployeeAccessPanelComponent,
    ContractRenewalDialogComponent,
    PersonalDataEditDialogComponent
  ],
  providers: [AdminPersonalFacade],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardPageComponent implements OnInit {
  protected readonly facade = inject(AdminPersonalFacade);
  protected readonly mode = inject(ActivatedRoute).snapshot.data['mode'] as 'inicio' | 'personal';

  ngOnInit(): void {
    this.facade.initialize();
  }
}
