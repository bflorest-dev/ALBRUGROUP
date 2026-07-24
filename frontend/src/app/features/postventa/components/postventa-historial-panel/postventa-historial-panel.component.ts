import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TableModule } from 'primeng/table';
import { PostventaWorkspaceFacade } from '../../facades/postventa-workspace.facade';
import { display } from '../../models/postventa.vm';

/** Historial de gestiones (eventos) del lead. Solo lectura. */
@Component({
  selector: 'app-postventa-historial-panel',
  imports: [DatePipe, TableModule],
  templateUrl: './postventa-historial-panel.component.html',
  styleUrl: './postventa-historial-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostventaHistorialPanelComponent {
  protected readonly facade = inject(PostventaWorkspaceFacade);

  protected display(value: unknown): string {
    return display(value);
  }
}
