package pe.albrugroup.gateway_service.security;

import java.util.List;

public record AuthenticatedUser(
        String username,
        Long empleadoId,
        String nombreCompleto,
        List<String> roles
) {
}
