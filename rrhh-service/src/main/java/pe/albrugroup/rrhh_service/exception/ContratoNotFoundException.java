package pe.albrugroup.rrhh_service.exception;

import org.springframework.http.HttpStatus;

public class ContratoNotFoundException extends BusinessException {

    public ContratoNotFoundException(Long idEmpleado) {
        super(
                HttpStatus.NOT_FOUND,
                "Empleado no tiene ningun Contrato",
                idEmpleado
        );
    }
}
