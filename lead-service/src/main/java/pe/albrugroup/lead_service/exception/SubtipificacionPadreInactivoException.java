package pe.albrugroup.lead_service.exception;

public class SubtipificacionPadreInactivoException extends BadRequestException {

    public SubtipificacionPadreInactivoException(Long idSubtipificacion, Long idTipificacion) {
        super("No se puede activar una subtipificacion cuando su tipificacion esta inactiva", idSubtipificacion, idTipificacion);
    }
}
