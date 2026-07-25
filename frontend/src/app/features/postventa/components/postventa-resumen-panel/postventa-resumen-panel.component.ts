import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { PostventaWorkspaceFacade } from '../../facades/postventa-workspace.facade';
import { providerLogo } from '../../../../shared/utils/provider-logo';
import { EstadoBadge, display, estadoBadge } from '../../models/postventa.vm';

/** Datos del cliente y semaforos del lead abierto. Solo lectura. */
@Component({
  selector: 'app-postventa-resumen-panel',
  imports: [DatePipe, TagModule],
  templateUrl: './postventa-resumen-panel.component.html',
  styleUrl: './postventa-resumen-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostventaResumenPanelComponent {
  protected readonly facade = inject(PostventaWorkspaceFacade);

  protected badge(value: unknown): EstadoBadge {
    return estadoBadge(value);
  }

  protected display(value: unknown): string {
    return display(value);
  }

  protected providerLogo(nombre?: string | null): string | null {
    return providerLogo(nombre);
  }
}
