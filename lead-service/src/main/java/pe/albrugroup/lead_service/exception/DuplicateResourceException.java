package pe.albrugroup.lead_service.exception;

import org.springframework.http.HttpStatus;

public class DuplicateResourceException extends BusinessException {

    public DuplicateResourceException(String message, Object details) {
        super(HttpStatus.CONFLICT, message, null, details);
    }
}
