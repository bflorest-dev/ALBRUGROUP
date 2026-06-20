package pe.albrugroup.lead_service.entity.enums;

public enum Accion {
    REGISTRO,
    // Alta de una oportunidad/titular adicional sobre un contacto ya existente (multi-titular).
    // Es un evento aparte de REGISTRO para no contaminar los conteos de leads registrados.
    NUEVA_OPORTUNIDAD,
    ASIGNACION,
    CONTACTO,
    TIPIFICACION,
    ACTUALIZACION_DATOS_PREVENTA,
    ACTUALIZACION_DIRECCION,
    ACTUALIZACION_OFERTA_COMERCIAL,
    VALIDACION
}
