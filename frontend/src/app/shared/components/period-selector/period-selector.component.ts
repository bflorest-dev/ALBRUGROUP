import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { Popover, PopoverModule } from 'primeng/popover';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MetricsRango } from '../../utils/metrics-period';

export type MetricsPeriodo = 'dia' | 'semana' | 'mes';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];

/** Margen antes de cerrar al salir el mouse: evita cierres bruscos al cruzar hacia el calendario. */
const CIERRE_MS = 320;
const HOVER_POPOVER_MS = 200;

/**
 * Control segmentado de periodo para bloques de metricas: [Hoy | Semanal | Mensual].
 *
 * El primer segmento concentra la eleccion del dia: al hacer clic abre un calendario (sin icono,
 * para no romper la estetica del segmentado). Si se elige un dia distinto de hoy, el segmento pasa
 * a mostrar esa fecha (o el rango), de modo que el control nunca miente sobre lo que se esta viendo.
 *
 * Seleccion de rango (dos clics): el primer clic pinta el dia y carga ese dia, pero deja el
 * calendario abierto; el segundo pinta todo el tramo entre ambos y carga el periodo. Como todos los
 * endpoints piden desde/hasta, un dia suelto se emite como `desde === hasta`.
 *
 * El primer y tercer segmento abren sus calendarios por hover tras 200 ms. El clic en Hoy vuelve al
 * dia actual de inmediato; el clic en Semanal aplica el rango sabado..hoy; el clic en Mensual
 * conserva la seleccion rapida del mes actual.
 *
 * Cierre del calendario: al salir el mouse (con margen), al cerrar un rango de dos dias, y por clic
 * fuera / Escape que ya maneja el popover — necesario porque en tactil no existe `mouseleave`. El
 * primer clic NO cierra: hay que dejar elegir el segundo dia.
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
  /** Inicio del rango elegido (`YYYY-MM-DD`). `null` = hoy. Solo aplica con periodo `dia`. */
  readonly dia = input<string | null>(null);
  /** Fin del rango (`YYYY-MM-DD`). `null` o igual a `dia` = dia suelto. Solo aplica con periodo `dia`. */
  readonly hasta = input<string | null>(null);
  /** Algunas bandejas, como Programados, necesitan elegir fechas futuras. */
  readonly allowFuture = input(false);
  readonly disabled = input(false);

  readonly periodoChange = output<MetricsPeriodo>();
  /** Rango elegido en el calendario. Un dia suelto llega como `desde === hasta`. */
  readonly rangoChange = output<MetricsRango>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dayPopover = viewChild.required<Popover>('dayPopover');
  private cierreTimer: ReturnType<typeof setTimeout> | null = null;
  private hoverPopoverTimer: ReturnType<typeof setTimeout> | null = null;
  private hoverSegment: 'dia' | 'mes' | null = null;
  /** Segmento sobre el que se abrio el calendario; ancla de la flecha del popover. */
  private botonAncla: HTMLElement | null = null;

  private readonly hoy = this.formatLocal(new Date());

  protected readonly diaLabel = computed(() => {
    if (this.periodo() !== 'dia') {
      return 'Hoy';
    }
    const desde = this.dia();
    const hasta = this.hasta();
    if (!desde || (desde === this.hoy && (!hasta || hasta === this.hoy))) {
      return 'Hoy';
    }
    if (!hasta || hasta === desde) {
      return this.fechaCorta(desde);
    }
    return `${this.fechaCorta(desde)} – ${this.fechaCorta(hasta)}`;
  });

  // `computed` memoiza: la referencia se mantiene estable entre ciclos de deteccion, requisito de
  // PrimeNG + OnPush (ver primeng-loop-fix.md).
  protected readonly segments = computed(() => [
    { label: this.diaLabel(), value: 'dia' as MetricsPeriodo },
    { label: 'Semanal', value: 'semana' as MetricsPeriodo },
    { label: 'Mensual', value: 'mes' as MetricsPeriodo }
  ]);

  protected readonly maxDate = computed<Date | null>(() => this.allowFuture() ? null : new Date());

  // Modelo local del datepicker: se sincroniza al ABRIR el popover y no se toca durante la seleccion
  // del rango, para que PrimeNG no resetee el mes visible al recibir un nuevo ngModel.
  protected readonly calendarModel = signal<Array<Date | null>>([new Date(), null]);

  /** Modo del popover: `day` = datepicker de dias (rango), `month` = selector de meses. */
  protected readonly popoverMode = signal<'day' | 'month'>('day');

  /** Modelo del selector de meses. */
  protected readonly monthModel = signal<Date>(new Date());

  protected readonly popoverStyleClass = computed(() =>
    this.popoverMode() === 'month'
      ? 'period-day-popover period-month-popover'
      : 'period-day-popover'
  );

  ngOnDestroy(): void {
    this.cancelarCierre();
    this.cancelarHoverPopover();
  }

  protected onSegmentChange(value: MetricsPeriodo | null | undefined): void {
    if (!value || this.disabled()) {
      return;
    }
    if (value === 'semana') {
      this.emitirSemanaHastaHoy();
      this.cerrar();
      return;
    }
    this.periodoChange.emit(value);
    if (value !== 'dia') {
      this.cerrar();
    }
  }

  /** Clic sobre el primer segmento: abre el calendario aunque ese segmento ya estuviera activo. */
  protected onClick(event: MouseEvent): void {
    if (this.disabled()) {
      return;
    }
    this.cancelarHoverPopover();
    this.hoverSegment = null;
    const clicked = (event.target as HTMLElement | null)?.closest('.p-togglebutton');
    if (!clicked) {
      return;
    }
    if (clicked === this.host.nativeElement.querySelector('.p-togglebutton')) {
      this.emitirHoy();
      this.cerrar();
    } else {
      this.cerrar();
    }
  }

  /** Detecta hover sobre Hoy/Mensual para abrir su calendario tras 200 ms. */
  protected onMouseOver(event: MouseEvent): void {
    if (this.disabled()) {
      return;
    }
    const target = (event.target as HTMLElement)?.closest('.p-togglebutton') as HTMLElement | null;
    const buttons = this.host.nativeElement.querySelectorAll('.p-togglebutton');
    const isOverDia = target === buttons[0];
    const isOverMes = target === buttons[2];
    const nextSegment = isOverDia ? 'dia' : isOverMes ? 'mes' : null;

    if (nextSegment && this.hoverSegment !== nextSegment) {
      this.hoverSegment = nextSegment;
      this.cancelarHoverPopover();
      this.hoverPopoverTimer = setTimeout(() => {
        this.hoverPopoverTimer = null;
        if (nextSegment === 'dia') {
          this.abrirDiaPicker(target!);
        } else {
          this.abrirMesPicker(target!);
        }
      }, HOVER_POPOVER_MS);
    } else if (!nextSegment && this.hoverSegment) {
      this.hoverSegment = null;
      this.cancelarHoverPopover();
    }
  }

  protected onMouseLeave(): void {
    this.hoverSegment = null;
    this.cancelarHoverPopover();
    this.programarCierre();
  }

  /**
   * Centra la flecha del popover bajo el segmento ancla. PrimeNG la ancla al borde izquierdo del
   * target y le resta `2 * border-radius`, con lo que termina saliendo del control; aqui se reubica al
   * centro del boton. `onShow` corre despues del `align()` interno, asi que este override gana.
   *
   * OJO: la animacion de entrada del popover aplica `transform: scale(.93)`, asi que medir el panel
   * con `getBoundingClientRect()` durante `onShow` da una caja encogida y descentra la flecha. Se usa
   * geometria de layout (`offsetLeft`, ajeno al transform) para el panel; el boton no se anima, asi
   * que su rect si es fiable (llevado a coordenadas de documento con el scroll).
   */
  protected centrarFlecha(): void {
    this.ajustarPopoverDiferido();
  }

  private ajustarPopoverDiferido(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.ajustarPopover());
    });
  }

  private ajustarPopover(): void {
    const container = (this.dayPopover() as { container?: HTMLElement }).container;
    const target = this.botonDia();
    if (!container || !target) {
      return;
    }
    this.posicionarPopover(container, target);
    const boton = target.getBoundingClientRect();
    const centroBotonDoc = boton.left + window.scrollX + boton.width / 2;
    const left = centroBotonDoc - this.leftEnDocumento(container);
    container.style.setProperty('--p-popover-arrow-offset', '0px');
    container.style.setProperty('--p-popover-arrow-left', `${left}px`);
  }

  private posicionarPopover(container: HTMLElement, target: HTMLElement): void {
    const margen = 8;
    const boton = target.getBoundingClientRect();
    const ancho = container.offsetWidth;
    const alto = container.offsetHeight;
    const minLeft = window.scrollX + margen;
    const maxLeft = window.scrollX + window.innerWidth - ancho - margen;
    const left = this.clamp(boton.left + window.scrollX + boton.width / 2 - ancho / 2, minLeft, maxLeft);
    const topAbajo = boton.bottom + window.scrollY + margen;
    const topArriba = boton.top + window.scrollY - alto - margen;
    const maxBottom = window.scrollY + window.innerHeight - margen;
    const top = topAbajo + alto <= maxBottom ? topAbajo : Math.max(window.scrollY + margen, topArriba);
    container.style.left = `${left}px`;
    container.style.top = `${top}px`;
  }

  private botonDia(): HTMLElement | null {
    if (this.botonAncla?.isConnected) {
      return this.botonAncla;
    }
    const boton = this.host.nativeElement.querySelector('.p-togglebutton') as HTMLElement | null;
    this.botonAncla = boton;
    return boton;
  }

  /** Posicion X del borde del elemento en coordenadas de documento, sumando `offsetLeft` (sin transform). */
  private leftEnDocumento(el: HTMLElement): number {
    let x = 0;
    let node: HTMLElement | null = el;
    while (node) {
      x += node.offsetLeft;
      node = node.offsetParent as HTMLElement | null;
    }
    return x;
  }

  /**
   * Cada clic en el calendario (modo rango) llega aqui. El datepicker entrega `[inicio]` en el primer
   * clic y `[inicio, fin]` en el segundo:
   *  - Primer clic: se emite el dia suelto (`desde === hasta`) y se deja el calendario ABIERTO para
   *    poder extenderlo a un rango.
   *  - Segundo clic: se emite el rango normalizado (menor→mayor) y se cierra.
   */
  protected onPickRange(dates: Array<Date | null> | null): void {
    const inicio = dates?.[0];
    if (!inicio) {
      return;
    }
    if (this.periodo() !== 'dia') {
      this.periodoChange.emit('dia');
    }

    const fin = dates?.[1];
    if (!fin) {
      const dia = this.formatLocal(inicio);
      this.rangoChange.emit({ desde: dia, hasta: dia });
      return;
    }

    const [desde, hasta] = inicio <= fin ? [inicio, fin] : [fin, inicio];
    this.rangoChange.emit({ desde: this.formatLocal(desde), hasta: this.formatLocal(hasta) });
    this.cerrar();
  }

  /** Seleccion de un mes desde el picker: emite como rango dia (1..ultimo dia del mes). */
  protected onPickMonth(date: Date | null): void {
    if (!date) {
      return;
    }
    const year = date.getFullYear();
    const month = date.getMonth();
    const desde = this.formatLocal(new Date(year, month, 1));
    const hasta = this.formatLocal(new Date(year, month + 1, 0));

    if (this.periodo() !== 'dia') {
      this.periodoChange.emit('dia');
    }
    this.rangoChange.emit({ desde, hasta });
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
    this.cancelarHoverPopover();
    this.hoverSegment = null;
    this.dayPopover().hide();
  }

  private cancelarHoverPopover(): void {
    if (this.hoverPopoverTimer) {
      clearTimeout(this.hoverPopoverTimer);
      this.hoverPopoverTimer = null;
    }
  }

  private abrirDiaPicker(target: HTMLElement): void {
    this.cancelarCierre();
    this.botonAncla = target;
    this.popoverMode.set('day');
    this.syncCalendarModel();
    this.dayPopover().show(new MouseEvent('click'), target);
    this.ajustarPopoverDiferido();
  }

  private abrirMesPicker(target: HTMLElement): void {
    this.cancelarCierre();
    this.popoverMode.set('month');
    this.monthModel.set(new Date());
    this.botonAncla = target;
    this.dayPopover().show(new MouseEvent('click'), target);
    this.ajustarPopoverDiferido();
  }

  private syncCalendarModel(): void {
    const desde = this.parse(this.dia() || this.hoy);
    const hastaIso = this.hasta();
    if (!hastaIso || hastaIso === (this.dia() || this.hoy)) {
      this.calendarModel.set([desde, null]);
    } else {
      this.calendarModel.set([desde, this.parse(hastaIso)]);
    }
  }

  private emitirHoy(): void {
    if (this.periodo() !== 'dia') {
      this.periodoChange.emit('dia');
    }
    this.rangoChange.emit({ desde: this.hoy, hasta: this.hoy });
  }

  private emitirSemanaHastaHoy(): void {
    if (this.periodo() !== 'dia') {
      this.periodoChange.emit('dia');
    }
    this.rangoChange.emit({ desde: this.inicioSemanaOperativa(), hasta: this.hoy });
  }

  private formatLocal(date: Date): string {
    const mes = `${date.getMonth() + 1}`.padStart(2, '0');
    const dia = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${mes}-${dia}`;
  }

  private parse(iso: string): Date {
    const [anio, mes, numero] = iso.split('-').map(Number);
    return new Date(anio, mes - 1, numero);
  }

  private inicioSemanaOperativa(): string {
    const hoy = new Date();
    const diasDesdeSabado = (hoy.getDay() - 6 + 7) % 7;
    return this.formatLocal(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - diasDesdeSabado));
  }

  private clamp(value: number, min: number, max: number): number {
    if (max < min) {
      return min;
    }
    return Math.min(Math.max(value, min), max);
  }

  /** `2026-08-24` → `24 ago`. */
  private fechaCorta(iso: string): string {
    const [, mes, numero] = iso.split('-');
    return `${Number(numero)} ${MESES[Number(mes) - 1]}`;
  }
}
