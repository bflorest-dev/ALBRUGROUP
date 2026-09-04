package pe.albrugroup.lead_service.entity.enums;

/**
 * Métrica del RESUMEN de VENTA cuyo detalle se pide. Cada valor corresponde a un card, con su anclaje:
 *  - PREVENTAS:   cohorte fechaIngresoEtapa ∈ período; todos menos NO RECUPERABLE que nunca ingresó.
 *  - REGISTRADAS: ultimaTipificacionAt ∈ período; última = INGRESADO.
 *  - PROGRAMADAS: ultimaTipificacionAt ∈ período; última = PROGRAMADO.
 *  - RECHAZADAS:  ultimaTipificacionAt ∈ período; última ∈ {SUBSANABLE, NO RECUPERABLE} Y mayor rango ≥ INGRESADO.
 *  - INSTALADAS:  fechaInstalacion ∈ período.
 */
public enum MetricaVentaDetalle {
    PREVENTAS,
    REGISTRADAS,
    PROGRAMADAS,
    RECHAZADAS,
    INSTALADAS
}
