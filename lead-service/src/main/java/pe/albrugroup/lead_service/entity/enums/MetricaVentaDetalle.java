package pe.albrugroup.lead_service.entity.enums;

/**
 * Métrica del dashboard de VENTA cuyo detalle (drill-down) se pide. El anclaje y el predicado de cada una
 * viven en {@code VentaMetricaSpec} (fuente única para que el detalle cuadre con el número del card).
 *
 * <p>Estados del cuadrante (SIN_INGRESAR/REGISTRADAS/PROGRAMADAS/SUBSANABLES/RECHAZADAS/INSTALADAS): el
 * calificador {@code enfoque} (DIA|GENERAL) elige el anclaje. PREVENTAS es el contador único. Los demás son
 * el embudo de conversiones y los otros contadores del dashboard (programación, ranking, tramos).</p>
 */
public enum MetricaVentaDetalle {
    // Contador único
    PREVENTAS,
    // Estados del cuadrante (enfoque DIA / GENERAL)
    SIN_INGRESAR,
    REGISTRADAS,
    PROGRAMADAS,
    SUBSANABLES,
    RECHAZADAS,
    INSTALADAS,
    // Otros contadores del dashboard
    PROGRAMACION_SUBTIP,
    RANKING,
    TRAMOS,
    // Embudo (conversiones)
    EMBUDO_REGISTRADAS,
    EMBUDO_INSTALADAS,
    EMBUDO_RECHAZADAS,
    EMBUDO_PROGRAMADAS_TOTAL,
    EMBUDO_PROGRAMADAS_INSTALADAS,
    EMBUDO_PROGRAMADAS_RECHAZADAS
}
