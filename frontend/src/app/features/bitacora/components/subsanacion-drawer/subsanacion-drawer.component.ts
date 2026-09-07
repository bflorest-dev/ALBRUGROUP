import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { EquiposNavService } from '../../../../core/services/equipos-nav.service';
import { CampoConfigItem } from '../../../../shared/models/preventa/preventa.models';
import {
  SubsanacionModo,
  SubsanacionOpciones,
  SubsanacionPreparacion,
  SubsanacionRequest,
  SubsanacionResponse,
  SubsanacionTipificacionOpcion
} from '../../models/subsanacion.models';
import { SubsanacionService } from '../../services/subsanacion.service';

interface CambioVisible {
  label: string;
  antes: string;
  despues: string;
}

const LABELS: Record<string, string> = {
  prefijo: 'Prefijo',
  usermeta: 'Usermeta',
  tipoDocumento: 'Tipo de documento',
  numeroDocumentoTitularServicio: 'N.º documento',
  nombreTitularServicio: 'Titular del servicio',
  celularRegistro: 'Celular de registro',
  correo: 'Correo',
  fechaNacimiento: 'Fecha de nacimiento',
  parentesco: 'Parentesco',
  ubigeoDomicilio: 'Ubigeo domicilio',
  tipoDomicilio: 'Tipo de domicilio',
  direccion: 'Dirección',
  referencia: 'Referencia',
  latitud: 'Latitud',
  longitud: 'Longitud',
  idEquipo: 'Equipo',
  idProveedor: 'Proveedor',
  idCampana: 'Campaña',
  idPlan: 'Plan',
  base: 'Base'
};

