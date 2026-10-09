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

import java.time.LocalDate;
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
                LocalDate.of(2026, 9, 7),
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
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(true);

        interceptor.preHandle(mock(HttpServletRequest.class), mock(HttpServletResponse.class), new Object());

        verify(session).enableFilter("proveedorFilter");
        verify(proveedorFilter).setParameterList("proveedores", java.util.List.of(2L));
        verify(session, never()).enableFilter("equipoFilter");
    }

    @Test
    void equipoActivoValidoReduceElFiltroDeEquipos() {
        autenticarUsuarioEquipos(java.util.List.of(1L, 2L));
        Session session = mock(Session.class);
        Filter equipoFilter = mock(Filter.class);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(entityManager.unwrap(Session.class)).thenReturn(session);
        when(session.enableFilter("equipoFilter")).thenReturn(equipoFilter);
        when(equipoFilter.setParameterList("equipos", java.util.List.of(2L))).thenReturn(equipoFilter);
        when(proveedorScopeService.ambitoActual()).thenReturn(null);
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(false);
        when(currentUser.equipos()).thenReturn(java.util.List.of(1L, 2L));
        when(request.getHeader(EquipoFilterInterceptor.HEADER_EQUIPO)).thenReturn("2");

        interceptor.preHandle(request, mock(HttpServletResponse.class), new Object());

        verify(equipoFilter).setParameterList("equipos", java.util.List.of(2L));
    }

    @Test
    void administradorUsaProveedorActivoEnBackofficeGlobal() {
        var user = new UserSession(
                "admin",
                1L,
                "Administrador",
                LocalDate.of(2026, 9, 7),
                java.util.List.of("ADMINISTRADOR"),
                java.util.List.of("VER_TODOS_LOS_EQUIPOS"),
                java.util.List.of()
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null)
        );
        Session session = mock(Session.class);
        Filter proveedorFilter = mock(Filter.class);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(entityManager.unwrap(Session.class)).thenReturn(session);
        when(session.enableFilter("proveedorFilter")).thenReturn(proveedorFilter);
        when(proveedorFilter.setParameterList("proveedores", java.util.List.of(2L))).thenReturn(proveedorFilter);
        when(proveedorScopeService.ambitoActual()).thenReturn(null);
        when(proveedorScopeService.resolverScopeAdministrativo(AmbitoProveedor.BACKOFFICE))
                .thenReturn(new ProveedorScopeService.Scope(true, Set.of(2L), Set.of("CLARO")));
        when(proveedorScopeService.esAdministrador()).thenReturn(true);
        when(request.getRequestURI()).thenReturn("/venta");
        when(request.getParameter("idEquipo")).thenReturn(null);

        interceptor.preHandle(request, mock(HttpServletResponse.class), new Object());

        verify(session).enableFilter("proveedorFilter");
        verify(proveedorFilter).setParameterList("proveedores", java.util.List.of(2L));
        verify(session, never()).enableFilter("equipoFilter");
    }

    @Test
    void equipoActivoFueraDelUsuarioFallaCerrado() {
        autenticarUsuarioEquipos(java.util.List.of(1L, 2L));
        Session session = mock(Session.class);
        Filter equipoFilter = mock(Filter.class);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(entityManager.unwrap(Session.class)).thenReturn(session);
        when(session.enableFilter("equipoFilter")).thenReturn(equipoFilter);
        when(equipoFilter.setParameterList("equipos", java.util.List.of(-1L))).thenReturn(equipoFilter);
        when(proveedorScopeService.ambitoActual()).thenReturn(null);
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(false);
        when(currentUser.equipos()).thenReturn(java.util.List.of(1L, 2L));
        when(request.getHeader(EquipoFilterInterceptor.HEADER_EQUIPO)).thenReturn("99");

        interceptor.preHandle(request, mock(HttpServletResponse.class), new Object());

        verify(equipoFilter).setParameterList("equipos", java.util.List.of(-1L));
    }

    private void autenticarUsuarioEquipos(java.util.List<Long> equipos) {
        var user = new UserSession(
                "asesor.ventas",
                10L,
                "Asesor Ventas",
                LocalDate.of(2026, 9, 7),
                java.util.List.of("ASESOR_VENTAS"),
                java.util.List.of(),
                equipos
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null)
        );
    }
}
