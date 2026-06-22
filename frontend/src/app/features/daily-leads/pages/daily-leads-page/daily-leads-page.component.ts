import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { TipificationStackComponent } from '../../../../shared/components/tipification-stack/tipification-stack.component';
import { DailyLeadsFacade } from '../../facades/daily-leads.facade';

@Component({
  selector: 'app-daily-leads-page',
  standalone: true,
  imports: [
    DatePipe,
    UpperCasePipe,
    FormsModule,
    AutoCompleteModule,
    ButtonModule,
    CardModule,
    DialogModule,
    MessageModule,
    SkeletonModule,
    TableModule,
    TagModule,
    PaginatorModule,
    PopoverModule,
    SelectModule,
    DateFieldComponent,
    TipificationStackComponent
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
