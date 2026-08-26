import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { catchError, firstValueFrom, of } from 'rxjs';
import {
  AdminEquipoService,
  EmpleadoLite,
  EquipoMiembroResponse,
  EquipoResponse,
  ProveedorLite
} from '../../services/admin-equipo.service';
import { puedeMultiEquipo } from '../../../../shared/constants/multi-team-roles';

interface OpcionEmpleado {
  label: string;
  value: number;
}

interface GrupoEmpleados {
  label: string;
  items: OpcionEmpleado[];
}

// Roles que SÍ pertenecen a un equipo. Backoffice y postventa se gestionan por proveedor (tab Proveedores),
// no aquí. Solo filtramos las OPCIONES: los miembros ya asignados de otros roles no se tocan (dual-run).
const ROLES_DE_EQUIPO = new Set(['ASESOR_GTR', 'SUPERVISOR_GTR', 'ASESOR_VENTAS', 'SUPERVISOR_VENTAS', 'OJT']);

@Component({
  selector: 'app-admin-equipos-page',
  imports: [
    FormsModule,
    ButtonModule,
    CardModule,
    ColorPickerModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
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
  // Todos los equipos de cada empleado (cruce de los rosters de todos los equipos), para que al
  // editar un equipo no se le quite silenciosamente a un asesor sus otras membresías.
  private readonly teamIdsByEmployeeId = signal<Record<number, number[]>>({});

  // Empleados agrupados por rol (rol → lista de empleados), con búsqueda por nombre en el multiselect.
  // Solo roles de equipo: backoffice/postventa se asignan en el tab Proveedores.
  protected readonly empleadoGrupos = computed<GrupoEmpleados[]>(() => {
    const grupos = new Map<string, OpcionEmpleado[]>();
    for (const e of this.empleados()) {
      if (!ROLES_DE_EQUIPO.has(e.puestoTrabajo)) {
        continue;
      }
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
  // Color en hex CON '#' ('#RRGGBB'), tal como lo emite el p-colorPicker. Vacío = sin color (gris por defecto).
  protected formColor = '';
  protected formProveedores: number[] = [];
  protected formProveedorFallback: number | null = null;
  protected formProveedorFallbackOptions: ProveedorLite[] = [];
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
      await this.cargarMembresiasPorEmpleado(equipos ?? []);
    } catch {
      this.notify('error', 'No se pudieron cargar los equipos.');
    } finally {
      this.cargando.set(false);
    }
  }

  // Cruza los miembros de todos los equipos para saber a qué equipos pertenece cada empleado.
  private async cargarMembresiasPorEmpleado(equipos: EquipoResponse[]): Promise<void> {
    const rosters = await Promise.all(
      equipos.map(async (equipo) => ({
        id: equipo.id,
        miembros: await firstValueFrom(
          this.service.listarMiembros(equipo.id).pipe(catchError(() => of<EquipoMiembroResponse[]>([])))
        )
      }))
    );
    const porEmpleado: Record<number, number[]> = {};
    for (const roster of rosters) {
      for (const miembro of roster.miembros) {
        (porEmpleado[miembro.empleadoId] ??= []).push(roster.id);
      }
    }
    this.teamIdsByEmployeeId.set(porEmpleado);
  }

  protected abrirCrear(): void {
    this.editandoId.set(null);
    this.miembrosOriginales.set([]);
    this.formNombre = '';
    this.formDescripcion = '';
    this.formColor = '';
    this.formProveedores = [];
    this.formProveedorFallback = null;
    this.formProveedorFallbackOptions = [];
    this.formEmpleados = [];
    this.dialogVisible.set(true);
  }

  protected async abrirEditar(equipo: EquipoResponse): Promise<void> {
    this.editandoId.set(equipo.id);
    this.formNombre = equipo.nombre;
    this.formDescripcion = equipo.descripcion ?? '';
    this.formColor = equipo.color ?? '';
    try {
      const [proveedoresEquipo, miembros] = await Promise.all([
        firstValueFrom(this.service.listarProveedoresDeEquipo(equipo.id)),
        firstValueFrom(this.service.listarMiembros(equipo.id))
      ]);
      this.formProveedores = (proveedoresEquipo ?? []).map((p) => p.id);
      this.formProveedorFallback = proveedoresEquipo.find((p) => p.fallbackLeadSinCampana)?.id ?? null;
      this.syncProveedorFallbackOptions();
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
    if (this.formProveedores.length && !this.formProveedorFallback) {
      this.notify('warn', 'Elige el proveedor fallback para leads sin campaña.');
      return;
    }
    if (this.formProveedorFallback && !this.formProveedores.includes(this.formProveedorFallback)) {
      this.notify('warn', 'El proveedor fallback debe estar entre los proveedores del equipo.');
      return;
    }
    this.guardando.set(true);
    try {
      const id = await this.guardarEquipoBase(nombre);
      await firstValueFrom(this.service.asignarProveedores(id, this.formProveedores, this.formProveedorFallback));
      await this.sincronizarMiembros(id);

      this.dialogVisible.set(false);
      this.notify('success', this.editandoId() ? 'Equipo actualizado.' : 'Equipo creado.');
      await this.cargar();
    } catch (err) {
      this.notify('error', this.mensajeErrorGuardar(err));
    } finally {
      this.guardando.set(false);
    }
  }

  protected onProveedoresChange(): void {
    this.syncProveedorFallbackOptions();
    if (this.formProveedorFallback && !this.formProveedores.includes(this.formProveedorFallback)) {
      this.formProveedorFallback = null;
    }
    if (!this.formProveedorFallback && this.formProveedores.length === 1) {
      this.formProveedorFallback = this.formProveedores[0];
    }
  }

  private syncProveedorFallbackOptions(): void {
    const selected = new Set(this.formProveedores);
    this.formProveedorFallbackOptions = this.proveedores().filter((proveedor) => selected.has(proveedor.id));
  }

  private async guardarEquipoBase(nombre: string): Promise<number> {
    const descripcion = this.formDescripcion.trim() || undefined;
    // formColor ya viene como '#RRGGBB' (o ''). '' se envía para limpiar el color
    // (backend lo normaliza a null = gris por defecto). Se tolera un '#' faltante por robustez.
    const raw = this.formColor.trim();
    const color = raw ? (raw.startsWith('#') ? raw : `#${raw}`) : '';
    const id = this.editandoId();
    if (id) {
      await firstValueFrom(this.service.actualizarEquipo(id, { nombre, descripcion, color }));
      return id;
    }
    const creado = await firstValueFrom(this.service.crearEquipo(nombre, descripcion, color || null));
    return creado.id;
  }

  // Sincroniza la membresía de este equipo de forma aditiva: agregar SUMA este equipo (sin pisar las
  // otras membresías de un asesor multi-equipo) y quitar RESTA solo este equipo. Los roles que no
  // admiten multi-equipo se mueven (un solo equipo), como antes.
  private async sincronizarMiembros(idEquipo: number): Promise<void> {
    const seleccionados = new Set(this.formEmpleados);
    const originales = new Set(this.miembrosOriginales());

    const aAgregar = [...seleccionados].filter((empId) => !originales.has(empId));
    const aQuitar = [...originales].filter((empId) => !seleccionados.has(empId));

    const equiposPorEmpleado = this.teamIdsByEmployeeId();
    const puestoPorEmpleado = new Map(this.empleados().map((e) => [e.idEmpleado, e.puestoTrabajo]));

    for (const empId of aAgregar) {
      const actuales = equiposPorEmpleado[empId] ?? [];
      const esMulti = puedeMultiEquipo(puestoPorEmpleado.get(empId));
      const next = esMulti ? [...new Set([...actuales, idEquipo])] : [idEquipo];
      await firstValueFrom(this.service.asignarEquiposAEmpleado(empId, next));
    }
    for (const empId of aQuitar) {
      const actuales = equiposPorEmpleado[empId] ?? [idEquipo];
      const next = actuales.filter((equipo) => equipo !== idEquipo);
      await firstValueFrom(this.service.asignarEquiposAEmpleado(empId, next));
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

  // Prefiere el mensaje real del backend (conflicto de nombre, formato de color inválido) sobre un
  // texto genérico, para que el error del toast sea legible y accionable.
  private mensajeErrorGuardar(err: unknown): string {
    const e = err as { status?: number; error?: { message?: string; details?: string[] } };
    const detalle = e?.error?.details?.[0];
    if (e?.status === 400 && detalle) {
      return detalle;
    }
    if (e?.status === 409 && e.error?.message) {
      return e.error.message;
    }
    return 'No se pudo guardar el equipo. Revisa los datos e inténtalo de nuevo.';
  }

  private notify(severity: 'success' | 'info' | 'warn' | 'error', detail: string): void {
    const summary = { success: 'Listo', info: 'Información', warn: 'Atención', error: 'Hubo un problema' }[severity];
    this.messageService.add({ severity, summary, detail, life: severity === 'error' ? 6000 : 4000 });
  }
}
