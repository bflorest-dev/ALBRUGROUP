import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  CampanaGastoResponse,
  CampanaGastoResumenMensualResponse,
  CampanaGastoResumenPeriodoResponse,
  CampanaResponse,
  CommunityLeadService,
  CuentaPublicitariaResponse,
  ProveedorResponse,
  RecargaCuentaPublicitariaResponse
} from '../community/services/community-lead.service';
import {
  FinanceRow,
  SnapshotFinanceRow,
  financeCurrentDateValue,
  financeCurrentMonthValue,
  financeMonthMonth,
  financeMonthYear,
  formatFinanceOperationalDate,
  formatFinanceOperationalTime,
  formatFinanceMoney,
  toFinanceRow,
  toSnapshotFinanceRows,
  toFinanceLocalDateTimeValue
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

  readonly rechargeDialogVisible = signal(false);
  readonly rechargeDrawerVisible = signal(false);
  readonly isLoadingRecharges = signal(false);
  readonly isSavingRecharge = signal(false);
  readonly recharges = signal<RecargaCuentaPublicitariaResponse[]>([]);
  readonly accounts = signal<CuentaPublicitariaResponse[]>([]);
  readonly rechargePeriod = signal<MetricsPeriodo>('dia');
  readonly rechargeDay = signal(financeCurrentDateValue());
  readonly rechargeUntil = signal<string | null>(null);
  readonly rechargeProviderId = signal<number | null>(null);
  readonly rechargeAccountId = signal<number | null>(null);

  readonly activeAccounts = computed(() => {
    const providerId = this.selectedProviderId();
    return this.accounts()
      .filter(a => a.activo !== false)
      .filter(a => providerId === null || a.idProveedor === providerId)
      .sort((a, b) => String(a.nombreCuenta ?? '').localeCompare(String(b.nombreCuenta ?? '')));
  });

  readonly rechargeProviderOptions = computed(() => [
    { label: 'Todos', value: null },
    ...this.providers()
      .filter(p => p.activo !== false)
      .sort((a, b) => String(a.nombre ?? '').localeCompare(String(b.nombre ?? '')))
      .map(p => ({ label: String(p.nombre ?? 'Sin nombre'), value: p.id }))
  ]);

  readonly rechargeAccountOptions = computed(() => {
    const providerId = this.rechargeProviderId();
    return [
      { label: 'Todas', value: null },
      ...this.accounts()
        .filter(a => a.activo !== false)
        .filter(a => providerId === null || a.idProveedor === providerId)
        .sort((a, b) => String(a.nombreCuenta ?? '').localeCompare(String(b.nombreCuenta ?? '')))
        .map(a => ({ label: String(a.nombreCuenta ?? ''), value: a.id }))
    ];
  });

  readonly filteredRecharges = computed(() => {
    const accountId = this.rechargeAccountId();
    if (accountId === null) return this.recharges();
    return this.recharges().filter(r => r.idCuentaPublicitaria === accountId);
  });

  readonly rechargeForm = this.formBuilder.group({
    idCuentaPublicitaria: [0, [Validators.required, Validators.min(1)]],
    monto: ['', [Validators.required, Validators.pattern(/^\d+(?:[,.]\d+)?$/)]],
    fecha: [new Date(), [Validators.required]],
    observacion: ['']
  });

  readonly expenseForm = this.formBuilder.group({
    idCampana: [0, [Validators.required, Validators.min(1)]],
    leadsReportados: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    costoTotal: ['', [Validators.required, Validators.pattern(/^\d+(?:[,.]\d+)?$/)]],
    reportedAt: [new Date(), [Validators.required]]
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

  readonly rechargeRange = computed(() =>
    resolveMetricsRange('dia', this.rechargeDay(), this.rechargeUntil()) as Required<MetricsRango>
  );
  readonly rechargeIsRange = computed(() => {
    const range = this.rechargeRange();
    return range.desde !== range.hasta;
  });
  readonly rechargeRangeLabel = computed(() => {
    const range = this.rechargeRange();
    const fmt = (v: string) => { const [y, m, d] = v.split('-'); return `${d}/${m}/${y}`; };
    return range.desde === range.hasta ? fmt(range.desde) : `${fmt(range.desde)} – ${fmt(range.hasta)}`;
  });
  readonly rechargeDailyRows = computed<{ fecha: string; total: number; cantidad: number }[]>(() => {
    if (!this.rechargeIsRange()) return [];
    const byDay = new Map<string, { total: number; cantidad: number }>();
    for (const r of this.filteredRecharges()) {
      const day = String(r.fecha ?? '').slice(0, 10);
      const entry = byDay.get(day) ?? { total: 0, cantidad: 0 };
      entry.total += r.monto ?? 0;
      entry.cantidad += 1;
      byDay.set(day, entry);
    }
    return Array.from(byDay.entries())
      .map(([fecha, v]) => ({ fecha, ...v }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
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
  readonly reportDate = formatFinanceOperationalDate;
  readonly reportTime = formatFinanceOperationalTime;

  async initialize(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [providers, campaigns, accounts] = await Promise.all([
        firstValueFrom(this.leadService.listarProveedores(true)),
        firstValueFrom(this.leadService.listarCampanas(true)),
        firstValueFrom(this.leadService.listarCuentasActivas())
      ]);
      this.providers.set(providers ?? []);
      this.campaigns.set(campaigns ?? []);
      this.accounts.set(accounts ?? []);
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
      reportedAt: new Date()
    });
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.dialogVisible.set(true);
  }

  closeExpenseDialog(): void {
    this.dialogVisible.set(false);
    this.editingId.set(null);
  }

  setExpenseTimeToNow(): void {
    if (this.editingId() !== null) return;
    this.expenseForm.controls.reportedAt.setValue(new Date());
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
    const reportedAt = raw.reportedAt instanceof Date && !Number.isNaN(raw.reportedAt.getTime())
      ? toFinanceLocalDateTimeValue(raw.reportedAt)
      : null;
    if (!raw.idCampana || leads === null || cost === null || !reportedAt) {
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
          reportedAt
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
      reportedAt: new Date(row.reportedAt)
    });
    this.closeSnapshots();
    this.errorMessage.set(null);
    this.dialogVisible.set(true);
  }

  openRechargeDialog(): void {
    this.rechargeForm.reset({
      idCuentaPublicitaria: 0,
      monto: '',
      fecha: new Date(),
      observacion: ''
    });
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.rechargeDialogVisible.set(true);
  }

  closeRechargeDialog(): void {
    this.rechargeDialogVisible.set(false);
  }

  setRechargeTimeToNow(): void {
    this.rechargeForm.controls.fecha.setValue(new Date());
  }

  async submitRecharge(): Promise<void> {
    if (this.rechargeForm.invalid) {
      this.rechargeForm.markAllAsTouched();
      this.errorMessage.set('Selecciona una cuenta e indica monto y fecha.');
      return;
    }

    const raw = this.rechargeForm.getRawValue();
    const monto = this.parseDecimal(String(raw.monto ?? ''));
    const fecha = raw.fecha instanceof Date && !Number.isNaN(raw.fecha.getTime())
      ? toFinanceLocalDateTimeValue(raw.fecha)
      : null;
    if (!raw.idCuentaPublicitaria || monto === null || !fecha) {
      this.errorMessage.set('Revisa los valores ingresados.');
      return;
    }

    this.isSavingRecharge.set(true);
    this.errorMessage.set(null);
    try {
      await firstValueFrom(this.leadService.registrarRecarga({
        idCuentaPublicitaria: raw.idCuentaPublicitaria,
        monto,
        fecha,
        observacion: raw.observacion || null
      }));
      this.closeRechargeDialog();
      this.successMessage.set('Recarga registrada.');
      await this.loadRecharges();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo registrar la recarga.'));
    } finally {
      this.isSavingRecharge.set(false);
    }
  }

  async openRechargeDrawer(): Promise<void> {
    this.rechargeDrawerVisible.set(true);
    await this.loadRecharges();
  }

  closeRechargeDrawer(): void {
    this.rechargeDrawerVisible.set(false);
    this.recharges.set([]);
  }

  async onRechargePeriodChange(periodo: MetricsPeriodo): Promise<void> {
    this.rechargePeriod.set(periodo);
    await this.loadRecharges();
  }

  async onRechargeRangeChange(range: MetricsRango): Promise<void> {
    this.rechargePeriod.set('dia');
    this.rechargeDay.set(range.desde);
    this.rechargeUntil.set(range.hasta === range.desde ? null : range.hasta);
    await this.loadRecharges();
  }

  async onRechargeProviderChange(idProveedor: number | null): Promise<void> {
    this.rechargeProviderId.set(idProveedor);
    this.rechargeAccountId.set(null);
    await this.loadRecharges();
  }

  onRechargeAccountChange(idCuenta: number | null): void {
    this.rechargeAccountId.set(idCuenta);
  }

  async loadRecharges(): Promise<void> {
    this.isLoadingRecharges.set(true);
    try {
      const range = this.rechargeRange();
      const recharges = await firstValueFrom(
        this.leadService.listarRecargas(range.desde, range.hasta, this.rechargeProviderId())
      );
      this.recharges.set(recharges ?? []);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar las recargas.'));
    } finally {
      this.isLoadingRecharges.set(false);
    }
  }

  sanitizeRechargeDecimal(): void {
    const control = this.rechargeForm.controls.monto;
    const cleaned = String(control.value ?? '').replace(/[^\d,.]/g, '');
    const separator = cleaned.search(/[,.]/);
    const next = separator < 0
      ? cleaned
      : `${cleaned.slice(0, separator).replace(/[,.]/g, '') || '0'}${cleaned[separator]}${cleaned.slice(separator + 1).replace(/[,.]/g, '')}`;
    if (next !== control.value) control.setValue(next);
  }

  rechargeTotal(): number {
    return this.filteredRecharges().reduce((sum, r) => sum + (r.monto ?? 0), 0);
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
