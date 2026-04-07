package pe.albrugroup.recruitment_service.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public abstract class BusinessException extends RuntimeException {

    private final HttpStatus status;
    private final Object id;
    private final Object details;

    protected BusinessException(HttpStatus status, Object id, Object details, String message) {
        super(message);
        this.status = status;
        this.id = id;
        this.details = details;
    }

    protected BusinessException(HttpStatus status, Object id, String message) {
        this(status, id, null, message);
    }

    protected BusinessException(HttpStatus status, String message) {
        this(status, null, null, message);
    }

    protected BusinessException(HttpStatus status, Object id, Object details, String message, Throwable cause) {
        super(message, cause);
        this.status = status;
        this.id = id;
        this.details = details;
    }
}
