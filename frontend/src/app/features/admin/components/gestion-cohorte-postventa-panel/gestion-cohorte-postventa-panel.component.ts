import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { AdminGestionCohorteFacade, GrupoDecisionVM } from '../../facades/admin-gestion-cohorte.facade';
import { MetricaPostventaCategoria, MetricaPostventaContexto } from '../../services/admin-postventa-metric-detail.service';

@Component({
  selector: 'app-gestion-cohorte-postventa-panel',
  imports: [DecimalPipe, MessageModule],
  templateUrl: './gestion-cohorte-postventa-panel.component.html',
  styleUrl: './gestion-cohorte-postventa-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestionCohortePostventaPanelComponent implements OnInit {
  protected readonly facade = inject(AdminGestionCohorteFacade);
  @Output() readonly verDetalle = new EventEmitter<MetricaPostventaContexto>();

  ngOnInit(): void {
    this.facade.start();
  }

  protected abrirDetalle(
    categoria: MetricaPostventaCategoria,
    cantidad: number,
    numeroRecibo: number,
    numeroCorte?: number
  ): void {
    const mes = this.facade.mesIso();
    if (!mes || cantidad <= 0) return;
    const alcance = numeroCorte ? `Corte ${numeroCorte}` : 'Consolidado';
    this.verDetalle.emit({
      modo: 'COHORTE',
      mesReferencia: mes,
      mesCorteBase: mes,
      proveedor: this.facade.proveedor(),
      categoria,
      cantidad,
      numeroCorte,
      numeroRecibo,
      titulo: `${labelCategoria(categoria)} · Recibo ${numeroRecibo} · ${alcance}`,
      descripcion: `${this.facade.mesLabel()} · ${alcance}. Casos que componen exactamente esta cifra.`
    });
  }

  protected abrirDetalleVentana(
    categoria: MetricaPostventaCategoria,
    cantidad: number,
    grupo: GrupoDecisionVM
  ): void {
    if (cantidad <= 0) return;
    this.verDetalle.emit({
      modo: 'COHORTE',
      mesReferencia: grupo.mesCorteBase,
      mesCorteBase: grupo.mesCorteBase,
      proveedor: this.facade.proveedor(),
      categoria,
      cantidad,
      numeroCorte: grupo.numeroCorte,
      numeroRecibo: grupo.numeroRecibo,
      titulo: `${labelCategoria(categoria)} · ${grupo.etiqueta} · Recibo ${grupo.numeroRecibo}`,
      descripcion: `Casos de ${grupo.etiqueta} que participan en la decisión del próximo 15.`
    });
  }
}

function labelCategoria(categoria: MetricaPostventaCategoria): string {
  return ({ TOTAL: 'Total', PAGADOS: 'Pagados', IMPAGOS: 'Impagos', BAJAS: 'Bajas' })[categoria];
}
