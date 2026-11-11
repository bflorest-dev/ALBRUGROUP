import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  AdminComisionVentaFacade,
  AsesorCorteVM,
  CorteVM,
  Modalidad,
  TotalAsesorVM
} from '../../facades/admin-comision-venta.facade';
import { ComisionVentaAuditDrawerComponent } from '../comision-venta-audit-drawer/comision-venta-audit-drawer.component';

const MODALIDAD_LABELS: Record<Modalidad, string> = {
  PART_TIME: 'Part Time',
  SEMI_FULL: 'Semi Full',
  FULL_TIME: 'Full Time',
  SUPER_FULL: 'Super Full'
};

type TabId = 'totales' | string;

@Component({
  selector: 'app-comision-venta-stage',
  imports: [DecimalPipe, ComisionVentaAuditDrawerComponent],
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
  protected readonly auditContext = this.facade.auditContext;
  protected readonly auditRows = this.facade.auditRows;
  protected readonly auditLoading = this.facade.auditLoading;
  protected readonly auditError = this.facade.auditError;
  protected readonly auditEstado = this.facade.auditEstado;
  protected readonly auditTotalLeads = this.facade.auditTotalLeads;
  protected readonly auditTotalValidas = this.facade.auditTotalValidas;
  protected readonly auditTotalNoValidas = this.facade.auditTotalNoValidas;
  protected readonly auditDesde = this.facade.auditDesde;
  protected readonly auditHasta = this.facade.auditHasta;
  protected readonly auditTotalElements = this.facade.auditTotalElements;
  protected readonly auditPage = this.facade.auditPage;
  protected readonly auditTotalPages = this.facade.auditTotalPages;
  private auditOrigin: HTMLElement | null = null;

  protected readonly activeTab = signal<TabId>('totales');
  protected readonly proveedorActivo = signal<'WIN' | 'CLARO'>('WIN');

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

  protected readonly totalesFiltrados = computed(() => {
    const cortes = this.cortes();
    const proveedor = this.proveedorActivo();
    const map = new Map<number, TotalAsesorVM>();
    for (const c of cortes) {
      const asesores = proveedor === 'WIN' ? c.asesoresWin : c.asesoresClaro;
      for (const a of asesores) {
        const ex = map.get(a.idAsesor);
        if (ex) {
          ex.comisionBruta += a.comisionBruta;
          ex.comisionFinal += a.comisionFinal;
        } else {
          map.set(a.idAsesor, {
            idAsesor: a.idAsesor,
            nombreAsesor: a.nombreAsesor,
            comisionBruta: a.comisionBruta,
            comisionFinal: a.comisionFinal
          });
        }
      }
    }
    return [...map.values()]
      .filter(a => a.comisionFinal > 0)
      .sort((a, b) => b.comisionFinal - a.comisionFinal);
  });

  protected readonly totalGeneral = computed(() =>
    this.totalesFiltrados().reduce((sum, a) => sum + a.comisionFinal, 0)
  );

  ngOnInit(): void {
    this.facade.start();
  }

  protected mesAnterior(): void {
    this.activeTab.set('totales');
    this.facade.mesAnterior();
  }

  protected mesSiguiente(): void {
    this.activeTab.set('totales');
    this.facade.mesSiguiente();
  }
  protected recargar(): void { this.facade.recargar(); }
  protected resetConfig(): void { this.facade.resetConfig(); }

  protected onFechaLimiteCambio(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.facade.setFechaLimiteMorosidad(valor || null);
  }

  protected selectTab(id: TabId): void {
    this.facade.invalidarAuditoria();
    this.activeTab.set(id);
  }

  protected selectProveedor(p: 'WIN' | 'CLARO'): void {
    this.facade.invalidarAuditoria();
    this.proveedorActivo.set(p);
  }

  protected abrirAuditoria(event: Event, corte: CorteVM, asesor: AsesorCorteVM): void {
    this.auditOrigin = event.currentTarget as HTMLElement;
    this.facade.abrirAuditoria(corte, asesor, this.proveedorActivo());
  }

  protected cerrarAuditoria(): void {
    this.facade.cerrarAuditoria();
    const origin = this.auditOrigin;
    this.auditOrigin = null;
    queueMicrotask(() => origin?.focus());
  }

  protected reintentarAuditoria(): void { this.facade.reintentarAuditoria(); }

  protected cambiarEstadoAuditoria(estado: 'TODOS' | 'VALIDAS' | 'NO_VALIDAS'): void {
    this.facade.cambiarEstadoAuditoria(estado);
  }

  protected cambiarPaginaAuditoria(delta: number): void { this.facade.cambiarPaginaAuditoria(delta); }

  protected modalidadLabel(m: Modalidad | null): string {
    return m ? MODALIDAD_LABELS[m] : '—';
  }

  protected formatMinutos(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }
}
