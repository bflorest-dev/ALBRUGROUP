import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, firstValueFrom } from 'rxjs';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { CampoCaptura, Tecnologia, UbigeoItem } from '../../../../shared/models/preventa/preventa.models';
import {
  coordenadaValidator,
  documentoValidator,
  limpiarCoordenada,
  limpiarDocumento,
  limpiarNombrePersona,
  limpiarPrefijo,
  limpiarTelefonoPorPrefijo,
  limpiarUsermeta,
  prefijoValidator,
  soloDigitos,
  telefonoValidator
} from '../../../bitacora/utils/bitacora-input.rules';
import {
  FreelanceOpciones,
  FreelanceVentaCrearRequest,
  FreelanceVentaPreparacion,
  FreelanceVentaReenvioRequest,
  FreelanceVentaResponse
} from '../../models/freelance.models';
import { FreelanceService } from '../../services/freelance.service';

type DrawerMode = 'crear' | 'corregir';

@Component({
  selector: 'app-freelance-venta-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DateFieldComponent],
  templateUrl: './freelance-venta-drawer.component.html',
  styleUrl: './freelance-venta-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FreelanceVentaDrawerComponent {
  readonly visible = input(false);
  readonly mode = input<DrawerMode>('crear');
  readonly idLead = input<number | null>(null);
  readonly close = output<void>();
  readonly saved = output<FreelanceVentaResponse>();

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(FreelanceService);
  private readonly destroyRef = inject(DestroyRef);
  readonly step = signal(0);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly checkingIdentity = signal(false);
  readonly error = signal<string | null>(null);
  readonly discardConfirmationOpen = signal(false);
  readonly maxDocumentoTitular = signal(8);
  readonly maxCelularLength = signal(9);
  readonly opciones = signal<FreelanceOpciones | null>(null);
  readonly preparacion = signal<FreelanceVentaPreparacion | null>(null);
  readonly selectedProvider = signal<number | null>(null);
  readonly departamentos = signal<UbigeoItem[]>([]);
  readonly provinciasNacimiento = signal<UbigeoItem[]>([]);
  readonly distritosNacimiento = signal<UbigeoItem[]>([]);
  readonly provinciasDomicilio = signal<UbigeoItem[]>([]);
  readonly distritosDomicilio = signal<UbigeoItem[]>([]);

  readonly form = this.fb.group({
    prefijo: ['51', [Validators.required, prefijoValidator()]],
    lead: ['', Validators.required],
    usermeta: ['', [Validators.maxLength(80), Validators.pattern(/^[A-Za-z0-9._-]*$/)]],
    tipoDocumento: ['DNI', Validators.required],
    numeroDocumentoTitularServicio: ['', Validators.required],
    nombreTitularServicio: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(160), Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/)]],
    celularRegistro: ['', Validators.required],
    celularReferencia: [''],
    celularGrabacion: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    fechaNacimiento: ['', Validators.required],
    parentesco: [''],
    tecnologia: ['' as Tecnologia | ''],
    esFullClaro: [false],
    esJalaCobertura: [false],
    esZonaPintada: [false],
    ubigeoNacimiento: ['', Validators.pattern(/^\d{6}$/)],
    idDepartamentoNacimiento: [null as number | null],
    idProvinciaNacimiento: [null as number | null],
    idDistritoNacimiento: [null as number | null],
    nombreMadre: ['', Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]*$/)],
    nombrePadre: ['', Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]*$/)],
    numeroDocumentoTitularCelularRegistro: ['', Validators.pattern(/^\d{8,11}$/)],
    nombreTitularCelularRegistro: [''],
    ubigeoDomicilio: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    idDepartamentoDomicilio: [null as number | null, Validators.required],
    idProvinciaDomicilio: [null as number | null, Validators.required],
    idDistritoDomicilio: [null as number | null, Validators.required],
    tipoDomicilio: ['HOGAR', Validators.required],
    tipoVia: ['CALLE'],
    via: [''],
    direccion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(250)]],
    referencia: ['', [Validators.required, Validators.maxLength(250)]],
    latitud: ['', coordenadaValidator('latitud', true)],
    longitud: ['', coordenadaValidator('longitud', true)],
    urbanizacion: [''],
    numero: [''],
    manzana: [''],
    lote: [''],
    nombreEdificio: [''],
    nombreCondominio: [''],
    plano: [''],
    piso: [''],
    interior: [''],
    idProveedor: [null as number | null, Validators.required],
    idPlan: [null as number | null, Validators.required]
  });

  readonly providers = computed(() => this.opciones()?.proveedores ?? []);
  readonly selectedProviderName = computed(() =>
    this.providers().find((provider) => provider.id === this.selectedProvider())?.nombre.trim().toUpperCase() ?? ''
  );
  readonly isWin = computed(() => this.selectedProviderName() === 'WIN');
  readonly isClaro = computed(() => this.selectedProviderName().includes('CLARO'));
  readonly configuredFields = computed(() =>
    this.providers().find((provider) => provider.id === this.selectedProvider())?.camposCaptura ?? []
  );
  readonly plans = computed(() => {
    const provider = this.selectedProvider();
    return (this.opciones()?.planes ?? []).filter((plan) => !provider || plan.idProveedor === provider);
  });
  readonly title = computed(() => this.mode() === 'corregir' ? 'Corregir venta retornada' : 'Agregar venta');
  readonly todayIso = new Date().toISOString().slice(0, 10);

  private lastLoadKey = '';
  private departamentosPromise: Promise<UbigeoItem[]> | null = null;

  constructor() {
    this.configureCoreValidators();
    this.configureNormalizers();
    effect(() => {
      if (!this.visible()) {
        this.lastLoadKey = '';
        return;
      }
      const key = `${this.mode()}-${this.idLead() ?? 'new'}`;
      if (key === this.lastLoadKey) return;
      this.lastLoadKey = key;
      this.load();
    });
  }

  next(): void {
    const controls = this.stepControls(this.step());
    controls.forEach((name) => this.form.get(name)?.markAsTouched());
    if (controls.some((name) => this.form.get(name)?.invalid)) return;
    if (this.step() === 0 && this.mode() === 'crear') {
      this.checkIdentityAndContinue();
      return;
    }
    this.step.update((value) => Math.min(3, value + 1));
  }

  previous(): void {
    this.step.update((value) => Math.max(0, value - 1));
  }

  goToCompletedStep(target: number): void {
    if (target <= this.step()) this.step.set(target);
  }

  selectProvider(value: string): void {
    const id = value ? Number(value) : null;
    const providerChanged = this.selectedProvider() !== id;
    this.selectedProvider.set(id);
    this.form.controls.idProveedor.setValue(id);
    if (providerChanged) {
      this.form.patchValue({ tecnologia: '', esFullClaro: false, esJalaCobertura: false, esZonaPintada: false }, { emitEvent: false });
    }
    if (!this.isWin()) this.form.controls.parentesco.setValue('', { emitEvent: false });
    const plan = this.opciones()?.planes.find((item) => item.id === this.form.controls.idPlan.value);
    if (plan && plan.idProveedor !== id) this.form.controls.idPlan.setValue(null);
    this.applyConfiguredValidators();
  }

  selectPlan(id: number): void {
    this.form.controls.idPlan.setValue(id);
    this.form.controls.idPlan.markAsTouched();
  }

  fieldVisible(field: CampoCaptura): boolean {
    return this.configuredFields().some((item) => item.campo === field && item.visible);
  }

  fieldRequired(field: CampoCaptura): boolean {
    return this.configuredFields().some((item) => item.campo === field && item.visible && item.requerido);
  }

  async selectDepartment(type: 'nacimiento' | 'domicilio', value: string): Promise<void> {
    const id = value ? Number(value) : null;
    if (type === 'nacimiento') {
      this.form.patchValue({ idDepartamentoNacimiento: id, idProvinciaNacimiento: null, idDistritoNacimiento: null, ubigeoNacimiento: '' });
      this.provinciasNacimiento.set(id ? await firstValueFrom(this.service.listarProvincias(id)) : []);
      this.distritosNacimiento.set([]);
    } else {
      this.form.patchValue({ idDepartamentoDomicilio: id, idProvinciaDomicilio: null, idDistritoDomicilio: null, ubigeoDomicilio: '' });
      this.provinciasDomicilio.set(id ? await firstValueFrom(this.service.listarProvincias(id)) : []);
      this.distritosDomicilio.set([]);
    }
  }

  async selectProvince(type: 'nacimiento' | 'domicilio', value: string): Promise<void> {
    const id = value ? Number(value) : null;
    const items = id ? await firstValueFrom(this.service.listarDistritos(id)) : [];
    if (type === 'nacimiento') {
      this.form.patchValue({ idProvinciaNacimiento: id, idDistritoNacimiento: null, ubigeoNacimiento: '' });
      this.distritosNacimiento.set(items);
    } else {
      this.form.patchValue({ idProvinciaDomicilio: id, idDistritoDomicilio: null, ubigeoDomicilio: '' });
      this.distritosDomicilio.set(items);
    }
  }

  selectDistrict(type: 'nacimiento' | 'domicilio', value: string): void {
    const id = value ? Number(value) : null;
    const items = type === 'nacimiento' ? this.distritosNacimiento() : this.distritosDomicilio();
    const code = items.find((item) => item.id === id)?.codigo ?? '';
    if (type === 'nacimiento') this.form.patchValue({ idDistritoNacimiento: id, ubigeoNacimiento: code });
    else this.form.patchValue({ idDistritoDomicilio: id, ubigeoDomicilio: code });
  }

  requestDismiss(): void {
    if (this.saving()) return;
    if (this.form.dirty) {
      this.discardConfirmationOpen.set(true);
      return;
    }
    this.close.emit();
  }

  continueEditing(): void {
    this.discardConfirmationOpen.set(false);
  }

  discardAndClose(): void {
    if (this.saving()) return;
    this.discardConfirmationOpen.set(false);
    this.close.emit();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Revisa los campos marcados antes de continuar.');
      return;
    }
    const v = this.form.getRawValue();
    const common = {
      requestId: crypto.randomUUID(),
      idPlan: Number(v.idPlan),
      datosPreventa: {
        tipoDocumento: v.tipoDocumento!,
        numeroDocumentoTitularServicio: v.numeroDocumentoTitularServicio!,
        nombreTitularServicio: v.nombreTitularServicio,
        celularRegistro: v.celularRegistro,
        celularReferencia: this.nullIfBlank(v.celularReferencia),
        celularGrabacion: this.nullIfBlank(v.celularGrabacion),
        correo: v.correo,
        fechaNacimiento: v.fechaNacimiento,
        parentesco: this.nullIfBlank(v.parentesco),
        ubigeoNacimiento: this.nullIfBlank(v.ubigeoNacimiento),
        nombreMadre: this.nullIfBlank(v.nombreMadre),
        nombrePadre: this.nullIfBlank(v.nombrePadre),
        numeroDocumentoTitularCelularRegistro: this.nullIfBlank(v.numeroDocumentoTitularCelularRegistro),
        nombreTitularCelularRegistro: this.nullIfBlank(v.nombreTitularCelularRegistro)
      },
      direccion: {
        ubigeoDomicilio: v.ubigeoDomicilio!,
        tipoDomicilio: this.nullIfBlank(v.tipoDomicilio),
        tipoVia: this.nullIfBlank(v.tipoVia),
        via: this.nullIfBlank(v.via),
        direccion: v.direccion!,
        referencia: this.nullIfBlank(v.referencia),
        latitud: this.normalizarCoordenadaPayload(v.latitud),
        longitud: this.normalizarCoordenadaPayload(v.longitud),
        urbanizacion: this.nullIfBlank(v.urbanizacion),
        numero: this.nullIfBlank(v.numero),
        manzana: this.nullIfBlank(v.manzana),
        lote: this.nullIfBlank(v.lote),
        nombreEdificio: this.nullIfBlank(v.nombreEdificio),
        nombreCondominio: this.nullIfBlank(v.nombreCondominio),
        plano: this.nullIfBlank(v.plano),
        piso: this.nullIfBlank(v.piso),
        interior: this.nullIfBlank(v.interior),
        tecnologia: this.isClaro() ? v.tecnologia || null : null,
        esFullClaro: this.isClaro() && v.esFullClaro,
        esJalaCobertura: this.isWin() && v.esJalaCobertura,
        esZonaPintada: this.isWin() && v.esZonaPintada
      }
    };
    this.saving.set(true);
    this.error.set(null);
    const request$ = this.mode() === 'corregir'
      ? this.service.reenviar(this.idLead()!, common as FreelanceVentaReenvioRequest)
      : this.service.crear({
          ...common,
          prefijo: `+${v.prefijo!}`,
          lead: v.lead!,
          usermeta: this.nullIfBlank(v.usermeta)
        } as FreelanceVentaCrearRequest);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (response) => {
        this.resetFormState();
        this.lastLoadKey = '';
        this.saved.emit(response);
      },
      error: (error) => this.error.set(error?.error?.message ?? 'No se pudo guardar la venta. Inténtalo nuevamente.')
    });
  }

  invalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && control.touched;
  }

  planName(): string {
    return this.opciones()?.planes.find((plan) => plan.id === this.form.controls.idPlan.value)?.nombre ?? '—';
  }

  speedUnit(unit: string | null | undefined): string {
    if (unit === 'GBPS') return 'Gbps';
    return 'Mbps';
  }

  private load(): void {
    this.resetFormState();
    this.loading.set(true);
    void this.ensureDepartments();
    this.service.opciones().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (options) => {
        this.opciones.set(options);
        if (this.mode() === 'corregir' && this.idLead()) {
          this.loadCorrection(this.idLead()!);
        } else if (options.proveedores.length === 1) {
          this.selectProvider(String(options.proveedores[0].id));
        }
      },
      error: (error) => this.error.set(error?.error?.message ?? 'No se pudieron cargar las opciones del equipo.')
    });
  }

  private resetFormState(): void {
    this.step.set(0);
    this.error.set(null);
    this.discardConfirmationOpen.set(false);
    this.preparacion.set(null);
    this.selectedProvider.set(null);
    this.provinciasNacimiento.set([]);
    this.distritosNacimiento.set([]);
    this.provinciasDomicilio.set([]);
    this.distritosDomicilio.set([]);
    this.form.controls.prefijo.enable({ emitEvent: false });
    this.form.controls.lead.enable({ emitEvent: false });
    this.form.controls.usermeta.enable({ emitEvent: false });
    this.form.reset({
      prefijo: '51', tipoDocumento: 'DNI', parentesco: '', tecnologia: '',
      esFullClaro: false, esJalaCobertura: false, esZonaPintada: false,
      tipoDomicilio: 'HOGAR', tipoVia: 'CALLE'
    });
  }

  private loadCorrection(idLead: number): void {
    this.loading.set(true);
    this.service.preparar(idLead).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (preparation) => {
        this.preparacion.set(preparation);
        const d = preparation.detalle;
        const plan = this.opciones()?.planes.find((item) => item.id === d.idPlan);
        this.selectedProvider.set(plan?.idProveedor ?? null);
        this.form.controls.idProveedor.setValue(plan?.idProveedor ?? null);
        this.form.patchValue({
          prefijo: limpiarPrefijo(d.prefijo ?? '51'), lead: d.lead ?? '', usermeta: d.usermeta ?? '',
          tipoDocumento: d.tipoDocumento ?? 'DNI', numeroDocumentoTitularServicio: d.numeroDocumentoTitularServicio ?? '',
          nombreTitularServicio: d.nombreTitular ?? '', celularRegistro: d.celularRegistro ?? '',
          celularReferencia: d.celularReferencia ?? '', celularGrabacion: d.celularGrabacion ?? '', correo: d.correo ?? '',
          fechaNacimiento: d.fechaNacimiento ?? '', parentesco: this.isWin() ? d.parentesco ?? '' : '', ubigeoNacimiento: d.ubigeoNacimiento ?? '',
          nombreMadre: d.nombreMadre ?? '', nombrePadre: d.nombrePadre ?? '',
          numeroDocumentoTitularCelularRegistro: d.numeroDocumentoTitularCelularRegistro ?? '',
          nombreTitularCelularRegistro: d.nombreTitularCelularRegistro ?? '', ubigeoDomicilio: d.ubigeoDomicilio ?? '',
          tecnologia: this.isClaro() ? this.normalizeTecnologia(d.tecnologia) : '',
          esFullClaro: this.isClaro() && Boolean(d.esFullClaro),
          esJalaCobertura: this.isWin() && Boolean(d.esJalaCobertura),
          esZonaPintada: this.isWin() && Boolean(d.esZonaPintada),
          tipoDomicilio: d.tipoDomicilio ?? 'HOGAR', tipoVia: d.tipoVia ?? 'CALLE', via: d.via ?? '',
          direccion: d.direccion ?? '', referencia: d.referencia ?? '', latitud: d.latitud ?? '', longitud: d.longitud ?? '',
          urbanizacion: d.urbanizacion ?? '', numero: d.numero ?? '', manzana: d.manzana ?? '', lote: d.lote ?? '',
          nombreEdificio: d.nombreEdificio ?? '', nombreCondominio: d.nombreCondominio ?? '', plano: d.plano ?? '',
          piso: d.piso ?? '', interior: d.interior ?? '', idPlan: d.idPlan ?? null
        });
        this.applyConfiguredValidators();
        this.form.controls.prefijo.disable();
        this.form.controls.lead.disable();
        this.form.controls.usermeta.disable();
        void this.resolveStoredUbigeo('nacimiento', d.ubigeoNacimiento ?? '');
        void this.resolveStoredUbigeo('domicilio', d.ubigeoDomicilio ?? '');
      },
      error: (error) => this.error.set(error?.error?.message ?? 'No se pudo preparar la corrección.')
    });
  }

  private stepControls(step: number): string[] {
    if (step === 0) return ['prefijo', 'lead', 'usermeta'];
    if (step === 1) {
      const controls = ['idProveedor', 'tipoDocumento', 'numeroDocumentoTitularServicio', 'nombreTitularServicio',
        'celularRegistro', 'celularReferencia', 'celularGrabacion', 'correo', 'fechaNacimiento',
        'idDepartamentoDomicilio', 'idProvinciaDomicilio', 'idDistritoDomicilio',
        'tipoDomicilio', 'direccion', 'referencia', 'latitud', 'longitud'];
      const configured: Record<CampoCaptura, string> = {
        NOMBRE_MADRE: 'nombreMadre', NOMBRE_PADRE: 'nombrePadre',
        DOC_TITULAR_CELULAR: 'numeroDocumentoTitularCelularRegistro',
        NOMBRE_TITULAR_CELULAR: 'nombreTitularCelularRegistro', PLANO: 'plano'
      };
      for (const item of this.configuredFields()) {
        if (item.visible && item.requerido) controls.push(configured[item.campo]);
      }
      return controls;
    }
    if (step === 2) return ['idPlan'];
    return [];
  }

  private nullIfBlank(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private normalizeTecnologia(value: string | null | undefined): Tecnologia | '' {
    return value === 'HFC' || value === 'FTTH' || value === 'HIBRIDA' ? value : '';
  }

  private applyConfiguredValidators(): void {
    const controls: Record<CampoCaptura, string> = {
      NOMBRE_MADRE: 'nombreMadre',
      NOMBRE_PADRE: 'nombrePadre',
      DOC_TITULAR_CELULAR: 'numeroDocumentoTitularCelularRegistro',
      NOMBRE_TITULAR_CELULAR: 'nombreTitularCelularRegistro',
      PLANO: 'plano'
    };
    for (const [field, name] of Object.entries(controls) as [CampoCaptura, string][]) {
      const control = this.form.get(name);
      const visible = this.fieldVisible(field);
      if (!visible) control?.setValue('', { emitEvent: false });
      const validators = this.fieldRequired(field) ? [Validators.required] : [];
      if (field === 'DOC_TITULAR_CELULAR') validators.push(Validators.pattern(/^\d{6,12}$/));
      if (field === 'NOMBRE_MADRE' || field === 'NOMBRE_PADRE' || field === 'NOMBRE_TITULAR_CELULAR') {
        validators.push(Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]*$/));
      }
      control?.setValidators(validators);
      control?.updateValueAndValidity({ emitEvent: false });
    }
  }

  private configureCoreValidators(): void {
    const prefix = () => this.form.controls.prefijo.value;
    this.form.controls.prefijo.setValidators([Validators.required, prefijoValidator()]);
    this.form.controls.lead.setValidators([Validators.required, telefonoValidator(prefix)]);
    this.form.controls.numeroDocumentoTitularServicio.setValidators([
      Validators.required,
      documentoValidator(() => this.form.controls.tipoDocumento.value)
    ]);
    this.form.controls.celularRegistro.setValidators([Validators.required, telefonoValidator(prefix)]);
    this.form.controls.celularReferencia.setValidators([telefonoValidator(prefix)]);
    this.form.controls.celularGrabacion.setValidators([Validators.required, telefonoValidator(prefix)]);
    this.form.controls.tipoDocumento.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((tipo) => {
      const normalizedType = String(tipo ?? '').toUpperCase();
      this.maxDocumentoTitular.set(normalizedType === 'DNI' ? 8 : normalizedType === 'RUC' ? 11 : 12);
      this.form.controls.numeroDocumentoTitularServicio.updateValueAndValidity({ emitEvent: false });
    });
  }

  private configureNormalizers(): void {
    this.normalizeControl(this.form.controls.prefijo, limpiarPrefijo, () => {
      const prefix = this.form.controls.prefijo.value;
      const prefixDigits = String(prefix ?? '').replace(/\D/g, '');
      this.maxCelularLength.set(prefixDigits === '51' ? 9 : 12);
      for (const name of ['lead', 'celularRegistro', 'celularReferencia', 'celularGrabacion'] as const) {
        const control = this.form.controls[name];
        control.setValue(limpiarTelefonoPorPrefijo(control.value, prefix), { emitEvent: false });
        control.updateValueAndValidity({ emitEvent: false });
      }
    });
    this.normalizeControl(this.form.controls.lead,
      (value) => limpiarTelefonoPorPrefijo(value, this.form.controls.prefijo.value));
    this.normalizeControl(this.form.controls.usermeta, limpiarUsermeta);
    this.normalizeControl(this.form.controls.numeroDocumentoTitularServicio, limpiarDocumento);
    this.normalizeControl(this.form.controls.numeroDocumentoTitularCelularRegistro, (value) => soloDigitos(value, 12));
    for (const name of ['celularRegistro', 'celularReferencia', 'celularGrabacion'] as const) {
      this.normalizeControl(this.form.controls[name],
        (value) => limpiarTelefonoPorPrefijo(value, this.form.controls.prefijo.value));
    }
    for (const name of ['nombreTitularServicio', 'nombreTitularCelularRegistro', 'nombreMadre', 'nombrePadre'] as const) {
      this.normalizeControl(this.form.controls[name], limpiarNombrePersona);
    }
    this.normalizeControl(this.form.controls.latitud, limpiarCoordenada);
    this.normalizeControl(this.form.controls.longitud, limpiarCoordenada);
  }

  private normalizeControl(
    control: { value: unknown; valueChanges: import('rxjs').Observable<unknown>; setValue: (value: string, options: { emitEvent: boolean }) => void },
    normalize: (value: unknown) => string,
    after?: () => void
  ): void {
    control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      const normalized = normalize(value);
      if (value !== normalized) control.setValue(normalized, { emitEvent: false });
      after?.();
    });
  }

  private normalizarCoordenadaPayload(value: string | null | undefined): string {
    return (this.nullIfBlank(value) ?? '').replace(',', '.');
  }

  private async resolveStoredUbigeo(type: 'nacimiento' | 'domicilio', code: string): Promise<void> {
    if (!/^\d{6}$/.test(code)) return;
    await this.ensureDepartments();
    const department = this.departamentos().find((item) => item.codigo === code.slice(0, 2));
    if (!department) return;
    const provinces = await firstValueFrom(this.service.listarProvincias(department.id));
    const province = provinces.find((item) => item.codigo === code.slice(0, 4));
    if (!province) return;
    const districts = await firstValueFrom(this.service.listarDistritos(province.id));
    const district = districts.find((item) => item.codigo === code);
    if (!district) return;
    if (type === 'nacimiento') {
      this.provinciasNacimiento.set(provinces);
      this.distritosNacimiento.set(districts);
      this.form.patchValue({ idDepartamentoNacimiento: department.id, idProvinciaNacimiento: province.id, idDistritoNacimiento: district.id });
    } else {
      this.provinciasDomicilio.set(provinces);
      this.distritosDomicilio.set(districts);
      this.form.patchValue({ idDepartamentoDomicilio: department.id, idProvinciaDomicilio: province.id, idDistritoDomicilio: district.id });
    }
  }

  private ensureDepartments(): Promise<UbigeoItem[]> {
    if (this.departamentos().length) return Promise.resolve(this.departamentos());
    if (this.departamentosPromise) return this.departamentosPromise;
    this.departamentosPromise = firstValueFrom(this.service.listarDepartamentos())
      .then((items) => {
        this.departamentos.set(items);
        return items;
      })
      .finally(() => this.departamentosPromise = null);
    return this.departamentosPromise;
  }

  private checkIdentityAndContinue(): void {
    const value = this.form.getRawValue();
    this.checkingIdentity.set(true);
    this.error.set(null);
    this.service.validarIdentidad(`+${value.prefijo!}`, value.lead!, this.nullIfBlank(value.usermeta))
      .pipe(finalize(() => this.checkingIdentity.set(false)))
      .subscribe({
        next: (availability) => {
          if (!availability.telefonoDisponible || !availability.usermetaDisponible) {
            this.error.set(availability.mensaje ?? 'La identidad ya se encuentra registrada.');
            return;
          }
          this.step.set(1);
        },
        error: (error) => this.error.set(error?.error?.message ?? 'No se pudo validar la identidad.')
      });
  }
}
