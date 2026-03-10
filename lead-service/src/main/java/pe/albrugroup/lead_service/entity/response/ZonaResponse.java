package pe.albrugroup.lead_service.entity.response;

import java.time.Instant;
import java.util.List;

public record ZonaResponse(
        Long id,
        String nombre,
        Boolean activo,
        Instant createdAt,
        Instant updatedAt,
        List<ZonaReglaResponse> reglas) {
}
