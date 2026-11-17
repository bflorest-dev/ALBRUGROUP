import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from 'primeng/paginator';
import { PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PeriodSelectorComponent } from '../../../../shared/components/period-selector/period-selector.component';
import { GtrLeadSelectControlComponent } from '../gtr-lead-select-control/gtr-lead-select-control.component';
import { CampoTipificacion, LeadGtrGroupMode, MasivoFechaMode } from '../../../../shared/models/preventa/preventa.models';
import { MetricsRango } from '../../../../shared/utils/metrics-period';
import { SupervisorGtrHistoricosFacade } from '../../facades/supervisor-gtr-historicos.facade';

@Component({
  selector: 'app-supervisor-gtr-historicos-board',
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DialogModule,
    MessageModule,
    MultiSelectModule,
    PaginatorModule,
    PopoverModule,
    SelectModule,
    SelectButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    PeriodSelectorComponent,
    GtrLeadSelectControlComponent
  ],
  templateUrl: './supervisor-gtr-historicos-board.component.html',
  styleUrl: './supervisor-gtr-historicos-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupervisorGtrHistoricosBoardComponent {
  protected readonly facade = inject(SupervisorGtrHistoricosFacade);
  private organizeCloseTimeout: ReturnType<typeof setTimeout> | null = null;

  protected onOrganizeEnter(): void {
    if (this.organizeCloseTimeout !== null) clearTimeout(this.organizeCloseTimeout);
    this.organizeCloseTimeout = null;
  }

  protected onOrganizeLeave(popover: { hide: () => void }): void {
    this.onOrganizeEnter();
    this.organizeCloseTimeout = setTimeout(() => {
      popover.hide();
      this.organizeCloseTimeout = null;
    }, 180);
  }

  protected onRangeChange(range: MetricsRango): void { this.facade.onRangeChange(range); }
  protected onModoFechaChange(value: MasivoFechaMode): void { this.facade.onModoFechaChange(value); }
  protected onCampoTipificacionChange(value: CampoTipificacion): void { this.facade.onCampoTipificacionChange(value); }
  protected onGroupingModeChange(value: LeadGtrGroupMode): void { void this.facade.setGroupingMode(value); }
  protected onGroupChange(value: unknown): void { void this.facade.selectGroup(value as any); }
  protected onSortFieldChange(value: any): void { void this.facade.setSortField(value); }
  protected onSortDirectionChange(value: any): void { void this.facade.setSortDirection(value); }
}
