import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

/**
 * Sub-tab del Dashboard aún sin métricas (Venta, Cobranza). Muestra un estado vacío "Próximamente".
 * El título y la descripción vienen de la `data` de la ruta, así una sola página cubre ambas etapas.
 */
@Component({
  selector: 'app-admin-dashboard-placeholder-page',
  imports: [PageHeaderComponent],
  templateUrl: './admin-dashboard-placeholder-page.component.html',
  styleUrl: './admin-dashboard-placeholder-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardPlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });

  protected readonly titulo = computed(() => (this.data()['titulo'] as string) ?? 'Próximamente');
  protected readonly descripcion = computed(() => (this.data()['descripcion'] as string) ?? '');
}
