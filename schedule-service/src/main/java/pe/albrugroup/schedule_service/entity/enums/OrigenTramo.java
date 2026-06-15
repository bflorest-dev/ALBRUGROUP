package pe.albrugroup.schedule_service.entity.enums;

/**
 * Origen de un tramo de asistencia archivado.
 * BASE: el tramo programado original del dia (la jornada que se cerro).
 * AMPLIACION: un tramo agregado por una ampliacion de horario (reapertura).
 */
public enum OrigenTramo {
    BASE,
    AMPLIACION,
    REEMPLAZO_BASE,
    JORNADA_EXTRAORDINARIA,
    TRAMO_ADICIONAL
}
