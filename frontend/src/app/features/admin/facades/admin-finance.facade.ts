import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  CampanaResponse,
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
  private readonly formBuilder = inject(FormBuilder);
  private readonly leadService = inject(CommunityLeadService);

  readonly isLoadingFinance = signal(false);
  readonly isLoadingFinanceSnapshots = signal(false);
  readonly isSavingExpense = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly campanas = signal<CampanaResponse[]>([]);
  readonly dailyExpenseSummary = signal<CampanaGastoResumenDiarioResponse | null>(null);
  readonly monthlyExpenseSummary = signal<CampanaGastoResumenMensualResponse | null>(null);
  readonly campaignExpenseSnapshots = signal<CampanaGastoResponse[]>([]);
  readonly selectedExpenseCampaign = signal<FinanceRow | null>(null);
  readonly expenseDialogOpen = signal(false);
  readonly expenseSnapshotsOpen = signal(false);
  readonly financeDate = signal(financeCurrentDateValue());
  readonly financeMonth = signal(financeCurrentMonthValue());

  readonly dailyFinanceCards = computed(() => buildFinanceCards(this.dailyExpenseSummary()));
  readonly monthlyFinanceCards = computed(() => buildFinanceCards(this.monthlyExpenseSummary()));
  readonly dailyFinanceRows = computed<FinanceRow[]>(() => (this.dailyExpenseSummary()?.campanas ?? []).map((campana) => toFinanceRow(campana)));
  readonly snapshotRows = computed<SnapshotFinanceRow[]>(() => toSnapshotFinanceRows(this.campaignExpenseSnapshots()));
  readonly campanasActivas = computed(() =>
    this.campanas()
      .filter((campana) => campana.activo !== false)
      .sort((left, right) => String(left.nombre ?? '').localeCompare(String(right.nombre ?? '')))
  );

  readonly expenseForm = this.formBuilder.group({
    idCampana: [0, [Validators.required, Validators.min(1)]],
    leads: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    costoTotal: ['', [Validators.required, Validators.pattern(/^\d+(?:[,.]\d+)?$/)]]
  });

  async initialize(): Promise<void> {
    await Promise.all([this.loadFinanceDashboard(), this.loadCampaigns()]);
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

  openExpenseDialog(): void {
    this.expenseForm.reset({ idCampana: 0, leads: '', costoTotal: '' });
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.expenseDialogOpen.set(true);
  }

  closeExpenseDialog(): void {
    this.expenseDialogOpen.set(false);
    this.isSavingExpense.set(false);
    this.errorMessage.set(null);
  }

  async submitExpense(): Promise<void> {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      this.errorMessage.set('Selecciona una campana e indica leads y costo acumulado.');
      return;
    }

    const raw = this.expenseForm.getRawValue();
    const leads = this.parseIntegerInput(raw.leads ?? '');
    const costoTotal = this.parseDecimalInput(raw.costoTotal ?? '');

    if (!raw.idCampana || leads === null || costoTotal === null) {
      this.errorMessage.set('Ingresa leads y costo acumulado con un formato valido.');
      return;
    }

    this.isSavingExpense.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      await firstValueFrom(
        this.leadService.registrarGastoCampana(raw.idCampana, {
          leads,
          costoTotal
        })
      );
      this.expenseDialogOpen.set(false);
      this.successMessage.set('Gasto de campana registrado.');
      await this.loadFinanceDashboard();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo registrar el gasto de la campana.'));
    } finally {
      this.isSavingExpense.set(false);
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

  private async loadCampaigns(): Promise<void> {
    try {
      this.campanas.set(await firstValueFrom(this.leadService.listarCampanas(true)));
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar las campanas disponibles.'));
    }
  }

  private parseIntegerInput(value: string): number | null {
    if (!/^\d+$/.test(value)) {
      return null;
    }

    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
  }

  private parseDecimalInput(value: string): number | null {
    const normalized = value.replace(',', '.');
    if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const responseError = (error as { error?: { message?: string; error?: string } }).error;
      return responseError?.message ?? responseError?.error ?? fallback;
    }

    return fallback;
  }
}
