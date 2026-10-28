import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
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

type TabId = 'totales' | string;

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
  protected readonly fechaLimiteMorosidad = this.facade.fechaLimiteMorosidad;

  protected readonly activeTab = signal<TabId>('totales');

  protected readonly tabs = computed(() => {
    const result: { id: TabId; label: string }[] = [
      { id: 'totales', label: 'Comisiones' }
    ];
    for (const c of this.cortes()) {
      result.push({ id: c.etiqueta, label: c.etiqueta });
    }
    return result;
  });

  protected readonly activeCorte = computed(() => {
    const id = this.activeTab();
    if (id === 'totales') return null;
    return this.cortes().find(c => c.etiqueta === id) ?? null;
  });

  protected readonly totalGeneral = computed(() => {
    const t = this.totales();
    return t.reduce((sum, a) => sum + a.comisionFinal, 0);
  });

  protected readonly totalesFiltrados = computed(() =>
    this.totales().filter(a => a.comisionFinal > 0)
  );

  ngOnInit(): void {
    this.facade.start();
  }

  protected mesAnterior(): void { this.facade.mesAnterior(); }
  protected mesSiguiente(): void { this.facade.mesSiguiente(); }
  protected recargar(): void { this.facade.recargar(); }
  protected resetConfig(): void { this.facade.resetConfig(); }

  protected onFechaLimiteCambio(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.facade.setFechaLimiteMorosidad(valor || null);
  }

  protected selectTab(id: TabId): void { this.activeTab.set(id); }

  protected modalidadLabel(m: Modalidad | null): string {
    return m ? MODALIDAD_LABELS[m] : '—';
  }

  protected formatMinutos(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }
}
