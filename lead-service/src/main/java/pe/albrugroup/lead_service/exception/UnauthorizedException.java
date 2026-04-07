package pe.albrugroup.lead_service.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedException extends BusinessException {

    public UnauthorizedException(String message, Object id, Object details) {
        super(HttpStatus.UNAUTHORIZED, message, id, details);
    }

    public UnauthorizedException(String message, Object id) {
        super(HttpStatus.UNAUTHORIZED, message, id);
    }

    public UnauthorizedException(String message) {
        super(HttpStatus.UNAUTHORIZED, message);
    }
}
