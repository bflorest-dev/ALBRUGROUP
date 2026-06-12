package pe.albrugroup.lead_service.repository.projection;

/** Preventas concretadas por asesor y proveedor (del plan ofrecido), leidas del Lead. */
public interface AsesorProveedorPreventaProjection {

    Long getIdAsesor();
    Long getIdProveedor();
    String getNombreProveedor();
    long getCantidad();
}
