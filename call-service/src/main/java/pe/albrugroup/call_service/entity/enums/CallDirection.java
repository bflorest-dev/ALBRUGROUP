package pe.albrugroup.call_service.entity.enums;

/**
 * Sentido de la llamada respecto al call center.
 */
public enum CallDirection {
    /** Cliente externo entrando al sistema (via trunk). */
    INBOUND,
    /** Llamada saliente generada por el dialer hacia un cliente. */
    OUTBOUND,
    /** Llamada entre dos extensiones del propio call center. */
    INTERNAL
}
