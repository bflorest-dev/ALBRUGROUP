package pe.albrugroup.rrhh_service.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenException extends BusinessException {

    public ForbiddenException(String message, Object id, Object details) {
        super(HttpStatus.FORBIDDEN, message, id, details);
    }

    public ForbiddenException(String message, Object id) {
        super(HttpStatus.FORBIDDEN, message, id);
    }

    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, message);
    }
}
