package pe.albrugroup.rrhh_service.exception;

import org.springframework.http.HttpStatus;

public class FechaFinInvalidException extends BusinessException {
    public FechaFinInvalidException() {
        super(
                HttpStatus.BAD_REQUEST,
                "Fecha de Cese, no puede ser anterior a la Fecha de contratacion"
        );
    }
}
