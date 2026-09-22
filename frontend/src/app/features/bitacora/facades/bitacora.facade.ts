import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize, firstValueFrom } from 'rxjs';
import { EquiposNavService } from '../../../core/services/equipos-nav.service';
import {
  EventoResponse,
  LeadDatosPreventaRequest,
  LeadDetalleResponse,
  LeadDireccionRequest,
  LeadOfertaComercialRequest,
  PageQuery,
  PlanResponse,
  UbigeoItem
} from '../../../shared/models/preventa/preventa.models';
import {
  BitacoraAccion,
  BitacoraBusquedaResponse,
  BitacoraContactoCluster,
  BitacoraFieldChange,
  BitacoraIdentidadRequest
} from '../models/bitacora.models';
import { BitacoraService } from '../services/bitacora.service';
import {
  coordenadaValidator,
  documentoValidator,
  extraerParCoordenadas,
  limpiarCoordenada,
  limpiarDocumento,
  limpiarNombrePersona,
  limpiarPrefijo,
  limpiarTelefonoPorPrefijo,
  limpiarTextoDireccion,
  limpiarUsermeta,
  prefijoValidator,
  soloDigitos,
  telefonoValidator
} from '../utils/bitacora-input.rules';

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
  celularGrabacion: 'Celular grabación',
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

const OFERTA_LABELS: Record<string, string> = {
  idPlan: 'Plan'
};

const HISTORIAL_QUERY: PageQuery = { pageNumber: 0, pageSize: 100, sortBy: 'createdAt', direction: 'desc' };

