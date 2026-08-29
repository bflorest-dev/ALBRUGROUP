import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup } from '@angular/forms';
import { finalize } from 'rxjs';
import { EquiposNavService } from '../../../core/services/equipos-nav.service';
import {
  EventoResponse,
  LeadDatosPreventaRequest,
  LeadDetalleResponse,
  LeadDireccionRequest,
  PageQuery
} from '../../../shared/models/preventa/preventa.models';
import {
  BitacoraAccion,
  BitacoraBusquedaResponse,
  BitacoraFieldChange,
  BitacoraIdentidadRequest
} from '../models/bitacora.models';
import { BitacoraService } from '../services/bitacora.service';

export type BitacoraTab = 'datos' | 'direccion' | 'oferta' | 'historial';

const IDENTIDAD_LABELS: Record<string, string> = {
  prefijo: 'Prefijo',
  lead: 'Teléfono (lead)',
  usermeta: 'Usermeta'
};

const DATOS_LABELS: Record<string, string> = {
  tipoDocumento: 'Tipo de documento',
  numeroDocumentoTitularServicio: 'N.º documento',
  ubigeoNacimiento: 'Ubigeo nacimiento',
  nombreTitularServicio: 'Nombre del titular',
  celularRegistro: 'Celular registro',
  celularReferencia: 'Celular referencia',
  correo: 'Correo',
  nombreMadre: 'Nombre de la madre',
  nombrePadre: 'Nombre del padre',
  numeroDocumentoTitularCelularRegistro: 'Doc. titular del celular',
  nombreTitularCelularRegistro: 'Nombre titular del celular'
};

const DIRECCION_LABELS: Record<string, string> = {
  ubigeoDomicilio: 'Ubigeo domicilio',
  tipoDomicilio: 'Tipo de domicilio',
  tipoVia: 'Tipo de vía',
  via: 'Vía',
  direccion: 'Dirección',
  referencia: 'Referencia',
  latitud: 'Latitud',
  longitud: 'Longitud',
  urbanizacion: 'Urbanización',
  numero: 'Número',
  manzana: 'Manzana',
  lote: 'Lote',
  nombreEdificio: 'Edificio',
  nombreCondominio: 'Condominio',
  plano: 'Plano',
  piso: 'Piso',
  interior: 'Interior'
};

const HISTORIAL_QUERY: PageQuery = { pageNumber: 0, pageSize: 100, sortBy: 'createdAt', direction: 'desc' };

/**
 * Orquesta la Bitácora (tab ADMIN de corrección de leads): buscador total, apertura del expediente,
 * edición staged de Datos preventa y Dirección, marcado de eventos a eliminar en el historial, y el
 * submit atómico que deja un único evento CORRECCION. Provista a nivel de la página (estado por vista).
 */
