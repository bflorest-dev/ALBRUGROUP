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
        String nombreAsesorMayorTipificacion,
        Instant fechaMayorTipificacionAt,
        String nombreAsesorUltimaTipificacion,
        Instant fechaUltimaGestionAt
) {
}
