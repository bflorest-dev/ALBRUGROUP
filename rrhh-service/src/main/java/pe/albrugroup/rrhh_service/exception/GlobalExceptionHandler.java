package pe.albrugroup.rrhh_service.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
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
import java.util.Optional;

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
    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    public ResponseEntity<Map<String, Object>> handleValidationErrors(Exception e) {
        Map<String, Object> errors = new LinkedHashMap<>();
        var bindingResult = e instanceof MethodArgumentNotValidException methodArgumentNotValidException
                ? methodArgumentNotValidException.getBindingResult()
                : ((BindException) e).getBindingResult();

        List<String> message = bindingResult
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

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException e) {
        List<String> details = e.getConstraintViolations()
                .stream()
                .map(violation -> violation.getMessage())
                .toList();

        return ResponseEntity.badRequest().body(Map.of(
                "status", HttpStatus.BAD_REQUEST.value(),
                "error", HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "message", "Parametros invalidos",
                "details", details
        ));
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
                "uk_empleado_numero_documento", "El numero de documento ingresado ya esta registrado.",
                "uk_empleado_celular_personal", "El celular personal ingresado ya esta registrado.",
                "uk_empleado_correo_personal", "El correo personal ingresado ya esta registrado."
                // Aquí puedes agregar más constraints de otras entidades
        );

        String message = "Ya existe un registro con estos datos";
        String errorMsg = e.getMostSpecificCause().getMessage();
        Optional<String> detail = Optional.empty();

        // Buscar qué constraint fue violado
        if (errorMsg != null) {
            String normalizedError = errorMsg.toLowerCase();
            detail = constraintMessages.entrySet().stream()
                    .filter(entry -> normalizedError.contains(entry.getKey()))
                    .map(Map.Entry::getValue)
                    .findFirst();

            if (detail.isPresent()) {
                message = "No se pudo registrar el empleado porque hay datos repetidos";
            }
        }

        body.put("status", HttpStatus.CONFLICT.value());
        body.put("error", "Conflict");
        body.put("message", message);
        detail.ifPresent(value -> body.put("details", List.of(value)));

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

