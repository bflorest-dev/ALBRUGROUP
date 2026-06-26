import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from 'primeng/paginator';
import { PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';
import { GtrLeadSelectControlComponent } from '../gtr-lead-select-control/gtr-lead-select-control.component';

@Component({
  selector: 'app-gtr-historicos-board',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    DatePipe,
    UpperCasePipe,
    ButtonModule,
    CardModule,
    MultiSelectModule,
    PaginatorModule,
    PopoverModule,
    SelectModule,
    TableModule,
    TagModule,
    DateFieldComponent,
    GtrLeadSelectControlComponent
  ],
  templateUrl: './gtr-historicos-board.component.html',
  styleUrl: './gtr-historicos-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrHistoricosBoardComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);
  private organizeCloseTimeout: ReturnType<typeof setTimeout> | null = null;

  protected onOrganizeEnter(): void {
    if (this.organizeCloseTimeout !== null) {
      clearTimeout(this.organizeCloseTimeout);
      this.organizeCloseTimeout = null;
    }
  }

  protected onOrganizeLeave(popover: { hide: () => void }): void {
    this.onOrganizeEnter();
    this.organizeCloseTimeout = setTimeout(() => {
      popover.hide();
      this.organizeCloseTimeout = null;
    }, 180);
  }

  protected onGroupingModeChange(
    value: Parameters<GtrWorkspaceFacade['setHistoricosGroupingMode']>[0],
    popover: { hide: () => void }
  ): void {
    void this.facade.setHistoricosGroupingMode(value);
    popover.hide();
  }

  protected onGroupChange(value: unknown, popover: { hide: () => void }): void {
    void this.facade.selectHistoricosGroup(value as Parameters<GtrWorkspaceFacade['selectHistoricosGroup']>[0]);
    popover.hide();
  }

  protected onSortFieldChange(
    value: Parameters<GtrWorkspaceFacade['setHistoricosSortField']>[0],
    popover: { hide: () => void }
  ): void {
    void this.facade.setHistoricosSortField(value);
    popover.hide();
  }

  protected onSortDirectionChange(
    value: Parameters<GtrWorkspaceFacade['setHistoricosSortDirection']>[0],
    popover: { hide: () => void }
  ): void {
    void this.facade.setHistoricosSortDirection(value);
    popover.hide();
  }

  protected onClearOrganization(popover: { hide: () => void }): void {
    void this.facade.clearHistoricosOrganization();
    popover.hide();
  }
}
