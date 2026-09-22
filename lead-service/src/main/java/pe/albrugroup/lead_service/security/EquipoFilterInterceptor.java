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
import pe.albrugroup.lead_service.entity.enums.AmbitoProveedor;
import pe.albrugroup.lead_service.service.ProveedorScopeService;

import java.util.List;

/**
 * Habilita por request el filtro Hibernate que acota los Leads visibles. Aprovecha la sesión de
 * Open-Session-In-View (activa por defecto).
 *
 * Reglas:
 * - Sin usuario autenticado (público/health): no se filtra.
 * - Visibilidad global (permiso VER_TODOS_LOS_EQUIPOS): no se filtra (ve todo).
 * - Rol activo acotado por PROVEEDOR (BACKOFFICE / POSTVENTA): filtro `proveedorFilter`
 *   por sus proveedores (estrechado al proveedor activo del selector, header X-Proveedor-Id). Se usa
 *   proveedorFilter EN LUGAR de equipoFilter (nunca ambos) para evitar doble filtro.
 * - SIN proveedores asignados: filtro vacío, por lo que la autorización falla cerrada.
 * - Resto (GTR/ventas): filtro `equipoFilter` por sus equipos; sin equipos → [-1] (fail-closed).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class EquipoFilterInterceptor implements HandlerInterceptor {

    private final EntityManager entityManager;
    private final CurrentUser currentUser;
    private final ProveedorScopeService proveedorScopeService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserSession)) {
            return true;
        }
        AmbitoProveedor ambito = proveedorScopeService.ambitoActual();
        if (ambito != null) {
            ProveedorScopeService.Scope scope = proveedorScopeService.resolverScope(ambito);
            try {
                entityManager.unwrap(Session.class)
                        .enableFilter("proveedorFilter")
                        .setParameterList("proveedores", List.copyOf(scope.idsParaQuery()));
            } catch (Exception e) {
                log.warn("No se pudo habilitar el filtro por proveedor: {}", e.getMessage());
            }
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
