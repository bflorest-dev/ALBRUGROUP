package pe.albrugroup.rrhh_service.exception;

import java.util.List;

public class EmpleadoIncompletoException extends UnprocessableEntityException {
    public EmpleadoIncompletoException(Long idEmpleado, List<String> faltantes) {
        super("Empleado tiene datos incompletos", idEmpleado, faltantes);
    }
}
