package pe.albrugroup.recruitment_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.recruitment_service.entity.Postulante;
import pe.albrugroup.recruitment_service.entity.enums.Documento;
import pe.albrugroup.recruitment_service.entity.request.ActualizarDatosPostulanteRequest;
import pe.albrugroup.recruitment_service.exception.ConflictException;
import pe.albrugroup.recruitment_service.repository.PostulanteRepository;
import pe.albrugroup.recruitment_service.service.mapper.PostulacionMapper;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PostulanteServiceTest {

    @Mock
    private PostulanteRepository postulanteRepository;

    @Mock
    private PostulacionMapper postulacionMapper;

    @InjectMocks
    private PostulanteService service;

    @Test
    void normalizaUsuarioMetaAlCrearAltaRapida() {
        when(postulanteRepository.findByUsuarioMetaIgnoreCase("Pepito42")).thenReturn(Optional.empty());
        when(postulanteRepository.save(any(Postulante.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Postulante postulante = service.crearDesdeUsuarioMeta("  @@Pepito42  ");

        assertEquals("Pepito42", postulante.getUsuarioMeta());
    }

    @Test
    void rechazaUsuarioMetaDuplicadoSinCrearPostulante() {
        when(postulanteRepository.findByUsuarioMetaIgnoreCase("PEPITO42"))
                .thenReturn(Optional.of(Postulante.builder().id(10L).build()));

        assertThrows(ConflictException.class, () -> service.crearDesdeUsuarioMeta("@PEPITO42"));
    }

    @Test
    void completaDatosYPermiteLimpiarCamposOpcionales() {
        Postulante postulante = Postulante.builder().id(7L).usuarioMeta("viejo").build();
        when(postulanteRepository.existsByUsuarioMetaIgnoreCaseAndIdNot("nuevo", 7L)).thenReturn(false);
        when(postulanteRepository.findByTipoDocumentoAndDocumento(Documento.DNI, "12345678"))
                .thenReturn(Optional.empty());
        when(postulanteRepository.save(postulante)).thenReturn(postulante);

        Postulante actualizado = service.actualizarDatos(postulante, ActualizarDatosPostulanteRequest.builder()
                .nombres("Ana")
                .apellidos("Prueba")
                .tipoDocumento(Documento.DNI)
                .documento(" 12345678 ")
                .usuarioMeta("@nuevo")
                .build());

        assertEquals("Ana", actualizado.getNombres());
        assertEquals("12345678", actualizado.getDocumento());
        assertEquals("nuevo", actualizado.getUsuarioMeta());
        assertEquals(null, actualizado.getCelular());
    }
}
