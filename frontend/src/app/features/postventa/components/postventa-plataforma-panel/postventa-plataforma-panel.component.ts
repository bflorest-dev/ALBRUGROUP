import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { PostventaWorkspaceFacade } from '../../facades/postventa-workspace.facade';
import { PlataformaDigitalResponse, TipoDispositivo } from '../../services/postventa-lead.service';
import { EstadoBadge, SelectOption, display, estadoBadge } from '../../models/postventa.vm';

/** Entrega de credenciales de plataforma digital: flujo guiado plataforma → paquete → credencial,
 *  con dispositivo opcional y la tabla de entregas ya hechas. Usa el facade compartido. */
@Component({
  selector: 'app-postventa-plataforma-panel',
  imports: [
    ReactiveFormsModule,
    AutoCompleteModule,
    ButtonModule,
    CheckboxModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    TableModule,
    TagModule,
    TextareaModule
  ],
  templateUrl: './postventa-plataforma-panel.component.html',
  styleUrl: './postventa-plataforma-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostventaPlataformaPanelComponent {
  protected readonly facade = inject(PostventaWorkspaceFacade);
  private readonly fb = inject(NonNullableFormBuilder);

  private readonly today = this.todayLocalDate();
  protected readonly esObsequio = signal(true);
  protected readonly marcaSuggestions = signal<PlataformaDigitalResponse[]>([]);
  private handledLeadId = -1;

  // Estados de inventario: si falta plataforma/paquete/credencial, mostramos un vacio coherente
  // en vez de un formulario que luego no se puede completar.
  private readonly selectedPlataformaId = signal(0);
  private readonly selectedPaqueteId = signal(0);
  protected readonly noHayPlataformas = computed(() => this.facade.plataformas().length === 0);
  protected readonly sinPaquetes = computed(() => this.selectedPlataformaId() > 0 && this.facade.paquetes().length === 0);
  protected readonly sinCredenciales = computed(() => this.selectedPaqueteId() > 0 && this.facade.credenciales().length === 0);

  protected readonly tipoDispositivoOptions: SelectOption<TipoDispositivo>[] = [
    { label: 'TV', value: 'TV' },
    { label: 'TV Box', value: 'TV_BOX' },
    { label: 'Celular', value: 'CELULAR' },
    { label: 'Tablet', value: 'TABLET' },
    { label: 'Laptop', value: 'LAPTOP' }
  ];

  protected readonly form = this.fb.group({
    idPlataforma: [0],
    idPaquete: [0],
    idCredencial: [0, [Validators.min(1)]],
    cantidadUsuariosAsignados: [1, [Validators.required, Validators.min(1)]],
    esObsequio: [true],
    montoVenta: [null as number | null],
    fechaEntrega: [this.today],
    fechaInicioAcceso: [this.today],
    tipoDispositivo: ['' as TipoDispositivo | ''],
    marca: [null as PlataformaDigitalResponse | string | null],
    descripcionDispositivo: [''],
    observacion: ['']
  });

  constructor() {
    // Al abrir un lead nuevo, resetear el formulario y prefijar la plataforma ofrecida del lead.
    effect(() => {
      const lead = this.facade.selectedLead();
      const plataformas = this.facade.plataformas();
      if (!lead || lead.idLead === this.handledLeadId) {
        return;
      }
      if (plataformas.length === 0 && lead.idPlataformaDigitalOfrecida == null) {
        return;
      }
      this.handledLeadId = lead.idLead;
      const idPlataforma = lead.idPlataformaDigitalOfrecida ?? plataformas[0]?.id ?? 0;
      this.form.reset({
        idPlataforma,
        idPaquete: 0,
        idCredencial: 0,
        cantidadUsuariosAsignados: 1,
        esObsequio: true,
        montoVenta: null,
        fechaEntrega: this.today,
        fechaInicioAcceso: this.today,
        tipoDispositivo: '',
        marca: null,
        descripcionDispositivo: '',
        observacion: ''
      });
      this.esObsequio.set(true);
      this.selectedPlataformaId.set(idPlataforma ?? 0);
      this.selectedPaqueteId.set(0);
      if (idPlataforma) {
        void this.facade.onPlataformaChanged(idPlataforma);
      }
    });
  }

  protected badge(value: unknown): EstadoBadge {
    return estadoBadge(value);
  }

  protected display(value: unknown): string {
    return display(value);
  }

  protected onPlataformaChange(idPlataforma: number | null): void {
    this.form.patchValue({ idPaquete: 0, idCredencial: 0 });
    this.selectedPlataformaId.set(idPlataforma ?? 0);
    this.selectedPaqueteId.set(0);
    void this.facade.onPlataformaChanged(idPlataforma);
  }

  protected onPaqueteChange(idPaquete: number | null): void {
    this.form.patchValue({ idCredencial: 0 });
    this.selectedPaqueteId.set(idPaquete ?? 0);
    void this.facade.onPaqueteChanged(idPaquete);
  }

  protected onObsequioChange(value: boolean): void {
    this.esObsequio.set(value);
    if (value) {
      this.form.patchValue({ montoVenta: null });
    }
  }

  protected filtrarMarcas(query: string): void {
    const q = (query ?? '').toLowerCase().trim();
    const marcas = this.facade.marcas();
    this.marcaSuggestions.set(q ? marcas.filter((m) => (m.nombre ?? '').toLowerCase().includes(q)) : [...marcas]);
  }

  protected async guardar(): Promise<void> {
    if (this.form.controls.idCredencial.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    const ok = await this.facade.entregarCredencial({
      idCredencial: raw.idCredencial,
      cantidadUsuariosAsignados: raw.cantidadUsuariosAsignados,
      esObsequio: raw.esObsequio,
      montoVenta: raw.esObsequio ? null : raw.montoVenta,
      fechaEntrega: raw.fechaEntrega || null,
      fechaInicioAcceso: raw.fechaInicioAcceso || null,
      observacion: raw.observacion || null,
      dispositivos: this.buildDispositivos(raw)
    });
    if (ok) {
      this.form.patchValue({ idCredencial: 0, cantidadUsuariosAsignados: 1, tipoDispositivo: '', marca: null, descripcionDispositivo: '', observacion: '' });
    }
  }

  private buildDispositivos(raw: ReturnType<typeof this.form.getRawValue>) {
    const marca = raw.marca;
    const idMarca = marca && typeof marca === 'object' ? marca.id : null;
    const marcaTexto = typeof marca === 'string' && marca.trim() ? marca.trim() : null;
    const hasDevice = raw.tipoDispositivo || idMarca || marcaTexto || raw.descripcionDispositivo;
    if (!hasDevice) {
      return [];
    }
    return [
      {
        tipoDispositivo: raw.tipoDispositivo || null,
        idMarcaDispositivo: idMarca,
        marcaDispositivo: marcaTexto,
        descripcion: raw.descripcionDispositivo || null
      }
    ];
  }

  private todayLocalDate(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }
}
