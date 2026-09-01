package pe.albrugroup.lead_service.entity.enums;

/**
 * Métrica del RESUMEN de VENTA cuyo detalle se pide. Cada valor corresponde a un contador del dashboard
 * y define el filtro sobre el universo (fila VENTA en el período):
 *  - PREVENTAS:  todas (universo completo).
 *  - REGISTRADAS: última tipificación no nula y distinta de "SIN INGRESAR".
 *  - PROGRAMADAS: embudo (mayor rango en {PROGRAMADO, INSTALADO}).
 *  - RECHAZADAS: última tipificación en {SUBSANABLE, NO RECUPERABLE}.
 *  - INSTALADAS: última tipificación = INSTALADO.
 */
public enum MetricaVentaDetalle {
    PREVENTAS,
    REGISTRADAS,
    PROGRAMADAS,
    RECHAZADAS,
    INSTALADAS
}
