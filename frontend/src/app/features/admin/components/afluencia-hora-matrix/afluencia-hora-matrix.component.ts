import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { AfluenciaEquipoMatriz, AfluenciaHoraCelda } from '../../facades/admin-afluencia-hora.facade';
import { celdaConTintaClara, colorCelda } from '../../models/tipificacion-ramp';

const CORTES = [10, 25, 40, 60, 80];

@Component({
  selector: 'app-afluencia-hora-matrix',
  standalone: true,
  imports: [TableModule, TooltipModule],
  templateUrl: './afluencia-hora-matrix.component.html',
  styleUrl: './afluencia-hora-matrix.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AfluenciaHoraMatrixComponent {
  readonly matriz = input.required<AfluenciaEquipoMatriz>();
  readonly oscuro = input(false);

  protected readonly totalesPorCampana = computed(() => {
    const m = this.matriz();
    return m.campanas.map((_, ci) => {
      let total = 0;
      let unicos = 0;
      for (const fila of m.filas) {
        total += fila.celdas[ci].total;
        unicos += fila.celdas[ci].unicos;
      }
      return { total, unicos, repetidos: Math.max(0, total - unicos) };
    });
  });

  protected fondo(celda: AfluenciaHoraCelda): string {
    return colorCelda(this.paso(celda.total), this.oscuro());
  }

  protected tintaClara(celda: AfluenciaHoraCelda): boolean {
    return celdaConTintaClara(this.paso(celda.total), this.oscuro());
  }

  protected tooltipCelda(celda: AfluenciaHoraCelda): string {
    return `${celda.unicos} únicos / ${celda.repetidos} repetidos`;
  }

  private paso(total: number): number {
    if (total <= 0) {
      return -1;
    }
    const maxTotal = this.matriz().maxCeldaTotal;
    if (maxTotal <= 0) {
      return 0;
    }
    const porcentaje = (total / maxTotal) * 100;
    const indice = CORTES.findIndex((corte) => porcentaje <= corte);
    return indice === -1 ? CORTES.length : indice;
  }
}
