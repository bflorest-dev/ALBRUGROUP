package pe.albrugroup.lead_service.entity.enums;

/**
 * Ámbito de una asignación empleado→proveedor (tabla usuario_proveedor).
 * Determina qué bandeja acota la asignación. Roles operativos que ya NO se
 * particionan por equipo sino por proveedor.
 */
public enum AmbitoProveedor {
    BACKOFFICE,
    POSTVENTA
}
