package pe.albrugroup.rrhh_service.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public abstract class BusinessException extends RuntimeException {

    private final HttpStatus status;
    private final Object id;
    private final Object details;

    protected BusinessException(HttpStatus status, String message, Object id, Object details) {
        super(message);
        this.status = status;
        this.id = id;
        this.details = details;
    }
    protected BusinessException(HttpStatus status, String message, Object id) {
        this(status, message, id, null);
    }
    protected BusinessException(HttpStatus status, String message) {
        this(status, message, null, null);
    }
}
