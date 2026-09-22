package pe.albrugroup.auth_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import pe.albrugroup.auth_service.entity.Rol;
import pe.albrugroup.auth_service.entity.Usuario;
import pe.albrugroup.auth_service.entity.request.RegistrarUsuarioRequest;
import pe.albrugroup.auth_service.repository.UsuarioRepository;

import java.util.LinkedHashSet;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private SessionInvalidationService sessionInvalidationService;

    @InjectMocks private UsuarioService service;

    @Test
    void identidadNuevaSeCreaSinRolesConUsernameEstable() {
        when(usuarioRepository.findByEmpleadoId(15L)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.upsertUsuario(request(15L, "Nayeli", "Palacios", "70000001", "postventa@albru.pe"));

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        Usuario creado = captor.getValue();
        assertThat(creado.getUsername()).isEqualTo("N70000001P@albru.pe");
        assertThat(creado.getRoles()).isEmpty();
        assertThat(creado.getRolPrincipal()).isNull();
    }

    @Test
    void sincronizarIdentidadExistenteNoModificaRoles() {
        Rol principal = Rol.builder().id(1L).nombre("ASESOR_POSTVENTA").build();
        Rol secundario = Rol.builder().id(2L).nombre("ASESOR_BACKOFFICE").build();
        Usuario existente = Usuario.builder()
                .id(10L)
                .empleadoId(15L)
                .username("N70000001P@albru.pe")
                .email("anterior@albru.pe")
                .dni("70000001")
                .activo(false)
                .roles(new LinkedHashSet<>(java.util.List.of(principal, secundario)))
                .rolPrincipal(principal)
                .build();
        when(usuarioRepository.findByEmpleadoId(15L)).thenReturn(Optional.of(existente));
        when(usuarioRepository.save(existente)).thenReturn(existente);

        service.upsertUsuario(request(15L, "Nayeli", "Palacios", "70000001", "nuevo@albru.pe"));

        assertThat(existente.getRoles()).containsExactlyInAnyOrder(principal, secundario);
        assertThat(existente.getRolPrincipal()).isSameAs(principal);
        assertThat(existente.getActivo()).isFalse();
        verify(refreshTokenService, never()).revokeActiveTokens(any());
    }

    private RegistrarUsuarioRequest request(Long empleadoId, String nombres, String apellidos, String dni, String email) {
        return RegistrarUsuarioRequest.builder()
                .empleadoId(empleadoId)
                .nombres(nombres)
                .apellidos(apellidos)
                .dni(dni)
                .email(email)
                .build();
    }
}
