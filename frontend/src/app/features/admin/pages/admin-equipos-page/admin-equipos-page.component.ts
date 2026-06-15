import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { firstValueFrom } from 'rxjs';
import {
  AdminEquipoService,
  EmpleadoLite,
  EquipoMiembroResponse,
  EquipoResponse,
  ProveedorLite
} from '../../services/admin-equipo.service';

interface EmpleadoOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-admin-equipos-page',
  imports: [
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './admin-equipos-page.component.html',
  styleUrl: './admin-equipos-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminEquiposPageComponent implements OnInit {
  private readonly service = inject(AdminEquipoService);
  private readonly messageService = inject(MessageService);

  protected readonly equipos = signal<EquipoResponse[]>([]);
  protected readonly proveedores = signal<ProveedorLite[]>([]);
  protected readonly empleados = signal<EmpleadoLite[]>([]);
  protected readonly miembros = signal<EquipoMiembroResponse[]>([]);
  protected readonly selectedEquipoId = signal<number | null>(null);
  protected readonly cargando = signal(false);
  protected readonly guardandoProveedores = signal(false);

  protected readonly selectedEquipo = computed(
    () => this.equipos().find((e) => e.id === this.selectedEquipoId()) ?? null
  );

  protected readonly empleadoOptions = computed<EmpleadoOption[]>(() =>
    this.empleados().map((e) => ({
      label: `${e.nombres} ${e.apellidos} · ${e.puestoTrabajo}`,
      value: e.idEmpleado
    }))
  );

  // Campos de formulario (ngModel)
  protected nuevoNombre = '';
  protected nuevaDescripcion = '';
  protected proveedorSeleccion: number[] = [];
  protected empleadoAAgregar: number | null = null;

  ngOnInit(): void {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      const [equipos, proveedores, empleados] = await Promise.all([
        firstValueFrom(this.service.listarEquipos()),
        firstValueFrom(this.service.listarProveedores()),
        firstValueFrom(this.service.listarEmpleados())
      ]);
      this.equipos.set(equipos ?? []);
      this.proveedores.set(proveedores ?? []);
      this.empleados.set(empleados ?? []);

      const seleccionActual = this.selectedEquipoId();
      if (seleccionActual) {
        await this.cargarDetalleEquipo(seleccionActual);
      } else if ((equipos?.length ?? 0) > 0) {
        await this.seleccionarEquipo(equipos[0].id);
      }
    } catch {
      this.notify('error', 'No se pudieron cargar los equipos.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected async seleccionarEquipo(id: number): Promise<void> {
    this.selectedEquipoId.set(id);
    await this.cargarDetalleEquipo(id);
  }

  private async cargarDetalleEquipo(id: number): Promise<void> {
    try {
      const [miembros, proveedoresEquipo] = await Promise.all([
        firstValueFrom(this.service.listarMiembros(id)),
        firstValueFrom(this.service.listarProveedoresDeEquipo(id))
      ]);
      this.miembros.set(miembros ?? []);
      this.proveedorSeleccion = (proveedoresEquipo ?? []).map((p) => p.id);
    } catch {
      this.notify('error', 'No se pudo cargar el detalle del equipo.');
    }
  }

  protected async crearEquipo(): Promise<void> {
    const nombre = this.nuevoNombre.trim();
    if (!nombre) {
      this.notify('warn', 'Escribe un nombre para el equipo.');
      return;
    }
    try {
      const creado = await firstValueFrom(
        this.service.crearEquipo(nombre, this.nuevaDescripcion.trim() || undefined)
      );
      this.nuevoNombre = '';
      this.nuevaDescripcion = '';
      this.notify('success', `Equipo "${creado.nombre}" creado.`);
      await this.cargar();
      if (creado?.id) {
        await this.seleccionarEquipo(creado.id);
      }
    } catch {
      this.notify('error', 'No se pudo crear el equipo. ¿Quizás el nombre ya existe?');
    }
  }

  protected async guardarProveedores(): Promise<void> {
    const id = this.selectedEquipoId();
    if (!id) {
      return;
    }
    this.guardandoProveedores.set(true);
    try {
      await firstValueFrom(this.service.asignarProveedores(id, this.proveedorSeleccion));
      this.notify('success', 'Proveedores del equipo actualizados.');
      // Refresca todo: un proveedor pudo moverse desde otro equipo.
      await this.cargar();
    } catch {
      this.notify('error', 'No se pudieron guardar los proveedores.');
    } finally {
      this.guardandoProveedores.set(false);
    }
  }

  protected async agregarEmpleado(): Promise<void> {
    const id = this.selectedEquipoId();
    if (!id) {
      return;
    }
    if (!this.empleadoAAgregar) {
      this.notify('warn', 'Elige un empleado para agregar.');
      return;
    }
    try {
      await firstValueFrom(this.service.asignarEquiposAEmpleado(this.empleadoAAgregar, [id]));
      this.empleadoAAgregar = null;
      this.notify('success', 'Empleado asignado al equipo (movido si estaba en otro).');
      await this.cargarDetalleEquipo(id);
    } catch {
      this.notify('error', 'No se pudo asignar el empleado al equipo.');
    }
  }

  protected async quitarEmpleado(empleadoId: number): Promise<void> {
    const id = this.selectedEquipoId();
    if (!id) {
      return;
    }
    try {
      await firstValueFrom(this.service.asignarEquiposAEmpleado(empleadoId, []));
      this.notify('success', 'Empleado removido del equipo.');
      await this.cargarDetalleEquipo(id);
    } catch {
      this.notify('error', 'No se pudo quitar al empleado.');
    }
  }

  protected async aplicarBackfill(): Promise<void> {
    try {
      const res = await firstValueFrom(this.service.backfillLeads());
      this.notify('success', `Listo: ${res?.leadsActualizados ?? 0} leads existentes asignados a su equipo.`);
    } catch {
      this.notify('error', 'No se pudo aplicar el backfill de leads.');
    }
  }

  private notify(severity: 'success' | 'info' | 'warn' | 'error', detail: string): void {
    const summary = { success: 'Listo', info: 'Información', warn: 'Atención', error: 'Hubo un problema' }[severity];
    this.messageService.add({ severity, summary, detail, life: severity === 'error' ? 6000 : 4000 });
  }
}
