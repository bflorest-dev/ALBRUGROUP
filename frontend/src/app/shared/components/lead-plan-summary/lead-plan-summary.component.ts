import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TagModule } from 'primeng/tag';

export type LeadPlanAdditional = {
  nombre?: string | null;
  nombreAdicional?: string | null;
  cantidad?: number | null;
};

@Component({
  selector: 'app-lead-plan-summary',
  imports: [TagModule],
  templateUrl: './lead-plan-summary.component.html',
  styleUrl: './lead-plan-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeadPlanSummaryComponent {
  @Input() planName?: string | null;
  @Input() internetVelocidad?: number | string | null;
  @Input() internetUnidad?: string | null;
  @Input() velocidadPromocional?: number | string | null;
  @Input() mesesPromocionVelocidad?: number | null;
  @Input() adicionales?: LeadPlanAdditional[] | null;

  protected readonly emptyLabel = '-';

  protected speedLabel(value: number | string | null | undefined): string {
    return `${value} ${this.internetUnidad || 'MBPS'}`;
  }

  protected additionalLabel(adicional: LeadPlanAdditional): string {
    const nombre = adicional.nombre ?? adicional.nombreAdicional ?? 'Adicional';
    const cantidad = adicional.cantidad && adicional.cantidad > 1 ? ` x${adicional.cantidad}` : '';
    return `${nombre}${cantidad}`;
  }
}
