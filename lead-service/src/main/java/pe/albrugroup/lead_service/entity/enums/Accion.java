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
    VALIDACION,
    // Correccion integral hecha por un ADMIN sobre el lead (edicion de datos y/o eliminacion de
    // eventos). Se emite un unico evento por cada gestion completa de correccion y no es eliminable:
    // deja constancia de que, a partir de ese punto, la integridad del lead pudo quedar comprometida.
    CORRECCION
}
