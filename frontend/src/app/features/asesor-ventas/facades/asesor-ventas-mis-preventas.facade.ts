import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MisPreventasV2Response } from '../../../shared/models/preventa/preventa.models';
import { buildTelUrl } from '../../../shared/utils/phone-link';
import { VentaDetalleRow, VentaDetallePage } from '../../admin/services/dashboard-venta.service';
import { PreventaLeadService } from '../../preventa/services/preventa-lead.service';
import { BrowserSessionService } from '../../../core/services/browser-session.service';

export type { VentaDetalleRow };

@Injectable()
export class AsesorVentasMisPreventasFacade {
  private readonly preventaService = inject(PreventaLeadService);
  private readonly browserSessionService = inject(BrowserSessionService);

  readonly pageSize = 15;

  readonly selectedMonth = signal<Date>(this.firstDayOfCurrentMonth());
  readonly minMonth = this.firstDayOfRelativeMonth(-6);
  readonly maxMonth = new Date();

  readonly selectedProveedorId = signal<number | null>(null);
  readonly proveedores = signal<{ id: number; nombre: string }[]>([]);

  readonly searchTerm = signal('');

  readonly isLoading = signal(false);
  readonly isLoadingCuadrante = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly cuadrante = signal<MisPreventasV2Response | null>(null);
  readonly rows = signal<VentaDetalleRow[]>([]);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly pageNumber = signal(0);

  readonly mesParam = computed(() => this.toMesParam(this.selectedMonth()));

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      if (this.selectedProveedorId() === null) {
        await this.initProveedor();
      }
      await Promise.all([this.refreshCuadrante(), this.refreshDetalle()]);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar tus preventas.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async initProveedor(): Promise<void> {
    const pvds = await firstValueFrom(this.preventaService.listarProveedoresMisPreventasV2());
    this.proveedores.set(pvds);
    if (pvds.length > 0) {
      this.selectedProveedorId.set(pvds[0].id);
    }
  }

  async setMonth(value: Date | null | undefined): Promise<void> {
    if (!value) return;
    this.selectedMonth.set(this.clampMonth(new Date(value.getFullYear(), value.getMonth(), 1)));
    this.pageNumber.set(0);
    await this.load();
  }

  async setProveedor(id: number | null): Promise<void> {
    if (id === this.selectedProveedorId()) return;
    this.selectedProveedorId.set(id);
    this.pageNumber.set(0);
    await this.load();
  }

  async search(term: string): Promise<void> {
    this.searchTerm.set(term);
    this.pageNumber.set(0);
    this.isLoading.set(true);
    try {
      await this.refreshDetalle();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo buscar.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async changePage(pageNumber: number): Promise<void> {
    if (pageNumber === this.pageNumber()) return;
    this.pageNumber.set(pageNumber);
    this.isLoading.set(true);
    try {
      await this.refreshDetalle();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar el detalle.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async llamar(row: VentaDetalleRow): Promise<void> {
    const telUrl = buildTelUrl(row.prefijo, row.lead);
    if (!telUrl) {
      this.errorMessage.set('El lead no tiene un número válido para iniciar la llamada.');
      return;
    }
    this.browserSessionService.allowExternalNavigation();
    window.location.assign(telUrl);
    try {
      await firstValueFrom(this.preventaService.registrarContactoMisPreventasV2(row.idLead));
    } catch {
      this.errorMessage.set('Se inició la llamada pero no se pudo registrar el contacto.');
    }
  }

  hasPhone(row: VentaDetalleRow): boolean {
    return !!buildTelUrl(row.prefijo, row.lead);
  }

  conversionPct(num: number, denom: number): string {
    if (denom === 0) return '—';
    return `${((num / denom) * 100).toFixed(1)}%`;
  }

  display(value: string | number | null | undefined): string {
    return value === null || value === undefined || value === '' ? '—' : String(value);
  }

  zona(row: VentaDetalleRow): string {
    const ub = row.ubigeo;
    if (!ub) return 'Sin ubigeo';
    const pref = ub.substring(0, 2);
    return pref === '15' || pref === '07' ? 'Lima' : 'Provincia';
  }

  instantDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  instantTime(iso: string | null | undefined): string {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  localDate(date: string | null | undefined): string {
    if (!date) return '—';
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${String(y).slice(2)}`;
  }

  localTime(time: string | null | undefined): string {
    if (!time) return '';
    return time.substring(0, 5);
  }

  aliasAsesor(nombre: string | null | undefined): string {
    if (!nombre) return '—';
    const parts = nombre.trim().split(/\s+/);
    return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
  }

  private async refreshCuadrante(): Promise<void> {
    this.isLoadingCuadrante.set(true);
    try {
      const cq = await firstValueFrom(
        this.preventaService.obtenerCuadranteMisPreventasV2(this.selectedProveedorId(), this.mesParam())
      );
      this.proveedores.set(cq.proveedores);
      this.cuadrante.set(cq);
    } finally {
      this.isLoadingCuadrante.set(false);
    }
  }

  private async refreshDetalle(): Promise<void> {
    const page: VentaDetallePage = await firstValueFrom(
      this.preventaService.obtenerDetalleMisPreventasV2({
        idProveedor: this.selectedProveedorId(),
        mes: this.mesParam(),
        search: this.searchTerm() || undefined,
        sortBy: 'fechaIngresoEtapa',
        direction: 'desc',
        page: this.pageNumber(),
        size: this.pageSize
      })
    );
    this.rows.set(page.content);
    this.totalElements.set(page.totalElements);
    this.totalPages.set(page.totalPages);
  }

  private toMesParam(date: Date): string {
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${date.getFullYear()}-${m}`;
  }

  private firstDayOfCurrentMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private firstDayOfRelativeMonth(offset: number): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + offset, 1);
  }

  private clampMonth(month: Date): Date {
    const candidate = new Date(month.getFullYear(), month.getMonth(), 1);
    if (candidate < this.minMonth) return new Date(this.minMonth);
    const maxMonth = this.firstDayOfCurrentMonth();
    if (candidate > maxMonth) return maxMonth;
    return candidate;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const responseError = (error as { error?: { message?: unknown } }).error;
      if (
        typeof responseError === 'object' &&
        responseError !== null &&
        'message' in responseError &&
        typeof responseError.message === 'string' &&
        responseError.message.trim()
      ) {
        return responseError.message;
      }
    }
    return fallback;
  }
}
