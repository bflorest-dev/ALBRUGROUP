package pe.albrugroup.lead_service.security;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import pe.albrugroup.lead_service.entity.enums.Etapa;

@Component
public class TipificacionPermissionEvaluator {

    public boolean canRead(Authentication authentication, Etapa etapa) {
        if (authentication == null || etapa == null) {
            return false;
        }
        return hasAuthority(authentication, mapReadPermission(etapa));
    }

    private String mapReadPermission(Etapa etapa) {
        return switch (etapa) {
            case PREVENTA -> "READ_TIPIFICACIONES_PREVENTA";
            case VENTA -> "READ_TIPIFICACIONES_VENTA";
            case POSTVENTA -> "READ_TIPIFICACIONES_POSTVENTA";
        };
    }

    private boolean hasAuthority(Authentication authentication, String permission) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(permission));
    }
}
