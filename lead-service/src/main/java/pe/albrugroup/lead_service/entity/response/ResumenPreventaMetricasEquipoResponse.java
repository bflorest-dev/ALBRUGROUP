package pe.albrugroup.lead_service.entity.response;

/**
 * Desglose de PREVENTA por equipo para el resumen diario. La fila ya representa únicamente leads
 * cuya tipificación seleccionada es PREVENTA.
 */
public record ResumenPreventaMetricasEquipoResponse(
        Long idEquipo,
        long preventas,
        long completas,
        long validas
) {
}
