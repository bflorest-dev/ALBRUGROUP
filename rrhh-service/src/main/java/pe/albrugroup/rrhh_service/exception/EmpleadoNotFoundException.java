package pe.albrugroup.rrhh_service.exception;

import org.springframework.http.HttpStatus;

public class EmpleadoNotFoundException extends BusinessException {
    public EmpleadoNotFoundException(Long idEmpleado) {
        super(
                HttpStatus.NOT_FOUND,
                "Empleado no existe",
                idEmpleado
        );
    }
}
