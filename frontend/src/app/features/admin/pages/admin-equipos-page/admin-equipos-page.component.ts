import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { firstValueFrom } from 'rxjs';
import {
  AdminEquipoService,
  EmpleadoLite,
  EquipoResponse,
  ProveedorLite
} from '../../services/admin-equipo.service';

interface OpcionEmpleado {
  label: string;
  value: number;
}

interface GrupoEmpleados {
  label: string;
  items: OpcionEmpleado[];
}

@Component({
  selector: 'app-admin-equipos-page',
  imports: [
    FormsModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    MultiSelectModule,
    TableModule,
    TextareaModule,
    ToastModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-equipos-page.component.html',
  styleUrl: './admin-equipos-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminEquiposPageComponent implements OnInit {
  private readonly service = inject(AdminEquipoService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly equipos = signal<EquipoResponse[]>([]);
  protected readonly proveedores = signal<ProveedorLite[]>([]);
  protected readonly empleados = signal<EmpleadoLite[]>([]);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly sincronizando = signal(false);

  // Estado del modal
  protected readonly dialogVisible = signal(false);
  protected readonly editandoId = signal<number | null>(null);
  private readonly miembrosOriginales = signal<number[]>([]);

  // Empleados agrupados por rol (rol → lista de empleados), con búsqueda por nombre en el multiselect.
  protected readonly empleadoGrupos = computed<GrupoEmpleados[]>(() => {
    const grupos = new Map<string, OpcionEmpleado[]>();
    for (const e of this.empleados()) {
      const lista = grupos.get(e.puestoTrabajo) ?? [];
      lista.push({ label: `${e.nombres} ${e.apellidos}`, value: e.idEmpleado });
      grupos.set(e.puestoTrabajo, lista);
    }
    return [...grupos.entries()]
      .map(([rol, items]) => ({ label: rol, items }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  // Campos del formulario del modal
  protected formNombre = '';
  protected formDescripcion = '';
  protected formProveedores: number[] = [];
  protected formEmpleados: number[] = [];

  protected get tituloDialog(): string {
    return this.editandoId() ? 'Editar equipo' : 'Crear equipo';
  }

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
    } catch {
      this.notify('error', 'No se pudieron cargar los equipos.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected abrirCrear(): void {
    this.editandoId.set(null);
    this.miembrosOriginales.set([]);
    this.formNombre = '';
    this.formDescripcion = '';
    this.formProveedores = [];
    this.formEmpleados = [];
    this.dialogVisible.set(true);
  }

  protected async abrirEditar(equipo: EquipoResponse): Promise<void> {
    this.editandoId.set(equipo.id);
    this.formNombre = equipo.nombre;
    this.formDescripcion = equipo.descripcion ?? '';
    try {
      const [proveedoresEquipo, miembros] = await Promise.all([
        firstValueFrom(this.service.listarProveedoresDeEquipo(equipo.id)),
        firstValueFrom(this.service.listarMiembros(equipo.id))
      ]);
      this.formProveedores = (proveedoresEquipo ?? []).map((p) => p.id);
      const miembrosIds = (miembros ?? []).map((m) => m.empleadoId);
      this.formEmpleados = [...miembrosIds];
      this.miembrosOriginales.set(miembrosIds);
      this.dialogVisible.set(true);
    } catch {
      this.notify('error', 'No se pudo cargar el detalle del equipo.');
    }
  }

  protected async guardar(): Promise<void> {
    const nombre = this.formNombre.trim();
    if (!nombre) {
      this.notify('warn', 'Escribe un nombre para el equipo.');
      return;
    }
    this.guardando.set(true);
    try {
      const id = await this.guardarEquipoBase(nombre);
      await firstValueFrom(this.service.asignarProveedores(id, this.formProveedores));
      await this.sincronizarMiembros(id);

      this.dialogVisible.set(false);
      this.notify('success', this.editandoId() ? 'Equipo actualizado.' : 'Equipo creado.');
      await this.cargar();
    } catch {
      this.notify('error', 'No se pudo guardar el equipo. ¿Quizás el nombre ya existe?');
    } finally {
      this.guardando.set(false);
    }
  }

  private async guardarEquipoBase(nombre: string): Promise<number> {
    const descripcion = this.formDescripcion.trim() || undefined;
    const id = this.editandoId();
    if (id) {
      await firstValueFrom(this.service.actualizarEquipo(id, { nombre, descripcion }));
      return id;
    }
    const creado = await firstValueFrom(this.service.crearEquipo(nombre, descripcion));
    return creado.id;
  }

  // Asigna los empleados nuevos a este equipo (mueve si estaban en otro) y quita los deseleccionados.
  private async sincronizarMiembros(idEquipo: number): Promise<void> {
    const seleccionados = new Set(this.formEmpleados);
    const originales = new Set(this.miembrosOriginales());

    const aAgregar = [...seleccionados].filter((empId) => !originales.has(empId));
    const aQuitar = [...originales].filter((empId) => !seleccionados.has(empId));

    for (const empId of aAgregar) {
      await firstValueFrom(this.service.asignarEquiposAEmpleado(empId, [idEquipo]));
    }
    for (const empId of aQuitar) {
      await firstValueFrom(this.service.asignarEquiposAEmpleado(empId, []));
    }
  }

  protected confirmarEliminar(): void {
    const id = this.editandoId();
    if (!id) {
      return;
    }
    this.confirmationService.confirm({
      header: 'Eliminar equipo',
      message: `¿Eliminar "${this.formNombre}"? Sus empleados quedarán sin equipo y sus proveedores sin asignar.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.eliminar(id)
    });
  }

  private async eliminar(id: number): Promise<void> {
    this.guardando.set(true);
    try {
      // Primero limpia datos en lead (proveedores + desvincular leads), luego borra el equipo en auth.
      await firstValueFrom(this.service.limpiarDatosLeadEquipo(id));
      await firstValueFrom(this.service.eliminarEquipoAuth(id));
      this.dialogVisible.set(false);
      this.notify('success', 'Equipo eliminado.');
      await this.cargar();
    } catch {
      this.notify('error', 'No se pudo eliminar el equipo.');
    } finally {
      this.guardando.set(false);
    }
  }

  protected async sincronizarLeads(): Promise<void> {
    this.sincronizando.set(true);
    try {
      const res = await firstValueFrom(this.service.backfillLeads());
      this.notify('success', `Listo: ${res?.leadsActualizados ?? 0} leads alineados a su equipo.`);
    } catch {
      this.notify('error', 'No se pudieron sincronizar los leads.');
    } finally {
      this.sincronizando.set(false);
    }
  }

  private notify(severity: 'success' | 'info' | 'warn' | 'error', detail: string): void {
    const summary = { success: 'Listo', info: 'Información', warn: 'Atención', error: 'Hubo un problema' }[severity];
    this.messageService.add({ severity, summary, detail, life: severity === 'error' ? 6000 : 4000 });
  }
}
