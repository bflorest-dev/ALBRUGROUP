package pe.albrugroup.rrhh_service.exception;

import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    // EXCEPTIONS PERSONALIZADAS
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String,Object>> handleBusinessException(BusinessException e) {
        Map<String,Object> body = new LinkedHashMap<>();

        body.put("status", e.getStatus().value());
        body.put("error", e.getStatus().getReasonPhrase());
        body.put("message", e.getMessage());
        if(e.getId() != null) body.put("id", e.getId());
        if(e.getDetails() != null) body.put("details", e.getDetails());

        return ResponseEntity.status(e.getStatus()).body(body);
    }
    // CAMPOS INVALIDOS EN REQUESTS
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException e) {
        Map<String, Object> errors = new LinkedHashMap<>();
        List<String> message = e.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(DefaultMessageSourceResolvable::getDefaultMessage)
                .toList();

        errors.put("status", HttpStatus.BAD_REQUEST.value());
        errors.put("error", "Bad Request");
        errors.put("message", "Campos Invalidos en la solicitud");
        errors.put("details", message);

        return ResponseEntity.badRequest().body(errors);
    }

    // PARAMETROS INVALIDOS EN LOS ENDPOINTS
    @ExceptionHandler({MethodArgumentTypeMismatchException.class, HttpMessageNotReadableException.class})
    public ResponseEntity<?> handleBadRequest(Exception e) {
        return ResponseEntity.badRequest().body(Map.of(
                "status", 400,
                "error", "Bad Request",
                "message", "Parámetros inválidos"
        ));
    }
    // ENDPOINTS INEXISTENTES(404)
    @ExceptionHandler({NoHandlerFoundException.class, NoResourceFoundException.class})
    public ResponseEntity<Map<String, Object>> handleNotFound(Exception e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "status", 404,
                "error", "Not Found",
                "message", "Endpoint no existe"
        ));
    }

    // METODO HTTP INCORRECTO(405)
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethodNotAllowed(HttpRequestMethodNotSupportedException e) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(Map.of(
                "status", 405,
                "error", "Method Not Allowed",
                "message", e.getMessage()
        ));
    }

    // VIOLACIONES DE INTEGRIDAD (UNIQUE CONSTRAINTS, FK, etc)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(DataIntegrityViolationException e) {
        Map<String, Object> body = new LinkedHashMap<>();

        // Mapa de constraints a mensajes amigables
        Map<String, String> constraintMessages = Map.of(
                "UK_EMPLEADO_NUMERO_DOCUMENTO", "El número de documento ya está registrado",
                "UK_EMPLEADO_CELULAR_PERSONAL", "El celular personal ya está registrado",
                "UK_EMPLEADO_CORREO_PERSONAL", "El correo personal ya está registrado"
                // Aquí puedes agregar más constraints de otras entidades
        );

        String message = "Ya existe un registro con estos datos";
        String errorMsg = e.getMostSpecificCause().getMessage();

        // Buscar qué constraint fue violado
        if (errorMsg != null) {
            message = constraintMessages.entrySet().stream()
                    .filter(entry -> errorMsg.contains(entry.getKey()))
                    .map(Map.Entry::getValue)
                    .findFirst()
                    .orElse(message);
        }

        body.put("status", HttpStatus.CONFLICT.value());
        body.put("error", "Conflict");
        body.put("message", message);

        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    // CATCH-ALL - Exceptions No Mapeados
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "status", 500,
                "error", "Internal Server Error",
                "message", "Ocurrió un error inesperado"
        ));
    }
}

