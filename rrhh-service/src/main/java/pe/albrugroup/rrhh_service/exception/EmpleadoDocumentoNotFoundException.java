package pe.albrugroup.rrhh_service.exception;

import org.springframework.http.HttpStatus;

public class EmpleadoDocumentoNotFoundException extends BusinessException {
    public EmpleadoDocumentoNotFoundException(String numeroDocumento) {
        super(
                HttpStatus.NOT_FOUND,
                "Empleado no existe",
                numeroDocumento
        );
    }
}
