package pe.albrugroup.lead_service.entity.response;

import java.time.Instant;

/**
 * Fila del detalle del ranking de asesores del RESUMEN DIARIO. La fila puede aportar al contador de
 * asignados, al de preventas, o a ambos; el frontend usa esos flags para cuadrar el encabezado del
 * modal sin duplicar leads.
 */
public record ResumenRankingAsesorDetalleResponse(
        Long idLead,
        Instant fechaIngresoAt,
        Instant fechaUltimaAsignacionAt,
        String lead,
        String usermeta,
        String codigoTipificacionAsesor,
        String codigoSubtipificacionAsesor,
        Instant fechaGestionAsesorAt,
        boolean asignado,
        boolean preventa
) {
}
