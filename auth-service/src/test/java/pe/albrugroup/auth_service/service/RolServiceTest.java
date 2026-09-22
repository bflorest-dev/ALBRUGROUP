package pe.albrugroup.auth_service.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import pe.albrugroup.auth_service.entity.Rol;
import pe.albrugroup.auth_service.entity.Usuario;
import pe.albrugroup.auth_service.entity.UsuarioRolAuditoria;
import pe.albrugroup.auth_service.entity.request.AsignarRolesRequest;
import pe.albrugroup.auth_service.exception.BadRequestException;
import pe.albrugroup.auth_service.exception.NotFoundException;
import pe.albrugroup.auth_service.exception.UnprocessableEntityException;
import pe.albrugroup.auth_service.repository.RolRepository;
import pe.albrugroup.auth_service.repository.UsuarioRepository;
import pe.albrugroup.auth_service.repository.UsuarioRolAuditoriaRepository;
import pe.albrugroup.auth_service.security.CustomUserDetails;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RolServiceTest {

    @Mock private RolRepository rolRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private UsuarioRolAuditoriaRepository auditoriaRepository;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private SessionInvalidationService sessionInvalidationService;
    @Mock private EquipoService equipoService;

    @InjectMocks private RolService service;

    private final Rol postventa = Rol.builder().id(1L).nombre("ASESOR_POSTVENTA").build();
    private final Rol backoffice = Rol.builder().id(2L).nombre("ASESOR_BACKOFFICE").build();

    @BeforeEach
    void autenticarAdministrador() {
        Usuario actor = Usuario.builder()
                .empleadoId(1L)
                .username("admin@albru.pe")
                .activo(true)
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(new CustomUserDetails(actor), null, List.of()));
    }

    @AfterEach
    void limpiarContexto() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void asignarRolesAUnEmpleadoNoModificaAOtro() {
        Usuario empleadoA = usuario(20L, postventa);
        Usuario empleadoB = usuario(21L, postventa);
        when(usuarioRepository.findByEmpleadoId(20L)).thenReturn(Optional.of(empleadoA));
        when(rolRepository.findAllByNombreIn(any())).thenReturn(List.of(postventa, backoffice));
        when(usuarioRepository.saveAndFlush(empleadoA)).thenReturn(empleadoA);

        service.asignarRoles(20L, AsignarRolesRequest.builder()
                .rolPrincipal("ASESOR_POSTVENTA")
                .rolesSecundarios(List.of("ASESOR_BACKOFFICE"))
                .build());

        assertThat(empleadoA.getRoles()).containsExactlyInAnyOrder(postventa, backoffice);
        assertThat(empleadoB.getRoles()).containsExactly(postventa);
        assertThat(empleadoB.getRolPrincipal()).isSameAs(postventa);
        verify(refreshTokenService).revokeActiveTokens(empleadoA);
        verify(sessionInvalidationService).invalidateAfterCommit(20L);
    }

    @Test
    void operacionSinCambiosNoRevocaSesionNiAudita() {
        Usuario empleado = usuario(20L, postventa);
        when(usuarioRepository.findByEmpleadoId(20L)).thenReturn(Optional.of(empleado));
        when(rolRepository.findAllByNombreIn(any())).thenReturn(List.of(postventa));

        service.asignarRoles(20L, AsignarRolesRequest.builder()
                .rolPrincipal("ASESOR_POSTVENTA")
                .rolesSecundarios(List.of())
                .build());

        verify(usuarioRepository, never()).saveAndFlush(any());
        verify(auditoriaRepository, never()).save(any());
        verify(refreshTokenService, never()).revokeActiveTokens(any());
        verify(sessionInvalidationService, never()).invalidateAfterCommit(any());
    }

    @Test
    void rechazaRolesSecundariosDuplicados() {
        when(usuarioRepository.findByEmpleadoId(20L)).thenReturn(Optional.of(usuario(20L, postventa)));

        assertThatThrownBy(() -> service.asignarRoles(20L, AsignarRolesRequest.builder()
                .rolPrincipal("ASESOR_POSTVENTA")
                .rolesSecundarios(List.of("ASESOR_BACKOFFICE", "ASESOR_BACKOFFICE"))
                .build()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("duplicados");
    }

    @Test
    void permitePromoverUnRolSecundarioAPrincipal() {
        Usuario empleado = usuario(20L, postventa);
        empleado.setRoles(new LinkedHashSet<>(List.of(postventa, backoffice)));
        when(usuarioRepository.findByEmpleadoId(20L)).thenReturn(Optional.of(empleado));
        when(rolRepository.findAllByNombreIn(any())).thenReturn(List.of(backoffice, postventa));
        when(usuarioRepository.saveAndFlush(empleado)).thenReturn(empleado);

        service.asignarRoles(20L, AsignarRolesRequest.builder()
                .rolPrincipal("ASESOR_BACKOFFICE")
                .rolesSecundarios(List.of("ASESOR_POSTVENTA"))
                .build());

        assertThat(empleado.getRolPrincipal()).isSameAs(backoffice);
        assertThat(empleado.getRoles()).containsExactlyInAnyOrder(postventa, backoffice);
        var auditoria = org.mockito.ArgumentCaptor.forClass(UsuarioRolAuditoria.class);
        verify(auditoriaRepository).save(auditoria.capture());
        assertThat(auditoria.getValue().getRolPrincipalAnterior()).isEqualTo("ASESOR_POSTVENTA");
        assertThat(auditoria.getValue().getRolPrincipalNuevo()).isEqualTo("ASESOR_BACKOFFICE");
    }

    @Test
    void rechazaRolesInexistentes() {
        when(usuarioRepository.findByEmpleadoId(20L)).thenReturn(Optional.of(usuario(20L, postventa)));
        when(rolRepository.findAllByNombreIn(any())).thenReturn(List.of(postventa));

        assertThatThrownBy(() -> service.asignarRoles(20L, AsignarRolesRequest.builder()
                .rolPrincipal("ASESOR_POSTVENTA")
                .rolesSecundarios(List.of("ROL_INEXISTENTE"))
                .build()))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("ROL_INEXISTENTE");

        verify(usuarioRepository, never()).saveAndFlush(any());
    }

    @Test
    void rechazaLaAsignacionCuandoLosEquiposSonIncompatibles() {
        Usuario empleado = usuario(20L, postventa);
        when(usuarioRepository.findByEmpleadoId(20L)).thenReturn(Optional.of(empleado));
        when(rolRepository.findAllByNombreIn(any())).thenReturn(List.of(postventa, backoffice));
        doThrow(new BadRequestException("Los equipos actuales no son compatibles con los roles solicitados"))
                .when(equipoService).validarRolesCompatibles(any(), any());

        assertThatThrownBy(() -> service.asignarRoles(20L, AsignarRolesRequest.builder()
                .rolPrincipal("ASESOR_POSTVENTA")
                .rolesSecundarios(List.of("ASESOR_BACKOFFICE"))
                .build()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("equipos");

        verify(usuarioRepository, never()).saveAndFlush(any());
        verify(refreshTokenService, never()).revokeActiveTokens(any());
    }

    @Test
    void impideQuitarElRolAlUltimoAdministradorActivo() {
        Rol administrador = Rol.builder().id(3L).nombre("ADMINISTRADOR").build();
        Rol rrhh = Rol.builder().id(4L).nombre("RRHH").build();
        Usuario ultimoAdmin = usuario(1L, administrador);
        when(usuarioRepository.findByEmpleadoId(1L)).thenReturn(Optional.of(ultimoAdmin));
        when(rolRepository.findAllByNombreIn(any())).thenReturn(List.of(rrhh));
        when(usuarioRepository.findActiveByRoleForUpdate("ADMINISTRADOR")).thenReturn(List.of(ultimoAdmin));

        assertThatThrownBy(() -> service.asignarRoles(1L, AsignarRolesRequest.builder()
                .rolPrincipal("RRHH")
                .rolesSecundarios(List.of())
                .build()))
                .isInstanceOf(UnprocessableEntityException.class)
                .hasMessageContaining("ultimo administrador");

        verify(usuarioRepository, never()).saveAndFlush(any());
    }

    @Test
    void listarUsuariosEnviaBusquedaVaciaTipadaCuandoNoHayCriterio() {
        when(usuarioRepository.buscarAccesos(any(), any(), any(), any(), any(), any()))
                .thenReturn(Page.empty());

        service.listarUsuarios(null, null, null, null, 0, 100);

        verify(usuarioRepository).buscarAccesos(
                eq(""), isNull(), isNull(), isNull(), isNull(), any(Pageable.class));
    }

    private Usuario usuario(Long empleadoId, Rol principal) {
        return Usuario.builder()
                .id(empleadoId)
                .empleadoId(empleadoId)
                .username("u" + empleadoId + "@albru.pe")
                .activo(true)
                .roles(new LinkedHashSet<>(List.of(principal)))
                .rolPrincipal(principal)
                .build();
    }
}
