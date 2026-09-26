import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  CampanaGastoResponse,
  CampanaGastoResumenMensualResponse,
  CampanaGastoResumenPeriodoResponse,
  CampanaResponse,
  CommunityLeadService,
  ProveedorResponse
} from '../community/services/community-lead.service';
import {
  FinanceRow,
  SnapshotFinanceRow,
  financeCurrentDateTimeValue,
  financeCurrentDateValue,
  financeCurrentMonthValue,
  financeMonthMonth,
  financeMonthYear,
  formatFinanceDateTime,
  formatFinanceMoney,
  toFinanceRow,
  toSnapshotFinanceRows
} from '../../shared/utils/campaign-finance.utils';
import { MetricsPeriodo } from '../../shared/components/period-selector/period-selector.component';
import { MetricsRango, resolveMetricsRange } from '../../shared/utils/metrics-period';

@Injectable()
export class FinanceWorkspaceFacade {
  private readonly formBuilder = inject(FormBuilder);
  private readonly leadService = inject(CommunityLeadService);

  readonly isLoading = signal(false);
  readonly isLoadingSnapshots = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly providers = signal<ProveedorResponse[]>([]);
  readonly selectedProviderId = signal<number | null>(null);
  readonly campaigns = signal<CampanaResponse[]>([]);
  readonly period = signal<MetricsPeriodo>('dia');
  readonly day = signal(financeCurrentDateValue());
  readonly until = signal<string | null>(null);
  readonly periodSummary = signal<CampanaGastoResumenPeriodoResponse | null>(null);
  readonly monthlySummary = signal<CampanaGastoResumenMensualResponse | null>(null);
  readonly snapshots = signal<CampanaGastoResponse[]>([]);
  readonly selectedCampaign = signal<FinanceRow | null>(null);
  readonly snapshotsVisible = signal(false);
  readonly dialogVisible = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly expenseForm = this.formBuilder.group({
    idCampana: [0, [Validators.required, Validators.min(1)]],
    leadsReportados: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    costoTotal: ['', [Validators.required, Validators.pattern(/^\d+(?:[,.]\d+)?$/)]],
    reportedAt: [financeCurrentDateTimeValue(), [Validators.required]]
  });

  readonly providerOptions = computed(() => [
    { label: 'Todos', value: null },
    ...this.providers()
      .filter((provider) => provider.activo !== false)
      .sort((a, b) => String(a.nombre ?? '').localeCompare(String(b.nombre ?? '')))
      .map((provider) => ({ label: String(provider.nombre ?? 'Sin nombre'), value: provider.id }))
  ]);

  readonly periodRange = computed(() =>
    resolveMetricsRange('dia', this.day(), this.until()) as Required<MetricsRango>
  );
  readonly historyRowsAreDailyClosures = computed(() => {
    const range = this.periodRange();
    return range.desde !== range.hasta;
  });

  readonly activeCampaigns = computed(() => {
    const providerId = this.selectedProviderId();
    return this.campaigns()
      .filter((campaign) => campaign.activo !== false)
      .filter((campaign) => providerId === null || campaign.idProveedor === providerId)
      .sort((a, b) => {
        const providerOrder = String(a.nombreProveedor ?? '').localeCompare(String(b.nombreProveedor ?? ''));
        return providerOrder || String(a.nombre ?? '').localeCompare(String(b.nombre ?? ''));
      });
  });

  readonly rows = computed(() =>
    (this.periodSummary()?.campanas ?? []).map((campaign) => toFinanceRow(campaign))
  );

  readonly snapshotRows = computed<SnapshotFinanceRow[]>(() => toSnapshotFinanceRows(this.snapshots()));
  readonly rangeLabel = computed(() => {
    const range = this.periodRange();
    const format = (value: string) => {
      const [year, month, day] = value.split('-');
      return `${day}/${month}/${year}`;
    };
    return range.desde === range.hasta ? format(range.desde) : `${format(range.desde)} – ${format(range.hasta)}`;
  });

  readonly money = formatFinanceMoney;
  readonly dateTime = formatFinanceDateTime;

