package pe.albrugroup.lead_service.entity.enums;

public enum EstadoExpediente {
    AUDIO_CONFORME,
    AUDIO_OBSERVADO,
    SERVICIO_DESACTIVO,
    SERVICIO_SUSPENDIDO,
    EXPEDIENTE_PENDIENTE,
    CLAWBACK;

    public boolean isPositivo() {
        return this == AUDIO_CONFORME;
    }
}
