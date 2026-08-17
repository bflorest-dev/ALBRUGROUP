import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PaginatorModule } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { LeadAsesorVentasResponse } from '../../../../shared/models/preventa/preventa.models';
import { AsesorVentasWorkspaceFacade } from '../../facades/asesor-ventas-workspace.facade';

@Component({
  selector: 'app-asesor-board',
  imports: [DatePipe, ButtonModule, CardModule, PaginatorModule, SkeletonModule, TableModule, TagModule],
  templateUrl: './asesor-board.component.html',
  styleUrl: './asesor-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsesorBoardComponent implements OnInit, OnDestroy {
  protected readonly facade = inject(AsesorVentasWorkspaceFacade);
  private readonly cdr = inject(ChangeDetectorRef);
  private relativeTimer: number | null = null;

  ngOnInit(): void {
    // Refresca los tiempos relativos ("Hace X min") cada minuto sin depender de cambios de señales.
    this.relativeTimer = window.setInterval(() => this.cdr.markForCheck(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.relativeTimer !== null) {
      window.clearInterval(this.relativeTimer);
      this.relativeTimer = null;
    }
  }

  protected onRowOpen(row: LeadAsesorVentasResponse): void {
    if (this.facade.isManageActionDisabledRow(row)) {
      return;
    }
    void this.facade.openDetail(row.id);
  }

  protected onRowKeydown(event: KeyboardEvent, row: LeadAsesorVentasResponse): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onRowOpen(row);
    }
  }
}
