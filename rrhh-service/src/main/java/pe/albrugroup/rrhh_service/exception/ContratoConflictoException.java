package pe.albrugroup.rrhh_service.exception;

import org.springframework.http.HttpStatus;

public class ContratoConflictoException extends BusinessException{
    public ContratoConflictoException(String message) {
        super(
                HttpStatus.CONFLICT,
                message
        );
    }
}
