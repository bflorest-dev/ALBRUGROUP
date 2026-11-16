import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, input, untracked } from '@angular/core';
import type { Chart, ChartData, ChartOptions, TooltipModel } from 'chart.js';
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
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly componentScopeAttribute = this.findComponentScopeAttribute();

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
        enabled: false,
        external: context => this.renderExternalTooltip(context)
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

  private renderExternalTooltip(context: { chart: Chart; tooltip: TooltipModel<'line'> }): void {
    const { chart, tooltip } = context;
    const parent = chart.canvas.parentElement;
    if (!parent) return;

    const documentRef = chart.canvas.ownerDocument;
    let tooltipElement = parent.querySelector<HTMLDivElement>('.metricas-chart-tooltip');
    if (!tooltipElement) {
      tooltipElement = this.createTooltipElement(documentRef, 'div', 'metricas-chart-tooltip') as HTMLDivElement;
      tooltipElement.setAttribute('role', 'tooltip');
      tooltipElement.setAttribute('aria-hidden', 'true');
      parent.appendChild(tooltipElement);
    }

    if (tooltip.opacity === 0) {
      tooltipElement.style.opacity = '0';
      tooltipElement.setAttribute('aria-hidden', 'true');
      return;
    }

    const row = this.facade.rows()[tooltip.dataPoints[0]?.dataIndex ?? -1];
    if (!row) return;

    tooltipElement.replaceChildren(
      this.createTooltipSummary(documentRef, row),
      this.createTooltipLeadList(documentRef, row)
    );
    tooltipElement.style.opacity = '1';
    tooltipElement.setAttribute('aria-hidden', 'false');

    const canvasRect = chart.canvas.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    const caretX = tooltip.caretX + canvasRect.left - parentRect.left;
    const caretY = tooltip.caretY + canvasRect.top - parentRect.top;
    const parentWidth = parent.clientWidth;
    const halfWidth = Math.min(210, Math.max(80, parentWidth / 2 - 12));
    const left = Math.max(halfWidth, Math.min(caretX, parentWidth - halfWidth));
    const placeAbove = caretY > tooltipElement.offsetHeight + 20;
    tooltipElement.style.left = `${left}px`;
    tooltipElement.style.top = `${placeAbove ? caretY - tooltipElement.offsetHeight - 14 : caretY + 18}px`;
    tooltipElement.dataset['placement'] = placeAbove ? 'above' : 'below';
  }

  private createTooltipSummary(documentRef: Document, row: ReturnType<PersonalMetricasFacade['rows']>[number]): HTMLDivElement {
    const summary = this.createTooltipElement(documentRef, 'div', 'metricas-tooltip-summary') as HTMLDivElement;
    summary.append(
      this.createTooltipMetric(documentRef, 'preventa', 'Preventas', row.preventas),
      this.createTooltipDay(documentRef, row),
      this.createTooltipMetric(documentRef, 'instalada', 'Instaladas', row.instaladas)
    );
    return summary;
  }

  private createTooltipMetric(documentRef: Document, kind: 'preventa' | 'instalada', label: string, value: number): HTMLDivElement {
    const metric = this.createTooltipElement(documentRef, 'div', 'metricas-tooltip-metric') as HTMLDivElement;

    const indicator = this.createTooltipElement(
      documentRef,
      'span',
      `metricas-tooltip-indicator metricas-tooltip-indicator--${kind}`
    );
    indicator.setAttribute('aria-hidden', 'true');

    const text = this.createTooltipElement(documentRef, 'span', '');
    text.textContent = `${label}: ${value}`;
    metric.append(indicator, text);
    return metric;
  }

  private createTooltipDay(documentRef: Document, row: ReturnType<PersonalMetricasFacade['rows']>[number]): HTMLDivElement {
    const day = this.createTooltipElement(documentRef, 'div', 'metricas-tooltip-day') as HTMLDivElement;
    day.textContent = `Día ${row.day} · ${this.capitalize(row.weekday)}`;
    return day;
  }

  private createTooltipLeadList(documentRef: Document, row: ReturnType<PersonalMetricasFacade['rows']>[number]): HTMLDivElement {
    const list = this.createTooltipElement(documentRef, 'div', 'metricas-tooltip-leads') as HTMLDivElement;

    if (!row.leads.length) {
      const empty = this.createTooltipElement(
        documentRef,
        'div',
        'metricas-tooltip-lead metricas-tooltip-lead--empty'
      );
      empty.textContent = 'Sin leads en este punto';
      list.appendChild(empty);
      return list;
    }

    row.leads.forEach(lead => {
      const detail = this.createTooltipElement(documentRef, 'div', 'metricas-tooltip-lead');
      detail.textContent = [
        lead.numeroDocumento || 'Sin documento',
        lead.nombreCliente || 'Cliente sin nombre',
        lead.plan || 'Plan sin registrar',
        this.formatMoney(lead.cargoFijo),
        lead.zona || 'Zona sin registrar'
      ].join(' · ');
      list.appendChild(detail);
    });

    return list;
  }

  private createTooltipElement(documentRef: Document, tagName: 'div' | 'span', className: string): HTMLElement {
    const element = documentRef.createElement(tagName);
    if (className) element.className = className;
    if (this.componentScopeAttribute) element.setAttribute(this.componentScopeAttribute, '');
    return element;
  }

  private findComponentScopeAttribute(): string {
    const hostAttribute = Array.from(this.hostElement.nativeElement.attributes as Attr[])
      .find(attribute => attribute.name.startsWith('_nghost-'))?.name;
    return hostAttribute?.replace('_nghost-', '_ngcontent-') ?? '';
  }

  private capitalize(value: string): string {
    return value ? value[0].toUpperCase() + value.slice(1) : value;
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
