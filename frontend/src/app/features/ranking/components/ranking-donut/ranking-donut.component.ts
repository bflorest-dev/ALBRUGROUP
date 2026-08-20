import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RankingDonutSegment } from '../../facades/ranking.facade';

type DonutLevel = 'tipi' | 'subtipi';

interface Arc {
  codigo: string;
  d: string;
  color: string;
  labelX: number;
  labelY: number;
  porcentaje: number;
  cantidad: number;
  showLabel: boolean;
}

// Misma paleta que los tags del ranking (ver ranking-view.component.scss), por índice de orden.
const PALETTE: Record<DonutLevel, readonly string[]> = {
  tipi: ['#475569', '#2563eb', '#7c3aed', '#0891b2', '#b45309', '#16a34a', '#db2777', '#dc2626'],
  subtipi: ['#64748b', '#60a5fa', '#a78bfa', '#67e8f9', '#fbbf24', '#86efac', '#f9a8d4', '#fca5a5']
};
const CENTER = 100;
const OUTER = 92;
const INNER = 54;
const LABEL_RADIUS = (OUTER + INNER) / 2;
// Debajo de este barrido el sector es demasiado angosto para un número legible sobre el arco.
const MIN_LABEL_SWEEP_DEG = 12;

@Component({
  selector: 'app-ranking-donut',
  standalone: true,
  imports: [ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ranking-donut.component.html',
  styleUrl: './ranking-donut.component.scss'
})
export class RankingDonutComponent {
  readonly segments = input.required<RankingDonutSegment[]>();
  readonly level = input<DonutLevel>('tipi');
  /** Si los tramos son clicables (drill). Las subtipificaciones no tienen otro nivel. */
  readonly interactive = input(true);
  readonly loading = input(false);
  readonly errorText = input<string | null>(null);
  readonly emptyMessage = input('Aún no hay tipificaciones en este período.');
  readonly showBack = input(false);
  readonly backLabel = input('Volver');

  readonly segmentClick = output<string>();
  readonly back = output<void>();

  protected readonly hovered = signal<string | null>(null);
  protected readonly ringRadius = LABEL_RADIUS;
  protected readonly ringWidth = OUTER - INNER;

  protected readonly total = computed(() =>
    this.segments().reduce((sum, segment) => sum + (segment.cantidad ?? 0), 0)
  );

  protected color(segment: RankingDonutSegment): string {
    if (segment.codigo === 'SIN_TIPIFICAR') return '#94a3b8';
    const palette = PALETTE[this.level()];
    return palette[((segment.colorIndex % palette.length) + palette.length) % palette.length];
  }

  /** Tramos con su path SVG y la posición del número. Un único tramo se dibuja como anillo completo. */
  protected readonly arcs = computed<Arc[]>(() => {
    const segments = this.segments().filter((segment) => (segment.cantidad ?? 0) > 0);
    const total = segments.reduce((sum, segment) => sum + segment.cantidad, 0);
    if (total <= 0) {
      return [];
    }
    if (segments.length === 1) {
      const label = this.polar(LABEL_RADIUS, 0);
      return [{
        codigo: segments[0].codigo,
        d: '',
        color: this.color(segments[0]),
        labelX: label.x,
        labelY: label.y,
        porcentaje: segments[0].porcentaje,
        cantidad: segments[0].cantidad,
        showLabel: true
      }];
    }
    const arcs: Arc[] = [];
    let angle = 0;
    for (const segment of segments) {
      const sweep = (segment.cantidad / total) * 360;
      const label = this.polar(LABEL_RADIUS, angle + sweep / 2);
      arcs.push({
        codigo: segment.codigo,
        d: this.arcPath(angle, angle + sweep),
        color: this.color(segment),
        labelX: label.x,
        labelY: label.y,
        porcentaje: segment.porcentaje,
        cantidad: segment.cantidad,
        showLabel: sweep >= MIN_LABEL_SWEEP_DEG
      });
      angle += sweep;
    }
    return arcs;
  });

  protected readonly isFullRing = computed(() => this.arcs().length === 1 && this.segments().length >= 1);

  /** Texto sobre el sector: porcentaje por defecto; al pasar el mouse, su contador. */
  protected sectorLabel(arc: Arc): string {
    return this.hovered() === arc.codigo ? `${arc.cantidad}` : `${Math.round(arc.porcentaje)}%`;
  }

  protected onSegment(codigo: string): void {
    if (this.interactive() && codigo) {
      this.segmentClick.emit(codigo);
    }
  }

  protected onBack(): void {
    this.back.emit();
  }

  private arcPath(startAngle: number, endAngle: number): string {
    const large = endAngle - startAngle > 180 ? 1 : 0;
    const p1 = this.polar(OUTER, startAngle);
    const p2 = this.polar(OUTER, endAngle);
    const p3 = this.polar(INNER, endAngle);
    const p4 = this.polar(INNER, startAngle);
    return `M ${p1.x} ${p1.y} A ${OUTER} ${OUTER} 0 ${large} 1 ${p2.x} ${p2.y} `
      + `L ${p3.x} ${p3.y} A ${INNER} ${INNER} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
  }

  private polar(radius: number, angleDeg: number): { x: number; y: number } {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: Number((CENTER + radius * Math.cos(rad)).toFixed(2)),
      y: Number((CENTER + radius * Math.sin(rad)).toFixed(2))
    };
  }
}
