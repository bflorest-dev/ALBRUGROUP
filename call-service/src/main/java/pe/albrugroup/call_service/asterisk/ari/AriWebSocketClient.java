package pe.albrugroup.call_service.asterisk.ari;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.client.ReactorNettyWebSocketClient;
import pe.albrugroup.call_service.asterisk.dispatch.EventDispatcher;
import pe.albrugroup.call_service.config.AsteriskProperties;
import reactor.core.Disposable;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Mantiene una conexion WebSocket persistente a /ari/events.
 * Reconecta con backoff exponencial ante caidas.
 * Cada mensaje JSON se entrega a EventDispatcher.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AriWebSocketClient {

    private final AsteriskProperties props;
    private final EventDispatcher dispatcher;
    private final ObjectMapper mapper = new ObjectMapper();

    private final ReactorNettyWebSocketClient wsClient = new ReactorNettyWebSocketClient();
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final AtomicLong currentDelay = new AtomicLong();
    private Disposable subscription;

    @PostConstruct
    public void start() {
        running.set(true);
        currentDelay.set(props.getAri().getReconnectInitialDelayMs());
        connect();
    }

    @PreDestroy
    public void stop() {
        running.set(false);
        if (subscription != null && !subscription.isDisposed()) {
            subscription.dispose();
        }
    }

    private void connect() {
        if (!running.get()) return;

        String app = props.getAri().getAppName();
        String userPass = props.getAri().getUsername() + ":" + props.getAri().getPassword();
        String basic = Base64.getEncoder().encodeToString(userPass.getBytes(StandardCharsets.UTF_8));

        String url = props.getAri().getWsUrl()
                + "?app=" + app
                + "&api_key=" + props.getAri().getUsername() + ":" + props.getAri().getPassword()
                + "&subscribeAll=true";
        URI uri = URI.create(url);

        log.info("Conectando ARI WebSocket a {}", uri);

        subscription = wsClient.execute(uri, session -> session.receive()
                .doOnNext(this::handleMessage)
                .doOnError(e -> log.warn("Error en ARI WS: {}", e.getMessage()))
                .then()
        )
        .doOnSuccess(v -> log.info("ARI WS cerrado limpiamente"))
        .doOnError(e -> log.warn("Falla conectando ARI WS: {}", e.getMessage()))
        .onErrorResume(e -> Mono.empty())
        .doFinally(sig -> scheduleReconnect())
        .subscribe();
    }

    private void handleMessage(WebSocketMessage msg) {
        String payload = msg.getPayloadAsText();
        try {
            Map<String, Object> event = mapper.readValue(payload, Map.class);
            // Reset delay tras recibir trafico exitoso
            currentDelay.set(props.getAri().getReconnectInitialDelayMs());
            dispatcher.onAriEvent(event);
        } catch (Exception e) {
            log.warn("No se pudo parsear evento ARI: {}", e.getMessage());
        }
    }

    private void scheduleReconnect() {
        if (!running.get()) return;
        long delay = currentDelay.get();
        log.info("Reintentando ARI WS en {} ms", delay);
        try {
            Thread.sleep(delay);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }
        // Backoff exponencial acotado
        long next = Math.min(delay * 2, props.getAri().getReconnectMaxDelayMs());
        currentDelay.set(next);
        connect();
    }
}
