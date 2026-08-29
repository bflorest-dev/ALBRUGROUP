import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { providerLogo } from '../../../../shared/utils/provider-logo';
import { LeadDetalleResponse, EventoResponse } from '../../../../shared/models/preventa/preventa.models';
import { BitacoraFacade, BitacoraTab } from '../../facades/bitacora.facade';
import { BitacoraAccion, BitacoraBusquedaResponse } from '../../models/bitacora.models';

type FiltroChip = { label: string; accion: BitacoraAccion | null };
type AccionMeta = { cls: string; label: string };

const THEME_KEY = 'bitacora-theme';

const TIPO_DOCUMENTO = ['DNI', 'CE', 'RUC'];
const TIPO_DOMICILIO = ['HOGAR', 'MULTIFAMILIAR', 'CONDOMINIO_EDIFICIO', 'CONDOMINIO_EDIFICIO_NO_HABILITADO'];
const TIPO_VIA = ['AVENIDA', 'JIRON', 'CALLE', 'PASAJE', 'PROLONGACION'];

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

const ACCION_META: Record<string, AccionMeta> = {
  TIPIFICACION: { cls: 'tip', label: 'Tipificación' },
  REGISTRO: { cls: 'reg', label: 'Registro' },
  NUEVA_OPORTUNIDAD: { cls: 'reg', label: 'Nueva oportunidad' },
  ASIGNACION: { cls: 'asig', label: 'Asignación' },
  CONTACTO: { cls: 'asig', label: 'Contacto' },
  ACTUALIZACION_DATOS_PREVENTA: { cls: 'asig', label: 'Actualización de datos' },
  ACTUALIZACION_DIRECCION: { cls: 'asig', label: 'Actualización de dirección' },
  ACTUALIZACION_OFERTA_COMERCIAL: { cls: 'asig', label: 'Actualización de oferta' },
  VALIDACION: { cls: 'asig', label: 'Validación' },
  CORRECCION: { cls: 'corr', label: 'Corrección' }
};

