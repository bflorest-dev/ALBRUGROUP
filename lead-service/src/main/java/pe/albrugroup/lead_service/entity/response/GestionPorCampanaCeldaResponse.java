package pe.albrugroup.lead_service.entity.response;

/**
 * Celda del reporte "gestión por campaña": cantidad de leads de una campaña cuya tipificación
 * (según el campo elegido: primera/última/mayor) en la etapa pedida es {@code codigoTipificacion},
 * dentro del período consultado. El frontend pivota estas celdas en la matriz equipo → campaña,
 * y deriva Total y % por campaña.
 *
 * idEquipo null = "Sin equipo"; idCampana null = "Sin campaña".
 */
public record GestionPorCampanaCeldaResponse(
        Long idEquipo,
        Long idCampana,
        String nombreCampana,
        String codigoTipificacion,
        long cantidad
) {
}
