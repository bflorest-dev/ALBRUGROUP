package pe.albrugroup.lead_service.repository.projection;

/** Conteo de preventas concretadas por asesor, leido directamente del Lead (idAsesorPreventa). */
public interface AsesorPreventaCantidadProjection {

    Long getIdAsesor();
    long getCantidad();
}