@Injectable()
export class BitacoraFacade {
  private readonly service = inject(BitacoraService);
  private readonly fb = inject(FormBuilder);
  private readonly equiposNav = inject(EquiposNavService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Búsqueda ──────────────────────────────────────────
  readonly termino = signal('');
  readonly buscando = signal(false);
  readonly resultados = signal<BitacoraBusquedaResponse[]>([]);
  readonly busquedaHecha = signal(false);

  // ── Expediente / drawer ───────────────────────────────
  readonly drawerAbierto = signal(false);
  readonly cargandoDetalle = signal(false);
  readonly detalle = signal<LeadDetalleResponse | null>(null);
  readonly tab = signal<BitacoraTab>('datos');
  readonly guardando = signal(false);
  readonly guardadoOk = signal(false);
  readonly error = signal<string | null>(null);

  readonly identidadForm: FormGroup = this.fb.group({
    prefijo: [''],
    lead: [''],
    usermeta: ['']
  });

  readonly datosForm: FormGroup = this.fb.group({
    tipoDocumento: [''],
    numeroDocumentoTitularServicio: [''],
    ubigeoNacimiento: [''],
    nombreTitularServicio: [''],
    celularRegistro: [''],
    celularReferencia: [''],
    correo: [''],
    nombreMadre: [''],
    nombrePadre: [''],
    numeroDocumentoTitularCelularRegistro: [''],
    nombreTitularCelularRegistro: ['']
  });

  readonly direccionForm: FormGroup = this.fb.group({
    ubigeoDomicilio: [''],
    tipoDomicilio: [''],
    tipoVia: [''],
    via: [''],
    direccion: [''],
    referencia: [''],
    latitud: [''],
    longitud: [''],
    urbanizacion: [''],
    numero: [''],
    manzana: [''],
    lote: [''],
    nombreEdificio: [''],
    nombreCondominio: [''],
    plano: [''],
    piso: [''],
    interior: ['']
  });

  private readonly identidadOriginal = signal<Record<string, string>>({});
  private readonly identidadValues = signal<Record<string, string>>({});
  private readonly datosOriginal = signal<Record<string, string>>({});
  private readonly direccionOriginal = signal<Record<string, string>>({});
  private readonly datosValues = signal<Record<string, string>>({});
  private readonly direccionValues = signal<Record<string, string>>({});

  // ── Historial ─────────────────────────────────────────
  readonly filtroAccion = signal<BitacoraAccion | null>('TIPIFICACION');
  readonly cargandoHistorial = signal(false);
  readonly eventos = signal<EventoResponse[]>([]);
  readonly historialTotal = signal(0);
  /** Eventos marcados para eliminar (snapshot completo, para poder listarlos en el acta). */
  readonly marcadosEventos = signal<EventoResponse[]>([]);

  // ── Diffs / tally ─────────────────────────────────────
  readonly camposModificados = computed<BitacoraFieldChange[]>(() => [
    ...this.diffGrupo(this.identidadOriginal(), this.identidadValues(), IDENTIDAD_LABELS),
    ...this.diffGrupo(this.datosOriginal(), this.datosValues(), DATOS_LABELS),
    ...this.diffGrupo(this.direccionOriginal(), this.direccionValues(), DIRECCION_LABELS)
  ]);
  readonly fieldCount = computed(() => this.camposModificados().length);
  readonly evtCount = computed(() => this.marcadosEventos().length);
  readonly hayCambios = computed(() => this.fieldCount() > 0 || this.evtCount() > 0);

  private readonly equiposMap = computed(() => {
    const map = new Map<number, string>();
    for (const team of this.equiposNav.activeTeams()) {
      map.set(team.id, team.nombre);
    }
    return map;
  });

  constructor() {
    this.identidadForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.identidadValues.set(this.normalizeRecord(value)));
    this.datosForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.datosValues.set(this.normalizeRecord(value)));
    this.direccionForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.direccionValues.set(this.normalizeRecord(value)));
  }

  start(): void {
    this.equiposNav.ensureLoaded();
  }

  nombreEquipo(idEquipo?: number | null): string {
    if (idEquipo === null || idEquipo === undefined) {
      return 'Sin equipo';
    }
    return this.equiposMap().get(idEquipo) ?? `Equipo #${idEquipo}`;
  }

  // ── Búsqueda ──────────────────────────────────────────
  buscar(termino: string): void {
    const limpio = (termino ?? '').trim();
    this.termino.set(termino);
    if (!limpio) {
      this.resultados.set([]);
      this.busquedaHecha.set(false);
      return;
    }
    this.buscando.set(true);
    this.service
      .buscar(limpio)
      .pipe(finalize(() => this.buscando.set(false)))
      .subscribe({
        next: (filas) => {
          this.resultados.set(filas);
          this.busquedaHecha.set(true);
        },
        error: () => {
          this.resultados.set([]);
          this.busquedaHecha.set(true);
        }
      });
  }

  // ── Expediente ────────────────────────────────────────
  abrirLead(idLead: number): void {
    this.drawerAbierto.set(true);
    this.tab.set('datos');
    this.cargandoDetalle.set(true);
    this.detalle.set(null);
    this.guardadoOk.set(false);
    this.error.set(null);
    this.limpiarStaged();
    this.service
      .obtenerDetalle(idLead)
      .pipe(finalize(() => this.cargandoDetalle.set(false)))
      .subscribe({
        next: (detalle) => {
          this.detalle.set(detalle);
          this.patchForms(detalle);
        },
        error: () => this.error.set('No se pudo cargar el expediente.')
      });
    this.recargarHistorial(idLead);
  }

  cerrarDrawer(): void {
    this.drawerAbierto.set(false);
  }

  setTab(tab: BitacoraTab): void {
    this.tab.set(tab);
  }

  // ── Historial ─────────────────────────────────────────
  setFiltro(accion: BitacoraAccion | null): void {
    this.filtroAccion.set(accion);
    const id = this.detalle()?.id;
    if (id) {
      this.recargarHistorial(id);
    }
  }

  private recargarHistorial(idLead: number): void {
    this.cargandoHistorial.set(true);
    this.service
      .listarHistorial(idLead, HISTORIAL_QUERY, this.filtroAccion())
      .pipe(finalize(() => this.cargandoHistorial.set(false)))
      .subscribe({
        next: (page) => {
          this.eventos.set(page.content ?? []);
          this.historialTotal.set(page.totalElements ?? 0);
        },
        error: () => {
          this.eventos.set([]);
          this.historialTotal.set(0);
        }
      });
  }

  toggleEliminarEvento(evento: EventoResponse): void {
    const actuales = this.marcadosEventos();
    this.marcadosEventos.set(
      actuales.some((e) => e.id === evento.id)
        ? actuales.filter((e) => e.id !== evento.id)
        : [...actuales, evento]
    );
  }

  estaMarcado(idEvento: number): boolean {
    return this.marcadosEventos().some((e) => e.id === idEvento);
  }

  // ── Guardar / descartar ───────────────────────────────
  descartar(): void {
    const detalle = this.detalle();
    if (detalle) {
      this.patchForms(detalle);
    }
    this.marcadosEventos.set([]);
  }

  guardar(motivo?: string): void {
    const detalle = this.detalle();
    if (!detalle || !this.hayCambios() || this.guardando()) {
      return;
    }

    const identidadCambio = this.grupoTieneCambios(this.identidadOriginal(), this.identidadValues());
    const datosCambio = this.grupoTieneCambios(this.datosOriginal(), this.datosValues());
    const direccionCambio = this.grupoTieneCambios(this.direccionOriginal(), this.direccionValues());

    const identidad = identidadCambio ? (this.identidadForm.getRawValue() as BitacoraIdentidadRequest) : null;
    const datosPreventa = datosCambio ? (this.datosForm.getRawValue() as LeadDatosPreventaRequest) : null;
    const direccion = direccionCambio ? (this.direccionForm.getRawValue() as LeadDireccionRequest) : null;

    this.guardando.set(true);
    this.error.set(null);
    this.service
      .aplicarCorreccion(detalle.id, {
        identidad,
        datosPreventa,
        direccion,
        ofertaComercial: null,
        idsEventosAEliminar: this.marcadosEventos().map((e) => e.id),
        motivo: motivo?.trim() || null,
        resumenCambios: this.construirResumen()
      })
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: (actualizado) => {
          this.detalle.set(actualizado);
          this.patchForms(actualizado);
          this.marcadosEventos.set([]);
          this.guardadoOk.set(true);
          this.recargarHistorial(actualizado.id);
        },
        error: () => this.error.set('No se pudo aplicar la corrección. Revisa los datos e inténtalo de nuevo.')
      });
  }

  private construirResumen(): string {
    const campos = this.camposModificados().map((c) => c.label);
    const partes: string[] = [];
    if (campos.length) {
      partes.push(`Campos: ${campos.join(', ')}`);
    }
    if (this.evtCount() > 0) {
      partes.push(`${this.evtCount()} evento${this.evtCount() === 1 ? '' : 's'} eliminado${this.evtCount() === 1 ? '' : 's'}`);
    }
    return partes.join(' · ') || 'Corrección integral del lead';
  }

  // ── Helpers de forms / diff ───────────────────────────
  private patchForms(detalle: LeadDetalleResponse): void {
    const identidad = {
      prefijo: detalle.prefijo ?? '',
      lead: detalle.lead ?? '',
      usermeta: detalle.usermeta ?? ''
    };
    const datos = {
      tipoDocumento: detalle.tipoDocumento ?? '',
      numeroDocumentoTitularServicio: detalle.numeroDocumentoTitularServicio ?? '',
      ubigeoNacimiento: detalle.ubigeoNacimiento ?? '',
      nombreTitularServicio: detalle.nombreTitular ?? '',
      celularRegistro: detalle.celularRegistro ?? '',
      celularReferencia: detalle.celularReferencia ?? '',
      correo: detalle.correo ?? '',
      nombreMadre: detalle.nombreMadre ?? '',
      nombrePadre: detalle.nombrePadre ?? '',
      numeroDocumentoTitularCelularRegistro: detalle.numeroDocumentoTitularCelularRegistro ?? '',
      nombreTitularCelularRegistro: detalle.nombreTitularCelularRegistro ?? ''
    };
    const direccion = {
      ubigeoDomicilio: detalle.ubigeoDomicilio ?? '',
      tipoDomicilio: detalle.tipoDomicilio ?? '',
      tipoVia: detalle.tipoVia ?? '',
      via: detalle.via ?? '',
      direccion: detalle.direccion ?? '',
      referencia: detalle.referencia ?? '',
      latitud: detalle.latitud ?? '',
      longitud: detalle.longitud ?? '',
      urbanizacion: detalle.urbanizacion ?? '',
      numero: detalle.numero ?? '',
      manzana: detalle.manzana ?? '',
      lote: detalle.lote ?? '',
      nombreEdificio: detalle.nombreEdificio ?? '',
      nombreCondominio: detalle.nombreCondominio ?? '',
      plano: detalle.plano ?? '',
      piso: detalle.piso ?? '',
      interior: detalle.interior ?? ''
    };
    this.identidadForm.reset(identidad, { emitEvent: false });
    this.datosForm.reset(datos, { emitEvent: false });
    this.direccionForm.reset(direccion, { emitEvent: false });
    this.identidadOriginal.set(this.normalizeRecord(identidad));
    this.datosOriginal.set(this.normalizeRecord(datos));
    this.direccionOriginal.set(this.normalizeRecord(direccion));
    this.identidadValues.set(this.normalizeRecord(identidad));
    this.datosValues.set(this.normalizeRecord(datos));
    this.direccionValues.set(this.normalizeRecord(direccion));
  }

  private originalDe(grupo: 'identidad' | 'datos' | 'direccion'): Record<string, string> {
    if (grupo === 'identidad') return this.identidadOriginal();
    return grupo === 'datos' ? this.datosOriginal() : this.direccionOriginal();
  }

  private valuesDe(grupo: 'identidad' | 'datos' | 'direccion'): Record<string, string> {
    if (grupo === 'identidad') return this.identidadValues();
    return grupo === 'datos' ? this.datosValues() : this.direccionValues();
  }

  campoModificado(grupo: 'identidad' | 'datos' | 'direccion', control: string): boolean {
    return (this.originalDe(grupo)[control] ?? '') !== (this.valuesDe(grupo)[control] ?? '');
  }

  valorOriginal(grupo: 'identidad' | 'datos' | 'direccion', control: string): string {
    return this.originalDe(grupo)[control] ?? '';
  }

  private diffGrupo(
    original: Record<string, string>,
    actual: Record<string, string>,
    labels: Record<string, string>
  ): BitacoraFieldChange[] {
    const cambios: BitacoraFieldChange[] = [];
    for (const control of Object.keys(labels)) {
      const antes = original[control] ?? '';
      const despues = actual[control] ?? '';
      if (antes !== despues) {
        cambios.push({ label: labels[control], antes: antes || '—', despues: despues || '—' });
      }
    }
    return cambios;
  }

  private grupoTieneCambios(original: Record<string, string>, actual: Record<string, string>): boolean {
    return Object.keys(actual).some((k) => (original[k] ?? '') !== (actual[k] ?? ''));
  }

  private normalizeRecord(value: Record<string, unknown>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const key of Object.keys(value)) {
      const v = value[key];
      out[key] = v === null || v === undefined ? '' : String(v).trim();
    }
    return out;
  }

  private limpiarStaged(): void {
    this.marcadosEventos.set([]);
    this.identidadOriginal.set({});
    this.identidadValues.set({});
    this.datosOriginal.set({});
    this.direccionOriginal.set({});
    this.datosValues.set({});
    this.direccionValues.set({});
  }
}
