import { BaseService } from '@shared/lib/base.service';
import { AuthRepository } from '@shared/api/repositories/auth.repository';
import type { ActualizarCredencialesRequest, UsuarioResponse } from '@shared/types';

export class AuthService extends BaseService<UsuarioResponse> {
  /**
   * Actualizar username y roles de un usuario
   * 
   * **Validación previa:**
   * 1. Verifica que puestoTrabajo no esté vacío
   * 2. Verifica que empleadoId existe en BD (llamada GET al backend)
   * 3. Si validaciones pasan, ejecuta PATCH
   * 
   * @throws Error si puestoTrabajo falta o empleadoId no existe
   */
  static async actualizarUsernameRoles(
    empleadoId: number,
    payload: ActualizarCredencialesRequest
  ): Promise<UsuarioResponse> {
    // Validación 1: puestoTrabajo obligatorio
    if (!payload.puestoTrabajo) {
      throw new Error('El campo puestoTrabajo es obligatorio para actualizar username/roles.');
    }

    // Validación 2: empleadoId debe existir en BD
    const existeEmpleado = await AuthRepository.verificarEmpleadoExiste(empleadoId);
    if (!existeEmpleado) {
      throw new Error(`El empleado con ID ${empleadoId} no existe en la base de datos. Por favor, registra al empleado primero.`);
    }

    // Todas las validaciones pasaron → ejecutar actualización
    return this.executeOperation(
      () => AuthRepository.updateUsernameRoles(empleadoId, payload),
      'No se pudo actualizar username y roles',
      (data) => data
    );
  }

  /**
   * Obtener usuario por ID de empleado
   */
  static async obtenerUsuarioPorEmpleadoId(empleadoId: number): Promise<UsuarioResponse> {
    return this.executeOperation(
      () => AuthRepository.getUserByEmployeeId(empleadoId),
      'No se pudo obtener el usuario por empleadoId',
      (data) => data
    );
  }
}
