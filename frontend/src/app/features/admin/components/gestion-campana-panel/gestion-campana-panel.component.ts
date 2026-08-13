import { ChangeDetectionStrategy, Component, OnInit, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { PeriodSelectorComponent } from '../../../../shared/components/period-selector/period-selector.component';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { CurrentUserTeamScopeService } from '../../../../core/services/current-user-team-scope.service';
import { MetricsPeriodo } from '../../../../shared/components/period-selector/period-selector.component';
import { AdminGestionCampanaFacade } from '../../facades/admin-gestion-campana.facade';
import { GestionCampoTipi, GestionModo } from '../../services/admin-gestion-campana.service';
import { GestionCampanaBarsComponent } from '../gestion-campana-bars/gestion-campana-bars.component';
import { GestionCampanaMatrixComponent } from '../gestion-campana-matrix/gestion-campana-matrix.component';
import { GestionCampanaScatterComponent } from '../gestion-campana-scatter/gestion-campana-scatter.component';

/** Formas de mirar los mismos datos. No es un filtro: no cambia la consulta, cambia el diagrama. */
type VistaGestion = 'barras' | 'matriz' | 'efectividad';

/**
 * Panel "Gestión por campaña" del DASHBOARD del ADMIN. Matriz tipificación × campaña, una por equipo,
 * con toggle de campo (primera/última/mayor) y período (hoy/mes/personalizado). Provee su propio
 * facade (bloque autónomo del dashboard).
 */
@Component({
  selector: 'app-gestion-campana-panel',
  imports: [
    FormsModule,
    ButtonModule,
    MessageModule,
    MultiSelectModule,
    SelectButtonModule,
    TooltipModule,
    GestionCampanaBarsComponent,
    GestionCampanaMatrixComponent,
    GestionCampanaScatterComponent,
    PeriodSelectorComponent,
    SectionHeaderComponent
  ],
  providers: [AdminGestionCampanaFacade],
  templateUrl: './gestion-campana-panel.component.html',
  styleUrl: './gestion-campana-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestionCampanaPanelComponent implements OnInit {
  protected readonly facade = inject(AdminGestionCampanaFacade);
  private readonly teamScope = inject(CurrentUserTeamScopeService);

  readonly externalControls = input(false);
  readonly idEquipo = input<number | null>(null);
  readonly teamScoped = input(false);
  readonly periodo = input<MetricsPeriodo | null>(null);
  readonly dia = input<string | null>(null);
  readonly modo = input<GestionModo | null>(null);
  readonly campo = input<GestionCampoTipi | null>(null);

  protected readonly vista = signal<VistaGestion>('barras');
  protected readonly showEquipoSelector = signal(true);
  protected readonly showControls = signal(true);
  protected readonly vistaOptions: Array<{ label: string; value: VistaGestion }> = [
    { label: 'Barras', value: 'barras' },
    { label: 'Matriz', value: 'matriz' },
    { label: 'Efectividad', value: 'efectividad' }
  ];

  constructor() {
    effect(() => {
      if (!this.externalControls()) {
        return;
      }
      this.showControls.set(false);
      this.showEquipoSelector.set(false);
      if (this.teamScoped()) {
        this.facade.lockEquipo(this.idEquipo());
      } else {
        this.facade.setSelectedEquipoId(this.idEquipo());
      }
      this.facade.setModo(this.modo());
      this.facade.setCampo(this.campo());
      this.facade.setPeriodo(this.periodo());
      const dia = this.dia();
      if (dia) {
        this.facade.setDia(dia);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    if (this.externalControls()) {
      this.showControls.set(false);
      this.showEquipoSelector.set(false);
      this.facade.start();
      return;
    }
    const isTeamScoped = this.teamScope.isDashboardTeamScoped();
    this.showEquipoSelector.set(!isTeamScoped);
    if (isTeamScoped) {
      this.facade.lockEquipo(await this.teamScope.getPrimaryEquipoId());
    }
    this.facade.start();
  }

  protected onVistaChange(value: VistaGestion | null): void {
    if (value) {
      this.vista.set(value);
    }
  }
}
