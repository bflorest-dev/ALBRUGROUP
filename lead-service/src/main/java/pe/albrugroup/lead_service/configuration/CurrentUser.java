package pe.albrugroup.lead_service.configuration;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import pe.albrugroup.lead_service.security.UserSession;

@Component
public class CurrentUser {

    public UserSession get() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Empleado no autenticado");
        }
        return (UserSession) auth.getPrincipal();
    }

    public Long empleadoID() {
        return get().empleadoId();
    }
    public String nombreCompleto() {
        return get().nombreCompleto();
    }
}
