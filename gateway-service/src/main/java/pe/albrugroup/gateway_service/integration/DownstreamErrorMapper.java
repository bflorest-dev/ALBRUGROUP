package pe.albrugroup.gateway_service.integration;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import pe.albrugroup.gateway_service.exception.IntegrationHttpException;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
public class DownstreamErrorMapper {

    private final ObjectMapper objectMapper;

    public DownstreamErrorMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Mono<? extends Throwable> toException(HttpStatusCode status, String body, String fallbackMessage) {
        Map<String, Object> parsed = parseBody(body);
        String message = extractMessage(parsed, fallbackMessage, status);
        Object details = parsed.get("details");
        return Mono.just(new IntegrationHttpException(status, message, details));
    }

    private Map<String, Object> parseBody(String body) {
        if (body == null || body.isBlank()) {
            return Map.of();
        }

        try {
            return objectMapper.readValue(body, new TypeReference<>() {});
        } catch (Exception e) {
            return Map.of("rawBody", body);
        }
    }

    private String extractMessage(Map<String, Object> parsed, String fallbackMessage, HttpStatusCode statusCode) {
        Object message = parsed.get("message");
        if (message instanceof String text && !text.isBlank()) {
            return text;
        }
        if (fallbackMessage != null && !fallbackMessage.isBlank()) {
            return fallbackMessage;
        }
        HttpStatus status = HttpStatus.valueOf(statusCode.value());
        return switch (status) {
            case BAD_REQUEST -> "Parametros invalidos";
            case UNAUTHORIZED -> "No autenticado o token invalido";
            case FORBIDDEN -> "No tiene permisos para realizar esta accion";
            case NOT_FOUND -> "Recurso no encontrado";
            default -> "Ocurrio un error al consultar un servicio integrado";
        };
    }
}
