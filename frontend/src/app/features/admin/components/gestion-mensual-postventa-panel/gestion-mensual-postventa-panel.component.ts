import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MessageModule } from 'primeng/message';
import { AdminGestionMensualFacade, GestionMensualFilaVM } from '../../facades/admin-gestion-mensual.facade';
import { MetricaPostventaCategoria, MetricaPostventaContexto } from '../../services/admin-postventa-metric-detail.service';

/**
 * Panel "Gestión del mes" (POSTVENTA WIN) del DASHBOARD del ADMIN. Tabla mensual por corte/recibo con
 * conteos por estado (pagados / impagos / bajas) y porcentajes autocalculados en el front. El mes se
 * navega con el stepper; el vigente lo resuelve el backend por la regla del día 15. Provee su propio
 * facade (bloque autónomo del dashboard).
 */
@Component({
  selector: 'app-gestion-mensual-postventa-panel',
  imports: [DecimalPipe, MessageModule],
  templateUrl: './gestion-mensual-postventa-panel.component.html',
  styleUrl: './gestion-mensual-postventa-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestionMensualPostventaPanelComponent implements OnInit {
  protected readonly facade = inject(AdminGestionMensualFacade);
  @Output() readonly verDetalle = new EventEmitter<MetricaPostventaContexto>();

  ngOnInit(): void {
    this.facade.start();
  }

  protected abrirDetalle(
    categoria: MetricaPostventaCategoria,
    cantidad: number,
    fila?: GestionMensualFilaVM
  ): void {
    const mes = this.facade.mesIso();
    if (!mes || cantidad <= 0) return;
    const categoriaLabel = labelCategoria(categoria);
    this.verDetalle.emit({
      modo: 'MENSUAL',
      mesReferencia: mes,
      proveedor: this.facade.proveedor(),
      categoria,
      cantidad,
      titulo: `${categoriaLabel} · ${fila?.etiqueta ?? this.facade.mesLabel()}`,
      descripcion: fila
        ? `Casos que componen esta fila de la gestión mensual.`
        : `Casos de todos los grupos incluidos en la gestión de ${this.facade.mesLabel()}.`,
      mesCorteBase: fila?.mesCorteBase,
      numeroCorte: fila?.numeroCorteBase,
      numeroRecibo: fila?.numeroFactura
    });
  }
}

function labelCategoria(categoria: MetricaPostventaCategoria): string {
  return ({ TOTAL: 'Total', PAGADOS: 'Pagados', IMPAGOS: 'Impagos', BAJAS: 'Bajas' })[categoria];
}
