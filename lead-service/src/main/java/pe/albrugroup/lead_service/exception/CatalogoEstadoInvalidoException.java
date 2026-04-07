package pe.albrugroup.lead_service.exception;

public class CatalogoEstadoInvalidoException extends BadRequestException {

    public CatalogoEstadoInvalidoException(String mensaje, Object details) {
        super(mensaje, null, details);
    }
}
