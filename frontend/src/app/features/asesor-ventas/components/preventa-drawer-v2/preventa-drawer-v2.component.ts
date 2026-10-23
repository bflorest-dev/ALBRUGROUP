import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, OnInit, WritableSignal, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom, startWith } from 'rxjs';
import { PhoneActionButtonComponent } from '../../../../shared/components/phone-action-button/phone-action-button.component';
import { PhoneNumberFieldComponent } from '../../../../shared/components/phone-number-field/phone-number-field.component';
import { PlanOfertaFilterChange, PlanOfertaServiceComposition, PlanResponse, UbigeoItem } from '../../../../shared/models/preventa/preventa.models';
import { normalizePersonNameFinal, normalizePersonNameInput } from '../../../../shared/utils/person-name';
import { PreventaLeadService } from '../../../preventa/services/preventa-lead.service';
import { AsesorVentasWorkspaceFacade } from '../../facades/asesor-ventas-workspace.facade';

type DrawerSection = 'personal' | 'address' | 'offer';

@Component({
  selector: 'app-preventa-drawer-v2',
  standalone: true,
  imports: [ReactiveFormsModule, PhoneActionButtonComponent, PhoneNumberFieldComponent],
  templateUrl: './preventa-drawer-v2.component.html',
  styleUrl: './preventa-drawer-v2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreventaDrawerV2Component implements OnInit, OnDestroy {
  protected readonly facade = inject(AsesorVentasWorkspaceFacade);
  private readonly preventaService = inject(PreventaLeadService);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly fullMode = signal(false);
  protected readonly openSections = signal<ReadonlySet<DrawerSection>>(new Set());
  protected readonly coordinateMessage = signal<string | null>(null);
  protected readonly activeMessage = computed(() => {
    const error = this.facade.errorMessage();
    if (error) return { text: error, kind: 'error', icon: 'pi pi-exclamation-circle' };
    const warning = this.facade.warningMessage();
    if (warning) return { text: warning, kind: 'warning', icon: 'pi pi-exclamation-triangle' };
    const success = this.facade.successMessage();
    return success ? { text: success, kind: 'success', icon: 'pi pi-check-circle' } : null;
  });
  protected readonly createNextOpportunity = signal(false);
  protected readonly birthDepartmentId = signal(0);
  protected readonly birthProvinceId = signal(0);
  protected readonly birthDistrictId = signal(0);
  protected readonly birthProvinces = signal<UbigeoItem[]>([]);
  protected readonly birthDistricts = signal<UbigeoItem[]>([]);
  protected readonly birthLocationLoading = signal(false);
  protected readonly birthLocationError = signal<string | null>(null);
  private readonly birthDateValue = toSignal(this.facade.datosForm.controls.fechaNacimiento.valueChanges.pipe(startWith(this.facade.datosForm.controls.fechaNacimiento.value)), { initialValue: '' });
  protected readonly calculatedAge = computed(() => {
    const match = String(this.birthDateValue() ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return '';
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const birth = new Date(year, month - 1, day);
    if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day) return '';
    const today = new Date();
    let age = today.getFullYear() - year;
    if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--;
    return age >= 0 ? `${age} años` : '';
  });
  protected readonly additionalsExpanded = signal(false);
  protected readonly planPickerOpen = signal(false);
  protected readonly planSearch = signal('');
  protected readonly visiblePlans = computed(() => {
    const query = this.normalizePlanSearch(this.planSearch());
    const plans: PlanResponse[] = this.facade.planOptions().filter((plan) => plan.id !== 0);
    if (!query) return plans;
    return plans.filter((plan) => this.normalizePlanSearch([
      plan.nombre,
      plan.internetVelocidad,
      plan.velocidadPromocional,
      plan.televisionNombre || plan.televisionCanales ? 'TV television' : '',
      plan.televisionNombre,
      plan.telefonoDescripcion || plan.telefonoMinutos ? 'telefono telefonia' : '',
      plan.telefonoDescripcion
    ].filter((part) => part !== null && part !== undefined).join(' ')).includes(query));
  });
  protected readonly planServiceOptions: ReadonlyArray<{ label: string; value: PlanOfertaServiceComposition | null }> = [
    { label: 'Todos', value: null },
    { label: 'Internet', value: 'INTERNET' },
    { label: 'Internet + TV', value: 'INTERNET_TV' },
    { label: 'Internet + TV + teléfono', value: 'INTERNET_TV_TELEFONIA' }
  ];
  private birthLocationRequest = 0;
  private planFiltersInitialized = false;
  private hydratedBirthCode: string | null = null;
  private bodyOverflow = '';
  private rootOverflow = '';

  constructor() {
    effect(() => this.syncOverlay(this.facade.detailDialogOpen()));
    this.expireMessage(this.facade.errorMessage);
    this.expireMessage(this.facade.warningMessage);
    this.expireMessage(this.facade.successMessage);
  }

  private expireMessage(message: WritableSignal<string | null>): void {
    effect((onCleanup) => {
      if (!this.facade.detailDialogOpen()) return;
      const current = message();
      if (!current) return;
      const timeout = setTimeout(() => {
        if (message() === current) message.set(null);
      }, 10_000);
      onCleanup(() => clearTimeout(timeout));
    });
  }

  ngOnInit(): void {
    this.bodyOverflow = this.document.body.style.overflow;
    this.rootOverflow = this.document.documentElement.style.overflow;
  }

  ngOnDestroy(): void {
    this.restoreScroll();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.planPickerOpen()) {
      this.closePlanPicker();
      (this.host.nativeElement.querySelector('.preventa-v2__plan-trigger') as HTMLButtonElement | null)?.focus();
      return;
    }
    if (this.facade.detailDialogOpen() && !this.facade.isSaving()) {
      this.facade.requestCloseDetail();
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: PointerEvent): void {
    if (this.planPickerOpen() && !this.host.nativeElement.querySelector('.preventa-v2__plan-choice')?.contains(event.target as Node)) {
      this.closePlanPicker();
    }
  }

  protected syncOverlay(visible: boolean): void {
    if (visible) {
      this.document.body.style.overflow = 'hidden';
      this.document.documentElement.style.overflow = 'hidden';
      return;
    }
    this.restoreScroll();
    this.fullMode.set(false);
    this.openSections.set(new Set());
    this.createNextOpportunity.set(false);
    this.coordinateMessage.set(null);
    this.additionalsExpanded.set(false);
    this.planFiltersInitialized = false;
    this.closePlanPicker();
    this.resetBirthLocation();
  }

  protected display(value: unknown, fallback = 'Sin registrar'): string {
    if (value === null || value === undefined || String(value).trim() === '') {
      return fallback;
    }
    return String(value);
  }

  protected customerName(): string {
    const detail = this.facade.detail();
    return this.display(detail?.nombreTitular, 'Contacto sin nombre registrado');
  }

  protected providerName(): string {
    const detail = this.facade.detail();
    const selectedId = this.facade.selectedOfertaProviderId();
    return this.facade.ofertaProviderOptions().find((item) => item.id === selectedId)?.nombre
      ?? detail?.nombreProveedorPlan
      ?? detail?.nombreProveedorCampana
      ?? detail?.nombreProveedorEquipo
      ?? 'Sin proveedor asignado';
  }

  protected providerTone(): string {
    return `is-${this.providerName().trim().toLocaleLowerCase('es-PE').replace(/[^a-z0-9]+/g, '-')}`;
  }

  protected isSectionOpen(section: DrawerSection): boolean {
    return this.openSections().has(section);
  }

  protected toggleSection(section: DrawerSection): void {
    if (section === 'offer') this.closePlanPicker();
    this.fullMode.set(true);
    this.openSections.update((current) => {
      const next = new Set(current);
      next.has(section) ? next.delete(section) : next.add(section);
      return next;
    });
    if (section === 'offer') {
      if (this.isSectionOpen('offer')) this.initializePlanFilters();
      void this.facade.setActiveDataTab('oferta');
      if (this.isSectionOpen('offer') && this.facade.selectedOfertaAdditionals().length) this.additionalsExpanded.set(true);
    } else if (section === 'personal' && this.isSectionOpen('personal')) {
      void this.loadBirthLocation();
    }
  }

  protected openFullMode(): void {
    this.fullMode.set(true);
    this.openSections.set(new Set<DrawerSection>(['personal', 'address', 'offer']));
    this.initializePlanFilters();
    void this.loadBirthLocation();
    if (this.facade.selectedOfertaAdditionals().length) this.additionalsExpanded.set(true);
  }

  protected collapseToSimple(): void {
    this.closePlanPicker();
    this.fullMode.set(false);
    this.openSections.set(new Set());
  }

  private initializePlanFilters(): void {
    if (this.planFiltersInitialized) return;
    this.planFiltersInitialized = true;
    void this.facade.initializePlanOfertaFiltersV2();
  }

  protected onDocumentTypeChange(): void {
    this.facade.onTipoDocumentoChanged();
  }

  protected setDigits(control: 'numeroDocumentoTitularServicio' | 'celularRegistro' | 'celularReferencia' | 'celularGrabacion' | 'ubigeoNacimiento' | 'numeroDocumentoTitularCelularRegistro' | 'numero', value: string, maxLength: number): void {
    if (control === 'numero') {
      this.applyDigits(this.facade.direccionForm.controls.numero, value, maxLength);
      return;
    }
    const fields = this.facade.datosForm.controls;
    switch (control) {
      case 'numeroDocumentoTitularServicio':
        this.applyDigits(fields.numeroDocumentoTitularServicio, value, maxLength);
        return;
      case 'celularRegistro':
        this.applyDigits(fields.celularRegistro, value, maxLength);
        return;
      case 'celularReferencia':
        this.applyDigits(fields.celularReferencia, value, maxLength);
        return;
      case 'celularGrabacion':
        this.applyDigits(fields.celularGrabacion, value, maxLength);
        return;
      case 'ubigeoNacimiento':
        this.applyDigits(fields.ubigeoNacimiento, value, maxLength);
        return;
      case 'numeroDocumentoTitularCelularRegistro':
        this.applyDigits(fields.numeroDocumentoTitularCelularRegistro, value, maxLength);
        return;
    }
  }

  private applyDigits(target: AbstractControl, value: string, maxLength: number): void {
    const normalized = value.replace(/\D/g, '').slice(0, maxLength);
    if (target.value !== normalized) {
      target.setValue(normalized);
      target.markAsDirty();
    }
  }

  protected normalizeName(control: 'nombreTitularServicio' | 'nombreMadre' | 'nombrePadre' | 'nombreTitularCelularRegistro', value: string, final = false): void {
    const target = this.facade.datosForm.controls[control];
    const normalized = final ? normalizePersonNameFinal(value) : normalizePersonNameInput(value);
    if (target.value !== normalized) {
      target.setValue(normalized);
      target.markAsDirty();
    }
  }

  protected documentMaxLength(): number {
    switch (this.facade.datosForm.controls.tipoDocumento.value) {
      case 'DNI': return 8;
      case 'RUC': return 11;
      case 'CE': return 12;
      default: return 12;
    }
  }

  protected selectProvider(): void {
    const id = Number(this.facade.ofertaForm.controls.idProveedor.value) || 0;
    const previousId = this.facade.selectedOfertaProviderId() ?? 0;
    if (id === previousId) return;
    const hasProviderDependentData = this.facade.ofertaForm.controls.idPlan.value
      || this.facade.direccionForm.controls.plano.value
      || this.facade.tipificacionForm.controls.tecnologia.value
      || this.facade.direccionForm.controls.esJalaCobertura.value
      || this.facade.direccionForm.controls.esZonaPintada.value;
    if (hasProviderDependentData && !this.document.defaultView?.confirm('Cambiar el proveedor limpiará los datos que ya no correspondan. ¿Deseas continuar?')) {
      this.facade.ofertaForm.controls.idProveedor.setValue(previousId);
      return;
    }
    this.additionalsExpanded.set(false);
    void this.facade.onOfertaProviderChanged(id);
  }

  protected onPlanChange(): void {
    void this.facade.onPlanChanged();
  }

  protected selectedPlan(): PlanResponse | null {
    const id = this.facade.ofertaForm.controls.idPlan.value;
    return this.facade.planOptions().find((plan) => plan.id === id && plan.id !== 0) ?? null;
  }

  protected togglePlanPicker(): void {
    if (this.isReadOnly() || this.facade.planOfertaLoading() || !this.facade.selectedOfertaProviderId()) return;
    if (this.planPickerOpen()) {
      this.closePlanPicker();
    } else {
      this.planSearch.set('');
      this.planPickerOpen.set(true);
      setTimeout(() => (this.host.nativeElement.querySelector('.preventa-v2__plan-search') as HTMLInputElement | null)?.focus(), 0);
    }
  }

  protected closePlanPicker(): void {
    this.planPickerOpen.set(false);
    this.planSearch.set('');
  }

  protected selectPlan(id: number): void {
    this.facade.ofertaForm.controls.idPlan.setValue(id);
    this.facade.ofertaForm.controls.idPlan.markAsDirty();
    this.closePlanPicker();
    this.onPlanChange();
  }

  protected formatPlanPrice(value: number | null | undefined): string {
    return value == null ? 'No informado' : `S/ ${this.planPriceFormatter.format(value)}`;
  }

  private readonly planPriceFormatter = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  private normalizePlanSearch(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-PE').trim();
  }

  protected onDepartmentChange(): void {
    void this.facade.onDepartamentoDomicilioChanged();
  }

  protected onProvinceChange(): void {
    void this.facade.onProvinciaDomicilioChanged();
  }

  protected onDistrictChange(): void {
    this.facade.onDistritoDomicilioChanged();
  }

  protected async selectBirthDepartment(rawId: string): Promise<void> {
    const id = Number(rawId) || 0;
    const request = ++this.birthLocationRequest;
    this.birthDepartmentId.set(id);
    this.birthProvinceId.set(0);
    this.birthDistrictId.set(0);
    this.birthProvinces.set([]);
    this.birthDistricts.set([]);
    this.updateBirthCode('');
    this.birthLocationError.set(null);
    if (!id) return;
    this.birthLocationLoading.set(true);
    try {
      const provinces = await firstValueFrom(this.preventaService.listarProvincias(id));
      if (request === this.birthLocationRequest) this.birthProvinces.set(provinces);
    } catch {
      if (request === this.birthLocationRequest) this.birthLocationError.set('No pudimos cargar las provincias. Vuelve a elegir el departamento.');
    } finally {
      if (request === this.birthLocationRequest) this.birthLocationLoading.set(false);
    }
  }

  protected async selectBirthProvince(rawId: string): Promise<void> {
    const id = Number(rawId) || 0;
    const request = ++this.birthLocationRequest;
    this.birthProvinceId.set(id);
    this.birthDistrictId.set(0);
    this.birthDistricts.set([]);
    this.updateBirthCode('');
    this.birthLocationError.set(null);
    if (!id) return;
    this.birthLocationLoading.set(true);
    try {
      const districts = await firstValueFrom(this.preventaService.listarDistritos(id));
      if (request === this.birthLocationRequest) this.birthDistricts.set(districts);
    } catch {
      if (request === this.birthLocationRequest) this.birthLocationError.set('No pudimos cargar los distritos. Vuelve a elegir la provincia.');
    } finally {
      if (request === this.birthLocationRequest) this.birthLocationLoading.set(false);
    }
  }

  protected selectBirthDistrict(rawId: string): void {
    const id = Number(rawId) || 0;
    this.birthDistrictId.set(id);
    this.updateBirthCode(this.birthDistricts().find((item) => item.id === id)?.codigo ?? '');
  }

  protected changePlanFilter(key: PlanOfertaFilterChange['key'], value: PlanOfertaFilterChange['value']): void {
    void this.facade.onPlanOfertaFilterChanged({ key, value });
  }

  protected toggleAdditionals(): void {
    this.additionalsExpanded.update((current) => !current);
  }

  protected toggleComment(): void {
    this.facade.toggleComment();
  }

  protected toggleNextOpportunity(): void {
    this.createNextOpportunity.update((current) => !current);
  }

  protected submitTipification(): void {
    void this.facade.tipificar(this.createNextOpportunity());
  }

  protected createOpportunityFromOtherStage(): void {
    void this.facade.crearOportunidadV2();
  }

  protected async pasteCoordinates(): Promise<void> {
    this.coordinateMessage.set(null);
    try {
      const raw = await navigator.clipboard?.readText();
      const coordinates = raw ? this.extractCoordinates(raw) : null;
      if (!coordinates) {
        this.coordinateMessage.set('Pega una latitud y longitud válidas dentro del Perú.');
        return;
      }
      this.facade.direccionForm.controls.latitud.setValue(coordinates.latitud);
      this.facade.direccionForm.controls.longitud.setValue(coordinates.longitud);
      this.facade.direccionForm.controls.latitud.markAsDirty();
      this.facade.direccionForm.controls.longitud.markAsDirty();
      this.coordinateMessage.set('Coordenadas listas para guardar.');
    } catch {
      this.coordinateMessage.set('No pudimos leer el portapapeles. Ingresa las coordenadas manualmente.');
    }
  }

  protected mapsUrl(): string | null {
    const lat = Number(String(this.facade.direccionForm.controls.latitud.value ?? '').replace(',', '.'));
    const lng = Number(String(this.facade.direccionForm.controls.longitud.value ?? '').replace(',', '.'));
    return this.isPeruCoordinate(lat, lng) ? `https://www.google.com/maps?q=${lat},${lng}` : null;
  }

  protected fieldVisible(field: string): boolean {
    return this.facade.camposVisibles().has(field);
  }

  protected requiresHour(): boolean {
    return this.facade.requiresScheduledTime();
  }

  protected isReadOnly(): boolean {
    return this.facade.atencionOtraEtapa();
  }

  private resetBirthLocation(): void {
    this.birthLocationRequest++;
    this.hydratedBirthCode = null;
    this.birthDepartmentId.set(0);
    this.birthProvinceId.set(0);
    this.birthDistrictId.set(0);
    this.birthProvinces.set([]);
    this.birthDistricts.set([]);
    this.birthLocationLoading.set(false);
    this.birthLocationError.set(null);
  }

  private updateBirthCode(code: string): void {
    const control = this.facade.datosForm.controls.ubigeoNacimiento;
    this.hydratedBirthCode = code;
    if (control.value !== code) {
      control.setValue(code);
      control.markAsDirty();
    }
  }

  private async loadBirthLocation(): Promise<void> {
    const code = String(this.facade.datosForm.controls.ubigeoNacimiento.value ?? '').trim();
    if (code === this.hydratedBirthCode) return;
    const request = ++this.birthLocationRequest;
    this.hydratedBirthCode = code;
    this.birthDepartmentId.set(0);
    this.birthProvinceId.set(0);
    this.birthDistrictId.set(0);
    this.birthProvinces.set([]);
    this.birthDistricts.set([]);
    this.birthLocationError.set(null);
    if (!code) return;
    this.birthLocationLoading.set(true);
    try {
      const departments = this.facade.departamentos().length
        ? this.facade.departamentos()
        : await firstValueFrom(this.preventaService.listarDepartamentos());
      if (request !== this.birthLocationRequest) return;
      const department = departments.find((item) => item.codigo === code.slice(0, 2));
      if (!department) throw new Error('unknown birth department');
      this.birthDepartmentId.set(department.id);
      const provinces = await firstValueFrom(this.preventaService.listarProvincias(department.id));
      if (request !== this.birthLocationRequest) return;
      this.birthProvinces.set(provinces);
      const province = provinces.find((item) => item.codigo === code.slice(0, 4));
      if (!province) throw new Error('unknown birth province');
      this.birthProvinceId.set(province.id);
      const districts = await firstValueFrom(this.preventaService.listarDistritos(province.id));
      if (request !== this.birthLocationRequest) return;
      this.birthDistricts.set(districts);
      const district = districts.find((item) => item.codigo === code);
      if (!district) throw new Error('unknown birth district');
      this.birthDistrictId.set(district.id);
    } catch {
      if (request === this.birthLocationRequest) this.birthLocationError.set(`No pudimos resolver el ubigeo ${code}. El valor guardado se conserva; elige la ubicación para corregirlo.`);
    } finally {
      if (request === this.birthLocationRequest) this.birthLocationLoading.set(false);
    }
  }

  private restoreScroll(): void {
    this.document.body.style.overflow = this.bodyOverflow;
    this.document.documentElement.style.overflow = this.rootOverflow;
  }

  private extractCoordinates(raw: string): { latitud: string; longitud: string } | null {
    const values = raw.match(/-?\d+(?:[.,]\d+)?/g);
    if (!values || values.length < 2) return null;
    const lat = Number(values[0].replace(',', '.'));
    const lng = Number(values[1].replace(',', '.'));
    if (!this.isPeruCoordinate(lat, lng)) return null;
    return { latitud: String(lat), longitud: String(lng) };
  }

  private isPeruCoordinate(lat: number, lng: number): boolean {
    return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -18.6 && lat <= 0.2 && lng >= -81.6 && lng <= -68.4;
  }
}
