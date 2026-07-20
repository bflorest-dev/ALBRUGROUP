import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, computed, inject, input, output, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { Popover, PopoverModule } from 'primeng/popover';
import { SelectButtonModule } from 'primeng/selectbutton';

export type MetricsPeriodo = 'dia' | 'semana' | 'mes';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];

/** Margen antes de cerrar al salir el mouse: evita cierres bruscos al cruzar hacia el calendario. */
const CIERRE_MS = 320;

/**
 * Control segmentado de periodo para bloques de metricas: [Hoy | Semanal | Mensual].
 *
 * El primer segmento concentra la eleccion del dia: al hacer clic abre un calendario (sin icono,
 * para no romper la estetica del segmentado). Si se elige un dia distinto de hoy, el segmento pasa
 * a mostrar esa fecha, de modo que el control nunca miente sobre lo que se esta viendo.
 *
 * Cierre del calendario: al salir el mouse (con margen), al elegir un dia, y por clic fuera /
 * Escape que ya maneja el popover — necesario porque en tactil no existe `mouseleave`.
 */
@Component({
  selector: 'app-period-selector',
  standalone: true,
  imports: [FormsModule, SelectButtonModule, PopoverModule, DatePickerModule],
  templateUrl: './period-selector.component.html',
  styleUrl: './period-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PeriodSelectorComponent implements OnDestroy {
  readonly periodo = input.required<MetricsPeriodo>();
  /** Dia operativo elegido (`YYYY-MM-DD`). `null` = hoy. Solo aplica con periodo `dia`. */
  readonly dia = input<string | null>(null);

  readonly periodoChange = output<MetricsPeriodo>();
  readonly diaChange = output<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dayPopover = viewChild.required<Popover>('dayPopover');
  private cierreTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly hoy = this.formatLocal(new Date());

  protected readonly diaLabel = computed(() => {
    const dia = this.dia();
    if (!dia || dia === this.hoy) {
      return 'Hoy';
    }
    const [, mes, numero] = dia.split('-');
    return `${Number(numero)} ${MESES[Number(mes) - 1]}`;
  });

  // `computed` memoiza: la referencia se mantiene estable entre ciclos de deteccion, requisito de
  // PrimeNG + OnPush (ver primeng-loop-fix.md).
  protected readonly segments = computed(() => [
    { label: this.diaLabel(), value: 'dia' as MetricsPeriodo },
    { label: 'Semanal', value: 'semana' as MetricsPeriodo },
    { label: 'Mensual', value: 'mes' as MetricsPeriodo }
  ]);

  protected readonly maxDate = computed(() => new Date());

  protected readonly selectedDate = computed(() => {
    const [anio, mes, numero] = (this.dia() || this.hoy).split('-').map(Number);
    return new Date(anio, mes - 1, numero);
  });

  ngOnDestroy(): void {
    this.cancelarCierre();
  }

  protected onSegmentChange(value: MetricsPeriodo | null | undefined): void {
    if (!value) {
      return;
    }
    this.periodoChange.emit(value);
    if (value !== 'dia') {
      this.cerrar();
    }
  }

  /** Clic sobre el primer segmento: abre el calendario aunque ese segmento ya estuviera activo. */
  protected onClick(event: MouseEvent): void {
    const clicked = (event.target as HTMLElement | null)?.closest('.p-togglebutton');
    if (!clicked) {
      return;
    }
    if (clicked === this.host.nativeElement.querySelector('.p-togglebutton')) {
      this.dayPopover().show(event, clicked as HTMLElement);
    } else {
      this.cerrar();
    }
  }

  protected onPickDay(date: Date | null): void {
    if (!date) {
      return;
    }
    if (this.periodo() !== 'dia') {
      this.periodoChange.emit('dia');
    }
    this.diaChange.emit(this.formatLocal(date));
    this.cerrar();
  }

  protected programarCierre(): void {
    this.cancelarCierre();
    this.cierreTimer = setTimeout(() => this.cerrar(), CIERRE_MS);
  }

  protected cancelarCierre(): void {
    if (this.cierreTimer) {
      clearTimeout(this.cierreTimer);
      this.cierreTimer = null;
    }
  }

  private cerrar(): void {
    this.cancelarCierre();
    this.dayPopover().hide();
  }

  private formatLocal(date: Date): string {
    const mes = `${date.getMonth() + 1}`.padStart(2, '0');
    const dia = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${mes}-${dia}`;
  }
}
