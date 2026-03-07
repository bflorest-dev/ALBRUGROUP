package pe.albrugroup.lead_service.exception;

import org.springframework.http.HttpStatus;

public class SubtipificacionPadreInactivoException extends BusinessException {

    public SubtipificacionPadreInactivoException(Long idSubtipificacion, Long idTipificacion) {
        super(
                HttpStatus.BAD_REQUEST,
                "No se puede activar una subtipificacion cuando su tipificacion esta inactiva",
                idSubtipificacion,
                idTipificacion
        );
    }
}
