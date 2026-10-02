import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { LeadDetalleResponse } from '../../../shared/models/preventa/preventa.models';
import { MetricsPeriodo } from '../../../shared/components/period-selector/period-selector.component';
import { MetricsRango, localToday } from '../../../shared/utils/metrics-period';
import { SessionService } from '../../../core/services/session.service';
import { DashboardVentaService, ProveedorRef } from '../services/dashboard-venta.service';
import {
  LeadPreventaInstalacionReport,
  PreventaInstalacionService
} from '../services/preventa-instalacion.service';

@Injectable()
export class PreventaInstalacionFacade {
  private readonly service = inject(PreventaInstalacionService);
  private readonly dashboardVentaService = inject(DashboardVentaService);
  private readonly sessionService = inject(SessionService);

  readonly periodo = signal<MetricsPeriodo>('dia');
  readonly dia = signal(localToday());
  readonly hasta = signal<string | null>(localToday());
  readonly idProveedor = signal<number | null>(null);
  readonly idAsesorPreventa = signal<number | null>(null);
  readonly pageNumber = signal(0);
  readonly pageSize = signal(25);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly report = signal<LeadPreventaInstalacionReport | null>(null);
  readonly proveedores = signal<ProveedorRef[]>([]);
  readonly detalle = signal<LeadDetalleResponse | null>(null);
  readonly detalleLoading = signal(false);
  readonly detalleError = signal('');
  readonly esAdmin = computed(() => this.sessionService.getActiveRole() === 'ADMINISTRADOR');
  readonly proveedorOptions = computed(() =>
    [{ label: 'Todos', value: null }, ...this.proveedores().map(proveedor => ({ label: proveedor.nombre, value: proveedor.id }))]
  );
  readonly proveedorActual = computed(() =>
    this.proveedores().find(proveedor => proveedor.id === this.idProveedor())?.nombre ?? ''
  );

  readonly rows = computed(() => this.report()?.detalle.content ?? []);
  readonly totales = computed(() => this.report()?.totales ?? {
    totalPreventas: 0,
    instalados: 0,
    cumplenMismaSemana: 0,
    noCumplenMismaSemana: 0,
    pendientesInstalacion: 0
  });
  readonly asesores = computed(() => this.report()?.porAsesor ?? []);
  readonly totalPages = computed(() => this.report()?.detalle.totalPages ?? 0);
  readonly currentPage = computed(() => (this.report()?.detalle.page ?? 0) + 1);

  constructor() {
    this.dashboardVentaService.obtenerProveedores()
      .pipe(catchError(() => of([] as ProveedorRef[])))
      .subscribe(proveedores => {
        this.proveedores.set(proveedores);
        if (!this.esAdmin() && this.idProveedor() === null) {
          this.idProveedor.set(proveedores[0]?.id ?? null);
        }
      });
  }

  cargar(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    const fechaDesde = this.dia();
    const fechaHasta = this.hasta() || fechaDesde;
    this.service.listar({
      fechaPreventaDesde: fechaDesde,
      fechaPreventaHasta: fechaHasta,
      fechaInstalacionDesde: fechaDesde,
      fechaInstalacionHasta: fechaHasta,
      idProveedor: this.idProveedor(),
      idAsesorPreventa: this.idAsesorPreventa(),
      estadoPostventa: null,
      sinEstadoPostventa: false,
      cumpleMismaSemana: true,
      estadoCumplimientoSemana: null,
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      sortBy: 'fechaPreventa',
      direction: 'desc'
    }).subscribe({
      next: report => {
        this.report.set(report);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar RevisionSemanal.');
        this.isLoading.set(false);
      }
    });
  }

  onRangoChange(rango: MetricsRango): void {
    this.dia.set(rango.desde);
    this.hasta.set(rango.hasta);
    this.aplicarFiltros();
  }

  seleccionarProveedor(idProveedor: number | null): void {
    if (!this.esAdmin()) return;
    this.idProveedor.set(idProveedor);
    this.aplicarFiltros();
  }

  seleccionarAsesor(idAsesor: number | null): void {
    this.idAsesorPreventa.set(idAsesor);
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.pageNumber.set(0);
    this.cargar();
  }

  cambiarPagina(delta: number): void {
    const next = this.pageNumber() + delta;
    if (next < 0 || next >= this.totalPages()) return;
    this.pageNumber.set(next);
    this.cargar();
  }

  abrirDetalle(idLead: number): void {
    this.detalleLoading.set(true);
    this.detalleError.set('');
    this.detalle.set(null);
    this.service.obtenerDetalle(idLead).subscribe({
      next: detalle => {
        this.detalle.set(detalle);
        this.detalleLoading.set(false);
      },
      error: () => {
        this.detalleError.set(`No se pudo cargar el detalle del lead ${idLead}.`);
        this.detalleLoading.set(false);
      }
    });
  }

  cerrarDetalle(): void {
    this.detalle.set(null);
    this.detalleError.set('');
  }

  resetear(): void {
    const actual = localToday();
    this.periodo.set('dia');
    this.dia.set(actual);
    this.hasta.set(actual);
    this.idProveedor.set(this.esAdmin() ? null : (this.proveedores()[0]?.id ?? null));
    this.idAsesorPreventa.set(null);
    this.aplicarFiltros();
  }

}
