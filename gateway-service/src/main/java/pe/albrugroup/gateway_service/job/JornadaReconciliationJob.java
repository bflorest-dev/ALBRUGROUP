package pe.albrugroup.gateway_service.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pe.albrugroup.gateway_service.integration.schedule.ScheduleAttendanceClient;
import pe.albrugroup.gateway_service.presence.PresenceService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Safety net de asistencia: cada cierto intervalo busca jornadas de hoy que ya pasaron su hora de
 * salida y siguen abiertas (el empleado no marco OFFLINE). Para cada una verifica si el empleado
 * sigue conectado en Redis; si no lo esta (cerro el navegador, se desconecto), pide a schedule-service
 * que cierre la jornada estampando la salida programada.
 *
 * Tolera el refresh: al recargar, la presencia reaparece en segundos, asi que el chequeo de
 * conectividad (con el retraso del intervalo) no cierra a quien solo recargo o sigue trabajando.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JornadaReconciliationJob {

    private final ScheduleAttendanceClient scheduleAttendanceClient;
    private final PresenceService presenceService;

    @Scheduled(
            fixedDelayString = "${attendance.reconciliation.interval-ms:1800000}",
            initialDelayString = "${attendance.reconciliation.initial-delay-ms:120000}"
    )
    public void reconciliarJornadas() {
        scheduleAttendanceClient.jornadasAbiertasVencidas()
                .flatMapMany(Flux::fromIterable)
                .flatMap(this::cerrarSiDesconectado)
                .onErrorContinue((error, item) ->
                        log.warn("Error en reconciliacion de jornada para {}", item, error))
                .subscribe(
                        null,
                        error -> log.warn("Fallo la reconciliacion de jornadas", error)
                );
    }

    private Mono<Void> cerrarSiDesconectado(Long empleadoId) {
        return presenceService.estaConectado(empleadoId)
                .flatMap(status -> {
                    if (status.isConectado()) {
                        return Mono.empty();
                    }
                    return scheduleAttendanceClient.autoCerrarJornada(empleadoId)
                            .doOnSuccess(ignored ->
                                    log.info("Cierre automatico de jornada para empleado {}", empleadoId));
                });
    }
}
