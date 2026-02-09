package pe.albrugroup.rrhh_service.exception;

import org.springframework.http.HttpStatus;

import java.util.List;

public class EmpleadoIncompletoException extends BusinessException {
    public EmpleadoIncompletoException(Long idEmpleado, List<String> faltantes) {
        super(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Empleado tiene datos incompletos",
                idEmpleado, faltantes
        );
    }
}
