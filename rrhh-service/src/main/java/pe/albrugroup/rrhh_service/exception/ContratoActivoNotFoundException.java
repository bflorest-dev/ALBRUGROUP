package pe.albrugroup.rrhh_service.exception;

import org.springframework.http.HttpStatus;

public class ContratoActivoNotFoundException extends BusinessException {
    public ContratoActivoNotFoundException(Long idEmpleado) {
        super(
                HttpStatus.NOT_FOUND,
                "Empleado no cuenta con un Contrato Vigente",
                idEmpleado
        );
    }
}
