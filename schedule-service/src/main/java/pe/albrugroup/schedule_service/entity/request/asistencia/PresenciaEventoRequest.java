package pe.albrugroup.schedule_service.entity.request.asistencia;

import java.time.Instant;

public record PresenciaEventoRequest(
        Long empleadoId,
        String tipo,
        Instant timestamp,
        String origen
) {}
