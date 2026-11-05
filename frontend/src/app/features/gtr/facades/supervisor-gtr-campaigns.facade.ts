import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  DistribucionCampanasProveedorRequest,
  ProveedorCampanasEquipoResponse
} from '../../../shared/models/preventa/preventa.models';
import { EquipoOperativoResponse } from '../../preventa/services/preventa-lead.service';
import { GtrTeamCampaignService } from '../services/gtr-team-campaign.service';

@Injectable()
export class SupervisorGtrCampaignsFacade {
  private readonly service = inject(GtrTeamCampaignService);

  readonly equipos = signal<EquipoOperativoResponse[]>([]);
  readonly distribuciones = signal<ProveedorCampanasEquipoResponse[]>([]);
  readonly proveedorSeleccionadoId = signal<number | null>(null);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly exito = signal('');
  readonly distribucionSeleccionada = computed(() => {
    const id = this.proveedorSeleccionadoId();
    return this.distribuciones().find((distribucion) => distribucion.idProveedor === id) ?? null;
  });

  async inicializar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      const [equipos, distribuciones] = await Promise.all([
        firstValueFrom(this.service.listarMisEquipos()),
        firstValueFrom(this.service.listarDistribucionesCampanas())
      ]);
      const equiposActivos = (equipos ?? [])
        .filter((equipo) => equipo.activo)
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      this.equipos.set(equiposActivos);
      const idsEquiposActivos = new Set(equiposActivos.map((equipo) => equipo.id));
      const visibles = (distribuciones ?? [])
        .map((distribucion) => ({
          ...distribucion,
          equipoIds: distribucion.equipoIds.filter((idEquipo) => idsEquiposActivos.has(idEquipo))
        }))
        .filter((distribucion) => distribucion.equipoIds.length > 0)
        .sort((a, b) => a.nombreProveedor.localeCompare(b.nombreProveedor));
      this.distribuciones.set(visibles);

      const actual = this.proveedorSeleccionadoId();
      const idInicial = visibles.some((distribucion) => distribucion.idProveedor === actual)
        ? actual
        : visibles[0]?.idProveedor ?? null;
      this.proveedorSeleccionadoId.set(idInicial);
    } catch {
      this.error.set('No se pudo cargar la distribución de campañas. Intenta nuevamente.');
    } finally {
      this.cargando.set(false);
    }
  }

  seleccionarProveedor(idProveedor: number | null): void {
    this.proveedorSeleccionadoId.set(idProveedor);
    this.exito.set('');
    this.error.set('');
  }

  async guardarDistribucion(request: DistribucionCampanasProveedorRequest): Promise<void> {
    const idProveedor = this.proveedorSeleccionadoId();
    if (idProveedor === null || this.guardando()) {
      return;
    }
    this.guardando.set(true);
    this.error.set('');
    this.exito.set('');
    try {
      const actualizada = await firstValueFrom(this.service.actualizarDistribucionCampanas(idProveedor, request));
      this.distribuciones.update((actuales) => actuales.map((distribucion) =>
        distribucion.idProveedor === idProveedor ? actualizada : distribucion
      ));
      this.exito.set('La distribución de campañas se actualizó correctamente.');
    } catch {
      this.error.set('No se pudo guardar la distribución. Verifica que las campañas y los equipos de origen estén dentro de tu alcance.');
    } finally {
      this.guardando.set(false);
    }
  }
}
