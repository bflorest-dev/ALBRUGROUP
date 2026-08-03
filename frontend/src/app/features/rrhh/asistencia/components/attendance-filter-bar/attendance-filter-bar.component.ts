import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

export interface SelectChoice {
  label: string;
  value: string;
}

/**
 * Barra de controles del reporte: buscador con autocompletado + puesto + mes + refrescar.
 * Presentacional puro: recibe opciones/valores y emite los cambios; no conoce el facade.
 */
@Component({
  selector: 'app-attendance-filter-bar',
  standalone: true,
  imports: [FormsModule, AutoCompleteModule, SelectModule, ButtonModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './attendance-filter-bar.component.html',
  styleUrl: './attendance-filter-bar.component.scss'
})
export class AttendanceFilterBarComponent {
  readonly empleadoNombres = input<string[]>([]);
  readonly puestoOptions = input<SelectChoice[]>([]);
  readonly monthOptions = input<SelectChoice[]>([]);
  readonly searchTerm = input<string>('');
  readonly puesto = input<string>('');
  readonly selectedMonth = input<string>('');
  readonly loading = input<boolean>(false);

  readonly searchChange = output<string>();
  readonly puestoChange = output<string>();
  readonly monthChange = output<string>();
  readonly refresh = output<void>();

  protected readonly suggestions = signal<string[]>([]);

  protected onComplete(event: { query: string }): void {
    const q = (event.query ?? '').toLowerCase().trim();
    const matches = this.empleadoNombres()
      .filter((n) => n.toLowerCase().includes(q))
      .slice(0, 8);
    this.suggestions.set(matches);
    // Filtra la bandeja en vivo mientras se escribe (no solo al elegir una sugerencia).
    this.searchChange.emit(event.query ?? '');
  }

  protected onSearchModel(value: string | null): void {
    this.searchChange.emit(value ?? '');
  }
}
