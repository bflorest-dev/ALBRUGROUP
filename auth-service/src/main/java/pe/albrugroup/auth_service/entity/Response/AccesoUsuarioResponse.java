package pe.albrugroup.auth_service.entity.Response;

import java.util.Set;

public record AccesoUsuarioResponse(
        Long empleadoId,
        String dni,
        String nombreCompleto,
        String username,
        String email,
        Boolean activo,
        String rolPrincipal,
        Set<String> rolesSecundarios,
        Set<String> rolesAsignados
) {
}