  async initialize(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [providers, campaigns] = await Promise.all([
        firstValueFrom(this.leadService.listarProveedores(true)),
        firstValueFrom(this.leadService.listarCampanas(true))
      ]);
      this.providers.set(providers ?? []);
      this.campaigns.set(campaigns ?? []);
      await this.loadDashboard();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar Finanzas.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadDashboard(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const range = this.periodRange();
    const providerId = this.selectedProviderId();
    try {
      const [period, monthly] = await Promise.all([
        firstValueFrom(this.leadService.obtenerResumenGastosPeriodo(range.desde, range.hasta, providerId)),
        firstValueFrom(
          this.leadService.obtenerResumenGastosMensual(
            financeMonthYear(financeCurrentMonthValue()),
            financeMonthMonth(financeCurrentMonthValue()),
            providerId
          )
        )
      ]);
      this.periodSummary.set(period);
      this.monthlySummary.set(monthly);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar las métricas financieras.'));
      this.periodSummary.set(null);
      this.monthlySummary.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onProviderChange(idProveedor: number | null): Promise<void> {
    if (idProveedor === this.selectedProviderId()) {
      return;
    }
    this.selectedProviderId.set(idProveedor);
    this.expenseForm.controls.idCampana.reset(0);
    await this.loadDashboard();
  }

  async onPeriodChange(periodo: MetricsPeriodo): Promise<void> {
    this.period.set(periodo);
    await this.loadDashboard();
  }

  async onRangeChange(range: MetricsRango): Promise<void> {
    this.period.set('dia');
    this.day.set(range.desde);
    this.until.set(range.hasta === range.desde ? null : range.hasta);
    await this.loadDashboard();
  }

  openExpenseDialog(): void {
    this.editingId.set(null);
    this.expenseForm.reset({
      idCampana: 0,
      leadsReportados: '',
      costoTotal: '',
      reportedAt: financeCurrentDateTimeValue()
    });
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.dialogVisible.set(true);
  }

  closeExpenseDialog(): void {
    this.dialogVisible.set(false);
    this.editingId.set(null);
  }

  async submitExpense(): Promise<void> {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      this.errorMessage.set('Selecciona una campaña e indica leads, costo y fecha del reporte.');
      return;
    }

    const raw = this.expenseForm.getRawValue();
    const leads = this.parseInteger(String(raw.leadsReportados ?? ''));
    const cost = this.parseDecimal(String(raw.costoTotal ?? ''));
    if (!raw.idCampana || leads === null || cost === null || !raw.reportedAt) {
      this.errorMessage.set('Revisa los valores ingresados antes de guardar.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      if (this.editingId()) {
        await firstValueFrom(this.leadService.actualizarGastoCampana(raw.idCampana, this.editingId()!, {
          leadsReportados: leads,
          costoTotal: cost
        }));
      } else {
        await firstValueFrom(this.leadService.registrarGastoCampana(raw.idCampana, {
          leadsReportados: leads,
          costoTotal: cost,
          reportedAt: raw.reportedAt
        }));
      }
      this.closeExpenseDialog();
      await this.loadDashboard();
      this.successMessage.set('Gasto de campaña guardado.');
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo guardar el gasto de campaña.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async openSnapshots(row: FinanceRow): Promise<void> {
    this.selectedCampaign.set(row);
    this.snapshots.set([]);
    this.snapshotsVisible.set(true);
    this.isLoadingSnapshots.set(true);
    try {
      const range = this.periodRange();
      const snapshots = range.desde === range.hasta
        ? await firstValueFrom(this.leadService.listarGastosCampanaDia(row.idCampana, range.desde))
        : await firstValueFrom(this.leadService.listarCierresDiariosCampanaPeriodo(row.idCampana, range.desde, range.hasta));
      this.snapshots.set(snapshots ?? []);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar el histórico de la campaña.'));
    } finally {
      this.isLoadingSnapshots.set(false);
    }
  }

  closeSnapshots(): void {
    this.snapshotsVisible.set(false);
    this.selectedCampaign.set(null);
    this.snapshots.set([]);
  }

  editSnapshot(row: SnapshotFinanceRow): void {
    if (!row.id || !row.reportedAt) {
      return;
    }
    this.editingId.set(row.id);
    this.expenseForm.reset({
      idCampana: row.idCampana,
      leadsReportados: String(row.leadsReportados),
      costoTotal: String(row.costoTotal),
      reportedAt: row.reportedAt.slice(0, 16)
    });
    this.closeSnapshots();
    this.errorMessage.set(null);
    this.dialogVisible.set(true);
  }

  sanitizeInteger(): void {
    const control = this.expenseForm.controls.leadsReportados;
    const next = String(control.value ?? '').replace(/\D/g, '');
    if (next !== control.value) control.setValue(next);
  }

  sanitizeDecimal(): void {
    const control = this.expenseForm.controls.costoTotal;
    const cleaned = String(control.value ?? '').replace(/[^\d,.]/g, '');
    const separator = cleaned.search(/[,.]/);
    const next = separator < 0
      ? cleaned
      : `${cleaned.slice(0, separator).replace(/[,.]/g, '') || '0'}${cleaned[separator]}${cleaned.slice(separator + 1).replace(/[,.]/g, '')}`;
    if (next !== control.value) control.setValue(next);
  }

  private parseInteger(value: string): number | null {
    if (!/^\d+$/.test(value)) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
  }

  private parseDecimal(value: string): number | null {
    const normalized = value.replace(',', '.');
    if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
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
