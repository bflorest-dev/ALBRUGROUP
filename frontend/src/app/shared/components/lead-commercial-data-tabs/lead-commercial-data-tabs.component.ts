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

  @Output() activeTabChange = new EventEmitter<LeadCommercialDataTab>();
  @Output() tipoDocumentoChange = new EventEmitter<void>();
  @Output() departamentoDomicilioChange = new EventEmitter<void>();
  @Output() provinciaDomicilioChange = new EventEmitter<void>();
  @Output() distritoDomicilioChange = new EventEmitter<void>();
  @Output() ofertaProviderChange = new EventEmitter<number>();
  @Output() planChange = new EventEmitter<void>();
  @Output() incrementarAdicional = new EventEmitter<AdicionalResponse>();
  @Output() disminuirAdicional = new EventEmitter<AdicionalResponse>();

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
