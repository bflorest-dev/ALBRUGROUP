package pe.albrugroup.lead_service.exception;

public class ZonaInvalidaException extends BadRequestException {

    public ZonaInvalidaException(String mensaje, Object details) {
        super(mensaje, null, details);
    }
}
