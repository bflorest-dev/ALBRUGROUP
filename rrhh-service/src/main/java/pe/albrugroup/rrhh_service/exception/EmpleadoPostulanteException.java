package pe.albrugroup.rrhh_service.exception;

import org.springframework.http.HttpStatus;

public class EmpleadoPostulanteException extends BusinessException{
    public EmpleadoPostulanteException(Long idEmpleado){
        super(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Posulante aun no es empleado",
                idEmpleado
        );
    }
}
