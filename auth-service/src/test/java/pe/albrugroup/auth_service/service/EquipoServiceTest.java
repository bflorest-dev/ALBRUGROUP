package pe.albrugroup.auth_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.auth_service.entity.Equipo;
import pe.albrugroup.auth_service.entity.Rol;
import pe.albrugroup.auth_service.entity.Usuario;
import pe.albrugroup.auth_service.repository.EquipoRepository;
import pe.albrugroup.auth_service.repository.UsuarioRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipoServiceTest {

    @Mock private EquipoRepository equipoRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private SessionInvalidationService sessionInvalidationService;

    @Test
    void asesorGtrConRolSecundarioDeEquipoUnicoPuedePertenecerADosEquipos() {
        Equipo uno = Equipo.builder().id(1L).nombre("ClaroTeam").activo(true).build();
        Equipo dos = Equipo.builder().id(6L).nombre("ClaroTeam2").activo(true).build();
        Usuario usuario = Usuario.builder()
                .empleadoId(17L)
                .nombreCompleto("GTR de prueba")
                .roles(Set.of(
                        Rol.builder().nombre("ASESOR_GTR").build(),
                        Rol.builder().nombre("SUPERVISOR_VENTAS").build()))
                .equipos(Set.of(uno))
                .build();
        EquipoService service = new EquipoService(
                equipoRepository, usuarioRepository, refreshTokenService, sessionInvalidationService);

        when(usuarioRepository.findByEmpleadoId(17L)).thenReturn(Optional.of(usuario));
        when(equipoRepository.findAllById(Set.of(1L, 6L))).thenReturn(List.of(uno, dos));
        when(usuarioRepository.save(usuario)).thenReturn(usuario);
        when(refreshTokenService.revokeActiveTokens(usuario)).thenReturn(0);

        service.asignarEquipos(17L, Set.of(1L, 6L));

        assertThat(usuario.getEquipos()).extracting(Equipo::getId).containsExactlyInAnyOrder(1L, 6L);
    }

    @Test
    void supervisorGtrConRolSecundarioDeEquipoUnicoPuedePertenecerADosEquipos() {
        Equipo uno = Equipo.builder().id(1L).nombre("ClaroTeam").activo(true).build();
        Equipo dos = Equipo.builder().id(6L).nombre("ClaroTeam2").activo(true).build();
        Usuario usuario = Usuario.builder()
                .empleadoId(18L)
                .nombreCompleto("Supervisor GTR de prueba")
                .roles(Set.of(
                        Rol.builder().nombre("SUPERVISOR_GTR").build(),
                        Rol.builder().nombre("SUPERVISOR_VENTAS").build()))
                .equipos(Set.of(uno))
                .build();
        EquipoService service = new EquipoService(
                equipoRepository, usuarioRepository, refreshTokenService, sessionInvalidationService);

        when(usuarioRepository.findByEmpleadoId(18L)).thenReturn(Optional.of(usuario));
        when(equipoRepository.findAllById(Set.of(1L, 6L))).thenReturn(List.of(uno, dos));
        when(usuarioRepository.save(usuario)).thenReturn(usuario);
        when(refreshTokenService.revokeActiveTokens(usuario)).thenReturn(0);

        service.asignarEquipos(18L, Set.of(1L, 6L));

        assertThat(usuario.getEquipos()).extracting(Equipo::getId).containsExactlyInAnyOrder(1L, 6L);
    }
}
