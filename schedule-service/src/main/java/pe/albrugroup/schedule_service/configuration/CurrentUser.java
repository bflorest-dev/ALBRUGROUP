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
}
