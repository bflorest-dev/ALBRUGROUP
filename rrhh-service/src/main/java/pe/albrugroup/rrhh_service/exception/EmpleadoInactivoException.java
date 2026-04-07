package pe.albrugroup.rrhh_service.exception;

public class EmpleadoInactivoException extends UnprocessableEntityException {
    public EmpleadoInactivoException(Long idEmpleado) {
        super("Empleado se encuentra Inactivo", idEmpleado);
    }
}
