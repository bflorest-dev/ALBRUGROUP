package pe.albrugroup.lead_service.entity.response;

/**
 * Métricas del día para "Leads del día" desglosadas por equipo (para el DASHBOARD del ADMIN).
 * idEquipo null = "Sin equipo". C y E se derivan en el frontend.
 */
public record LeadsDiariosMetricasEquipoResponse(
        Long idEquipo,
        long registros,          // A
        long leadsUnicos,        // B
        long leadsRepetidos,     // D
        long leadsTipificados,   // F
        long bloqueOrden1,       // G orden 1-3
        long bloqueOrden2,       // G orden 4-6
        long bloqueOrden3,       // G orden 7-8
        long leadsVentaCerrada   // H
) {
}
