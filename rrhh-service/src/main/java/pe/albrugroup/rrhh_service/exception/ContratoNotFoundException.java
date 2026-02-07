package pe.albrugroup.rrhh_service.exception;

public class ContratoNotFoundException extends RuntimeException {

    public ContratoNotFoundException(Long idEmpleado) {
        super("Empleado[" + idEmpleado + "] no tiene un contrato ACTIVO");
    }
}
