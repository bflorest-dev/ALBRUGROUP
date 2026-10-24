import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MessageModule } from 'primeng/message';
import { AdminGestionMensualFacade } from '../../facades/admin-gestion-mensual.facade';

/**
 * Panel "Gestión del mes" (POSTVENTA WIN) del DASHBOARD del ADMIN. Tabla mensual por corte/recibo con
 * conteos por estado (pagados / impagos / bajas) y porcentajes autocalculados en el front. El mes se
 * navega con el stepper; el vigente lo resuelve el backend por la regla del día 15. Provee su propio
 * facade (bloque autónomo del dashboard).
 */
@Component({
  selector: 'app-gestion-mensual-postventa-panel',
  imports: [DecimalPipe, MessageModule],
  templateUrl: './gestion-mensual-postventa-panel.component.html',
  styleUrl: './gestion-mensual-postventa-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestionMensualPostventaPanelComponent implements OnInit {
  protected readonly facade = inject(AdminGestionMensualFacade);

  ngOnInit(): void {
    this.facade.start();
  }
}
