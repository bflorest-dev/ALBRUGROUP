package pe.albrugroup.gateway_service.presence;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.CloseStatus;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;
import org.springframework.web.util.UriComponentsBuilder;
import pe.albrugroup.gateway_service.security.JwtUtil;
import reactor.core.publisher.Mono;

@Component
public class PresenceRealtimeWebSocketHandler implements WebSocketHandler {

    private static final CloseStatus UNAUTHORIZED_CLOSE_STATUS = CloseStatus.POLICY_VIOLATION;

    private final PresenceRealtimeBroadcaster broadcaster;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;

    public PresenceRealtimeWebSocketHandler(
            PresenceRealtimeBroadcaster broadcaster,
            JwtUtil jwtUtil,
            ObjectMapper objectMapper
    ) {
        this.broadcaster = broadcaster;
        this.jwtUtil = jwtUtil;
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        String token = UriComponentsBuilder.fromUri(session.getHandshakeInfo().getUri())
                .build()
                .getQueryParams()
                .getFirst("access_token");

        if (token == null || token.isBlank()) {
            return session.close(UNAUTHORIZED_CLOSE_STATUS);
        }

        if (!jwtUtil.validateToken(token)) {
            return session.close(UNAUTHORIZED_CLOSE_STATUS);
        }

        return session.send(
                broadcaster.stream()
                        .map(this::writeEvent)
                        .map(session::textMessage)
        );
    }

    private String writeEvent(PresenceRealtimeEvent event) {
        try {
            return objectMapper.writeValueAsString(event);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("No se pudo serializar el evento realtime de presencia", e);
        }
    }
}
