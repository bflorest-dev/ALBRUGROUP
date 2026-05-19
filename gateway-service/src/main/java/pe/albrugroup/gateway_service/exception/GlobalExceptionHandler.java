package pe.albrugroup.gateway_service.exception;

import org.springframework.core.codec.DecodingException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebInputException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IntegrationHttpException.class)
    public ResponseEntity<Map<String, Object>> handleIntegrationHttpException(IntegrationHttpException e) {
        Map<String, Object> body = baseBody(e.getStatus(), e.getMessage());
        if (e.getDetails() != null) {
            body.put("details", e.getDetails());
        }
        return ResponseEntity.status(e.getStatus()).body(body);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException e) {
        HttpStatus status = HttpStatus.valueOf(e.getStatusCode().value());
        return ResponseEntity.status(status).body(baseBody(status, resolveMessage(e.getReason(), status)));
    }

    @ExceptionHandler({ServerWebInputException.class, DecodingException.class})
    public ResponseEntity<Map<String, Object>> handleBadInput(Exception e) {
        return ResponseEntity.badRequest().body(baseBody(HttpStatus.BAD_REQUEST, "Parametros invalidos"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(baseBody(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrio un error inesperado"));
    }

    private Map<String, Object> baseBody(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return body;
    }

    private String resolveMessage(String reason, HttpStatus status) {
        if (reason != null && !reason.isBlank()) {
            return reason;
        }
        return switch (status) {
            case BAD_REQUEST -> "Parametros invalidos";
            case UNAUTHORIZED -> "No autenticado o token invalido";
            case FORBIDDEN -> "No tiene permisos para realizar esta accion";
            case NOT_FOUND -> "Recurso no encontrado";
            default -> status.getReasonPhrase();
        };
    }
}
