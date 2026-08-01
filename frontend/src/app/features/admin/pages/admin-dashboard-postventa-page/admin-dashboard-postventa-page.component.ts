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
  selector: 'app-admin-dashboard-postventa-page',
  imports: [PageHeaderComponent, GestionMensualPostventaPanelComponent],
  templateUrl: './admin-dashboard-postventa-page.component.html',
  styleUrl: './admin-dashboard-postventa-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardPostventaPageComponent {}
