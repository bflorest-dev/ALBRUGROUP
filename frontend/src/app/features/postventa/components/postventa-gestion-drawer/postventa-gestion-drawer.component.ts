import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { SkeletonModule } from 'primeng/skeleton';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { PostventaWorkspaceFacade } from '../../facades/postventa-workspace.facade';
import { EstadoBadge, display, estadoBadge } from '../../models/postventa.vm';
import { PostventaResumenPanelComponent } from '../postventa-resumen-panel/postventa-resumen-panel.component';
import { PostventaPlataformaPanelComponent } from '../postventa-plataforma-panel/postventa-plataforma-panel.component';
import { PostventaFacturacionPanelComponent } from '../postventa-facturacion-panel/postventa-facturacion-panel.component';
import { PostventaEncuestaPanelComponent } from '../postventa-encuesta-panel/postventa-encuesta-panel.component';
import { PostventaHistorialPanelComponent } from '../postventa-historial-panel/postventa-historial-panel.component';
import { PostventaTipificacionBarComponent } from '../postventa-tipificacion-bar/postventa-tipificacion-bar.component';

/** Espacio de trabajo de gestion de un lead: drawer lateral con secciones (tabs) y la barra de
 *  tipificacion fija al pie. Orquesta los paneles, todos sobre el mismo facade. */
@Component({
  selector: 'app-postventa-gestion-drawer',
  imports: [
    DrawerModule,
    SkeletonModule,
    TabsModule,
    TagModule,
    PostventaResumenPanelComponent,
    PostventaPlataformaPanelComponent,
    PostventaFacturacionPanelComponent,
    PostventaEncuestaPanelComponent,
    PostventaHistorialPanelComponent,
    PostventaTipificacionBarComponent
  ],
  templateUrl: './postventa-gestion-drawer.component.html',
  styleUrl: './postventa-gestion-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostventaGestionDrawerComponent {
  protected readonly facade = inject(PostventaWorkspaceFacade);
  protected readonly activeTab = signal('resumen');
  protected readonly skeletonRows = Array.from({ length: 6 });
  private handledLeadId = -1;

  constructor() {
    // Cada lead nuevo abre en la pestana Resumen.
    effect(() => {
      const lead = this.facade.selectedLead();
      if (!lead || lead.idLead === this.handledLeadId) {
        return;
      }
      this.handledLeadId = lead.idLead;
      this.activeTab.set('resumen');
    });
  }

  protected badge(value: unknown): EstadoBadge {
    return estadoBadge(value);
  }

  protected display(value: unknown): string {
    return display(value);
  }

  protected onVisibleChange(visible: boolean): void {
    if (!visible) {
      // El facade decide: si hubo cambios sin tipificar, no cierra y avisa.
      this.facade.requestCloseDrawer();
    }
  }
}
