package pe.albrugroup.rrhh_service.exception;

public class EmpleadoNotFoundException extends RuntimeException {

    public EmpleadoNotFoundException(Long idEmpleado) {
        super("Empleado[" + idEmpleado +"] no encontrado");
    }
}
