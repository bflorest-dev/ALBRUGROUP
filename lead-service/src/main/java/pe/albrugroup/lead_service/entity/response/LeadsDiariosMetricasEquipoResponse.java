package pe.albrugroup.lead_service.entity.response;

/**
 * Métricas por equipo para "Leads del día" y el DASHBOARD del ADMIN.
 * idEquipo null = "Sin equipo". C y E se derivan en el frontend.
 *
 * <p>A, B y D describen siempre la <b>ingesta</b> del período (leads con REGISTRO), sin importar el
 * modo: miden la calidad de la base y no tienen lectura fuera de la ingesta.
 *
 * <p>{@code cartera} y {@code gestionados} solo se llenan en modo GESTIONADOS, que mide la
 * operación del período. En ese modo {@code leadsVentaCerrada} cuenta las preventas <b>ocurridas</b>
 * en el rango (no la cohorte de ingresados) y los bloques quedan en cero.
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
        long leadsVentaCerrada,  // H
        long cartera,            // solo GESTIONADOS: ingresados + traídos al período
        long gestionados         // solo GESTIONADOS: con tipificación ocurrida en el período
) {
}
