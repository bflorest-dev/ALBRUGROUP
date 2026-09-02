package pe.albrugroup.schedule_service.entity.enums;

/**
 * Tipo funcional de un tramo del dia, para el read model y los reportes. Se deriva del origen del
 * tramo + la razon del ajuste:
 * BASE: el horario base (o corrimiento REEMPLAZO_BASE, que sigue siendo la obligacion del dia).
 * EXTRA: tramo aditivo por ampliacion operativa (horas extra fuera del horario).
 * COMPENSABLE: tramo aditivo con razon COMPENSACION (recupera deficit).
 */
public enum TipoTramoDia {
    BASE,
    EXTRA,
    COMPENSABLE
}
