package pe.albrugroup.lead_service.entity.enums;

/*
 * Campo de fecha contra el que una bandeja de VENTA aplica el rango fechaDesde/fechaHasta.
 * Cada bandeja valida su propio subconjunto permitido (p. ej. Programados solo admite
 * PROGRAMACION, INGRESO y ULTIMA_GESTION). El default de cada bandeja mantiene el
 * comportamiento historico cuando el frontend no envia el parametro.
 */
public enum CampoFechaListadoVenta {
    PROGRAMACION,
    RECHAZO,
    INSTALACION,
    TIPIFICACION_INSTALADO,
    INGRESO,
    ULTIMA_GESTION
}
