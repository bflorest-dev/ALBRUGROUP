import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';

export interface TipificacionPorHoraSegmentoVista {
  codigoTipificacion: string;
  label: string;
  orden: number | null;
  cantidad: number;
  porcentaje: number;
  color: string;
  tooltip: string;
}

export interface TipificacionesPorHoraFilaVista {
  hora: number;
  horaLabel: string;
  total: number;
  ariaLabel: string;
  tipificaciones: TipificacionPorHoraSegmentoVista[];
}

@Component({
  selector: 'app-resumen-tipificaciones-hora-dialog',
  imports: [ButtonModule, DialogModule, MessageModule, SkeletonModule, TooltipModule],
  templateUrl: './resumen-tipificaciones-hora-dialog.component.html',
  styleUrl: './resumen-tipificaciones-hora-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResumenTipificacionesHoraDialogComponent {
  readonly visible = input(false);
  readonly loading = input(false);
  readonly error = input(false);
  readonly equipo = input('Todos los equipos');
  readonly fecha = input('Hoy');
  readonly filas = input<TipificacionesPorHoraFilaVista[]>([]);

  readonly visibleChange = output<boolean>();
  readonly retry = output<void>();

  protected readonly dialogStyle = {
    width: 'min(980px, calc(100vw - 2rem))',
    maxWidth: 'calc(100vw - 2rem)'
  };

  protected readonly legend = computed(() => {
    const seen = new Map<string, TipificacionPorHoraSegmentoVista>();
    for (const fila of this.filas()) {
      for (const segmento of fila.tipificaciones) {
        if (!seen.has(segmento.codigoTipificacion)) {
          seen.set(segmento.codigoTipificacion, segmento);
        }
      }
    }
    return [...seen.values()].sort((a, b) => {
      const ordenA = a.orden ?? Number.MAX_SAFE_INTEGER;
      const ordenB = b.orden ?? Number.MAX_SAFE_INTEGER;
      return ordenA - ordenB || a.label.localeCompare(b.label);
    });
  });

  protected readonly skeletonRows = [0, 1, 2, 3];
}
