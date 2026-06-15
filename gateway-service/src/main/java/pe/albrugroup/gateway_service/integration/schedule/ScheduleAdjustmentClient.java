package pe.albrugroup.gateway_service.integration.schedule;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDate;

@Component
public class ScheduleAdjustmentClient {

    private final WebClient scheduleWebClient;
    private final String internalSecret;

    public ScheduleAdjustmentClient(
            @Qualifier("scheduleWebClient") WebClient scheduleWebClient,
            @Value("${internal.shared-secret:}") String internalSecret
    ) {
        this.scheduleWebClient = scheduleWebClient;
        this.internalSecret = internalSecret;
    }

    public Mono<JsonNode> getJornada(String authHeader, Long idEmpleado, LocalDate fecha) {
        return scheduleWebClient.get()
                .uri(builder -> builder
                        .path("/horarios/internal/empleados/{idEmpleado}/jornada-efectiva")
                        .queryParam("fecha", fecha)
                        .build(idEmpleado))
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .header("X-Internal-Secret", internalSecret)
                .retrieve()
                .bodyToMono(JsonNode.class);
    }

    public Mono<JsonNode> preview(String authHeader, Long idEmpleado, JsonNode request) {
        return post(authHeader, idEmpleado, "/ajustes/preview", request);
    }

    public Mono<JsonNode> registrar(String authHeader, Long idEmpleado, JsonNode request) {
        return post(authHeader, idEmpleado, "/ajustes", request);
    }

    private Mono<JsonNode> post(String authHeader, Long idEmpleado, String suffix, JsonNode request) {
        return scheduleWebClient.post()
                .uri("/horarios/internal/empleados/{idEmpleado}" + suffix, idEmpleado)
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .header("X-Internal-Secret", internalSecret)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(JsonNode.class);
    }
}
