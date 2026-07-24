package pe.albrugroup.lead_service.entity.response;

import java.util.Set;

public record UsuarioRolAuthResponse(
        Long empleadoId,
        String nombreCompleto,
        Set<String> roles,
        Set<Long> equipoIds
) {
}
