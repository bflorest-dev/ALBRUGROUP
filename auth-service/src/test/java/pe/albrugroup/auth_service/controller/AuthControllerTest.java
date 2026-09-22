package pe.albrugroup.auth_service.controller;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import pe.albrugroup.auth_service.entity.Usuario;
import pe.albrugroup.auth_service.entity.request.LoginRequest;
import pe.albrugroup.auth_service.exception.ForbiddenException;
import pe.albrugroup.auth_service.security.CustomUserDetails;
import pe.albrugroup.auth_service.security.JWTUtil;
import pe.albrugroup.auth_service.service.RefreshTokenService;
import pe.albrugroup.auth_service.service.RolService;
import pe.albrugroup.auth_service.usecase.IUsuario;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock private IUsuario usuarioService;
    @Mock private AuthenticationManager authManager;
    @Mock private JWTUtil jwtUtil;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private RolService rolService;

    @InjectMocks private AuthController controller;

    @Test
    void cuentaSinRolPrincipalNoPuedeIniciarSesion() {
        Usuario usuario = Usuario.builder()
                .username("pendiente@albru.pe")
                .empleadoId(50L)
                .activo(true)
                .roles(Set.of())
                .rolPrincipal(null)
                .build();
        var autenticacion = new UsernamePasswordAuthenticationToken(
                new CustomUserDetails(usuario), null, java.util.List.of());
        when(authManager.authenticate(any())).thenReturn(autenticacion);

        assertThatThrownBy(() -> controller.login(LoginRequest.builder()
                .username("pendiente@albru.pe")
                .password("temporal")
                .build()))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("rol principal");

        verify(jwtUtil, never()).generateToken(any(), any());
        verify(refreshTokenService, never()).createRefreshToken(any(), any());
    }
}
