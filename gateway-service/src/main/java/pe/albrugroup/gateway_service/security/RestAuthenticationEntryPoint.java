package pe.albrugroup.gateway_service.security;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements ServerAuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public Mono<Void> commence(ServerWebExchange exchange, AuthenticationException ex) {
        return writeJson(exchange, HttpStatus.UNAUTHORIZED, "No autenticado o token invalido");
    }

    Mono<Void> writeJson(ServerWebExchange exchange, HttpStatus status, String message) {
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        applyCorsHeaders(exchange);

        byte[] body = toJsonBytes(status, message);
        DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(body);
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    private void applyCorsHeaders(ServerWebExchange exchange) {
        String origin = exchange.getRequest().getHeaders().getFirst(HttpHeaders.ORIGIN);

        if (origin == null || origin.isBlank()) {
            return;
        }

        exchange.getResponse().getHeaders().set(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, origin);
        exchange.getResponse().getHeaders().set(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true");
        exchange.getResponse().getHeaders().add(HttpHeaders.VARY, HttpHeaders.ORIGIN);
    }

    private byte[] toJsonBytes(HttpStatus status, String message) {
        try {
            return objectMapper.writeValueAsBytes(Map.of(
                    "status", status.value(),
                    "error", status.getReasonPhrase(),
                    "message", message
            ));
        } catch (JsonProcessingException e) {
            String fallback = "{\"status\":" + status.value() + ",\"error\":\"" + status.getReasonPhrase()
                    + "\",\"message\":\"" + message + "\"}";
            return fallback.getBytes(StandardCharsets.UTF_8);
        }
    }
}
