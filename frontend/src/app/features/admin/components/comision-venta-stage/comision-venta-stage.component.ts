import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  AdminComisionVentaFacade,
  AsesorCorteVM,
  CorteVM,
  Modalidad,
  TotalAsesorVM
} from '../../facades/admin-comision-venta.facade';

const MODALIDAD_LABELS: Record<Modalidad, string> = {
  PART_TIME: 'Part Time',
  SEMI_FULL: 'Semi Full',
  FULL_TIME: 'Full Time',
  SUPER_FULL: 'Super Full'
};

@Component({
  selector: 'app-comision-venta-stage',
  imports: [DecimalPipe],
  providers: [AdminComisionVentaFacade],
  templateUrl: './comision-venta-stage.component.html',
  styleUrl: './comision-venta-stage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComisionVentaStageComponent implements OnInit {
  protected readonly facade = inject(AdminComisionVentaFacade);

  protected readonly cortes = this.facade.cortes;
  protected readonly totales = this.facade.totales;
  protected readonly isLoading = this.facade.isLoading;
  protected readonly mesLabel = this.facade.mesLabel;
  protected readonly canGoNext = this.facade.canGoNext;
  protected readonly errorMessage = this.facade.errorMessage;
  protected readonly config = this.facade.config;

  protected readonly totalGeneral = computed(() => {
    const t = this.totales();
    return t.reduce((sum, a) => sum + a.comisionFinal, 0);
  });

  ngOnInit(): void {
    this.facade.start();
  }

  protected mesAnterior(): void { this.facade.mesAnterior(); }
  protected mesSiguiente(): void { this.facade.mesSiguiente(); }
  protected recargar(): void { this.facade.recargar(); }
  protected resetConfig(): void { this.facade.resetConfig(); }

  protected modalidadLabel(m: Modalidad | null): string {
    return m ? MODALIDAD_LABELS[m] : '—';
  }

  protected formatMinutos(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }
}
