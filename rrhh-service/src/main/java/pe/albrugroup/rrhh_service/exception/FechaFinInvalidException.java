package pe.albrugroup.rrhh_service.exception;

public class FechaFinInvalidException extends RuntimeException {
    public FechaFinInvalidException() {
        super("Fecha de Cese, no puede ser anterior a la Fecha de contratacion");
    }
}
