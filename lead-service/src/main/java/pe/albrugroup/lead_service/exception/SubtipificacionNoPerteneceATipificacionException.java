package pe.albrugroup.lead_service.exception;

import org.springframework.http.HttpStatus;

public class SubtipificacionNoPerteneceATipificacionException extends BusinessException {

    public SubtipificacionNoPerteneceATipificacionException(Long idSubtipificacion, Long idTipificacion) {
        super(
                HttpStatus.BAD_REQUEST,
                "La subtipificacion no pertenece a la tipificacion indicada",
                idSubtipificacion,
                idTipificacion
        );
    }
}
