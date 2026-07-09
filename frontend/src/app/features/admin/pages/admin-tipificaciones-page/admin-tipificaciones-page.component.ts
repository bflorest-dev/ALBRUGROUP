import { ChangeDetectionStrategy, Component, HostListener, OnInit, inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { AdminTipificacionFacade, EtapaCatalogo } from '../../facades/admin-tipificacion.facade';

@Component({
  selector: 'app-admin-tipificaciones-page',
  imports: [
    FormsModule,
    ButtonModule,
    CardModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    SkeletonModule,
    TagModule,
    ToastModule
  ],
  providers: [AdminTipificacionFacade, MessageService],
  templateUrl: './admin-tipificaciones-page.component.html',
  styleUrl: './admin-tipificaciones-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminTipificacionesPageComponent implements OnInit {
  protected readonly facade = inject(AdminTipificacionFacade);
  private readonly messageService = inject(MessageService);
  protected readonly skeletonRows = Array.from({ length: 4 });

  ngOnInit(): void {
    void this.load();
  }

  protected async onEtapaChange(etapa: EtapaCatalogo): Promise<void> {
    if (!this.confirmDiscardChanges()) {
      return;
    }
    this.facade.changeEtapa(etapa);
    await this.load();
  }

  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.facade.isDirty()) {
      event.preventDefault();
      event.returnValue = true;
    }
  }

  canLeave(): boolean {
    return this.confirmDiscardChanges();
  }

  protected async load(): Promise<void> {
    try {
      await this.facade.loadCatalogo();
    } catch {
      this.notify('error', 'No se pudo cargar el catalogo de esta etapa.');
    }
  }

  protected async guardar(): Promise<void> {
    const error = this.facade.validate();
    if (error) {
      this.notify('warn', error);
      return;
    }
    try {
      await this.facade.save();
      this.notify('success', 'Catalogo guardado.');
    } catch {
      this.notify('error', 'No se pudo guardar el catalogo. Revisa los datos e intenta de nuevo.');
    }
  }

  private notify(severity: 'success' | 'info' | 'warn' | 'error', detail: string): void {
    const summary = { success: 'Listo', info: 'Informacion', warn: 'Atencion', error: 'Hubo un problema' }[severity];
    this.messageService.add({ severity, summary, detail, life: severity === 'error' ? 6000 : 4000 });
  }

  private confirmDiscardChanges(): boolean {
    return !this.facade.isDirty()
      || window.confirm('Tienes cambios sin guardar. Si continúas, se perderán.');
  }
}

export const canDeactivateAdminTipificaciones: CanDeactivateFn<AdminTipificacionesPageComponent> =
  (component) => component.canLeave();
