package pe.albrugroup.schedule_service.entity.enums;

/**
 * Subestado de un tramo dentro de la jornada del dia (base / extra / compensable). Derivado en la
 * lectura (proyeccion pura) y persistido como foto al cerrar la jornada (reporte). NO se muestra en
 * el bloque de marcacion; alimenta reportes.
 *
 * PENDIENTE: aun no comienza (ventana futura).
 * EN_CURSO: la hora actual cae dentro de la ventana y el empleado esta presente/marcado.
 * CUMPLIDO: se trabajo con cierre coherente (salida real o handoff continuo al siguiente tramo).
 * EXPIRADO: la ventana ya paso sin haberse trabajado (base -> deficit; no aplica anulacion).
 * ANULADO: tramo extra/compensable que se entro pero no tuvo cierre coherente (abandono) -> 0 credito.
 */
public enum EstadoTramoDia {
    PENDIENTE,
    EN_CURSO,
    CUMPLIDO,
    EXPIRADO,
    ANULADO
}
