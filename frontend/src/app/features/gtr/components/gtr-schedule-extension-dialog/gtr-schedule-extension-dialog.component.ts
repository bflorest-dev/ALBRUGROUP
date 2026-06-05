import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TextareaModule } from 'primeng/textarea';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';

/**
 * Modal para ampliar el horario (de hoy) de un asesor desde la lista del GTR.
 * Presentacional: comparte el GtrWorkspaceFacade por DI (provisto en la pagina).
 */
@Component({
  selector: 'app-gtr-schedule-extension-dialog',
  imports: [
    UpperCasePipe,
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    DialogModule,
    MessageModule,
    ProgressSpinnerModule,
    TextareaModule
  ],
  templateUrl: './gtr-schedule-extension-dialog.component.html',
  styleUrl: './gtr-schedule-extension-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrScheduleExtensionDialogComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);

  /** Referencia estable para [style] (evita crear un objeto nuevo en cada change detection). */
  protected readonly dialogStyle = { width: '30rem', maxWidth: '95vw' };

  protected formatTime(value: string | null | undefined): string {
    return value ? value.slice(0, 5) : '—';
  }

  protected estadoLabel(): string {
    const context = this.facade.extensionContext();
    if (!context) {
      return '';
    }
    if (context.jornadaCerrada) {
      return 'Jornada cerrada (ya marcó salida)';
    }
    if (context.tieneRegistro) {
      return 'Jornada en curso';
    }
    return 'Aún no marca ingreso';
  }
}
