package pe.albrugroup.call_service.controller.test;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.call_service.asterisk.ami.AmiClient;
import pe.albrugroup.call_service.entity.enums.EstadoAgente;

import java.util.Map;

/**
 * Endpoint mock de Fase 1 para simular cambios de presencia que en Fase 2
 * vendran desde auth-service/rrhh-service.
 *
 * Traduce el EstadoAgente del negocio a pause/unpause en la cola de Asterisk.
 */
@RestController
@RequestMapping("/test/agents")
@RequiredArgsConstructor
@Slf4j
public class TestPresenceController {

    private final AmiClient amiClient;

    @PostMapping("/{extension}/presence")
    public Map<String, Object> setPresence(
            @PathVariable String extension,
            @RequestBody PresenceRequest req) {

        boolean pause = req.getEstado() != EstadoAgente.AVAILABLE;
        String memberInterface = "PJSIP/" + extension;
        String reason = req.getEstado().name();

        // Para Fase 1 usamos una sola cola fija; en Fase 2 esto sera parametrico.
        String queue = req.getQueue() != null ? req.getQueue() : "cola-ventas";

        amiClient.setQueuePause(queue, memberInterface, pause, reason);
        log.info("Presencia {} -> {} en cola {} (paused={})", extension, req.getEstado(), queue, pause);

        return Map.of(
                "extension", extension,
                "queue", queue,
                "estado", req.getEstado(),
                "paused", pause
        );
    }

    @Data
    public static class PresenceRequest {
        private EstadoAgente estado;
        private String queue;
    }
}
