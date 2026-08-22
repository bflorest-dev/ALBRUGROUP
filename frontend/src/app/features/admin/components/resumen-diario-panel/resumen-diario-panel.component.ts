import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { MetricsPeriodo } from '../../../../shared/components/period-selector/period-selector.component';
import { resolveMetricsRange } from '../../../../shared/utils/metrics-period';
import { GestionCampoTipi, GestionModo } from '../../services/admin-gestion-campana.service';
import { PreventaDetalle, ResumenDiarioService } from '../../services/resumen-diario.service';
import { ResumenDiarioFacade } from '../../facades/resumen-diario.facade';

/**
 * Panel RESUMEN DIARIO del DASHBOARD de PREVENTA: las 4 tablas del reporte diario como un poster
 * capturable, para un equipo. Provee su propio facade (bloque autónomo) y proyecta los controles
 * compartidos del dashboard por `ng-content`.
 */
@Component({
  selector: 'app-resumen-diario-panel',
  imports: [DecimalPipe, DialogModule, MessageModule],
  providers: [ResumenDiarioFacade],
  templateUrl: './resumen-diario-panel.component.html',
  styleUrl: './resumen-diario-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResumenDiarioPanelComponent implements OnInit {
  protected readonly facade = inject(ResumenDiarioFacade);
  private readonly detalleService = inject(ResumenDiarioService);

  // Modal de detalle de preventas (drill-down de los contadores de los cards).
  protected readonly detalleVisible = signal(false);
  protected readonly detalleLoading = signal(false);
  protected readonly detalleError = signal(false);
  protected readonly detalle = signal<PreventaDetalle[]>([]);
  private readonly detalleModo = signal<GestionModo>('GESTIONADOS');

  /** Card del que se abrió el detalle (para el subtítulo del modal). */
  protected readonly detalleCard = computed(() =>
    this.detalleModo() === 'INGRESADOS' ? 'Ingresos del día' : 'Gestión del día'
  );

  readonly externalControls = input(false);
  readonly idEquipo = input<number | null>(null);
  readonly teamScoped = input(false);
  readonly periodo = input<MetricsPeriodo | null>(null);
  readonly dia = input<string | null>(null);
  readonly modo = input<GestionModo | null>(null);
  readonly campo = input<GestionCampoTipi | null>(null);

  private static readonly MESES = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
  ];

  private static readonly ACCENT_FALLBACK = '#64748b';

  /** Color de marca del equipo (con fallback neutro si el equipo no tiene color). */
  protected readonly teamAccent = computed(
    () => this.facade.equipoInfo()?.color || ResumenDiarioPanelComponent.ACCENT_FALLBACK
  );

  /**
   * Color de texto legible sobre la banda de color del equipo. Se decide por la luminancia percibida
   * (fórmula YIQ): colores claros (naranja WinTeam) → texto oscuro; oscuros (rojo ClaroTeam) → blanco.
   * Así funciona con cualquier color que se asigne a un equipo nuevo.
   */
  protected readonly teamOn = computed(() => {
    const rgb = this.parseHex(this.teamAccent());
    if (!rgb) {
      return '#ffffff';
    }
    const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return yiq >= 150 ? '#1a1005' : '#ffffff';
  });

  private parseHex(hex: string): { r: number; g: number; b: number } | null {
    const clean = hex.replace('#', '').trim();
    if (clean.length !== 6) {
      return null;
    }
    const value = Number.parseInt(clean, 16);
    if (Number.isNaN(value)) {
      return null;
    }
    return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
  }

  protected readonly modoLabel = computed(() =>
    this.modo() === 'INGRESADOS' ? 'Ingresados' : 'Gestionados'
  );

  protected readonly campoLabel = computed(() => {
    switch (this.campo()) {
      case 'PRIMERA':
        return 'Primera';
      case 'ULTIMA':
        return 'Última';
      default:
        return 'Mayor';
    }
  });

  protected readonly fechaLabel = computed(() => {
    const periodo = this.periodo();
    if (periodo === 'semana') {
      return 'Semana operativa';
    }
    if (periodo === 'mes') {
      return 'Mes en curso';
    }
    const dia = this.dia();
    if (!dia) {
      return 'Hoy';
    }
    const [anio, mes, dd] = dia.split('-').map((parte) => Number(parte));
    if (!anio || !mes || !dd) {
      return dia;
    }
    return `${dd} ${ResumenDiarioPanelComponent.MESES[mes - 1]} ${anio}`;
  });

  constructor() {
    effect(() => {
      if (!this.externalControls()) {
        return;
      }
      this.facade.setIdEquipo(this.idEquipo());
      this.facade.setModo(this.modo());
      this.facade.setCampo(this.campo());
      this.facade.setPeriodo(this.periodo());
      const dia = this.dia();
      if (dia) {
        this.facade.setDia(dia);
      }
    });
  }

  ngOnInit(): void {
    this.facade.setIdEquipo(this.idEquipo());
    if (this.modo()) {
      this.facade.setModo(this.modo());
    }
    if (this.campo()) {
      this.facade.setCampo(this.campo());
    }
    if (this.periodo()) {
      this.facade.setPeriodo(this.periodo());
    }
    const dia = this.dia();
    if (dia) {
      this.facade.setDia(dia);
    }
    this.facade.start();
  }

  /** Abre el modal con el detalle de leads detrás del contador de preventas del card indicado. */
  protected async abrirDetalle(modo: GestionModo): Promise<void> {
    this.detalleModo.set(modo);
    this.detalleVisible.set(true);
    this.detalleLoading.set(true);
    this.detalleError.set(false);
    this.detalle.set([]);
    try {
      const range = resolveMetricsRange(this.periodo() ?? 'dia', this.dia());
      const filas = await firstValueFrom(
        this.detalleService.obtenerPreventasDetalle(
          this.idEquipo(),
          modo,
          this.campo() ?? 'MAYOR',
          range.desde,
          range.hasta
        )
      );
      this.detalle.set(filas);
    } catch {
      this.detalleError.set(true);
    } finally {
      this.detalleLoading.set(false);
    }
  }

  /** Hora local (America/Lima) HH:MM de un instante ISO. */
  protected hora(iso: string | null): string {
    if (!iso) {
      return '—';
    }
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) {
      return '—';
    }
    return fecha.toLocaleTimeString('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /** Nombre del asesor recortado a las dos primeras palabras (nombre + primer apellido/segundo nombre). */
  protected asesorCorto(nombre: string | null): string {
    if (!nombre) {
      return '—';
    }
    return nombre.trim().split(/\s+/).slice(0, 2).join(' ');
  }

  /** Rol del actor en versión corta para la tabla. */
  protected rolCorto(rol: string | null): string {
    switch (rol) {
      case 'ASESOR_VENTAS':
        return 'Asesor';
      case 'SUPERVISOR_VENTAS':
        return 'Supervisor';
      case 'ASESOR_GTR':
      case 'SUPERVISOR_GTR':
        return 'GTR';
      case null:
      case undefined:
      case '':
        return '—';
      default:
        return rol;
    }
  }
}
