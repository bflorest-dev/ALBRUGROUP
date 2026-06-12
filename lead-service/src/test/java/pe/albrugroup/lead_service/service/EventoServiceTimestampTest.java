package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.RegistrarEventoRequest;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.service.mapper.EventoMapper;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventoServiceTimestampTest {

    @Mock private EventoRepository eventoRepository;
    @Mock private LeadRepository leadRepository;
    @Mock private CurrentUser currentUser;
    @Mock private EventoMapper eventoMapper;
    @Mock private PaginationService paginationService;

    @InjectMocks private EventoService eventoService;

    @Test
    void conservaElTimestampExplicitoDelRegistroRetroactivo() {
        Instant attributedAt = Instant.parse("2026-01-01T00:00:00Z");
        RegistrarEventoRequest request = RegistrarEventoRequest.builder()
                .idLead(25202L)
                .idCampana(7L)
                .accion(Accion.REGISTRO)
                .etapa(Etapa.PREVENTA)
                .build();
        when(leadRepository.existsById(25202L)).thenReturn(true);
        when(currentUser.empleadoID()).thenReturn(41L);
        when(currentUser.nombreCompleto()).thenReturn("GTR Prueba");
        when(currentUser.rolPrincipal()).thenReturn("GTR");
        when(eventoRepository.save(any(Evento.class))).thenAnswer(invocation -> invocation.getArgument(0));

        eventoService.registrarEvento(request, attributedAt);

        ArgumentCaptor<Evento> captor = ArgumentCaptor.forClass(Evento.class);
        verify(eventoRepository).save(captor.capture());
        assertThat(captor.getValue().getCreatedAt()).isEqualTo(attributedAt);
    }
}
