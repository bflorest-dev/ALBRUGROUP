package pe.albrugroup.lead_service.exception;

import org.springframework.http.HttpStatus;

public class SubtipificacionNotFoundException extends BusinessException {

    public SubtipificacionNotFoundException(Long idSubtipificacion) {
        super(
                HttpStatus.NOT_FOUND,
                "Subtipificacion no encontrada",
                idSubtipificacion
        );
    }
}
