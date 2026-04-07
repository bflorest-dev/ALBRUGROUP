package pe.albrugroup.auth_service.exception;

import org.springframework.http.HttpStatus;

public class UnprocessableEntityException extends BusinessException {

    public UnprocessableEntityException(String message, Object id, Object details) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, message, id, details);
    }

    public UnprocessableEntityException(String message, Object id) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, message, id);
    }

    public UnprocessableEntityException(String message) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, message);
    }
}
