import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { GestionEquipoDispersion, GestionPuntoCampana } from '../../facades/admin-gestion-campana.facade';

/** Geometría del lienzo. Fija: el SVG escala con el contenedor vía viewBox. */
const ANCHO = 680;
const ALTO = 320;
const MARGEN = { izq: 52, der: 18, arriba: 18, abajo: 44 };

const PLOT_ANCHO = ANCHO - MARGEN.izq - MARGEN.der;
const PLOT_ALTO = ALTO - MARGEN.arriba - MARGEN.abajo;

/** Cuántas campañas se etiquetan directamente; el resto queda en el tooltip para no chocar. */
const ETIQUETAS_DIRECTAS = 3;

/** Separación mínima entre etiquetas colocadas, para que no se pisen entre sí. */
const SEPARACION_ETIQUETA = { x: 78, y: 18 };

interface PuntoUbicado extends GestionPuntoCampana {
  cx: number;
  cy: number;
  etiquetar: boolean;
  detalle: string;
}

interface Marca {
  valor: number;
  pos: number;
  texto: string;
}

/**
 * Dispersión de efectividad: cada campaña situada por volumen gestionado (eje X) y tasa de preventa
 * (eje Y), con la tasa global del equipo como línea de referencia.
 *
 * Responde lo que ni la tabla ni las barras contestan: si una campaña **convierte**. Ordenar por
 * tasa sola mentiría — una campaña de 1 lead con 1 preventa daría 100% —, así que el volumen se
 * muestra como eje y las campañas de bajo volumen se atenúan: siguen visibles, pero no compiten.
 */
@Component({
  selector: 'app-gestion-campana-scatter',
  standalone: true,
  imports: [TooltipModule],
  templateUrl: './gestion-campana-scatter.component.html',
  styleUrl: './gestion-campana-scatter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestionCampanaScatterComponent {
  readonly equipo = input.required<GestionEquipoDispersion>();

  protected readonly ancho = ANCHO;
  protected readonly alto = ALTO;
  protected readonly margen = MARGEN;
  protected readonly plotAlto = PLOT_ALTO;
  protected readonly plotAncho = PLOT_ANCHO;

  /** Cotas redondeadas hacia arriba: los ejes no deben terminar justo en el dato extremo. */
  private readonly maxX = computed(() => {
    const mayor = Math.max(1, ...this.equipo().puntos.map((punto) => punto.total));
    return this.redondearArriba(mayor);
  });

  private readonly maxY = computed(() => {
    const mayor = Math.max(...this.equipo().puntos.map((punto) => punto.tasa), this.equipo().tasaEquipo, 5);
    return this.redondearArriba(mayor);
  });

  /**
   * Sitúa los puntos y decide cuáles llevan etiqueta directa. Los candidatos van de mayor a menor
   * volumen, pero una etiqueta solo se coloca si no pisa a otra ya puesta: dos campañas con volumen
   * y tasa parecidos caen casi encima y sus nombres se solaparían. Las que no se etiquetan siguen
   * siendo legibles por tooltip.
   */
  protected readonly puntos = computed<PuntoUbicado[]>(() => {
    const candidatos = this.equipo()
      .puntos.filter((punto) => !punto.bajoVolumen)
      .slice(0, ETIQUETAS_DIRECTAS)
      .map((punto) => punto.key);

    const colocadas: Array<{ x: number; y: number }> = [];

    return this.equipo().puntos.map((punto) => {
      const cx = MARGEN.izq + (punto.total / this.maxX()) * PLOT_ANCHO;
      const cy = MARGEN.arriba + (1 - punto.tasa / this.maxY()) * PLOT_ALTO;
      const libre = !colocadas.some(
        (puesta) =>
          Math.abs(puesta.x - cx) < SEPARACION_ETIQUETA.x && Math.abs(puesta.y - cy) < SEPARACION_ETIQUETA.y
      );
      const etiquetar = candidatos.includes(punto.key) && libre;
      if (etiquetar) {
        colocadas.push({ x: cx, y: cy });
      }
      return { ...punto, cx, cy, etiquetar, detalle: this.detalle(punto) };
    });
  });

  /** Y de la línea de referencia (tasa global del equipo). */
  protected readonly yReferencia = computed(
    () => MARGEN.arriba + (1 - this.equipo().tasaEquipo / this.maxY()) * PLOT_ALTO
  );

  protected readonly marcasX = computed<Marca[]>(() =>
    this.marcas(this.maxX()).map((valor) => ({
      valor,
      pos: MARGEN.izq + (valor / this.maxX()) * PLOT_ANCHO,
      texto: `${valor}`
    }))
  );

  protected readonly marcasY = computed<Marca[]>(() =>
    this.marcas(this.maxY()).map((valor) => ({
      valor,
      pos: MARGEN.arriba + (1 - valor / this.maxY()) * PLOT_ALTO,
      texto: `${valor}%`
    }))
  );

  protected readonly textoReferencia = computed(
    () => `Promedio del equipo ${this.equipo().tasaEquipo.toFixed(2)}%`
  );

  protected readonly hayBajoVolumen = computed(() => this.equipo().puntos.some((punto) => punto.bajoVolumen));

  private detalle(punto: GestionPuntoCampana): string {
    const unidad = punto.total === 1 ? 'Lead' : 'Leads';
    return `${punto.nombre}: ${punto.total} ${unidad} · ${punto.preventas} preventa${
      punto.preventas === 1 ? '' : 's'
    } (${punto.tasa.toFixed(2)}%)`;
  }

  private marcas(max: number): number[] {
    return [0, 0.25, 0.5, 0.75, 1].map((fraccion) => Math.round(max * fraccion));
  }

  /** Redondea a un tope "limpio" para que las marcas del eje caigan en cifras legibles. */
  private redondearArriba(valor: number): number {
    const magnitud = Math.pow(10, Math.floor(Math.log10(Math.max(valor, 1))));
    return Math.ceil(valor / magnitud) * magnitud;
  }
}
