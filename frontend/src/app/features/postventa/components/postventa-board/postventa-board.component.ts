import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { SelectChangeEvent, SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { providerLogo as resolveProviderLogo } from '../../../../shared/utils/provider-logo';
import { PostventaWorkspaceFacade } from '../../facades/postventa-workspace.facade';
import { EstadoBadge, VisualLeadPostventa, display, estadoBadge, shortName } from '../../models/postventa.vm';

/** Bandeja compartida de POSTVENTA: todos los leads ordenados por fecha de instalacion, con
 *  separadores por fecha (Hoy / mes) al estilo Backoffice. Presentacional: usa el facade compartido. */
@Component({
  selector: 'app-postventa-board',
  imports: [DatePipe, FormsModule, ButtonModule, InputTextModule, PaginatorModule, SelectModule, SkeletonModule, TableModule, TagModule],
  templateUrl: './postventa-board.component.html',
  styleUrl: './postventa-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostventaBoardComponent {
  protected readonly facade = inject(PostventaWorkspaceFacade);
  protected readonly skeletonRows = Array.from({ length: 8 });
  protected readonly columnCount = 12;
  protected searchTerm = '';

  protected badge(value: unknown): EstadoBadge {
    return estadoBadge(value);
  }

  protected display(value: unknown): string {
    return display(value);
  }

  protected shortName(value?: string | null): string {
    return shortName(value);
  }

  protected providerLogo(nombre?: string | null): string | null {
    return resolveProviderLogo(nombre);
  }

  protected async gestionar(row: VisualLeadPostventa): Promise<void> {
    await this.facade.gestionar(row);
  }

  protected async changePage(pageNumber: number): Promise<void> {
    await this.facade.changePage(pageNumber);
  }

  protected async changeCorte(event: SelectChangeEvent): Promise<void> {
    await this.facade.changeCorte(String(event.value ?? 'TODOS'));
  }

  protected async buscarRapido(): Promise<void> {
    await this.facade.buscarRapido(this.searchTerm);
  }
}
