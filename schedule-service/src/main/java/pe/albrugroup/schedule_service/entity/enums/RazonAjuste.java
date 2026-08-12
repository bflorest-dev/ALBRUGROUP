package pe.albrugroup.schedule_service.entity.enums;

/**
 * Intencion de un ajuste de jornada, ortogonal a {@link OrigenAjusteJornada} (la mecanica).
 * Decide status del dia, balance (horas extra / compensacion) y autorizacion.
 */
public enum RazonAjuste {
    /** Tramo aditivo fuera del base (entrar antes / periodo extra) -> horas extra, no ensucia status. */
    AMPLIACION_OPERATIVA,
    /** Mueve la ventana base por tardanza no notificada -> status TARDANZA COMPENSADA. */
    CORRIMIENTO_COMPENSADA,
    /** Mueve la ventana base por tardanza notificada a RRHH -> status TARDANZA JUSTIFICADA. */
    CORRIMIENTO_JUSTIFICADA,
    /** Tramo aditivo que neutraliza deficit de horas (tope en 0). */
    COMPENSACION
}
