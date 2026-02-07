package pe.albrugroup.rrhh_service.exception;

public class EmpleadoPostulanteException extends RuntimeException{
    public EmpleadoPostulanteException(Long idEmpleado){
        super("Posulante["+ idEmpleado +"] aun no es empleado");
    }
}
