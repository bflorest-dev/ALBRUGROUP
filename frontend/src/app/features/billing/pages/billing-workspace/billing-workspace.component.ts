import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { PlanillaEmpleadoResponse } from '../../services/billing.service';
import { BillingWorkspaceFacade } from './billing-workspace.facade';

@Component({
  selector: 'app-billing-workspace',
  imports: [
    FormsModule,
    ButtonModule,
    DrawerModule,
    MessageModule,
    TableModule,
    TagModule,
    TooltipModule,
    PageHeaderComponent,
    SectionHeaderComponent
  ],
  providers: [BillingWorkspaceFacade],
  templateUrl: './billing-workspace.component.html',
  styleUrl: './billing-workspace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BillingWorkspaceComponent implements OnInit {
  protected readonly facade = inject(BillingWorkspaceFacade);

  ngOnInit(): void {
    void this.facade.initialize();
  }

  protected onMonthChange(value: string): void {
    void this.facade.onMonthChange(value);
  }

  protected calculate(): void {
    void this.facade.calcular();
  }

  protected approve(): void {
    void this.facade.aprobar();
  }

  protected fullName(row: PlanillaEmpleadoResponse): string {
    return `${row.nombres} ${row.apellidos}`.trim();
  }

  protected statusSeverity(status: string): 'success' | 'secondary' | 'warn' | 'danger' | 'info' | 'contrast' {
    if (status === 'APROBADO' || status === 'PAGADO') return 'success';
    return 'warn';
  }
}
