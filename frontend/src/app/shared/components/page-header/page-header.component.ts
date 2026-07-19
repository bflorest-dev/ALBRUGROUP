import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Superficie del encabezado: vidrio esmerilado (default), tarjeta solida o suelto sobre el fondo. */
export type PageHeaderVariant = 'glass' | 'solid' | 'plain';

/**
 * Encabezado de pagina reutilizable para todas las vistas.
 *
 * Estructura fija: eyebrow (contexto/rol) + titulo con degradado tonal por rol +
 * descripcion opcional + slot de acciones (`<ng-content>`). Toma el color de cada
 * rol de las variables `--role-*`, asi que el mismo componente sirve para cualquier
 * panel sin reescribir estilos.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  /** Titulo principal del tab. Es lo unico obligatorio. */
  readonly title = input.required<string>();
  /** Contexto o rol en mayusculas (ej. "Administrador"). Opcional. */
  readonly eyebrow = input<string | null>(null);
  /** Descripcion breve bajo el titulo. Opcional: usarla solo cuando el titulo no basta. */
  readonly description = input<string | null>(null);
  /** Superficie del encabezado. Por defecto vidrio esmerilado. */
  readonly variant = input<PageHeaderVariant>('glass');

  protected readonly isGlass = computed(() => this.variant() === 'glass');
  protected readonly isSolid = computed(() => this.variant() === 'solid');
  protected readonly isPlain = computed(() => this.variant() === 'plain');
}
