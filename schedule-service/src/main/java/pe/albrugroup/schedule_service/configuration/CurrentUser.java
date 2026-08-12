package pe.albrugroup.schedule_service.configuration;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import pe.albrugroup.schedule_service.exception.UnauthorizedException;
import pe.albrugroup.schedule_service.security.UserSession;

@Component
public class CurrentUser {

    public UserSession get() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null || !(auth.getPrincipal() instanceof UserSession userSession)) {
            throw new UnauthorizedException("Empleado no autenticado");
        }
        return userSession;
    }

    public Long empleadoID() {
        Long empleadoId = get().empleadoId();
        if (empleadoId == null) {
            throw new UnauthorizedException("Token sin empleadoId");
        }
        return empleadoId;
    }

    /** Roles del token (sin el prefijo ROLE_ de Spring Security). Vacio si no autenticado. */
    public java.util.List<String> roles() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) {
            return java.util.List.of();
        }
        return auth.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring("ROLE_".length()))
                .toList();
    }
}
