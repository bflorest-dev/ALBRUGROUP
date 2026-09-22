package pe.albrugroup.lead_service.service;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.UsuarioProveedor;
import pe.albrugroup.lead_service.entity.enums.AmbitoProveedor;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.repository.UsuarioProveedorRepository;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProveedorScopeServiceTest {

    private final UsuarioProveedorRepository repository = mock(UsuarioProveedorRepository.class);
    private final CurrentUser currentUser = mock(CurrentUser.class);
    private final HttpServletRequest request = mock(HttpServletRequest.class);
    private final ProveedorScopeService service = new ProveedorScopeService(repository, currentUser, request);

    @Test
    void rolActivoPostventaDeterminaElAmbito() {
        when(currentUser.roles()).thenReturn(List.of("ASESOR_POSTVENTA"));
        when(request.getHeader("X-Operational-Scope")).thenReturn("BACKOFFICE");

        assertThat(service.ambitoActual()).isEqualTo(AmbitoProveedor.POSTVENTA);
    }

    @Test
    void rolActivoBackofficeDeterminaElAmbito() {
        when(currentUser.roles()).thenReturn(List.of("ASESOR_BACKOFFICE"));

        assertThat(service.ambitoActual()).isEqualTo(AmbitoProveedor.BACKOFFICE);
    }

    @Test
    void headerOperacionalNoPuedeForzarOtroAmbito() {
        when(currentUser.roles()).thenReturn(List.of("ASESOR_POSTVENTA"));
        when(request.getHeader("X-Operational-Scope")).thenReturn("VENTAS");

        assertThat(service.ambitoActual()).isEqualTo(AmbitoProveedor.POSTVENTA);
    }

    @Test
    void proveedorActivoFueraDelAmbitoFallaCerrado() {
        Proveedor claro = Proveedor.builder().id(2L).nombre("CLARO").activo(true).build();
        when(currentUser.roles()).thenReturn(List.of("ASESOR_BACKOFFICE"));
        when(currentUser.empleadoID()).thenReturn(15L);
        when(request.getHeader(ProveedorScopeService.HEADER_PROVEEDOR)).thenReturn("1");
        when(repository.findByIdEmpleadoAndAmbitoAndActivoTrueOrderByProveedorNombreAsc(15L, AmbitoProveedor.BACKOFFICE))
                .thenReturn(List.of(UsuarioProveedor.builder()
                        .idEmpleado(15L)
                        .proveedor(claro)
                        .ambito(AmbitoProveedor.BACKOFFICE)
                        .activo(true)
                        .build()));

        var scope = service.resolverScope(AmbitoProveedor.BACKOFFICE);

        assertThat(scope.vacio()).isTrue();
    }

    @Test
    void proveedorActivoInvalidoSeRechaza() {
        when(currentUser.empleadoID()).thenReturn(15L);
        when(request.getHeader(ProveedorScopeService.HEADER_PROVEEDOR)).thenReturn("abc");
        when(repository.findByIdEmpleadoAndAmbitoAndActivoTrueOrderByProveedorNombreAsc(15L, AmbitoProveedor.POSTVENTA))
                .thenReturn(List.of());

        assertThatThrownBy(() -> service.resolverScope(AmbitoProveedor.POSTVENTA))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Proveedor activo invalido");
    }

}
