package pe.albrugroup.lead_service.entity.response;

/**
 * Celda de la tabla 4 del RESUMEN DIARIO: cantidad de leads de una campaña cuya SUBtipificación
 * (según el campo elegido: primera/última/mayor) en PREVENTA es {@code codigoSubtipificacion},
 * dentro del período. Se conserva la tipificación y su {@code ordenTipificacion} para etiquetar la
 * fila como "N - SUBTIP". El frontend pivota subtip → campaña, ordena por total desc y deriva %.
 *
 * idEquipo null = "Sin equipo"; idCampana null = "Sin campaña".
 */
public record ResumenSubtipCampanaCeldaResponse(
        Long idEquipo,
        Long idCampana,
        String nombreCampana,
        String codigoTipificacion,
        Integer ordenTipificacion,
        String codigoSubtipificacion,
        long cantidad
) {
}
