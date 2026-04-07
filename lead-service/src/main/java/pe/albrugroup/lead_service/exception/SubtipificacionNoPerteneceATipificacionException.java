package pe.albrugroup.lead_service.exception;

public class SubtipificacionNoPerteneceATipificacionException extends BadRequestException {

    public SubtipificacionNoPerteneceATipificacionException(Long idSubtipificacion, Long idTipificacion) {
        super("La subtipificacion no pertenece a la tipificacion indicada", idSubtipificacion, idTipificacion);
    }
}
