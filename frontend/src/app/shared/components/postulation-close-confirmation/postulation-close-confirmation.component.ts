import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PostulacionResponse } from '../../models/recruitment/postulacion-response';
import { DarBajaPostulacionRequest } from '../../models/recruitment/dar-baja-postulacion-request';

@Component({
  selector: 'app-postulation-close-confirmation',
  imports: [FormsModule],
  templateUrl: './postulation-close-confirmation.component.html',
  styleUrl: './postulation-close-confirmation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostulationCloseConfirmationComponent implements AfterViewInit {
  @Input({ required: true }) postulacion!: PostulacionResponse;
  @Input() context = 'Bandeja operativa';
  @Input() related = 'Sin actividad asociada';
  @Input() busy = false;
  @Input() errorMessage = '';

  @Output() confirmed = new EventEmitter<DarBajaPostulacionRequest>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('dialog', { static: true }) private dialog!: ElementRef<HTMLDialogElement>;

  protected motivo = '';
  protected observacion = '';

  ngAfterViewInit(): void {
    this.dialog.nativeElement.showModal();
  }

  protected nombre(): string {
    const p = this.postulacion?.postulante;
    const nombre = [p?.nombres, p?.apellidos].filter(Boolean).join(' ').trim();
    return nombre || (p?.usuarioMeta ? `@${p.usuarioMeta.replace(/^@+/, '')}` : 'Postulante sin nombre');
  }

  protected etapa(): string {
    return this.postulacion?.etapa?.toLowerCase().replace(/_/g, ' ') ?? '—';
  }

  protected submit(): void {
    const motivo = this.motivo.trim();
    if (!motivo || this.busy) return;
    this.confirmed.emit({ motivo, observacion: this.observacion.trim() || null });
  }

  protected cancel(): void {
    if (this.busy) return;
    this.cancelled.emit();
  }
}
