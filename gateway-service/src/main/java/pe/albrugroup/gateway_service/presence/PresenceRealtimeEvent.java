package pe.albrugroup.gateway_service.presence;

import lombok.Builder;

import java.time.Instant;
import java.util.List;

@Builder
public record PresenceRealtimeEvent(
        String tipo,
        Long empleadoId,
        String nombreCompleto,
        List<String> roles,
        String disponibilidad,
        Instant lastSeen,
        boolean online,
        String source,
        Instant occurredAt
) {
}
