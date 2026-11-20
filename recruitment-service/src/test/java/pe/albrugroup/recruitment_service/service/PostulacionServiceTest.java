package pe.albrugroup.recruitment_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.recruitment_service.entity.enums.Accion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoBandejaPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;
import pe.albrugroup.recruitment_service.entity.response.ResumenReclutadorResponse;
import pe.albrugroup.recruitment_service.exception.BadRequestException;
import pe.albrugroup.recruitment_service.repository.ActividadReclutamientoRepository;
import pe.albrugroup.recruitment_service.repository.EventoRepository;
import pe.albrugroup.recruitment_service.repository.PostulacionRepository;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PostulacionServiceTest {

    @Mock
    private PostulacionRepository postulacionRepository;

    @Mock
    private EventoRepository eventoRepository;

    @Mock
    private ActividadReclutamientoRepository actividadReclutamientoRepository;

    @InjectMocks
    private PostulacionService service;

    @Test
    void obtieneResumenOperativoAisladoPorNegocio() {
        when(postulacionRepository.countCreatedBetween(any(Instant.class), any(Instant.class), eq(Negocio.WIN)))
                .thenReturn(4L);
        when(postulacionRepository.countByEstadoBandeja(EstadoBandejaPostulacion.POSTULANTE, Negocio.WIN))
                .thenReturn(7L);
        when(eventoRepository.countDistinctPostulacionesByTipificacionBetween(
                eq(Accion.TIPIFICACION), eq("SIN_CONTACTO"), any(Instant.class), any(Instant.class), eq(Negocio.WIN)
        )).thenReturn(2L);
        when(actividadReclutamientoRepository.countPendingMeetParticipantsByNegocio(Negocio.WIN)).thenReturn(3L);
        when(eventoRepository.countDistinctPostulacionesByAccionBetween(
                eq(Accion.APROBACION_RECLUTAMIENTO), any(Instant.class), any(Instant.class), eq(Negocio.WIN)
        )).thenReturn(1L);
        when(eventoRepository.countDistinctPostulacionesByAccionBetween(
                eq(Accion.RECHAZO_RECLUTAMIENTO), any(Instant.class), any(Instant.class), eq(Negocio.WIN)
        )).thenReturn(2L);

        ResumenReclutadorResponse response = service.obtenerResumenReclutador(Negocio.WIN);

        assertEquals(Negocio.WIN, response.getNegocio());
        assertEquals(4L, response.getNuevosHoy());
        assertEquals(7L, response.getPorContactar());
        assertEquals(2L, response.getSinContactoHoy());
        assertEquals(3L, response.getMeetsProgramadas());
        assertEquals(1L, response.getAprobadosHoy());
        assertEquals(2L, response.getDesaprobadosHoy());
        verify(postulacionRepository).countCreatedBetween(any(Instant.class), any(Instant.class), eq(Negocio.WIN));
    }

    @Test
    void exigeNegocioParaConsultarResumenOperativo() {
        assertThrows(BadRequestException.class, () -> service.obtenerResumenReclutador(null));
    }
}
