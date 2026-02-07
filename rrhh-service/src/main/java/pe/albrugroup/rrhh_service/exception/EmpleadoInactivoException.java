package pe.albrugroup.rrhh_service.exception;

public class EmpleadoInactivoException extends RuntimeException {
    public EmpleadoInactivoException(Long idEmpleado) {
        super("Empleado[" + idEmpleado + "] se encuentra inactivo");
    }
}
