package pe.albrugroup.lead_service.entity.response;

/**
 * Métricas del día para "Leads del día" (día completo, con el scope de equipo del usuario).
 * A/B/D vienen de los eventos; F/G/H del resumen por etapa (PREVENTA). C y E se derivan en el frontend.
 */
public record LeadsDiariosMetricasResponse(
        long registros,          // A: eventos REGISTRO del día
        long leadsUnicos,        // B: leads distintos registrados
        long leadsRepetidos,     // D: leads con más de un registro
        long leadsTipificados,   // F: leads con última tipificación en PREVENTA
        long bloqueOrden1,       // G: última tipificación con orden 1-3
        long bloqueOrden2,       // G: última tipificación con orden 4-6
        long bloqueOrden3,       // G: última tipificación con orden 7-8
        long leadsVentaCerrada   // H: última tipificación PREVENTA = cierre que avanza (VENTA_CERRADA)
) {
}