@Component({
  selector: 'app-subsanacion-drawer',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './subsanacion-drawer.component.html',
  styleUrl: './subsanacion-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubsanacionDrawerComponent implements OnInit {
  readonly modo = input.required<SubsanacionModo>();
  readonly idLead = input<number | null>(null);
  readonly telefonoInicial = input('');
  readonly tema = input<'light' | 'dark'>('light');

  readonly cerrar = output<void>();
  readonly completada = output<SubsanacionResponse>();
  readonly cambiarAExistente = output<number>();
  readonly abrirExpediente = output<number>();

  private readonly fb = inject(FormBuilder);
  private readonly api = inject(SubsanacionService);
  private readonly equiposNav = inject(EquiposNavService);
  private readonly destroyRef = inject(DestroyRef);

  readonly equipos = this.equiposNav.activeTeams;
  readonly paso = signal(0);
  readonly cargando = signal(false);
  readonly cargandoOpciones = signal(false);
  readonly verificandoTelefono = signal(false);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly preparacion = signal<SubsanacionPreparacion | null>(null);
  readonly opciones = signal<SubsanacionOpciones | null>(null);
  readonly camposConfig = signal<CampoConfigItem[]>([]);
  readonly duplicado = signal<{ idLead: number; titular?: string | null } | null>(null);
  readonly confirmacionAbierta = signal(false);
  readonly confirmarContacto = signal(false);
  readonly confirmarPostventa = signal(false);
  readonly resultado = signal<SubsanacionResponse | null>(null);
  private readonly formVersion = signal(0);
  private original: Record<string, string> = {};
  private requestId = this.nuevoRequestId();

  readonly pasos = ['Identidad', 'Fechas', 'Expediente', 'Flujo ideal', 'Revisión'];
  readonly tiposDocumento = ['DNI', 'CE', 'RUC'];
  readonly parentescos = ['TITULAR', 'MADRE', 'PADRE', 'HERMANO_A', 'TIO_A', 'CONOCIDO'];
  readonly tiposDomicilio = ['HOGAR', 'MULTIFAMILIAR', 'CONDOMINIO_EDIFICIO', 'CONDOMINIO_EDIFICIO_NO_HABILITADO'];
  readonly tiposVia = ['AVENIDA', 'JIRON', 'CALLE', 'PASAJE', 'PROLONGACION'];
  readonly bases = ['WHATSAPP', 'MESSENGER', 'RECONTACTO', 'PREDICTIVO', 'REFERIDO', 'MASIVO', 'SIN_IDENTIFICAR'];

  readonly fechaGestionMin = this.isoLocal(this.hoyMovidoMeses(-6));
  readonly fechaGestionMax = this.isoLocal(this.hoyMovidoDias(-1));
  readonly fechaInstalacionMax = this.isoLocal(new Date());

  readonly identidadForm = this.fb.group({
    prefijo: ['+51', [Validators.required, Validators.pattern(/^\+\d{1,3}$/)]],
    lead: ['', [Validators.required, Validators.pattern(/^\d{6,15}$/)]],
    usermeta: ['']
  });

  readonly fechasForm = this.fb.group({
    fechaGestion: ['', Validators.required],
    fechaInstalacion: ['', Validators.required]
  });

  readonly datosForm = this.fb.group({
    tipoDocumento: ['', Validators.required],
    numeroDocumentoTitularServicio: ['', Validators.required],
    ubigeoNacimiento: [''],
    nombreTitularServicio: ['', Validators.required],
    celularRegistro: ['', Validators.required],
    celularReferencia: [''],
    correo: ['', [Validators.required, Validators.email]],
    fechaNacimiento: ['', Validators.required],
    parentesco: ['', Validators.required],
    nombreMadre: [''],
    nombrePadre: [''],
    numeroDocumentoTitularCelularRegistro: [''],
    nombreTitularCelularRegistro: ['']
  });

  readonly direccionForm = this.fb.group({
    ubigeoDomicilio: ['', Validators.required],
    tipoDomicilio: ['', Validators.required],
    tipoVia: [''],
    via: [''],
    direccion: ['', Validators.required],
    referencia: ['', Validators.required],
    latitud: ['', [Validators.required, Validators.pattern(/^-?\d{1,3}([.,]\d+)?$/)]],
    longitud: ['', [Validators.required, Validators.pattern(/^-?\d{1,3}([.,]\d+)?$/)]],
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

  readonly comercialForm = this.fb.group({
    idEquipo: [null as number | null, Validators.required],
    idProveedor: [null as number | null, Validators.required],
    idCampana: [null as number | null, Validators.required],
    idPlan: [null as number | null, Validators.required],
    base: ['', Validators.required],
    preventa: ['', Validators.required],
    venta: ['', Validators.required],
    sec: [''],
    sot: [''],
    customerId: ['']
  });

  readonly motivoControl = this.fb.control('', [Validators.required, Validators.maxLength(1000)]);

  readonly proveedorSeleccionado = computed(() => {
    this.formVersion();
    const id = this.comercialForm.controls.idProveedor.value;
    return this.opciones()?.proveedores.find((item) => item.id === id) ?? null;
  });

  readonly ventaSeleccionada = computed(() => {
    this.formVersion();
    return this.buscarMatriz(this.opciones()?.venta ?? [], this.comercialForm.controls.venta.value ?? '');
  });

  readonly requiereCustomerId = computed(() =>
    this.ventaSeleccionada()?.comportamientos.includes('REQUIERE_CUSTOMER_ID') ?? false
  );

  readonly requiereSecSot = computed(() =>
    (this.ventaSeleccionada()?.comportamientos.includes('REQUIERE_SEC_SOT') ?? false) &&
    (this.proveedorSeleccionado()?.requiereSecSotVenta ?? false)
  );

  readonly impactoPostventa = computed(() => {
    const i = this.preparacion()?.impacto;
    return i
      ? i.calendariosPostventa + i.periodosPostventa + i.pagosPostventa + i.encuestasPostventa +
          i.entregasCredenciales + i.dispositivosEntregados
      : 0;
  });

  readonly cambios = computed<CambioVisible[]>(() => {
    this.formVersion();
    if (this.modo() !== 'EXISTENTE') return [];
    const actual = this.valoresComparables();
    return Object.keys(LABELS)
      .filter((key) => (this.original[key] ?? '') !== (actual[key] ?? ''))
      .map((key) => ({
        label: LABELS[key],
        antes: this.original[key] || '—',
        despues: actual[key] || '—'
      }));
  });

  readonly identidadModificada = computed(() => {
    this.formVersion();
    return this.identidadCambio();
  });

  readonly puedeConfirmar = computed(() => {
    const prep = this.preparacion();
    const contactoOk = !prep?.impacto.requiereConfirmacionContacto || !this.identidadCambio() || this.confirmarContacto();
    const postventaOk = !prep?.impacto.requiereConfirmacionPostventa || this.confirmarPostventa();
    return contactoOk && postventaOk && this.motivoControl.valid && !this.enviando();
  });

  ngOnInit(): void {
    this.equiposNav.ensureLoaded();
    this.observarFormularios();
    if (this.modo() === 'EXISTENTE') {
      const id = this.idLead();
      if (!id) {
        this.error.set('No se recibió el lead que se desea subsanar.');
        return;
      }
      this.cargarPreparacion(id);
    } else {
      const telefono = this.telefonoInicial().replace(/\D/g, '');
      if (telefono.length >= 6) this.identidadForm.controls.lead.setValue(telefono);
      this.original = this.valoresComparables();
    }
  }

  cambiarEquipo(): void {
    this.comercialForm.patchValue({ idProveedor: null, idCampana: null, idPlan: null, preventa: '', venta: '' });
    this.opciones.set(null);
    this.camposConfig.set([]);
    this.cargarOpciones();
  }

  cambiarProveedor(): void {
    this.comercialForm.patchValue({ idCampana: null, idPlan: null });
    const proveedor = this.comercialForm.controls.idProveedor.value;
    if (proveedor) this.cargarCampos(proveedor);
    this.cargarOpciones();
  }

  cambiarFechaGestion(): void {
    this.validarFechasCliente();
    if (this.comercialForm.controls.idEquipo.value) this.cargarOpciones(true);
  }

  cambiarFechaInstalacion(): void {
    this.validarFechasCliente();
  }

  avanzar(): void {
    this.error.set(null);
    if (!this.validarPasoActual()) return;
    if (this.paso() === 0 && this.modo() === 'NUEVO') {
      this.verificarDuplicado(true);
      return;
    }
    this.paso.update((value) => Math.min(4, value + 1));
  }

  retroceder(): void {
    this.error.set(null);
    this.paso.update((value) => Math.max(0, value - 1));
  }

  irPaso(indice: number): void {
    if (indice < this.paso()) this.paso.set(indice);
  }

  verificarDuplicado(avanzar = false): void {
    if (this.modo() !== 'NUEVO' || this.identidadForm.invalid) return;
    const raw = this.identidadForm.getRawValue();
    this.verificandoTelefono.set(true);
    this.api.buscarLeads(raw.lead ?? '')
      .pipe(finalize(() => this.verificandoTelefono.set(false)))
      .subscribe({
        next: (leads) => {
          const exacto = leads.find((item) => item.lead === raw.lead && item.prefijo === raw.prefijo);
          this.duplicado.set(exacto ? { idLead: exacto.idLead, titular: exacto.titular } : null);
          if (!exacto && avanzar) this.paso.set(1);
        },
        error: () => this.error.set('No se pudo verificar el teléfono. Inténtalo nuevamente.')
      });
  }

  usarLeadExistente(): void {
    const duplicado = this.duplicado();
    if (duplicado) this.cambiarAExistente.emit(duplicado.idLead);
  }

  cambiarTipificacionVenta(): void {
    this.actualizarValidadoresVenta();
  }

  validarPlanSeleccionado(): void {
    const control = this.comercialForm.controls.idPlan;
    control.updateValueAndValidity({ emitEvent: false });
    const plan = this.opciones()?.planes.find((item) => item.id === control.value);
    if (plan && !plan.compatibleHistoricamente) {
      control.setErrors({ ...(control.errors ?? {}), vigenciaHistorica: true });
    }
  }

  abrirConfirmacion(): void {
    if (!this.validarTodo()) return;
    this.confirmacionAbierta.set(true);
  }

  cerrarConfirmacion(): void {
    if (!this.enviando()) this.confirmacionAbierta.set(false);
  }

  ejecutar(): void {
    if (!this.puedeConfirmar()) return;
    const request = this.construirRequest();
    if (!request) return;
    this.enviando.set(true);
    this.error.set(null);
    this.api.ejecutar(request)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: (resultado) => {
          this.confirmacionAbierta.set(false);
          this.resultado.set(resultado);
          this.completada.emit(resultado);
        },
        error: (error: HttpErrorResponse) => {
          this.confirmacionAbierta.set(false);
          this.error.set(this.mensajeError(error));
        }
      });
  }

  cerrarDrawer(): void {
    if (!this.enviando()) this.cerrar.emit();
  }

  abrirLeadResultado(): void {
    const result = this.resultado();
    if (result) this.abrirExpediente.emit(result.idLead);
  }

  matrizKey(item: SubsanacionTipificacionOpcion): string {
    return `${item.codigoTipificacion}::${item.codigoSubtipificacion}`;
  }

  opcionMatriz(item: SubsanacionTipificacionOpcion): string {
    const estado = item.tipificacionActiva && item.subtipificacionActiva ? '' : ' · histórica';
    return `${item.descripcionTipificacion || item.codigoTipificacion} — ${item.descripcionSubtipificacion || item.codigoSubtipificacion}${estado}`;
  }

  nombreEquipo(id?: number | null): string {
    return this.equipos().find((item) => item.id === id)?.nombre ?? (id ? `Equipo #${id}` : '—');
  }

  nombreProveedor(id?: number | null): string {
    return this.opciones()?.proveedores.find((item) => item.id === id)?.nombre ?? '—';
  }

  nombreCampana(id?: number | null): string {
    return this.opciones()?.campanas.find((item) => item.id === id)?.nombre ?? '—';
  }

  nombrePlan(id?: number | null): string {
    return this.opciones()?.planes.find((item) => item.id === id)?.nombre ?? '—';
  }

  private cargarPreparacion(idLead: number): void {
    this.cargando.set(true);
    this.api.preparar(idLead)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (prep) => {
          this.preparacion.set(prep);
          this.patchPreparacion(prep);
          this.original = this.valoresComparables();
          if (prep.idProveedor) this.cargarCampos(prep.idProveedor);
          this.cargarOpciones(true);
        },
        error: (error: HttpErrorResponse) => this.error.set(this.mensajeError(error))
      });
  }

  private patchPreparacion(prep: SubsanacionPreparacion): void {
    const d = prep.detalle;
    this.identidadForm.reset({ prefijo: d.prefijo ?? '+51', lead: d.lead ?? '', usermeta: d.usermeta ?? '' }, { emitEvent: false });
    this.identidadForm.controls.lead.disable({ emitEvent: false });
    this.datosForm.reset({
      tipoDocumento: d.tipoDocumento ?? '', numeroDocumentoTitularServicio: d.numeroDocumentoTitularServicio ?? '',
      ubigeoNacimiento: d.ubigeoNacimiento ?? '', nombreTitularServicio: d.nombreTitular ?? '',
      celularRegistro: d.celularRegistro ?? '', celularReferencia: d.celularReferencia ?? '', correo: d.correo ?? '',
      fechaNacimiento: d.fechaNacimiento ?? '', parentesco: d.parentesco ?? '', nombreMadre: d.nombreMadre ?? '',
      nombrePadre: d.nombrePadre ?? '', numeroDocumentoTitularCelularRegistro: d.numeroDocumentoTitularCelularRegistro ?? '',
      nombreTitularCelularRegistro: d.nombreTitularCelularRegistro ?? ''
    }, { emitEvent: false });
    this.direccionForm.reset({
      ubigeoDomicilio: d.ubigeoDomicilio ?? '', tipoDomicilio: d.tipoDomicilio ?? '', tipoVia: d.tipoVia ?? '',
      via: d.via ?? '', direccion: d.direccion ?? '', referencia: d.referencia ?? '', latitud: d.latitud ?? '',
      longitud: d.longitud ?? '', urbanizacion: d.urbanizacion ?? '', numero: d.numero ?? '', manzana: d.manzana ?? '',
      lote: d.lote ?? '', nombreEdificio: d.nombreEdificio ?? '', nombreCondominio: d.nombreCondominio ?? '',
      plano: d.plano ?? '', piso: d.piso ?? '', interior: d.interior ?? ''
    }, { emitEvent: false });
    const gestion = prep.impacto.createdAt?.slice(0, 10) ?? '';
    this.fechasForm.reset({ fechaGestion: gestion, fechaInstalacion: prep.fechaInstalacionActual ?? gestion }, { emitEvent: false });
    this.comercialForm.reset({
      idEquipo: prep.idEquipo ?? null, idProveedor: prep.idProveedor ?? null, idCampana: prep.idCampana ?? null,
      idPlan: prep.idPlan ?? null, base: d.base ?? '', preventa: '', venta: '', sec: d.sec ?? '', sot: d.sot ?? '',
      customerId: d.customerId ?? ''
    }, { emitEvent: false });
    this.formVersion.update((value) => value + 1);
    this.validarFechasCliente();
  }

  private cargarOpciones(preservar = false): void {
    const equipo = this.comercialForm.controls.idEquipo.value;
    if (!equipo) return;
    const proveedor = this.comercialForm.controls.idProveedor.value;
    const fecha = this.fechasForm.controls.fechaGestion.value;
    const current = this.comercialForm.getRawValue();
    this.cargandoOpciones.set(true);
    this.api.opciones(equipo, proveedor, fecha)
      .pipe(finalize(() => this.cargandoOpciones.set(false)))
      .subscribe({
        next: (opciones) => {
          this.opciones.set(opciones);
          if (preservar) {
            this.comercialForm.patchValue({
              idProveedor: current.idProveedor, idCampana: current.idCampana, idPlan: current.idPlan
            }, { emitEvent: false });
          }
          this.autoseleccionarMatrices(opciones);
          this.actualizarValidadoresVenta();
          this.validarPlanSeleccionado();
          this.formVersion.update((value) => value + 1);
        },
        error: (error: HttpErrorResponse) => this.error.set(this.mensajeError(error))
      });
  }

  private autoseleccionarMatrices(opciones: SubsanacionOpciones): void {
    const patch: Record<string, string> = {};
    if (!this.comercialForm.controls.preventa.value && opciones.preventa.length === 1) {
      patch['preventa'] = this.matrizKey(opciones.preventa[0]);
    }
    if (!this.comercialForm.controls.venta.value && opciones.venta.length === 1) {
      patch['venta'] = this.matrizKey(opciones.venta[0]);
    }
    if (Object.keys(patch).length) this.comercialForm.patchValue(patch, { emitEvent: false });
  }

  private cargarCampos(idProveedor: number): void {
    this.api.camposCaptura(idProveedor).subscribe({
      next: (campos) => {
        this.camposConfig.set(campos);
        this.aplicarValidadoresConfigurables(campos);
      },
      error: () => this.camposConfig.set([])
    });
  }

  private aplicarValidadoresConfigurables(campos: CampoConfigItem[]): void {
    const mapa: Record<string, keyof typeof this.datosForm.controls | keyof typeof this.direccionForm.controls> = {
      NOMBRE_MADRE: 'nombreMadre', NOMBRE_PADRE: 'nombrePadre',
      DOC_TITULAR_CELULAR: 'numeroDocumentoTitularCelularRegistro',
      NOMBRE_TITULAR_CELULAR: 'nombreTitularCelularRegistro', PLANO: 'plano'
    };
    for (const campo of campos) {
      const nombre = mapa[campo.campo];
      if (!nombre) continue;
      const control = this.datosForm.get(nombre) ?? this.direccionForm.get(nombre);
      if (!control) continue;
      control.setValidators(campo.requerido ? Validators.required : []);
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  private actualizarValidadoresVenta(): void {
    const requiereSecSot = this.requiereSecSot();
    const requiereCustomerId = this.requiereCustomerId();
    const secValidators = requiereSecSot && !requiereCustomerId
      ? [Validators.required, Validators.pattern(/^\d{9}$/)]
      : [];
    const sotValidators = requiereSecSot
      ? [Validators.required, Validators.pattern(/^\d{8}$/)]
      : [];
    const customerValidators = requiereCustomerId ? [Validators.required] : [];
    this.comercialForm.controls.sec.setValidators(secValidators);
    this.comercialForm.controls.sot.setValidators(sotValidators);
    this.comercialForm.controls.customerId.setValidators(customerValidators);
    this.comercialForm.controls.sec.updateValueAndValidity({ emitEvent: false });
    this.comercialForm.controls.sot.updateValueAndValidity({ emitEvent: false });
    this.comercialForm.controls.customerId.updateValueAndValidity({ emitEvent: false });
  }

  private observarFormularios(): void {
    const forms: FormGroup[] = [
      this.identidadForm,
      this.fechasForm,
      this.datosForm,
      this.direccionForm,
      this.comercialForm
    ];
    for (const form of forms) {
      form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.formVersion.update((value) => value + 1));
    }
  }

  private validarPasoActual(): boolean {
    if (this.paso() === 0) return this.validarGrupo(this.identidadForm, 'Completa una identidad válida.');
    if (this.paso() === 1) {
      this.validarFechasCliente();
      return this.validarGrupo(this.fechasForm, 'Revisa el rango de las fechas históricas.');
    }
    if (this.paso() === 2) {
      const datos = this.validarGrupo(this.datosForm, 'Completa los datos obligatorios de Preventa.');
      const direccion = this.validarGrupo(this.direccionForm, 'Completa la dirección de instalación.');
      return datos && direccion;
    }
    if (this.paso() === 3) {
      this.actualizarValidadoresVenta();
      this.validarPlanSeleccionado();
      return this.validarGrupo(this.comercialForm, 'Completa el flujo comercial y sus tipificaciones.');
    }
    return true;
  }

  private validarTodo(): boolean {
    this.validarFechasCliente();
    this.actualizarValidadoresVenta();
    this.validarPlanSeleccionado();
    const forms = [this.identidadForm, this.fechasForm, this.datosForm, this.direccionForm, this.comercialForm];
    forms.forEach((form) => form.markAllAsTouched());
    this.motivoControl.markAsTouched();
    if (forms.some((form) => form.invalid) || this.motivoControl.invalid) {
      this.error.set('Todavía hay campos obligatorios o inválidos. Revisa los pasos señalados.');
      return false;
    }
    return true;
  }

  private validarGrupo(form: FormGroup, mensaje: string): boolean {
    form.markAllAsTouched();
    if (form.invalid) this.error.set(mensaje);
    return form.valid;
  }

  private validarFechasCliente(): void {
    const gestion = this.fechasForm.controls.fechaGestion;
    const instalacion = this.fechasForm.controls.fechaInstalacion;
    const g = gestion.value;
    const i = instalacion.value;
    gestion.setErrors(!g ? { required: true } : g < this.fechaGestionMin || g > this.fechaGestionMax ? { rango: true } : null);
    instalacion.setErrors(!i ? { required: true } : g && (i < g || i > this.fechaInstalacionMax) ? { rango: true } : null);
  }

  private construirRequest(): SubsanacionRequest | null {
    const identidad = this.identidadForm.getRawValue();
    const fechas = this.fechasForm.getRawValue();
    const datos = this.datosForm.getRawValue();
    const direccion = this.direccionForm.getRawValue();
    const comercial = this.comercialForm.getRawValue();
    const preventa = this.separarMatriz(comercial.preventa ?? '');
    const venta = this.separarMatriz(comercial.venta ?? '');
    if (!preventa || !venta || !comercial.idEquipo || !comercial.idCampana || !comercial.idPlan || !fechas.fechaGestion || !fechas.fechaInstalacion) {
      this.error.set('No se pudo construir el flujo. Revisa las selecciones comerciales.');
      return null;
    }
    return {
      requestId: this.requestId,
      modo: this.modo(),
      idLead: this.modo() === 'EXISTENTE' ? this.idLead() : null,
      prefijo: identidad.prefijo ?? '', lead: identidad.lead ?? '', usermeta: this.nulo(identidad.usermeta),
      idEquipo: comercial.idEquipo, idCampana: comercial.idCampana, idPlan: comercial.idPlan,
      base: comercial.base ?? '',
      datosPreventa: {
        tipoDocumento: datos.tipoDocumento ?? '', numeroDocumentoTitularServicio: datos.numeroDocumentoTitularServicio ?? '',
        ubigeoNacimiento: this.nulo(datos.ubigeoNacimiento), nombreTitularServicio: this.nulo(datos.nombreTitularServicio),
        celularRegistro: this.nulo(datos.celularRegistro), celularReferencia: this.nulo(datos.celularReferencia),
        correo: this.nulo(datos.correo), fechaNacimiento: this.nulo(datos.fechaNacimiento), parentesco: this.nulo(datos.parentesco),
        nombreMadre: this.nulo(datos.nombreMadre), nombrePadre: this.nulo(datos.nombrePadre),
        numeroDocumentoTitularCelularRegistro: this.nulo(datos.numeroDocumentoTitularCelularRegistro),
        nombreTitularCelularRegistro: this.nulo(datos.nombreTitularCelularRegistro)
      },
      direccion: {
        ubigeoDomicilio: direccion.ubigeoDomicilio ?? '', tipoDomicilio: this.nulo(direccion.tipoDomicilio),
        tipoVia: this.nulo(direccion.tipoVia), via: this.nulo(direccion.via), direccion: direccion.direccion ?? '',
        referencia: this.nulo(direccion.referencia), latitud: direccion.latitud ?? '', longitud: direccion.longitud ?? '',
        urbanizacion: this.nulo(direccion.urbanizacion), numero: this.nulo(direccion.numero), manzana: this.nulo(direccion.manzana),
        lote: this.nulo(direccion.lote), nombreEdificio: this.nulo(direccion.nombreEdificio),
        nombreCondominio: this.nulo(direccion.nombreCondominio), plano: this.nulo(direccion.plano),
        piso: this.nulo(direccion.piso), interior: this.nulo(direccion.interior)
      },
      codigoTipificacionPreventa: preventa[0], codigoSubtipificacionPreventa: preventa[1],
      codigoTipificacionVenta: venta[0], codigoSubtipificacionVenta: venta[1],
      sec: this.nulo(comercial.sec), sot: this.nulo(comercial.sot), customerId: this.nulo(comercial.customerId),
      fechaGestion: fechas.fechaGestion, fechaInstalacion: fechas.fechaInstalacion,
      motivo: this.motivoControl.value ?? '', confirmarRecreacionPostventa: this.confirmarPostventa(),
      confirmarImpactoContacto: this.confirmarContacto()
    };
  }

  private valoresComparables(): Record<string, string> {
    const raw = { ...this.identidadForm.getRawValue(), ...this.datosForm.getRawValue(), ...this.direccionForm.getRawValue(), ...this.comercialForm.getRawValue() };
    return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, value === null || value === undefined ? '' : String(value).trim()]));
  }

  private identidadCambio(): boolean {
    const actual = this.valoresComparables();
    return (this.original['prefijo'] ?? '') !== (actual['prefijo'] ?? '') || (this.original['usermeta'] ?? '') !== (actual['usermeta'] ?? '');
  }

  private buscarMatriz(items: SubsanacionTipificacionOpcion[], key: string): SubsanacionTipificacionOpcion | null {
    return items.find((item) => this.matrizKey(item) === key) ?? null;
  }

  private separarMatriz(value: string): [string, string] | null {
    const [tipo, sub] = value.split('::');
    return tipo && sub ? [tipo, sub] : null;
  }

  private nulo(value?: string | null): string | null {
    const clean = value?.trim();
    return clean ? clean : null;
  }

  private mensajeError(error: HttpErrorResponse): string {
    const body = error.error as { message?: string; error?: string } | string | null;
    if (typeof body === 'string' && body.trim()) return body;
    if (body && typeof body === 'object') return body.message || body.error || 'No se pudo completar la subsanación.';
    return 'No se pudo completar la subsanación. Revisa los datos e inténtalo nuevamente.';
  }

  private nuevoRequestId(): string {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = Math.floor(Math.random() * 16);
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }

  private hoyMovidoDias(dias: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + dias);
    return date;
  }

  private hoyMovidoMeses(meses: number): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + meses);
    return date;
  }

  private isoLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
