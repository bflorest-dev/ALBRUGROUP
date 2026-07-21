import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { GestionEquipoMatriz } from '../../facades/admin-gestion-campana.facade';
import { celdaConTintaClara, colorCelda } from '../../models/tipificacion-ramp';

/**
 * Cortes de intensidad sobre el porcentaje de la celda. Fijos y explicables: un corte relativo al
 * máximo haría que la misma cifra cambiara de color entre períodos, y el color dejaría de ser
 * comparable de un día para otro.
 */
const CORTES = [10, 25, 40, 60, 80];


/**
 * Matriz tipificación × campaña teñida por magnitud: cuanto más oscura la celda, mayor la
 * concentración de ese desenlace en esa campaña. Es la vista de detalle y la vista accesible del
 * bloque: conserva todas las cifras, la columna congelada y los totales.
 */
@Component({
  selector: 'app-gestion-campana-matrix',
  standalone: true,
  imports: [DecimalPipe, TableModule, TagModule],
  templateUrl: './gestion-campana-matrix.component.html',
  styleUrl: './gestion-campana-matrix.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestionCampanaMatrixComponent {
  readonly matriz = input.required<GestionEquipoMatriz>();
  readonly oscuro = input(false);

  /**
   * Peso de la fila sobre el total del equipo. Es otra base que la de las celdas (que se calculan
   * sobre su campaña), por eso la columna Total no se tiñe: mezclar dos escalas en el mismo color
   * haría comparable lo que no lo es.
   */
  protected porcentajeDelTotal(total: number): number {
    const totalEquipo = this.matriz().totalLeads;
    return totalEquipo > 0 ? (total / totalEquipo) * 100 : 0;
  }

  /** Fondo de la celda. Cero no se tiñe: una celda vacía debe leerse vacía. */
  protected fondo(porcentaje: number): string {
    return colorCelda(this.paso(porcentaje), this.oscuro());
  }

  /** Sobre fondo profundo la cifra se invierte; si no, el número se pierde. */
  protected tintaClara(porcentaje: number): boolean {
    return celdaConTintaClara(this.paso(porcentaje), this.oscuro());
  }

  private paso(porcentaje: number): number {
    if (porcentaje <= 0) {
      return -1;
    }
    const indice = CORTES.findIndex((corte) => porcentaje <= corte);
    return indice === -1 ? CORTES.length : indice;
  }
}
