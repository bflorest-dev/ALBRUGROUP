import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { GestionMensualPostventaPanelComponent } from '../../components/gestion-mensual-postventa-panel/gestion-mensual-postventa-panel.component';

/**
 * Sub-tab "Postventa" del Dashboard del ADMIN. A modo de prueba A/B con el admin, esta pantalla usa
 * un tratamiento visual fijo en azul marino (independiente del tema claro/oscuro global): el shell
 * fuerza `data-theme="dark"`, con lo que superficies (--app-*) y colores semánticos del panel adoptan
 * su variante oscura reutilizando el mecanismo de tokens de la app.
 */
@Component({
  selector: 'app-dashboard-postventa-stage',
  imports: [PageHeaderComponent, GestionMensualPostventaPanelComponent],
  templateUrl: './dashboard-postventa-stage.component.html',
  styleUrl: './dashboard-postventa-stage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPostventaStageComponent {}
