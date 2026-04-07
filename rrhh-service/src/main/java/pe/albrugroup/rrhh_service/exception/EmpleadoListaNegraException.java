package pe.albrugroup.rrhh_service.exception;

public class EmpleadoListaNegraException  extends UnprocessableEntityException {
    public EmpleadoListaNegraException(Long idEmpleado) {
        super("Se encuentra en la Lista Negra", idEmpleado);
    }
}
