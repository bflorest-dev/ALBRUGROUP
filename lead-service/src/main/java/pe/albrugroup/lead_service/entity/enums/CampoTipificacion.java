package pe.albrugroup.lead_service.entity.enums;

/**
 * Punto de tipificación de la etapa cuyos códigos se usan para filtrar y mostrar la fila.
 * Cuando el ancla de fecha es TIPIFICACION, cada valor selecciona también su timestamp:
 *  - PRIMERA: primera tipificación de la etapa (set-once)       -> primeraTipificacionAt
 *  - ULTIMA:  última tipificación de la etapa (estado vigente)  -> ultimaTipificacionAt
 *  - MAYOR:   mayor rango alcanzado (high-water mark por orden) -> mayorRangoAt
 */
public enum CampoTipificacion {
    PRIMERA,
    ULTIMA,
    MAYOR
}
