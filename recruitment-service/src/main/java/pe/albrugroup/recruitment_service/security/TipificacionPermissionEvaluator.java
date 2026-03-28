package pe.albrugroup.recruitment_service.security;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;

@Component
public class TipificacionPermissionEvaluator {

    public boolean canRead(Authentication authentication, Etapa etapa) {
        if (authentication == null || etapa == null) {
            return false;
        }
        if (etapa == Etapa.CONTRATACION) {
            return false;
        }
        return hasAuthority(authentication, mapReadPermission(etapa));
    }

    private String mapReadPermission(Etapa etapa) {
        return switch (etapa) {
            case RECLUTAMIENTO -> "READ_TIPIFICACIONES_RECLUTAMIENTO";
            case CAPACITACION -> "READ_TIPIFICACIONES_CAPACITACION";
            case CONTRATACION -> throw new IllegalStateException("La etapa CONTRATACION no debe mapear permisos de tipificaciones");
        };
    }

    private boolean hasAuthority(Authentication authentication, String permission) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(permission));
    }
}
