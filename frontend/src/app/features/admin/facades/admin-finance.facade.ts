import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  CampanaResponse,
  CampanaGastoResponse,
  CampanaGastoResumenDiarioResponse,
  CampanaGastoResumenMensualResponse,
  CampanaGastoResumenPeriodoResponse,
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
import { AdminEquipoService, EquipoResponse, ProveedorLite } from '../services/admin-equipo.service';

interface FinanceTeamOption {
  label: string;
  value: number | null;
}

@Injectable()
export class AdminFinanceFacade {
  private readonly formBuilder = inject(FormBuilder);
  private readonly leadService = inject(CommunityLeadService);
  private readonly adminEquipoService = inject(AdminEquipoService);

  readonly isLoadingFinance = signal(false);
  readonly isLoadingFinanceSnapshots = signal(false);
  readonly isSavingExpense = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly campanas = signal<CampanaResponse[]>([]);
  readonly dailyExpenseSummary = signal<CampanaGastoResumenDiarioResponse | null>(null);
  readonly monthlyExpenseSummary = signal<CampanaGastoResumenMensualResponse | null>(null);
  readonly periodExpenseSummary = signal<CampanaGastoResumenPeriodoResponse | null>(null);
  readonly campaignExpenseSnapshots = signal<CampanaGastoResponse[]>([]);
  readonly selectedExpenseCampaign = signal<FinanceRow | null>(null);
  readonly expenseDialogOpen = signal(false);
  readonly expenseSnapshotsOpen = signal(false);
  readonly financeDate = signal(financeCurrentDateValue());
  readonly financeMonth = signal(financeCurrentMonthValue());
  readonly periodStart = signal<Date | null>(null);
  readonly periodEnd = signal<Date | null>(null);
  readonly teams = signal<EquipoResponse[]>([]);
  readonly selectedTeamId = signal<number | null>(null);
  private readonly selectedTeamProviders = signal<Set<number> | null>(null);

  readonly isPeriodActive = computed(() => {
    const start = this.periodStart();
    const end = this.periodEnd();
    return !!start && !!end && start.getTime() <= end.getTime();
  });
  readonly hasPeriodSelection = computed(() => !!this.periodStart() || !!this.periodEnd());
  readonly periodWarning = computed(() => {
    const start = this.periodStart();
    const end = this.periodEnd();
    if (!!start !== !!end) {
      return 'Completa ambas fechas para consultar un período.';
    }
    if (start && end && start.getTime() > end.getTime()) {
      return 'La fecha Desde no puede ser posterior a la fecha Hasta.';
    }
    return '';
  });
  readonly dailySummaryTitle = computed(() => {
    const period = this.periodExpenseSummary();
    if (!this.isPeriodActive() || !period) {
      return 'Estado del día';
    }
    return `Estado del período: ${this.formatDate(period.fechaDesde)} – ${this.formatDate(period.fechaHasta)}`;
  });
  readonly dailyTableTitle = computed(() =>
    this.isPeriodActive() ? 'Estado del período por campaña' : 'Estado del día por campaña'
  );
  readonly dailyFinanceCards = computed(() =>
    buildFinanceCards(this.isPeriodActive() ? this.periodExpenseSummary() : this.dailyExpenseSummary())
  );
  readonly monthlyFinanceCards = computed(() => buildFinanceCards(this.monthlyExpenseSummary()));
  readonly dailyFinanceRows = computed<FinanceRow[]>(() => {
    const summary = this.isPeriodActive() ? this.periodExpenseSummary() : this.dailyExpenseSummary();
    return (summary?.campanas ?? []).map((campana) => toFinanceRow(campana));
  });
  readonly snapshotRows = computed<SnapshotFinanceRow[]>(() => toSnapshotFinanceRows(this.campaignExpenseSnapshots()));
  readonly campanasActivas = computed(() =>
    this.campanas()
      .filter((campana) => campana.activo !== false)
      .filter((campana) => {
        const providerIds = this.selectedTeamProviders();
        return providerIds === null || (campana.idProveedor !== undefined && providerIds.has(campana.idProveedor));
      })
      .sort((left, right) => String(left.nombre ?? '').localeCompare(String(right.nombre ?? '')))
  );
  readonly teamOptions = computed<FinanceTeamOption[]>(() => [
    { label: 'Todos los equipos', value: null },
    ...this.teams()
      .slice()
      .sort((left, right) => left.nombre.localeCompare(right.nombre))
      .map((team) => ({
        label: team.activo ? team.nombre : `${team.nombre} (inactivo)`,
        value: team.id
      }))
  ]);

