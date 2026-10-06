import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, effect, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { PhoneActionButtonComponent } from '../../../../shared/components/phone-action-button/phone-action-button.component';
import { PostventaWorkspaceFacade } from '../../facades/postventa-workspace.facade';
import { display, semColor as semColorFn, semLabel as semLabelFn } from '../../models/postventa.vm';
import { PostventaPlataformaPanelComponent } from '../postventa-plataforma-panel/postventa-plataforma-panel.component';
import { PostventaFacturacionPanelComponent } from '../postventa-facturacion-panel/postventa-facturacion-panel.component';
import { PostventaEncuestaPanelComponent } from '../postventa-encuesta-panel/postventa-encuesta-panel.component';
import { PostventaHistorialPanelComponent } from '../postventa-historial-panel/postventa-historial-panel.component';
import { PostventaTipificacionBarComponent } from '../postventa-tipificacion-bar/postventa-tipificacion-bar.component';
import { LeadPostventaBandejaResponse } from '../../services/postventa-lead.service';

@Component({
  selector: 'app-postventa-gestion-drawer',
  imports: [
    ButtonModule,
    SkeletonModule,
    PhoneActionButtonComponent,
    PostventaPlataformaPanelComponent,
    PostventaFacturacionPanelComponent,
    PostventaEncuestaPanelComponent,
    PostventaHistorialPanelComponent,
    PostventaTipificacionBarComponent
  ],
  templateUrl: './postventa-gestion-drawer.component.html',
  styleUrl: './postventa-gestion-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostventaGestionDrawerComponent {
  protected readonly facade = inject(PostventaWorkspaceFacade);
  protected readonly activeTab = signal<string>('plataforma');
  protected readonly summaryOpen = signal(true);
  protected readonly editingCorte = signal(false);
  protected readonly corteMes = signal('');
  protected readonly corteNumero = signal(1);
  protected readonly skeletonRows = Array.from({ length: 6 });
  private readonly destroyRef = inject(DestroyRef);
  private handledLeadId = -1;

  constructor() {
    effect(() => {
      const lead = this.facade.selectedLead();
      if (!lead || lead.idLead === this.handledLeadId) return;
      this.handledLeadId = lead.idLead;
      this.activeTab.set(this.facade.consultaOnly() ? 'factura' : 'plataforma');
      this.editingCorte.set(false);
      if (lead.mesCorteBase) {
        this.corteMes.set(lead.mesCorteBase.slice(0, 7));
        this.corteNumero.set(lead.numeroCorteBase ?? 1);
      }
    });

    effect(() => {
      const open = this.facade.drawerOpen();
      document.body.style.overflow = open ? 'hidden' : '';
      document.body.classList.toggle('venta-drawer-v2-open', open);
    });

    this.destroyRef.onDestroy(() => {
      document.body.style.overflow = '';
      document.body.classList.remove('venta-drawer-v2-open');
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.facade.drawerOpen()) {
      this.facade.requestCloseDrawer();
    }
  }

  protected display(value: unknown): string {
    return display(value);
  }

  protected semColor(value: unknown): string {
    return semColorFn(value);
  }

  protected semLabel(value: unknown): string {
    return semLabelFn(value);
  }

  protected formatPrice(value: unknown): string {
    if (value === null || value === undefined) return '—';
    const n = Number(value);
    return isNaN(n) ? String(value) : `S/ ${n.toFixed(2)}`;
  }

  protected corteLabel(lead: LeadPostventaBandejaResponse): string {
    if (!lead.mesCorteBase) return '—';
    const [y, m] = lead.mesCorteBase.split('-');
    return `${m}/${y} - Corte ${lead.numeroCorteBase ?? 1}`;
  }

  protected async guardarCorte(): Promise<void> {
    const mes = this.corteMes();
    if (!mes) return;
    const ok = await this.facade.cambiarCorteLead({
      mesCorteBase: mes + '-01',
      numeroCorteBase: this.corteNumero()
    });
    if (ok) this.editingCorte.set(false);
  }
}
