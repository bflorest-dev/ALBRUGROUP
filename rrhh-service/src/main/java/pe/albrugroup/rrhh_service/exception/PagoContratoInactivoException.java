package pe.albrugroup.rrhh_service.exception;

import org.springframework.http.HttpStatus;

public class PagoContratoInactivoException extends BusinessException {
    public PagoContratoInactivoException(Long idContrato) {
        super(
                HttpStatus.CONFLICT,
                "No se puede pagar el Contrato de un Empleado Inactivo"
        );
    }
}
