import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { DailyLeadsFacade } from '../../facades/daily-leads.facade';

@Component({
  selector: 'app-daily-leads-page',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    CardModule,
    MessageModule,
    TableModule,
    TagModule,
    PaginatorModule,
    DateFieldComponent
  ],
  providers: [DailyLeadsFacade],
  templateUrl: './daily-leads-page.component.html',
  styleUrl: './daily-leads-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailyLeadsPageComponent implements OnInit {
  protected readonly facade = inject(DailyLeadsFacade);

  ngOnInit(): void {
    void this.facade.initialize();
  }

  protected onFechaChange(value: string): void {
    void this.facade.setFecha(value);
  }

  protected onShowToday(): void {
    void this.facade.showToday();
  }

  protected onPageChange(page: number): void {
    void this.facade.changePage(page);
  }
}
