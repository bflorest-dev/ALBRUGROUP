import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { PostventaWorkspaceFacade } from '../../facades/postventa-workspace.facade';
import { TipoContactoEncuesta, TipoEncuestaPostventa } from '../../services/postventa-lead.service';
import { EstadoBadge, SelectOption, display, estadoBadge } from '../../models/postventa.vm';

/** Encuesta de satisfaccion del cliente y su historial. */
@Component({
  selector: 'app-postventa-encuesta-panel',
  imports: [DatePipe, ReactiveFormsModule, ButtonModule, InputNumberModule, SelectModule, TableModule, TagModule, TextareaModule],
  templateUrl: './postventa-encuesta-panel.component.html',
  styleUrl: './postventa-encuesta-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostventaEncuestaPanelComponent {
  protected readonly facade = inject(PostventaWorkspaceFacade);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly tipoEncuestaOptions: SelectOption<TipoEncuestaPostventa>[] = [
    { label: 'Satisfaccion del servicio', value: 'SATISFACCION_SERVICIO' },
    { label: 'Satisfaccion con el asesor', value: 'SATISFACCION_ASESOR' }
  ];
  protected readonly tipoContactoOptions: SelectOption<TipoContactoEncuesta>[] = [
    { label: 'Llamada', value: 'LLAMADA' },
    { label: 'Chat', value: 'CHAT' }
  ];

  protected readonly form = this.fb.group({
    tipoEncuesta: ['SATISFACCION_SERVICIO' as TipoEncuestaPostventa],
    tipoContacto: ['LLAMADA' as TipoContactoEncuesta],
    calificacion: [10, [Validators.required, Validators.min(1), Validators.max(10)]],
    comentario: ['']
  });

  protected badge(value: unknown): EstadoBadge {
    return estadoBadge(value);
  }

  protected display(value: unknown): string {
    return display(value);
  }

  protected async guardar(): Promise<void> {
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    const ok = await this.facade.registrarEncuesta({
      tipoEncuesta: raw.tipoEncuesta,
      tipoContacto: raw.tipoContacto,
      calificacion: raw.calificacion,
      comentario: raw.comentario || null
    });
    if (ok) {
      this.form.patchValue({ comentario: '' });
    }
  }
}
