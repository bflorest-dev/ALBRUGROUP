import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { GestionMensualPostventaPanelComponent } from '../../components/gestion-mensual-postventa-panel/gestion-mensual-postventa-panel.component';
import { GestionCohortePostventaPanelComponent } from '../../components/gestion-cohorte-postventa-panel/gestion-cohorte-postventa-panel.component';
import { AdminGestionMensualFacade } from '../../facades/admin-gestion-mensual.facade';
import { AdminGestionCohorteFacade } from '../../facades/admin-gestion-cohorte.facade';

/**
 * Sub-tab "Postventa" del Dashboard del ADMIN. A modo de prueba A/B con el admin, esta pantalla usa
 * un tratamiento visual fijo en azul marino (independiente del tema claro/oscuro global): el shell
 * fuerza `data-theme="dark"`, con lo que superficies (--app-*) y colores semánticos del panel adoptan
 * su variante oscura reutilizando el mecanismo de tokens de la app.
 */
@Component({
  selector: 'app-dashboard-postventa-stage',
  imports: [GestionMensualPostventaPanelComponent, GestionCohortePostventaPanelComponent],
  providers: [AdminGestionMensualFacade, AdminGestionCohorteFacade],
  templateUrl: './dashboard-postventa-stage.component.html',
  styleUrl: './dashboard-postventa-stage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPostventaStageComponent {
  protected readonly mode = signal<'mensual' | 'cohorte'>('mensual');
  protected readonly mensualFacade = inject(AdminGestionMensualFacade);
  protected readonly cohorteFacade = inject(AdminGestionCohorteFacade);

  protected readonly mesLabel = computed(() => this.mode() === 'mensual'
    ? this.mensualFacade.mesLabel()
    : this.cohorteFacade.mesLabel());
  protected readonly periodoLabel = computed(() => this.mode() === 'mensual' ? 'Gestión' : 'Cohorte');
  protected readonly proveedor = computed(() => this.mode() === 'mensual'
    ? this.mensualFacade.proveedor()
    : this.cohorteFacade.proveedor());
  protected readonly isLoading = computed(() => this.mode() === 'mensual'
    ? this.mensualFacade.isLoading()
    : this.cohorteFacade.isLoading());
  protected readonly canGoNext = computed(() => this.mode() === 'mensual'
    ? this.mensualFacade.canGoNext()
    : this.cohorteFacade.canGoNext());

  protected mesAnterior(): void {
    this.mode() === 'mensual' ? this.mensualFacade.mesAnterior() : this.cohorteFacade.mesAnterior();
  }

  protected mesSiguiente(): void {
    this.mode() === 'mensual' ? this.mensualFacade.mesSiguiente() : this.cohorteFacade.mesSiguiente();
  }

}
