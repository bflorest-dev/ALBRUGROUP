package pe.albrugroup.recruitment_service.exception;

import org.springframework.http.HttpStatus;

public class UnprocessableEntityException extends BussinessException {

    public UnprocessableEntityException(String message, Object id, Object details) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, id, details, message);
    }

    public UnprocessableEntityException(String message, Object id) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, id, message);
    }

    public UnprocessableEntityException(String message) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, message);
    }
}
