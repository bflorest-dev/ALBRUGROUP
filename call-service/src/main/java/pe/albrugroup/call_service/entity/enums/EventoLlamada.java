package pe.albrugroup.call_service.entity.enums;

/**
 * Tipos de eventos granulares persistidos en CallEvent para auditoria.
 * Mapean a eventos AMI/ARI de Asterisk.
 */
public enum EventoLlamada {
    ORIGINATE,
    RING,
    ANSWER,
    BRIDGE_ENTER,
    BRIDGE_LEAVE,
    HOLD,
    UNHOLD,
    TRANSFER_BLIND,
    TRANSFER_ATTENDED,
    DTMF,
    QUEUE_JOIN,
    QUEUE_LEAVE,
    QUEUE_ABANDON,
    AGENT_RING_NO_ANSWER,
    AGENT_CONNECT,
    AGENT_COMPLETE,
    AGENT_PAUSE,
    AGENT_UNPAUSE,
    RECORDING_START,
    RECORDING_STOP,
    HANGUP
}
