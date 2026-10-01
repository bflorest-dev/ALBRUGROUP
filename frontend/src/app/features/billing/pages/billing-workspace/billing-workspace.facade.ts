import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BillingService, PlanillaEmpleadoResponse, PlanillaGeneralResponse } from '../../services/billing.service';

type PeriodValue = `${number}-${string}`;

@Injectable()
export class BillingWorkspaceFacade {
  private readonly billingService = inject(BillingService);

  readonly isLoading = signal(false);
  readonly isCalculating = signal(false);
  readonly isApproving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly selectedMonth = signal<PeriodValue>(this.lastClosedMonthValue());
  readonly planilla = signal<PlanillaGeneralResponse | null>(null);
  readonly selectedEmployee = signal<PlanillaEmpleadoResponse | null>(null);
  readonly detailVisible = signal(false);

  readonly isClosedMonth = computed(() => this.periodIsClosed(this.selectedMonth()));
  readonly rows = computed(() => this.planilla()?.empleados ?? []);
  readonly periodLabel = computed(() => this.formatPeriod(this.selectedMonth()));

  async initialize(): Promise<void> {
    await this.loadPlanilla();
  }

  async onMonthChange(value: string): Promise<void> {
    if (!/^\d{4}-\d{2}$/.test(value)) {
      return;
    }
    this.selectedMonth.set(value as PeriodValue);
    this.planilla.set(null);
    await this.loadPlanilla();
  }

  async loadPlanilla(): Promise<void> {
    const { anio, mes } = this.parseMonth(this.selectedMonth());
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      this.planilla.set(await firstValueFrom(this.billingService.obtenerPlanilla(anio, mes)));
    } catch (error) {
      this.planilla.set(null);
      if (this.isClosedMonth()) {
        this.errorMessage.set(this.getErrorMessage(error, 'No hay planilla calculada para el periodo seleccionado.'));
      } else {
        this.errorMessage.set('El mes seleccionado aun no ha cerrado.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async calcular(): Promise<void> {
    if (!this.isClosedMonth()) {
      this.errorMessage.set('Solo puedes calcular meses cerrados.');
      return;
    }
    const { anio, mes } = this.parseMonth(this.selectedMonth());
    this.isCalculating.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      this.planilla.set(await firstValueFrom(this.billingService.calcularPlanilla(anio, mes)));
      this.successMessage.set('Planilla calculada en borrador.');
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo calcular la planilla.'));
    } finally {
      this.isCalculating.set(false);
    }
  }

  async aprobar(): Promise<void> {
    const planilla = this.planilla();
    if (!planilla || planilla.estado !== 'REVISION') {
      return;
    }
    this.isApproving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      this.planilla.set(await firstValueFrom(this.billingService.aprobarPlanilla(planilla.id)));
      this.successMessage.set('Planilla aprobada y congelada.');
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo aprobar la planilla.'));
    } finally {
      this.isApproving.set(false);
    }
  }

  openDetail(row: PlanillaEmpleadoResponse): void {
    this.selectedEmployee.set(row);
    this.detailVisible.set(true);
  }

  closeDetail(): void {
    this.detailVisible.set(false);
    this.selectedEmployee.set(null);
  }

  money(value: number | null | undefined): string {
    const amount = Number(value ?? 0);
    return amount.toLocaleString('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  number(value: number | null | undefined): string {
    return Number(value ?? 0).toLocaleString('es-PE');
  }

  hoursFromMinutes(value: number | null | undefined): string {
    const minutes = Number(value ?? 0);
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder === 0 ? `${hours} h` : `${hours} h ${remainder} min`;
  }

  date(value: string | null | undefined): string {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }

  private lastClosedMonthValue(): PeriodValue {
    const now = new Date();
    const firstOfCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastClosed = new Date(firstOfCurrent);
    lastClosed.setMonth(lastClosed.getMonth() - 1);
    return `${lastClosed.getFullYear()}-${String(lastClosed.getMonth() + 1).padStart(2, '0')}` as PeriodValue;
  }

  private periodIsClosed(value: string): boolean {
    const { anio, mes } = this.parseMonth(value);
    const now = new Date();
    const current = now.getFullYear() * 12 + now.getMonth() + 1;
    return anio * 12 + mes < current;
  }

  private parseMonth(value: string): { anio: number; mes: number } {
    const [year, month] = value.split('-').map(Number);
    return { anio: year, mes: month };
  }

  private formatPeriod(value: string): string {
    const { anio, mes } = this.parseMonth(value);
    const date = new Date(anio, mes - 1, 1);
    return new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(date);
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const responseError = (error as { error?: { message?: string; error?: string } }).error;
      return responseError?.message ?? responseError?.error ?? fallback;
    }
    return fallback;
  }
}
