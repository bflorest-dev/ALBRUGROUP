import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { firstValueFrom } from 'rxjs';
import {
  AdminEquipoService,
  AmbitoProveedor,
  EmpleadoLite,
  ProveedorLite
} from '../../services/admin-equipo.service';

interface AmbitoOption {
  label: string;
  value: AmbitoProveedor;
}

const ROLES_POR_AMBITO: Record<AmbitoProveedor, ReadonlySet<string>> = {
  BACKOFFICE: new Set(['ASESOR_BACKOFFICE', 'SUPERVISOR_BACKOFFICE']),
  POSTVENTA: new Set(['ASESOR_POSTVENTA', 'SUPERVISOR_POSTVENTA'])
};

/**
 * Asignación de BACKOFFICE / POSTVENTA a proveedores. Matriz empleados × proveedores: cada celda
 * marca si ese empleado gestiona ese proveedor. Se lee por columna (elegir un proveedor y ver quién
 * lo gestiona) o por fila (un empleado y sus proveedores). Cada cambio persiste el set completo del
 * empleado en su ámbito. Las bandejas nunca se mezclan: el asesor cambia de proveedor con el selector.
 */
@Component({
  selector: 'app-admin-proveedores-page',
  imports: [FormsModule, ButtonModule, CardModule, SelectButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './admin-proveedores-page.component.html',
  styleUrl: './admin-proveedores-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminProveedoresPageComponent implements OnInit {
  private readonly service = inject(AdminEquipoService);
  private readonly messageService = inject(MessageService);

  protected readonly ambitoOptions: AmbitoOption[] = [
    { label: 'Backoffice', value: 'BACKOFFICE' },
    { label: 'Postventa', value: 'POSTVENTA' }
  ];
  protected readonly ambito = signal<AmbitoProveedor>('BACKOFFICE');

  protected readonly proveedores = signal<ProveedorLite[]>([]);
  private readonly empleados = signal<EmpleadoLite[]>([]);
  // empleadoId → proveedorIds asignados en el ámbito activo.
  private readonly asignaciones = signal<Record<number, number[]>>({});
  // Celdas guardándose ("empId:provId"), para deshabilitarlas mientras dura el PUT.
  private readonly celdasGuardando = signal<Set<string>>(new Set());

  protected readonly cargando = signal(false);

  protected readonly empleadosDelAmbito = computed<EmpleadoLite[]>(() => {
    const roles = ROLES_POR_AMBITO[this.ambito()];
    return this.empleados()
      .filter((empleado) => roles.has(empleado.puestoTrabajo))
      .sort((a, b) => this.nombreEmpleado(a).localeCompare(this.nombreEmpleado(b)));
  });

  ngOnInit(): void {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      const [proveedores, empleados] = await Promise.all([
        firstValueFrom(this.service.listarProveedores()),
        firstValueFrom(this.service.listarEmpleados())
      ]);
      this.proveedores.set(proveedores ?? []);
      this.empleados.set(empleados ?? []);
      await this.cargarAsignaciones();
    } catch {
      this.notify('error', 'No se pudieron cargar los proveedores y empleados.');
    } finally {
      this.cargando.set(false);
    }
  }

  private async cargarAsignaciones(): Promise<void> {
    try {
      const asignaciones = await firstValueFrom(this.service.listarAsignacionesProveedor(this.ambito()));
      const mapa: Record<number, number[]> = {};
      for (const asignacion of asignaciones ?? []) {
        mapa[asignacion.idEmpleado] = [...asignacion.proveedorIds];
      }
      this.asignaciones.set(mapa);
    } catch {
      this.asignaciones.set({});
      this.notify('error', 'No se pudieron cargar las asignaciones.');
    }
  }

  protected async cambiarAmbito(ambito: AmbitoProveedor): Promise<void> {
    if (!ambito || ambito === this.ambito()) {
      return;
    }
    this.ambito.set(ambito);
    this.cargando.set(true);
    await this.cargarAsignaciones();
    this.cargando.set(false);
  }

  protected gestiona(empleadoId: number, proveedorId: number): boolean {
    return (this.asignaciones()[empleadoId] ?? []).includes(proveedorId);
  }

  protected guardandoCelda(empleadoId: number, proveedorId: number): boolean {
    return this.celdasGuardando().has(this.claveCelda(empleadoId, proveedorId));
  }

  protected async toggle(empleadoId: number, proveedorId: number): Promise<void> {
    const clave = this.claveCelda(empleadoId, proveedorId);
    if (this.celdasGuardando().has(clave)) {
      return;
    }
    const actuales = this.asignaciones()[empleadoId] ?? [];
    const proximos = actuales.includes(proveedorId)
      ? actuales.filter((id) => id !== proveedorId)
      : [...actuales, proveedorId];

    this.marcarGuardando(clave, true);
    // Optimista: reflejamos el cambio y lo revertimos si el backend falla.
    this.setAsignacion(empleadoId, proximos);
    try {
      await firstValueFrom(this.service.asignarProveedoresUsuario(empleadoId, this.ambito(), proximos));
    } catch {
      this.setAsignacion(empleadoId, actuales);
      this.notify('error', 'No se pudo guardar el cambio. Inténtalo de nuevo.');
    } finally {
      this.marcarGuardando(clave, false);
    }
  }

  protected nombreEmpleado(empleado: EmpleadoLite): string {
    return `${empleado.nombres} ${empleado.apellidos}`.trim();
  }

  protected rolCorto(rol: string): string {
    return rol.startsWith('SUPERVISOR') ? 'Supervisor' : 'Asesor';
  }

  private setAsignacion(empleadoId: number, proveedorIds: number[]): void {
    this.asignaciones.update((mapa) => ({ ...mapa, [empleadoId]: proveedorIds }));
  }

  private marcarGuardando(clave: string, guardando: boolean): void {
    this.celdasGuardando.update((set) => {
      const next = new Set(set);
      if (guardando) {
        next.add(clave);
      } else {
        next.delete(clave);
      }
      return next;
    });
  }

  private claveCelda(empleadoId: number, proveedorId: number): string {
    return `${empleadoId}:${proveedorId}`;
  }

  private notify(severity: 'success' | 'info' | 'warn' | 'error', detail: string): void {
    const summary = { success: 'Listo', info: 'Información', warn: 'Atención', error: 'Hubo un problema' }[severity];
    this.messageService.add({ severity, summary, detail, life: severity === 'error' ? 6000 : 4000 });
  }
}
