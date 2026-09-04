package pe.albrugroup.lead_service.entity.enums;

/**
 * Métrica del RESUMEN de VENTA cuyo detalle se pide. Cada valor corresponde a un card del dashboard:
 *  - PREVENTAS:  preventa genuina = mayor rango en {INGRESADO, PROGRAMADO, INSTALADO} ó última nula.
 *  - REGISTRADAS: última tipificación = INGRESADO.
 *  - PROGRAMADAS: última tipificación = PROGRAMADO.
 *  - RECHAZADAS: última tipificación en {SUBSANABLE, NO RECUPERABLE}.
 *  - INSTALADAS: instaladas por fechaInstalacion ∈ período (ancla distinta al resto).
 */
public enum MetricaVentaDetalle {
    PREVENTAS,
    REGISTRADAS,
    PROGRAMADAS,
    RECHAZADAS,
    INSTALADAS
}
