import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core';
import { ChartData, ChartOptions, TooltipItem } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import { PersonalMetricasFacade } from '../../facades/personal-metricas.facade';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

@Component({
  selector: 'app-personal-metricas-panel',
  standalone: true,
  imports: [ChartModule],
  templateUrl: './personal-metricas-panel.component.html',
  styleUrl: './personal-metricas-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalMetricasPanelComponent {
  readonly employeeId = input(0);
  protected readonly facade = inject(PersonalMetricasFacade);

  protected readonly chartData = computed<ChartData<'line'>>(() => {
    const rows = this.facade.rows();
    return {
      labels: rows.map(row => String(row.day)),
      datasets: [
        {
          label: 'Preventas',
          data: rows.map(row => row.preventas),
          borderColor: '#5b5ce2',
          backgroundColor: '#5b5ce2',
          pointBackgroundColor: '#5b5ce2',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 6,
          tension: 0.32,
          fill: false
        },
        {
          label: 'Instaladas',
          data: rows.map(row => row.instaladas),
          borderColor: '#1ca35c',
          backgroundColor: '#1ca35c',
          pointBackgroundColor: '#1ca35c',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 6,
          tension: 0.32,
          fill: false
        }
      ]
    };
  });

  protected readonly chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    animation: { duration: 220 },
    layout: { padding: { top: 6, right: 8, bottom: 0, left: 0 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: true,
        padding: 12,
        titleMarginBottom: 8,
        bodySpacing: 5,
        callbacks: {
          title: items => this.tooltipTitle(items),
          label: context => `${context.dataset.label}: ${context.formattedValue}`,
          afterBody: items => this.tooltipDetails(items[0])
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(123, 133, 148, 0.16)' },
        border: { display: false },
        ticks: { color: '#7b8594', font: { size: 10 }, maxTicksLimit: 10 }
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#7b8594', font: { size: 10 }, precision: 0, stepSize: 1 },
        grid: { color: 'rgba(123, 133, 148, 0.16)' },
        border: { display: false }
      }
    }
  };

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

  protected barPercent(value: number): number {
    return Math.max(0, Math.min(100, (value / this.facade.maxDailyValue()) * 100));
  }

  private tooltipTitle(items: TooltipItem<'line'>[]): string {
    const row = this.facade.rows()[items[0]?.dataIndex ?? 0];
    if (!row) return 'Detalle del día';
    return `Día ${row.day} · ${row.weekday}`;
  }

  private tooltipDetails(item: TooltipItem<'line'> | undefined): string[] {
    if (!item) return [];

    const row = this.facade.rows()[item.dataIndex];
    if (!row) return [];

    const leads = item.datasetIndex === 1
      ? row.leads.filter(lead => lead.instalada)
      : row.leads;
    if (!leads.length) return ['Sin leads en este punto'];

    const lines = leads.slice(0, 6).flatMap(lead => [
      `• ${lead.numeroDocumento || 'Sin documento'} · ${lead.nombreCliente || 'Cliente sin nombre'}`,
      `  ${lead.plan || 'Plan sin registrar'} · ${this.formatMoney(lead.cargoFijo)} · ${lead.zona || 'Zona sin registrar'}`
    ]);
    if (leads.length > 6) lines.push(`+ ${leads.length - 6} leads más`);
    return lines;
  }

  private formatMoney(value: number | null): string {
    return value == null ? 'CF sin registro' : `S/ ${value.toFixed(2)}`;
  }

  private offsetMonth(delta: number): string {
    const [year, month] = this.facade.selectedMonth().split('-').map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
