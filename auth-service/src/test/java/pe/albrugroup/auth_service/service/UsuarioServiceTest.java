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
import pe.albrugroup.auth_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.auth_service.entity.request.RegistrarUsuarioRequest;
import pe.albrugroup.auth_service.repository.RolRepository;
import pe.albrugroup.auth_service.repository.UsuarioRepository;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private RolRepository rolRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private UsuarioService service;

    @Test
    void asesorPostventaNuevoRecibeTambienRolBackoffice() {
        when(usuarioRepository.findByEmpleadoId(15L)).thenReturn(Optional.empty());
        when(usuarioRepository.existsByEmail("postventa@albru.pe")).thenReturn(false);
        when(rolRepository.findByNombre("ASESOR_POSTVENTA"))
                .thenReturn(Optional.of(Rol.builder().id(1L).nombre("ASESOR_POSTVENTA").build()));
        when(rolRepository.findByNombre("ASESOR_BACKOFFICE"))
                .thenReturn(Optional.of(Rol.builder().id(2L).nombre("ASESOR_BACKOFFICE").build()));
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.upsertUsuario(RegistrarUsuarioRequest.builder()
                .empleadoId(15L)
                .nombres("Nayeli")
                .apellidos("Palacios")
                .dni("70000001")
                .email("postventa@albru.pe")
                .puestoTrabajo(PuestoTrabajo.ASESOR_POSTVENTA)
                .build());

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        assertThat(captor.getValue().getRoles())
                .extracting(Rol::getNombre)
                .containsExactlyInAnyOrder("ASESOR_POSTVENTA", "ASESOR_BACKOFFICE");
    }
}
