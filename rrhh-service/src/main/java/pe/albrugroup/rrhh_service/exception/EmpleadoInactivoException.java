package pe.albrugroup.rrhh_service.exception;

import org.springframework.http.HttpStatus;

public class EmpleadoInactivoException extends BusinessException {
    public EmpleadoInactivoException(Long idEmpleado) {
        super(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Empleado se encuentra Inactivo",
                idEmpleado
        );
    }
}
