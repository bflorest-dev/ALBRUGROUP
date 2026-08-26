package pe.albrugroup.lead_service.entity.response;

import java.util.Set;

/** Asignaciones de proveedores de un empleado en un ámbito (para el grid de administración). */
public record AsignacionUsuarioProveedorResponse(Long idEmpleado, Set<Long> proveedorIds) {
}
