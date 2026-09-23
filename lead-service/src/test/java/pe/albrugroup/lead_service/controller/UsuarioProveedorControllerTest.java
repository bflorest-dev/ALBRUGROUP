package pe.albrugroup.lead_service.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import pe.albrugroup.lead_service.entity.request.ReconciliarRolesScopeRequest;
import pe.albrugroup.lead_service.service.ProveedorScopeService;
import pe.albrugroup.lead_service.service.UsuarioProveedorService;
import pe.albrugroup.lead_service.service.mapper.ProveedorMapper;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class UsuarioProveedorControllerTest {

    @Mock private UsuarioProveedorService usuarioProveedorService;
    @Mock private ProveedorScopeService proveedorScopeService;
    @Mock private ProveedorMapper proveedorMapper;

    @InjectMocks private UsuarioProveedorController controller;

    @BeforeEach
    void configurarSecreto() {
        ReflectionTestUtils.setField(controller, "internalSharedSecret", "test-secret");
    }

    @Test
    void endpointInternoRechazaSecretoInvalido() {
        ReconciliarRolesScopeRequest request = new ReconciliarRolesScopeRequest();
        request.setRoles(Set.of("ASESOR_POSTVENTA"));

        assertThatThrownBy(() -> controller.reconciliarScopePorRoles(15L, "incorrecto", request))
                .hasMessageContaining("Secreto interno invalido");
    }

    @Test
    void endpointInternoDelegaLaReconciliacionConSecretoValido() {
        ReconciliarRolesScopeRequest request = new ReconciliarRolesScopeRequest();
        request.setRoles(Set.of("ASESOR_POSTVENTA", "ASESOR_VENTAS"));

        var response = controller.reconciliarScopePorRoles(15L, "test-secret", request);

        assertThat(response.getStatusCode().value()).isEqualTo(204);
        verify(usuarioProveedorService).reconciliarScopePorRoles(15L, request.getRoles());
    }
}
