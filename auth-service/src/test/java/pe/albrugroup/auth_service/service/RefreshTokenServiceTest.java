package pe.albrugroup.auth_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import pe.albrugroup.auth_service.entity.RefreshToken;
import pe.albrugroup.auth_service.entity.Rol;
import pe.albrugroup.auth_service.entity.Usuario;
import pe.albrugroup.auth_service.exception.UnauthorizedException;
import pe.albrugroup.auth_service.repository.RefreshTokenRepository;
import pe.albrugroup.auth_service.security.JWTUtil;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock private RefreshTokenRepository repository;
    @Mock private JWTUtil jwtUtil;

    private RefreshTokenService service;
    private Rol principal;
    private Rol secundario;
    private Usuario usuario;

    @BeforeEach
    void setUp() {
        service = new RefreshTokenService(repository, jwtUtil);
        ReflectionTestUtils.setField(service, "refreshExpiration", Duration.ofHours(8));
        principal = Rol.builder().id(1L).nombre("ASESOR_POSTVENTA").build();
        secundario = Rol.builder().id(2L).nombre("ASESOR_BACKOFFICE").build();
        usuario = Usuario.builder()
                .empleadoId(15L)
                .activo(true)
                .roles(new LinkedHashSet<>(List.of(principal, secundario)))
                .rolPrincipal(principal)
                .build();
        org.mockito.Mockito.lenient().when(jwtUtil.getExpiresInSeconds()).thenReturn(1800L);
    }

    @Test
    void refreshConservaElRolActivoDeLaSesion() {
        RefreshToken actual = token(secundario);
        when(repository.findByTokenHashForUpdate(any())).thenReturn(Optional.of(actual));
        when(jwtUtil.generateToken(any(), eq(secundario))).thenReturn("access-backoffice");

        RefreshTokenService.TokenPair resultado = service.rotate("refresh-actual");

        assertThat(resultado.rolActivo()).isSameAs(secundario);
        assertThat(resultado.accessToken()).isEqualTo("access-backoffice");
        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getRolActivo()).isSameAs(secundario);
        assertThat(actual.getRevokedAt()).isNotNull();
    }

    @Test
    void cambioVoluntarioRotaElRefreshYUsaElRolSolicitado() {
        RefreshToken actual = token(principal);
        when(repository.findByTokenHashForUpdate(any())).thenReturn(Optional.of(actual));
        when(jwtUtil.generateToken(any(), eq(secundario))).thenReturn("access-backoffice");

        RefreshTokenService.TokenPair resultado = service.switchActiveRole("refresh-actual", 15L, secundario);

        assertThat(resultado.rolActivo()).isSameAs(secundario);
        assertThat(actual.getRevokedAt()).isNotNull();
        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getRolActivo()).isSameAs(secundario);
    }

    @Test
    void cambioVoluntarioRechazaUnRolNoAsignado() {
        Rol ajeno = Rol.builder().id(99L).nombre("RRHH").build();
        when(repository.findByTokenHashForUpdate(any())).thenReturn(Optional.of(token(principal)));

        assertThatThrownBy(() -> service.switchActiveRole("refresh-actual", 15L, ajeno))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("no esta asignado");
    }

    private RefreshToken token(Rol activo) {
        return RefreshToken.builder()
                .usuario(usuario)
                .rolActivo(activo)
                .tokenHash("hash")
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
    }
}
