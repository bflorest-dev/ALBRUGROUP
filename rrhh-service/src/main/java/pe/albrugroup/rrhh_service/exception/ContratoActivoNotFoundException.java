package pe.albrugroup.rrhh_service.exception;

public class ContratoActivoNotFoundException extends RuntimeException {
    public ContratoActivoNotFoundException(Long idEmpleado) {
        super("Empleado[" + idEmpleado + "] no tiene un contrato ACTIVO");
    }
}
