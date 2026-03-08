package pe.albrugroup.lead_service.entity.response;

import java.time.Instant;

public record ProveedorResponse(
        Long id,
        String nombre,
        Boolean activo,
        Instant createdAt) {}
