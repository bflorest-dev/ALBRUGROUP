package pe.albrugroup.recruitment_service.exception;

import org.springframework.http.HttpStatus;

public class BadRequestException extends BusinessException {

    public BadRequestException(String message, Object id, Object details) {
        super(HttpStatus.BAD_REQUEST, id, details, message);
    }

    public BadRequestException(String message, Object id) {
        super(HttpStatus.BAD_REQUEST, id, message);
    }

    public BadRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
