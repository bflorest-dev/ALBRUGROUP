package pe.albrugroup.gateway_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import pe.albrugroup.gateway_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.gateway_service.entity.response.AsesorSupervisorResponse;
import pe.albrugroup.gateway_service.entity.response.ConnectedUserResponse;
import pe.albrugroup.gateway_service.integration.auth.AuthMonitoringClient;
import pe.albrugroup.gateway_service.integration.auth.dto.UsuarioRolResponse;
import pe.albrugroup.gateway_service.integration.schedule.ScheduleAdjustmentClient;
import pe.albrugroup.gateway_service.integration.schedule.ScheduleMonitoringClient;
import pe.albrugroup.gateway_service.presence.PresenceService;
import pe.albrugroup.gateway_service.security.AuthenticatedUser;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MonitoringServiceGtrAdjustmentTest {

    @Mock private PresenceService presenceService;
    @Mock private ScheduleMonitoringClient scheduleMonitoringClient;
    @Mock private AuthMonitoringClient authMonitoringClient;
    @Mock private ScheduleAdjustmentClient scheduleAdjustmentClient;

    @Test
    void permiteConsultarJornadaDeSupervisorVentasVisibleParaGtr() {
        MonitoringService service = service();
        String authHeader = "Bearer token";
        LocalDate today = LocalDate.now(java.time.ZoneId.of("America/Lima"));
        JsonNode response = new ObjectMapper().createObjectNode().put("idEmpleado", 1053L);

        mockAdjustableUsers(authHeader, List.of(usuario(1053L, "Supervisor Ventas")));
        when(scheduleAdjustmentClient.getJornada(authHeader, 1053L, today))
                .thenReturn(Mono.just(response));

        assertThat(service.getJornadaAjustableGtr(authHeader, 1053L, today).block())
                .isSameAs(response);

        verify(authMonitoringClient).listarUsuariosActivosPorRol(authHeader, PuestoTrabajo.SUPERVISOR_VENTAS);
        verify(scheduleAdjustmentClient).getJornada(authHeader, 1053L, today);
    }

    @Test
    void rechazaEmpleadoQueNoEstaEnLaListaAjustableDeGtr() {
        MonitoringService service = service();
        String authHeader = "Bearer token";
        LocalDate today = LocalDate.now(java.time.ZoneId.of("America/Lima"));

        mockAdjustableUsers(authHeader, List.of(usuario(1053L, "Supervisor Ventas")));

        assertThatThrownBy(() -> service.getJornadaAjustableGtr(authHeader, 9999L, today).block())
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(error -> assertThat(((ResponseStatusException) error).getStatusCode().value())
                        .isEqualTo(403));

        verify(scheduleAdjustmentClient, never()).getJornada(any(), any(), any());
    }

    @Test
    void monitoreoSupervisorFiltraPorEquipoActivoYExcluyeSupervisor() {
        MonitoringService service = service();
        String authHeader = "Bearer token";
        LocalDate today = LocalDate.now(java.time.ZoneId.of("America/Lima"));
        AuthenticatedUser user = new AuthenticatedUser(
                "supervisor", 900L, "Supervisor", List.of("SUPERVISOR_VENTAS"), List.of(1L));

        when(presenceService.listarUsuariosConectados(PuestoTrabajo.ASESOR_VENTAS))
                .thenReturn(Mono.just(List.of(
                        conectado(100L, "Equipo correcto", 1L),
                        conectado(200L, "Jorge Luis Pichihua Puma", 2L),
                        conectado(300L, "Sin equipo activo", null)
                )));
        when(presenceService.listarUsuariosConectados(PuestoTrabajo.OJT))
                .thenReturn(Mono.just(List.of()));
        when(scheduleMonitoringClient.consultarEstadosMonitor(eq(authHeader), any(), eq(today)))
                .thenReturn(Mono.just(List.of()));

        List<AsesorSupervisorResponse> result = service
                .listarAsesoresConectadosSupervisor(authHeader, user, 1L, today)
                .block();

        assertThat(result).extracting(AsesorSupervisorResponse::getEmpleadoId)
                .containsExactly(100L);
        assertThat(result.getFirst().getEquipoActivoId()).isEqualTo(1L);
        verify(presenceService, never()).listarUsuariosConectados(PuestoTrabajo.SUPERVISOR_VENTAS);
    }

    @Test
    void monitoreoSupervisorRechazaEquipoFueraDelJwtAntesDeConsultarPresencia() {
        MonitoringService service = service();
        AuthenticatedUser user = new AuthenticatedUser(
                "supervisor", 900L, "Supervisor", List.of("SUPERVISOR_VENTAS"), List.of(1L));

        assertThatThrownBy(() -> service
                .listarAsesoresConectadosSupervisor("Bearer token", user, 2L, LocalDate.now()).block())
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(error -> assertThat(((ResponseStatusException) error).getStatusCode().value())
                        .isEqualTo(403));

        verifyNoInteractions(presenceService);
    }

    private MonitoringService service() {
        return new MonitoringService(
                presenceService,
                scheduleMonitoringClient,
                authMonitoringClient,
                scheduleAdjustmentClient
        );
    }

    private void mockAdjustableUsers(String authHeader, List<UsuarioRolResponse> supervisors) {
        when(authMonitoringClient.listarUsuariosActivosPorRol(authHeader, PuestoTrabajo.ASESOR_VENTAS))
                .thenReturn(Mono.just(List.of()));
        when(authMonitoringClient.listarUsuariosActivosPorRol(authHeader, PuestoTrabajo.OJT))
                .thenReturn(Mono.just(List.of()));
        when(authMonitoringClient.listarUsuariosActivosPorRol(authHeader, PuestoTrabajo.SUPERVISOR_VENTAS))
                .thenReturn(Mono.just(supervisors));
    }

    private UsuarioRolResponse usuario(Long empleadoId, String nombreCompleto) {
        UsuarioRolResponse response = new UsuarioRolResponse();
        response.setEmpleadoId(empleadoId);
        response.setNombreCompleto(nombreCompleto);
        response.setRoles(List.of("SUPERVISOR_VENTAS"));
        return response;
    }

    private ConnectedUserResponse conectado(Long empleadoId, String nombreCompleto, Long equipoActivoId) {
        return ConnectedUserResponse.builder()
                .empleadoId(empleadoId)
                .nombreCompleto(nombreCompleto)
                .roles(List.of("ASESOR_VENTAS"))
                .equipoActivoId(equipoActivoId)
                .build();
    }
}
