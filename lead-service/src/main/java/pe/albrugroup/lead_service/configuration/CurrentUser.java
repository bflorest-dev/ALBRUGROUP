package pe.albrugroup.lead_service.configuration;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import pe.albrugroup.lead_service.exception.UnauthorizedException;
import pe.albrugroup.lead_service.security.UserSession;

import java.util.List;

@Component
public class CurrentUser {

    public UserSession get() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new UnauthorizedException("Empleado no autenticado");
        }
        return (UserSession) auth.getPrincipal();
    }

    public Long empleadoID() {
        return get().empleadoId();
    }
    public String nombreCompleto() {
        return get().nombreCompleto();
    }
    public List<String> roles() {
        return get().roles();
    }
    public String rolPrincipal() {
        return roles().stream()
                .findFirst()
                .orElse("SIN_ROL");
    }
    public List<String> permisos() {
        return get().permisos();
    }
    public List<Long> equipos() {
        return get().equipos();
    }
    // Visibilidad global: ve datos de todos los equipos (salta el filtro por equipo).
    // Nunca se deriva de "no tener equipo": es siempre un permiso explícito.
    public boolean tieneVisibilidadGlobalEquipos() {
        return permisos().contains("VER_TODOS_LOS_EQUIPOS");
    }
}
