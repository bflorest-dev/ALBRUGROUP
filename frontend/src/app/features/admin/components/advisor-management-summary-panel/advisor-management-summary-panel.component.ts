import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MetricsPeriodo } from '../../../../shared/components/period-selector/period-selector.component';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { localToday, resolveMetricsRange } from '../../../../shared/utils/metrics-period';
import { GestionCampoTipi } from '../../services/admin-gestion-campana.service';
import { GestionModoMetricas } from '../../services/admin-daily-metrics.service';
import { RankingDonutComponent } from '../../../ranking/components/ranking-donut/ranking-donut.component';
import { RankingFacade } from '../../../ranking/facades/ranking.facade';

const EMPTY_TEAM_ID = Number.MAX_SAFE_INTEGER;

@Component({
  selector: 'app-advisor-management-summary-panel',
  standalone: true,
  imports: [
    UpperCasePipe,
    ButtonModule,
    MessageModule,
    ProgressSpinnerModule,
    TagModule,
    TooltipModule,
    SectionHeaderComponent,
    RankingDonutComponent
  ],
  providers: [RankingFacade],
  templateUrl: './advisor-management-summary-panel.component.html',
  styleUrl: './advisor-management-summary-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdvisorManagementSummaryPanelComponent implements OnInit {
  readonly idEquipo = input<number | null>(null);
  readonly teamScoped = input(false);
  readonly periodo = input.required<MetricsPeriodo>();
  readonly dia = input<string | null>(null);
  readonly modo = input.required<GestionModoMetricas>();
  readonly campo = input.required<GestionCampoTipi>();

  protected readonly facade = inject(RankingFacade);

  protected readonly missingTeam = computed(() => this.teamScoped() && this.idEquipo() === null);
  protected readonly block = computed(() => this.facade.rankingBlocks()[0] ?? null);

  constructor() {
    effect(() => {
      this.facade.setModo(this.modo());
      this.facade.setCampo(this.campo());
      this.facade.setFixedTeamId(this.missingTeam() ? EMPTY_TEAM_ID : this.idEquipo());
      const range = resolveMetricsRange(this.periodo(), this.dia());
      const desde = range.desde ?? localToday();
      const hasta = range.hasta ?? localToday();
      this.facade.setRange(desde, hasta);
    });
  }

  ngOnInit(): void {
    this.facade.start();
  }

  protected refresh(): void {
    this.facade.refresh(true);
  }

  protected shortAdvisorName(value: string | null): string {
    const raw = this.facade.display(value).trim();
    if (raw === '-') {
      return raw;
    }
    return raw.split(/\s+/).slice(0, 2).join(' ');
  }
}
