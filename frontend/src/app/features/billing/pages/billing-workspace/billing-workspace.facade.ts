import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  BillingModalidad,
  BillingService,
  MatrizPlanillaRequest,
  MatrizPlanillaResponse,
  PlanillaAjustesResponse,
  PlanillaEmpleadoResponse,
  PlanillaGeneralResponse
} from '../../services/billing.service';

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
  readonly matrixVisible = signal(false);
  readonly adjustmentVisible = signal(false);
  readonly isSavingMatrix = signal(false);
  readonly isSavingAdjustment = signal(false);
  readonly matrixForm = signal<MatrizPlanillaRequest | null>(null);
  readonly activeMatrix = signal<MatrizPlanillaResponse | null>(null);
  readonly adjustmentEmployee = signal<PlanillaEmpleadoResponse | null>(null);
  readonly adjustments = signal<PlanillaAjustesResponse | null>(null);
  readonly adelantoMonto = signal<number | null>(null);
  readonly adelantoDescripcion = signal('');
  readonly bonoAdicionalMonto = signal<number | null>(null);
  readonly bonoAdicionalComentario = signal('');

  readonly isClosedMonth = computed(() => this.periodIsClosed(this.selectedMonth()));
  readonly rows = computed(() => this.planilla()?.empleados ?? []);
  readonly periodLabel = computed(() => this.formatPeriod(this.selectedMonth()));
  readonly employeeAdelantos = computed(() => {
    const employee = this.adjustmentEmployee();
    if (!employee) return [];
    return this.adjustments()?.adelantos.filter(item => item.idEmpleado === employee.idEmpleado) ?? [];
  });
  readonly employeeBonosAdicionales = computed(() => {
    const employee = this.adjustmentEmployee();
    if (!employee) return [];
    return this.adjustments()?.bonosAdicionales.filter(item => item.idEmpleado === employee.idEmpleado) ?? [];
  });

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

  async openMatrix(): Promise<void> {
    this.matrixVisible.set(true);
    this.errorMessage.set(null);
    try {
      const matrix = await firstValueFrom(this.billingService.obtenerMatrizActiva());
      this.activeMatrix.set(matrix);
      this.matrixForm.set({
        bonoCapacitacion: Number(matrix.bonoCapacitacion),
        comentario: matrix.comentario ?? '',
        modalidades: matrix.modalidades.map(item => ({
          modalidad: item.modalidad,
          horasDia: item.horasDia,
          bonoPuntualidad: Number(item.bonoPuntualidad),
          ventasMinimasProductividad: item.ventasMinimasProductividad,
          bonoProductividad: Number(item.bonoProductividad)
        })),
        tardanzas: matrix.tardanzas.map(item => ({
          minutosDesde: item.minutosDesde,
          minutosHasta: item.minutosHasta,
          montoDescuento: Number(item.montoDescuento)
        }))
      });
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar la matriz de calculo.'));
    }
  }

  closeMatrix(): void {
    this.matrixVisible.set(false);
  }

  updateMatrixCapacitacion(value: number): void {
    this.matrixForm.update(form => form ? { ...form, bonoCapacitacion: Number(value ?? 0) } : form);
  }

  updateMatrixComment(value: string): void {
    this.matrixForm.update(form => form ? { ...form, comentario: value } : form);
  }

  updateMatrixModalidad(index: number, field: 'horasDia' | 'bonoPuntualidad' | 'ventasMinimasProductividad' | 'bonoProductividad', value: number): void {
    this.matrixForm.update(form => {
      if (!form) return form;
      const modalidades = form.modalidades.map((item, i) => i === index ? { ...item, [field]: Number(value ?? 0) } : item);
      return { ...form, modalidades };
    });
  }

  updateMatrixTardanza(index: number, field: 'minutosDesde' | 'minutosHasta' | 'montoDescuento', value: number): void {
    this.matrixForm.update(form => {
      if (!form) return form;
      const tardanzas = form.tardanzas.map((item, i) => i === index ? { ...item, [field]: Number(value ?? 0) } : item);
      return { ...form, tardanzas };
    });
  }

  addTardanzaRule(): void {
    this.matrixForm.update(form => form ? { ...form, tardanzas: [...form.tardanzas, { minutosDesde: 0, minutosHasta: 0, montoDescuento: 0 }] } : form);
  }

  removeTardanzaRule(index: number): void {
    this.matrixForm.update(form => form ? { ...form, tardanzas: form.tardanzas.filter((_, i) => i !== index) } : form);
  }

  async saveMatrix(): Promise<void> {
    const form = this.matrixForm();
    if (!form) return;
    this.isSavingMatrix.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      const saved = await firstValueFrom(this.billingService.guardarMatriz(form));
      this.activeMatrix.set(saved);
      this.matrixVisible.set(false);
      this.successMessage.set('Matriz guardada. Presiona Calcular planilla para regenerar el borrador.');
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo guardar la matriz.'));
    } finally {
      this.isSavingMatrix.set(false);
    }
  }

  async openAdjustments(row: PlanillaEmpleadoResponse): Promise<void> {
    const planilla = this.planilla();
    if (!planilla) return;
    this.adjustmentEmployee.set(row);
    this.adjustmentVisible.set(true);
    this.adelantoMonto.set(null);
    this.adelantoDescripcion.set('');
    this.bonoAdicionalMonto.set(null);
    this.bonoAdicionalComentario.set('');
    await this.loadAdjustments();
  }

  closeAdjustments(): void {
    this.adjustmentVisible.set(false);
    this.adjustmentEmployee.set(null);
  }

  async saveAdelanto(): Promise<void> {
    const employee = this.adjustmentEmployee();
    const monto = Number(this.adelantoMonto() ?? 0);
    const descripcion = this.adelantoDescripcion().trim();
    if (!employee || monto <= 0 || !descripcion) {
      this.errorMessage.set('Ingresa monto y comentario del adelanto.');
      return;
    }
    const { anio, mes } = this.parseMonth(this.selectedMonth());
    this.isSavingAdjustment.set(true);
    this.errorMessage.set(null);
    try {
      await firstValueFrom(this.billingService.registrarAdelanto({ idEmpleado: employee.idEmpleado, anio, mes, monto, descripcion }));
      this.adelantoMonto.set(null);
      this.adelantoDescripcion.set('');
      await this.loadAdjustments();
      this.successMessage.set('Adelanto guardado. Presiona Calcular planilla para regenerar el borrador.');
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo registrar el adelanto.'));
    } finally {
      this.isSavingAdjustment.set(false);
    }
  }

  async saveBonoAdicional(): Promise<void> {
    const employee = this.adjustmentEmployee();
    const monto = Number(this.bonoAdicionalMonto() ?? 0);
    const comentario = this.bonoAdicionalComentario().trim();
    if (!employee || monto <= 0 || !comentario) {
      this.errorMessage.set('Ingresa monto y comentario del bono adicional.');
      return;
    }
    const { anio, mes } = this.parseMonth(this.selectedMonth());
    this.isSavingAdjustment.set(true);
    this.errorMessage.set(null);
    try {
      await firstValueFrom(this.billingService.registrarBonoAdicional({ idEmpleado: employee.idEmpleado, anio, mes, monto, comentario }));
      this.bonoAdicionalMonto.set(null);
      this.bonoAdicionalComentario.set('');
      await this.loadAdjustments();
      this.successMessage.set('Bono adicional guardado. Presiona Calcular planilla para regenerar el borrador.');
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo registrar el bono adicional.'));
    } finally {
      this.isSavingAdjustment.set(false);
    }
  }

  modalityLabel(value: BillingModalidad): string {
    return value;
  }

  ajusteDate(value: string | null): string {
    if (!value) return '';
    return new Date(value).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
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

  private async loadAdjustments(): Promise<void> {
    const planilla = this.planilla();
    if (!planilla) return;
    try {
      this.adjustments.set(await firstValueFrom(this.billingService.obtenerAjustes(planilla.id)));
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar los ajustes.'));
    }
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const responseError = (error as { error?: { message?: string; error?: string } }).error;
      return responseError?.message ?? responseError?.error ?? fallback;
    }
    return fallback;
  }
}
