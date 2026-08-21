import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MessageModule } from 'primeng/message';
import { MetricsPeriodo } from '../../../../shared/components/period-selector/period-selector.component';
import { GestionCampoTipi, GestionModo } from '../../services/admin-gestion-campana.service';
import { ResumenDiarioFacade } from '../../facades/resumen-diario.facade';

/**
 * Panel RESUMEN DIARIO del DASHBOARD de PREVENTA: las 4 tablas del reporte diario como un poster
 * capturable, para un equipo. Provee su propio facade (bloque autónomo) y proyecta los controles
 * compartidos del dashboard por `ng-content`.
 */
@Component({
  selector: 'app-resumen-diario-panel',
  imports: [DecimalPipe, MessageModule],
  providers: [ResumenDiarioFacade],
  templateUrl: './resumen-diario-panel.component.html',
  styleUrl: './resumen-diario-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResumenDiarioPanelComponent implements OnInit {
  protected readonly facade = inject(ResumenDiarioFacade);

  readonly externalControls = input(false);
  readonly idEquipo = input<number | null>(null);
  readonly teamScoped = input(false);
  readonly periodo = input<MetricsPeriodo | null>(null);
  readonly dia = input<string | null>(null);
  readonly modo = input<GestionModo | null>(null);
  readonly campo = input<GestionCampoTipi | null>(null);

  private static readonly MESES = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
  ];

  protected readonly modoLabel = computed(() =>
    this.modo() === 'INGRESADOS' ? 'Ingresados' : 'Gestionados'
  );

  protected readonly campoLabel = computed(() => {
    switch (this.campo()) {
      case 'PRIMERA':
        return 'Primera';
      case 'ULTIMA':
        return 'Última';
      default:
        return 'Mayor';
    }
  });

  protected readonly fechaLabel = computed(() => {
    const periodo = this.periodo();
    if (periodo === 'semana') {
      return 'Semana operativa';
    }
    if (periodo === 'mes') {
      return 'Mes en curso';
    }
    const dia = this.dia();
    if (!dia) {
      return 'Hoy';
    }
    const [anio, mes, dd] = dia.split('-').map((parte) => Number(parte));
    if (!anio || !mes || !dd) {
      return dia;
    }
    return `${dd} ${ResumenDiarioPanelComponent.MESES[mes - 1]} ${anio}`;
  });

  constructor() {
    effect(() => {
      if (!this.externalControls()) {
        return;
      }
      this.facade.setIdEquipo(this.idEquipo());
      this.facade.setModo(this.modo());
      this.facade.setCampo(this.campo());
      this.facade.setPeriodo(this.periodo());
      const dia = this.dia();
      if (dia) {
        this.facade.setDia(dia);
      }
    });
  }

  ngOnInit(): void {
    this.facade.setIdEquipo(this.idEquipo());
    if (this.modo()) {
      this.facade.setModo(this.modo());
    }
    if (this.campo()) {
      this.facade.setCampo(this.campo());
    }
    if (this.periodo()) {
      this.facade.setPeriodo(this.periodo());
    }
    const dia = this.dia();
    if (dia) {
      this.facade.setDia(dia);
    }
    this.facade.start();
  }
}
