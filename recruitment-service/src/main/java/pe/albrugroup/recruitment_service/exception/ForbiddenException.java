package pe.albrugroup.recruitment_service.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenException extends BusinessException {

    public ForbiddenException(String message, Object id, Object details) {
        super(HttpStatus.FORBIDDEN, id, details, message);
    }

    public ForbiddenException(String message, Object id) {
        super(HttpStatus.FORBIDDEN, id, message);
    }

    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, message);
    }
}
