import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import {
  AdicionalResponse,
  PlanResponse,
  PromocionComercialResponse,
  UbigeoItem
} from '../../models/preventa/preventa.models';
import { normalizePersonNameFinal, normalizePersonNameInput } from '../../utils/person-name';
import { DateFieldComponent } from '../date-field/date-field.component';

export type LeadCommercialDataTab = 'datos' | 'direccion' | 'oferta' | 'historial';
export type LeadCommercialDataTabsLayoutMode = 'default' | 'drawer';

export interface LeadCommercialProviderOption {
  id: number;
  nombre: string;
}

export interface LeadCommercialAdditionalSelection {
  idAdicional: number;
  nombre: string;
  precioUnitario?: number | null;
  cantidad: number;
}

type ParentescoOption = { label: string; value: string };

@Component({
  selector: 'app-lead-commercial-data-tabs',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DateFieldComponent,
    InputTextModule,
    MessageModule,
    SelectModule,
    SelectButtonModule,
    TabsModule,
    TagModule,
    TooltipModule
  ],
  templateUrl: './lead-commercial-data-tabs.component.html',
  styleUrl: './lead-commercial-data-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeadCommercialDataTabsComponent {
  @Input({ required: true }) datosForm!: FormGroup;
  @Input({ required: true }) direccionForm!: FormGroup;
  @Input({ required: true }) ofertaForm!: FormGroup;
  @Input() activeTab: LeadCommercialDataTab = 'datos';
  @Input() layoutMode: LeadCommercialDataTabsLayoutMode = 'default';
  @Input() showHistorialTab = false;
  @Input() tipoDocumentoOptions: string[] = [];
  @Input() tipoDomicilioOptions: string[] = [];
  @Input() tipoViaOptions: string[] = [];
  @Input() departamentos: UbigeoItem[] = [];
  @Input() provinciasDomicilio: UbigeoItem[] = [];
  @Input() distritosDomicilio: UbigeoItem[] = [];
  @Input() ubigeoDomicilioLoading = false;
  @Input() ubigeoDomicilioError: string | null = null;
  @Input() providerOptions: LeadCommercialProviderOption[] = [];
  @Input() selectedProviderId: number | null = null;
  @Input() planOptions: Array<Partial<PlanResponse> & { id: number; nombre: string }> = [];
  @Input() promocionOptions: Array<Partial<PromocionComercialResponse> & { id: number; reglaComercial: string }> = [];
  @Input() adicionales: AdicionalResponse[] = [];
  @Input() selectedAdditionals: LeadCommercialAdditionalSelection[] = [];
  @Input() additionalsTotal = 0;
  @Input() offerLocked = false;
  @Input() offerNoticeSeverity: 'info' | 'warn' | null = null;
  @Input() offerNoticeText: string | null = null;
  /** Modo solo-lectura: oculta acciones de edicion (+/- adicionales) y bloquea los selects de oferta. */
  @Input() readonly = false;
  /**
   * Campos de captura que el equipo del lead muestra (keys del catalogo CampoConfigurable, p. ej.
   * 'NOMBRE_MADRE', 'PLANO'). Resuelto por el backend segun el equipo del lead. Un campo con valor
   * guardado se muestra siempre (para no ocultar datos en vistas de solo-lectura de otro perfil).
   * Set vacio => solo se muestran los campos con valor. Se usa .has() (primitivo) para no romper CD.
   */
  @Input() camposVisibles: ReadonlySet<string> = new Set<string>();

  protected tieneValor(form: FormGroup, control: string): boolean {
    const value = form.get(control)?.value;
    return value !== null && value !== undefined && value !== '';
  }

  protected campoSoloLectura(campo: string): boolean {
    return this.readonly || !this.camposVisibles.has(campo);
  }

  @Output() activeTabChange = new EventEmitter<LeadCommercialDataTab>();
  @Output() tipoDocumentoChange = new EventEmitter<void>();
  @Output() departamentoDomicilioChange = new EventEmitter<void>();
  @Output() provinciaDomicilioChange = new EventEmitter<void>();
  @Output() distritoDomicilioChange = new EventEmitter<void>();
  @Output() ofertaProviderChange = new EventEmitter<number>();
  @Output() planChange = new EventEmitter<void>();
  @Output() incrementarAdicional = new EventEmitter<AdicionalResponse>();
  @Output() disminuirAdicional = new EventEmitter<AdicionalResponse>();

  protected readonly coordinatePasteMessage = signal<string | null>(null);
  protected readonly parentescoOptions: ParentescoOption[] = [
    { label: 'Titular', value: 'TITULAR' },
    { label: 'Madre', value: 'MADRE' },
    { label: 'Padre', value: 'PADRE' },
    { label: 'Hermano(a)', value: 'HERMANO_A' },
    { label: 'Tio(a)', value: 'TIO_A' },
    { label: 'Conocido', value: 'CONOCIDO' }
  ];

  private readonly viaSelectOptionsCache = new WeakMap<readonly string[], { label: string; value: string }[]>();

  /**
   * Opciones del select "Tipo de Via" con una primera entrada "SIN VIA" seleccionable
   * cuyo valor interno es vacio (el facade lo convierte a null al guardar). Cacheado por
   * la referencia del array de entrada para no devolver una nueva referencia en cada
   * change detection (evita el loop de CD con PrimeNG + OnPush).
   */
  protected viaSelectOptions(options: string[]): { label: string; value: string }[] {
    let cached = this.viaSelectOptionsCache.get(options);
    if (!cached) {
      cached = [{ label: 'SIN VIA', value: '' }, ...options.map((option) => ({ label: option, value: option }))];
      this.viaSelectOptionsCache.set(options, cached);
    }
    return cached;
  }

  /** Al elegir "SIN VIA", el nombre de via deja de tener sentido: se limpia para no enviar un dato huerfano. */
  protected onTipoViaChanged(): void {
    if (this.direccionForm.get('tipoVia')?.value) {
      return;
    }
    const via = this.direccionForm.get('via');
    if (via && via.value) {
      via.setValue('');
      via.markAsDirty();
    }
  }

  protected documentoServicioMaxLength(): number {
    switch (this.datosForm.get('tipoDocumento')?.value) {
      case 'DNI':
        return 8;
      case 'RUC':
        return 11;
      case 'CE':
        return 12;
      default:
        return 12;
    }
  }

  protected adicionalCantidad(idAdicional: number): number {
    return this.selectedAdditionals.find((item) => item.idAdicional === idAdicional)?.cantidad ?? 0;
  }

  protected display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  }

  protected setNumericDigits(control: AbstractControl | null, value: string, maxLength: number): void {
    if (!control) {
      return;
    }
    const normalized = value.replace(/\D/g, '').slice(0, maxLength);
    if (control.value !== normalized) {
      control.setValue(normalized);
      control.markAsDirty();
    }
  }

  protected setPersonNameValue(control: AbstractControl | null, value: string, trimEnd = false): void {
    if (!control) {
      return;
    }
    const normalized = trimEnd ? normalizePersonNameFinal(value) : normalizePersonNameInput(value);
    if (control.value !== normalized) {
      control.setValue(normalized);
      control.markAsDirty();
    }
  }

  protected setCoordinateValue(control: AbstractControl | null, value: string): void {
    if (!control) {
      return;
    }
    const normalized = this.normalizeCoordinate(value);
    if (control.value !== normalized) {
      control.setValue(normalized);
      control.markAsDirty();
    }
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

    this.setCoordinateValue(this.direccionForm.get('latitud'), coordinates.latitud);
    this.setCoordinateValue(this.direccionForm.get('longitud'), coordinates.longitud);
  }

  private extractCoordinatePair(value: string): { latitud: string; longitud: string } | null {
    const matches = value.match(/-?\d+(?:[.,]\d+)?/g);
    if (!matches || matches.length < 2) {
      return null;
    }

    const latitud = this.normalizeCoordinate(matches[0]);
    const longitud = this.normalizeCoordinate(matches[1]);
    const latitudNumber = Number(latitud);
    const longitudNumber = Number(longitud);

    if (
      !Number.isFinite(latitudNumber) ||
      !Number.isFinite(longitudNumber) ||
      latitudNumber < -90 ||
      latitudNumber > 90 ||
      longitudNumber < -180 ||
      longitudNumber > 180
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

    if (!integerDigits && !decimalDigits) {
      return sign;
    }

    const coordinate = `${sign}${integerDigits}${decimalDigits ? `.${decimalDigits}` : ''}`;
    return this.stripTrailingCoordinateZeros(coordinate);
  }

  private stripTrailingCoordinateZeros(value: string): string {
    if (!value.includes('.')) {
      return value;
    }
    return value.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  }
}
