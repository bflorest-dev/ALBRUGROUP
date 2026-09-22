package pe.albrugroup.auth_service.entity.Response;

import java.time.Instant;
import java.util.Set;

public record RolAuditoriaResponse(
        Long id,
        Long empleadoId,
        Long actorEmpleadoId,
        String actorUsername,
        String rolPrincipalAnterior,
        String rolPrincipalNuevo,
        Set<String> rolesAnteriores,
        Set<String> rolesNuevos,
        Instant fecha
) {
}
