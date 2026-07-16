import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

let gaugeSeq = 0;

const CX = 80;
const CY = 88;
const R = 60;
const TRACK_PATH = `M20 ${CY} A${R} ${R} 0 0 1 140 ${CY}`;

/**
 * Medidor semicircular presentacional (SVG). Muestra un porcentaje (0-100) como
 * arco degradado con el valor en el centro. El arco de relleno se calcula por
 * geometría (termina en el ángulo exacto), no con dasharray, para que la punta
 * redondeada empalme siempre con el track sin huecos ni saltos.
 */
@Component({
  selector: 'app-semicircle-gauge',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="gauge">
      <svg viewBox="0 0 160 108" role="img" [attr.aria-label]="label() + ' ' + (clamped() | number: '1.0-1') + '%'">
        <defs>
          <linearGradient [id]="gradientId" gradientUnits="userSpaceOnUse" x1="20" y1="0" x2="140" y2="0">
            <stop offset="0" [attr.stop-color]="from()" />
            <stop offset="1" [attr.stop-color]="to()" />
          </linearGradient>
        </defs>
        <path class="gauge__track" [attr.d]="trackPath" />
        @if (showValue()) {
          <path class="gauge__value" [attr.d]="valuePath()" [attr.stroke]="stroke()" />
        }
        <text x="80" y="82" text-anchor="middle" class="gauge__pct">{{ clamped() | number: '1.0-1' }}%</text>
      </svg>
      <figcaption class="gauge__label">{{ label() }}</figcaption>
    </figure>
  `,
  styles: [
    `
      .gauge {
        margin: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 0;
      }
      .gauge svg {
        width: 100%;
        max-width: 10rem;
        height: auto;
      }
      .gauge__track {
        fill: none;
        stroke: var(--app-border);
        stroke-width: 12;
        stroke-linecap: round;
      }
      .gauge__value {
        fill: none;
        stroke-width: 12;
        stroke-linecap: round;
      }
      .gauge__pct {
        fill: var(--app-text);
        font-size: 26px;
        font-weight: 600;
      }
      .gauge__label {
        margin-top: -0.35rem;
        font-size: 0.8rem;
        color: var(--role-muted);
      }
    `
  ]
})
export class SemicircleGaugeComponent {
  readonly value = input(0);
  readonly label = input('');
  readonly from = input('#85B7EB');
  readonly to = input('#185FA5');

  protected readonly gradientId = `gauge-grad-${++gaugeSeq}`;
  protected readonly trackPath = TRACK_PATH;
  protected readonly clamped = computed(() => Math.max(0, Math.min(100, this.value())));
  protected readonly showValue = computed(() => this.clamped() > 0.5);
  protected readonly stroke = computed(() => `url(#${this.gradientId})`);

  protected readonly valuePath = computed(() => {
    const fraction = this.clamped() / 100;
    const angle = 180 - 180 * fraction;
    const rad = (angle * Math.PI) / 180;
    const x = Math.round((CX + R * Math.cos(rad)) * 100) / 100;
    const y = Math.round((CY - R * Math.sin(rad)) * 100) / 100;
    return `M20 ${CY} A${R} ${R} 0 0 1 ${x} ${y}`;
  });
}
