import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EventoResponse } from '../../../../shared/models/recruitment/evento-response';
import { GrupoCapacitacionResponse } from '../../../../shared/models/recruitment/grupo-capacitacion-response';
import { PostulacionResponse } from '../../../../shared/models/recruitment/postulacion-response';
import { SubtipificacionResponse } from '../../../../shared/models/recruitment/subtipificacion-response';
import { TipificacionResponse } from '../../../../shared/models/recruitment/tipificacion-response';

@Component({
  selector: 'app-postulacion-detail-panel',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './postulacion-detail-panel.component.html',
  styleUrl: './postulacion-detail-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostulacionDetailPanelComponent {
  @Input({ required: true }) postulacion: PostulacionResponse | null = null;
  @Input({ required: true }) eventos: EventoResponse[] = [];
  @Input({ required: true }) trainingGroups: GrupoCapacitacionResponse[] = [];
  @Input({ required: true }) tipificaciones: TipificacionResponse[] = [];
  @Input({ required: true }) modalidadContactoOptions: string[] = [];
  @Input({ required: true }) typifyForm!: FormGroup;
  @Input({ required: true }) requiresTrainingGroupAssignment = false;
  @Input({ required: true }) isLoadingDetail = false;
  @Input({ required: true }) isLoadingCatalogo = false;
  @Input({ required: true }) isLoadingTrainingGroups = false;
  @Input({ required: true }) isTypifying = false;
  @Input({ required: true }) detailErrorMessage = '';
  @Input({ required: true }) catalogoErrorMessage = '';
  @Input({ required: true }) trainingGroupsErrorMessage = '';
  @Input({ required: true }) typifyErrorMessage = '';
  @Input({ required: true }) typifySuccessMessage = '';

  @Output() readonly closeDetail = new EventEmitter<void>();
  @Output() readonly submitTypification = new EventEmitter<void>();
  @Output() readonly tipificacionChange = new EventEmitter<void>();

  protected getSubtipificaciones(): SubtipificacionResponse[] {
    const idTipificacion = Number(this.typifyForm.get('idTipificacion')?.value ?? 0);
    return (
      this.tipificaciones.find((tipificacion) => tipificacion.id === idTipificacion)
        ?.subtipificaciones ?? []
    );
  }

  protected getEventIcon(accion: string): string {
    switch (accion) {
      case 'REGISTRO_POSTULACION':
        return 'ti ti-user-plus';
      case 'ACTUALIZACION_POSTULACION':
        return 'ti ti-pencil';
      case 'CONTACTO':
        return 'ti ti-phone-call';
      case 'TIPIFICACION':
        return 'ti ti-tags';
      case 'ASIGNACION_GRUPO_CAPACITACION':
        return 'ti ti-users-group';
      case 'APROBACION_CAPACITACION':
        return 'ti ti-circle-check';
      case 'DESAPROBACION_CAPACITACION':
        return 'ti ti-circle-x';
      case 'CONFIRMACION_CONTRATACION':
        return 'ti ti-file-check';
      default:
        return 'ti ti-activity';
    }
  }

  protected getEventTitle(evento: EventoResponse): string {
    if (evento.accion === 'TIPIFICACION') {
      return evento.tipificacion ?? 'Tipificacion';
    }

    return this.toLabel(evento.accion);
  }

  protected getEventDetail(evento: EventoResponse): string {
    if (evento.accion === 'TIPIFICACION') {
      const subtipificacion = evento.subtipificacion ? `Subtipificacion: ${evento.subtipificacion}` : '';
      const modalidad = evento.modalidadContacto
        ? `Modalidad: ${this.toLabel(evento.modalidadContacto)}`
        : '';
      const observacion = evento.observacion ? `Observacion: ${evento.observacion}` : '';

      return [subtipificacion, modalidad, observacion].filter(Boolean).join(' · ') || 'Sin detalle.';
    }

    if (evento.accion === 'ASIGNACION_GRUPO_CAPACITACION') {
      return evento.observacion ?? 'Postulacion asignada a un grupo de capacitacion.';
    }

    if (evento.accion === 'REGISTRO_POSTULACION') {
      return 'Postulacion registrada en la bandeja de reclutamiento.';
    }

    if (evento.accion === 'ACTUALIZACION_POSTULACION') {
      return 'Datos de postulacion actualizados.';
    }

    if (evento.accion === 'CONFIRMACION_CONTRATACION') {
      return evento.observacion ?? 'Contratacion confirmada.';
    }

    return evento.observacion ?? 'Sin detalle adicional.';
  }

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
}
