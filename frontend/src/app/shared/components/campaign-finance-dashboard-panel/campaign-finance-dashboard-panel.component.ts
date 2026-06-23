import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CampanaResponse } from '../../../features/community/services/community-lead.service';
import {
  FinanceMetricCard,
  FinanceRow,
  SnapshotFinanceRow,
  financeDeltaBadge,
  formatFinanceDateTime,
  formatFinanceDisplay,
  formatFinanceMoney
} from '../../utils/campaign-finance.utils';

@Component({
  selector: 'app-campaign-finance-dashboard-panel',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DatePickerModule,
    DialogModule,
    DrawerModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    TableModule,
    TagModule
  ],
  templateUrl: './campaign-finance-dashboard-panel.component.html',
  styleUrl: './campaign-finance-dashboard-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampaignFinanceDashboardPanelComponent {
  readonly panelTitle = input('Finanzas de campanas');
  readonly subtitle = input<string>('');
  readonly enablePeriodFilter = input(false);
  readonly showTeamSelector = input(false);
  readonly financeDate = input('');
  readonly financeMonth = input('');
  readonly periodStart = input<Date | null>(null);
  readonly periodEnd = input<Date | null>(null);
  readonly hasPeriodSelection = input(false);
  readonly periodWarning = input('');
  readonly dailySummaryTitle = input('Estado del día');
  readonly dailyTableTitle = input('Estado del día por campaña');
  readonly historyDisabled = input(false);
  readonly teamOptions = input<Array<{ label: string; value: number | null }>>([]);
  readonly selectedTeamId = input<number | null>(null);
  readonly isLoading = input(false);
  readonly isLoadingSnapshots = input(false);
  readonly dailyCards = input<FinanceMetricCard[]>([]);
  readonly monthlyCards = input<FinanceMetricCard[]>([]);
  readonly dailyRows = input<FinanceRow[]>([]);
  readonly snapshotRows = input<SnapshotFinanceRow[]>([]);
  readonly selectedCampaign = input<Pick<FinanceRow, 'nombreCampana'> | null>(null);
  readonly snapshotsVisible = input(false);
  readonly allowExpenseRegistration = input(false);
  readonly expenseRegistrationEnabled = input(true);
  readonly expenseRegistrationBlockedText = input('Marca tu asistencia para agregar gastos.');
  readonly expenseDialogVisible = input(false);
  readonly expenseForm = input<any | null>(null);
  readonly expenseErrorMessage = input<string | null>(null);
  readonly campaignOptions = input<CampanaResponse[]>([]);
  readonly isSavingExpense = input(false);

  readonly periodStartChanged = output<Date | null>();
  readonly periodEndChanged = output<Date | null>();
  readonly clearPeriod = output<void>();
  readonly financeDateChanged = output<string>();
  readonly financeMonthChanged = output<string>();
  readonly teamChanged = output<number | null>();
  readonly openExpenseDialog = output<void>();
  readonly closeExpenseDialog = output<void>();
  readonly submitExpense = output<void>();
  readonly openSnapshots = output<FinanceRow>();
  readonly closeSnapshots = output<void>();

  protected readonly display = formatFinanceDisplay;
  protected readonly money = formatFinanceMoney;
  protected readonly dateTime = formatFinanceDateTime;
  protected readonly deltaBadge = financeDeltaBadge;

  protected allowIntegerInput(event: KeyboardEvent): void {
    if (this.isEditingKey(event) || /^\d$/.test(event.key)) {
      return;
    }

    event.preventDefault();
  }

  protected allowDecimalInput(event: KeyboardEvent): void {
    if (this.isEditingKey(event) || /^\d$/.test(event.key)) {
      return;
    }

    if ((event.key === ',' || event.key === '.') && !this.currentInputHasDecimalSeparator(event)) {
      return;
    }

    event.preventDefault();
  }

  protected sanitizeIntegerControl(controlName: string): void {
    const control = this.expenseForm()?.get(controlName);
    if (!control) {
      return;
    }

    const currentValue = String(control.value ?? '');
    const nextValue = currentValue.replace(/\D/g, '');
    if (nextValue !== currentValue) {
      control.setValue(nextValue);
    }
  }

  protected sanitizeDecimalControl(controlName: string): void {
    const control = this.expenseForm()?.get(controlName);
    if (!control) {
      return;
    }

    const currentValue = String(control.value ?? '');
    const nextValue = this.sanitizeDecimalValue(currentValue);
    if (nextValue !== currentValue) {
      control.setValue(nextValue);
    }
  }

  private isEditingKey(event: KeyboardEvent): boolean {
    const allowed = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    return allowed.includes(event.key) || event.ctrlKey || event.metaKey;
  }

  private currentInputHasDecimalSeparator(event: KeyboardEvent): boolean {
    const input = event.target as HTMLInputElement | null;
    if (!input) {
      return true;
    }

    const value = input.value;
    const selectionStart = input.selectionStart ?? value.length;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    const selectedText = value.slice(selectionStart, selectionEnd);
    const valueWithoutSelection = value.slice(0, selectionStart) + value.slice(selectionEnd);

    return /[,.]/.test(valueWithoutSelection) && !/[,.]/.test(selectedText);
  }

  private sanitizeDecimalValue(value: string): string {
    const cleaned = value.replace(/[^\d,.]/g, '');
    const separatorIndex = cleaned.search(/[,.]/);

    if (separatorIndex === -1) {
      return cleaned;
    }

    const separator = cleaned[separatorIndex];
    const integerPart = cleaned.slice(0, separatorIndex).replace(/[,.]/g, '') || '0';
    const decimalPart = cleaned.slice(separatorIndex + 1).replace(/[,.]/g, '');
    return `${integerPart}${separator}${decimalPart}`;
  }
}
