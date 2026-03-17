package pe.albrugroup.lead_service.security;

import java.util.List;

public record UserSession(
        String username,
        Long empleadoId,
        String nombreCompleto,
        List<String> roles
) {
}
