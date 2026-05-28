package pe.albrugroup.call_service.entity.enums;

/**
 * Estado del ciclo de vida de una llamada (mapea conceptos de Asterisk a negocio).
 */
public enum CallStatus {
    /** call-service envio el Originate y aun no hay respuesta. */
    ORIGINATING,
    /** El canal destino esta sonando. */
    RINGING,
    /** El destino contesto (cliente o agente, segun direction). */
    ANSWERED,
    /** Cliente y agente unidos en un mismo bridge. */
    BRIDGED,
    /** Llamada termino normalmente con conversacion. */
    COMPLETED,
    /** Fallo de marcacion (red, codec, autenticacion). */
    FAILED,
    /** El cliente colgo antes de ser atendido por un agente. */
    ABANDONED,
    /** El destino no contesto dentro del timeout. */
    NO_ANSWER,
    /** Linea ocupada. */
    BUSY,
    /** Congestion de la red telefonica. */
    CONGESTION,
    /** Detectado como contestador automatico (AMD). */
    ANSWERING_MACHINE
}
