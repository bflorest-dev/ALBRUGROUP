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
    // Bloques de la sección "Distribución"
    // COHORTE_ULTIMA: bloque "Por tipificación" (cohorte por fechaIngresoEtapa, filtrada por última tipificación
    //   CRUDA vía el calificador `tipificacion`; null/vacío = bucket "sin ingresar"). A diferencia de RECHAZADAS,
    //   no exige que el mayor rango haya alcanzado INGRESADO, así que su "No recuperable" es el crudo del cohorte.
    // ZONA_REGISTRADAS: fila "Registradas" de "Por territorio" (anclada en ultimaTipificacionAt ∈ período con
    //   última == INGRESADO, igual que Q2 `dashboardVentaEstado`); se acota por el calificador `zona`.
    COHORTE_ULTIMA,
    ZONA_REGISTRADAS,
    // Embudo (conversiones)
    EMBUDO_REGISTRADAS,
    EMBUDO_INSTALADAS,
    EMBUDO_RECHAZADAS,
    EMBUDO_PROGRAMADAS_TOTAL,
    EMBUDO_PROGRAMADAS_INSTALADAS,
    EMBUDO_PROGRAMADAS_RECHAZADAS
}
