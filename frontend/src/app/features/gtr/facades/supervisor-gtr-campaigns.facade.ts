import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  EquipoCampanaResponse,
  LeadGtrMetricasProveedorResponse
} from '../../../shared/models/preventa/preventa.models';
import { EquipoOperativoResponse } from '../../preventa/services/preventa-lead.service';
import { GtrTeamCampaignService } from '../services/gtr-team-campaign.service';

@Injectable()
export class SupervisorGtrCampaignsFacade {
  private readonly service = inject(GtrTeamCampaignService);

  readonly equipos = signal<EquipoOperativoResponse[]>([]);
  readonly equipoSeleccionadoId = signal<number | null>(null);
  readonly campanas = signal<EquipoCampanaResponse[]>([]);
  readonly metricas = signal<LeadGtrMetricasProveedorResponse[]>([]);
  readonly cargando = signal(false);
  readonly cargandoCampanas = signal(false);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly exito = signal('');
  readonly equipoSeleccionado = computed(() => {
    const id = this.equipoSeleccionadoId();
    return this.equipos().find((equipo) => equipo.id === id) ?? null;
  });

  async inicializar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      const [equipos, metricas] = await Promise.all([
        firstValueFrom(this.service.listarMisEquipos()),
        firstValueFrom(this.service.obtenerMetricasPorProveedor())
      ]);
      const equiposActivos = (equipos ?? [])
        .filter((equipo) => equipo.activo)
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      this.equipos.set(equiposActivos);
      this.metricas.set(metricas ?? []);

      const actual = this.equipoSeleccionadoId();
      const idInicial = equiposActivos.some((equipo) => equipo.id === actual)
        ? actual
        : equiposActivos[0]?.id ?? null;
      this.equipoSeleccionadoId.set(idInicial);
      if (idInicial !== null) {
        await this.cargarCampanas(idInicial);
      }
    } catch {
      this.error.set('No se pudo cargar la configuración de campañas y métricas. Intenta nuevamente.');
    } finally {
      this.cargando.set(false);
    }
  }

  async seleccionarEquipo(idEquipo: number | null): Promise<void> {
    this.equipoSeleccionadoId.set(idEquipo);
    this.exito.set('');
    this.error.set('');
    if (idEquipo === null) {
      this.campanas.set([]);
      return;
    }
    await this.cargarCampanas(idEquipo);
  }

  async guardarCampanas(campanaIds: number[]): Promise<void> {
    const idEquipo = this.equipoSeleccionadoId();
    if (idEquipo === null || this.guardando()) {
      return;
    }
    this.guardando.set(true);
    this.error.set('');
    this.exito.set('');
    try {
      await firstValueFrom(this.service.asignarCampanasEquipo(idEquipo, campanaIds));
      await this.cargarCampanas(idEquipo);
      this.exito.set('La asignación de campañas se actualizó correctamente.');
    } catch {
      this.error.set('No se pudieron guardar las campañas. Verifica que los equipos de origen también estén dentro de tu alcance.');
    } finally {
      this.guardando.set(false);
    }
  }

  private async cargarCampanas(idEquipo: number): Promise<void> {
    this.cargandoCampanas.set(true);
    try {
      this.campanas.set(await firstValueFrom(this.service.listarCampanasEquipo(idEquipo)) ?? []);
    } catch {
      this.campanas.set([]);
      this.error.set('No se pudieron cargar las campañas del equipo seleccionado.');
    } finally {
      this.cargandoCampanas.set(false);
    }
  }
}
