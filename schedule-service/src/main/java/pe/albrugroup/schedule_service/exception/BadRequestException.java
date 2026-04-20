package pe.albrugroup.schedule_service.exception;

import org.springframework.http.HttpStatus;

public class BadRequestException extends BusinessException {

    public BadRequestException(String message, Object id, Object details) {
        super(HttpStatus.BAD_REQUEST, message, id, details);
    }

    public BadRequestException(String message, Object id) {
        super(HttpStatus.BAD_REQUEST, message, id);
    }

    public BadRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
