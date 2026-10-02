import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { LeadDetalleResponse } from '../../../shared/models/preventa/preventa.models';
import { DashboardVentaService, ProveedorRef } from '../services/dashboard-venta.service';
import {
  EstadoCumplimientoSemana,
  EstadoPostventa,
  LeadPreventaInstalacionReport,
  PreventaInstalacionService
} from '../services/preventa-instalacion.service';

const hoy = (): string => {
  const fecha = new Date();
  const mes = `${fecha.getMonth() + 1}`.padStart(2, '0');
  const dia = `${fecha.getDate()}`.padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
};

@Injectable()
export class PreventaInstalacionFacade {
  private readonly service = inject(PreventaInstalacionService);
  private readonly dashboardVentaService = inject(DashboardVentaService);

  readonly fechaPreventaDesde = signal(hoy());
  readonly fechaPreventaHasta = signal(hoy());
  readonly fechaInstalacionDesde = signal(hoy());
  readonly fechaInstalacionHasta = signal(hoy());
  readonly idProveedor = signal<number | null>(null);
  readonly idAsesorPreventa = signal<number | null>(null);
  readonly estadoPostventa = signal<EstadoPostventa | null>(null);
  readonly sinEstadoPostventa = signal(false);
  readonly cumpleMismaSemana = signal<boolean | null>(null);
  readonly estadoCumplimientoSemana = signal<EstadoCumplimientoSemana | null>(null);
  readonly pageNumber = signal(0);
  readonly pageSize = signal(25);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly report = signal<LeadPreventaInstalacionReport | null>(null);
  readonly proveedores = signal<ProveedorRef[]>([]);
  readonly detalle = signal<LeadDetalleResponse | null>(null);
  readonly detalleLoading = signal(false);
  readonly detalleError = signal('');

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
      .subscribe(proveedores => this.proveedores.set(proveedores));
  }

  cargar(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.service.listar({
      fechaPreventaDesde: this.fechaPreventaDesde(),
      fechaPreventaHasta: this.fechaPreventaHasta(),
      fechaInstalacionDesde: this.fechaInstalacionDesde(),
      fechaInstalacionHasta: this.fechaInstalacionHasta(),
      idProveedor: this.idProveedor(),
      idAsesorPreventa: this.idAsesorPreventa(),
      estadoPostventa: this.estadoPostventa(),
      sinEstadoPostventa: this.sinEstadoPostventa(),
      cumpleMismaSemana: this.cumpleMismaSemana(),
      estadoCumplimientoSemana: this.estadoCumplimientoSemana(),
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
        this.errorMessage.set('No se pudo cargar el informe de Preventa → Instalación.');
        this.isLoading.set(false);
      }
    });
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
    const actual = hoy();
    this.fechaPreventaDesde.set(actual);
    this.fechaPreventaHasta.set(actual);
    this.fechaInstalacionDesde.set(actual);
    this.fechaInstalacionHasta.set(actual);
    this.idProveedor.set(null);
    this.idAsesorPreventa.set(null);
    this.estadoPostventa.set(null);
    this.sinEstadoPostventa.set(false);
    this.cumpleMismaSemana.set(null);
    this.estadoCumplimientoSemana.set(null);
    this.aplicarFiltros();
  }

  estadoLabel(estado: EstadoCumplimientoSemana): string {
    switch (estado) {
      case 'CUMPLE': return 'Misma semana';
      case 'NO_CUMPLE': return 'Semana diferente';
      case 'PENDIENTE_INSTALACION': return 'Pendiente de instalación';
      default: return 'No evaluable';
    }
  }
}
