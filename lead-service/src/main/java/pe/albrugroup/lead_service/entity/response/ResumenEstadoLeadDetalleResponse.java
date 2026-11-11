package pe.albrugroup.lead_service.entity.response;

import java.time.Instant;

/**
 * Fila del detalle de una tipificacion del bloque Estado Leads del Dia.
 */
public record ResumenEstadoLeadDetalleResponse(
        Long idLead,
        Instant fechaIngresoAt,
        String lead,
        String usermeta,
        String nombreCampana,
        String nombreAsesorMayorTipificacion,
        String subtipificacion,
        Instant fechaMayorTipificacionAt,
        String nombreAsesorUltimaTipificacion,
        Instant fechaUltimaGestionAt
) {
    /** Compatibilidad con consultas JPQL antiguas que todavía no proyectan la subtipificación. */
    public ResumenEstadoLeadDetalleResponse(
            Long idLead,
            Instant fechaIngresoAt,
            String lead,
            String usermeta,
            String nombreCampana,
            String nombreAsesorMayorTipificacion,
            Instant fechaMayorTipificacionAt,
            String nombreAsesorUltimaTipificacion,
            Instant fechaUltimaGestionAt
    ) {
        this(idLead, fechaIngresoAt, lead, usermeta, nombreCampana, nombreAsesorMayorTipificacion,
                null, fechaMayorTipificacionAt, nombreAsesorUltimaTipificacion, fechaUltimaGestionAt);
    }
}
