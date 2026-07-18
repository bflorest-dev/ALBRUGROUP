import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { formatLabel } from '../../utils/display-label';

export type TipificationPaletteByCode = Record<string, number>;

@Component({
  selector: 'app-tipification-stack',
  standalone: true,
  imports: [TagModule],
  templateUrl: './tipification-stack.component.html',
  styleUrl: './tipification-stack.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TipificationStackComponent {
  readonly codigoTipificacion = input<string | null | undefined>(null);
  readonly codigoSubtipificacion = input<string | null | undefined>(null);
  readonly paletteByCode = input<TipificationPaletteByCode>({});
  readonly emptyText = input('Sin tipificacion');

  protected readonly tipificacionLabel = computed(() => this.formatCode(this.codigoTipificacion()));
  protected readonly subtipificacionLabel = computed(() => this.formatCode(this.codigoSubtipificacion()));
  protected readonly hasTipificacion = computed(() => this.hasValue(this.codigoTipificacion()));
  protected readonly hasSubtipificacion = computed(() => this.hasValue(this.codigoSubtipificacion()));
  protected readonly hasAnyValue = computed(() => this.hasTipificacion() || this.hasSubtipificacion());
  protected readonly tipificacionClass = computed(() =>
    this.tagClass(this.codigoTipificacion(), 'tipificacion', this.isDangerTipification())
  );
  protected readonly subtipificacionClass = computed(() =>
    this.tagClass(this.codigoTipificacion(), 'subtipificacion', this.isDangerTipification())
  );

  private tagClass(
    codigo: string | null | undefined,
    kind: 'tipificacion' | 'subtipificacion',
    danger = false
  ): string {
    const base = 'tipification-stack__tag';
    if (danger) {
      return `${base} ${base}--danger ${base}--${kind}`;
    }
    const normalized = this.normalizeCode(codigo);
    const paletteIndex = normalized ? this.paletteByCode()[normalized] ?? this.hashPalette(normalized) : undefined;
    const tone = paletteIndex === undefined ? 'neutral' : `palette-${paletteIndex}`;
    return `${base} ${base}--${tone} ${base}--${kind}`;
  }

  private isProgramacionCancelada(): boolean {
    return this.normalizeCode(this.codigoTipificacion()) === 'PROGRAMADO'
      && this.normalizeCode(this.codigoSubtipificacion()) === 'PROGRAMACION_CANCELADA';
  }

  private isPreventaDesaprobada(): boolean {
    const subtipificacion = this.normalizeCode(this.codigoSubtipificacion());
    return this.normalizeCode(this.codigoTipificacion()) === 'PREVENTA'
      && (subtipificacion === 'DESAPROBADA' || subtipificacion === 'DESAPROBADO');
  }

  private isDangerTipification(): boolean {
    return this.isProgramacionCancelada() || this.isPreventaDesaprobada();
  }

  private formatCode(value: string | null | undefined): string {
    return this.hasValue(value) ? formatLabel(String(value)) : '-';
  }

  private hasValue(value: string | null | undefined): boolean {
    return !!value?.trim();
  }

  private normalizeCode(value: string | null | undefined): string {
    return value?.trim().toUpperCase() ?? '';
  }

  private hashPalette(value: string): number {
    const totalPalettes = 8;
    let hash = 0;
    for (let index = 0; index < value.length; index++) {
      hash = (hash * 31 + value.charCodeAt(index)) | 0;
    }
    return Math.abs(hash) % totalPalettes;
  }
}
