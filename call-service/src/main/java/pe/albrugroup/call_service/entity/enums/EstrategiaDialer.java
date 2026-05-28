package pe.albrugroup.call_service.entity.enums;

/**
 * Estrategias de marcacion del dialer saliente.
 */
public enum EstrategiaDialer {
    /** El asesor revisa el lead antes de marcar (1:1, manual). */
    PREVIEW,
    /** Marca solo cuando hay un agente libre (1:1, automatico). */
    PROGRESSIVE,
    /** Marca varios numeros por agente disponible (ratio configurable). */
    PREDICTIVE,
    /** Marca a ratio fijo independientemente de disponibilidad. */
    POWER
}
