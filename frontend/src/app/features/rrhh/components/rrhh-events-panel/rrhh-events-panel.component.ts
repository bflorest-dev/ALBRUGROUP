import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { EmpleadoResponse } from '../../../../shared/models/rrhh/empleado-response';
import { EventoEmpleadoResponse } from '../../../../shared/models/rrhh/evento-empleado-response';

@Component({
  selector: 'app-rrhh-events-panel',
  templateUrl: './rrhh-events-panel.component.html',
  styleUrl: './rrhh-events-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RrhhEventsPanelComponent {
  @Input({ required: true }) selectedEmployee: EmpleadoResponse | null = null;
  @Input({ required: true }) events: EventoEmpleadoResponse[] = [];
  @Input({ required: true }) isLoading = false;
  @Input({ required: true }) errorMessage = '';
  @Input({ required: true }) currentPage = 0;
  @Input({ required: true }) totalPages = 1;

  @Output() readonly reload = new EventEmitter<void>();
  @Output() readonly pageChange = new EventEmitter<number>();

  protected toLabel(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  protected toDate(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleString('es-PE');
  }
}
