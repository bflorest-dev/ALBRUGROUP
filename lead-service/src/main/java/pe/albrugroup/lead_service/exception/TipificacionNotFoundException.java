package pe.albrugroup.lead_service.exception;

import org.springframework.http.HttpStatus;

public class TipificacionNotFoundException extends BusinessException {

    public TipificacionNotFoundException(Long idTipificacion) {
        super(
                HttpStatus.NOT_FOUND,
                "Tipificacion no encontrada",
                idTipificacion
        );
    }
}
