import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { PersonalMetricasFacade } from '../../facades/personal-metricas.facade';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

@Component({
  selector: 'app-personal-metricas-panel',
  standalone: true,
  imports: [],
  templateUrl: './personal-metricas-panel.component.html',
  styleUrl: './personal-metricas-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalMetricasPanelComponent {
  readonly employeeId = input(0);
  protected readonly facade = inject(PersonalMetricasFacade);

  constructor() {
    effect(() => {
      const employeeId = this.employeeId();
      untracked(() => {
        if (employeeId) this.facade.initialize(employeeId);
        else this.facade.reset();
      });
    });
  }

  protected get monthLabel(): string {
    const [year, month] = this.facade.selectedMonth().split('-').map(Number);
    return `${MONTH_NAMES[month - 1]} ${year}`;
  }

  protected prevMonth(): void {
    this.facade.setMonth(this.offsetMonth(-1));
  }

  protected nextMonth(): void {
    this.facade.setMonth(this.offsetMonth(1));
  }

  protected retry(): void {
    this.facade.retry();
  }

  private offsetMonth(delta: number): string {
    const [year, month] = this.facade.selectedMonth().split('-').map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
