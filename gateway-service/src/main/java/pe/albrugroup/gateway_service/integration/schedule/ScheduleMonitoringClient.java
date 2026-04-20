package pe.albrugroup.gateway_service.integration.schedule;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import pe.albrugroup.gateway_service.integration.schedule.dto.ConsultaMonitoreoRequest;
import pe.albrugroup.gateway_service.integration.schedule.dto.EstadoMonitorResponse;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class ScheduleMonitoringClient {

    private final WebClient scheduleWebClient;

    public ScheduleMonitoringClient(@Qualifier("scheduleWebClient") WebClient scheduleWebClient) {
        this.scheduleWebClient = scheduleWebClient;
    }

    public Mono<List<EstadoMonitorResponse>> consultarEstadosMonitor(String authHeader, List<Long> empleadoIds, java.time.LocalDate fecha) {
        return scheduleWebClient.post()
                .uri("/revision/asistencia/monitor/estados")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .bodyValue(ConsultaMonitoreoRequest.builder()
                        .empleadoIds(empleadoIds)
                        .fecha(fecha)
                        .build())
                .retrieve()
                .bodyToFlux(EstadoMonitorResponse.class)
                .collectList();
    }
}
