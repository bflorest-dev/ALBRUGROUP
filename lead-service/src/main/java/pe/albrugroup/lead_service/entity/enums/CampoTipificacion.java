package pe.albrugroup.lead_service.entity.enums;

/**
 * Punto de tipificación de la etapa sobre el que se arma el reporte de gestión por campaña.
 * Cada valor determina TANTO el código que agrupa la fila COMO la fecha que define el período:
 *  - PRIMERA: primera tipificación de la etapa (set-once)      -> primeraTipificacionAt
 *  - ULTIMA:  última tipificación de la etapa (se pisa)         -> ultimaTipificacionAt
 *  - MAYOR:   mayor rango alcanzado (high-water mark por orden) -> mayorRangoAt
 */
public enum CampoTipificacion {
    PRIMERA,
    ULTIMA,
    MAYOR
}
