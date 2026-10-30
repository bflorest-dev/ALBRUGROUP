package pe.albrugroup.recruitment_service.configuration;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import pe.albrugroup.recruitment_service.exception.UnauthorizedException;
import pe.albrugroup.recruitment_service.security.UserSession;

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

    public boolean tieneRol(String rol) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + rol));
    }
}
