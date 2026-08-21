import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { MetricsPeriodo, PeriodSelectorComponent } from '../../../../shared/components/period-selector/period-selector.component';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { CurrentUserTeamScopeService } from '../../../../core/services/current-user-team-scope.service';
import { OperationalGateService } from '../../../../core/services/operational-gate.service';
import { SessionService } from '../../../../core/services/session.service';
import { esEquipoOperativo } from '../../../../shared/utils/equipos-operativos';
import { resolveMetricsRange } from '../../../../shared/utils/metrics-period';
import { GestionCampoTipi } from '../../services/admin-gestion-campana.service';
import { AfluenciaHoraPanelComponent } from '../afluencia-hora-panel/afluencia-hora-panel.component';
import { GestionCampanaPanelComponent } from '../../components/gestion-campana-panel/gestion-campana-panel.component';
import { ResumenDiarioPanelComponent } from '../resumen-diario-panel/resumen-diario-panel.component';
import { AdvisorManagementSummaryPanelComponent } from '../advisor-management-summary-panel/advisor-management-summary-panel.component';
import { TeamMetricGaugesComponent } from '../../components/team-metric-gauges/team-metric-gauges.component';
import { DashboardGaugeCard, resolveGaugeColors } from '../../models/dashboard-gauge.model';
import {
  AdminDailyMetricsService,
  GestionModoMetricas,
  LeadsDiariosMetricasEquipo
} from '../../services/admin-daily-metrics.service';
import { AdminEquipoService } from '../../services/admin-equipo.service';

const SIN_EQUIPO = 'Sin equipo';
type PreventaDashboardView = 'resumen' | 'rendimiento' | 'asesores' | 'campanas' | 'afluencia';

interface DashboardMetricRow {
  idEquipo: number | null;
  equipo: string;
  registros: number; // A
  leadsUnicos: number; // B
  repetidos: number; // C
  porcentaje: number; // E
  leadsRepetidos: number; // D
  tipificados: number; // F
  bloque1: number;
  bloque2: number;
  bloque3: number; // G
  ventaCerrada: number; // H
  cartera: number; // solo GESTIONADOS
  gestionados: number; // solo GESTIONADOS
}

