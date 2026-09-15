import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  input,
  signal,
  viewChild
} from '@angular/core';

export interface ProyeccionBannerData {
  instaladas: number;
  diasTranscurridos: number;
  diasTotales: number;
}

@Component({
  selector: 'app-top-banner',
  templateUrl: './top-banner.component.html',
  styleUrl: './top-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBannerComponent implements OnDestroy {
  readonly title = input('');
  readonly detail = input('');
  readonly context = input('');
  readonly icon = input('ti ti-layout-dashboard');
  readonly proyeccion = input<ProyeccionBannerData | null>(null);

  protected readonly instaladasSeg = viewChild<ElementRef<HTMLElement>>('instaladasSeg');
  protected readonly chipLeft = signal<string>('50%');

  private ro: ResizeObserver | null = null;

  protected readonly hasContent = computed(() =>
    Boolean(this.title() || this.detail() || this.context())
  );

  protected readonly hasProyeccion = computed(() => {
    const p = this.proyeccion();
    return p != null && p.instaladas > 0;
  });

  protected readonly proyectadas = computed(() => {
    const p = this.proyeccion();
    if (!p || p.diasTranscurridos === 0) return 0;
    const promedio = p.instaladas / p.diasTranscurridos;
    const diasRestantes = p.diasTotales - p.diasTranscurridos;
    return Math.ceil(promedio * diasRestantes);
  });

  protected readonly totalProyectado = computed(() => {
    const p = this.proyeccion();
    return (p?.instaladas ?? 0) + this.proyectadas();
  });

  protected readonly flexInstaladas = computed(() => {
    const p = this.proyeccion();
    return p?.diasTranscurridos ?? 1;
  });

  protected readonly flexProyectadas = computed(() => {
    const p = this.proyeccion();
    if (!p) return 1;
    return p.diasTotales - p.diasTranscurridos;
  });

  constructor() {
    effect(() => {
      const segRef = this.instaladasSeg();
      this.ro?.disconnect();
      if (!segRef) {
        this.chipLeft.set('50%');
        return;
      }
      const el = segRef.nativeElement;
      this.ro = new ResizeObserver(() => {
        this.chipLeft.set(`${el.offsetWidth}px`);
      });
      this.ro.observe(el);
      this.chipLeft.set(`${el.offsetWidth}px`);
    });
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
  }
}
