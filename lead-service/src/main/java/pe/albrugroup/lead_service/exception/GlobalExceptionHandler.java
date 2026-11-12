package pe.albrugroup.lead_service.exception;

import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final Pattern CONSTRAINT_PATTERN = Pattern.compile("constraint \\\"([^\\\"]+)\\\"", Pattern.CASE_INSENSITIVE);
    private static final Pattern TABLE_PATTERN = Pattern.compile("(?:relation|table) \\\"([^\\\"]+)\\\"", Pattern.CASE_INSENSITIVE);
    private static final Pattern COLUMN_PATTERN = Pattern.compile("column \\\"([^\\\"]+)\\\"", Pattern.CASE_INSENSITIVE);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, Object>> handleBusinessException(BusinessException e) {
        log.warn("BusinessException {}: {}", e.getStatus().value(), e.getMessage());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", e.getStatus().value());
        body.put("error", e.getStatus().getReasonPhrase());
        body.put("message", e.getMessage());
        if (e.getId() != null) {
            body.put("id", e.getId());
        }
        if (e.getDetails() != null) {
            body.put("details", e.getDetails());
        }
        return ResponseEntity.status(e.getStatus()).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException e) {
        List<String> details = e.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(DefaultMessageSourceResolvable::getDefaultMessage)
                .toList();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", HttpStatus.BAD_REQUEST.getReasonPhrase());
        body.put("message", "Campos invalidos en la solicitud");
        body.put("details", details);
        return ResponseEntity.badRequest().body(body);
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

    @ExceptionHandler({MethodArgumentTypeMismatchException.class, HttpMessageNotReadableException.class})
    public ResponseEntity<Map<String, Object>> handleBadRequest(Exception e) {
        return ResponseEntity.badRequest().body(Map.of(
                "status", HttpStatus.BAD_REQUEST.value(),
                "error", HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "message", "Parametros invalidos"
        ));
    }

    @ExceptionHandler({NoHandlerFoundException.class, NoResourceFoundException.class})
    public ResponseEntity<Map<String, Object>> handleNotFound(Exception e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "status", HttpStatus.NOT_FOUND.value(),
                "error", HttpStatus.NOT_FOUND.getReasonPhrase(),
                "message", "Endpoint no existe"
        ));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethodNotAllowed(HttpRequestMethodNotSupportedException e) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(Map.of(
                "status", HttpStatus.METHOD_NOT_ALLOWED.value(),
                "error", HttpStatus.METHOD_NOT_ALLOWED.getReasonPhrase(),
                "message", e.getMessage()
        ));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(DataIntegrityViolationException e) {
        IntegrityCause cause = describeIntegrityCause(e);
        log.warn(
                "Conflicto de integridad de datos. constraint={}, table={}, column={}",
                cause.constraint(), cause.table(), cause.column(), e);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.CONFLICT.value());
        body.put("error", HttpStatus.CONFLICT.getReasonPhrase());
        body.put("code", "DATA_INTEGRITY_VIOLATION");
        body.put("message", "No se pudo guardar la operacion porque la base de datos rechazo uno de los datos");
        body.put("details", List.of(cause.userMessage()));
        if (cause.constraint() != null) {
            body.put("constraint", cause.constraint());
        }
        if (cause.table() != null) {
            body.put("table", cause.table());
        }
        if (cause.column() != null) {
            body.put("column", cause.column());
        }
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    private IntegrityCause describeIntegrityCause(DataIntegrityViolationException exception) {
        String constraint = null;
        String table = null;
        String column = null;

        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            if (cause instanceof org.hibernate.exception.ConstraintViolationException hibernateException
                    && hibernateException.getConstraintName() != null) {
                constraint = hibernateException.getConstraintName();
            }
            constraint = firstNonBlank(constraint, findQuotedValue(cause.getMessage(), CONSTRAINT_PATTERN));
            table = firstNonBlank(table, findQuotedValue(cause.getMessage(), TABLE_PATTERN));
            column = firstNonBlank(column, findQuotedValue(cause.getMessage(), COLUMN_PATTERN));
        }

        return new IntegrityCause(
                constraint,
                table,
                column,
                humanizeIntegrityCause(constraint, table, column)
        );
    }

    private String humanizeIntegrityCause(String constraint, String table, String column) {
        if (constraint != null) {
            return switch (constraint) {
                case "uk_lead_etapa" ->
                        "El historial de este lead ya tiene registrada esta etapa. Puede haberse enviado la tipificacion dos veces al mismo tiempo; recarga el lead e intenta una sola vez.";
                case "lead_seguimiento_id_lead_key" ->
                        "El seguimiento de este lead ya existe y la operacion intento crearlo nuevamente. Recarga el lead e intenta una sola vez.";
                case "chk_lead_identificador_minimo" ->
                        "El lead no tiene un identificador minimo valido: debe tener usermeta o prefijo y numero de lead.";
                case "chk_lead_numero_para_llamar_formato" ->
                        "El numero para llamar no tiene un formato valido: debe comenzar en 9 y tener 9 digitos.";
                case "fk_lead_origen" ->
                        "El origen asociado al lead ya no existe o no es valido.";
                case "lead_id_campana_fkey" ->
                        "La campana asociada al lead ya no existe o no es valida.";
                case "lead_id_contacto_fkey" ->
                        "El contacto asociado al lead ya no existe o no es valido.";
                case "lead_id_datos_preventa_fkey" ->
                        "Los datos de preventa asociados al lead ya no existen o no son validos.";
                case "lead_id_direccion_fkey" ->
                        "La direccion asociada al lead ya no existe o no es valida.";
                case "lead_id_plan_fkey" ->
                        "El plan asociado al lead ya no existe o no es valido.";
                case "lead_id_plataforma_digital_ofrecida_fkey" ->
                        "La plataforma digital ofrecida ya no existe o no es valida.";
                case "lead_id_proveedor_fkey", "lead_id_proveedor_origen_fkey" ->
                        "El proveedor asociado al lead ya no existe o no es valido.";
                case "lead_id_zona_fkey" ->
                        "La zona asociada al lead ya no existe o no es valida.";
                case "lead_seguimiento_id_lead_fkey" ->
                        "No se encontro el lead al intentar guardar su seguimiento.";
                default -> "La base de datos rechazo la operacion por la restriccion " + constraint + ".";
            };
        }

        if (table != null && column != null) {
            return "La base de datos rechazo el campo " + column + " de la tabla " + table + ". Revisa los datos del lead e intenta nuevamente.";
        }
        if (table != null) {
            return "La base de datos rechazo un dato de la tabla " + table + ". Revisa los datos del lead e intenta nuevamente.";
        }
        return "La base de datos rechazo la operacion, pero no devolvio el detalle de la restriccion. Revisa los datos del lead e intenta nuevamente.";
    }

    private String findQuotedValue(String message, Pattern pattern) {
        if (message == null) {
            return null;
        }
        Matcher matcher = pattern.matcher(message);
        return matcher.find() ? matcher.group(1) : null;
    }

    private String firstNonBlank(String current, String candidate) {
        return current != null && !current.isBlank() ? current
                : candidate != null && !candidate.isBlank() ? candidate
                : null;
    }

    private record IntegrityCause(String constraint, String table, String column, String userMessage) {
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "status", HttpStatus.FORBIDDEN.value(),
                "error", HttpStatus.FORBIDDEN.getReasonPhrase(),
                "message", "No tienes permisos para realizar esta accion"
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception e) {
        log.error("Error inesperado no controlado", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "status", HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "error", HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                "message", "Ocurrio un error inesperado"
        ));
    }
}
