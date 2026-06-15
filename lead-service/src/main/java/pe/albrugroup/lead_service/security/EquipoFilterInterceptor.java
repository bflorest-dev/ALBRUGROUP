package pe.albrugroup.lead_service.security;

import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Session;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import pe.albrugroup.lead_service.configuration.CurrentUser;

import java.util.List;

/**
 * Habilita por request el filtro Hibernate `equipoFilter` sobre Lead, acotando los datos a
 * los equipos del usuario. Aprovecha la sesión de Open-Session-In-View (activa por defecto).
 *
 * Reglas:
 * - Sin usuario autenticado (público/health): no se filtra.
 * - Visibilidad global (permiso VER_TODOS_LOS_EQUIPOS): no se filtra (ve todos los equipos).
 * - Resto: se filtra a sus equipos; sin equipos → centinela [-1] (fail-closed, no ve nada).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class EquipoFilterInterceptor implements HandlerInterceptor {

    private final EntityManager entityManager;
    private final CurrentUser currentUser;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserSession)) {
            return true;
        }
        if (currentUser.tieneVisibilidadGlobalEquipos()) {
            return true;
        }
        List<Long> equipos = currentUser.equipos();
        List<Long> valores = (equipos == null || equipos.isEmpty()) ? List.of(-1L) : equipos;
        try {
            entityManager.unwrap(Session.class)
                    .enableFilter("equipoFilter")
                    .setParameterList("equipos", valores);
        } catch (Exception e) {
            log.warn("No se pudo habilitar el filtro por equipo: {}", e.getMessage());
        }
        return true;
    }
}
