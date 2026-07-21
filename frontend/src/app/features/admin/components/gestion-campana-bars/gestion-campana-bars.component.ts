import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { formatLabel } from '../../../../shared/utils/display-label';
import { GestionBarraSegmento, GestionEquipoBarras } from '../../facades/admin-gestion-campana.facade';
import { colorRampa } from '../../models/tipificacion-ramp';

interface LeyendaItem {
  label: string;
  color: string;
}

/**
 * Barras apiladas al 100%: la composición de desenlaces de cada campaña, ordenadas por volumen.
 * Responde de un vistazo "qué campaña rinde", que en la matriz queda enterrado tras el scroll.
 * Es presentacional: recibe el view model ya armado por el facade.
 */
@Component({
  selector: 'app-gestion-campana-bars',
  standalone: true,
  imports: [TooltipModule],
  templateUrl: './gestion-campana-bars.component.html',
  styleUrl: './gestion-campana-bars.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestionCampanaBarsComponent {
  readonly equipo = input.required<GestionEquipoBarras>();
  /** El modo oscuro usa su propia rampa validada, no un volteo de la clara. */
  readonly oscuro = input(false);

  /**
   * La leyenda sale de las tipificaciones realmente presentes, en orden de desenlace. Se muestra
   * solo el código formateado: el `orden` es gestión interna, no información para el usuario.
   */
  protected readonly leyenda = computed<LeyendaItem[]>(() => {
    const vistos = new Map<string, number>();
    for (const campana of this.equipo().campanas) {
      for (const segmento of campana.segmentos) {
        if (!vistos.has(segmento.codigo)) {
          vistos.set(segmento.codigo, segmento.indiceRampa);
        }
      }
    }
    return [...vistos.entries()]
      .sort((left, right) => left[1] - right[1])
      .map(([codigo, indice]) => ({
        label: formatLabel(codigo),
        color: colorRampa(indice, this.oscuro())
      }));
  });

  protected color(segmento: GestionBarraSegmento): string {
    return colorRampa(segmento.indiceRampa, this.oscuro());
  }

  protected detalle(segmento: GestionBarraSegmento): string {
    const unidad = segmento.cantidad === 1 ? 'Lead' : 'Leads';
    return `${formatLabel(segmento.codigo)}: ${segmento.cantidad} ${unidad} (${segmento.porcentaje.toFixed(2)}%)`;
  }
}
