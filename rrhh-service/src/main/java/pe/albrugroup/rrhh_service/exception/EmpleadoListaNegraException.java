package pe.albrugroup.rrhh_service.exception;

import org.springframework.http.HttpStatus;

public class EmpleadoListaNegraException  extends BusinessException {
    public EmpleadoListaNegraException(Long idEmpleado) {
        super(
                HttpStatus.NOT_ACCEPTABLE,
                "Se encuentra en la Lista Negra",
                idEmpleado
        );
    }
}
