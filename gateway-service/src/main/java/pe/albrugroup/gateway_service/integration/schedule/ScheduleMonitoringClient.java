package pe.albrugroup.gateway_service.integration.schedule;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import pe.albrugroup.gateway_service.integration.DownstreamErrorMapper;
import pe.albrugroup.gateway_service.integration.schedule.dto.ConsultaMonitoreoRequest;
import pe.albrugroup.gateway_service.integration.schedule.dto.EstadoMonitorResponse;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class ScheduleMonitoringClient {

    private final WebClient scheduleWebClient;
    private final DownstreamErrorMapper downstreamErrorMapper;

    public ScheduleMonitoringClient(
            @Qualifier("scheduleWebClient") WebClient scheduleWebClient,
            DownstreamErrorMapper downstreamErrorMapper
    ) {
        this.scheduleWebClient = scheduleWebClient;
        this.downstreamErrorMapper = downstreamErrorMapper;
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
                .onStatus(
                        status -> status.isError(),
                        response -> response.bodyToMono(String.class)
                                .defaultIfEmpty("")
                                .flatMap(body -> downstreamErrorMapper.toException(
                                        response.statusCode(),
                                        body,
                                        "Ocurrio un error al consultar estados de monitoreo"
                                ))
                )
                .bodyToFlux(EstadoMonitorResponse.class)
                .collectList();
    }
}
