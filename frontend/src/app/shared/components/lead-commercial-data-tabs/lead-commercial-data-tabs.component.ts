import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
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

export type LeadCommercialDataTab = 'datos' | 'direccion' | 'oferta' | 'historial';

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

@Component({
  selector: 'app-lead-commercial-data-tabs',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
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
  @Input() showHistorialTab = false;
  @Input() tipoDocumentoOptions: string[] = [];
  @Input() tipoDomicilioOptions: string[] = [];
  @Input() tipoViaOptions: string[] = [];
  @Input() departamentos: UbigeoItem[] = [];
  @Input() provinciasDomicilio: UbigeoItem[] = [];
  @Input() distritosDomicilio: UbigeoItem[] = [];
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

  @Output() activeTabChange = new EventEmitter<LeadCommercialDataTab>();
  @Output() tipoDocumentoChange = new EventEmitter<void>();
  @Output() departamentoDomicilioChange = new EventEmitter<void>();
  @Output() provinciaDomicilioChange = new EventEmitter<void>();
  @Output() distritoDomicilioChange = new EventEmitter<void>();
  @Output() ofertaProviderChange = new EventEmitter<number>();
  @Output() planChange = new EventEmitter<void>();
  @Output() incrementarAdicional = new EventEmitter<AdicionalResponse>();
  @Output() disminuirAdicional = new EventEmitter<AdicionalResponse>();

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
}
