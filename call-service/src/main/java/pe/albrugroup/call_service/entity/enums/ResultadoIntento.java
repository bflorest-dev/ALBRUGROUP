package pe.albrugroup.call_service.entity.enums;

/**
 * Resultado de un intento individual de marcacion del dialer.
 */
public enum ResultadoIntento {
    PENDING,
    ANSWERED,
    NO_ANSWER,
    BUSY,
    FAILED,
    ABANDONED,
    ANSWERING_MACHINE,
    BLACKLIST,
    INVALID_NUMBER
}
