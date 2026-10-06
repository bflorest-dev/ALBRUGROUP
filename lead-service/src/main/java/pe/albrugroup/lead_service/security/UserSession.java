package pe.albrugroup.lead_service.security;

import java.time.LocalDate;
import java.util.List;

public record UserSession(
        String username,
        Long empleadoId,
        String nombreCompleto,
        LocalDate fechaIngresoEmpleado,
        List<String> roles,
        List<String> permisos,
        List<Long> equipos
) {
}
