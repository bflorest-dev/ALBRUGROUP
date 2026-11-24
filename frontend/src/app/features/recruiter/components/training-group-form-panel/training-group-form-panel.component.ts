import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { EmpleadoRolResponse } from '../../../../shared/models/rrhh/empleado-rol-response';

@Component({
  selector: 'app-training-group-form-panel',
  imports: [ReactiveFormsModule, DateFieldComponent],
  templateUrl: './training-group-form-panel.component.html',
  styleUrl: './training-group-form-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrainingGroupFormPanelComponent {
  @Input({ required: true }) groupForm!: FormGroup;
  @Input() showHeading = true;
  @Input({ required: true }) capacitadores: EmpleadoRolResponse[] = [];
  @Input({ required: true }) turnoOptions: string[] = [];
  @Input({ required: true }) salaOptions: string[] = [];
  @Input({ required: true }) isLoadingCapacitadores = false;
  @Input({ required: true }) capacitadoresErrorMessage = '';
  @Input({ required: true }) isCreatingGroup = false;
  @Input({ required: true }) createErrorMessage = '';
  @Input({ required: true }) createSuccessMessage = '';

  @Output() readonly save = new EventEmitter<void>();
  @Output() readonly resetForm = new EventEmitter<void>();

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

  protected turnoLabel(value: string | null | undefined): string {
    return {
      MORNING: 'Mañana',
      AFTERNOON: 'Tarde',
      NIGHT: 'Noche'
    }[value ?? ''] ?? this.toLabel(value);
  }

  protected salaLabel(value: string | null | undefined): string {
    return {
      SALA_FIBRA: 'Sala Win',
      SALA_CLARO: 'Sala Claro'
    }[value ?? ''] ?? this.toLabel(value);
  }

  protected selectedCapacitadorLabel(): string {
    if (this.isLoadingCapacitadores) {
      return 'Cargando capacitadores…';
    }

    const id = Number(this.groupForm.get('idCapacitador')?.value ?? 0);
    const capacitador = this.capacitadores.find((item) => item.idEmpleado === id);
    return capacitador ? `${this.getDisplayName(capacitador)} · ${capacitador.numeroDocumento}` : 'Seleccionar capacitador';
  }

  protected selectedCapacitadorId(): number {
    return Number(this.groupForm.get('idCapacitador')?.value ?? 0);
  }

  protected selectCapacitador(id: number, menu: HTMLDetailsElement): void {
    this.groupForm.get('idCapacitador')?.setValue(id);
    menu.open = false;
  }

  protected handleMenuToggle(event: Event): void {
    const current = event.currentTarget as HTMLDetailsElement;
    if (!current.open) {
      return;
    }

    document.querySelectorAll<HTMLDetailsElement>('details.group-select[open]').forEach((menu) => {
      if (menu !== current) {
        menu.open = false;
      }
    });
  }

  protected selectOption(controlName: 'turno' | 'sala', value: string, menu: HTMLDetailsElement): void {
    this.groupForm.get(controlName)?.setValue(value);
    menu.open = false;
  }

  protected getDisplayName(capacitador: EmpleadoRolResponse): string {
    return `${capacitador.nombres} ${capacitador.apellidos}`.trim();
  }
}
