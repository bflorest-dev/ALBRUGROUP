package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.request.LeadAperturaVentaRequest;
import pe.albrugroup.lead_service.entity.response.LeadAperturaVentaResponse;
import pe.albrugroup.lead_service.exception.ConflictException;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.service.LeadEtapaResumenService;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeadServiceAperturaVentaTest {

    @Mock private LeadRepository leadRepository;
    @Mock private EventoRepository eventoRepository;
    @Mock private EventoService eventoService;
    @Mock private CurrentUser currentUser;
    @Mock private ProveedorScopeService proveedorScopeService;
    @Mock private LeadEtapaResumenService leadEtapaResumenService;
    @Mock private LeadRealtimeNotifier leadRealtimeNotifier;
    @Spy @InjectMocks private LeadService leadService;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "backoffice",
                "test",
                List.of(new SimpleGrantedAuthority("ASSIGN_LEADS"))
        ));
        lenient().doAnswer(invocation -> new LeadAperturaVentaResponse(invocation.getArgument(0), null))
                .when(leadService).respuestaApertura(anyString(), any(Lead.class));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void etapaDistintaDeVentaSiempreAbreConsultaSinAsignar() {
        stubUsuarioGestionGlobal(false, false);
        Lead lead = lead(Etapa.PREVENTA, 7L, "Asesor Preventa");
        when(leadRepository.buscarPorIdConBloqueo(10L)).thenReturn(Optional.of(lead));
        LeadAperturaVentaRequest request = new LeadAperturaVentaRequest();
        request.setConfirmarReasignacion(true);
        request.setIdAsesorConfirmado(7L);

        LeadAperturaVentaResponse response = leadService.abrirLeadVenta(10L, request);

        assertThat(response.getModo()).isEqualTo("CONSULTA");
        assertThat(lead.getIdAsesorAsignado()).isEqualTo(7L);
        verify(leadRepository, never()).save(any());
        verify(eventoService, never()).registrarEvento(any());
    }

    @Test
    void leadVentaLibreSeAsignaYRegistraUnEvento() {
        stubUsuarioGestionGlobal(true, true);
        Lead lead = lead(Etapa.VENTA, null, null);
        when(leadRepository.buscarPorIdConBloqueo(10L)).thenReturn(Optional.of(lead));
        when(leadRepository.save(lead)).thenReturn(lead);

        LeadAperturaVentaResponse response = leadService.abrirLeadVenta(10L, new LeadAperturaVentaRequest());

        assertThat(response.getModo()).isEqualTo("GESTION");
        assertThat(lead.getIdAsesorAsignado()).isEqualTo(22L);
        assertThat(lead.getNombreAsesorAsignado()).isEqualTo("Backoffice Actual");
        assertThat(lead.getEstado()).isEqualTo(EstadoSeguimiento.EN_GESTION);
        verify(eventoService).registrarEvento(argThat(request -> request.getAccion() == Accion.ASIGNACION));
        verify(leadEtapaResumenService).registrarAsignacion(any(), any(), any());
    }

    @Test
    void responsableActualAbreGestionSinDuplicarAsignacion() {
        stubUsuarioGestionGlobal(true, false);
        Lead lead = lead(Etapa.VENTA, 22L, "Backoffice Actual");
        when(leadRepository.buscarPorIdConBloqueo(10L)).thenReturn(Optional.of(lead));

        LeadAperturaVentaResponse response = leadService.abrirLeadVenta(10L, new LeadAperturaVentaRequest());

        assertThat(response.getModo()).isEqualTo("GESTION");
        verify(leadRepository, never()).save(any());
        verify(eventoService, never()).registrarEvento(any());
    }

    @Test
    void responsableAjenoProduceConflictoSinMutar() {
        stubUsuarioGestionGlobal(true, false);
        Lead lead = lead(Etapa.VENTA, 7L, "Asesora Uno");
        when(leadRepository.buscarPorIdConBloqueo(10L)).thenReturn(Optional.of(lead));

        assertThatThrownBy(() -> leadService.abrirLeadVenta(10L, new LeadAperturaVentaRequest()))
                .isInstanceOf(ConflictException.class)
                .satisfies(error -> {
                    ConflictException conflict = (ConflictException) error;
                    assertThat(conflictDetails(conflict))
                            .containsEntry("idAsesorActual", 7L)
                            .containsEntry("nombreAsesorActual", "Asesora Uno");
                });
        verify(leadRepository, never()).save(any());
        verify(eventoService, never()).registrarEvento(any());
    }

    @Test
    void confirmarReasignacionSoloTomaAlResponsableQueSeConfirmo() {
        stubUsuarioGestionGlobal(true, true);
        Lead lead = lead(Etapa.VENTA, 7L, "Asesora Uno");
        when(leadRepository.buscarPorIdConBloqueo(10L)).thenReturn(Optional.of(lead));
        when(leadRepository.save(lead)).thenReturn(lead);
        LeadAperturaVentaRequest request = new LeadAperturaVentaRequest();
        request.setConfirmarReasignacion(true);
        request.setIdAsesorConfirmado(7L);

        LeadAperturaVentaResponse response = leadService.abrirLeadVenta(10L, request);

        assertThat(response.getModo()).isEqualTo("GESTION");
        assertThat(lead.getIdAsesorAsignado()).isEqualTo(22L);
        verify(eventoService).registrarEvento(argThat(event -> event.getAccion() == Accion.ASIGNACION));
    }

    @Test
    void cambioDeResponsableMientrasElDialogoEstaAbiertoDevuelveElNuevoConflicto() {
        stubUsuarioGestionGlobal(true, false);
        Lead lead = lead(Etapa.VENTA, 9L, "Asesora Dos");
        when(leadRepository.buscarPorIdConBloqueo(10L)).thenReturn(Optional.of(lead));
        LeadAperturaVentaRequest request = new LeadAperturaVentaRequest();
        request.setConfirmarReasignacion(true);
        request.setIdAsesorConfirmado(7L);

        assertThatThrownBy(() -> leadService.abrirLeadVenta(10L, request))
                .isInstanceOf(ConflictException.class)
                .satisfies(error -> assertThat(conflictDetails((ConflictException) error))
                        .containsEntry("idAsesorActual", 9L)
                        .containsEntry("nombreAsesorActual", "Asesora Dos"));
        verify(leadRepository, never()).save(any());
    }

    @Test
    void modoConsultaExplicitoNoTocaLaAsignacion() {
        stubUsuarioGestionGlobal(false, false);
        Lead lead = lead(Etapa.VENTA, 7L, "Asesora Uno");
        when(leadRepository.buscarPorIdConBloqueo(10L)).thenReturn(Optional.of(lead));
        LeadAperturaVentaRequest request = new LeadAperturaVentaRequest();
        request.setModoConsulta(true);

        LeadAperturaVentaResponse response = leadService.abrirLeadVenta(10L, request);

        assertThat(response.getModo()).isEqualTo("CONSULTA");
        assertThat(lead.getIdAsesorAsignado()).isEqualTo(7L);
        verify(leadRepository, never()).save(any());
        verify(eventoService, never()).registrarEvento(any());
    }

    @Test
    void liberarAsignacionDeOtroResponsableEsIdempotente() {
        when(currentUser.empleadoID()).thenReturn(22L);
        Lead lead = lead(Etapa.VENTA, 7L, "Asesora Uno");
        when(leadRepository.buscarPorIdConBloqueo(10L)).thenReturn(Optional.of(lead));

        leadService.liberarAsignacionVenta(10L);

        assertThat(lead.getIdAsesorAsignado()).isEqualTo(7L);
        verify(leadRepository, never()).save(any());
    }

    private static Lead lead(Etapa etapa, Long idAsesor, String nombreAsesor) {
        return Lead.builder()
                .id(10L)
                .etapa(etapa)
                .estado(EstadoSeguimiento.EN_GESTION)
                .idAsesorAsignado(idAsesor)
                .nombreAsesorAsignado(nombreAsesor)
                .build();
    }

    private void stubUsuarioGestionGlobal(boolean requiereIdEmpleado, boolean requiereNombre) {
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(true);
        if (requiereIdEmpleado) {
            when(currentUser.empleadoID()).thenReturn(22L);
        }
        if (requiereNombre) {
            when(currentUser.nombreCompleto()).thenReturn("Backoffice Actual");
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> conflictDetails(ConflictException conflict) {
        return (Map<String, Object>) conflict.getDetails();
    }
}
