package pe.albrugroup.lead_service.entity.response;

/**
 * Celda del reporte "afluencia por hora": conteo de eventos (REGISTRO o ASIGNACIÓN) agrupados
 * por hora del día (zona America/Lima) y campaña. El frontend pivota estas celdas en la matriz
 * equipo → hora × campaña, y deriva {@code repetidos = total - unicos}.
 *
 * idEquipo null = "Sin equipo"; idCampana null = "Sin campaña".
 */
public record AfluenciaPorHoraCeldaResponse(
        Long idEquipo,
        Long idCampana,
        String nombreCampana,
        int hora,
        long total,
        long unicos
) {
}
