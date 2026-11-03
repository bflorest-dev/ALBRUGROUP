import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { EquipoCampanaResponse } from '../../../../shared/models/preventa/preventa.models';
import { EquipoOperativoResponse } from '../../../preventa/services/preventa-lead.service';

interface CampanaOption extends EquipoCampanaResponse {
  asignacionLabel: string;
  disabled: boolean;
}

@Component({
  selector: 'app-supervisor-gtr-campaign-assignment',
  imports: [FormsModule, ButtonModule, MessageModule, MultiSelectModule, ProgressSpinnerModule, SelectModule],
  templateUrl: './supervisor-gtr-campaign-assignment.component.html',
  styleUrl: './supervisor-gtr-campaign-assignment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupervisorGtrCampaignAssignmentComponent {
  readonly equipos = input<EquipoOperativoResponse[]>([]);
  readonly equipoSeleccionadoId = input<number | null>(null);
  readonly campanas = input<EquipoCampanaResponse[]>([]);
  readonly cargando = input(false);
  readonly guardando = input(false);
  readonly equipoSeleccionado = input<EquipoOperativoResponse | null>(null);

  readonly equipoChange = output<number | null>();
  readonly save = output<number[]>();

  protected readonly selectedCampaignIds = signal<number[]>([]);
  protected readonly opcionesCampana = computed<CampanaOption[]>(() => {
    const nombresEquipo = new Map(this.equipos().map((equipo) => [equipo.id, equipo.nombre]));
    const idEquipo = this.equipoSeleccionadoId();
    return this.campanas().map((campana) => {
      const origen = campana.idEquipoAsignado ?? null;
      const esPropia = origen === idEquipo;
      const transferible = origen === null || esPropia || nombresEquipo.has(origen);
      return {
        ...campana,
        disabled: !transferible,
        asignacionLabel: origen === null
          ? 'Sin asignar'
          : esPropia
            ? 'Asignada a este equipo'
            : nombresEquipo.get(origen) ?? 'Asignada a otro equipo fuera de tu alcance'
      };
    });
  });
  protected readonly transfersPending = computed(() => {
    const selected = new Set(this.selectedCampaignIds());
    const destino = this.equipoSeleccionadoId();
    return this.campanas().filter((campana) => selected.has(campana.id)
      && campana.idEquipoAsignado !== null
      && campana.idEquipoAsignado !== destino).length;
  });

  constructor() {
    effect(() => {
      const idEquipo = this.equipoSeleccionadoId();
      this.selectedCampaignIds.set(this.campanas()
        .filter((campana) => campana.idEquipoAsignado === idEquipo)
        .map((campana) => campana.id));
    });
  }

  protected onEquipoChange(value: number | null): void {
    this.equipoChange.emit(value ?? null);
  }

  protected onCampaignsChange(value: number[] | null): void {
    this.selectedCampaignIds.set(value ?? []);
  }

  protected saveChanges(): void {
    this.save.emit(this.selectedCampaignIds());
  }
}