/** DASHBOARD del ADMIN: métricas del día de "Leads del día" desglosadas por equipo. */
@Component({
  selector: 'app-dashboard-preventa-stage',
  imports: [
    FormsModule,
    ButtonModule,
    CardModule,
    MessageModule,
    SelectButtonModule,
    TooltipModule,
    PageHeaderComponent,
    PeriodSelectorComponent,
    SectionHeaderComponent,
    AfluenciaHoraPanelComponent,
    AdvisorManagementSummaryPanelComponent,
    GestionCampanaPanelComponent,
    ResumenDiarioPanelComponent,
    TeamMetricGaugesComponent
  ],
  templateUrl: './dashboard-preventa-stage.component.html',
  styleUrl: './dashboard-preventa-stage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPreventaStageComponent implements OnInit {
  private readonly metricsService = inject(AdminDailyMetricsService);
  private readonly equipoService = inject(AdminEquipoService);
  private readonly teamScope = inject(CurrentUserTeamScopeService);
  private readonly operationalGateService = inject(OperationalGateService);
  private readonly sessionService = inject(SessionService);
  private readonly operationalGate = this.operationalGateService.createGate('dashboard-preventa-stage');

  protected readonly periodo = signal<MetricsPeriodo>('dia');
  /** Día puntual elegido en el segmento "Hoy" (`YYYY-MM-DD`). `null` = hoy. */
  protected readonly dia = signal<string | null>(null);
  // Mismo default que Gestión por campaña: dos controles idénticos en la misma pantalla no pueden
  // arrancar en valores distintos.
  protected readonly campo = signal<GestionCampoTipi>('MAYOR');
  protected readonly modo = signal<GestionModoMetricas>('INGRESADOS');
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly canDisplayOperationalData = this.operationalGate.canDisplayOperationalData;
  protected readonly canMutateOperationalData = this.operationalGate.canMutateOperationalData;
  protected readonly operationalGateMessage = this.operationalGate.blockedMessage;
  protected readonly activeView = signal<PreventaDashboardView>('resumen');
  private readonly raw = signal<LeadsDiariosMetricasEquipo[]>([]);
  private readonly equipos = signal<Array<{ id: number; nombre: string; color?: string | null; activo: boolean }>>([]);
  private readonly equipoNombreById = signal<Map<number, string>>(new Map());
  private readonly equipoColorById = signal<Map<number, string>>(new Map());
  protected readonly selectedEquipoId = signal<number | null>(null);
  protected readonly isTeamScopedDashboard = signal(false);
  private readonly lockedEquipoId = signal<number | null>(null);
  private readonly viewReady = signal(false);
  private loadedAfterGate = false;

  /** "Todos" conserva la comparación lado a lado entre equipos, que es el valor de este bloque. */
  protected readonly equipoOptions = computed(() => [
    { label: 'Todos', value: null as number | null },
    ...this.equipos()
      .filter((equipo) => equipo.activo !== false)
      .filter((equipo) => esEquipoOperativo(equipo.nombre))
      .map((equipo) => ({ label: equipo.nombre, value: equipo.id }))
      .sort((left, right) => left.label.localeCompare(right.label))
  ]);
  protected readonly showEquipoSelector = computed(() => !this.isTeamScopedDashboard());

  protected readonly campoOptions: Array<{ label: string; value: GestionCampoTipi }> = [
    { label: 'Mayor', value: 'MAYOR' },
    { label: 'Primera', value: 'PRIMERA' },
    { label: 'Última', value: 'ULTIMA' }
  ];

  protected readonly modoOptions: Array<{ label: string; value: GestionModoMetricas }> = [
    { label: 'Ingresados', value: 'INGRESADOS' },
    { label: 'Gestionados', value: 'GESTIONADOS' }
  ];
  protected readonly dashboardViewOptions: Array<{ label: string; value: PreventaDashboardView }> = [
    { label: 'Resumen', value: 'resumen' },
    { label: 'Rendimiento', value: 'rendimiento' },
    { label: 'Asesores', value: 'asesores' },
    { label: 'Campañas', value: 'campanas' },
    { label: 'Afluencia', value: 'afluencia' }
  ];

  /**
   * El RESUMEN es un poster por equipo: no admite "Todos". Se muestran solo los equipos, y al entrar
   * a la vista se elige el primero si el ADMIN venía en "Todos".
   */
  protected readonly equipoOptionsResumen = computed(() =>
    this.equipoOptions().filter((opcion) => opcion.value !== null)
  );

  protected readonly rows = computed<DashboardMetricRow[]>(() => {
    const nombres = this.equipoNombreById();
    const selectedEquipoId = this.selectedEquipoId();
    if (this.isTeamScopedDashboard() && selectedEquipoId === null) {
      return [];
    }
    return this.raw()
      .filter((metrica) => selectedEquipoId === null || metrica.idEquipo === selectedEquipoId)
      .map((metrica) => this.toRow(metrica, nombres))
      .sort((left, right) => {
        if (left.equipo === SIN_EQUIPO) return 1;
        if (right.equipo === SIN_EQUIPO) return -1;
        return left.equipo.localeCompare(right.equipo);
      });
  });

  protected readonly total = computed<DashboardMetricRow | null>(() => {
    const rows = this.rows();
    if (!rows.length) {
      return null;
    }
    const acc = rows.reduce(
      (sum, row) => ({
        registros: sum.registros + row.registros,
        leadsUnicos: sum.leadsUnicos + row.leadsUnicos,
        repetidos: sum.repetidos + row.repetidos,
        leadsRepetidos: sum.leadsRepetidos + row.leadsRepetidos,
        tipificados: sum.tipificados + row.tipificados,
        bloque1: sum.bloque1 + row.bloque1,
        bloque2: sum.bloque2 + row.bloque2,
        bloque3: sum.bloque3 + row.bloque3,
        ventaCerrada: sum.ventaCerrada + row.ventaCerrada,
        cartera: sum.cartera + row.cartera,
        gestionados: sum.gestionados + row.gestionados
      }),
      {
        registros: 0, leadsUnicos: 0, repetidos: 0, leadsRepetidos: 0, tipificados: 0,
        bloque1: 0, bloque2: 0, bloque3: 0, ventaCerrada: 0, cartera: 0, gestionados: 0
      }
    );
    return {
      idEquipo: null,
      equipo: 'Total',
      ...acc,
      porcentaje: acc.registros > 0 ? (acc.leadsUnicos / acc.registros) * 100 : 0
    };
  });

  protected readonly gaugeCards = computed<DashboardGaugeCard[]>(() => {
    const rows = this.rows();
    const colorById = this.equipoColorById();
    const cards = rows.map((row) => this.toCard(row, row.idEquipo != null ? colorById.get(row.idEquipo) : null, false));
    const total = this.total();
    if (total && rows.length > 1) {
      cards.push(this.toCard(total, null, true));
    }
    return cards;
  });

  constructor() {
    // El RESUMEN es por equipo (no admite "Todos"): en cuanto la vista está activa y hay equipos,
    // se elige el primero si el ADMIN venía sin equipo. Reactivo, así cubre el default de entrada.
    effect(() => {
      if (this.activeView() !== 'resumen' || this.isTeamScopedDashboard() || this.selectedEquipoId() !== null) {
        return;
      }
      const primerEquipo = this.equipoOptionsResumen()[0]?.value ?? null;
      if (primerEquipo !== null) {
        untracked(() => this.selectedEquipoId.set(primerEquipo));
      }
    });

    effect(() => {
      if (!this.viewReady()) {
        return;
      }
      if (!this.canDisplayOperationalData()) {
        this.loadedAfterGate = false;
        this.clearOperationalData();
        return;
      }
      if (this.loadedAfterGate) {
        return;
      }
      this.loadedAfterGate = true;
      void this.load();
    });
  }

  async ngOnInit(): Promise<void> {
    this.isTeamScopedDashboard.set(this.teamScope.isDashboardTeamScoped());
    this.viewReady.set(true);
  }

  protected async onPeriodoChange(value: MetricsPeriodo): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    if (this.periodo() === value) {
      return;
    }
    this.periodo.set(value);
    // Salir de "día" descarta el día puntual: al volver, el segmento arranca de nuevo en "Hoy".
    if (value !== 'dia') {
      this.dia.set(null);
    }
    await this.load();
  }

  protected async onDiaChange(value: string): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    if (this.dia() === value) {
      return;
    }
    this.dia.set(value);
    this.periodo.set('dia');
    await this.load();
  }

  protected async onCampoChange(value: GestionCampoTipi | null): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    if (!value || this.campo() === value) {
      return;
    }
    this.campo.set(value);
    await this.load();
  }

  protected async onModoChange(value: GestionModoMetricas | null): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    if (!value || this.modo() === value) {
      return;
    }
    this.modo.set(value);
    await this.load();
  }

  /** El equipo solo filtra las tarjetas ya cargadas: no vuelve a pegar al backend. */
  protected onEquipoChange(value: number | null): void {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    if (this.isTeamScopedDashboard()) {
      this.selectedEquipoId.set(this.lockedEquipoId());
      return;
    }
    this.selectedEquipoId.set(value ?? null);
  }

  protected onViewChange(value: PreventaDashboardView | null): void {
    if (value) {
      this.activeView.set(value);
    }
  }

  protected async load(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.clearOperationalData();
      return;
    }
    this.loadedAfterGate = true;
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const rango = resolveMetricsRange(this.periodo(), this.dia());
      const [metricas, equipos] = await Promise.all([
        firstValueFrom(
          this.metricsService.obtenerPorEquipo(rango.desde, rango.hasta, this.campo(), this.modo())
        ),
        firstValueFrom(this.shouldUseVisibleTeamsCatalog() ? this.equipoService.listarMisEquipos() : this.equipoService.listarEquipos())
      ]);
      this.equipos.set(equipos);
      this.equipoNombreById.set(new Map(equipos.map((equipo) => [equipo.id, equipo.nombre])));
      this.equipoColorById.set(
        new Map(equipos.filter((equipo) => equipo.color).map((equipo) => [equipo.id, equipo.color as string]))
      );
      if (this.isTeamScopedDashboard()) {
        const equipoId = this.resolveLockedEquipoId(equipos);
        this.lockedEquipoId.set(equipoId);
        this.selectedEquipoId.set(equipoId);
      }
      this.raw.set(metricas);
    } catch {
      this.errorMessage.set('No se pudieron cargar las métricas del día.');
      this.raw.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private clearOperationalData(): void {
    this.raw.set([]);
    this.equipos.set([]);
    this.equipoNombreById.set(new Map());
    this.equipoColorById.set(new Map());
    this.errorMessage.set('');
    this.isLoading.set(false);
  }

  private shouldUseVisibleTeamsCatalog(): boolean {
    return this.isTeamScopedDashboard() || this.sessionService.getPrimaryRole() === 'COMMUNITY';
  }

  private resolveLockedEquipoId(equipos: Array<{ id: number; nombre: string; activo: boolean }>): number | null {
    const locked = this.lockedEquipoId();
    if (locked !== null) {
      return locked;
    }

    return equipos.find((equipo) => equipo.activo !== false && esEquipoOperativo(equipo.nombre))?.id ?? equipos[0]?.id ?? null;
  }

  private toRow(metrica: LeadsDiariosMetricasEquipo, nombres: Map<number, string>): DashboardMetricRow {
    const equipo =
      metrica.idEquipo == null ? SIN_EQUIPO : nombres.get(metrica.idEquipo) ?? `Equipo ${metrica.idEquipo}`;
    return {
      idEquipo: metrica.idEquipo,
      equipo,
      registros: metrica.registros,
      leadsUnicos: metrica.leadsUnicos,
      repetidos: Math.max(0, metrica.registros - metrica.leadsUnicos),
      porcentaje: metrica.registros > 0 ? (metrica.leadsUnicos / metrica.registros) * 100 : 0,
      leadsRepetidos: metrica.leadsRepetidos,
      tipificados: metrica.leadsTipificados,
      bloque1: metrica.bloqueOrden1,
      bloque2: metrica.bloqueOrden2,
      bloque3: metrica.bloqueOrden3,
      ventaCerrada: metrica.leadsVentaCerrada,
      cartera: metrica.cartera ?? 0,
      gestionados: metrica.gestionados ?? 0
    };
  }

  private toCard(row: DashboardMetricRow, color: string | null | undefined, isTotal: boolean): DashboardGaugeCard {
    const colors = resolveGaugeColors(isTotal ? null : color);
    return {
      key: isTotal ? 'total' : row.idEquipo == null ? 'sin-equipo' : String(row.idEquipo),
      equipo: row.equipo,
      registros: row.registros,
      leadsUnicos: row.leadsUnicos,
      repetidos: row.repetidos,
      leadsRepetidos: row.leadsRepetidos,
      tipificados: row.tipificados,
      bloque1: row.bloque1,
      bloque2: row.bloque2,
      bloque3: row.bloque3,
      ventaCerrada: row.ventaCerrada,
      // Calidad de la base siempre mide la ingesta: no depende del modo.
      pctValidos: row.porcentaje,
      ...this.resolverIndicadores(row),
      from: colors.from,
      to: colors.to,
      isTotal
    };
  }

  /**
   * Gestión y conversión cambian de cohorte según el modo:
   *  - INGRESADOS: sobre los leads que entraron en el período.
   *  - GESTIONADOS: gestión sobre la cartera del período, y conversión sobre lo efectivamente
   *    gestionado (mide efectividad, no cobertura).
   */
  private resolverIndicadores(row: DashboardMetricRow): Pick<
    DashboardGaugeCard,
    'pctGestion' | 'gestionNumerador' | 'gestionDenominador' | 'pctConversion' | 'conversionDenominador' | 'conversionDenominadorLabel'
  > {
    const esGestionados = this.modo() === 'GESTIONADOS';
    const gestionNumerador = esGestionados ? row.gestionados : row.tipificados;
    const gestionDenominador = esGestionados ? row.cartera : row.leadsUnicos;
    const conversionDenominador = esGestionados ? row.gestionados : row.leadsUnicos;
    return {
      gestionNumerador,
      gestionDenominador,
      pctGestion: gestionDenominador > 0 ? (gestionNumerador / gestionDenominador) * 100 : 0,
      conversionDenominador,
      conversionDenominadorLabel: esGestionados ? 'gestionados' : 'únicos',
      pctConversion: conversionDenominador > 0 ? (row.ventaCerrada / conversionDenominador) * 100 : 0
    };
  }

}