  readonly expenseForm = this.formBuilder.group({
    idCampana: [0, [Validators.required, Validators.min(1)]],
    leads: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    costoTotal: ['', [Validators.required, Validators.pattern(/^\d+(?:[,.]\d+)?$/)]]
  });

  async initialize(): Promise<void> {
    await Promise.all([this.loadFinanceDashboard(), this.loadCampaigns(), this.loadTeams()]);
  }

  async loadFinanceDashboard(): Promise<void> {
    this.isLoadingFinance.set(true);
    this.errorMessage.set(null);
    try {
      if (this.isPeriodActive()) {
        const start = this.toDateValue(this.periodStart()!);
        const end = this.toDateValue(this.periodEnd()!);
        this.financeMonth.set(end.slice(0, 7));
        const [period, monthly] = await Promise.all([
          firstValueFrom(this.leadService.obtenerResumenGastosPeriodo(start, end, this.selectedTeamId())),
          firstValueFrom(
            this.leadService.obtenerResumenGastosMensual(
              financeMonthYear(this.financeMonth()),
              financeMonthMonth(this.financeMonth()),
              this.selectedTeamId()
            )
          )
        ]);
        this.dailyExpenseSummary.set(null);
        this.periodExpenseSummary.set(period);
        this.monthlyExpenseSummary.set(monthly);
        return;
      }

      const [daily, monthly] = await Promise.all([
        firstValueFrom(this.leadService.obtenerResumenGastosDiario(this.financeDate(), this.selectedTeamId())),
        firstValueFrom(
          this.leadService.obtenerResumenGastosMensual(
            financeMonthYear(this.financeMonth()),
            financeMonthMonth(this.financeMonth()),
            this.selectedTeamId()
          )
        )
      ]);
      this.dailyExpenseSummary.set(daily);
      this.periodExpenseSummary.set(null);
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
    if (this.isPeriodActive()) {
      return;
    }
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

  async onPeriodStartChanged(value: Date | null): Promise<void> {
    this.periodStart.set(value);
    await this.applyPeriodIfComplete();
  }

  async onPeriodEndChanged(value: Date | null): Promise<void> {
    this.periodEnd.set(value);
    await this.applyPeriodIfComplete();
  }

  async clearPeriod(): Promise<void> {
    if (!this.hasPeriodSelection()) {
      return;
    }
    this.periodStart.set(null);
    this.periodEnd.set(null);
    this.periodExpenseSummary.set(null);
    this.financeDate.set(financeCurrentDateValue());
    this.financeMonth.set(financeCurrentMonthValue());
    await this.loadFinanceDashboard();
  }

  async onTeamChanged(idTeam: number | null | undefined): Promise<void> {
    const normalizedTeamId = idTeam ?? null;
    if (normalizedTeamId === this.selectedTeamId()) {
      return;
    }
    this.selectedTeamId.set(normalizedTeamId);
    this.selectedTeamProviders.set(normalizedTeamId === null ? null : new Set());
    this.expenseForm.controls.idCampana.reset(0);
    await Promise.all([this.loadFinanceDashboard(), this.loadSelectedTeamProviders(normalizedTeamId)]);
  }

  private async applyPeriodIfComplete(): Promise<void> {
    if (this.periodWarning()) {
      this.periodExpenseSummary.set(null);
      await this.loadFinanceDashboard();
      return;
    }
    if (this.isPeriodActive()) {
      await this.loadFinanceDashboard();
    }
  }

  private async loadTeams(): Promise<void> {
    try {
      this.teams.set(await firstValueFrom(this.adminEquipoService.listarEquipos()));
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar los equipos disponibles.'));
    }
  }

  private async loadSelectedTeamProviders(idTeam: number | null): Promise<void> {
    if (idTeam === null) {
      this.selectedTeamProviders.set(null);
      return;
    }

    try {
      const providers: ProveedorLite[] = await firstValueFrom(
        this.adminEquipoService.listarProveedoresDeEquipo(idTeam)
      );
      this.selectedTeamProviders.set(new Set(providers.map((provider) => provider.id)));
    } catch (error) {
      this.selectedTeamProviders.set(new Set());
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar las campañas del equipo.'));
    }
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

  private toDateValue(value: Date): string {
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }

  private formatDate(value: string): string {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
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
