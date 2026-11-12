package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.enums.AmbitoProveedor;
import pe.albrugroup.lead_service.entity.request.LeadEquipoAsignacionMasivaRequest;
import pe.albrugroup.lead_service.entity.response.EquipoOperativoResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.repository.EquipoProveedorRepository;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeadServiceEquipoAsignacionMasivaTest {

    @Mock private LeadRepository leadRepository;
    @Mock private EquipoProveedorRepository equipoProveedorRepository;
    @Mock private EventoRepository eventoRepository;
    @Mock private EventoService eventoService;
    @Mock private CurrentUser currentUser;
    @Mock private LeadRealtimeNotifier leadRealtimeNotifier;
    @Mock private ProveedorScopeService proveedorScopeService;
    @Mock private TransactionTemplate transactionTemplate;
    @Mock private PlatformTransactionManager transactionManager;
    @Mock private TransactionStatus transactionStatus;
    @Mock private AuthEquipoClient authEquipoClient;

    @InjectMocks private LeadService leadService;

    @BeforeEach
    void configurarTransaccionesIndependientes() {
        when(transactionTemplate.getTransactionManager()).thenReturn(transactionManager);
        when(transactionManager.getTransaction(any())).thenReturn(transactionStatus);
    }

    @Test
    void asignaCadaLeadDeFormaIndependienteYReportaConflictosParciales() {
        Proveedor claro = Proveedor.builder().id(1L).nombre("CLARO").build();
        Lead leadSinEquipo = Lead.builder().id(101L).proveedorOrigen(claro).build();
        Lead leadYaAsignado = Lead.builder().id(102L).proveedorOrigen(claro).idEquipo(20L).build();
        LeadEquipoAsignacionMasivaRequest request = request(List.of(101L, 102L), 10L);

        when(authEquipoClient.listarEquiposCatalogo())
                .thenReturn(List.of(new EquipoOperativoResponse(10L, "ClaroTeam", null, true)));
        when(proveedorScopeService.ambitoActual()).thenReturn(AmbitoProveedor.PREVENTA);
        when(proveedorScopeService.resolverScope(AmbitoProveedor.PREVENTA))
                .thenReturn(new ProveedorScopeService.Scope(true, Set.of(1L), Set.of("CLARO")));
        when(equipoProveedorRepository.existsByIdEquipoAndProveedorId(10L, 1L)).thenReturn(true);
        when(leadRepository.findById(101L)).thenReturn(Optional.of(leadSinEquipo));
        when(leadRepository.findById(102L)).thenReturn(Optional.of(leadYaAsignado));
        when(leadRepository.save(leadSinEquipo)).thenReturn(leadSinEquipo);

        var response = leadService.asignarEquiposLeadsSupervisor(request);

        assertThat(response.getTotalSolicitados()).isEqualTo(2);
        assertThat(response.getTotalProcesados()).isEqualTo(2);
        assertThat(response.getTotalAsignados()).isEqualTo(1);
        assertThat(response.getTotalFallidos()).isEqualTo(1);
        assertThat(response.getResultados()).extracting("idLead").containsExactly(101L, 102L);
        assertThat(response.getResultados().get(0).isAsignado()).isTrue();
        assertThat(response.getResultados().get(1).isAsignado()).isFalse();
        assertThat(leadSinEquipo.getIdEquipo()).isEqualTo(10L);
    }

    @Test
    void rechazaListaConIdsDuplicadosAntesDeProcesar() {
        assertThatThrownBy(() -> leadService.asignarEquiposLeadsSupervisor(request(List.of(101L, 101L), 10L)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("duplicados");
    }

    @Test
    void rechazaEquipoInactivo() {
        when(authEquipoClient.listarEquiposCatalogo())
                .thenReturn(List.of(new EquipoOperativoResponse(10L, "ClaroTeam", null, false)));

        assertThatThrownBy(() -> leadService.asignarEquiposLeadsSupervisor(request(List.of(101L), 10L)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("activo");
    }

    private LeadEquipoAsignacionMasivaRequest request(List<Long> idsLead, Long idEquipo) {
        LeadEquipoAsignacionMasivaRequest request = new LeadEquipoAsignacionMasivaRequest();
        request.setIdsLead(idsLead);
        request.setIdEquipo(idEquipo);
        return request;
    }
}
