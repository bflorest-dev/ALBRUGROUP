package pe.albrugroup.recruitment_service.exception;

import org.springframework.http.HttpStatus;

public class ConflictException extends BusinessException {

    public ConflictException(String message, Object id, Object details) {
        super(HttpStatus.CONFLICT, id, details, message);
    }

    public ConflictException(String message, Object id) {
        super(HttpStatus.CONFLICT, id, message);
    }

    public ConflictException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
