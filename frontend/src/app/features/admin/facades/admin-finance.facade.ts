import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  CampanaGastoResponse,
  CampanaGastoResumenDiarioResponse,
  CampanaGastoResumenMensualResponse,
  CommunityLeadService
} from '../../community/services/community-lead.service';
import {
  FinanceRow,
  SnapshotFinanceRow,
  buildFinanceCards,
  financeCurrentDateValue,
  financeCurrentMonthValue,
  financeMonthMonth,
  financeMonthYear,
  toFinanceRow,
  toSnapshotFinanceRows
} from '../../../shared/utils/campaign-finance.utils';

@Injectable()
export class AdminFinanceFacade {
  private readonly leadService = inject(CommunityLeadService);

  readonly isLoadingFinance = signal(false);
  readonly isLoadingFinanceSnapshots = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly dailyExpenseSummary = signal<CampanaGastoResumenDiarioResponse | null>(null);
  readonly monthlyExpenseSummary = signal<CampanaGastoResumenMensualResponse | null>(null);
  readonly campaignExpenseSnapshots = signal<CampanaGastoResponse[]>([]);
  readonly selectedExpenseCampaign = signal<FinanceRow | null>(null);
  readonly expenseSnapshotsOpen = signal(false);
  readonly financeDate = signal(financeCurrentDateValue());
  readonly financeMonth = signal(financeCurrentMonthValue());

  readonly dailyFinanceCards = computed(() => buildFinanceCards(this.dailyExpenseSummary()));
  readonly monthlyFinanceCards = computed(() => buildFinanceCards(this.monthlyExpenseSummary()));
  readonly dailyFinanceRows = computed<FinanceRow[]>(() => (this.dailyExpenseSummary()?.campanas ?? []).map((campana) => toFinanceRow(campana)));
  readonly snapshotRows = computed<SnapshotFinanceRow[]>(() => toSnapshotFinanceRows(this.campaignExpenseSnapshots()));

  async initialize(): Promise<void> {
    await this.loadFinanceDashboard();
  }

  async loadFinanceDashboard(): Promise<void> {
    this.isLoadingFinance.set(true);
    this.errorMessage.set(null);
    try {
      const [daily, monthly] = await Promise.all([
        firstValueFrom(this.leadService.obtenerResumenGastosDiario(this.financeDate())),
        firstValueFrom(this.leadService.obtenerResumenGastosMensual(financeMonthYear(this.financeMonth()), financeMonthMonth(this.financeMonth())))
      ]);
      this.dailyExpenseSummary.set(daily);
      this.monthlyExpenseSummary.set(monthly);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar finanzas de campañas.'));
    } finally {
      this.isLoadingFinance.set(false);
    }
  }

  async openExpenseSnapshots(row: FinanceRow): Promise<void> {
    this.selectedExpenseCampaign.set(row);
    this.campaignExpenseSnapshots.set([]);
    this.expenseSnapshotsOpen.set(true);
    this.isLoadingFinanceSnapshots.set(true);
    this.errorMessage.set(null);
    try {
      const snapshots = await firstValueFrom(this.leadService.listarGastosCampanaDia(row.idCampana, this.financeDate()));
      this.campaignExpenseSnapshots.set(snapshots);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar el detalle de gastos de la campaña.'));
    } finally {
      this.isLoadingFinanceSnapshots.set(false);
    }
  }

  closeExpenseSnapshots(): void {
    this.expenseSnapshotsOpen.set(false);
    this.selectedExpenseCampaign.set(null);
    this.campaignExpenseSnapshots.set([]);
  }

  async onFinanceDateChanged(value: string): Promise<void> {
    this.financeDate.set(value || financeCurrentDateValue());
    await this.loadFinanceDashboard();
  }

  async onFinanceMonthChanged(value: string): Promise<void> {
    this.financeMonth.set(value || financeCurrentMonthValue());
    await this.loadFinanceDashboard();
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const responseError = (error as { error?: { message?: string; error?: string } }).error;
      return responseError?.message ?? responseError?.error ?? fallback;
    }

    return fallback;
  }
}
