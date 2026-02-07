package pe.albrugroup.rrhh_service.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ========= Helpers =========

    private ResponseEntity<Map<String, Object>> build(HttpStatus status,
                                                      String error,
                                                      String message,
                                                      HttpServletRequest request,
                                                      Map<String, Object> extra) {

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);
        body.put("path", request.getRequestURI());

        if (extra != null && !extra.isEmpty()) {
            body.putAll(extra);
        }
        return ResponseEntity.status(status).body(body);
    }

    // ========= Custom exceptions (tuyas) =========

    @ExceptionHandler(EmpleadoNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleEmpleadoNotFound(EmpleadoNotFoundException ex,
                                                                      HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage(), request, null);
    }

    @ExceptionHandler(EmpleadoInactivoException.class)
    public ResponseEntity<Map<String, Object>> handleEmpleadoInactivo(EmpleadoInactivoException ex,
                                                                      HttpServletRequest request) {
        // Suele ser conflicto de estado de negocio
        return build(HttpStatus.CONFLICT, "CONFLICT", ex.getMessage(), request, null);
    }

    // Si tienes más custom exceptions, puedes agregarlas igual (o agruparlas si comparten status).
    // Ejemplo (si todas fueran “reglas de negocio” -> 409):
    // @ExceptionHandler({ OtraException1.class, OtraException2.class })
    // public ResponseEntity<Map<String,Object>> handleBusiness(RuntimeException ex, HttpServletRequest req) { ... }

    // ========= Validaciones (si usas @Valid en DTOs) =========

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex,
                                                                HttpServletRequest request) {

        Map<String, String> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        fe -> fe.getField(),
                        fe -> fe.getDefaultMessage() == null ? "Valor inválido" : fe.getDefaultMessage(),
                        (a, b) -> a // si se repite el campo, te quedas con el primero
                ));

        Map<String, Object> extra = new LinkedHashMap<>();
        extra.put("fields", fieldErrors);

        return build(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "Validación fallida", request, extra);
    }

    // ========= Unique constraint / Integridad =========

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex,
                                                                   HttpServletRequest request) {

        // Ojo: el mensaje exacto depende del driver y DB, pero el nombre del constraint suele aparecer.
        String rootMsg = getRootCauseMessage(ex);

        // Mapea tus constraint names -> mensaje “humano”
        if (rootMsg.contains("uk_empleado_numero_documento")) {
            return build(HttpStatus.CONFLICT, "CONFLICT",
                    "Ya existe un empleado con ese número de documento", request, null);
        }
        if (rootMsg.contains("uk_empleado_celular_personal")) {
            return build(HttpStatus.CONFLICT, "CONFLICT",
                    "Ya existe un empleado con ese celular personal", request, null);
        }
        if (rootMsg.contains("uk_empleado_correo")) {
            return build(HttpStatus.CONFLICT, "CONFLICT",
                    "Ya existe un empleado con ese correo", request, null);
        }

        // Fallback genérico para integridad
        return build(HttpStatus.CONFLICT, "CONFLICT",
                "Violación de integridad de datos", request, Map.of("detail", rootMsg));
    }

    private String getRootCauseMessage(Throwable ex) {
        Throwable root = ex;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        return root.getMessage() == null ? ex.toString() : root.getMessage();
    }

    // ========= Fallback 500 =========

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAny(Exception ex,
                                                         HttpServletRequest request) {

        // En prod: no devuelvas detalles internos; aquí solo devuelvo un mensaje genérico.
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR",
                "Ocurrió un error inesperado", request, null);
    }
}

