import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { PreventaLeadService } from '../../../preventa/services/preventa-lead.service';

@Component({
  selector: 'app-admin-delete-leads-page',
  imports: [ReactiveFormsModule, ButtonModule, InputNumberModule, InputTextModule, MessageModule, TagModule],
  templateUrl: './admin-delete-leads-page.component.html',
  styleUrl: './admin-delete-leads-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDeleteLeadsPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly leadService = inject(PreventaLeadService);

  protected readonly isDeleting = signal(false);
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');

  protected readonly form = this.fb.nonNullable.group({
    idLead: [null as number | null, [Validators.required, Validators.min(1)]],
    confirmacion: ['', [Validators.required]]
  });

  protected canDelete(): boolean {
    const idLead = this.form.controls.idLead.value;
    const confirmation = this.form.controls.confirmacion.value.trim();
    return !!idLead && confirmation === String(idLead) && !this.isDeleting();
  }

  protected async eliminarLead(): Promise<void> {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (!this.canDelete()) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Confirma la eliminacion escribiendo exactamente el id del Lead.');
      return;
    }

    const idLead = this.form.controls.idLead.value;
    if (!idLead) {
      return;
    }

    this.isDeleting.set(true);
    try {
      await lastValueFrom(this.leadService.eliminarLeadIntegral(idLead));
      this.successMessage.set(`Lead ${idLead} eliminado integralmente.`);
      this.form.reset({ idLead: null, confirmacion: '' });
    } catch {
      this.errorMessage.set('No se pudo eliminar el Lead. Verifica el id, permisos y que el backend este disponible.');
    } finally {
      this.isDeleting.set(false);
    }
  }
}
