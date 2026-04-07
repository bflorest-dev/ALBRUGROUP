package pe.albrugroup.lead_service.exception;

import org.springframework.http.HttpStatus;

public class ConflictException extends BusinessException {

    public ConflictException(String message, Object id, Object details) {
        super(HttpStatus.CONFLICT, message, id, details);
    }

    public ConflictException(String message, Object id) {
        super(HttpStatus.CONFLICT, message, id);
    }

    public ConflictException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
