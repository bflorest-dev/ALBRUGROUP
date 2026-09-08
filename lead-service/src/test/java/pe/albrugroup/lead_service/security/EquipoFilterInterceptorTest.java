package pe.albrugroup.lead_service.security;

import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.enums.AmbitoProveedor;
import pe.albrugroup.lead_service.service.ProveedorScopeService;

import java.util.Set;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EquipoFilterInterceptorTest {

    private final EntityManager entityManager = mock(EntityManager.class);
    private final CurrentUser currentUser = mock(CurrentUser.class);
    private final ProveedorScopeService proveedorScopeService = mock(ProveedorScopeService.class);
    private final EquipoFilterInterceptor interceptor = new EquipoFilterInterceptor(
            entityManager,
            currentUser,
            proveedorScopeService
    );

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void ambitoBackofficeExplicitoTienePrioridadSobrePermisoGlobal() {
        var user = new UserSession(
                "postventa.backoffice",
                15L,
                "Postventa Backoffice",
                java.util.List.of("ASESOR_POSTVENTA", "ASESOR_BACKOFFICE"),
                java.util.List.of("VER_TODOS_LOS_EQUIPOS"),
                java.util.List.of()
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null)
        );
        Session session = mock(Session.class);
        Filter proveedorFilter = mock(Filter.class);
        when(entityManager.unwrap(Session.class)).thenReturn(session);
        when(session.enableFilter("proveedorFilter")).thenReturn(proveedorFilter);
        when(proveedorFilter.setParameterList("proveedores", java.util.List.of(2L))).thenReturn(proveedorFilter);
        when(proveedorScopeService.ambitoActual()).thenReturn(AmbitoProveedor.BACKOFFICE);
        when(proveedorScopeService.resolverScope(AmbitoProveedor.BACKOFFICE))
                .thenReturn(new ProveedorScopeService.Scope(true, Set.of(2L), Set.of("CLARO")));
        when(proveedorScopeService.ambitoSolicitadoExplicitamente()).thenReturn(true);
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(true);

        interceptor.preHandle(mock(HttpServletRequest.class), mock(HttpServletResponse.class), new Object());

        verify(session).enableFilter("proveedorFilter");
        verify(proveedorFilter).setParameterList("proveedores", java.util.List.of(2L));
        verify(session, never()).enableFilter("equipoFilter");
    }
}
