package pe.albrugroup.auth_service.entity.Response;

import java.util.Set;

public record RolesUsuarioResponse(
        Long empleadoId,
        String rolPrincipal,
        Set<String> rolesSecundarios,
        Set<String> rolesAsignados
) {
}
