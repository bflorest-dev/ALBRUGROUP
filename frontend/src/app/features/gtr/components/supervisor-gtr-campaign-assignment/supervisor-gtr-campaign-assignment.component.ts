import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import {
  DistribucionCampanasProveedorRequest,
  EquipoCampanaResponse,
  ProveedorCampanasEquipoResponse
} from '../../../../shared/models/preventa/preventa.models';
import { EquipoOperativoResponse } from '../../../preventa/services/preventa-lead.service';

interface CampaignLane {
  idEquipo: number | null;
  nombre: string;
  descripcion: string;
  campanas: EquipoCampanaResponse[];
  fueraDeAlcance?: boolean;
}

interface CambioDistribucion {
  campana: EquipoCampanaResponse;
  equipoOrigen: string;
  equipoDestino: string;
}

@Component({
  selector: 'app-supervisor-gtr-campaign-assignment',
  imports: [
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    ProgressSpinnerModule,
    SelectModule
  ],
  templateUrl: './supervisor-gtr-campaign-assignment.component.html',
  styleUrl: './supervisor-gtr-campaign-assignment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupervisorGtrCampaignAssignmentComponent {
  readonly proveedores = input<ProveedorCampanasEquipoResponse[]>([]);
  readonly proveedorSeleccionadoId = input<number | null>(null);
  readonly equipos = input<EquipoOperativoResponse[]>([]);
  readonly cargando = input(false);
  readonly guardando = input(false);

  readonly proveedorChange = output<number | null>();
  readonly save = output<DistribucionCampanasProveedorRequest>();

  protected readonly filtro = signal('');
  protected readonly borrador = signal<Map<number, number | null>>(new Map());
  protected readonly mostrarRevision = signal(false);
  protected readonly confirmacionVisible = signal(false);
  protected readonly draggedCampaignId = signal<number | null>(null);
  protected readonly distribucion = computed(() => {
    const idProveedor = this.proveedorSeleccionadoId();
    return this.proveedores().find((proveedor) => proveedor.idProveedor === idProveedor) ?? null;
  });
  protected readonly equiposDelProveedor = computed(() => {
    const distribucion = this.distribucion();
    if (!distribucion) {
      return [];
    }
    const ids = new Set(distribucion.equipoIds);
    return this.equipos().filter((equipo) => ids.has(equipo.id));
  });
  protected readonly destinos = computed(() => [
    { id: null as number | null, nombre: 'Sin equipo' },
    ...this.equiposDelProveedor().map((equipo) => ({ id: equipo.id, nombre: equipo.nombre }))
  ]);
  protected readonly lanes = computed<CampaignLane[]>(() => {
    const distribucion = this.distribucion();
    if (!distribucion) {
      return [];
    }
    const busqueda = this.filtro().trim().toLocaleLowerCase();
    const idsEquiposPermitidos = new Set(this.equiposDelProveedor().map((equipo) => equipo.id));
    const porDestino = new Map<number | null, EquipoCampanaResponse[]>();
    for (const campana of distribucion.campanas) {
      if (busqueda && !campana.nombre.toLocaleLowerCase().includes(busqueda)) {
        continue;
      }
      const destino = this.borrador().get(campana.id) ?? null;
      const key = destino !== null && !idsEquiposPermitidos.has(destino) ? -1 : destino;
      porDestino.set(key, [...(porDestino.get(key) ?? []), campana]);
    }
    const sinEquipo: CampaignLane = {
      idEquipo: null,
      nombre: 'Sin equipo',
      descripcion: 'Disponibles para asignar',
      campanas: porDestino.get(null) ?? []
    };
    const equipos = this.equiposDelProveedor().map((equipo) => ({
      idEquipo: equipo.id,
      nombre: equipo.nombre,
      descripcion: 'Equipo operativo',
      campanas: porDestino.get(equipo.id) ?? []
    }));
    const fueraDeAlcance = porDestino.get(-1) ?? [];
    return fueraDeAlcance.length
      ? [sinEquipo, ...equipos, {
        idEquipo: -1,
        nombre: 'Otro equipo',
        descripcion: 'No puedes modificar esta asignación',
        campanas: fueraDeAlcance,
        fueraDeAlcance: true
      }]
      : [sinEquipo, ...equipos];
  });
  protected readonly cambios = computed<CambioDistribucion[]>(() => {
    const distribucion = this.distribucion();
    if (!distribucion) {
      return [];
    }
    return distribucion.campanas
      .filter((campana) => (this.borrador().get(campana.id) ?? null) !== (campana.idEquipoAsignado ?? null))
      .map((campana) => ({
        campana,
        equipoOrigen: this.nombreEquipo(campana.idEquipoAsignado ?? null),
        equipoDestino: this.nombreEquipo(this.borrador().get(campana.id) ?? null)
      }));
  });

  constructor() {
    effect(() => {
      const distribucion = this.distribucion();
      this.filtro.set('');
      this.mostrarRevision.set(false);
      this.confirmacionVisible.set(false);
      this.borrador.set(new Map((distribucion?.campanas ?? []).map((campana) => [
        campana.id,
        campana.idEquipoAsignado ?? null
      ])));
    });
  }

  protected seleccionarProveedor(idProveedor: number | null): void {
    this.proveedorChange.emit(idProveedor);
  }

  protected moverCampana(idCampana: number, idEquipo: number | null): void {
    const distribucion = this.distribucion();
    if (!distribucion || this.guardando()) {
      return;
    }
    const campana = distribucion.campanas.find((item) => item.id === idCampana);
    if (!campana || !this.destinoEsValido(idEquipo)) {
      return;
    }
    this.borrador.update((actual) => {
      const siguiente = new Map(actual);
      siguiente.set(idCampana, idEquipo);
      return siguiente;
    });
  }

  protected iniciarArrastre(idCampana: number): void {
    if (!this.guardando()) {
      this.draggedCampaignId.set(idCampana);
    }
  }

  protected soltarEn(event: DragEvent, idEquipo: number | null): void {
    event.preventDefault();
    const idCampana = this.draggedCampaignId();
    this.draggedCampaignId.set(null);
    if (idCampana !== null) {
      this.moverCampana(idCampana, idEquipo);
    }
  }

  protected cancelarArrastre(): void {
    this.draggedCampaignId.set(null);
  }

  protected descartarCambios(): void {
    const distribucion = this.distribucion();
    this.borrador.set(new Map((distribucion?.campanas ?? []).map((campana) => [
      campana.id,
      campana.idEquipoAsignado ?? null
    ])));
    this.mostrarRevision.set(false);
  }

  protected abrirRevision(): void {
    if (this.cambios().length > 0) {
      this.mostrarRevision.set(true);
    }
  }

  protected confirmarGuardado(): void {
    const distribucion = this.distribucion();
    if (!distribucion || this.cambios().length === 0) {
      return;
    }
    this.confirmacionVisible.set(false);
    this.mostrarRevision.set(false);
    this.save.emit({
      asignaciones: distribucion.campanas.map((campana) => ({
        idCampana: campana.id,
        idEquipo: this.borrador().get(campana.id) ?? null
      }))
    });
  }

  protected nombreEquipo(idEquipo: number | null): string {
    if (idEquipo === null) {
      return 'Sin equipo';
    }
    return this.equipos().find((equipo) => equipo.id === idEquipo)?.nombre ?? 'Otro equipo';
  }

  private destinoEsValido(idEquipo: number | null): boolean {
    return idEquipo === null || this.equiposDelProveedor().some((equipo) => equipo.id === idEquipo);
  }
}
