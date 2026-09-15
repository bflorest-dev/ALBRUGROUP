import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DatePickerModule } from 'primeng/datepicker';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { AsesorVentasMisPreventasFacade } from '../../facades/asesor-ventas-mis-preventas.facade';

@Component({
  selector: 'app-mis-preventas-board',
  imports: [FormsModule, DatePickerModule, PaginatorModule, TooltipModule],
  templateUrl: './mis-preventas-board.component.html',
  styleUrl: './mis-preventas-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MisPreventasBoardComponent {
  protected readonly facade = inject(AsesorVentasMisPreventasFacade);

  private readonly search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(term => this.facade.search(term));
  }

  onSearch(term: string): void {
    this.facade.searchTerm.set(term);
    this.search$.next(term);
  }
}
