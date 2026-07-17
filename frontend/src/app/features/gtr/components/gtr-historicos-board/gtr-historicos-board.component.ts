import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from 'primeng/paginator';
import { PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { CampoTipificacion } from '../../../../shared/models/preventa/preventa.models';
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
    SelectButtonModule,
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
    value: Parameters<GtrWorkspaceFacade['setHistoricosGroupingMode']>[0]
  ): void {
    void this.facade.setHistoricosGroupingMode(value);
  }

  protected onCampoTipificacionChange(value: CampoTipificacion): void {
    this.facade.masivoFiltersForm.controls.campoTipificacion.setValue(value);
    this.facade.syncHistoricosCampoTipificacion();
  }

  protected onGroupChange(value: unknown): void {
    void this.facade.selectHistoricosGroup(value as Parameters<GtrWorkspaceFacade['selectHistoricosGroup']>[0]);
  }

  protected onSortFieldChange(
    value: Parameters<GtrWorkspaceFacade['setHistoricosSortField']>[0]
  ): void {
    void this.facade.setHistoricosSortField(value);
  }

  protected onSortDirectionChange(
    value: Parameters<GtrWorkspaceFacade['setHistoricosSortDirection']>[0]
  ): void {
    void this.facade.setHistoricosSortDirection(value);
  }

  protected onClearOrganization(): void {
    void this.facade.clearHistoricosOrganization();
  }
}
