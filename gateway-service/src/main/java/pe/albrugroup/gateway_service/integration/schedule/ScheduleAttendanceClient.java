package pe.albrugroup.gateway_service.integration.schedule;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Cliente service-to-service hacia los endpoints internos de asistencia de schedule-service.
 * Autentica con el secreto compartido (header X-Internal-Secret), no con JWT de usuario, porque
 * lo consume el job de reconciliacion (sin sesion de usuario).
 */
@Component
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
}
