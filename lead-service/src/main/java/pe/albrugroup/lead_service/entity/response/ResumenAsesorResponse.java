package pe.albrugroup.lead_service.entity.response;

/**
 * Fila del ranking acotado (tabla 2 del RESUMEN DIARIO): un asesor con su total de asignaciones
 * (según el modo) y sus preventas del período. Los actores con rol OJT se colapsan en una sola fila
 * con {@code idAsesor = null} y {@code nombreAsesor = "OJT"}.
 */
public record ResumenAsesorResponse(
        Long idAsesor,
        String nombreAsesor,
        long totalAsignaciones,
        long preventas
) {
}
