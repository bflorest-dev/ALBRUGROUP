import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';

/**
 * Encabezado de seccion (subtitulo) reutilizable para bloques dentro de una pagina.
 *
 * Subtitulo con degradado tonal por rol (misma familia que `app-page-header`, mas chico) +
 * icono de info a la derecha cuya descripcion aparece en un tooltip al hacer hover/foco, para
 * sacar el texto de ayuda del flujo. Slot de acciones opcional (`<ng-content>`).
 */
@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [TooltipModule],
  templateUrl: './section-header.component.html',
  styleUrl: './section-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionHeaderComponent {
  /** Texto del subtitulo. Obligatorio. */
  readonly title = input.required<string>();
  /** Descripcion/ayuda. Opcional: si viene, se muestra en el tooltip del icono de info. */
  readonly description = input<string | null>(null);
}
