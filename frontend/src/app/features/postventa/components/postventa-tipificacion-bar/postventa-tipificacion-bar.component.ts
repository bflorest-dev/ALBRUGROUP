import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SubtipificacionResponse } from '../../../../shared/models/preventa/preventa.models';
import { PostventaWorkspaceFacade } from '../../facades/postventa-workspace.facade';

/** Barra de cierre de gestion: tipificacion → subtipificacion dependiente → comentario.
 *  Al tipificar, el facade libera el lead y recarga la bandeja. */
@Component({
  selector: 'app-postventa-tipificacion-bar',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule],
  templateUrl: './postventa-tipificacion-bar.component.html',
  styleUrl: './postventa-tipificacion-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostventaTipificacionBarComponent {
  protected readonly facade = inject(PostventaWorkspaceFacade);
  private readonly fb = inject(NonNullableFormBuilder);

  private readonly selectedTipi = signal('');
  protected readonly subtipificaciones = computed<SubtipificacionResponse[]>(() =>
    this.facade.subtipificacionesDe(this.selectedTipi())
  );

  private handledLeadId = -1;

  protected readonly form = this.fb.group({
    codigoTipificacion: ['', [Validators.required]],
    codigoSubtipificacion: ['', [Validators.required]],
    comentario: ['']
  });

  constructor() {
    // Reiniciar la barra cada vez que se abre un lead distinto.
    effect(() => {
      const lead = this.facade.selectedLead();
      if (!lead || lead.idLead === this.handledLeadId) {
        return;
      }
      this.handledLeadId = lead.idLead;
      this.selectedTipi.set('');
      this.form.reset({ codigoTipificacion: '', codigoSubtipificacion: '', comentario: '' });
    });
  }

  protected onTipiChange(codigo: string | null): void {
    this.selectedTipi.set(codigo ?? '');
    this.form.patchValue({ codigoSubtipificacion: '' });
  }

  protected async tipificar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    await this.facade.tipificar({
      codigoTipificacion: raw.codigoTipificacion,
      codigoSubtipificacion: raw.codigoSubtipificacion,
      comentario: raw.comentario || null
    });
  }
}
