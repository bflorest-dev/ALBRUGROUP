package pe.albrugroup.call_service.entity.enums;

/**
 * Estado de presencia del asesor desde el punto de vista del call-service.
 * En Asterisk se traduce a paused/unpaused dentro de la cola.
 */
public enum EstadoAgente {
    /** Disponible para recibir llamadas. */
    AVAILABLE,
    /** Atendiendo una llamada activa. */
    ON_CALL,
    /** Tipificando despues de una llamada. */
    WRAP_UP,
    /** En pausa (break, almuerzo, capacitacion, etc.). */
    BREAK,
    /** Sesion cerrada / desconectado. */
    OFFLINE
}
