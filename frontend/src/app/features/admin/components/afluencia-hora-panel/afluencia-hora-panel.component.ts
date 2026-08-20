import { ChangeDetectionStrategy, Component, OnInit, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { TooltipModule } from 'primeng/tooltip';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { CurrentUserTeamScopeService } from '../../../../core/services/current-user-team-scope.service';
import { MetricsPeriodo } from '../../../../shared/components/period-selector/period-selector.component';
import { AdminAfluenciaHoraFacade } from '../../facades/admin-afluencia-hora.facade';
import { AfluenciaModo } from '../../services/admin-afluencia-hora.service';
import { AfluenciaHoraMatrixComponent } from '../afluencia-hora-matrix/afluencia-hora-matrix.component';

@Component({
  selector: 'app-afluencia-hora-panel',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    MessageModule,
    MultiSelectModule,
    TooltipModule,
    AfluenciaHoraMatrixComponent,
    SectionHeaderComponent
  ],
  providers: [AdminAfluenciaHoraFacade],
  templateUrl: './afluencia-hora-panel.component.html',
  styleUrl: './afluencia-hora-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AfluenciaHoraPanelComponent implements OnInit {
  protected readonly facade = inject(AdminAfluenciaHoraFacade);
  private readonly teamScope = inject(CurrentUserTeamScopeService);

  readonly externalControls = input(false);
  readonly idEquipo = input<number | null>(null);
  readonly teamScoped = input(false);
  readonly periodo = input<MetricsPeriodo | null>(null);
  readonly dia = input<string | null>(null);
  readonly modo = input<AfluenciaModo | null>(null);

  protected readonly showEquipoSelector = signal(true);
  protected readonly showControls = signal(true);

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
      this.facade.lockEquipo(null);
    }
    this.facade.start();
  }
}
