package pe.albrugroup.lead_service.exception;

import org.springframework.http.HttpStatus;

public class CatalogoEstadoInvalidoException extends BusinessException {

    public CatalogoEstadoInvalidoException(String mensaje, Object details) {
        super(
                HttpStatus.BAD_REQUEST,
                mensaje,
                null,
                details
        );
    }
}