/**
 * Orquesta la Bitácora (tab ADMIN de corrección de leads): buscador total, apertura del expediente,
 * edición staged de Datos preventa, Dirección y Plan, marcado de eventos a eliminar en el historial, y el
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

  // Contacto (identidad) del lead abierto + sus oportunidades (para advertencia multi-lead y pickers).
  readonly cluster = signal<BitacoraContactoCluster | null>(null);
  readonly esMultiLead = computed(() => (this.cluster()?.oportunidades?.length ?? 0) > 1);
  readonly hermanas = computed(() => {
    const idActual = this.detalle()?.id;
    return (this.cluster()?.oportunidades ?? []).filter((o) => o.id !== idActual);
  });

  // Reestructuración (intercambiar leads / mover lead) desde el drawer.
  readonly modoReestructurar = signal<'none' | 'swap' | 'move'>('none');
  readonly pickerBuscando = signal(false);
  readonly pickerResultados = signal<BitacoraBusquedaResponse[]>([]);
  readonly objetivo = signal<BitacoraBusquedaResponse | null>(null);
  readonly procesandoReestructura = signal(false);
  readonly reestructuraMsg = signal<string | null>(null);

  // Limpiar datos del expediente (DatosPreventa + Dirección).
  readonly confirmandoLimpiar = signal(false);
  readonly procesandoLimpiar = signal(false);

  readonly identidadForm: FormGroup = this.fb.group({
    prefijo: ['51'],
    lead: [''],
    usermeta: ['']
  });

  readonly datosForm: FormGroup = this.fb.group({
    tipoDocumento: [''],
    numeroDocumentoTitularServicio: [''],
    ubigeoNacimiento: [''],
    idDepartamentoNacimiento: [null as number | null],
    idProvinciaNacimiento: [null as number | null],
    idDistritoNacimiento: [null as number | null],
    nombreTitularServicio: [''],
    celularRegistro: [''],
    celularReferencia: [''],
    celularGrabacion: [''],
    correo: [''],
    nombreMadre: [''],
    nombrePadre: [''],
    numeroDocumentoTitularCelularRegistro: [''],
    nombreTitularCelularRegistro: ['']
  });

  readonly direccionForm: FormGroup = this.fb.group({
    ubigeoDomicilio: [''],
    idDepartamentoDomicilio: [null as number | null],
    idProvinciaDomicilio: [null as number | null],
    idDistritoDomicilio: [null as number | null],
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

  readonly ofertaForm: FormGroup = this.fb.group({
    idPlan: [null as number | null]
  });

  private readonly identidadOriginal = signal<Record<string, string>>({});
  private readonly identidadValues = signal<Record<string, string>>({});
  private readonly datosOriginal = signal<Record<string, string>>({});
  private readonly direccionOriginal = signal<Record<string, string>>({});
  private readonly ofertaOriginal = signal<Record<string, string>>({});
  private readonly datosValues = signal<Record<string, string>>({});
  private readonly direccionValues = signal<Record<string, string>>({});
  private readonly ofertaValues = signal<Record<string, string>>({});
  readonly planes = signal<PlanResponse[]>([]);
  readonly cargandoPlanes = signal(false);
  readonly errorPlanes = signal<string | null>(null);
  readonly planesDisponibles = computed(() => {
    const detalle = this.detalle();
    const proveedores = new Set((detalle?.proveedoresEquipo ?? []).map((item) => item.id));
    const idPlanActual = detalle?.idPlan ?? null;
    return this.planes().filter((plan) =>
      plan.id === idPlanActual || (plan.idProveedor != null && (!proveedores.size || proveedores.has(plan.idProveedor)))
    );
  });
  readonly planSeleccionado = computed(() => {
    this.ofertaValues();
    const idPlan = this.ofertaForm.controls['idPlan'].value;
    return this.planesDisponibles().find((plan) => plan.id === idPlan) ?? null;
  });
  readonly departamentos = signal<UbigeoItem[]>([]);
  readonly provinciasNacimiento = signal<UbigeoItem[]>([]);
  readonly distritosNacimiento = signal<UbigeoItem[]>([]);
  readonly provinciasDomicilio = signal<UbigeoItem[]>([]);
  readonly distritosDomicilio = signal<UbigeoItem[]>([]);
  readonly cargandoDepartamentos = signal(false);
  readonly cargandoUbigeoNacimiento = signal(false);
  readonly cargandoUbigeoDomicilio = signal(false);
  readonly errorUbigeoNacimiento = signal<string | null>(null);
  readonly errorUbigeoDomicilio = signal<string | null>(null);
  private nacimientoResolveSeq = 0;
  private domicilioResolveSeq = 0;
  private departamentosPromise: Promise<UbigeoItem[]> | null = null;

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
    ...this.diffGrupo(this.direccionOriginal(), this.direccionValues(), DIRECCION_LABELS),
    ...this.diffGrupo(this.ofertaOriginal(), this.ofertaValues(), OFERTA_LABELS)
  ]);
  readonly fieldCount = computed(() => this.camposModificados().length);
  readonly evtCount = computed(() => this.marcadosEventos().length);
  readonly identidadTocada = computed(() => this.grupoTieneCambios(this.identidadOriginal(), this.identidadValues()));
  readonly hayCambios = computed(() => this.fieldCount() > 0 || this.evtCount() > 0);

  private readonly equiposMap = computed(() => {
    const map = new Map<number, string>();
    for (const team of this.equiposNav.activeTeams()) {
      map.set(team.id, team.nombre);
    }
    return map;
  });

  constructor() {
    this.configurarValidadores();
    this.configurarNormalizadores();
    this.identidadForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.identidadValues.set(this.normalizeRecord(value)));
    this.datosForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.datosValues.set(this.normalizeRecord(value)));
    this.direccionForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.direccionValues.set(this.normalizeRecord(value)));
    this.ofertaForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.ofertaValues.set(this.normalizeRecord(value)));
  }

  private configurarValidadores(): void {
    this.identidadForm.controls['prefijo'].setValidators([prefijoValidator()]);
    this.identidadForm.controls['lead'].setValidators([telefonoValidator(() => this.identidadForm.controls['prefijo'].value)]);
    this.datosForm.controls['numeroDocumentoTitularServicio'].setValidators([
      documentoValidator(() => this.datosForm.controls['tipoDocumento'].value)
    ]);
    for (const campo of ['celularRegistro', 'celularReferencia', 'celularGrabacion']) {
      this.datosForm.controls[campo].setValidators([telefonoValidator(() => this.identidadForm.controls['prefijo'].value)]);
    }
    this.datosForm.controls['numeroDocumentoTitularCelularRegistro'].setValidators([Validators.pattern(/^\d*$/)]);
    this.datosForm.controls['correo'].setValidators([Validators.email]);
    for (const campo of ['nombreTitularServicio', 'nombreTitularCelularRegistro', 'nombreMadre', 'nombrePadre']) {
      this.datosForm.controls[campo].setValidators([Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]*$/)]);
    }
    this.direccionForm.controls['latitud'].setValidators([coordenadaValidator('latitud')]);
    this.direccionForm.controls['longitud'].setValidators([coordenadaValidator('longitud')]);
  }

  private configurarNormalizadores(): void {
    this.normalizarControl(this.identidadForm, 'prefijo', limpiarPrefijo, () => this.normalizarTelefonosPorPrefijo());
    this.normalizarControl(this.identidadForm, 'lead', (value) => this.limpiarTelefonoActual(value));
    this.normalizarControl(this.identidadForm, 'usermeta', limpiarUsermeta);
    this.datosForm.controls['tipoDocumento'].valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.datosForm.controls['numeroDocumentoTitularServicio'].updateValueAndValidity({ emitEvent: false }));
    this.normalizarControl(this.datosForm, 'numeroDocumentoTitularServicio', limpiarDocumento);
    for (const campo of ['celularRegistro', 'celularReferencia', 'celularGrabacion']) {
      this.normalizarControl(this.datosForm, campo, (value) => this.limpiarTelefonoActual(value));
    }
    this.normalizarControl(this.datosForm, 'numeroDocumentoTitularCelularRegistro', (value) => soloDigitos(value, 12));
    for (const campo of ['nombreTitularServicio', 'nombreTitularCelularRegistro', 'nombreMadre', 'nombrePadre']) {
      this.normalizarControl(this.datosForm, campo, limpiarNombrePersona);
    }
    for (const campo of ['via', 'direccion', 'referencia', 'urbanizacion', 'numero', 'manzana', 'lote', 'nombreEdificio', 'nombreCondominio', 'plano', 'piso', 'interior']) {
      this.normalizarControl(this.direccionForm, campo, limpiarTextoDireccion);
    }
    this.normalizarControl(this.direccionForm, 'latitud', limpiarCoordenada);
    this.normalizarControl(this.direccionForm, 'longitud', limpiarCoordenada);
  }

  private normalizarControl(form: FormGroup, nombre: string, limpiar: (value: unknown) => string, despues?: () => void): void {
    const control = form.controls[nombre];
    control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      const limpio = limpiar(value);
      if (value !== limpio) {
        control.setValue(limpio, { emitEvent: false });
      }
      despues?.();
    });
  }

  private limpiarTelefonoActual(value: unknown): string {
    return limpiarTelefonoPorPrefijo(value, this.identidadForm.controls['prefijo'].value);
  }

  private normalizarTelefonosPorPrefijo(): void {
    const lead = this.identidadForm.controls['lead'];
    lead.setValue(this.limpiarTelefonoActual(lead.value), { emitEvent: false });
    lead.updateValueAndValidity({ emitEvent: false });
    for (const campo of ['celularRegistro', 'celularReferencia', 'celularGrabacion']) {
      const control = this.datosForm.controls[campo];
      control.setValue(this.limpiarTelefonoActual(control.value), { emitEvent: false });
      control.updateValueAndValidity({ emitEvent: false });
    }
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

  async cambiarDepartamentoNacimiento(): Promise<void> {
    this.nacimientoResolveSeq++;
    this.cargandoUbigeoNacimiento.set(false);
    const idDepartamento = this.datosForm.controls['idDepartamentoNacimiento'].value;
    this.errorUbigeoNacimiento.set(null);
    this.datosForm.patchValue({ idProvinciaNacimiento: null, idDistritoNacimiento: null, ubigeoNacimiento: '' });
    this.provinciasNacimiento.set([]);
    this.distritosNacimiento.set([]);
    if (idDepartamento) await this.cargarProvincias(idDepartamento, 'nacimiento');
  }

  async cambiarProvinciaNacimiento(): Promise<void> {
    this.nacimientoResolveSeq++;
    this.cargandoUbigeoNacimiento.set(false);
    const idProvincia = this.datosForm.controls['idProvinciaNacimiento'].value;
    this.errorUbigeoNacimiento.set(null);
    this.datosForm.patchValue({ idDistritoNacimiento: null, ubigeoNacimiento: '' });
    this.distritosNacimiento.set([]);
    if (idProvincia) await this.cargarDistritos(idProvincia, 'nacimiento');
  }

  cambiarDistritoNacimiento(): void {
    this.nacimientoResolveSeq++;
    this.cargandoUbigeoNacimiento.set(false);
    const idDistrito = this.datosForm.controls['idDistritoNacimiento'].value;
    const distrito = this.distritosNacimiento().find((item) => item.id === idDistrito);
    this.datosForm.controls['ubigeoNacimiento'].setValue(distrito?.codigo ?? '');
    this.errorUbigeoNacimiento.set(distrito?.codigo ? null : 'Selecciona un distrito válido.');
  }

  async cambiarDepartamentoDomicilio(): Promise<void> {
    this.domicilioResolveSeq++;
    this.cargandoUbigeoDomicilio.set(false);
    const idDepartamento = this.direccionForm.controls['idDepartamentoDomicilio'].value;
    this.errorUbigeoDomicilio.set(null);
    this.direccionForm.patchValue({ idProvinciaDomicilio: null, idDistritoDomicilio: null, ubigeoDomicilio: '' });
    this.provinciasDomicilio.set([]);
    this.distritosDomicilio.set([]);
    if (idDepartamento) await this.cargarProvincias(idDepartamento, 'domicilio');
  }

  async cambiarProvinciaDomicilio(): Promise<void> {
    this.domicilioResolveSeq++;
    this.cargandoUbigeoDomicilio.set(false);
    const idProvincia = this.direccionForm.controls['idProvinciaDomicilio'].value;
    this.errorUbigeoDomicilio.set(null);
    this.direccionForm.patchValue({ idDistritoDomicilio: null, ubigeoDomicilio: '' });
    this.distritosDomicilio.set([]);
    if (idProvincia) await this.cargarDistritos(idProvincia, 'domicilio');
  }

  cambiarDistritoDomicilio(): void {
    this.domicilioResolveSeq++;
    this.cargandoUbigeoDomicilio.set(false);
    const idDistrito = this.direccionForm.controls['idDistritoDomicilio'].value;
    const distrito = this.distritosDomicilio().find((item) => item.id === idDistrito);
    this.direccionForm.controls['ubigeoDomicilio'].setValue(distrito?.codigo ?? '');
    this.errorUbigeoDomicilio.set(distrito?.codigo ? null : 'Selecciona un distrito válido.');
  }

  pegarCoordenadas(event: ClipboardEvent, origen: 'latitud' | 'longitud'): void {
    const par = extraerParCoordenadas(event.clipboardData?.getData('text') ?? '');
    if (!par) return;
    event.preventDefault();
    this.direccionForm.patchValue({ latitud: par[0], longitud: par[1] });
    this.direccionForm.controls[origen].markAsDirty();
    this.direccionForm.controls['latitud'].updateValueAndValidity({ emitEvent: false });
    this.direccionForm.controls['longitud'].updateValueAndValidity({ emitEvent: false });
  }

  // ── Expediente ────────────────────────────────────────
  abrirLead(idLead: number): void {
    this.drawerAbierto.set(true);
    this.tab.set('datos');
    this.cargandoDetalle.set(true);
    this.detalle.set(null);
    this.guardadoOk.set(false);
    this.error.set(null);
    this.modoReestructurar.set('none');
    this.reestructuraMsg.set(null);
    this.objetivo.set(null);
    this.limpiarStaged();
    this.service
      .obtenerDetalle(idLead)
      .pipe(finalize(() => this.cargandoDetalle.set(false)))
      .subscribe({
        next: (detalle) => {
          this.detalle.set(detalle);
          this.patchForms(detalle);
          this.cargarPlanes();
          void this.cargarDepartamentos();
          void this.resolverUbigeoGuardado(detalle.ubigeoNacimiento, 'nacimiento');
          void this.resolverUbigeoGuardado(detalle.ubigeoDomicilio, 'domicilio');
        },
        error: () => this.error.set('No se pudo cargar el expediente.')
      });
    this.recargarHistorial(idLead);
    this.cargarCluster(idLead);
  }

  private cargarCluster(idLead: number): void {
    this.cluster.set(null);
    this.service.obtenerContacto(idLead).subscribe({
      next: (cluster) => this.cluster.set(cluster),
      error: () => this.cluster.set(null)
    });
  }

  cerrarDrawer(): void {
    this.drawerAbierto.set(false);
    this.modoReestructurar.set('none');
  }

  // ── Reestructuración de contactos ─────────────────────
  abrirReestructurar(modo: 'swap' | 'move'): void {
    this.modoReestructurar.set(modo);
    this.pickerResultados.set([]);
    this.objetivo.set(null);
    this.reestructuraMsg.set(null);
  }

  cerrarReestructurar(): void {
    this.modoReestructurar.set('none');
    this.objetivo.set(null);
  }

  buscarObjetivo(termino: string): void {
    const limpio = (termino ?? '').trim();
    if (!limpio) {
      this.pickerResultados.set([]);
      return;
    }
    const idContactoActual = this.cluster()?.idContacto ?? null;
    this.pickerBuscando.set(true);
    this.service
      .buscar(limpio)
      .pipe(finalize(() => this.pickerBuscando.set(false)))
      .subscribe({
        // Solo contactos válidos y distintos del actual como destino/par.
        next: (filas) =>
          this.pickerResultados.set(
            filas.filter((f) => f.idContacto != null && f.idContacto !== idContactoActual)
          ),
        error: () => this.pickerResultados.set([])
      });
  }

  elegirObjetivo(fila: BitacoraBusquedaResponse): void {
    this.objetivo.set(fila);
  }

  limpiarObjetivo(): void {
    this.objetivo.set(null);
  }

  confirmarReestructurar(): void {
    const modo = this.modoReestructurar();
    const objetivo = this.objetivo();
    const idContactoActual = this.cluster()?.idContacto ?? null;
    const idLead = this.detalle()?.id;
    if (modo === 'none' || !objetivo || objetivo.idContacto == null || !idLead) {
      return;
    }

    this.procesandoReestructura.set(true);
    this.error.set(null);
    const op =
      modo === 'swap'
        ? this.reasignarSwap(idContactoActual, objetivo.idContacto, idLead)
        : this.reasignarMove(idLead, objetivo.idContacto);
    op();
  }

  private reasignarSwap(idContactoActual: number | null, idContactoObjetivo: number, idLead: number): () => void {
    return () => {
      if (idContactoActual == null) {
        this.procesandoReestructura.set(false);
        this.error.set('Este lead no tiene un contacto para intercambiar.');
        return;
      }
      this.service
        .intercambiarTelefono(idContactoActual, idContactoObjetivo)
        .pipe(finalize(() => this.procesandoReestructura.set(false)))
        .subscribe({
          next: () => {
            this.reestructuraMsg.set('Leads intercambiados entre los dos contactos.');
            this.modoReestructurar.set('none');
            this.recargar(idLead);
          },
          error: () => this.error.set('No se pudo intercambiar el teléfono. Inténtalo de nuevo.')
        });
    };
  }

  private reasignarMove(idLead: number, idContactoDestino: number): () => void {
    return () => {
      this.service
        .moverLead(idLead, idContactoDestino)
        .pipe(finalize(() => this.procesandoReestructura.set(false)))
        .subscribe({
          next: (res) => {
            this.reestructuraMsg.set(
              res.huerfanoEliminado
                ? 'Lead reubicado. El contacto de origen quedó vacío y se eliminó.'
                : 'Lead reubicado al contacto seleccionado.'
            );
            this.modoReestructurar.set('none');
            this.recargar(idLead);
          },
          error: () => this.error.set('No se pudo mover el lead. Inténtalo de nuevo.')
        });
    };
  }

  abrirLimpiar(): void {
    this.confirmandoLimpiar.set(true);
    this.error.set(null);
  }

  cerrarLimpiar(): void {
    this.confirmandoLimpiar.set(false);
  }

  confirmarLimpiar(): void {
    const idLead = this.detalle()?.id;
    if (!idLead) return;
    this.procesandoLimpiar.set(true);
    this.error.set(null);
    this.service
      .limpiarDatos(idLead)
      .pipe(finalize(() => this.procesandoLimpiar.set(false)))
      .subscribe({
        next: () => {
          this.confirmandoLimpiar.set(false);
          this.recargar(idLead);
        },
        error: () => this.error.set('No se pudieron limpiar los datos. Inténtalo de nuevo.')
      });
  }

  // Recarga detalle + historial + cluster del lead abierto tras una reestructuración.
  private recargar(idLead: number): void {
    this.service.obtenerDetalle(idLead).subscribe({
      next: (detalle) => {
        this.detalle.set(detalle);
        this.patchForms(detalle);
      }
    });
    this.recargarHistorial(idLead);
    this.cargarCluster(idLead);
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
    if (this.identidadForm.invalid || this.datosForm.invalid || this.direccionForm.invalid || this.ofertaForm.invalid) {
      this.identidadForm.markAllAsTouched();
      this.datosForm.markAllAsTouched();
      this.direccionForm.markAllAsTouched();
      this.ofertaForm.markAllAsTouched();
      this.error.set('Hay campos con formato inválido. Revisa los valores señalados antes de guardar.');
      return;
    }

    const identidadCambio = this.grupoTieneCambios(this.identidadOriginal(), this.identidadValues());
    const datosCambio = this.grupoTieneCambios(this.datosOriginal(), this.datosValues());
    const direccionCambio = this.grupoTieneCambios(this.direccionOriginal(), this.direccionValues());
    const ofertaCambio = this.grupoTieneCambios(this.ofertaOriginal(), this.ofertaValues());

    const identidad = identidadCambio ? this.construirIdentidadRequest() : null;
    const datosPreventa = datosCambio ? this.construirDatosRequest() : null;
    const direccion = direccionCambio ? this.construirDireccionRequest() : null;
    const ofertaComercial = ofertaCambio ? this.construirOfertaRequest() : null;

    this.guardando.set(true);
    this.error.set(null);
    this.service
      .aplicarCorreccion(detalle.id, {
        identidad,
        datosPreventa,
        direccion,
        ofertaComercial,
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
      prefijo: limpiarPrefijo(detalle.prefijo ?? '51'),
      lead: detalle.lead ?? '',
      usermeta: detalle.usermeta ?? ''
    };
    const datos = {
      tipoDocumento: detalle.tipoDocumento ?? '',
      numeroDocumentoTitularServicio: detalle.numeroDocumentoTitularServicio ?? '',
      ubigeoNacimiento: detalle.ubigeoNacimiento ?? '',
      idDepartamentoNacimiento: null,
      idProvinciaNacimiento: null,
      idDistritoNacimiento: null,
      nombreTitularServicio: detalle.nombreTitular ?? '',
      celularRegistro: detalle.celularRegistro ?? '',
      celularReferencia: detalle.celularReferencia ?? '',
      celularGrabacion: detalle.celularGrabacion ?? '',
      correo: detalle.correo ?? '',
      nombreMadre: detalle.nombreMadre ?? '',
      nombrePadre: detalle.nombrePadre ?? '',
      numeroDocumentoTitularCelularRegistro: detalle.numeroDocumentoTitularCelularRegistro ?? '',
      nombreTitularCelularRegistro: detalle.nombreTitularCelularRegistro ?? ''
    };
    const direccion = {
      ubigeoDomicilio: detalle.ubigeoDomicilio ?? '',
      idDepartamentoDomicilio: null,
      idProvinciaDomicilio: null,
      idDistritoDomicilio: null,
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
    const oferta = { idPlan: detalle.idPlan ?? null };
    this.ofertaForm.reset(oferta, { emitEvent: false });
    this.ofertaOriginal.set(this.normalizeRecord(oferta));
    this.ofertaValues.set(this.normalizeRecord(oferta));
    this.identidadValues.set(this.normalizeRecord(identidad));
    this.datosValues.set(this.normalizeRecord(datos));
    this.direccionValues.set(this.normalizeRecord(direccion));
  }

  private construirIdentidadRequest(): BitacoraIdentidadRequest {
    const raw = this.identidadForm.getRawValue();
    return {
      prefijo: raw.prefijo ?? null,
      lead: raw.lead ?? null,
      usermeta: raw.usermeta ?? null
    };
  }

  private construirDatosRequest(): LeadDatosPreventaRequest {
    const raw = this.datosForm.getRawValue();
    return {
      tipoDocumento: raw.tipoDocumento ?? '',
      numeroDocumentoTitularServicio: raw.numeroDocumentoTitularServicio ?? '',
      ubigeoNacimiento: raw.ubigeoNacimiento || null,
      nombreTitularServicio: raw.nombreTitularServicio || null,
      celularRegistro: raw.celularRegistro || null,
      celularReferencia: raw.celularReferencia || null,
      celularGrabacion: raw.celularGrabacion || null,
      correo: raw.correo || null,
      nombreMadre: raw.nombreMadre || null,
      nombrePadre: raw.nombrePadre || null,
      numeroDocumentoTitularCelularRegistro: raw.numeroDocumentoTitularCelularRegistro || null,
      nombreTitularCelularRegistro: raw.nombreTitularCelularRegistro || null
    };
  }

  private construirDireccionRequest(): LeadDireccionRequest {
    const raw = this.direccionForm.getRawValue();
    return {
      ubigeoDomicilio: raw.ubigeoDomicilio ?? '',
      tipoDomicilio: raw.tipoDomicilio || null,
      tipoVia: raw.tipoVia || null,
      via: raw.via || null,
      direccion: raw.direccion ?? '',
      referencia: raw.referencia || null,
      latitud: String(raw.latitud ?? '').replace(',', '.'),
      longitud: String(raw.longitud ?? '').replace(',', '.'),
      urbanizacion: raw.urbanizacion || null,
      numero: raw.numero || null,
      manzana: raw.manzana || null,
      lote: raw.lote || null,
      nombreEdificio: raw.nombreEdificio || null,
      nombreCondominio: raw.nombreCondominio || null,
      plano: raw.plano || null,
      piso: raw.piso || null,
      interior: raw.interior || null
    };
  }

  private construirOfertaRequest(): LeadOfertaComercialRequest {
    const detalle = this.detalle();
    const idPlan = this.ofertaForm.getRawValue().idPlan ?? null;
    const plan = this.planSeleccionado();
    const proveedorAnterior = (detalle?.nombreProveedorPlan ?? '').trim().toLocaleUpperCase();
    const proveedorNuevo = (plan?.nombreProveedor ?? '').trim().toLocaleUpperCase();
    const cambiaProveedor = !!proveedorAnterior && !!proveedorNuevo && proveedorAnterior !== proveedorNuevo;

    return {
      idPlan,
      // La Bitácora solo edita el plan. Una promoción de la oferta anterior puede dejar de aplicar
      // al nuevo plan, por eso se descarta de forma explícita y se evita una asociación inválida.
      idPromocionInterna: null,
      adicionales: cambiaProveedor
        ? []
        : (detalle?.adicionales ?? [])
            .filter((adicional) => adicional.idAdicional != null && (adicional.cantidad ?? 0) > 0)
            .map((adicional) => ({
              idAdicional: adicional.idAdicional as number,
              cantidad: adicional.cantidad as number
            }))
    };
  }

  private cargarPlanes(): void {
    this.cargandoPlanes.set(true);
    this.errorPlanes.set(null);
    this.service
      .listarPlanes()
      .pipe(finalize(() => this.cargandoPlanes.set(false)))
      .subscribe({
        next: (planes) => this.planes.set(planes),
        error: () => {
          this.planes.set([]);
          this.errorPlanes.set('No se pudo cargar el catálogo de planes. Inténtalo nuevamente.');
        }
      });
  }

  private cargarDepartamentos(): Promise<UbigeoItem[]> {
    if (this.departamentos().length) return Promise.resolve(this.departamentos());
    if (this.departamentosPromise) return this.departamentosPromise;
    this.cargandoDepartamentos.set(true);
    this.departamentosPromise = firstValueFrom(this.service.listarDepartamentos())
      .then((items) => {
        this.departamentos.set(items);
        return items;
      })
      .finally(() => {
        this.cargandoDepartamentos.set(false);
        this.departamentosPromise = null;
      });
    return this.departamentosPromise;
  }

  private async cargarProvincias(idDepartamento: number, tipo: 'nacimiento' | 'domicilio'): Promise<UbigeoItem[]> {
    const loading = tipo === 'nacimiento' ? this.cargandoUbigeoNacimiento : this.cargandoUbigeoDomicilio;
    const error = tipo === 'nacimiento' ? this.errorUbigeoNacimiento : this.errorUbigeoDomicilio;
    loading.set(true);
    try {
      const items = await firstValueFrom(this.service.listarProvincias(idDepartamento));
      if (tipo === 'nacimiento') this.provinciasNacimiento.set(items);
      else this.provinciasDomicilio.set(items);
      return items;
    } catch {
      error.set('No se pudieron cargar las provincias. Vuelve a elegir el departamento.');
      return [];
    } finally {
      loading.set(false);
    }
  }

  private async cargarDistritos(idProvincia: number, tipo: 'nacimiento' | 'domicilio'): Promise<UbigeoItem[]> {
    const loading = tipo === 'nacimiento' ? this.cargandoUbigeoNacimiento : this.cargandoUbigeoDomicilio;
    const error = tipo === 'nacimiento' ? this.errorUbigeoNacimiento : this.errorUbigeoDomicilio;
    loading.set(true);
    try {
      const items = await firstValueFrom(this.service.listarDistritos(idProvincia));
      if (tipo === 'nacimiento') this.distritosNacimiento.set(items);
      else this.distritosDomicilio.set(items);
      return items;
    } catch {
      error.set('No se pudieron cargar los distritos. Vuelve a elegir la provincia.');
      return [];
    } finally {
      loading.set(false);
    }
  }

  private async resolverUbigeoGuardado(codigoOriginal: string | null | undefined, tipo: 'nacimiento' | 'domicilio'): Promise<void> {
    const codigo = soloDigitos(codigoOriginal, 6);
    if (!codigo) return;
    const sequence = tipo === 'nacimiento' ? ++this.nacimientoResolveSeq : ++this.domicilioResolveSeq;
    const loading = tipo === 'nacimiento' ? this.cargandoUbigeoNacimiento : this.cargandoUbigeoDomicilio;
    const error = tipo === 'nacimiento' ? this.errorUbigeoNacimiento : this.errorUbigeoDomicilio;
    loading.set(true);
    error.set(null);
    try {
      if (codigo.length !== 6) throw new Error('UBIGEO_INVALIDO');
      const departamentos = await this.cargarDepartamentos();
      if (!this.esResolucionActual(tipo, sequence)) return;
      const departamento = departamentos.find((item) => item.codigo === codigo.slice(0, 2));
      if (!departamento) throw new Error('DEPARTAMENTO_NO_ENCONTRADO');
      const provincias = await firstValueFrom(this.service.listarProvincias(departamento.id));
      if (!this.esResolucionActual(tipo, sequence)) return;
      const provincia = provincias.find((item) => item.codigo === codigo.slice(0, 4));
      if (!provincia) throw new Error('PROVINCIA_NO_ENCONTRADA');
      const distritos = await firstValueFrom(this.service.listarDistritos(provincia.id));
      if (!this.esResolucionActual(tipo, sequence)) return;
      const distrito = distritos.find((item) => item.codigo === codigo);
      if (!distrito) throw new Error('DISTRITO_NO_ENCONTRADO');
      if (tipo === 'nacimiento') {
        this.provinciasNacimiento.set(provincias);
        this.distritosNacimiento.set(distritos);
        this.datosForm.patchValue({
          idDepartamentoNacimiento: departamento.id,
          idProvinciaNacimiento: provincia.id,
          idDistritoNacimiento: distrito.id,
          ubigeoNacimiento: codigo
        }, { emitEvent: false });
        this.datosOriginal.set(this.normalizeRecord(this.datosForm.getRawValue()));
        this.datosValues.set(this.normalizeRecord(this.datosForm.getRawValue()));
      } else {
        this.provinciasDomicilio.set(provincias);
        this.distritosDomicilio.set(distritos);
        this.direccionForm.patchValue({
          idDepartamentoDomicilio: departamento.id,
          idProvinciaDomicilio: provincia.id,
          idDistritoDomicilio: distrito.id,
          ubigeoDomicilio: codigo
        }, { emitEvent: false });
        this.direccionOriginal.set(this.normalizeRecord(this.direccionForm.getRawValue()));
        this.direccionValues.set(this.normalizeRecord(this.direccionForm.getRawValue()));
      }
    } catch {
      error.set('No se pudo reconocer la ubicación guardada. Selecciónala nuevamente.');
    } finally {
      if (this.esResolucionActual(tipo, sequence)) loading.set(false);
    }
  }

  private esResolucionActual(tipo: 'nacimiento' | 'domicilio', sequence: number): boolean {
    return tipo === 'nacimiento' ? sequence === this.nacimientoResolveSeq : sequence === this.domicilioResolveSeq;
  }

  private originalDe(grupo: 'identidad' | 'datos' | 'direccion' | 'oferta'): Record<string, string> {
    if (grupo === 'identidad') return this.identidadOriginal();
    if (grupo === 'datos') return this.datosOriginal();
    return grupo === 'direccion' ? this.direccionOriginal() : this.ofertaOriginal();
  }

  private valuesDe(grupo: 'identidad' | 'datos' | 'direccion' | 'oferta'): Record<string, string> {
    if (grupo === 'identidad') return this.identidadValues();
    if (grupo === 'datos') return this.datosValues();
    return grupo === 'direccion' ? this.direccionValues() : this.ofertaValues();
  }

  campoModificado(grupo: 'identidad' | 'datos' | 'direccion' | 'oferta', control: string): boolean {
    return (this.originalDe(grupo)[control] ?? '') !== (this.valuesDe(grupo)[control] ?? '');
  }

  valorOriginal(grupo: 'identidad' | 'datos' | 'direccion' | 'oferta', control: string): string {
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
    this.ofertaOriginal.set({});
    this.datosValues.set({});
    this.direccionValues.set({});
    this.ofertaValues.set({});
    this.ofertaForm.reset({ idPlan: null }, { emitEvent: false });
    this.planes.set([]);
    this.errorPlanes.set(null);
    this.provinciasNacimiento.set([]);
    this.distritosNacimiento.set([]);
    this.provinciasDomicilio.set([]);
    this.distritosDomicilio.set([]);
    this.errorUbigeoNacimiento.set(null);
    this.errorUbigeoDomicilio.set(null);
  }
}
