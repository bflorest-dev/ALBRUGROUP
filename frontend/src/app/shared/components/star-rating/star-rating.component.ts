import { ChangeDetectionStrategy, Component, computed, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Selector de 5 estrellas con MEDIA estrella. El modelo externo es un entero 1..10 (contrato del
 * backend); internamente trabaja en estrellas de 0.5 (score/2), asi 7 = 3.5 estrellas. Cada estrella
 * tiene dos zonas: la izquierda selecciona la media (x.5) y la derecha la estrella completa (x.0).
 *
 * Zoneless + OnPush + signals: el relleno se calcula una vez en un `computed` (array estable) y se
 * enlaza con bindings primitivos (`[style.width.%]`), nunca con objetos nuevos por ciclo.
 */
@Component({
  selector: 'app-star-rating',
  standalone: true,
  templateUrl: './star-rating.component.html',
  styleUrl: './star-rating.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StarRatingComponent),
      multi: true
    }
  ]
})
export class StarRatingComponent implements ControlValueAccessor {
  protected readonly value = signal(0); // 0 = sin calificar, 1..10 = score
  protected readonly hoverValue = signal<number | null>(null);
  protected readonly disabled = signal(false);

  // Valor mostrado (hover tiene prioridad) en escala de estrellas 0..5.
  private readonly displayStars = computed(() => (this.hoverValue() ?? this.value()) / 2);
  // Relleno por estrella: 0 | 50 | 100 (%). Array estable hasta que cambie el valor mostrado.
  protected readonly fills = computed(() =>
    Array.from({ length: 5 }, (_, index) => Math.round(Math.min(Math.max(this.displayStars() - index, 0), 1) * 100))
  );
  // Etiqueta del score sobre 10 para lectura ("7 / 10"). '' cuando no hay calificacion.
  protected readonly scoreLabel = computed(() => {
    const score = this.hoverValue() ?? this.value();
    return score > 0 ? `${score} / 10` : '';
  });

  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: number | null): void {
    this.value.set(typeof value === 'number' && value > 0 ? value : 0);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected hover(score: number): void {
    if (this.disabled()) {
      return;
    }
    this.hoverValue.set(score);
  }

  protected clearHover(): void {
    this.hoverValue.set(null);
  }

  protected pick(score: number): void {
    if (this.disabled()) {
      return;
    }
    this.value.set(score);
    this.onChange(score);
    this.onTouched();
  }
}
