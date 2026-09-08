import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  signal
} from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import {
  AdicionalResponse,
  EventoResponse,
  LeadDetalleResponse,
  PlanResponse,
  PromocionComercialResponse,
  SubtipificacionResponse,
  TipificacionResponse,
  UbigeoItem
} from '../../models/preventa/preventa.models';
import { PhoneActionButtonComponent } from '../phone-action-button/phone-action-button.component';

export type VentaDrawerMode = 'gestion' | 'consulta';
type VentaDrawerTab = 'datos' | 'direccion' | 'plan' | 'historial';
type EditableSection = 'identidad' | 'contacto' | 'proveedor' | 'ubicacion' | 'detalle-direccion' | 'geolocalizacion' | null;
type ProviderOption = { id: number; nombre: string };
type AdditionalSelection = { idAdicional: number; nombre: string; precioUnitario?: number | null; cantidad: number };
type HistoryGroup = { key: string; label: string; events: EventoResponse[] };

@Component({
  selector: 'app-venta-drawer-v2',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    InputTextModule,
    SelectModule,
    PhoneActionButtonComponent
  ],
  templateUrl: './venta-drawer-v2.component.html',
  styleUrl: './venta-drawer-v2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VentaDrawerV2Component implements OnChanges, OnDestroy {
  @Input() visible = false;
  @Input() mode: VentaDrawerMode = 'gestion';
  @Input() detail: LeadDetalleResponse | null = null;
  @Input({ required: true }) datosForm!: FormGroup;
  @Input({ required: true }) direccionForm!: FormGroup;
  @Input({ required: true }) ofertaForm!: FormGroup;
  @Input({ required: true }) tipificacionForm!: FormGroup;
  @Input() camposVisibles: ReadonlySet<string> = new Set<string>();
  @Input() tipoDocumentoOptions: string[] = [];
  @Input() tipoDomicilioOptions: string[] = [];
  @Input() tipoViaOptions: string[] = [];
  @Input() departamentos: UbigeoItem[] = [];
  @Input() provinciasDomicilio: UbigeoItem[] = [];
  @Input() distritosDomicilio: UbigeoItem[] = [];
  @Input() providerOptions: ProviderOption[] = [];
  @Input() planOptions: Array<Partial<PlanResponse> & { id: number; nombre: string }> = [];
  @Input() promocionOptions: Array<Partial<PromocionComercialResponse> & { id: number; reglaComercial: string }> = [];
  @Input() adicionales: AdicionalResponse[] = [];
  @Input() selectedAdditionals: AdditionalSelection[] = [];
  @Input() additionalsTotal = 0;
  @Input() offerLocked = false;
  @Input() offerNoticeText: string | null = null;
  @Input() tipificaciones: TipificacionResponse[] = [];
  @Input() subtipificaciones: SubtipificacionResponse[] = [];
  @Input() requiresProgramming = false;
  @Input() requiresInstallDate = false;
  @Input() requiresRejectionDate = false;
  @Input() requiresSecSot = false;
  @Input() requiresCustomerId = false;
  @Input() canMutate = true;
  @Input() saving = false;
  @Input() eventos: EventoResponse[] = [];
  @Input() historyLoading = false;
  @Input() historyError: string | null = null;
  @Input() saveChanges: (() => Promise<boolean>) | null = null;

  @Output() closeRequested = new EventEmitter<void>();
  @Output() callStarted = new EventEmitter<void>();
  @Output() callError = new EventEmitter<string>();
  @Output() chatRequested = new EventEmitter<void>();
  @Output() tipoDocumentoChange = new EventEmitter<void>();
  @Output() departamentoDomicilioChange = new EventEmitter<void>();
  @Output() provinciaDomicilioChange = new EventEmitter<void>();
  @Output() distritoDomicilioChange = new EventEmitter<void>();
  @Output() ofertaProviderChange = new EventEmitter<number>();
  @Output() planChange = new EventEmitter<void>();
  @Output() incrementarAdicional = new EventEmitter<AdicionalResponse>();
  @Output() disminuirAdicional = new EventEmitter<AdicionalResponse>();
  @Output() tipificacionSelected = new EventEmitter<string | null>();
  @Output() subtipificacionSelected = new EventEmitter<string | null>();
  @Output() tipifyRequested = new EventEmitter<void>();
  @Output() retryHistory = new EventEmitter<void>();

  protected readonly activeTab = signal<VentaDrawerTab>('datos');
  protected readonly summaryOpen = signal(true);
  protected readonly editingSection = signal<EditableSection>(null);
  protected readonly planEditing = signal(false);
  protected readonly commentOpen = signal(false);
  protected readonly coordinatePasteMessage = signal<string | null>(null);
  protected readonly historyFilter = signal<'TODO' | 'TIPIFICACION' | 'ASIGNACION'>('TODO');
  protected readonly sectionSaving = signal(false);

  private sectionSnapshot: Record<string, unknown> | null = null;
  private planSnapshot: Record<string, unknown> | null = null;
  private previousBodyOverflow = '';
  private previousRootOverflow = '';
  private readonly pickerDateCache = new Map<string, Date | null>();

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      this.document.body.classList.toggle('venta-drawer-v2-open', this.visible);
      if (this.visible) {
        this.previousBodyOverflow = this.document.body.style.overflow;
        this.previousRootOverflow = this.document.documentElement.style.overflow;
        this.document.body.style.overflow = 'hidden';
        this.document.documentElement.style.overflow = 'hidden';
        this.activeTab.set('datos');
        this.summaryOpen.set(true);
        this.editingSection.set(null);
        this.planEditing.set(false);
        this.commentOpen.set(false);
      } else {
        this.restoreBodyScroll();
        this.pickerDateCache.clear();
      }
    }
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('venta-drawer-v2-open');
    this.restoreBodyScroll();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.visible && !this.saving) {
      this.closeRequested.emit();
    }
  }

  protected readonly tabs: Array<{ id: VentaDrawerTab; label: string; icon: string }> = [
    { id: 'datos', label: 'Datos', icon: 'pi pi-id-card' },
    { id: 'direccion', label: 'Dirección', icon: 'pi pi-map-marker' },
    { id: 'plan', label: 'Plan', icon: 'pi pi-box' },
    { id: 'historial', label: 'Historial', icon: 'pi pi-history' }
  ];

  protected get readOnly(): boolean {
    return this.mode === 'consulta';
  }

  protected setTab(tab: VentaDrawerTab): void {
    this.activeTab.set(tab);
    this.editingSection.set(null);
    this.planEditing.set(false);
    this.coordinatePasteMessage.set(null);
  }

  protected startSectionEdit(section: Exclude<EditableSection, null>): void {
    if (this.readOnly || !this.canMutate) return;
    this.sectionSnapshot = this.formForSection(section).getRawValue();
    this.editingSection.set(section);
  }

  protected cancelSectionEdit(): void {
    const section = this.editingSection();
    if (section && this.sectionSnapshot) {
      this.formForSection(section).reset(this.sectionSnapshot);
    }
    this.sectionSnapshot = null;
    this.editingSection.set(null);
    this.coordinatePasteMessage.set(null);
  }

  protected async applySectionEdit(): Promise<void> {
    if (!this.saveChanges || this.sectionSaving()) return;
    this.sectionSaving.set(true);
    try {
      if (await this.saveChanges()) {
        this.sectionSnapshot = null;
        this.editingSection.set(null);
        this.coordinatePasteMessage.set(null);
      }
    } finally {
      this.sectionSaving.set(false);
    }
  }

  protected startPlanEdit(): void {
    if (this.readOnly || this.offerLocked || !this.canMutate) return;
    this.planSnapshot = this.ofertaForm.getRawValue();
    this.planEditing.set(true);
  }

  protected cancelPlanEdit(): void {
    if (this.planSnapshot) this.ofertaForm.reset(this.planSnapshot);
    this.planSnapshot = null;
    this.planEditing.set(false);
  }

  protected async applyPlanEdit(): Promise<void> {
    if (!this.saveChanges || this.sectionSaving()) return;
    this.sectionSaving.set(true);
    try {
      if (await this.saveChanges()) {
        this.planSnapshot = null;
        this.planEditing.set(false);
      }
    } finally {
      this.sectionSaving.set(false);
    }
  }

  protected formForSection(section: Exclude<EditableSection, null>): FormGroup {
    return section === 'identidad' || section === 'contacto' || section === 'proveedor'
      ? this.datosForm
      : this.direccionForm;
  }

  protected hasValue(form: FormGroup, control: string): boolean {
    const value = form.get(control)?.value;
    return value !== null && value !== undefined && String(value).trim() !== '';
  }

  protected showConfiguredField(key: string, form: FormGroup, control: string): boolean {
    return this.camposVisibles.has(key) || this.hasValue(form, control);
  }

  protected display(value: unknown, empty = 'Sin registrar'): string {
    if (value === null || value === undefined || String(value).trim() === '') return empty;
    return String(value);
  }

  protected providerLabel(): string {
    if (this.planEditing()) {
      return this.display(this.selectedPlan()?.nombreProveedor, 'Proveedor');
    }
    return this.display(
      this.detail?.nombreProveedorPlan ?? this.detail?.nombreProveedorCampana ?? this.detail?.nombreProveedorEquipo,
      'Proveedor'
    );
  }

  protected documentLabel(): string {
    return [this.detail?.tipoDocumento, this.detail?.numeroDocumentoTitularServicio].filter(Boolean).join(' · ') || 'Documento sin registrar';
  }

  protected currentTipification(): string {
    return this.display(
      this.detail?.tipificacionActual
        || this.tipificacionForm?.get('codigoTipificacion')?.value
        || this.latestVentaTipification()?.tipificacion,
      'Sin tipificar'
    );
  }

  protected currentSubtipification(): string {
    return this.display(
      this.detail?.subtipificacionActual
        || this.tipificacionForm?.get('codigoSubtipificacion')?.value
        || this.latestVentaTipification()?.subtipificacion,
      'Sin subtipificación'
    );
  }

  protected salesAdvisor(): string {
    return this.display(this.detail?.nombreAsesorMeritoPreventa, 'Sin registrar');
  }

  private latestVentaTipification(): EventoResponse | null {
    return this.eventos.find((event) =>
      event.accion === 'TIPIFICACION' && (!event.etapa || event.etapa === 'VENTA')
    ) ?? null;
  }

  protected operationalDate(): { label: string; value: string } | null {
    const candidates = this.eventos
      .flatMap((event) => [
        event.fechaInstalacion ? { label: 'Instalación', value: event.fechaInstalacion, at: event.createdAt ?? '' } : null,
        event.fechaRechazo ? { label: 'Rechazo', value: event.fechaRechazo, at: event.createdAt ?? '' } : null,
        event.fechaProgramacion ? { label: 'Programación', value: event.fechaProgramacion, at: event.createdAt ?? '' } : null
      ])
      .filter((item): item is { label: string; value: string; at: string } => !!item)
      .sort((a, b) => b.at.localeCompare(a.at));
    if (candidates.length) return candidates[0];
    if (this.detail?.fechaRechazo) return { label: 'Rechazo', value: this.detail.fechaRechazo };
    if (this.detail?.fechaProgramacion) return { label: 'Programación', value: this.detail.fechaProgramacion };
    return null;
  }

  protected formatDate(value?: string | null, withTime = false): string {
    if (!value) return 'Sin registrar';
    const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
    }).format(date);
  }

  protected money(value?: number | null): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(value ?? 0);
  }

  protected previewPlanPrice(): number {
    if (this.planEditing()) {
      return Number(this.selectedPlan()?.precio ?? 0);
    }
    return Number(this.detail?.precioPlan ?? this.selectedPlan()?.precio ?? 0);
  }

  protected previewAdditionalsPrice(): number {
    if (this.planEditing()) {
      return Number(this.additionalsTotal ?? 0);
    }
    return Number(this.detail?.precioAdicionales ?? this.additionalsTotal ?? 0);
  }

  protected previewTotal(): number {
    if (this.planEditing()) {
      return this.previewPlanPrice() + this.previewAdditionalsPrice();
    }
    return Number(this.detail?.precioFinal ?? (this.previewPlanPrice() + this.previewAdditionalsPrice()));
  }

  protected selectedPlan(): Array<Partial<PlanResponse> & { id: number; nombre: string }> [number] | null {
    const formValue = this.ofertaForm.get('idPlan')?.value;
    const id = Number(this.planEditing() ? (formValue ?? 0) : (formValue ?? this.detail?.idPlan ?? 0));
    return this.planOptions.find((plan) => plan.id === id) ?? null;
  }

  protected selectedPromotion(): Array<Partial<PromocionComercialResponse> & { id: number; reglaComercial: string }> [number] | null {
    const formValue = this.ofertaForm.get('idPromocionInterna')?.value;
    const id = Number(this.planEditing() ? (formValue ?? 0) : (formValue ?? this.detail?.idPromocionInterna ?? 0));
    return this.promocionOptions.find((promotion) => promotion.id === id) ?? null;
  }

  protected internetSpeed(): string {
    const internet = this.detail?.plan?.internet;
    const catalogPlan = this.selectedPlan();
    const speed = internet?.velocidad ?? catalogPlan?.internetVelocidad;
    const unit = internet?.unidad ?? catalogPlan?.internetUnidad ?? 'Mbps';
    return speed ? `${speed} ${unit}` : 'No incluido';
  }

  protected internetPromotion(): string {
    const speed = this.detail?.plan?.velocidadPromocional ?? this.selectedPlan()?.velocidadPromocional;
    const months = this.detail?.plan?.mesesPromocionVelocidad ?? this.selectedPlan()?.mesesPromocionVelocidad;
    return speed ? `${speed} Mbps${months ? ` por ${months} meses` : ''}` : '';
  }

  protected televisionName(): string {
    return this.display(this.detail?.plan?.television?.nombre ?? this.selectedPlan()?.televisionNombre, 'No incluida');
  }

  protected televisionDetail(): string {
    const channels = this.detail?.plan?.television?.cantidadCanales ?? this.selectedPlan()?.televisionCanales;
    return channels ? `${channels} canales` : '';
  }

  protected phoneName(): string {
    return this.display(this.detail?.plan?.telefono?.descripcion ?? this.selectedPlan()?.telefonoDescripcion, 'No incluida');
  }

  protected phoneDetail(): string {
    const minutes = this.detail?.plan?.telefono?.minutos ?? this.selectedPlan()?.telefonoMinutos;
    return minutes ? `${minutes} minutos` : '';
  }

  protected availableAdditionals(): AdicionalResponse[] {
    const selected = new Set(this.selectedAdditionals.map((item) => item.idAdicional));
    return this.adicionales.filter((item) => !selected.has(item.id));
  }

  protected historyGroups(): HistoryGroup[] {
    const filtered = this.eventos.filter((event) => this.historyFilter() === 'TODO' || event.accion === this.historyFilter());
    const groups = new Map<string, EventoResponse[]>();
    for (const event of filtered) {
      const key = event.createdAt?.slice(0, 10) ?? 'sin-fecha';
      groups.set(key, [...(groups.get(key) ?? []), event]);
    }
    return [...groups.entries()].map(([key, events]) => ({
      key,
      label: key === 'sin-fecha' ? 'Sin fecha' : this.formatDate(key),
      events
    }));
  }

  protected historyTitle(event: EventoResponse): string {
    if (event.accion === 'TIPIFICACION') {
      return [event.tipificacion, event.subtipificacion].filter(Boolean).join(' · ') || 'Tipificación';
    }
    if (event.accion === 'ASIGNACION') return `Asignación a ${this.display(event.nombreAsesorAsignado, 'asesor')}`;
    return this.display(event.accion, 'Actividad').replaceAll('_', ' ');
  }

  protected setDigits(control: string, value: string, max: number): void {
    this.tipificacionForm.get(control)?.setValue(value.replace(/\D/g, '').slice(0, max));
    this.tipificacionForm.get(control)?.markAsDirty();
  }

  protected async pasteCoordinatesFromClipboard(): Promise<void> {
    this.coordinatePasteMessage.set(null);

    if (!navigator.clipboard?.readText) {
      this.coordinatePasteMessage.set('No pudimos acceder al portapapeles. Revisa el permiso e intenta nuevamente.');
      return;
    }

    let pasted: string;
    try {
      pasted = await navigator.clipboard.readText();
    } catch {
      this.coordinatePasteMessage.set('No pudimos acceder al portapapeles. Revisa el permiso e intenta nuevamente.');
      return;
    }

    const coordinates = this.extractCoordinatePair(pasted);
    if (!coordinates) {
      this.coordinatePasteMessage.set('Copia la latitud y longitud juntas e intenta nuevamente.');
      return;
    }

    this.direccionForm.get('latitud')?.setValue(coordinates.latitud);
    this.direccionForm.get('longitud')?.setValue(coordinates.longitud);
    this.direccionForm.get('latitud')?.markAsDirty();
    this.direccionForm.get('longitud')?.markAsDirty();
  }

  private extractCoordinatePair(value: string): { latitud: string; longitud: string } | null {
    const matches = value.match(/-?\d+(?:[.,]\d+)?/g);
    if (!matches || matches.length < 2) return null;

    const latitud = this.normalizeCoordinate(matches[0]);
    const longitud = this.normalizeCoordinate(matches[1]);
    const latitudNumber = Number(latitud);
    const longitudNumber = Number(longitud);
    if (
      !Number.isFinite(latitudNumber) || latitudNumber < -90 || latitudNumber > 90
      || !Number.isFinite(longitudNumber) || longitudNumber < -180 || longitudNumber > 180
    ) {
      return null;
    }
    return { latitud, longitud };
  }

  private normalizeCoordinate(value: string): string {
    const normalizedSeparator = value.replace(',', '.');
    const sign = normalizedSeparator.trimStart().startsWith('-') ? '-' : '';
    const unsigned = normalizedSeparator.replace(/-/g, '');
    const [integerPart = '', ...decimalParts] = unsigned.split('.');
    const integerDigits = integerPart.replace(/\D/g, '').slice(0, 3);
    const decimalDigits = decimalParts.join('').replace(/\D/g, '').slice(0, 40);
    if (!integerDigits && !decimalDigits) return sign;
    return this.stripTrailingCoordinateZeros(`${sign}${integerDigits}${decimalDigits ? `.${decimalDigits}` : ''}`);
  }

  private stripTrailingCoordinateZeros(value: string): string {
    if (!value.includes('.')) return value;
    return value.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  }

  protected pickerDate(value: unknown): Date | null {
    if (value instanceof Date) return value;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const cached = this.pickerDateCache.get(value);
    if (cached !== undefined) return cached;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const result = Number.isNaN(date.getTime()) ? null : date;
    this.pickerDateCache.set(value, result);
    return result;
  }

  protected setDateValue(form: FormGroup, control: string, value: Date | string | null): void {
    let normalized = '';
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const year = value.getFullYear();
      const month = `${value.getMonth() + 1}`.padStart(2, '0');
      const day = `${value.getDate()}`.padStart(2, '0');
      normalized = `${year}-${month}-${day}`;
    } else if (typeof value === 'string') {
      normalized = value;
    }
    form.get(control)?.setValue(normalized);
    form.get(control)?.markAsDirty();
  }

  private restoreBodyScroll(): void {
    this.document.body.style.overflow = this.previousBodyOverflow;
    this.document.documentElement.style.overflow = this.previousRootOverflow;
  }
}
