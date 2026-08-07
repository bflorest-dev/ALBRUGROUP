package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.entity.Campana;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.LeadCampanaCorreccionRequest;
import pe.albrugroup.lead_service.entity.response.LeadCampanaCorreccionResponse;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.EquipoProveedorRepository;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeadCampanaCorreccionServiceTest {

    @Mock private LeadRepository leadRepository;
    @Mock private CampanaRepository campanaRepository;
    @Mock private EquipoProveedorRepository equipoProveedorRepository;
    @Mock private EventoRepository eventoRepository;
    @Mock private LeadRealtimeNotifier leadRealtimeNotifier;

    @Test
    void buscarPorLeadAceptaUsermetaConArroba() {
        LeadCampanaCorreccionService service = new LeadCampanaCorreccionService(
                leadRepository,
                campanaRepository,
                equipoProveedorRepository,
                eventoRepository,
                leadRealtimeNotifier
        );
        Lead lead = Lead.builder()
                .id(29132L)
                .usermeta("EfrainBay")
                .idEquipo(2L)
                .etapa(Etapa.PREVENTA)
                .estado(EstadoSeguimiento.GESTIONADO)
                .build();

        when(leadRepository.buscarCorreccionCampanaPorLeadOUsermeta("EfrainBay")).thenReturn(List.of(lead));

        var response = service.buscarPorLead("@EfrainBay");

        verify(leadRepository).buscarCorreccionCampanaPorLeadOUsermeta("EfrainBay");
        assertThat(response).hasSize(1);
        assertThat(response.get(0).getUsermeta()).isEqualTo("EfrainBay");
    }

    @Test
    void corregirCampanaSinCampanaConservaEquipoDelLead() {
        LeadCampanaCorreccionService service = new LeadCampanaCorreccionService(
                leadRepository,
                campanaRepository,
                equipoProveedorRepository,
                eventoRepository,
                leadRealtimeNotifier
        );
        Campana campanaAnterior = Campana.builder()
                .id(10L)
                .nombre("Campana anterior")
                .build();
        Lead lead = Lead.builder()
                .id(29132L)
                .lead("907574596")
                .idEquipo(2L)
                .campana(campanaAnterior)
                .etapa(Etapa.PREVENTA)
                .estado(EstadoSeguimiento.GESTIONADO)
                .build();
        LeadCampanaCorreccionRequest request = new LeadCampanaCorreccionRequest();

        when(leadRepository.buscarParaCorreccionCampana(29132L)).thenReturn(Optional.of(lead));
        when(leadRepository.save(any(Lead.class))).thenAnswer(invocation -> invocation.getArgument(0));
        Evento ultimoRegistro = Evento.builder()
                .id(9001L)
                .idLead(29132L)
                .accion(Accion.REGISTRO)
                .createdAt(Instant.parse("2026-08-07T15:00:00Z"))
                .build();
        when(eventoRepository.findTopByIdLeadAndAccionOrderByCreatedAtDescIdDesc(29132L, Accion.REGISTRO))
                .thenReturn(Optional.of(ultimoRegistro));
        when(eventoRepository.actualizarCampanaPorLeadDesdeEvento(
                29132L,
                null,
                Instant.parse("2026-08-07T15:00:00Z"),
                9001L
        )).thenReturn(5);

        LeadCampanaCorreccionResponse response = service.corregirCampana(29132L, request);

        ArgumentCaptor<Lead> leadCaptor = ArgumentCaptor.forClass(Lead.class);
        verify(leadRepository).save(leadCaptor.capture());
        Lead savedLead = leadCaptor.getValue();
        assertThat(savedLead.getCampana()).isNull();
        assertThat(savedLead.getIdEquipo()).isEqualTo(2L);
        assertThat(response.getIdEquipoAnterior()).isEqualTo(2L);
        assertThat(response.getIdEquipoNuevo()).isEqualTo(2L);
        assertThat(response.getIdCampanaNueva()).isNull();
        assertThat(response.getEventosActualizados()).isEqualTo(5);
        verify(eventoRepository).actualizarCampanaPorLeadDesdeEvento(
                29132L,
                null,
                Instant.parse("2026-08-07T15:00:00Z"),
                9001L
        );
    }
}