@Component({
  selector: 'app-bitacora-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [BitacoraFacade],
  templateUrl: './bitacora-page.component.html',
  styleUrl: './bitacora-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BitacoraPageComponent implements OnInit {
  protected readonly f = inject(BitacoraFacade);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly pickerControl = new FormControl('', { nonNullable: true });
  protected readonly theme = signal<'light' | 'dark'>('light');
  protected readonly actaAbierta = signal(false);
  protected readonly motivoControl = new FormControl('', { nonNullable: true });

  protected readonly filtros: FiltroChip[] = [
    { label: 'Tipificación', accion: 'TIPIFICACION' },
    { label: 'Registro', accion: 'REGISTRO' },
    { label: 'Asignación', accion: 'ASIGNACION' },
    { label: 'Corrección', accion: 'CORRECCION' },
    { label: 'Todo', accion: null }
  ];

  protected readonly tipoDocumentoOpts = computed(() =>
    this.mergeCurrent(TIPO_DOCUMENTO, this.f.valorOriginal('datos', 'tipoDocumento'))
  );
  protected readonly tipoDomicilioOpts = computed(() =>
    this.mergeCurrent(TIPO_DOMICILIO, this.f.valorOriginal('direccion', 'tipoDomicilio'))
  );
  protected readonly tipoViaOpts = computed(() =>
    this.mergeCurrent(TIPO_VIA, this.f.valorOriginal('direccion', 'tipoVia'))
  );

  ngOnInit(): void {
    this.f.start();
    const stored = this.readStoredTheme();
    this.theme.set(stored ?? (this.prefersDark() ? 'dark' : 'light'));

    this.searchControl.valueChanges
      .pipe(debounceTime(320), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.f.buscar(value));

    this.pickerControl.valueChanges
      .pipe(debounceTime(320), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.f.buscarObjetivo(value));
  }

  protected abrirReestructurar(modo: 'swap' | 'move'): void {
    this.pickerControl.reset('');
    this.f.abrirReestructurar(modo);
  }

  protected sourceSeraHuerfano(): boolean {
    return (this.f.cluster()?.oportunidades?.length ?? 0) <= 1;
  }

  protected buscarAhora(): void {
    this.f.buscar(this.searchControl.value);
  }

  protected toggleTheme(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* almacenamiento no disponible: el tema vive solo en memoria */
    }
  }

  protected abrir(row: BitacoraBusquedaResponse): void {
    this.f.abrirLead(row.idLead);
  }

  protected setTab(tab: BitacoraTab): void {
    this.f.setTab(tab);
  }

  protected setFiltro(accion: BitacoraAccion | null): void {
    this.f.setFiltro(accion);
  }

  protected abrirActa(): void {
    if (!this.f.hayCambios()) {
      return;
    }
    this.motivoControl.reset('');
    this.actaAbierta.set(true);
  }

  protected cerrarActa(): void {
    this.actaAbierta.set(false);
  }

  protected confirmarCorreccion(): void {
    this.actaAbierta.set(false);
    this.f.guardar(this.motivoControl.value);
  }

  // ── Presentación ──────────────────────────────────────
  protected logo(nombreProveedor?: string | null): string | null {
    return providerLogo(nombreProveedor);
  }

  protected monograma(nombreProveedor?: string | null): string {
    const n = (nombreProveedor ?? '').trim();
    return n ? n.slice(0, 5).toUpperCase() : '—';
  }

  protected provClase(nombreProveedor?: string | null): string {
    const n = (nombreProveedor ?? '').trim().toUpperCase();
    if (n === 'WIN') return 'win';
    if (n === 'CLARO') return 'claro';
    return 'none';
  }

  protected etapaClase(etapa?: string | null): string {
    switch ((etapa ?? '').toUpperCase()) {
      case 'PREVENTA':
        return 'prev';
      case 'VENTA':
        return 'venta';
      case 'POSTVENTA':
        return 'post';
      case 'COBRANZA':
        return 'cob';
      default:
        return 'prev';
    }
  }

  protected accionMeta(accion?: string | null): AccionMeta {
    return ACCION_META[(accion ?? '').toUpperCase()] ?? { cls: 'asig', label: accion ?? 'Evento' };
  }

  protected esCorreccion(evento: EventoResponse): boolean {
    return (evento.accion ?? '').toUpperCase() === 'CORRECCION';
  }

  protected eventoTitulo(evento: EventoResponse): string {
    if (evento.tipificacion) {
      return evento.subtipificacion ? `${evento.tipificacion} · ${evento.subtipificacion}` : evento.tipificacion;
    }
    return this.accionMeta(evento.accion).label;
  }

  protected eventoDetalle(evento: EventoResponse): string {
    return evento.comentario ?? '';
  }

  protected fecha(iso?: string | null): string {
    const d = this.parse(iso);
    if (!d) return '—';
    return `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
  }

  protected fechaHora(iso?: string | null): string {
    const d = this.parse(iso);
    if (!d) return '—';
    return `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]} · ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  }

  protected nombresAdicionales(detalle: LeadDetalleResponse): string {
    return (detalle.adicionales ?? [])
      .map((a) => a.nombreAdicional)
      .filter((n): n is string => !!n)
      .join(' · ');
  }

  protected soles(valor?: number | null): string {
    if (valor === null || valor === undefined) return '—';
    return `S/ ${valor.toFixed(2)}`;
  }

  private parse(iso?: string | null): Date | null {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private mergeCurrent(base: string[], current: string): string[] {
    if (current && !base.includes(current)) {
      return [current, ...base];
    }
    return base;
  }

  private prefersDark(): boolean {
    return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private readStoredTheme(): 'light' | 'dark' | null {
    try {
      const v = localStorage.getItem(THEME_KEY);
      return v === 'light' || v === 'dark' ? v : null;
    } catch {
      return null;
    }
  }
}
