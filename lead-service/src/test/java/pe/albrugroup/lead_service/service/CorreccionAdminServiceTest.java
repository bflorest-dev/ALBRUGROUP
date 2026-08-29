package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.LeadCorreccionRequest;
import pe.albrugroup.lead_service.entity.response.LeadDetalleResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CorreccionAdminServiceTest {

    @Mock private LeadRepository leadRepository;
    @Mock private EventoRepository eventoRepository;
    @Mock private LeadService leadService;
    @Mock private EventoService eventoService;
    @Mock private CurrentUser currentUser;

    @InjectMocks private CorreccionAdminService correccionAdminService;

    @Test
    void aplicarSinCambiosNiEventosFalla() {
        LeadCorreccionRequest request = new LeadCorreccionRequest();

        assertThatThrownBy(() -> correccionAdminService.aplicarCorreccion(10L, request))
                .isInstanceOf(BadRequestException.class);

        verify(leadService, never()).aplicarCambiosCorreccion(anyLong(), any(), any(), any());
        verify(eventoRepository, never()).save(any());
    }

    @Test
    void noSePuedeEliminarUnEventoCorreccion() {
        LeadCorreccionRequest request = new LeadCorreccionRequest();
        request.setIdsEventosAEliminar(List.of(5L));
        when(leadService.aplicarCambiosCorreccion(anyLong(), any(), any(), any()))
                .thenReturn(Lead.builder().id(10L).etapa(Etapa.VENTA).build());
        when(eventoRepository.findByIdInAndIdLead(List.of(5L), 10L))
                .thenReturn(List.of(Evento.builder().id(5L).idLead(10L).accion(Accion.CORRECCION).build()));

        assertThatThrownBy(() -> correccionAdminService.aplicarCorreccion(10L, request))
                .isInstanceOf(BadRequestException.class);

        verify(eventoRepository, never()).deleteAll(any());
        verify(eventoRepository, never()).save(any());
    }

    @Test
    void rechazaEventosQueNoPertenecenAlLead() {
        LeadCorreccionRequest request = new LeadCorreccionRequest();
        request.setIdsEventosAEliminar(List.of(5L, 6L));
        when(leadService.aplicarCambiosCorreccion(anyLong(), any(), any(), any()))
                .thenReturn(Lead.builder().id(10L).etapa(Etapa.VENTA).build());
        // Solo uno de los dos ids pertenece al lead -> tamanos distintos -> se rechaza.
        when(eventoRepository.findByIdInAndIdLead(List.of(5L, 6L), 10L))
                .thenReturn(List.of(Evento.builder().id(5L).idLead(10L).accion(Accion.REGISTRO).build()));

        assertThatThrownBy(() -> correccionAdminService.aplicarCorreccion(10L, request))
                .isInstanceOf(BadRequestException.class);

        verify(eventoRepository, never()).deleteAll(any());
        verify(eventoRepository, never()).save(any());
    }

    @Test
    void aplicaCambiosEliminaEventosYDejaUnicoEventoCorreccion() {
        LeadCorreccionRequest request = new LeadCorreccionRequest();
        request.setIdsEventosAEliminar(List.of(5L));
        request.setResumenCambios("Documento corregido");
        Evento registro = Evento.builder().id(5L).idLead(10L).accion(Accion.REGISTRO).build();

        when(leadService.aplicarCambiosCorreccion(anyLong(), any(), any(), any()))
                .thenReturn(Lead.builder().id(10L).etapa(Etapa.VENTA).build());
        when(eventoRepository.findByIdInAndIdLead(List.of(5L), 10L)).thenReturn(List.of(registro));
        when(currentUser.empleadoID()).thenReturn(1L);
        when(currentUser.nombreCompleto()).thenReturn("Admin Uno");
        when(currentUser.rolPrincipal()).thenReturn("ADMINISTRADOR");
        LeadDetalleResponse detalle = LeadDetalleResponse.builder().id(10L).build();
        when(leadService.obtenerDetalleParaCorreccion(10L)).thenReturn(detalle);

        LeadDetalleResponse resultado = correccionAdminService.aplicarCorreccion(10L, request);

        verify(eventoRepository).deleteAll(List.of(registro));
        ArgumentCaptor<Evento> captor = ArgumentCaptor.forClass(Evento.class);
        verify(eventoRepository).save(captor.capture());
        Evento correccion = captor.getValue();
        assertThat(correccion.getAccion()).isEqualTo(Accion.CORRECCION);
        assertThat(correccion.getIdLead()).isEqualTo(10L);
        assertThat(correccion.getEtapa()).isEqualTo(Etapa.VENTA);
        assertThat(correccion.getComentario()).contains("Documento corregido");
        assertThat(resultado).isSameAs(detalle);
    }
}
