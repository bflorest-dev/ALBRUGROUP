import { ChangeDetectionStrategy, Component, OnInit, inject, input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import {
  MetricsPeriodo,
  PeriodSelectorComponent
} from '../../shared/components/period-selector/period-selector.component';
import { MetricsRango } from '../../shared/utils/metrics-period';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';
import { FinanceWorkspaceFacade } from './finance-workspace.facade';
import { CampanaGastoResumenMensualResponse, CampanaGastoResumenPeriodoResponse } from '../community/services/community-lead.service';
import { FinanceRow, SnapshotFinanceRow, formatFinanceDisplay } from '../../shared/utils/campaign-finance.utils';

@Component({
  selector: 'app-finance-workspace',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    DrawerModule,
    InputTextModule,
    MessageModule,
    SelectButtonModule,
    SelectModule,
    TableModule,
    TooltipModule,
    PageHeaderComponent,
    SectionHeaderComponent,
    PeriodSelectorComponent
  ],
  providers: [FinanceWorkspaceFacade],
  templateUrl: './finance-workspace.component.html',
  styleUrl: './finance-workspace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinanceWorkspaceComponent implements OnInit {
  protected readonly facade = inject(FinanceWorkspaceFacade);
  readonly eyebrow = input('Administrador');
  readonly allowExpenseRegistration = input(true);

  ngOnInit(): void {
    void this.facade.initialize();
  }

  protected readonly display = formatFinanceDisplay;

  protected periodTitle(summary: CampanaGastoResumenPeriodoResponse | null): string {
    return summary ? `Periodo · ${this.facade.rangeLabel()}` : 'Periodo seleccionado';
  }

  protected monthlyTitle(summary: CampanaGastoResumenMensualResponse | null): string {
    if (!summary) return 'Mes actual';
    return `Mes actual · ${String(summary.mes).padStart(2, '0')}/${summary.anio}`;
  }

  protected count(value: number | null | undefined): string {
    return value === null || value === undefined ? '—' : String(value);
  }

  protected percent(numerator: number | null | undefined, denominator: number | null | undefined): string {
    if (numerator === null || numerator === undefined || denominator === null || denominator === undefined || denominator <= 0) {
      return '—';
    }
    return `${((numerator / denominator) * 100).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  }

  protected moneyPer(total: number | null | undefined, quantity: number | null | undefined): string {
    if (total === null || total === undefined || quantity === null || quantity === undefined || quantity <= 0) {
      return '—';
    }
    return this.facade.money(total / quantity);
  }

  protected reportConversion(row: FinanceRow, type: 'preventa' | 'venta'): string {
    return type === 'preventa' ? row.conversionPreventas : row.conversionVentas;
  }

  protected realConversion(row: FinanceRow, type: 'preventa' | 'venta'): string {
    return type === 'preventa' ? row.conversionPreventasReales : row.conversionVentasReales;
  }

  protected allowIntegerInput(event: KeyboardEvent): void {
    if (['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || event.ctrlKey || event.metaKey || /^\d$/.test(event.key)) return;
    event.preventDefault();
  }

  protected allowDecimalInput(event: KeyboardEvent): void {
    if (['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || event.ctrlKey || event.metaKey || /^\d$/.test(event.key)) return;
    if ((event.key === ',' || event.key === '.') && !/[,.]/.test((event.target as HTMLInputElement)?.value ?? '')) return;
    event.preventDefault();
  }

  protected onPeriodChange(value: MetricsPeriodo): void {
    void this.facade.onPeriodChange(value);
  }

  protected onRangeChange(value: MetricsRango): void {
    void this.facade.onRangeChange(value);
  }

  protected onProviderChange(value: number | null): void {
    void this.facade.onProviderChange(value);
  }

  protected isEditableSnapshot(row: SnapshotFinanceRow, last: boolean): boolean {
    return row.id !== null && row.id !== undefined && (last || this.facade.historyRowsAreDailyClosures());
  }
}
