package pe.albrugroup.gateway_service.integration.schedule;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Cliente service-to-service hacia los endpoints internos de asistencia de schedule-service.
 * Autentica con el secreto compartido (header X-Internal-Secret), no con JWT de usuario, porque
 * lo consume el job de reconciliacion (sin sesion de usuario).
 */
@Component
@Slf4j
public class ScheduleAttendanceClient {

    private static final String SECRET_HEADER = "X-Internal-Secret";

    private final WebClient scheduleWebClient;
    private final String internalSecret;

    public ScheduleAttendanceClient(
            @Qualifier("scheduleWebClient") WebClient scheduleWebClient,
            @Value("${internal.shared-secret:}") String internalSecret
    ) {
        this.scheduleWebClient = scheduleWebClient;
        this.internalSecret = internalSecret;
    }

    public Mono<List<Long>> jornadasAbiertasVencidas() {
        return scheduleWebClient.get()
                .uri("/asistencia/internal/jornadas-abiertas-vencidas")
                .header(SECRET_HEADER, internalSecret)
                .retrieve()
                .bodyToFlux(Long.class)
                .collectList();
    }

    public Mono<Void> autoCerrarJornada(Long empleadoId) {
        return scheduleWebClient.post()
                .uri("/asistencia/internal/auto-cierre/{empleadoId}", empleadoId)
                .header(SECRET_HEADER, internalSecret)
                .retrieve()
                .bodyToMono(Void.class);
    }

    public Mono<Void> registrarPresenciaEvento(Long empleadoId, String tipo, Instant timestamp, String origen) {
        return scheduleWebClient.post()
                .uri("/asistencia/internal/presencia-evento")
                .header(SECRET_HEADER, internalSecret)
                .bodyValue(Map.of(
                        "empleadoId", empleadoId,
                        "tipo", tipo,
                        "timestamp", timestamp.toString(),
                        "origen", origen
                ))
                .retrieve()
                .bodyToMono(Void.class)
                .onErrorResume(ex -> {
                    log.warn("Error registrando presencia evento para empleado {}: {}", empleadoId, ex.getMessage());
                    return Mono.empty();
                });
    }
}
