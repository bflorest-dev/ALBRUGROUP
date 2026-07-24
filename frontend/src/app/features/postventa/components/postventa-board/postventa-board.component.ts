import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PostventaWorkspaceFacade } from '../../facades/postventa-workspace.facade';
import { EstadoBadge, VisualLeadPostventa, display, estadoBadge, shortName } from '../../models/postventa.vm';

/** Bandeja compartida de POSTVENTA: todos los leads ordenados por fecha de instalacion, con
 *  separadores por fecha (Hoy / mes) al estilo Backoffice. Presentacional: usa el facade compartido. */
@Component({
  selector: 'app-postventa-board',
  imports: [DatePipe, ButtonModule, PaginatorModule, SkeletonModule, TableModule, TagModule],
  templateUrl: './postventa-board.component.html',
  styleUrl: './postventa-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostventaBoardComponent {
  protected readonly facade = inject(PostventaWorkspaceFacade);
  protected readonly skeletonRows = Array.from({ length: 8 });
  protected readonly columnCount = 13;

  protected badge(value: unknown): EstadoBadge {
    return estadoBadge(value);
  }

  protected display(value: unknown): string {
    return display(value);
  }

  protected shortName(value?: string | null): string {
    return shortName(value);
  }

  protected async gestionar(row: VisualLeadPostventa): Promise<void> {
    await this.facade.gestionar(row);
  }

  protected async changePage(pageNumber: number): Promise<void> {
    await this.facade.changePage(pageNumber);
  }
}
