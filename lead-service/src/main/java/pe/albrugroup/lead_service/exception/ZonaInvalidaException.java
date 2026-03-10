package pe.albrugroup.lead_service.exception;

import org.springframework.http.HttpStatus;

public class ZonaInvalidaException extends BusinessException {

    public ZonaInvalidaException(String mensaje, Object details) {
        super(HttpStatus.BAD_REQUEST, mensaje, null, details);
    }
}
