package pe.albrugroup.recruitment_service.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedException extends BussinessException {

    public UnauthorizedException(String message, Object id, Object details) {
        super(HttpStatus.UNAUTHORIZED, id, details, message);
    }

    public UnauthorizedException(String message, Object id) {
        super(HttpStatus.UNAUTHORIZED, id, message);
    }

    public UnauthorizedException(String message) {
        super(HttpStatus.UNAUTHORIZED, message);
    }
}
